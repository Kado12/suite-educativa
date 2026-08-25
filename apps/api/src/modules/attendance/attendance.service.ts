import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AttendanceStatus } from '@suite/database';

const SESSION_HOURS = 3;
const DAY_NAMES = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

const parseDate = (s: string): Date => new Date(`${s}T00:00:00Z`);
const formatDate = (d: Date): string => d.toISOString().split('T')[0];
const addDays = (d: Date, days: number): Date => {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + days);
  return r;
};

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  private getWeekNumber(period: { startDate: Date; weeks: number }, date: Date): number | null {
    const diff = date.getTime() - period.startDate.getTime();
    const week = Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
    return week >= 1 && week <= period.weeks ? week : null;
  }

  private async getPeriodForDate(date: Date) {
    const periods = await this.prisma.period.findMany({ where: { isActive: true } });
    return periods.find((p) => {
      const end = addDays(p.startDate, p.weeks * 7 - 1);
      return date >= p.startDate && date <= end;
    });
  }

  private async getBlockForWeek(periodId: string, week: number) {
    return this.prisma.block.findFirst({
      where: { periodId, startWeek: { lte: week }, endWeek: { gte: week } },
    });
  }

  /**
   * Sesiones del día (según horario generado) + asistencia registrada
   */
  async getDaily(dateStr: string, sedeId?: string) {
    const date = parseDate(dateStr);
    const dow = date.getUTCDay();
    if (dow < 1 || dow > 5) throw new BadRequestException('La fecha cae en fin de semana');

    const period = await this.getPeriodForDate(date);
    if (!period) throw new BadRequestException('La fecha está fuera del período de clases');

    const week = this.getWeekNumber(period, date)!;
    const block = await this.getBlockForWeek(period.id, week);
    if (!block) throw new BadRequestException(`No hay bloque activo en la semana ${week}`);

    const sessions = await this.prisma.scheduleSession.findMany({
      where: {
        blockId: block.id,
        dayOfWeek: dow,
        ...(sedeId ? { section: { classroom: { sedeId } } } : {}),
      },
      include: {
        section: { include: { classroom: { include: { sede: true } }, turno: true } },
        course: true,
        teacherProfile: { include: { person: true } },
        attendances: { where: { date } },
      },
      orderBy: [{ section: { classroom: { sede: { name: 'asc' } } } }, { teacherProfile: { person: { lastName: 'asc' } } }],
    });

    const coverageMap = new Map<string, { sedeName: string; total: number; marked: number }>();
    for (const s of sessions) {
      const sedeName = s.section.classroom.sede.name;
      if (!coverageMap.has(sedeName)) coverageMap.set(sedeName, { sedeName, total: 0, marked: 0 });
      const g = coverageMap.get(sedeName)!;
      g.total++;
      if (s.attendances[0]) g.marked++;
    }

    return {
      date: dateStr,
      dayOfWeek: dow,
      dayName: DAY_NAMES[dow],
      weekNumber: week,
      blockName: block.name,
      classes: sessions.map((s) => ({
        id: s.id,
        hours: SESSION_HOURS,
        section: s.section,
        course: s.course,
        teacherProfile: s.teacherProfile,
        attendance: s.attendances[0] || null,
      })),
      coverage: Array.from(coverageMap.values()),
    };
  }

  /**
   * Guardar asistencia del día (upsert por sesión+fecha)
   */
  async saveDaily(dateStr: string, records: { sessionId: string; status: AttendanceStatus; lateMinutes?: number }[]) {
    const date = parseDate(dateStr);
    const dow = date.getUTCDay();
    if (dow < 1 || dow > 5) throw new BadRequestException('No se puede registrar asistencia en fin de semana');

    const period = await this.getPeriodForDate(date);
    if (!period) throw new BadRequestException('La fecha está fuera del período de clases');
    const week = this.getWeekNumber(period, date)!;
    const block = await this.getBlockForWeek(period.id, week);
    if (!block) throw new BadRequestException('No hay bloque activo en esa semana');

    // Validar que las sesiones pertenezcan al bloque activo
    const valid = await this.prisma.scheduleSession.findMany({
      where: { blockId: block.id, id: { in: records.map((r) => r.sessionId) } },
      select: { id: true },
    });
    const validIds = new Set(valid.map((v) => v.id));
    for (const r of records) {
      if (!validIds.has(r.sessionId)) {
        throw new BadRequestException('Una de las sesiones no corresponde al bloque activo');
      }
    }

    let saved = 0;
    for (const r of records) {
      const late = r.status === AttendanceStatus.ABSENT ? 0 : (r.lateMinutes || 0);
      await this.prisma.attendanceRecord.upsert({
        where: { sessionId_date: { sessionId: r.sessionId, date } },
        update: { status: r.status, lateMinutes: late },
        create: { sessionId: r.sessionId, date, status: r.status, lateMinutes: late },
      });
      saved++;
    }
    return { saved, date: dateStr };
  }

  /**
   * Vista semanal de un docente (formato Excel: L M M J V | T | total)
   */
  async getWeekly(teacherProfileId: string, periodId: string, weekNumber: number) {
    const period = await this.prisma.period.findUnique({ where: { id: periodId } });
    if (!period) throw new NotFoundException('Período no encontrado');
    if (weekNumber < 1 || weekNumber > period.weeks) throw new BadRequestException('Semana inválida');

    const block = await this.getBlockForWeek(periodId, weekNumber);
    const weekStart = addDays(period.startDate, (weekNumber - 1) * 7);
    const days: Date[] = [];
    for (let i = 0; i < 5; i++) days.push(addDays(weekStart, i));

    const sessions = await this.prisma.scheduleSession.findMany({
      where: { teacherProfileId, ...(block ? { blockId: block.id } : {}) },
      include: {
        section: { include: { classroom: { include: { sede: true } }, turno: true } },
        course: true,
        attendances: { where: { date: { gte: days[0], lte: days[4] } } },
      },
    });

    const dayRows = days.map((d, i) => {
      const daySessions = sessions.filter((s) => s.dayOfWeek === i + 1);
      // Todas las clases programadas del día, con su asistencia (o null si no se registró)
      const classes = daySessions.map((s) => {
        const att = s.attendances.find((a) => formatDate(a.date) === formatDate(d));
        return {
          courseName: s.course.name,
          sectionName: s.section.name,
          sedeName: s.section.classroom.sede.name,
          slot: s.slot,
          status: att ? att.status : null,
          lateMinutes: att ? att.lateMinutes : 0,
        };
      });

      const presents = classes.filter((c) => c.status === 'PRESENT');
      const absents = classes.filter((c) => c.status === 'ABSENT');
      return {
        date: formatDate(d),
        dayName: DAY_NAMES[i + 1],
        hours: presents.length * SESSION_HOURS,
        lateMinutes: presents.reduce((sum, c) => sum + (c.lateMinutes || 0), 0),
        presents: presents.length,
        absents: absents.length,
        classes,
      };
    });

    const totals = dayRows.reduce(
      (acc, d) => ({
        hours: acc.hours + d.hours,
        lateMinutes: acc.lateMinutes + d.lateMinutes,
        presents: acc.presents + d.presents,
        absents: acc.absents + d.absents,
      }),
      { hours: 0, lateMinutes: 0, presents: 0, absents: 0 },
    );

    return { weekNumber, periodName: period.name, blockName: block?.name || '—', days: dayRows, totals };
  }
}