import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as ExcelJS from 'exceljs';

export interface ImportResult { created: number; skipped: number; errors: { row: number; reason: string }[]; }

export const IMPORT_TEMPLATES: Record<string, { headers: string[]; example: string[] }> = {
  teachers: { headers: ['Nombres', 'Apellidos', 'DNI', 'Telefono', 'Email'], example: ['Juan', 'Pérez García', '12345678', '999999999', 'juan@mail.com'] },
  students: { headers: ['Nombres', 'Apellidos', 'DNI', 'Telefono', 'Email'], example: ['Ana', 'Torres', '44444444', '999999999', 'ana@mail.com'] },
  sections: { headers: ['Sede', 'Salon', 'Turno', 'NombreSeccion'], example: ['Sede Central', 'A11', 'Mañana', ''] },
  sedes: { headers: ['Nombre'], example: ['Sede Central'] },
  areas: { headers: ['Nombre'], example: ['Matemáticas'] },
  cursos: { headers: ['Nombre', 'Area'], example: ['Álgebra', 'Matemáticas'] },
  turnos: { headers: ['Nombre', 'Slot1Inicio', 'Slot1Fin', 'Slot2Inicio', 'Slot2Fin'], example: ['Mañana', '08:00', '11:00', '11:00', '14:00'] },
  salones: { headers: ['Sede', 'Salon'], example: ['Sede Central', 'A11'] },
  alumnos: { headers: ['Nombres', 'Apellidos', 'DNI', 'Telefono', 'Email', 'Sede', 'Turno', 'Seccion', 'Periodo', 'Plan', 'PrimerPago'], example: ['Ana', 'Torres', '90000001', '999999999', '', 'Sede Central', 'Mañana', 'A11 - M', 'Semestre 2026-II', 'Mensual regular', 'SI'] },
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
    if (type === 'teachers') return this.importPeople(buffer, true);
    if (type === 'students') return this.importPeople(buffer, false);
    if (type === 'sections') return this.importSections(buffer);
    if (type === 'sedes') return this.importSedes(buffer);
    if (type === 'areas') return this.importAreas(buffer);
    if (type === 'cursos') return this.importCursos(buffer);
    if (type === 'turnos') return this.importTurnos(buffer);
    if (type === 'salones') return this.importSalones(buffer);
    if (type === 'alumnos') return this.importStudents(buffer);
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
      const [firstName, lastName, dni, phone, email, sedeName, turnoName, secName, periodName, planName, primerPagoStr] = rows[i];

      if (!firstName || !lastName) { r.errors.push({ row: i + 2, reason: 'Nombres y Apellidos obligatorios' }); continue; }

      // Person (crear o reutilizar)
      let person = dni ? await this.prisma.person.findUnique({ where: { dni } }) : null;
      if (!person) {
        person = await this.prisma.person.create({ data: { firstName, lastName, dni: dni || null, phone: phone || null, email: email || null } });
      }

      // Sección + período
      const section = await this.prisma.section.findFirst({
        where: { name: secName, classroom: { sede: { name: sedeName } }, turno: { name: turnoName } },
      });
      const period = await this.prisma.period.findFirst({ where: { name: periodName } });
      if (!section || !period) { r.errors.push({ row: i + 2, reason: `Sección o período no encontrado (${secName} / ${periodName})` }); continue; }

      const existing = await this.prisma.enrollment.findFirst({ where: { studentId: person.id, periodId: period.id, status: 'ACTIVE' } });
      if (existing) { r.skipped++; continue; }

      const enrollment = await this.prisma.enrollment.create({ data: { studentId: person.id, sectionId: section.id, periodId: period.id, status: 'ACTIVE' } });

      // Plan de pago opcional
      if (planName) {
        const plan = await this.prisma.paymentPlan.findFirst({ where: { name: planName } });
        if (plan) {
          const amount = Number(plan.amount) / plan.installments;
          const firstPaid = (primerPagoStr || '').trim().toUpperCase() === 'SI';
          const today = new Date();
          for (let k = 0; k < plan.installments; k++) {
            const due = new Date(today); due.setUTCMonth(due.getUTCMonth() + k); due.setUTCDate(1);
            const paid = k === 0 && firstPaid;
            await this.prisma.payment.create({
              data: {
                enrollmentId: enrollment.id, paymentPlanId: plan.id, installment: k + 1, amount, dueDate: due,
                status: paid ? 'PAID' : 'PENDING',
                paidAmount: paid ? amount : null,
                paidDate: paid ? today : null,
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

      const existing = await this.prisma.scheduleSession.findFirst({ where: { blockId, sectionId: section.id, dayOfWeek: day, slot } });
      if (existing) {
        // Actualiza pero MANTIENE el id → conserva asistencias
        await this.prisma.scheduleSession.update({ where: { id: existing.id }, data: { courseId: course.id, teacherProfileId: teacher?.teacherProfile?.id || existing.teacherProfileId } });
        matched.push(existing.id); r.skipped++;
      } else {
        const created = await this.prisma.scheduleSession.create({ data: { blockId, sectionId: section.id, courseId: course.id, teacherProfileId: teacher?.teacherProfile?.id || null, dayOfWeek: day, slot } });
        matched.push(created.id); r.created++;
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