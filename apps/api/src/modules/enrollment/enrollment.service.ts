import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EnrollmentService {
  constructor(private prisma: PrismaService) {}

  private validateDocument(docType: string, dni: string) {
    if (docType === 'DNI') {
      if (!/^\d{8}$/.test(dni)) throw new BadRequestException('El DNI debe tener exactamente 8 dígitos');
    } else {
      if (!/^0\d{0,8}$/.test(dni)) throw new BadRequestException('El Carnet de Extranjería debe comenzar con 0 y tener hasta 9 dígitos');
    }
  }

  /**
   * Verifica si un documento ya existe y si tiene matrícula activa en el período.
   * El frontend lo usa para mostrar preview y bloquear si corresponde.
   */
  async checkStudent(dni: string, periodId: string) {
    const person = await this.prisma.person.findUnique({
      where: { dni },
      include: {
        enrollments: {
          where: { periodId, status: 'ACTIVE' },
          include: { section: { include: { classroom: { include: { sede: true } }, turno: true } }, period: true },
        },
      },
    });
    if (!person) return { exists: false, hasActiveEnrollment: false, student: null };
    return {
      exists: true,
      hasActiveEnrollment: person.enrollments.length > 0,
      student: {
        id: person.id,
        firstName: person.firstName,
        lastName: person.lastName,
        dni: person.dni,
        photoUrl: person.photoUrl,
        activeEnrollment: person.enrollments[0] || null,
      },
    };
  }

  /**
   * Sugiere la mejor sección disponible: sede + turno + activa + con cupo, ordenada por prioridad.
   */
  async suggestSection(sedeId: string, turnoId: string) {
    const sections = await this.prisma.section.findMany({
      where: { isActive: true, turnoId, classroom: { sedeId } },
      include: {
        classroom: { include: { sede: true } },
        turno: true,
        enrollments: { where: { status: 'ACTIVE' } },
      },
      orderBy: { enrollmentPriority: 'desc' },
    });

    const available = sections
      .map((s) => ({
        id: s.id,
        name: s.name,
        capacity: s.capacity,
        enrolled: s.enrollments.length,
        available: s.capacity - s.enrollments.length,
        priority: s.enrollmentPriority,
      }))
      .filter((s) => s.available > 0);

    return available[0] || null;
  }

  /**
   * Wizard: crea Person + Enrollment + Payments en una sola transacción.
   */
  async createWizard(d: {
    firstName: string; lastName: string; docType: string; dni: string;
    phone?: string; email?: string; birthDate?: string; gender?: string; photoUrl?: string;
    sectionId: string; periodId: string; paymentPlanId: string; firstPaymentPaid: boolean;
  }): Promise<any>  {
    this.validateDocument(d.docType, d.dni);

    const [section, period, plan] = await Promise.all([
      this.prisma.section.findUnique({ where: { id: d.sectionId }, include: { enrollments: { where: { status: 'ACTIVE' } } } }),
      this.prisma.period.findUnique({ where: { id: d.periodId } }),
      this.prisma.paymentPlan.findUnique({ where: { id: d.paymentPlanId } }),
    ]);
    if (!section) throw new NotFoundException('Sección no encontrada');
    if (!period) throw new NotFoundException('Período no encontrado');
    if (!plan) throw new NotFoundException('Plan de pago no encontrado');
    if (!section.isActive) throw new BadRequestException('La sección no está activa');

    // Validar cupo
    if (section.enrollments.length >= section.capacity) {
      throw new ConflictException(`La sección está llena (${section.enrollments.length}/${section.capacity})`);
    }

    // Verificar si el documento ya tiene matrícula activa en el período
    const existing = await this.prisma.person.findUnique({
      where: { dni: d.dni },
      include: { enrollments: { where: { periodId: d.periodId, status: 'ACTIVE' } } },
    });
    if (existing && existing.enrollments.length > 0) {
      throw new ConflictException(`Ya existe alumno: ${existing.lastName}, ${existing.firstName}`);
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Crear o recuperar Person
      let person = await tx.person.findUnique({ where: { dni: d.dni } });
      if (!person) {
        person = await tx.person.create({
          data: {
            firstName: d.firstName,
            lastName: d.lastName,
            docType: d.docType as any,
            dni: d.dni,
            phone: d.phone || null,
            email: d.email || null,
            photoUrl: d.photoUrl || null,
            birthDate: d.birthDate ? new Date(d.birthDate) : null,
            gender: d.gender || null,
          },
        });
      }

      // 2. Crear Enrollment
      const enrollment = await tx.enrollment.create({
        data: { studentId: person.id, sectionId: d.sectionId, periodId: d.periodId, status: 'ACTIVE' },
      });

      // 3. Generar cuotas
      const installmentAmount = Number(plan.amount) / plan.installments;
      const today = new Date();
      for (let i = 0; i < plan.installments; i++) {
        const dueDate = new Date(today);
        dueDate.setUTCMonth(dueDate.getUTCMonth() + i);
        dueDate.setUTCDate(1);

        const isFirstAndPaid = i === 0 && d.firstPaymentPaid;
        await tx.payment.create({
          data: {
            enrollmentId: enrollment.id,
            paymentPlanId: plan.id,
            installment: i + 1,
            amount: installmentAmount,
            dueDate,
            status: isFirstAndPaid ? 'PAID' : 'PENDING',
            paidAmount: isFirstAndPaid ? installmentAmount : null,
            paidDate: isFirstAndPaid ? today : null,
          },
        });
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

  async updateActiveEnrollmentSection(studentId: string, sectionId: string) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { studentId, status: 'ACTIVE' },
      orderBy: { enrolledAt: 'desc' },
    });
    if (!enrollment) throw new NotFoundException('No hay matrícula activa para este alumno');

    if (enrollment.sectionId !== sectionId) {
      const section = await this.prisma.section.findUnique({
        where: { id: sectionId },
        include: { enrollments: { where: { status: 'ACTIVE', NOT: { id: enrollment.id } } } },
      });
      if (!section) throw new NotFoundException('Sección no encontrada');
      if (!section.isActive) throw new BadRequestException('La sección no está activa');
      if (section.enrollments.length >= section.capacity) {
        throw new ConflictException(`La sección está llena (${section.enrollments.length}/${section.capacity})`);
      }
    }

    return this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { sectionId },
      include: { section: { include: { classroom: { include: { sede: true } }, turno: true } } },
    });
  }

  async changePaymentPlan(enrollmentId: string, newPlanId: string, forceRestore: boolean):Promise<any> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { payments: true },
    });
    if (!enrollment) throw new NotFoundException('Matrícula no encontrada');

    const paidCount = enrollment.payments.filter((p) => p.status === 'PAID').length;
    if (paidCount > 0 && !forceRestore) {
      return { requiresConfirmation: true, paidCount };
    }

    const plan = await this.prisma.paymentPlan.findUnique({ where: { id: newPlanId } });
    if (!plan) throw new NotFoundException('Plan de pago no encontrado');

    return this.prisma.$transaction(async (tx) => {
      await tx.payment.deleteMany({ where: { enrollmentId } });

      const installmentAmount = Number(plan.amount) / plan.installments;
      const today = new Date();
      for (let i = 0; i < plan.installments; i++) {
        const dueDate = new Date(today);
        dueDate.setUTCMonth(dueDate.getUTCMonth() + i);
        dueDate.setUTCDate(1);
        await tx.payment.create({
          data: {
            enrollmentId,
            paymentPlanId: plan.id,
            installment: i + 1,
            amount: installmentAmount,
            dueDate,
            status: 'PENDING',
          },
        });
      }

      return tx.enrollment.findUnique({
        where: { id: enrollmentId },
        include: { payments: { orderBy: { installment: 'asc' } } },
      });
    });
  }

  async getActiveEnrollment(studentId: string): Promise<any> {
    return this.prisma.enrollment.findFirst({
      where: { studentId, status: 'ACTIVE' },
      orderBy: { enrolledAt: 'desc' },
      include: {
        student: true,
        section: { include: { classroom: { include: { sede: true } }, turno: true } },
        period: true,
        payments: { orderBy: { installment: 'asc' }, include: { paymentPlan: true } },
      },
    });
  }

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