import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async list(filters: { periodId?: string; status?: string; studentSearch?: string }): Promise<any> {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.periodId) where.enrollment = { periodId: filters.periodId };
    if (filters.studentSearch) {
      where.enrollment = {
        ...(where.enrollment || {}),
        student: {
          OR: [
            { firstName: { contains: filters.studentSearch } },
            { lastName: { contains: filters.studentSearch } },
            { dni: { contains: filters.studentSearch } },
          ],
        },
      };
    }
    return this.prisma.payment.findMany({
      where,
      include: {
        enrollment: {
          include: {
            student: true,
            section: { include: { classroom: { include: { sede: true } }, turno: true } },
            period: true,
          },
        },
        paymentPlan: true,
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async markPaid(id: string, paidAmount?: number, paidDate?: string): Promise<any> {
    const p = await this.prisma.payment.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Pago no encontrado');
    return this.prisma.payment.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAmount: paidAmount !== undefined ? paidAmount : Number(p.amount),
        paidDate: paidDate ? new Date(paidDate) : new Date(),
      },
    });
  }

  async markOverdue(id: string): Promise<any> {
    const p = await this.prisma.payment.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Pago no encontrado');
    if (p.status === 'PAID') throw new BadRequestException('No se puede marcar como vencido un pago ya pagado');
    return this.prisma.payment.update({ where: { id }, data: { status: 'OVERDUE' } });
  }

  async resetToPending(id: string): Promise<any> {
    const p = await this.prisma.payment.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Pago no encontrado');
    return this.prisma.payment.update({
      where: { id },
      data: { status: 'PENDING', paidAmount: null, paidDate: null },
    });
  }

  async getStats(periodId?: string) {
    const where: any = {};
    if (periodId) where.enrollment = { periodId };

    const [pending, paid, overdue] = await Promise.all([
      this.prisma.payment.aggregate({ where: { ...where, status: 'PENDING' }, _sum: { amount: true }, _count: true }),
      this.prisma.payment.aggregate({ where: { ...where, status: 'PAID' }, _sum: { paidAmount: true }, _count: true }),
      this.prisma.payment.aggregate({ where: { ...where, status: 'OVERDUE' }, _sum: { amount: true }, _count: true }),
    ]);

    return {
      pending: { count: pending._count, amount: Number(pending._sum.amount || 0) },
      paid: { count: paid._count, amount: Number(paid._sum.paidAmount || 0) },
      overdue: { count: overdue._count, amount: Number(overdue._sum.amount || 0) },
    };
  }
}