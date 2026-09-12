import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { EnrollmentService } from './enrollment.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { Auditable } from '../audit/audit.decorator';
import { Response } from 'express';

import { CreateEnrollmentDto, UpdateStatusDto } from './dto/enrollment.dto';
import { CreateWizardDto } from './dto/wizard.dto';
import { UpdateActiveSectionDto, ChangePlanDto } from './dto/enrollment-operations.dto';
import {
  ListEnrollmentsQueryDto,
  CheckStudentQueryDto,
  SuggestSectionQueryDto,
  ReEnrollmentQueryDto,
  ExportEnrollmentsQueryDto,
  StatsQueryDto,
} from './dto/queries.dto';

@ApiTags('Matrículas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('enrollments')
export class EnrollmentController {
  constructor(private svc: EnrollmentService) {}

  @Post()
  @RequirePermissions('enrollment.manage')
  @Auditable('CREATE', 'Matricula')
  create(@Body() dto: CreateEnrollmentDto) {
    return this.svc.create(dto);
  }

  @Get()
  @RequirePermissions('enrollment.view')
  list(@Query() query: ListEnrollmentsQueryDto) {
    return this.svc.list(query);
  }

  @Get('stats')
  @RequirePermissions('enrollment.view')
  stats(@Query() query: StatsQueryDto) {
    return this.svc.getStats(query.periodId);
  }

  @Get('export')
  @RequirePermissions('enrollment.view')
  async export(@Query() query: ExportEnrollmentsQueryDto, @Res() res: Response) {
    const b = await this.svc.exportExcel(query);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="matriculas.xlsx"',
    });
    res.send(b);
  }

  @Get('active/:studentId')
  @RequirePermissions('enrollment.view')
  getActive(@Param('studentId') studentId: string) {
    return this.svc.getActiveEnrollment(studentId);
  }

  @Get('re-enrollment-pending')
  @RequirePermissions('enrollment.view')
  reEnrollment(@Query() query: ReEnrollmentQueryDto) {
    return this.svc.getReEnrollmentPending(query.periodId);
  }

  @Patch(':id/status')
  @RequirePermissions('enrollment.manage')
  @Auditable('UPDATE', 'Matricula')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.svc.updateStatus(id, dto.status);
  }

  @Delete(':id')
  @RequirePermissions('enrollment.manage')
  @Auditable('DELETE', 'Matricula')
  delete(@Param('id') id: string) {
    return this.svc.delete(id);
  }

  @Get('check-student')
  @RequirePermissions('enrollment.view')
  checkStudent(@Query() query: CheckStudentQueryDto) {
    return this.svc.checkStudent(query.dni, query.periodId);
  }

  @Get('suggest-section')
  @RequirePermissions('enrollment.view')
  suggestSection(@Query() query: SuggestSectionQueryDto) {
    return this.svc.suggestSection(query.sedeId, query.turnoId);
  }

  @Post('wizard')
  @RequirePermissions('enrollment.manage')
  @Auditable('CREATE', 'Enrollment')
  createWizard(@Body() dto: CreateWizardDto) {
    return this.svc.createWizard(dto);
  }

  @Patch('active/section')
  @RequirePermissions('enrollment.manage')
  @Auditable('UPDATE_SECTION', 'Enrollment')
  updateActiveSection(@Body() dto: UpdateActiveSectionDto) {
    return this.svc.updateActiveEnrollmentSection(dto.studentId, dto.sectionId);
  }

  @Patch(':id/change-plan')
  @RequirePermissions('enrollment.manage')
  @Auditable('CHANGE_PLAN', 'Enrollment')
  changePlan(@Param('id') id: string, @Body() dto: ChangePlanDto) {
    return this.svc.changePaymentPlan(id, dto.planId, dto.forceRestore);
  }
}