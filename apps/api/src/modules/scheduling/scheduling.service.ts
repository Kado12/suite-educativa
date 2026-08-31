import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@suite/database';

interface TeacherInfo {
  id: string;
  priority: number;
  maxSessionsPerWeek: number | null;
  maxSections: number | null;
  courses: Set<string>;
  turnos: Set<string>;
  sedes: Set<string>;
  sedeDays: Set<string>;   // `${sedeId}::${day}`
  slotPrefs: Set<string>;  // `${turnoId}::${slot}`
  unavailableDays: Set<number>;
}

interface Candidate { courseId: string; teacherId: string; prefSlot: boolean; }
interface Assignment { sectionId: string; courseId: string; teacherId: string; dayOfWeek: number; slot: number; }

export interface GenerateResult {
  blockId: string;
  blockName: string;
  totalSections: number;
  resolved: number;
  unresolved: { sectionId: string; sectionName: string; reason: string }[];
  totalSessions: number;
  teachersUsed: number;
  generatedAt: string;
}

const MAX_RESTARTS = 6;

@Injectable()
export class SchedulingService {
  constructor(private prisma: PrismaService) {}

  private async loadTeachers(): Promise<TeacherInfo[]> {
    const raw = await this.prisma.teacherProfile.findMany({
      include: {
        courses: true, turnos: true, sedes: true, sedeDays: true, slotPrefs: true, unavailableDays: true,
        person: true,
      },
      where: { person: { isActive: true } },
    });
    return raw.map((t) => ({
      id: t.id,
      priority: t.priority,
      maxSessionsPerWeek: t.maxSessionsPerWeek,
      maxSections: t.maxSections,
      courses: new Set(t.courses.map((c) => c.courseId)),
      turnos: new Set(t.turnos.map((x) => x.turnoId)),
      sedes: new Set(t.sedes.map((x) => x.sedeId)),
      sedeDays: new Set(t.sedeDays.map((x) => `${x.sedeId}::${x.dayOfWeek}`)),
      slotPrefs: new Set(t.slotPrefs.map((x) => `${x.turnoId}::${x.slot}`)),
      unavailableDays: new Set(t.unavailableDays.map((x) => x.dayOfWeek)),
    }));
  }

  private isValid(t: TeacherInfo, section: any, day: number, slot: number, courseId: string, ignoreSlotPrefs: boolean): boolean {
    if (!t.courses.has(courseId)) return false;
    if (t.unavailableDays.has(day)) return false;
    if (t.turnos.size > 0 && !t.turnos.has(section.turnoId)) return false;
    if (t.sedes.size > 0 && !t.sedes.has(section.classroom.sedeId)) return false;
    if (t.sedeDays.size > 0 && !t.sedeDays.has(`${section.classroom.sedeId}::${day}`)) return false;
    if (!ignoreSlotPrefs && t.slotPrefs.size > 0 && !t.slotPrefs.has(`${section.turnoId}::${slot}`)) return false;
    return true;
  }

  private solveSection(
    section: any,
    courseIds: string[],
    teachers: TeacherInfo[],
    occupation: Set<string>,
    teacherSections: Map<string, Set<string>>,
    teacherSessions: Map<string, number>,
    ignoreSlotPrefs: boolean,
  ): Assignment[] | null {
    const slots: { dayOfWeek: number; slot: number }[] = [];
    for (let d = 1; d <= 5; d++) for (let s = 1; s <= 2; s++) slots.push({ dayOfWeek: d, slot: s });

    // Matriz de opciones por slot
    const optionsBySlot = new Map<string, Candidate[]>();
    for (const sl of slots) {
      const key = `${sl.dayOfWeek}-${sl.slot}`;
      const cands: Candidate[] = [];
      for (const courseId of courseIds) {
        for (const t of teachers) {
          if (!this.isValid(t, section, sl.dayOfWeek, sl.slot, courseId, ignoreSlotPrefs)) continue;
          cands.push({ courseId, teacherId: t.id, prefSlot: t.slotPrefs.has(`${section.turnoId}::${sl.slot}`) });
        }
      }
      // Priorizar docentes con mayor prioridad y los que cumplen su slot preferido
      const prio = new Map(teachers.map((t) => [t.id, t.priority]));
      cands.sort((a, b) => (Number(b.prefSlot) - Number(a.prefSlot)) || ((prio.get(b.teacherId) || 0) - (prio.get(a.teacherId) || 0)));
      optionsBySlot.set(key, cands);
    }

    // MRV: slots con menos opciones primero
    const ordered = [...slots].sort((a, b) =>
      (optionsBySlot.get(`${a.dayOfWeek}-${a.slot}`)?.length || 0) - (optionsBySlot.get(`${b.dayOfWeek}-${b.slot}`)?.length || 0),
    );

    for (let attempt = 0; attempt < MAX_RESTARTS; attempt++) {
      const res = this.backtrack(ordered, optionsBySlot, section, teachers, occupation, teacherSections, teacherSessions);
      if (res) return res;
      // Shuffle para variar
      for (let i = ordered.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
      }
    }
    return null;
  }

