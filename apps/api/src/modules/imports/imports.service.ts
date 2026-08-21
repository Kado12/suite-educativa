import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as ExcelJS from 'exceljs';

export interface ImportResult { created: number; skipped: number; errors: { row: number; reason: string }[]; }

export const IMPORT_TEMPLATES: Record<string, { headers: string[]; example: string[] }> = {
  teachers: { headers: ['Nombres', 'Apellidos', 'DNI', 'Telefono', 'Email'], example: ['Juan', 'Pérez García', '12345678', '999999999', 'juan@mail.com'] },
  students: { headers: ['Nombres', 'Apellidos', 'DNI', 'Telefono', 'Email'], example: ['Ana', 'Torres', '44444444', '999999999', 'ana@mail.com'] },
  sections: { headers: ['Sede', 'Salon', 'Turno', 'NombreSeccion'], example: ['Sede Central', 'A11', 'Mañana', ''] },
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

  async importFile(type: string, buffer: Buffer): Promise<ImportResult> {
    if (type === 'teachers') return this.importPeople(buffer, true);
    if (type === 'students') return this.importPeople(buffer, false);
    if (type === 'sections') return this.importSections(buffer);
    throw new BadRequestException('Tipo no válido');
  }
}