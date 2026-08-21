import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EnrollmentService {
  constructor(private prisma: PrismaService) {}

  async create(d: {
  studentId: string;
  sectionId: string;
  periodId: string;
  paymentPlanId: string;
}): Promise<any> {
  // Validar que exista todo
  const [student, section, period, plan] = await Promise.all([
      this.prisma.person.findUnique({ where: { id: d.studentId } }),
      this.prisma.section.findUnique({ where: { id: d.sectionId } }),
      this.prisma.period.findUnique({ where: { id: d.periodId } }),
      this.prisma.paymentPlan.findUnique({ where: { id: d.paymentPlanId } }),
    ]);
    if (!student) throw new NotFoundException('Alumno no encontrado');
    if (!section) throw new NotFoundException('Sección no encontrada');
    if (!period) throw new NotFoundException('Período no encontrado');
    if (!plan) throw new NotFoundException('Plan de pago no encontrado');
    if (!plan.isActive) throw new BadRequestException('El plan de pago está inactivo');

    // Validar que no esté ya matriculado en este período
    const existing = await this.prisma.enrollment.findFirst({
      where: { studentId: d.studentId, periodId: d.periodId, status: 'ACTIVE' },
    });
    if (existing) throw new ConflictException('El alumno ya está matriculado en este período');

    // Validar cupo
    const currentCount = await this.prisma.enrollment.count({
      where: { sectionId: d.sectionId, status: 'ACTIVE' },
    });
    if (currentCount >= section.capacity) {
      throw new ConflictException(`La sección está llena (${currentCount}/${section.capacity})`);
    }

    // Crear matrícula + generar cuotas
    return this.prisma.$transaction(async (tx) => {
      const enrollment = await tx.enrollment.create({
        data: {
          studentId: d.studentId,
          sectionId: d.sectionId,
          periodId: d.periodId,
          status: 'ACTIVE',
        },
      });

      // Generar cuotas
      const installmentAmount = Number(plan.amount) / plan.installments;
      const startDate = new Date();
      
      const paymentsData = Array.from({ length: plan.installments }, (_, i) => {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i);
        dueDate.setDate(1); // primer día de cada mes
        return {
          enrollmentId: enrollment.id,
          paymentPlanId: plan.id,
          installment: i + 1,
          amount: installmentAmount,
          dueDate,
          status: 'PENDING' as const,
        };
      });

      if (paymentsData.length > 0) {
        await tx.payment.createMany({ data: paymentsData });
      }

      return tx.enrollment.findUnique({
        where: { id: enrollment.id },
        include: {
          student: true,
          section: { include: { classroom: { include: { sede: true } }, turno: true } },
          period: true,
          payments: { orderBy: { installment: 'asc' } },
        },
      });
    });
  }

  async list(filters: { periodId?: string; sectionId?: string; status?: string; studentSearch?: string }): Promise<any> {
    const where: any = {};
    if (filters.periodId) where.periodId = filters.periodId;
    if (filters.sectionId) where.sectionId = filters.sectionId;
    if (filters.status) where.status = filters.status;
    if (filters.studentSearch) {
      where.student = {
        OR: [
          { firstName: { contains: filters.studentSearch } },
          { lastName: { contains: filters.studentSearch } },
          { dni: { contains: filters.studentSearch } },
        ],
      };
    }
    return this.prisma.enrollment.findMany({
      where,
      include: {
        student: true,
        section: { include: { classroom: { include: { sede: true } }, turno: true } },
        period: true,
        payments: { orderBy: { installment: 'asc' } },
      },
      orderBy: { enrolledAt: 'desc' },
    });
  }

  async updateStatus(id: string, status: string) {
    const e = await this.prisma.enrollment.findUnique({ where: { id } });
    if (!e) throw new NotFoundException('Matrícula no encontrada');
    return this.prisma.enrollment.update({ where: { id }, data: { status: status as any } });
  }

  async delete(id: string) {
    const e = await this.prisma.enrollment.findUnique({
      where: { id },
      include: { payments: true },
    });
    if (!e) throw new NotFoundException('Matrícula no encontrada');
    const hasPaidPayments = e.payments.some((p) => p.status === 'PAID');
    if (hasPaidPayments) {
      throw new ConflictException('No se puede eliminar: tiene pagos registrados. Usa el estado "retirado".');
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.payment.deleteMany({ where: { enrollmentId: id } });
      return tx.enrollment.delete({ where: { id } });
    });
  }

  // Stats para dashboard
  async getStats(periodId?: string) {
    const where: any = {};
    if (periodId) where.periodId = periodId;

    const [total, active, pendingPayments, overduePayments] = await Promise.all([
      this.prisma.enrollment.count({ where }),
      this.prisma.enrollment.count({ where: { ...where, status: 'ACTIVE' } }),
      this.prisma.payment.count({ where: { status: 'PENDING', enrollment: where } }),
      this.prisma.payment.count({ where: { status: 'OVERDUE', enrollment: where } }),
    ]);

    const totalRevenue = await this.prisma.payment.aggregate({
      where: { status: 'PAID', enrollment: where },
      _sum: { paidAmount: true },
    });

    return {
      total,
      active,
      pendingPayments,
      overduePayments,
      totalPaid: Number(totalRevenue._sum.paidAmount || 0),
    };
  }
}