  private backtrack(
    slots: { dayOfWeek: number; slot: number }[],
    optionsBySlot: Map<string, Candidate[]>,
    section: any,
    teachers: TeacherInfo[],
    occupation: Set<string>,
    teacherSections: Map<string, Set<string>>,
    teacherSessions: Map<string, number>,
  ): Assignment[] | null {
    const usedCourses = new Set<string>();
    const localTeacherSessions = new Map<string, number>(); // en esta sección (path)
    const localTeachers = new Set<string>();
    const assignments: Assignment[] = [];
    const tById = new Map(teachers.map((t) => [t.id, t]));

    const solve = (idx: number): boolean => {
      if (idx === slots.length) return true;
      const sl = slots[idx];
      const key = `${sl.dayOfWeek}-${sl.slot}`;
      const options = optionsBySlot.get(key) || [];

      for (const opt of options) {
        if (usedCourses.has(opt.courseId)) continue;
        const occKey = `${opt.teacherId}::${sl.dayOfWeek}::${sl.slot}`;
        if (occupation.has(occKey)) continue;

        const t = tById.get(opt.teacherId)!;
        const localCount = localTeacherSessions.get(opt.teacherId) || 0;
        const globalCount = teacherSessions.get(opt.teacherId) || 0;

        // Máx sesiones por semana
        if (t.maxSessionsPerWeek && globalCount + localCount >= t.maxSessionsPerWeek) continue;

        // Máx secciones (salones) distintas
        const alreadyInSection = localTeachers.has(opt.teacherId);
        const hasSectionGlobal = teacherSections.get(opt.teacherId)?.has(section.id) || false;
        if (!alreadyInSection && !hasSectionGlobal && t.maxSections) {
          const distinctSections = teacherSections.get(opt.teacherId)?.size || 0;
          if (distinctSections >= t.maxSections) continue;
        }

        // Probar
        usedCourses.add(opt.courseId);
        localTeacherSessions.set(opt.teacherId, localCount + 1);
        localTeachers.add(opt.teacherId);
        assignments.push({ sectionId: section.id, courseId: opt.courseId, teacherId: opt.teacherId, dayOfWeek: sl.dayOfWeek, slot: sl.slot });

        if (solve(idx + 1)) return true;

        assignments.pop();
        usedCourses.delete(opt.courseId);
        localTeacherSessions.set(opt.teacherId, localCount);
        if (localCount === 0) localTeachers.delete(opt.teacherId);
      }
      return false;
    };

    return solve(0) ? assignments : null;
  }

  private DAY = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

