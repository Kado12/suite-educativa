import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as ExcelJS from 'exceljs';

export interface ImportResult { created: number; skipped: number; errors: { row: number; reason: string }[]; }

export const IMPORT_TEMPLATES: Record<string, { headers: string[]; example: string[] }> = {
  students: { headers: ['Nombres', 'Apellidos', 'DNI', 'Telefono', 'Email'], example: ['Ana', 'Torres', '44444444', '999999999', 'ana@mail.com'] },
  sections: { headers: ['Sede', 'Salon', 'Turno', 'NombreSeccion'], example: ['Sede Central', 'A11', 'Mañana', ''] },
  sedes: { headers: ['Nombre'], example: ['Sede Central'] },
  areas: { headers: ['Nombre'], example: ['Matemáticas'] },
  cursos: { headers: ['Nombre', 'Area'], example: ['Álgebra', 'Matemáticas'] },
  turnos: { headers: ['Nombre', 'Slot1Inicio', 'Slot1Fin', 'Slot2Inicio', 'Slot2Fin'], example: ['Mañana', '08:00', '11:00', '11:00', '14:00'] },
  salones: { headers: ['Sede', 'Salon'], example: ['Sede Central', 'A11'] },
  teachers: {
    headers: ['Nombres', 'Apellidos', 'DNI', 'Telefono', 'Email', 'Cursos', 'Turnos', 'Sedes', 'Prioridad', 'AñosExp', 'MaxSesiones', 'MaxSecciones'],
    example: ['Juan', 'Pérez', '11111111', '999999999', '', 'Álgebra; Geometría', 'Mañana; Tarde', 'Sede Central; Sede Norte', '8', '10', '20', '5'],
  },
  alumnos: {
    headers: ['Nombres', 'Apellidos', 'DNI', 'Telefono', 'Email', 'Sede', 'Turno', 'Seccion', 'Periodo', 'Plan', 'PrimerPago', 'FechaInscripcion'],
    example: ['Ana', 'Torres', '90000001', '999999999', '', 'Sede Central', 'Mañana', 'A11 - M', 'Semestre 2026-II', 'Mensual regular', 'SI', '2026-07-15'],
  },
  horario: { headers: ['Seccion', 'Dia', 'Slot', 'Curso', 'DocenteDNI'], example: ['A11 - M', 'Lunes', '1', 'Álgebra', '11111111'] },
};

const normalizeDni = (raw: any): string => {
  let s = String(raw ?? '').trim();
  if (s.endsWith('.0')) s = s.slice(0, -2);
  s = s.replace(/\D/g, '');
  if (s.length === 7) s = '0' + s;
  return s;
};

@Injectable()
export class ImportsService {
  constructor(private prisma: PrismaService) {}

  async generateTemplate(type: string): Promise<Buffer> {
    const tpl = IMPORT_TEMPLATES[type];
    if (!tpl) throw new BadRequestException('Plantilla no válida');
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Datos');
    ws.addRow(tpl.headers); ws.getRow(1).font = { bold: true };
    ws.addRow(tpl.example);
    const b = await wb.xlsx.writeBuffer();
    return Buffer.from(b);
  }

