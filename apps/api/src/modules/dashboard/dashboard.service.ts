import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as ExcelJS from 'exceljs';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  private getTodayDate(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }
  
  private weekNumber(period: any, date: Date): number {
    const diff = date.getTime() - new Date(period.startDate).getTime();
    return Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
  }

  async getOverview() {
    const [
      totalStudents,
      totalTeachers,
      totalSections,
      activeEnrollments,
      todaySessions,
      todayAttendance,
      pendingPayments,
      overduePayments,
      totalPaidAgg,
      recentValidations,
      recentEnrollments,
    ] = await Promise.all([
      this.prisma.person.count({ where: { teacherProfile: null, isActive: true } }),
      this.prisma.person.count({ where: { teacherProfile: { isNot: null } } }),
      this.prisma.section.count(),
      this.prisma.enrollment.count({ where: { status: 'ACTIVE' } }),
      this.prisma.scheduleSession.count({ where: { dayOfWeek: new Date().getUTCDay() || 7 } }),
      this.prisma.attendanceRecord.count({
        where: { date: this.getTodayDate() },
      }),
      this.prisma.payment.count({ where: { status: 'PENDING' } }),
      this.prisma.payment.count({ where: { status: 'OVERDUE' } }),
      this.prisma.payment.aggregate({
        where: { status: 'PAID' },
        _sum: { paidAmount: true },
      }),
      this.prisma.weekValidation.findMany({
        where: { status: { in: ['VALIDATED', 'OBSERVED'] } },
        orderBy: { id: 'desc' }, take: 5,
        include: { teacherProfile: { include: { person: true } }, validatedBy: true },
      }),
      this.prisma.enrollment.findMany({
        orderBy: { enrolledAt: 'desc' }, take: 5,
        include: { student: true, section: { include: { classroom: { include: { sede: true } }, turno: true } }, period: true },
      }),
    ]);

    return {
      metrics: {
        students: totalStudents,
        teachers: totalTeachers,
        sections: totalSections,
        enrollments: activeEnrollments,
        todaySessions,
        todayAttendance,
        pendingPayments,
        overduePayments,
        totalPaid: Number(totalPaidAgg._sum.paidAmount || 0),
      },
      recentValidations: recentValidations.map((v) => ({
        id: v.id,
        teacher: `${v.teacherProfile.person.lastName}, ${v.teacherProfile.person.firstName}`,
        week: v.weekNumber,
        status: v.status,
        comment: v.comment,
      })),
      recentEnrollments: recentEnrollments.map((e) => ({
        id: e.id,
        student: `${e.student.lastName}, ${e.student.firstName}`,
        section: `${e.section.name} · ${e.section.turno.name}`,
        sede: e.section.classroom.sede.name,
        period: e.period.name,
        enrolledAt: e.enrolledAt,
      })),
    };
  }

  async getCharts(periodId?: string, sedeId?: string) {
    const period = periodId
      ? await this.prisma.period.findUnique({ where: { id: periodId } })
      : await this.prisma.period.findFirst({ where: { isActive: true } });
    const pId = period?.id;

    const enrollments = await this.prisma.enrollment.findMany({
      where: pId ? { periodId: pId } : {},
      include: {
        section: { include: { classroom: { include: { sede: true } }, turno: true } },
        payments: { include: { paymentPlan: true } },
      },
    });
    const filtered = sedeId ? enrollments.filter((e) => e.section.classroom.sedeId === sedeId) : enrollments;
    const total = filtered.length || 1;

    // ===== Inscritos por mes =====
    const byMonth = new Map<number, number>();
    for (const e of filtered) byMonth.set(new Date(e.enrolledAt).getUTCMonth(), (byMonth.get(new Date(e.enrolledAt).getUTCMonth()) || 0) + 1);
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const enrollmentsByMonth = monthNames.map((month, i) => ({ month, count: byMonth.get(i) || 0 }));

    // ===== Cobranza =====
    let paid = 0, pending = 0, overdue = 0;
    for (const e of filtered) for (const p of e.payments) {
      if (p.status === 'PAID') paid += Number(p.paidAmount || 0);
      else if (p.status === 'PENDING') pending += Number(p.amount || 0);
      else overdue += Number(p.amount || 0);
    }
    const paymentsDonut = [
      { name: 'Cobrado', value: paid, color: '#12A150' },
      { name: 'Pendiente', value: pending, color: '#FFC621' },
      { name: 'Vencido', value: overdue, color: '#D7263D' },
    ];

    // ===== Recuento por plan de pago =====
    const planCount = new Map<string, number>();
    for (const e of filtered) {
      const plan = e.payments[0]?.paymentPlan?.name || 'Sin plan';
      planCount.set(plan, (planCount.get(plan) || 0) + 1);
    }
    const byPaymentPlan = Array.from(planCount.entries()).map(([plan, count]) => ({ plan, count }));

    // ===== Alumnos por sede =====
    const sedeCount = new Map<string, number>();
    for (const e of filtered) sedeCount.set(e.section.classroom.sede.name, (sedeCount.get(e.section.classroom.sede.name) || 0) + 1);
    const studentsBySede = Array.from(sedeCount.entries()).map(([sede, count]) => ({ sede, count, pct: Math.round((count / total) * 100) }));

    // ===== Distribución por turnos =====
    const turnoCount = new Map<string, number>();
    for (const e of filtered) turnoCount.set(e.section.turno.name, (turnoCount.get(e.section.turno.name) || 0) + 1);
    const distributionByTurno = Array.from(turnoCount.entries()).map(([turno, count]) => ({ turno, count, pct: Math.round((count / total) * 100) }));

    // ===== Asistencia semanal (% + horas), segmentable por sede =====
    let attendanceByWeek: any[] = [];
    if (period) {
      const attWhere: any = { session: { block: { periodId: pId } } };
      if (sedeId) attWhere.session = { ...attWhere.session, section: { classroom: { sedeId } } };
      const records = await this.prisma.attendanceRecord.findMany({ where: attWhere });
      const byWeek = new Map<number, { present: number; total: number }>();
      for (const r of records) {
        const w = this.weekNumber(period, new Date(r.date));
        if (w < 1 || w > period.weeks) continue;
        if (!byWeek.has(w)) byWeek.set(w, { present: 0, total: 0 });
        const g = byWeek.get(w)!;
        g.total++;
        if (r.status === 'PRESENT') g.present++;
      }
      attendanceByWeek = Array.from(byWeek.entries()).sort((a, b) => a[0] - b[0])
        .map(([w, g]) => ({ week: `S${w}`, rate: Math.round((g.present / g.total) * 100), hours: g.present * 3 }));
    }

    // ===== Ocupación por sede (%) =====
    const sections = await this.prisma.section.findMany({
      where: { isActive: true },
      include: { classroom: { include: { sede: true } }, enrollments: { where: { status: 'ACTIVE' } } },
    });
    const bySede = new Map<string, { enrolled: number; capacity: number }>();
    for (const s of sections) {
      const name = s.classroom.sede.name;
      if (!bySede.has(name)) bySede.set(name, { enrolled: 0, capacity: 0 });
      const g = bySede.get(name)!;
      g.enrolled += s.enrollments.length;
      g.capacity += s.capacity;
    }
    
    const occupancyBySede = Array.from(bySede.entries()).map(([sede, g]) => ({
      sede,
      ocupacion: g.capacity > 0 ? Math.round((g.enrolled / g.capacity) * 100) : 0,
    }));

    return { enrollmentsByMonth, paymentsDonut, byPaymentPlan, studentsBySede, distributionByTurno, attendanceByWeek, occupancyBySede };
  }

  async exportStats(): Promise<Buffer> {
    const [overview, charts] = await Promise.all([this.getOverview(), this.getCharts()]);
    const wb = new ExcelJS.Workbook();

    // Resumen
    const ws1 = wb.addWorksheet('Resumen');
    ws1.addRow(['INDICADOR', 'VALOR']);
    ws1.getRow(1).font = { bold: true };
    const m = overview.metrics;
    ws1.addRows([
      ['Alumnos', m.students], ['Docentes', m.teachers], ['Secciones', m.sections],
      ['Matrículas activas', m.enrollments], ['Ingresos', m.totalPaid],
      ['Cuotas pendientes', m.pendingPayments], ['Cuotas vencidas', m.overduePayments],
    ]);

    // Matrículas por mes
    const ws2 = wb.addWorksheet('Matriculas por mes');
    ws2.addRow(['Mes', 'Matrículas']); ws2.getRow(1).font = { bold: true };
    charts.enrollmentsByMonth.forEach((r: any) => ws2.addRow([r.month, r.count]));

    // Cobranza
    const ws3 = wb.addWorksheet('Cobranza');
    ws3.addRow(['Estado', 'Monto']); ws3.getRow(1).font = { bold: true };
    charts.paymentsDonut.forEach((r: any) => ws3.addRow([r.name, r.value]));

    // Asistencia semanal
    const ws4 = wb.addWorksheet('Asistencia semanal');
    ws4.addRow(['Semana', '% Asistencia']); ws4.getRow(1).font = { bold: true };
    charts.attendanceByWeek.forEach((r: any) => ws4.addRow([r.week, r.rate]));

    // Ocupación por sede
    const ws5 = wb.addWorksheet('Ocupacion por sede');
    ws5.addRow(['Sede', '% Ocupación']); ws5.getRow(1).font = { bold: true };
    charts.occupancyBySede.forEach((r: any) => ws5.addRow([r.sede, r.ocupacion]));

    return Buffer.from(await wb.xlsx.writeBuffer());
  }
}