  async validate(blockId: string) {
    const sessions = await this.prisma.scheduleSession.findMany({
      where: { blockId },
      include: {
        section: { include: { classroom: { include: { sede: true } }, turno: true } },
        course: true,
        teacherProfile: { include: { person: true, unavailableDays: true, turnos: true, sedes: true, sedeDays: true } },
      },
    });

    const conflicts: any[] = [];
    const warnings: any[] = [];

    // Cruces de docente y de sección
    const byTeacher = new Map<string, any[]>();
    const bySection = new Map<string, any[]>();
    for (const s of sessions) {
      if (s.teacherProfileId) {
        const k = `${s.teacherProfileId}|${s.dayOfWeek}|${s.slot}`;
        if (!byTeacher.has(k)) byTeacher.set(k, []);
        byTeacher.get(k)!.push(s);
      }
      const ks = `${s.sectionId}|${s.dayOfWeek}|${s.slot}`;
      if (!bySection.has(ks)) bySection.set(ks, []);
      bySection.get(ks)!.push(s);
    }
    for (const [, g] of byTeacher) {
      if (g.length > 1) {
        const t = g[0].teacherProfile;
        conflicts.push({ type: 'CRUCE_DOCENTE', message: `${t.person.lastName}, ${t.person.firstName} está en ${g.length} secciones a la vez (${this.DAY[g[0].dayOfWeek]} slot ${g[0].slot}): ${g.map((x) => x.section.name).join(', ')}` });
      }
    }
    for (const [, g] of bySection) {
      if (g.length > 1) conflicts.push({ type: 'CRUCE_SECCION', message: `La sección ${g[0].section.name} tiene ${g.length} clases en ${this.DAY[g[0].dayOfWeek]} slot ${g[0].slot}` });
    }

    // Advertencias de disponibilidad
    for (const s of sessions) {
      const t = s.teacherProfile;
      if (!t) continue;
      const name = `${t.person.lastName}, ${t.person.firstName}`;
      if (t.unavailableDays.some((d: any) => d.dayOfWeek === s.dayOfWeek)) warnings.push({ message: `${name} no dispone los ${this.DAY[s.dayOfWeek]} pero tiene clase en ${s.section.name}` });
      if (t.turnos.length && !t.turnos.some((x: any) => x.turnoId === s.section.turnoId)) warnings.push({ message: `${name} no tiene el turno ${s.section.turno.name} pero dicta en ${s.section.name}` });
      if (t.sedes.length && !t.sedes.some((x: any) => x.sedeId === s.section.classroom.sedeId)) warnings.push({ message: `${name} no tiene la sede ${s.section.classroom.sede.name} pero dicta en ${s.section.name}` });
      if (t.sedeDays.length && !t.sedeDays.some((x: any) => x.sedeId === s.section.classroom.sedeId && x.dayOfWeek === s.dayOfWeek)) warnings.push({ message: `${name} no dispone ${this.DAY[s.dayOfWeek]} en ${s.section.classroom.sede.name} pero dicta ahí` });
    }

    return { totalSessions: sessions.length, conflicts, warnings };
  }

  async listSessions(blockId: string) {
    return this.prisma.scheduleSession.findMany({
      where: { blockId },
      include: {
        section: { include: { classroom: { include: { sede: true } }, turno: true } },
        course: true,
        teacherProfile: { include: { person: true } },
        _count: { select: { attendances: true } },
      },
      orderBy: [{ section: { name: 'asc' } }, { dayOfWeek: 'asc' }, { slot: 'asc' }],
    });
  }

  private async assertNoConflict(d: { sectionId: string; courseId: string; teacherProfileId?: string | null; dayOfWeek: number; slot: number; blockId: string }, excludeId?: string) {
    const base: any = excludeId ? { NOT: { id: excludeId } } : {};
    if (d.teacherProfileId) {
      const t = await this.prisma.scheduleSession.findFirst({ where: { ...base, teacherProfileId: d.teacherProfileId, dayOfWeek: d.dayOfWeek, slot: d.slot } });
      if (t) throw new ConflictException('El docente ya tiene otra clase en ese día y slot');
    }
    const sec = await this.prisma.scheduleSession.findFirst({ where: { ...base, sectionId: d.sectionId, dayOfWeek: d.dayOfWeek, slot: d.slot } });
    if (sec) throw new ConflictException('La sección ya tiene otra clase en ese día y slot');
    const cur = await this.prisma.scheduleSession.findFirst({ where: { ...base, sectionId: d.sectionId, courseId: d.courseId, blockId: d.blockId } });
    if (cur) throw new ConflictException('La sección ya tiene ese curso en este bloque');
  }

  async updateSession(id: string, data: { courseId?: string; teacherProfileId?: string | null; dayOfWeek?: number; slot?: number }) {
    const ex = await this.prisma.scheduleSession.findUnique({ where: { id } });
    if (!ex) throw new NotFoundException('Sesión no encontrada');
    const merged = {
      sectionId: ex.sectionId, blockId: ex.blockId,
      courseId: data.courseId ?? ex.courseId,
      teacherProfileId: data.teacherProfileId !== undefined ? data.teacherProfileId : ex.teacherProfileId,
      dayOfWeek: data.dayOfWeek ?? ex.dayOfWeek,
      slot: data.slot ?? ex.slot,
    };
    await this.assertNoConflict(merged, id);
    // Mismo id → conserva asistencias (histórico)
    return this.prisma.scheduleSession.update({ where: { id }, data: { courseId: merged.courseId, teacherProfileId: merged.teacherProfileId, dayOfWeek: merged.dayOfWeek, slot: merged.slot } });
  }

