import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { EnrollmentService } from './enrollment.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { Auditable } from '../audit/audit.decorator';
import { Response } from 'express';

@ApiTags('Matrículas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('enrollments')
export class EnrollmentController {
  constructor(private svc: EnrollmentService) {}
  
  @Post() @RequirePermissions('enrollment.manage') @Auditable('CREATE', 'Matricula')
  create(@Body() b: any): Promise<any> { return this.svc.create(b); }

  @Get() @RequirePermissions('enrollment.view')
  list(
    @Query('periodId') periodId?: string,
    @Query('sectionId') sectionId?: string,
    @Query('status') status?: string,
    @Query('studentSearch') studentSearch?: string,
  ): Promise<any> {
    return this.svc.list({ periodId, sectionId, status, studentSearch });
  }

  @Get('stats') @RequirePermissions('enrollment.view')
  stats(@Query('periodId') periodId?: string) {
    return this.svc.getStats(periodId);
  }

  @Get('export') @RequirePermissions('enrollment.view')
  async export(@Query('periodId') periodId: string, @Query('status') status: string, @Query('studentSearch') studentSearch: string, @Res() res: Response) {
    const b = await this.svc.exportExcel({ periodId, status, studentSearch });
    res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': 'attachment; filename="matriculas.xlsx"' });
    res.send(b);
  }
  
  @Get('active/:studentId') @RequirePermissions('enrollment.view')
  getActive(@Param('studentId') studentId: string): Promise<any> {
    return this.svc.getActiveEnrollment(studentId);
  }

  @Patch(':id/status') @RequirePermissions('enrollment.manage') @Auditable('UPDATE', 'Matricula')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.svc.updateStatus(id, status);
  }

  @Delete(':id') @RequirePermissions('enrollment.manage') @Auditable('DELETE', 'Matricula')
  delete(@Param('id') id: string) { return this.svc.delete(id); }

  @Get('check-student') @RequirePermissions('enrollment.view')
  checkStudent(@Query('dni') dni: string, @Query('periodId') periodId: string) {
    return this.svc.checkStudent(dni, periodId);
  }

  @Get('suggest-section') @RequirePermissions('enrollment.view')
  suggestSection(@Query('sedeId') sedeId: string, @Query('turnoId') turnoId: string): Promise<any>  {
    return this.svc.suggestSection(sedeId, turnoId);
  }

  @Post('wizard') @RequirePermissions('enrollment.manage') @Auditable('CREATE', 'Enrollment')
  createWizard(@Body() b: any): Promise<any>  {
    return this.svc.createWizard(b);
  }

  @Patch('active/section') @RequirePermissions('enrollment.manage') @Auditable('UPDATE_SECTION', 'Enrollment')
  updateActiveSection(@Body() b: { studentId: string; sectionId: string }) {
    return this.svc.updateActiveEnrollmentSection(b.studentId, b.sectionId);
  }

  @Patch(':id/change-plan') @RequirePermissions('enrollment.manage') @Auditable('CHANGE_PLAN', 'Enrollment')
  changePlan(@Param('id') id: string, @Body() b: { planId: string; forceRestore: boolean }) {
    return this.svc.changePaymentPlan(id, b.planId, b.forceRestore);
  }
}