  private async parseRows(buffer: Buffer | ArrayBuffer): Promise<string[][]> {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as ArrayBuffer);
    const ws = wb.worksheets[0];
    if (!ws) throw new BadRequestException('El archivo no tiene hojas');
    const rows: string[][] = [];
    ws.eachRow((row, n) => {
      if (n === 1) return;
      const values: string[] = [];
      row.eachCell({ includeEmpty: true }, (cell) => {
        const v = cell.value;
        values.push(v === null || v === undefined ? '' : String(v).trim());
      });
      if (values.some((v) => v !== '')) rows.push(values);
    });
    return rows;
  }

  private splitList(v?: string): string[] {
    return (v || '').split(/[;,]/).map((x) => x.trim()).filter(Boolean);
  }

  private parseDateLoose(v?: string): Date | null {
    if (!v) return null;
    const s = String(v).trim();
    let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    m = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
    if (m) return new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }

  async importTeachers(buffer: Buffer): Promise<ImportResult> {
    const rows = await this.parseRows(buffer);
    const r: ImportResult = { created: 0, skipped: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const [firstName, lastName, dni, phone, email, cursosStr, turnosStr, sedesStr, prioStr, yrsStr, maxSesStr, maxSecStr] = rows[i];
      if (!firstName || !lastName || !dni) { r.errors.push({ row: i + 2, reason: 'Nombres, Apellidos y DNI obligatorios' }); continue; }

      const person = await this.prisma.person.upsert({
        where: { dni },
        update: { firstName, lastName, phone: phone || null, email: email || null },
        create: { firstName, lastName, dni, phone: phone || null, email: email || null },
      });

      const profile = await this.prisma.teacherProfile.upsert({
        where: { personId: person.id },
        update: {
          ...(prioStr ? { priority: parseInt(prioStr) } : {}),
          ...(yrsStr ? { yearsExperience: parseInt(yrsStr) } : {}),
          ...(maxSesStr ? { maxSessionsPerWeek: parseInt(maxSesStr) } : {}),
          ...(maxSecStr ? { maxSections: parseInt(maxSecStr) } : {}),
        },
        create: {
          personId: person.id,
          priority: parseInt(prioStr) || 5,
          yearsExperience: parseInt(yrsStr) || 0,
          maxSessionsPerWeek: parseInt(maxSesStr) || 20,
          maxSections: parseInt(maxSecStr) || 5,
        },
      });

      // Cursos que puede dictar (se reemplazan si se listan)
      const courseNames = this.splitList(cursosStr);
      if (courseNames.length) {
        await this.prisma.teacherCourse.deleteMany({ where: { teacherProfileId: profile.id } });
        for (const cn of courseNames) {
          const course = await this.prisma.course.findFirst({ where: { name: cn } });
          if (!course) { r.errors.push({ row: i + 2, reason: `Curso no encontrado: ${cn}` }); continue; }
          await this.prisma.teacherCourse.create({ data: { teacherProfileId: profile.id, courseId: course.id } });
        }
      }

      // Turnos
      const turnoNames = this.splitList(turnosStr);
      if (turnoNames.length) {
        await this.prisma.teacherTurno.deleteMany({ where: { teacherProfileId: profile.id } });
        for (const tn of turnoNames) {
          const turno = await this.prisma.turno.findFirst({ where: { name: tn } });
          if (!turno) { r.errors.push({ row: i + 2, reason: `Turno no encontrado: ${tn}` }); continue; }
          await this.prisma.teacherTurno.create({ data: { teacherProfileId: profile.id, turnoId: turno.id } });
        }
      }

      // Sedes
      const sedeNames = this.splitList(sedesStr);
      if (sedeNames.length) {
        await this.prisma.teacherSede.deleteMany({ where: { teacherProfileId: profile.id } });
        for (const sn of sedeNames) {
          const sede = await this.prisma.sede.findFirst({ where: { name: sn } });
          if (!sede) { r.errors.push({ row: i + 2, reason: `Sede no encontrada: ${sn}` }); continue; }
          await this.prisma.teacherSede.create({ data: { teacherProfileId: profile.id, sedeId: sede.id } });
        }
      }

      r.created++;
    }
    return r;
  }

  private async importPeople(buffer: Buffer, isTeacher: boolean): Promise<ImportResult> {
    const rows = await this.parseRows(buffer);
    const result: ImportResult = { created: 0, skipped: 0, errors: [] };
    for (let i = 0; i < rows.length; i++) {
      const [firstName, lastName, dniRaw, phone, email] = rows[i];
      const dni = normalizeDni(dniRaw);
      if (!firstName || !lastName) { result.errors.push({ row: i + 2, reason: 'Nombres y Apellidos obligatorios' }); continue; }
      if (dni && await this.prisma.person.findUnique({ where: { dni } })) { result.skipped++; continue; }

      const person = await this.prisma.person.create({
        data: { firstName, lastName, dni: dni || null, phone: phone || null, email: email || null },
      });
      if (isTeacher) {
        await this.prisma.teacherProfile.create({ data: { personId: person.id, priority: 5 } });
      }
      result.created++;
    }
    return result;
  }

  async importSections(buffer: Buffer): Promise<ImportResult> {
    const rows = await this.parseRows(buffer);
    const result: ImportResult = { created: 0, skipped: 0, errors: [] };
    for (let i = 0; i < rows.length; i++) {
      const [sedeName, salonName, turnoName, sectionName] = rows[i];
      if (!sedeName || !salonName || !turnoName) { result.errors.push({ row: i + 2, reason: 'Sede, Salón y Turno obligatorios' }); continue; }

      let sede = await this.prisma.sede.findFirst({ where: { name: sedeName } });
      if (!sede) sede = await this.prisma.sede.create({ data: { name: sedeName } });

      const turno = await this.prisma.turno.findFirst({ where: { name: turnoName } });
      if (!turno) { result.errors.push({ row: i + 2, reason: `Turno no encontrado: ${turnoName}` }); continue; }

      let classroom = await this.prisma.classroom.findFirst({ where: { name: salonName, sedeId: sede.id } });
      if (!classroom) classroom = await this.prisma.classroom.create({ data: { name: salonName, sedeId: sede.id } });

      const exists = await this.prisma.section.findFirst({ where: { classroomId: classroom.id, turnoId: turno.id } });
      if (exists) { result.skipped++; continue; }

      await this.prisma.section.create({
        data: { name: sectionName || `${salonName} - ${turno.name.charAt(0)}`, classroomId: classroom.id, turnoId: turno.id },
      });
      result.created++;
    }
    return result;
  }

  private DAY_MAP: Record<string, number> = { lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5 };
  private parseDay(v: string): number {
    const n = parseInt(v);
    if (n >= 1 && n <= 5) return n;
    const key = v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    return this.DAY_MAP[key] || 0;
  }

  async importFile(type: string, buffer: Buffer, blockId?: string): Promise<ImportResult> {
    if (type === 'students') return this.importPeople(buffer, false);
    if (type === 'sections') return this.importSections(buffer);
    if (type === 'sedes') return this.importSedes(buffer);
    if (type === 'areas') return this.importAreas(buffer);
    if (type === 'cursos') return this.importCursos(buffer);
    if (type === 'turnos') return this.importTurnos(buffer);
    if (type === 'salones') return this.importSalones(buffer);
    if (type === 'alumnos') return this.importStudents(buffer);
    if (type === 'teachers') return this.importTeachers(buffer);
    if (type === 'horario') return this.importSchedule(buffer, blockId!);
    throw new BadRequestException('Tipo no válido');
  }

  async importSedes(buffer: Buffer): Promise<ImportResult> {
    const rows = await this.parseRows(buffer);
    const r: ImportResult = { created: 0, skipped: 0, errors: [] };
    for (let i = 0; i < rows.length; i++) {
      const [name] = rows[i];
      if (!name) { r.errors.push({ row: i + 2, reason: 'Nombre obligatorio' }); continue; }
      const ex = await this.prisma.sede.findFirst({ where: { name } });
      if (ex) { r.skipped++; continue; }
      await this.prisma.sede.create({ data: { name } }); r.created++;
    }
    return r;
  }

  async importAreas(buffer: Buffer): Promise<ImportResult> {
    const rows = await this.parseRows(buffer);
    const r: ImportResult = { created: 0, skipped: 0, errors: [] };
    for (let i = 0; i < rows.length; i++) {
      const [name] = rows[i];
      if (!name) { r.errors.push({ row: i + 2, reason: 'Nombre obligatorio' }); continue; }
      const ex = await this.prisma.area.findFirst({ where: { name } });
      if (ex) { r.skipped++; continue; }
      await this.prisma.area.create({ data: { name } }); r.created++;
    }
    return r;
  }

  async importCursos(buffer: Buffer): Promise<ImportResult> {
    const rows = await this.parseRows(buffer);
    const r: ImportResult = { created: 0, skipped: 0, errors: [] };
    for (let i = 0; i < rows.length; i++) {
      const [name, areaName] = rows[i];
      if (!name || !areaName) { r.errors.push({ row: i + 2, reason: 'Nombre y Área obligatorios' }); continue; }
      let area = await this.prisma.area.findFirst({ where: { name: areaName } });
      if (!area) area = await this.prisma.area.create({ data: { name: areaName } });
      const ex = await this.prisma.course.findFirst({ where: { name, areaId: area.id } });
      if (ex) { r.skipped++; continue; }
      await this.prisma.course.create({ data: { name, areaId: area.id } }); r.created++;
    }
    return r;
  }

  async importTurnos(buffer: Buffer): Promise<ImportResult> {
    const rows = await this.parseRows(buffer);
    const r: ImportResult = { created: 0, skipped: 0, errors: [] };
    for (let i = 0; i < rows.length; i++) {
      const [name, s1i, s1f, s2i, s2f] = rows[i];
      if (!name) { r.errors.push({ row: i + 2, reason: 'Nombre obligatorio' }); continue; }
      const ex = await this.prisma.turno.findFirst({ where: { name } });
      if (ex) { r.skipped++; continue; }
      await this.prisma.turno.create({ data: { name, slot1Start: s1i || '08:00', slot1End: s1f || '11:00', slot2Start: s2i || '11:00', slot2End: s2f || '14:00' } }); r.created++;
    }
    return r;
  }

  async importSalones(buffer: Buffer): Promise<ImportResult> {
    const rows = await this.parseRows(buffer);
    const r: ImportResult = { created: 0, skipped: 0, errors: [] };
    for (let i = 0; i < rows.length; i++) {
      const [sedeName, salonName] = rows[i];
      if (!sedeName || !salonName) { r.errors.push({ row: i + 2, reason: 'Sede y Salón obligatorios' }); continue; }
      let sede = await this.prisma.sede.findFirst({ where: { name: sedeName } });
      if (!sede) sede = await this.prisma.sede.create({ data: { name: sedeName } });
      const ex = await this.prisma.classroom.findFirst({ where: { name: salonName, sedeId: sede.id } });
      if (ex) { r.skipped++; continue; }
      await this.prisma.classroom.create({ data: { name: salonName, sedeId: sede.id } }); r.created++;
    }
    return r;
  }

  async importStudents(buffer: Buffer): Promise<ImportResult> {
    const rows = await this.parseRows(buffer);
    const r: ImportResult = { created: 0, skipped: 0, errors: [] };
    for (let i = 0; i < rows.length; i++) {
      const [firstName, lastName, dni, phone, email, sedeName, turnoName, secName, periodName, planName, primerPagoStr, fechaInscStr] = rows[i];
      if (!firstName || !lastName) { r.errors.push({ row: i + 2, reason: 'Nombres y Apellidos obligatorios' }); continue; }

      // Person (crear o reutilizar)
      const finalEmail = email || (dni ? `${firstName.charAt(0).toLowerCase()}${dni}@suite.edu` : null);

      let person = dni ? await this.prisma.person.findUnique({ where: { dni } }) : null;
      if (!person) {
        person = await this.prisma.person.create({ data: { firstName, lastName, dni: dni || null, phone: phone || null, email: finalEmail } });
      } else if (finalEmail && !person.email) {
        person = await this.prisma.person.update({ where: { id: person.id }, data: { email: finalEmail } });
      }

      // Sección + período
      const section = await this.prisma.section.findFirst({
        where: { name: secName, classroom: { sede: { name: sedeName } }, turno: { name: turnoName } },
      });
      const period = await this.prisma.period.findFirst({ where: { name: periodName } });
      if (!section || !period) { r.errors.push({ row: i + 2, reason: `Sección o período no encontrado (${secName} / ${periodName})` }); continue; }

      const existing = await this.prisma.enrollment.findFirst({ where: { studentId: person.id, periodId: period.id, status: 'ACTIVE' } });
      if (existing) { r.skipped++; continue; }

      const enrolledAt = this.parseDateLoose(fechaInscStr) ?? new Date();

      const enrollment = await this.prisma.enrollment.create({
        data: { studentId: person.id, sectionId: section.id, periodId: period.id, status: 'ACTIVE', enrolledAt },
      });

      // Plan de pago opcional
      if (planName) {
        const plan = await this.prisma.paymentPlan.findFirst({ where: { name: planName } });
        if (plan) {
          const amount = Number(plan.amount) / plan.installments;
          const firstPaid = (primerPagoStr || '').trim().toUpperCase() === 'SI';
          for (let k = 0; k < plan.installments; k++) {
            const due = new Date(enrolledAt); due.setUTCMonth(due.getUTCMonth() + k); due.setUTCDate(1);
            const paid = k === 0 && firstPaid;
            await this.prisma.payment.create({
              data: {
                enrollmentId: enrollment.id, paymentPlanId: plan.id, installment: k + 1, amount, dueDate: due,
                status: paid ? 'PAID' : 'PENDING',
                paidAmount: paid ? amount : null,
                paidDate: paid ? enrolledAt : null,
              },
            });
          }
        }
      }
      r.created++;
    }
    return r;
  }

  async importSchedule(buffer: Buffer, blockId: string): Promise<ImportResult> {
    if (!blockId) throw new BadRequestException('Selecciona un bloque para importar el horario');
    const rows = await this.parseRows(buffer);
    const r: ImportResult = { created: 0, skipped: 0, errors: [] };
    const matched: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const [secName, diaStr, slotStr, courseName, dni] = rows[i];
      const day = this.parseDay(diaStr); const slot = parseInt(slotStr);
      if (!secName || !day || !slot || !courseName) { r.errors.push({ row: i + 2, reason: 'Datos incompletos' }); continue; }

      const section = await this.prisma.section.findFirst({ where: { name: secName } });
      const course = await this.prisma.course.findFirst({ where: { name: courseName } });
      const teacher = dni ? await this.prisma.person.findUnique({ where: { dni }, include: { teacherProfile: true } }) : null;
      if (!section || !course) { r.errors.push({ row: i + 2, reason: `Sección o curso no encontrado (${secName} / ${courseName})` }); continue; }

      const teacherId = teacher?.teacherProfile?.id || null;

      // ===== Pre-validación: cruce de docente (misma día+slot en OTRA sección) =====
      if (teacherId) {
        const busy = await this.prisma.scheduleSession.findFirst({
          where: { blockId, teacherProfileId: teacherId, dayOfWeek: day, slot, turnoId: section.turnoId, NOT: { sectionId: section.id } },
        });
        if (busy) {
          r.errors.push({ row: i + 2, reason: `Cruce: ${teacher.lastName} ${teacher.firstName} ya ocupa día ${day} slot ${slot} en el mismo turno` });
          continue;
        }
      }

      const existing = await this.prisma.scheduleSession.findFirst({ where: { blockId, sectionId: section.id, dayOfWeek: day, slot } });
      try {
        if (existing) {
          await this.prisma.scheduleSession.update({
            where: { id: existing.id },
            data: { courseId: course.id, teacherProfileId: teacherId || existing.teacherProfileId },
          });
          matched.push(existing.id); r.skipped++;
        } else {
          const created = await this.prisma.scheduleSession.create({
            data: { blockId, sectionId: section.id, courseId: course.id, teacherProfileId: teacherId, dayOfWeek: day, slot, turnoId: section.turnoId },
          });
          matched.push(created.id); r.created++;
        }
      } catch (e: any) {
        // Cualquier restricción única se reporta como error de fila, no como 500
        r.errors.push({ row: i + 2, reason: `Conflicto (${secName} · ${courseName} · día ${day} slot ${slot}): restricción única` });
      }
    }

    // Elimina sesiones que ya no están, SOLO si no tienen asistencias
    const remaining = await this.prisma.scheduleSession.findMany({
      where: { blockId, NOT: { id: { in: matched } } },
      include: { _count: { select: { attendances: true } } },
    });
    for (const s of remaining) {
      if (s._count.attendances === 0) await this.prisma.scheduleSession.delete({ where: { id: s.id } });
    }
    return r;
  }
}