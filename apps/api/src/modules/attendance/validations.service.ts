import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ValidationStatus } from '@suite/database';

const addDays = (d: Date, days: number): Date => {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + days);
  return r;
};

@Injectable()
export class ValidationsService {
  constructor(private prisma: PrismaService) {}

  async getWeekStatus(periodId: string, weekNumber: number) {
    const period = await this.prisma.period.findUnique({ where: { id: periodId } });
    if (!period) throw new NotFoundException('Período no encontrado');

    const weekStart = addDays(period.startDate, (weekNumber - 1) * 7);
    const weekEnd = addDays(weekStart, 4);

    // Docentes con sesiones en el bloque de esa semana
    const block = await this.prisma.block.findFirst({
      where: { periodId, startWeek: { lte: weekNumber }, endWeek: { gte: weekNumber } },
    });

    const teachers = await this.prisma.teacherProfile.findMany({
      where: {
        person: { isActive: true },
        ...(block ? { sessions: { some: { blockId: block.id } } } : {}),
      },
      include: {
        person: true,
        validations: { where: { periodId, weekNumber } },
      },
      orderBy: [{ person: { lastName: 'asc' } }],
    });

    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        date: { gte: weekStart, lte: weekEnd },
        session: { ...(block ? { blockId: block.id } : {}) },
      },
      include: { session: true },
    });

    const byTeacher = new Map<string, { hours: number; presents: number; absents: number; lateMinutes: number }>();
    for (const r of records) {
      const id = r.session.teacherProfileId;
      if (!byTeacher.has(id)) byTeacher.set(id, { hours: 0, presents: 0, absents: 0, lateMinutes: 0 });
      const g = byTeacher.get(id)!;
      if (r.status === 'PRESENT') { g.presents++; g.hours += 3; g.lateMinutes += r.lateMinutes; }
      else g.absents++;
    }

    return teachers.map((t) => ({
      teacher: { id: t.id, firstName: t.person.firstName, lastName: t.person.lastName, dni: t.person.dni },
      stats: byTeacher.get(t.id) || { hours: 0, presents: 0, absents: 0, lateMinutes: 0 },
      validation: t.validations[0] || null,
    }));
  }

  async setStatus(d: { teacherProfileId: string; periodId: string; weekNumber: number; status: ValidationStatus; comment?: string }, userId: string) {
    return this.prisma.weekValidation.upsert({
      where: {
        teacherProfileId_periodId_weekNumber: {
          teacherProfileId: d.teacherProfileId, periodId: d.periodId, weekNumber: d.weekNumber,
        },
      },
      update: { status: d.status, comment: d.comment || null, validatedById: userId },
      create: {
        teacherProfileId: d.teacherProfileId, periodId: d.periodId, weekNumber: d.weekNumber,
        status: d.status, comment: d.comment || null, validatedById: userId,
      },
      include: { validatedBy: { select: { firstName: true, lastName: true } } },
    });
  }
}