import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AcademicService } from './academic.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { Response } from 'express';

@ApiTags('Académico')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('academic')
export class AcademicController {
  constructor(private svc: AcademicService) { }

  @Post('sedes') @RequirePermissions('academic.manage')
  createSede(@Body('name') name: string) { return this.svc.createSede(name); }
  @Get('sedes') @RequirePermissions('academic.view')
  listSedes() { return this.svc.listSedes(); }
  @Patch('sedes/:id') @RequirePermissions('academic.manage')
  updateSede(@Param('id') id: string, @Body('name') name: string) { return this.svc.updateSede(id, name); }
  @Delete('sedes/:id') @RequirePermissions('academic.manage')
  deleteSede(@Param('id') id: string) { return this.svc.deleteSede(id); }

  @Post('turnos') @RequirePermissions('academic.manage')
  createTurno(@Body() b: any) { return this.svc.createTurno(b); }
  @Get('turnos') @RequirePermissions('academic.view')
  listTurnos() { return this.svc.listTurnos(); }
  @Patch('turnos/:id') @RequirePermissions('academic.manage')
  updateTurno(@Param('id') id: string, @Body() b: any) { return this.svc.updateTurno(id, b); }
  @Delete('turnos/:id') @RequirePermissions('academic.manage')
  deleteTurno(@Param('id') id: string) { return this.svc.deleteTurno(id); }

  @Post('classrooms') @RequirePermissions('academic.manage')
  createClassroom(@Body() b: { name: string; sedeId: string }) { return this.svc.createClassroom(b.name, b.sedeId); }
  @Patch('classrooms/:id') @RequirePermissions('academic.manage')
  updateClassroom(@Param('id') id: string, @Body() b: any) { return this.svc.updateClassroom(id, b); }
  @Delete('classrooms/:id') @RequirePermissions('academic.manage')
  deleteClassroom(@Param('id') id: string) { return this.svc.deleteClassroom(id); }

  @Post('sections') @RequirePermissions('academic.manage')
  createSection(@Body() b: any) { return this.svc.createSection(b); }
  @Get('sections') @RequirePermissions('academic.view')
  listSections(@Query('onlyActive') onlyActive?: string) {
    return this.svc.listSections(onlyActive === 'true');
  }
  @Get('sections/export')
  @RequirePermissions('academic.view')
  async exportSections(@Res() res: Response) {
    const buffer = await this.svc.exportSectionsExcel();
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="secciones.xlsx"',
    });
    res.send(buffer);
  }
  @Patch('sections/:id') @RequirePermissions('academic.manage')
  updateSection(@Param('id') id: string, @Body() b: any) { return this.svc.updateSection(id, b); }
  @Patch('sections/:id/toggle') @RequirePermissions('academic.manage')
  toggleSection(@Param('id') id: string) { return this.svc.toggleSectionActive(id); }
  @Patch('sections/:id/full') @RequirePermissions('academic.manage')
  updateSectionFull(@Param('id') id: string, @Body() b: any) { return this.svc.updateSectionFull(id, b); }
  @Delete('sections/:id') @RequirePermissions('academic.manage')
  deleteSection(@Param('id') id: string) { return this.svc.deleteSection(id); }

  @Post('areas') @RequirePermissions('academic.manage')
  createArea(@Body('name') name: string) { return this.svc.createArea(name); }
  @Get('areas') @RequirePermissions('academic.view')
  listAreas() { return this.svc.listAreas(); }
  @Patch('areas/:id') @RequirePermissions('academic.manage')
  updateArea(@Param('id') id: string, @Body('name') name: string) { return this.svc.updateArea(id, name); }
  @Delete('areas/:id') @RequirePermissions('academic.manage')
  deleteArea(@Param('id') id: string) { return this.svc.deleteArea(id); }

  @Post('courses') @RequirePermissions('academic.manage')
  createCourse(@Body() b: { name: string; areaId: string }) { return this.svc.createCourse(b.name, b.areaId); }
  @Patch('courses/:id') @RequirePermissions('academic.manage')
  updateCourse(@Param('id') id: string, @Body() b: any) { return this.svc.updateCourse(id, b); }
  @Delete('courses/:id') @RequirePermissions('academic.manage')
  deleteCourse(@Param('id') id: string) { return this.svc.deleteCourse(id); }

  @Post('periods') @RequirePermissions('academic.manage')
  createPeriod(@Body() b: any) { return this.svc.createPeriod(b); }
  @Get('periods') @RequirePermissions('academic.view')
  listPeriods() { return this.svc.listPeriods(); }
  @Patch('periods/:id') @RequirePermissions('academic.manage')
  togglePeriod(@Param('id') id: string, @Body('isActive') isActive: boolean) { return this.svc.togglePeriod(id, isActive); }
  @Patch('periods/:id/full') @RequirePermissions('academic.manage')
  updatePeriodFull(@Param('id') id: string, @Body() b: any) { return this.svc.updatePeriod(id, b); }
  @Delete('periods/:id') @RequirePermissions('academic.manage')
  deletePeriod(@Param('id') id: string) { return this.svc.deletePeriod(id); }

  @Post('blocks') @RequirePermissions('academic.manage')
  createBlock(@Body() b: any) { return this.svc.createBlock(b); }
  @Get('blocks') @RequirePermissions('academic.view')
  listBlocks(@Query('periodId') periodId?: string) {
    return this.svc.listBlocks(periodId);
  }
  @Patch('blocks/:id') @RequirePermissions('academic.manage')
  updateBlock(@Param('id') id: string, @Body() b: any) { return this.svc.updateBlock(id, b); }
  @Delete('blocks/:id') @RequirePermissions('academic.manage')
  deleteBlock(@Param('id') id: string) { return this.svc.deleteBlock(id); }
  @Post('blocks/:id/courses') @RequirePermissions('academic.manage')
  addCourse(@Param('id') id: string, @Body('courseId') courseId: string) { return this.svc.addCourseToBlock(id, courseId); }
  @Delete('blocks/:id/courses/:courseId') @RequirePermissions('academic.manage')
  removeCourse(@Param('id') id: string, @Param('courseId') courseId: string) { return this.svc.removeCourseFromBlock(id, courseId); }

  @Post('payment-plans') @RequirePermissions('payments.manage')
  createPaymentPlan(@Body() b: any): Promise<any> { return this.svc.createPaymentPlan(b); }
  @Get('payment-plans') @RequirePermissions('payments.view')
  listPaymentPlans(@Query('includeInactive') include?: string): Promise<any> { return this.svc.listPaymentPlans(include === 'true'); }
  @Patch('payment-plans/:id') @RequirePermissions('payments.manage')
  updatePaymentPlan(@Param('id') id: string, @Body() b: any): Promise<any> { return this.svc.updatePaymentPlan(id, b); }
  @Delete('payment-plans/:id') @RequirePermissions('payments.manage')
  deletePaymentPlan(@Param('id') id: string): Promise<any> { return this.svc.deletePaymentPlan(id); }

}