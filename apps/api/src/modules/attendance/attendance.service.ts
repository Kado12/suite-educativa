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
    const date = new Date(`${dateStr}T00:00:00Z`);
    const dow = date.getUTCDay() === 0 ? 7 : date.getUTCDay();

    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const isPast = date < today;
    const nextDay = addDays(date, 1);

    // Deducir período, semana y bloque desde la fecha
    const period = await this.prisma.period.findFirst({
      where: { startDate: { lte: date } },
      orderBy: { startDate: 'desc' },
    });
    let weekNumber = 0;
    let blockId: string | undefined;
    let blockName = '—';
    if (period) {
      weekNumber = Math.floor((date.getTime() - new Date(period.startDate).getTime()) / (7 * 86400000)) + 1;
      if (weekNumber >= 1 && weekNumber <= period.weeks) {
        const block = await this.getBlockForWeek(period.id, weekNumber);
        blockId = block?.id;
        blockName = block?.name || '—';
      }
    }

    const sessions = await this.prisma.scheduleSession.findMany({
      where: {
        ...(blockId ? { blockId } : {}),
        dayOfWeek: dow,
        section : {
          isActive: true,
          ...(sedeId ? { classroom: { sedeId } } : {}),
        },
      },
      include: {
        section: { include: { classroom: { include: { sede: true } }, turno: true } },
        course: true,
        teacherProfile: { include: { person: true } },
        attendances: {
          where: { date },
          include: { teacherProfile: { include: { person: true } }, course: true },
        },
      },
      orderBy: [{ section: { classroom: { sede: { name: 'asc' } } } }, { slot: 'asc' }],
    });

    // Días pasados: solo sesiones que ya existían ese día
    const filtered = isPast
      ? sessions.filter((s) => new Date(s.createdAt) < nextDay)
      : sessions;

    // Clases con snapshot (quien dictó realmente) y attendance singular
    const classes = filtered.map((s) => {
      const rec = s.attendances[0] || null;
      return {
        ...s,
        teacherProfile: rec?.teacherProfile ?? s.teacherProfile ?? { person: { lastName: 'Sin', firstName: 'docente' } },
        course: rec?.course ?? s.course,
        attendance: rec,
      };
    });

    // Cobertura por sede (marcadas/total)
    const covMap = new Map<string, { sedeName: string; marked: number; total: number }>();
    for (const c of classes) {
      const sedeName = c.section.classroom.sede.name;
      if (!covMap.has(sedeName)) covMap.set(sedeName, { sedeName, marked: 0, total: 0 });
      const g = covMap.get(sedeName)!;
      g.total++;
      if (c.attendance) g.marked++;
    }

    return {
      dayName: DAY_NAMES[dow],
      weekNumber,
      blockName,
      classes,
      coverage: Array.from(covMap.values()),
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
      select: { id: true, teacherProfileId: true, courseId: true },
    });
    const validIds = new Set(valid.map((v) => v.id));
    const byId = new Map(valid.map((v) => [v.id, v]));
    for (const r of records) {
      if (!validIds.has(r.sessionId)) {
        throw new BadRequestException('Una de las sesiones no corresponde al bloque activo');
      }
    }

    let saved = 0;
    for (const r of records) {
      const sess = byId.get(r.sessionId);
      const late = r.status === AttendanceStatus.ABSENT ? 0 : (r.lateMinutes || 0);
      await this.prisma.attendanceRecord.upsert({
        where: { sessionId_date: { sessionId: r.sessionId, date } },
        update: { status: r.status, lateMinutes: late },
        create: { 
          sessionId: r.sessionId, date, status: r.status, lateMinutes: late,
          teacherProfileId: sess?.teacherProfileId || null,
          courseId: sess?.courseId || null
        },
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

    const weekStart = addDays(period.startDate, (weekNumber - 1) * 7);
    const days: Date[] = [];
    for (let i = 0; i < 5; i++) days.push(addDays(weekStart, i));
    const weekEnd = days[4];

    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    // 1) Asistencias reales del docente (snapshot)
    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        date: { gte: days[0], lte: weekEnd },
        session: { block: { periodId } },
        OR: [{ teacherProfileId }, { teacherProfileId: null, session: { teacherProfileId } }],
      },
      include: {
        course: true,
        session: { include: { section: { include: { classroom: { include: { sede: true } }, turno: true } }, course: true } },
      },
    });

    // 2) Sesiones actuales del docente
    const currentSessions = await this.prisma.scheduleSession.findMany({
      where: { teacherProfileId, section: { isActive: true } },
      include: { section: { include: { classroom: { include: { sede: true } }, turno: true } }, course: true },
    });

    // 3) ¿Qué sesiones ya fueron registradas (por alguien) en la semana?
    const ids = currentSessions.map((s) => s.id);
    const allRecords = ids.length
      ? await this.prisma.attendanceRecord.findMany({
          where: { date: { gte: days[0], lte: weekEnd }, sessionId: { in: ids } },
          select: { sessionId: true, date: true },
        })
      : [];
    const recordedKey = new Set(allRecords.map((r) => `${r.sessionId}|${new Date(r.date).getUTCDay()}`));

    const dayRows = days.map((d, i) => {
      const dow = i + 1;
      const isFuture = d > today;
      const dayRecords = records.filter((r) => new Date(r.date).getUTCDay() === dow);

      // Clases realmente dictadas por este docente
      let classes: any[] = dayRecords.map((r) => ({
        courseName: (r.course ?? r.session.course).name,
        sectionName: r.session.section.name,
        sedeName: r.session.section.classroom.sede.name,
        slot: r.session.slot,
        status: r.status,
        lateMinutes: r.lateMinutes,
      }));

      // Programadas sin registrar: solo si existían ese día y NADIE las registró
      const nextDay = addDays(d, 1);
      const unrecorded = currentSessions.filter(
        (s) => s.dayOfWeek === dow &&
          new Date(s.createdAt) < nextDay &&
          !recordedKey.has(`${s.id}|${dow}`),
      );
      classes = [
        ...classes,
        ...unrecorded.map((s) => ({
          courseName: s.course.name, sectionName: s.section.name,
          sedeName: s.section.classroom.sede.name, slot: s.slot, status: null, lateMinutes: 0,
        })),
      ];

      const presents = classes.filter((c) => c.status === 'PRESENT');
      const absents = classes.filter((c) => c.status === 'ABSENT');
      return {
        date: formatDate(d), dayName: DAY_NAMES[dow], isFuture,
        hours: presents.length * SESSION_HOURS,
        lateMinutes: presents.reduce((s, c) => s + (c.lateMinutes || 0), 0),
        presents: presents.length, absents: absents.length, classes,
      };
    });

    const totals = dayRows.reduce(
      (acc, d) => ({ hours: acc.hours + d.hours, lateMinutes: acc.lateMinutes + d.lateMinutes, presents: acc.presents + d.presents, absents: acc.absents + d.absents }),
      { hours: 0, lateMinutes: 0, presents: 0, absents: 0 },
    );

    return { weekNumber, periodName: period.name, days: dayRows, totals };
  }
}