import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as ExcelJS from 'exceljs'

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

    async markPaid(id: string, paidAmount?: number, paidDate?: string, reference?: string): Promise<any> {
    const p = await this.prisma.payment.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Pago no encontrado');
    return this.prisma.payment.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAmount: paidAmount !== undefined ? paidAmount : Number(p.amount),
        paidDate: paidDate ? new Date(paidDate) : new Date(),
        reference: reference || null,
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

    const soon = new Date();
    soon.setUTCDate(soon.getUTCDate() + 7);
    const dueSoon = await this.prisma.payment.count({ where: { status: 'PENDING', dueDate: { lte: soon } } });

    return {
      pending: { count: pending._count, amount: Number(pending._sum.amount || 0) },
      paid: { count: paid._count, amount: Number(paid._sum.paidAmount || 0) },
      overdue: { count: overdue._count, amount: Number(overdue._sum.amount || 0) },
      dueSoon
    };
  }

    async exportExcel(filters: { periodId?: string; status?: string; studentSearch?: string }): Promise<Buffer> {
    const [payments, stats] = await Promise.all([this.list(filters), this.getStats(filters.periodId)]);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Pagos');

    // Título + resumen
    ws.addRow(['RESUMEN DE PAGOS']);
    ws.getRow(1).font = { bold: true, size: 14 };
    ws.addRow([
      `✅ Cobrado: S/ ${stats.paid.amount.toFixed(2)} (${stats.paid.count})`,
      `⏳ Pendiente: S/ ${stats.pending.amount.toFixed(2)} (${stats.pending.count})`,
      `⚠️ Vencido: S/ ${stats.overdue.amount.toFixed(2)} (${stats.overdue.count})`,
    ]);
    ws.addRow([]);

    const headers = ['Alumno', 'Documento', 'Sección', 'Período', 'Cuota', 'Monto', 'Vence', 'Estado', 'Pagado', 'Fecha pago'];
    const hr = ws.addRow(headers);
    hr.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    hr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0E7DC2' } };
    [28, 12, 12, 14, 8, 10, 12, 10, 10, 12].forEach((w, i) => { ws.getColumn(i + 1).width = w; });

    for (const p of payments) {
      const row = ws.addRow([
        `${p.enrollment.student.lastName}, ${p.enrollment.student.firstName}`,
        p.enrollment.student.dni || '',
        p.enrollment.section.name,
        p.enrollment.period.name,
        `${p.installment}/${p.paymentPlan?.installments || ''}`,
        Number(p.amount).toFixed(2),
        new Date(p.dueDate).toLocaleDateString(),
        p.status === 'PAID' ? 'PAGADO' : p.status === 'OVERDUE' ? 'VENCIDO' : 'PENDIENTE',
        p.paidAmount ? Number(p.paidAmount).toFixed(2) : '',
        p.paidDate ? new Date(p.paidDate).toLocaleDateString() : '',
      ]);
      const st = row.getCell(8);
      if (p.status === 'PAID') st.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
      else if (p.status === 'OVERDUE') st.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
      else st.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
    }

    return Buffer.from(await wb.xlsx.writeBuffer());
  }
}