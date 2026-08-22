import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PdfService } from './pdf.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EnrollmentService } from '../enrollment/enrollment.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

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
  async studentRecord(@Param('studentId') studentId: string, @Res() res: Response) {
    const student = await this.prisma.person.findUnique({ where: { id: studentId } });
    if (!student) return res.status(404).json({ message: 'Alumno no encontrado' });

    const enrollment = await this.enrollmentService.getActiveEnrollment(studentId);
    const buffer = await this.pdfService.generateStudentRecord(student, enrollment);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="ficha-${student.dni || studentId}.pdf"`,
    });
    res.send(buffer);
  }
}