  async createSession(
  d: Prisma.ScheduleSessionUncheckedCreateInput,
  ) {
    await this.assertNoConflict({
      sectionId: d.sectionId,
      blockId: d.blockId,
      courseId: d.courseId,
      teacherProfileId: d.teacherProfileId ?? null,
      dayOfWeek: d.dayOfWeek,
      slot: d.slot,
    });

    return this.prisma.scheduleSession.create({ data: d });
  }

  // async creataeSession(d: { sectionId: string; courseId: string; teacherProfileId?: string | null; dayOfWeek: number; slot: number; blockId: string }) {
  //   await this.assertNoConflict(d);
  //   return this.prisma.scheduleSession.create({ data: d });
  // }

  async deleteSession(id: string) {
    const count = await this.prisma.attendanceRecord.count({ where: { sessionId: id } });
    if (count > 0) throw new ConflictException('Esta sesión tiene asistencias. No se elimina para preservar el histórico.');
    return this.prisma.scheduleSession.delete({ where: { id } });
  }

  async generate(blockId: string): Promise<GenerateResult> {
    const block = await this.prisma.block.findUnique({
      where: { id: blockId },
      include: { blockCourses: { include: { course: true } }, period: true },
    });
    if (!block) throw new NotFoundException('Bloque no encontrado');

    const courseIds = block.blockCourses.map((bc) => bc.courseId);
    if (courseIds.length === 0) throw new BadRequestException('El bloque no tiene cursos');

    const sections = await this.prisma.section.findMany({
      include: { classroom: { include: { sede: true } }, turno: true },
    });
    if (sections.length === 0) throw new BadRequestException('No hay secciones');

    const slotsPerWeek = 10; // 5 días × 2 slots
    if (courseIds.length > slotsPerWeek) {
      throw new BadRequestException(`El bloque tiene ${courseIds.length} cursos pero solo hay ${slotsPerWeek} slots por sección`);
    }

    const teachers = await this.loadTeachers();

    // Limpiar sesiones previas del bloque
    await this.prisma.scheduleSession.deleteMany({ where: { blockId } });

    // Estado global
    const occupation = new Set<string>();                    // teacherId::day::slot
    const teacherSections = new Map<string, Set<string>>();  // teacherId -> sections
    const teacherSessions = new Map<string, number>();       // teacherId -> total sesiones

    const allAssignments: Assignment[] = [];
    const unresolved: GenerateResult['unresolved'] = [];

    for (const section of sections) {
      let result = this.solveSection(section, courseIds, teachers, occupation, teacherSections, teacherSessions, false);
      if (!result) {
        result = this.solveSection(section, courseIds, teachers, occupation, teacherSections, teacherSessions, true);
      }

      if (result) {
        for (const a of result) {
          allAssignments.push(a);
          occupation.add(`${a.teacherId}::${a.dayOfWeek}::${a.slot}`);
          if (!teacherSections.has(a.teacherId)) teacherSections.set(a.teacherId, new Set());
          teacherSections.get(a.teacherId)!.add(a.sectionId);
          teacherSessions.set(a.teacherId, (teacherSessions.get(a.teacherId) || 0) + 1);
        }
      } else {
        unresolved.push({ sectionId: section.id, sectionName: section.name, reason: 'Sin combinación válida de docentes tras reintentos' });
      }
    }

    // Insertar en BD
    if (allAssignments.length > 0) {
      await this.prisma.$transaction(async (tx) => {
        for (const a of allAssignments) {
          await tx.scheduleSession.create({
            data: {
              sectionId: a.sectionId,
              courseId: a.courseId,
              teacherProfileId: a.teacherId,
              blockId,
              dayOfWeek: a.dayOfWeek,
              slot: a.slot,
            },
          });
        }
      });
    }

    return {
      blockId,
      blockName: block.name,
      totalSections: sections.length,
      resolved: sections.length - unresolved.length,
      unresolved,
      totalSessions: allAssignments.length,
      teachersUsed: new Set(allAssignments.map((a) => a.teacherId)).size,
      generatedAt: new Date().toISOString(),
    };
  }

