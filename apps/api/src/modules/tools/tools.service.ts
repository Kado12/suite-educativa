import { Injectable, BadRequestException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

const normalizeDni = (raw: any): string => {
  let s = String(raw ?? '').trim();
  if (s.endsWith('.0')) s = s.slice(0, -2);
  s = s.replace(/\D/g, '');
  if (s.length === 7) s = '0' + s;
  return s;
};

const normalizarTexto = (v: any): string => {
  if (v === null || v === undefined) return '';
  let s = String(v);
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  s = s.toUpperCase().replace(/[^A-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
  return s;
};

function findLongestMatch(a: string, b: string, alo: number, ahi: number, blo: number, bhi: number): [number, number, number] {
  let besti = alo, bestj = blo, bestsize = 0;
  let j2len: number[] = new Array(bhi + 1).fill(0);
  for (let i = alo; i < ahi; i++) {
    const nl: number[] = new Array(bhi + 1).fill(0);
    for (let j = blo; j < bhi; j++) {
      if (a[i] === b[j]) { const k = (nl[j + 1] = j2len[j] + 1); if (k > bestsize) { bestsize = k; besti = i - k + 1; bestj = j - k + 1; } }
    }
    j2len = nl;
  }
  return [besti, bestj, bestsize];
}
function sequenceRatio(a: string, b: string): number {
  const t = a.length + b.length;
  if (t === 0) return 1;
  const queue: [number, number, number, number][] = [[0, a.length, 0, b.length]];
  let m = 0;
  while (queue.length) {
    const [alo, ahi, blo, bhi] = queue.pop()!;
    const [i, j, k] = findLongestMatch(a, b, alo, ahi, blo, bhi);
    if (k === 0) continue;
    m += k;
    if (alo < i && blo < j) queue.push([alo, i, blo, j]);
    if (i + k < ahi && j + k < bhi) queue.push([i + k, ahi, j + k, bhi]);
  }
  return (2 * m) / t;
}

const FUZZY_THRESHOLD = 0.85;
const DIAS = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES'];

@Injectable()
export class ToolsService {
  private async parseMatrix(buffer: Buffer | ArrayBuffer): Promise<string[][]> {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as ArrayBuffer);
    const ws = wb.worksheets[0];
    if (!ws) throw new BadRequestException('Sin hojas');
    const matrix: string[][] = [];
    ws.eachRow({ includeEmpty: true }, (row) => {
      const values = (row.values as any[]).slice(1);
      matrix.push(values.map((v) => (v === null || v === undefined ? '' : String(v).trim())));
    });
    return matrix;
  }

  private async parseObjects(buffer: Buffer): Promise<{ headers: string[]; rows: Record<string, any>[] }> {
    const matrix = await this.parseMatrix(buffer);
    const headers = (matrix[0] || []).map((h) => String(h).trim()).filter(Boolean);
    const rows = matrix.slice(1).filter((r) => r.some((v) => v !== '')).map((r) => {
      const o: Record<string, any> = {};
      (matrix[0] || []).forEach((h, i) => { const name = String(h).trim(); if (name) o[name] = r[i] || ''; });
      return o;
    });
    return { headers, rows };
  }

  // ===== 1. COMPARAR POR DNI =====
  async compare(a: Buffer, b: Buffer) {
    const A = await this.parseObjects(a);
    const B = await this.parseObjects(b);
    const dniCol = (h: string[]) => h.find((x) => /^dni$/i.test(x));
    const dA = dniCol(A.headers), dB = dniCol(B.headers);
    if (!dA || !dB) throw new BadRequestException('Ambos archivos deben tener columna DNI');

    const setA = new Set(A.rows.map((r) => normalizeDni(r[dA])).filter(Boolean));
    const setB = new Set(B.rows.map((r) => normalizeDni(r[dB])).filter(Boolean));
    const onlyA = new Set([...setA].filter((x) => !setB.has(x)));
    const onlyB = new Set([...setB].filter((x) => !setA.has(x)));
    const both = new Set([...setA].filter((x) => setB.has(x)));

    return {
      summary: { totalA: A.rows.length, totalB: B.rows.length, both: both.size, onlyA: onlyA.size, onlyB: onlyB.size },
      onlyA: { headers: A.headers, rows: A.rows.filter((r) => onlyA.has(normalizeDni(r[dA]))) },
      onlyB: { headers: B.headers, rows: B.rows.filter((r) => onlyB.has(normalizeDni(r[dB]))) },
      both: { headers: A.headers, rows: A.rows.filter((r) => both.has(normalizeDni(r[dA]))) },
    };
  }

  // ===== 2. TRANSFORMAR HORARIO =====
  async transformSchedule(buffer: Buffer) {
    const matrix = await this.parseMatrix(buffer);
    let headerIdx = -1;
    for (let i = 0; i < matrix.length; i++) {
      const upper = matrix[i].map((v) => v.toUpperCase());
      if (DIAS.some((d) => upper.includes(d))) { headerIdx = i; break; }
    }
    if (headerIdx === -1) throw new BadRequestException('No se detectó la fila de días');
    const headers = matrix[headerIdx].map((h) => h.toUpperCase());

    const registros: any[] = [];
    for (let i = headerIdx + 1; i < matrix.length; i += 2) {
      const fc = matrix[i] || [];
      const fd = matrix[i + 1] || [];
      const aula = (fc[0] || '').trim();
      headers.forEach((dia, col) => {
        if (DIAS.includes(dia)) {
          const curso = (fc[col] || '').trim();
          const docente = (fd[col] || '').trim();
          if (curso && docente && curso.toUpperCase() !== 'NAN') registros.push({ AULA: aula, DOCENTE: docente, CURSO: curso, DIA_SEMANA: dia });
        }
      });
    }
    const ord: Record<string, number> = { LUNES: 0, MARTES: 1, MIERCOLES: 2, JUEVES: 3, VIERNES: 4 };
    registros.sort((x, y) => x.AULA.localeCompare(y.AULA) || ord[x.DIA_SEMANA] - ord[y.DIA_SEMANA] || x.CURSO.localeCompare(y.CURSO));
    return { rows: registros, total: registros.length };
  }

  // ===== 3. CRUZAR HORARIO CON DOCENTES =====
  async cross(infoBuf: Buffer, schedBuf: Buffer) {
    const info = await this.parseObjects(infoBuf);
    const sched = await this.parseObjects(schedBuf);
    const nCol = info.headers.find((h) => /nombres?/i.test(h));
    const aCol = info.headers.find((h) => /apellidos?/i.test(h));
    const dCol = info.headers.find((h) => /^dni$/i.test(h));
    const docCol = sched.headers.find((h) => /docente/i.test(h));
    if (!nCol || !aCol || !dCol) throw new BadRequestException('Docentes necesita NOMBRES, APELLIDOS, DNI');
    if (!docCol) throw new BadRequestException('Horario necesita DOCENTE');

    const teachers = info.rows.map((r) => {
      const n = normalizarTexto(r[nCol]), a = normalizarTexto(r[aCol]);
      const claves = new Set<string>();
      if (a && n) { claves.add(`${a} ${n}`); claves.add(`${n} ${a}`); }
      if (a) claves.add(a); if (n) claves.add(n);
      const pa = a.split(' '), pn = n.split(' ');
      if (pa[0] && pn[0]) { claves.add(`${pa[0]} ${pn[0]}`); claves.add(`${pn[0]} ${pa[0]}`); }
      return { dni: normalizeDni(r[dCol]), claves, recon: `${a} ${n}`.trim(), reconInv: `${n} ${a}`.trim() };
    });
    const dict = new Map<string, number>();
    teachers.forEach((t, idx) => t.claves.forEach((c) => c && dict.set(c, idx)));

    const buscar = (nombre: string) => {
      const norm = normalizarTexto(nombre);
      if (!norm) return { dni: null, conf: 0, metodo: 'VACIO' };
      if (dict.has(norm)) return { dni: teachers[dict.get(norm)!].dni, conf: 1, metodo: 'EXACTO' };
      let best = 0, bi = -1;
      teachers.forEach((t, idx) => {
        const s = Math.max(sequenceRatio(norm, t.recon), sequenceRatio(norm, t.reconInv));
        if (s > best) { best = s; bi = idx; }
      });
      if (best >= FUZZY_THRESHOLD && bi >= 0) return { dni: teachers[bi].dni, conf: Math.round(best * 1000) / 1000, metodo: 'FUZZY' };
      return { dni: null, conf: 0, metodo: 'NO_ENCONTRADO' };
    };

    const rows = sched.rows.map((r) => {
      const m = buscar(r[docCol]);
      return { ...r, DNI: m.dni || '', CONFIANZA: m.conf, METODO: m.metodo };
    });
    const exact = rows.filter((r) => r.METODO === 'EXACTO').length;
    const fuzzy = rows.filter((r) => r.METODO === 'FUZZY').length;
    const notFound = rows.filter((r) => r.METODO === 'NO_ENCONTRADO' || r.METODO === 'VACIO');
    return { summary: { total: rows.length, exact, fuzzy, notFound: notFound.length }, rows, notFound };
  }

  // ===== EXPORTS =====
  async compareExport(a: Buffer, b: Buffer): Promise<Buffer> {
    const r = await this.compare(a, b);
    const wb = new ExcelJS.Workbook();
    const add = (name: string, headers: string[], rows: any[]) => {
      const ws = wb.addWorksheet(name);
      ws.addRow(headers); ws.getRow(1).font = { bold: true };
      rows.forEach((row) => ws.addRow(headers.map((h) => row[h] ?? '')));
    };
    const res = wb.addWorksheet('RESUMEN');
    res.addRow(['DESCRIPCION', 'CANTIDAD']); res.getRow(1).font = { bold: true };
    res.addRows([['Total A', r.summary.totalA], ['Total B', r.summary.totalB], ['En ambos', r.summary.both], ['Solo A', r.summary.onlyA], ['Solo B', r.summary.onlyB]]);
    add('SOLO_EN_TOTAL', r.onlyA.headers, r.onlyA.rows);
    add('SOLO_EN_OTRO', r.onlyB.headers, r.onlyB.rows);
    add('EN_AMBOS', r.both.headers, r.both.rows);
    return Buffer.from(await wb.xlsx.writeBuffer());
  }

  async scheduleExport(buffer: Buffer): Promise<Buffer> {
    const r = await this.transformSchedule(buffer);
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Horario Ordenado');
    ws.columns = [{ header: 'AULA', key: 'AULA', width: 10 }, { header: 'DOCENTE', key: 'DOCENTE', width: 26 }, { header: 'CURSO', key: 'CURSO', width: 22 }, { header: 'DIA_SEMANA', key: 'DIA_SEMANA', width: 12 }];
    ws.getRow(1).font = { bold: true };
    r.rows.forEach((row) => ws.addRow(row));
    return Buffer.from(await wb.xlsx.writeBuffer());
  }

  async crossExport(a: Buffer, b: Buffer): Promise<Buffer> {
    const r = await this.cross(a, b);
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('HORARIO_CON_DNI');
    const headers = r.rows.length ? Object.keys(r.rows[0]) : [];
    ws.addRow(headers); ws.getRow(1).font = { bold: true };
    r.rows.forEach((row) => ws.addRow(headers.map((h) => row[h] ?? '')));
    const nf = wb.addWorksheet('NO_ENCONTRADOS');
    nf.addRow(['DOCENTE', 'DNI']); nf.getRow(1).font = { bold: true };
    r.notFound.forEach((row: any) => nf.addRow([row.DOCENTE, row.DNI || '']));
    return Buffer.from(await wb.xlsx.writeBuffer());
  }

    // ===== PREVIEW: primeras filas de un archivo =====
  async preview(buffer: Buffer | ArrayBuffer, maxRows = 5): Promise<{ headers: string[]; rows: any[][] }> {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as ArrayBuffer);
    const ws = wb.worksheets[0];
    if (!ws) throw new BadRequestException('El archivo no tiene hojas');

    const headers: string[] = [];
    const rows: any[][] = [];
    let count = 0;

    ws.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      const values = (row.values as any[]).slice(1).map((v) => (v === null || v === undefined ? '' : String(v)));
      if (rowNumber === 1) {
        headers.push(...values);
      } else if (count < maxRows && values.some((v) => v !== '')) {
        rows.push(values);
        count++;
      }
    });

    return { headers, rows };
  }

  // ===== PLANTILLAS DE EJEMPLO =====
  async generateToolTemplate(type: string): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Ejemplo');

    if (type === 'compare') {
      ws.addRow(['DNI', 'NOMBRES', 'APELLIDOS']);
      ws.getRow(1).font = { bold: true };
      ws.addRows([
        ['12345678', 'Juan', 'Pérez'],
        ['87654321', 'María', 'Gómez'],
        ['11223344', 'Luis', 'Díaz'],
      ]);
    } else if (type === 'schedule') {
      ws.addRow(['AULA', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES']);
      ws.getRow(1).font = { bold: true };
      ws.addRow(['A11', 'Álgebra', 'Física', 'Lenguaje', 'Álgebra', 'Química']);
      ws.addRow(['', 'Juan Pérez', 'María Gómez', 'Luis Díaz', 'Juan Pérez', 'Ana Torres']);
      ws.addRow(['A12', 'Geometría', 'Historia', '', 'Biología', 'Inglés']);
      ws.addRow(['', 'Pedro Ruiz', 'Lucía Vega', '', 'Rosa Mendoza', 'Jorge Castro']);
    } else if (type === 'cross-info') {
      ws.addRow(['NOMBRES', 'APELLIDOS', 'DNI']);
      ws.getRow(1).font = { bold: true };
      ws.addRows([
        ['Juan', 'Pérez García', '12345678'],
        ['María', 'Gómez López', '87654321'],
        ['Luis', 'Díaz Torres', '11223344'],
      ]);
    } else if (type === 'cross-schedule') {
      ws.addRow(['AULA', 'DOCENTE', 'CURSO', 'DIA_SEMANA']);
      ws.getRow(1).font = { bold: true };
      ws.addRows([
        ['A11', 'Juan Pérez', 'Álgebra', 'LUNES'],
        ['A11', 'María Gómez', 'Física', 'MARTES'],
        ['A12', 'Luis Díaz', 'Geometría', 'LUNES'],
      ]);
    } else {
      throw new BadRequestException('Tipo de plantilla no válido');
    }

    const buffer = await wb.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}