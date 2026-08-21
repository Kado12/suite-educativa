import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

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
}