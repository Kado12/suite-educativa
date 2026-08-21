import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as ExcelJS from 'exceljs';

export type GroupBy = 'teacher' | 'course' | 'sede' | 'area';
export type ReportMode = 'week' | 'month' | 'period' | 'block';

export interface ConsolidatedParams {
  periodId: string;
  mode: ReportMode;
  weekNumber?: number;
  month?: string;
  blockId?: string;
  groupBy: GroupBy;
  sedeId?: string;
  areaId?: string;
  courseId?: string;
  teacherProfileId?: string;
}

export interface ConsolidatedRow {
  key: string; label: string; dni?: string; area?: string; course?: string;
  hours: number; presents: number; absents: number; lateMinutes: number; attendanceRate: number;
}

const SESSION_HOURS = 3;
const addDays = (d: Date, days: number): Date => { const r = new Date(d); r.setUTCDate(r.getUTCDate() + days); return r; };
const formatDate = (d: Date): string => d.toISOString().split('T')[0];

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  private async resolveRange(period: any, params: ConsolidatedParams) {
    if (params.mode === 'week') {
      const w = params.weekNumber || 1;
      const start = addDays(period.startDate, (w - 1) * 7);
      return { start, end: addDays(start, 4) };
    }
    if (params.mode === 'month' && params.month) {
      const [y, m] = params.month.split('-').map(Number);
      return { start: new Date(Date.UTC(y, m - 1, 1)), end: new Date(Date.UTC(y, m, 0)) };
    }
    if (params.mode === 'block' && params.blockId) {
      const block = await this.prisma.block.findUnique({ where: { id: params.blockId } });
      if (!block) throw new NotFoundException('Bloque no encontrado');
      return { start: addDays(period.startDate, (block.startWeek - 1) * 7), end: addDays(period.startDate, block.endWeek * 7 - 1) };
    }
    return { start: period.startDate, end: addDays(period.startDate, period.weeks * 7 - 1) };
  }

  async getConsolidated(params: ConsolidatedParams): Promise<ConsolidatedRow[]> {
    const period = await this.prisma.period.findUnique({ where: { id: params.periodId } });
    if (!period) throw new NotFoundException('Período no encontrado');
    const { start, end } = await this.resolveRange(period, params);

    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        date: { gte: start, lte: end },
        session: {
          block: { periodId: params.periodId },
          ...(params.blockId ? { blockId: params.blockId } : {}),
          ...(params.teacherProfileId ? { teacherProfileId: params.teacherProfileId } : {}),
          ...(params.sedeId ? { section: { classroom: { sedeId: params.sedeId } } } : {}),
          ...(params.courseId ? { courseId: params.courseId } : {}),
          ...(params.areaId ? { course: { areaId: params.areaId } } : {}),
        },
      },
      include: {
        session: {
          include: {
            course: { include: { area: true } },
            section: { include: { classroom: { include: { sede: true } } } },
            teacherProfile: { include: { person: true } },
          },
        },
      },
    });

    const map = new Map<string, ConsolidatedRow>();
    for (const r of records) {
      const s = r.session;
      let key: string, label: string, dni: string, area: string, course: string;
      switch (params.groupBy) {
        case 'teacher':
          key = `${s.teacherProfileId}::${s.courseId}`;
          label = `${s.teacherProfile.person.lastName}, ${s.teacherProfile.person.firstName}`;
          dni = s.teacherProfile.person.dni || undefined;
          course = s.course.name;
          break;
        case 'course':
          key = s.courseId; label = s.course.name; area = s.course.area.name; break;
        case 'sede':
          key = s.section.classroom.sedeId; label = s.section.classroom.sede.name; break;
        case 'area':
          key = s.course.areaId; label = s.course.area.name; break;
      }
      if (!map.has(key)) map.set(key, { key, label, dni, area, course, hours: 0, presents: 0, absents: 0, lateMinutes: 0, attendanceRate: 0 });
      const row = map.get(key)!;
      if (r.status === 'PRESENT') { row.presents++; row.hours += SESSION_HOURS; row.lateMinutes += r.lateMinutes; }
      else row.absents++;
    }

    return Array.from(map.values())
      .map((row) => ({ ...row, attendanceRate: row.presents + row.absents > 0 ? Math.round((row.presents / (row.presents + row.absents)) * 100) : 0 }))
      .sort((a, b) => a.label.localeCompare(b.label) || (a.course || '').localeCompare(b.course || ''));
  }

  async exportExcel(params: ConsolidatedParams): Promise<Buffer> {
    const period = await this.prisma.period.findUnique({ where: { id: params.periodId } });
    if (!period) throw new NotFoundException('Período no encontrado');
    const rows = await this.getConsolidated(params);
    const { start, end } = await this.resolveRange(period, params);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Consolidado', { views: [{ state: 'frozen', ySplit: 3 }] });

    const modeLabel = params.mode === 'week' ? `SEMANA ${params.weekNumber}` : params.mode === 'month' ? `MES ${params.month}` : params.mode === 'block' ? 'BLOQUE' : 'PERÍODO COMPLETO';
    const groupLabel = { teacher: 'POR DOCENTE', course: 'POR CURSO', sede: 'POR SEDE', area: 'POR ÁREA' }[params.groupBy];

    const headerLabels: string[] = [{ teacher: 'Docente', course: 'Curso', sede: 'Sede', area: 'Área' }[params.groupBy]];
    const columnDefs: any[] = [{ key: 'label', width: 30 }];
    if (params.groupBy === 'teacher') { headerLabels.push('DNI', 'Curso'); columnDefs.push({ key: 'dni', width: 12 }, { key: 'course', width: 24 }); }
    if (params.groupBy === 'course') { headerLabels.push('Área'); columnDefs.push({ key: 'area', width: 20 }); }
    headerLabels.push('Horas', 'Asistencias', 'Faltas', 'Tardanza (min)', '% Asistencia');
    columnDefs.push({ key: 'hours', width: 8 }, { key: 'presents', width: 10 }, { key: 'absents', width: 8 }, { key: 'lateMinutes', width: 12 }, { key: 'attendanceRate', width: 10 });

    ws.columns = columnDefs;
    const colCount = columnDefs.length;

    ws.mergeCells(1, 1, 1, colCount);
    const t = ws.getCell('A1'); t.value = `CONSOLIDADO ${groupLabel}`; t.font = { bold: true, size: 14 }; t.alignment = { horizontal: 'center' };
    ws.mergeCells(2, 1, 2, colCount);
    const st = ws.getCell('A2'); st.value = `Período ${period.name} | ${modeLabel} | ${formatDate(start)} al ${formatDate(end)}`; st.font = { size: 10, color: { argb: 'FF6B7280' } }; st.alignment = { horizontal: 'center' };

    const hr = ws.getRow(3);
    headerLabels.forEach((l, i) => {
      const c = hr.getCell(i + 1); c.value = l;
      c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
      c.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    hr.height = 22;

    rows.forEach((row) => {
      const r = ws.addRow(row);
      const rate = r.getCell('attendanceRate');
      rate.numFmt = '0"%"';
      if (row.attendanceRate >= 90) rate.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
      else if (row.attendanceRate >= 70) rate.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
      else rate.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
      if (row.lateMinutes > 0) r.getCell('lateMinutes').font = { color: { argb: 'FFEA580C' }, bold: true };
    });

    const totals = rows.reduce((a, r) => ({ hours: a.hours + r.hours, presents: a.presents + r.presents, absents: a.absents + r.absents, lateMinutes: a.lateMinutes + r.lateMinutes }), { hours: 0, presents: 0, absents: 0, lateMinutes: 0 });
    const tr = ws.addRow({ label: 'TOTAL', ...totals });
    tr.font = { bold: true };
    tr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };

    ws.eachRow((row, n) => { if (n < 3) return; row.eachCell((c) => { c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }; }); });

    const buffer = await wb.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}