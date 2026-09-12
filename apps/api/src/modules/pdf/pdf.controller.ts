import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PdfService } from './pdf.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EnrollmentService } from '../enrollment/enrollment.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

import { StudentRecordParamDto, PaymentReceiptParamDto, StudentCardParamDto } from './dto/pdf.dto';

@ApiTags('PDF')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pdf')
export class PdfController {
  constructor(
    private pdfService: PdfService,
    private prisma: PrismaService,
    private enrollmentService: EnrollmentService,
  ) {}

  @Get('student-record/:studentId')
  async studentRecord(@Param() param: StudentRecordParamDto, @Res() res: Response) {
    const student = await this.prisma.person.findUnique({ where: { id: param.studentId } });
    if (!student) return res.status(404).json({ message: 'Alumno no encontrado' });

    const enrollment = await this.enrollmentService.getActiveEnrollment(param.studentId);
    const buffer = await this.pdfService.generateStudentRecord(student, enrollment);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="ficha-${student.dni || param.studentId}.pdf"`,
    });
    res.send(buffer);
  }

  @Get('payment-receipt/:paymentId')
  async paymentReceipt(@Param() param: PaymentReceiptParamDto, @Res() res: Response) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: param.paymentId },
      include: {
        enrollment: {
          include: {
            student: true,
            section: { include: { classroom: { include: { sede: true } } } },
            period: true,
          },
        },
        paymentPlan: true,
      },
    });
    if (!payment) return res.status(404).json({ message: 'Pago no encontrado' });

    const buffer = await this.pdfService.generatePaymentReceipt(payment);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="recibo-${payment.installment}.pdf"`,
    });
    res.send(buffer);
  }

  @Get('student-card/:studentId')
  async studentCard(@Param() param: StudentCardParamDto, @Res() res: Response) {
    const student = await this.prisma.person.findUnique({ where: { id: param.studentId } });
    if (!student) return res.status(404).json({ message: 'Alumno no encontrado' });

    const enrollment = await this.enrollmentService.getActiveEnrollment(param.studentId);
    const buffer = await this.pdfService.generateStudentCard(student, enrollment);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="carne-${student.dni || param.studentId}.pdf"`,
    });
    res.send(buffer);
  }
}