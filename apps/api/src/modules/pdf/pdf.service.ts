import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import PDFDocument from 'pdfkit';
import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';

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