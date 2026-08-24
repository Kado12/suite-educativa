import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import PDFDocument from 'pdfkit';
import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PdfService {
  private readonly PAGE_WIDTH = 595.28;
  private readonly PAGE_HEIGHT = 841.89;

  constructor(private config: ConfigService) {
    cloudinary.config({
      cloud_name: this.config.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.config.get('CLOUDINARY_API_KEY'),
      api_secret: this.config.get('CLOUDINARY_API_SECRET'),
    });
  }

  private loadLogo(file: string): Buffer | null {
    try {
      const p = path.join(process.cwd(), 'assets', file);
      return fs.existsSync(p) ? fs.readFileSync(p) : null;
    } catch { return null; }
  }

  // Tabla Code-39 (dígitos, letras y * de inicio/fin)
  private CODE39: Record<string, string> = {
    '0': '000110100', '1': '100100001', '2': '001100001', '3': '101100000', '4': '000110001',
    '5': '100110000', '6': '001110000', '7': '000100101', '8': '100100100', '9': '001100100',
    'A': '100001001', 'B': '001001001', 'C': '101001000', 'D': '000011001', 'E': '100011000',
    'F': '001011000', 'G': '000001101', 'H': '100001100', 'I': '001001100', 'J': '000011100',
    'K': '100000011', 'L': '001000011', 'M': '101000010', 'N': '000010011', 'O': '100010010',
    'P': '001010010', 'Q': '000000111', 'R': '100000110', 'S': '001000110', 'T': '000010110',
    'U': '110000001', 'V': '011000001', 'W': '111000000', 'X': '010010001', 'Y': '110010000',
    'Z': '011010000', '-': '010000101', '.': '110000100', ' ': '011000100', '*': '010010100',
  };

  /** Dibuja un código de barras Code-39 (barras = rectángulos) */
  private drawCode39(doc: any, text: string, x: number, y: number, height: number) {
    const narrow = 1, wide = 2.4;
    let cx = x;
    const full = `*${text.toUpperCase()}*`;
    for (const ch of full) {
      const pattern = this.CODE39[ch];
      if (!pattern) continue;
      for (let i = 0; i < 9; i++) {
        const w = pattern[i] === '1' ? wide : narrow;
        if (i % 2 === 0) doc.rect(cx, y, w, height).fill('#111827'); // barra
        cx += w; // espacio
      }
      cx += narrow; // separación entre caracteres
    }
  }

  async generateStudentRecord(student: any, enrollment: any): Promise<Buffer> {
    const photoBuffer = await this.getPhoto43(student);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 0 });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const halfHeight = this.PAGE_HEIGHT / 2;

      this.drawRecord(doc, student, enrollment, 0, halfHeight, photoBuffer);

      doc.save();
      doc.moveTo(0, halfHeight)
        .lineTo(this.PAGE_WIDTH, halfHeight)
        .dash(4, { space: 4 })
        .strokeColor('#999999')
        .lineWidth(0.5)
        .stroke();
      doc.restore();

      this.drawRecord(doc, student, enrollment, halfHeight, halfHeight, photoBuffer);

      doc.end();
    });
  }

  async generatePaymentReceipt(payment: any): Promise<Buffer> {
    const logoCepu = this.loadLogo('logo-cepu.png');
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A5', margin: 40 });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const e = payment.enrollment;
      const right = 420 - 40;

      // ===== Encabezado =====
      if (logoCepu) { try { doc.image(logoCepu, 40, 40, { fit: [46, 46] }); } catch {} }
      doc.font('Helvetica-Bold').fontSize(13).fillColor('#0E7DC2').text('CEPU-UNICA', 96, 46, { width: right - 96 });
      doc.font('Helvetica').fontSize(8).fillColor('#374151').text('Ingreso Directo a la UNICA', 96, 62, { width: right - 96 });
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#111827').text(`RECIBO N° ${payment.id.slice(0, 8).toUpperCase()}`, 96, 76, { width: right - 96 });

      doc.moveTo(40, 96).lineTo(right, 96).strokeColor('#0E7DC2').lineWidth(1.2).stroke();

      let y = 112;
      const sectionTitle = (t: string) => {
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#0E7DC2').text(t, 40, y);
        doc.moveTo(40, y + 14).lineTo(right, y + 14).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
        y += 26;
      };
      const field = (label: string, value: string) => {
        doc.font('Helvetica').fontSize(8).fillColor('#6b7280').text(label, 40, y, { width: 110 });
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#111827').text(value, 150, y, { width: right - 150 });
        y += 16;
      };

      // ===== Datos del estudiante =====
      sectionTitle('DATOS DEL ESTUDIANTE');
      field('Alumno', `${e.student.firstName} ${e.student.lastName}`);
      field('Documento', e.student.dni || '—');
      field('Sección', `${e.section.name} · ${e.section.classroom.sede.name}`);
      field('Período', e.period.name);
      y += 8;

      // ===== Detalle del pago =====
      sectionTitle('DETALLE DEL PAGO');
      field('Plan de pago', payment.paymentPlan?.name || '—');
      field('Cuota', `${payment.installment} de ${payment.paymentPlan?.installments || '—'}`);
      field('Fecha de pago', payment.paidDate ? new Date(payment.paidDate).toLocaleDateString() : '—');
      if (payment.reference) field('Referencia', payment.reference);
      y += 6;

      // ===== Monto destacado =====
      doc.roundedRect(40, y, right - 40, 34, 6).fill('#EDFAF3');
      doc.font('Helvetica').fontSize(8).fillColor('#0B7A3E').text('MONTO CANCELADO', 52, y + 7);
      doc.font('Helvetica-Bold').fontSize(14).fillColor('#0B7A3E').text(`S/ ${Number(payment.paidAmount || payment.amount).toFixed(2)}`, 52, y + 17);
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#12A150').text('✅ PAGADO', right - 90, y + 12, { width: 78, align: 'right' });
      y += 52;

      // ===== Firma =====
      doc.moveTo(120, y + 30).lineTo(right - 80, y + 30).strokeColor('#374151').lineWidth(0.6).stroke();
      doc.font('Helvetica').fontSize(7.5).fillColor('#6b7280').text('Firma y sello autorizado', 120, y + 34, { width: right - 200, align: 'center' });

      doc.font('Helvetica').fontSize(6.5).fillColor('#9ca3af')
        .text('Gracias por su pago. Conserve este recibo como comprobante.', 40, y + 100, { width: right - 40, align: 'center' });

      doc.end();
    });
  }

  async generateStudentCard(student: any, enrollment: any): Promise<Buffer> {
    const logoCepu = this.loadLogo('logo-cepu.png');
    const logoUns = this.loadLogo('logo-uns.png');

    let photoBuffer: Buffer | null = null;
    if (student.dni) {
      try {
        const url = cloudinary.url(`suite-educativa/${student.dni}`, { crop: 'fill', width: 300, height: 400, gravity: 'face' });
        const res = await axios.get(url, { responseType: 'arraybuffer' });
        photoBuffer = Buffer.from(res.data);
      } catch {}
    }

    return new Promise((resolve, reject) => {
      const W = 240, H = 340;
      const doc = new PDFDocument({ size: [W, H], margin: 0 });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const sede = (enrollment?.section?.classroom?.sede?.name || '—').toUpperCase();
      const turno = (enrollment?.section?.turno?.name || '—').toUpperCase();
      const section = (enrollment?.section?.name || '—').toUpperCase();
      const periodLabel = (enrollment?.period?.name || '—').replace(/^semestre\s*/i, '');

      // ===== Fondo blanco =====
      doc.rect(0, 0, W, H).fill('#ffffff');

      // ===== Doble contorno (azul profundo + dorado) =====
      doc.roundedRect(3, 3, W - 6, H - 6, 10).strokeColor('#0A5A8C').lineWidth(2).stroke();
      doc.roundedRect(7, 7, W - 14, H - 14, 8).strokeColor('#FFC621').lineWidth(0.8).stroke();

      // ===== Franja superior celeste + marca central =====
      doc.rect(8, 8, W - 16, 44).fill('#EAF4FB');
      if (logoUns) { try { doc.image(logoUns, 12, 13, { fit: [30, 30] }); } catch {} }
      if (logoCepu) { try { doc.image(logoCepu, W - 42, 13, { fit: [30, 30] }); } catch {} }
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#0A5A8C').text('SUITE ACADÉMICA', 0, 17, { width: W, align: 'center' });
      doc.font('Helvetica').fontSize(6.5).fillColor('#B78900').text('CARNÉ ESTUDIANTIL', 0, 29, { width: W, align: 'center' });
      doc.rect(8, 52, W - 16, 2).fill('#FFC621');

      // ===== SEDE / TURNO =====
      doc.font('Helvetica-Bold').fontSize(7).fillColor('#0E7DC2').text('SEDE:', 0, 58, { width: W, align: 'center' });
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#111827').text(sede, 0, 67, { width: W, align: 'center' });
      doc.font('Helvetica-Bold').fontSize(7).fillColor('#0E7DC2').text('TURNO:', 0, 79, { width: W, align: 'center' });
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#111827').text(turno, 0, 88, { width: W, align: 'center' });

      // ===== CEPU + período =====
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#0E7DC2').text(`CEPU ${periodLabel}`, 0, 99, { width: W, align: 'center' });

      // ===== Foto centrada con marco azul =====
      const pw = 86, ph = 115;
      const px = (W - pw) / 2;
      if (photoBuffer) { try { doc.image(photoBuffer, px, 112, { width: pw, height: ph }); } catch {} }
      doc.rect(px, 112, pw, ph).strokeColor('#0E7DC2').lineWidth(1).stroke();

      // ===== Datos =====
      let y = 235;
      const row = (label: string, value: string) => {
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#374151').text(label, 26, y);
        doc.font('Helvetica').fontSize(8).fillColor('#111827').text(value, 92, y, { width: W - 102 });
        y += 14;
      };
      row('APELLIDOS:', (student.lastName || '').toUpperCase());
      row('NOMBRES:', (student.firstName || '').toUpperCase());
      row(student.docType === 'CARNET' ? 'CARNET:' : 'DNI:', student.dni || '—');
      row('SECCIÓN:', section);

      // ===== Franja inferior celeste + código de barras =====
      doc.rect(8, 294, W - 16, 38).fill('#EAF4FB');
      if (student.dni) {
        this.drawCode39(doc, student.dni, 58, 300, 22);
        doc.font('Helvetica').fontSize(7).fillColor('#374151').text(student.dni, 0, 325, { width: W, align: 'center' });
      }

      doc.end();
    });
  }

  /**
   * Pide a Cloudinary una versión recortada 4:3 centrada en el rostro.
   * Si falla, cae a la imagen original.
   */
  private async getPhoto43(student: any): Promise<Buffer | null> {
    if (student.dni) {
      try {
        const url43 = cloudinary.url(`suite-educativa/${student.dni}`, {
          crop: 'fill', width: 400, height: 300, gravity: 'face',
        });
        const res = await axios.get(url43, { responseType: 'arraybuffer' });
        return Buffer.from(res.data);
      } catch {}
    }
    if (student.photoUrl) {
      try {
        const res = await axios.get(student.photoUrl, { responseType: 'arraybuffer' });
        return Buffer.from(res.data);
      } catch {}
    }
    return null;
  }

  private drawRecord(doc: any, student: any, enrollment: any, offsetY: number, height: number, photoBuffer: Buffer | null) {
    const margin = 40;
    const rightEdge = this.PAGE_WIDTH - margin;
    const contentWidth = rightEdge - margin;

    // ===== Encabezado centrado =====
    doc.font('Helvetica-Bold').fontSize(15).fillColor('#1e3a8a')
      .text('SUITE EDUCATIVA', 0, offsetY + 28, { align: 'center', width: this.PAGE_WIDTH });
    doc.font('Helvetica').fontSize(9).fillColor('#374151')
      .text('FICHA DE MATRÍCULA DEL ESTUDIANTE', 0, offsetY + 48, { align: 'center', width: this.PAGE_WIDTH });

    let y = offsetY + 66;
    doc.moveTo(margin, y).lineTo(rightEdge, y).strokeColor('#1e3a8a').lineWidth(1.5).stroke();

    // ===== Foto 4:3 + nombre + datos personales =====
    const photoX = margin;
    const photoY = y + 20;
    const photoW = 120;   // 4:3
    const photoH = 90;    // 4:3

    if (photoBuffer) {
      try {
        // La imagen ya viene recortada 4:3 por Cloudinary, se dibuja exacta
        doc.image(photoBuffer, photoX, photoY, { width: photoW, height: photoH });
      } catch {}
    }
    doc.rect(photoX, photoY, photoW, photoH).strokeColor('#9ca3af').lineWidth(0.5).stroke();

    const nameX = photoX + photoW + 22;
    const nameWidth = rightEdge - nameX;

    doc.font('Helvetica-Bold').fontSize(14).fillColor('#111827')
      .text(`${student.firstName} ${student.lastName}`, nameX, photoY + 6, { width: nameWidth });
    doc.font('Helvetica').fontSize(9).fillColor('#374151')
      .text(`Documento: ${student.docType === 'CARNET' ? 'Carnet Ext.' : 'DNI'} ${student.dni}`, nameX, photoY + 32, { width: nameWidth })
      .text(`Teléfono: ${student.phone || '—'}`, nameX, photoY + 47, { width: nameWidth });

    // ===== Datos académicos =====
    y = photoY + photoH + 28;
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#1e40af').text('DATOS ACADÉMICOS', margin, y);
    y += 16;
    doc.moveTo(margin, y).lineTo(rightEdge, y).strokeColor('#d1d5db').lineWidth(0.5).stroke();
    y += 16;

    const colWidth = contentWidth / 2 - 10;
    const col1 = margin;
    const col2 = margin + contentWidth / 2;

    if (enrollment) {
      const plan = enrollment.payments[0]?.paymentPlan;
      this.academicField(doc, 'SEDE', enrollment.section.classroom.sede.name, col1, y, colWidth);
      this.academicField(doc, 'TURNO', enrollment.section.turno.name, col2, y, colWidth);
      y += 42;
      this.academicField(doc, 'SECCIÓN', enrollment.section.name, col1, y, colWidth);
      this.academicField(doc, 'PERÍODO', enrollment.period.name, col2, y, colWidth);
      y += 42;
      this.academicField(doc, 'PLAN DE PAGO', plan ? `${plan.name} (${plan.installments} cuotas)` : '—', col1, y, contentWidth);
    } else {
      doc.font('Helvetica').fontSize(9).fillColor('#9ca3af').text('Sin matrícula activa', margin, y);
    }

    // ===== Footer =====
    const footerY = offsetY + height - 34;
    doc.moveTo(margin, footerY).lineTo(rightEdge, footerY).strokeColor('#d1d5db').lineWidth(0.5).stroke();
    doc.font('Helvetica').fontSize(7).fillColor('#9ca3af')
      .text(`Generado el ${new Date().toLocaleDateString()} | Documento: ${student.dni}`, 0, footerY + 8, { align: 'center', width: this.PAGE_WIDTH });
  }

  private academicField(doc: any, label: string, value: string, x: number, y: number, width: number) {
    doc.font('Helvetica').fontSize(8).fillColor('#9ca3af').text(label, x, y, { width });
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#111827').text(value || '—', x, y + 13, { width });
  }
}