  async getResult(blockId: string) {
    return this.prisma.scheduleSession.findMany({
      where: { blockId },
      include: {
        section: { include: { classroom: { include: { sede: true } }, turno: true } },
        course: true,
        teacherProfile: { include: { person: true } },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { slot: 'asc' }, { section: { name: 'asc' } }],
    });
  }

  async clear(blockId: string) {
    const r = await this.prisma.scheduleSession.deleteMany({ where: { blockId } });
    return { deleted: r.count };
  }

  async exportExcel(filters: { blockId: string; sedeId?: string; teacherProfileId?: string; areaId?: string; turnoId?: string; sectionId?: string }): Promise<Buffer> {
    const ExcelJS = require('exceljs');
    const sessions = await this.prisma.scheduleSession.findMany({
      where: {
        blockId: filters.blockId,
        ...(filters.sedeId ? { section: { classroom: { sedeId: filters.sedeId } } } : {}),
        ...(filters.teacherProfileId ? { teacherProfileId: filters.teacherProfileId } : {}),
        ...(filters.areaId ? { course: { areaId: filters.areaId } } : {}),
        ...(filters.turnoId ? { section: { turnoId: filters.turnoId } } : {}),
        ...(filters.sectionId ? { sectionId: filters.sectionId } : {}),
      },
      include: {
        section: { include: { classroom: { include: { sede: true } }, turno: true } },
        course: { include: { area: true } },
        teacherProfile: { include: { person: true } },
      },
      orderBy: [{ section: { name: 'asc' } }, { dayOfWeek: 'asc' }, { slot: 'asc' }],
    });

    const wb = new ExcelJS.Workbook();

    // ===== Hoja 1: Lista detallada =====
    const ws = wb.addWorksheet('Horario');
    ws.addRow(['HORARIO GENERADO']);
    ws.getRow(1).font = { bold: true, size: 14 };
    ws.addRow([`Total de sesiones: ${sessions.length}`]);
    ws.addRow([]);
    const headers = ['Sección', 'Sede', 'Turno', 'Día', 'Slot', 'Curso', 'Área', 'Docente'];
    const hr = ws.addRow(headers);
    hr.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    hr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0E7DC2' } };
    [12, 14, 10, 10, 6, 18, 14, 24].forEach((w, i) => { ws.getColumn(i + 1).width = w; });

    const DAYS = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    for (const s of sessions) {
      ws.addRow([
        s.section.name, s.section.classroom.sede.name, s.section.turno.name,
        DAYS[s.dayOfWeek], s.slot, s.course.name, s.course.area.name,
        `${s.teacherProfile.person.lastName}, ${s.teacherProfile.person.firstName}`,
      ]);
    }

    // ===== Hoja 2: Grilla por sección =====
    const bySection = new Map<string, any[]>();
    for (const s of sessions) {
      if (!bySection.has(s.section.id)) bySection.set(s.section.id, []);
      bySection.get(s.section.id)!.push(s);
    }
    for (const [secId, secs] of bySection) {
      const section = secs[0].section;
      const sheet = wb.addWorksheet(`${section.name}`.slice(0, 31));
      sheet.addRow([`${section.name} · ${section.classroom.sede.name} · ${section.turno.name}`]);
      sheet.getRow(1).font = { bold: true };
      sheet.addRow(['Slot', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']);
      sheet.getRow(2).font = { bold: true };
      for (let slot = 1; slot <= 2; slot++) {
        const row: any[] = [`Slot ${slot}`];
        for (let d = 1; d <= 5; d++) {
          const s = secs.find((x) => x.dayOfWeek === d && x.slot === slot);
          row.push(s ? `${s.course.name}\n${s.teacherProfile.person.lastName}, ${s.teacherProfile.person.firstName}` : '—');
        }
        const r = sheet.addRow(row);
        r.height = 30;
      }
      sheet.getColumn(1).width = 8;
      for (let i = 2; i <= 6; i++) sheet.getColumn(i).width = 22;
    }

    return Buffer.from(await wb.xlsx.writeBuffer());
  }
}