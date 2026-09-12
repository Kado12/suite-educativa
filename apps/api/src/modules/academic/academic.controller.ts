import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AcademicService } from './academic.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { Response } from 'express';
import { Auditable } from '../audit/audit.decorator';
import { CreateSedeDto, UpdateSedeDto } from './dto/sede.dto';
import { CreateTurnoDto, UpdateTurnoDto } from './dto/turno.dto';
import { CreateClassroomDto, UpdateClassroomDto } from './dto/classroom.dto';
import { CreateSectionDto, ListSectionsQueryDto, UpdateSectionDto, UpdateSectionFullDto } from './dto/section.dto';
import { CreateAreaDto, UpdateAreaDto } from './dto/area.dto';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';
import { CreatePeriodDto, TogglePeriodDto, UpdatePeriodDto } from './dto/period.dto';
import { AddCourseToBlockDto, CreateBlockDto, ListBlocksQueryDto, UpdateBlockDto } from './dto/block.dto';
import { CreatePaymentPlanDto, ListPaymentPlansQueryDto, UpdatePaymentPlanDto } from './dto/payment-plan.dto';

@ApiTags('Académico')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('academic')
export class AcademicController {
  constructor(private svc: AcademicService) { }

  // SEDES
  @Post('sedes')
  @RequirePermissions('academic.manage')
  @Auditable('CREATE', 'Sede')
  createSede(@Body('name') dto: CreateSedeDto) {
    return this.svc.createSede(dto.name);
  }

  @Get('sedes')
  @RequirePermissions('academic.view')
  listSedes() {
    return this.svc.listSedes();
  }

  @Patch('sedes/:id')
  @RequirePermissions('academic.manage')
  @Auditable('UPDATE', 'Sede')
  updateSede(@Param('id') id: string, @Body('name') dto: UpdateSedeDto) {
    return this.svc.updateSede(id, dto.name);
  }

  @Delete('sedes/:id')
  @RequirePermissions('academic.manage')
  @Auditable('DELETE', 'Sede')
  deleteSede(@Param('id') id: string) {
    return this.svc.deleteSede(id);
  }

  // TURNOS
  @Post('turnos')
  @RequirePermissions('academic.manage')
  @Auditable('CREATE', 'Turno')
  createTurno(@Body() dto: CreateTurnoDto) {
    return this.svc.createTurno(dto);
  }

  @Get('turnos')
  @RequirePermissions('academic.view')
  listTurnos() {
    return this.svc.listTurnos();
  }

  @Patch('turnos/:id')
  @RequirePermissions('academic.manage')
  @Auditable('UPDATE', 'Turno')
  updateTurno(@Param('id') id: string, @Body() dto: UpdateTurnoDto) {
    return this.svc.updateTurno(id, dto);
  }

  @Delete('turnos/:id')
  @RequirePermissions('academic.manage')
  @Auditable('DELETE', 'Turno')
  deleteTurno(@Param('id') id: string) {
    return this.svc.deleteTurno(id);
  }

  // SALONES
  @Post('classrooms')
  @RequirePermissions('academic.manage')
  @Auditable('CREATE', 'Salón')
  createClassroom(@Body() dto: CreateClassroomDto) {
    return this.svc.createClassroom(dto.name, dto.sedeId);
  }

  @Patch('classrooms/:id')
  @RequirePermissions('academic.manage')
  @Auditable('UPDATE', 'Salón')
  updateClassroom(@Param('id') id: string, @Body() dto: UpdateClassroomDto) {
    return this.svc.updateClassroom(id, dto);
  }

  @Delete('classrooms/:id')
  @RequirePermissions('academic.manage')
  @Auditable('DELETE', 'Salón')
  deleteClassroom(@Param('id') id: string) {
    return this.svc.deleteClassroom(id);
  }

  // SECCIONES
  @Post('sections')
  @RequirePermissions('academic.manage')
  @Auditable('CREATE', 'Sección')
  createSection(@Body() dto: CreateSectionDto) {
    return this.svc.createSection(dto);
  }

  @Get('sections')
  @RequirePermissions('academic.view')
  listSections(@Query() query: ListSectionsQueryDto) {
    return this.svc.listSections(query.onlyActive === true);
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
  @Patch('sections/:id')
  @RequirePermissions('academic.manage')
  @Auditable('UPDATE', 'Sección')
  updateSection(@Param('id') id: string, @Body() dto: UpdateSectionDto) {
    return this.svc.updateSection(id, dto);
  }

  @Patch('sections/:id/toggle')
  @RequirePermissions('academic.manage')
  @Auditable('TOGGLE', 'Sección - Estado')
  toggleSection(@Param('id') id: string) {
    return this.svc.toggleSectionActive(id);
  }

  @Patch('sections/:id/full')
  @RequirePermissions('academic.manage')
  @Auditable('UPDATE', 'Sección')
  updateSectionFull(@Param('id') id: string, @Body() dto: UpdateSectionFullDto) {
    return this.svc.updateSectionFull(id, dto);
  }

  @Delete('sections/:id')
  @RequirePermissions('academic.manage')
  @Auditable('DELETE', 'Sección')
  deleteSection(@Param('id') id: string) {
    return this.svc.deleteSection(id);
  }

  // AREAS
  @Post('areas')
  @RequirePermissions('academic.manage')
  @Auditable('CREATE', 'Area')
  createArea(@Body() dto: CreateAreaDto) {
    return this.svc.createArea(dto.name);
  }

  @Get('areas')
  @RequirePermissions('academic.view')
  listAreas() {
    return this.svc.listAreas();
  }

  @Patch('areas/:id')
  @RequirePermissions('academic.manage')
  @Auditable('UPDATE', 'Area')
  updateArea(@Param('id') id: string, @Body() dto: UpdateAreaDto) {
    return this.svc.updateArea(id, dto.name);
  }

  @Delete('areas/:id')
  @RequirePermissions('academic.manage')
  @Auditable('DELETE', 'Area')
  deleteArea(@Param('id') id: string) {
    return this.svc.deleteArea(id);
  }

  // CURSOS
  @Post('courses')
  @RequirePermissions('academic.manage')
  @Auditable('CREATE', 'Curso')
  createCourse(@Body() dto: CreateCourseDto) {
    return this.svc.createCourse(dto.name, dto.areaId);
  }

  @Patch('courses/:id')
  @RequirePermissions('academic.manage')
  @Auditable('UPDATE', 'Curso')
  updateCourse(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.svc.updateCourse(id, dto);
  }

  @Delete('courses/:id')
  @RequirePermissions('academic.manage')
  @Auditable('DELETE', 'Curso')
  deleteCourse(@Param('id') id: string) {
    return this.svc.deleteCourse(id);
  }

  // PERIODOS
  @Post('periods')
  @RequirePermissions('academic.manage')
  @Auditable('CREATE', 'Periodo')
  createPeriod(@Body() dto: CreatePeriodDto) {
    return this.svc.createPeriod(dto);
  }

  @Get('periods')
  @RequirePermissions('academic.view')
  listPeriods() {
    return this.svc.listPeriods();
  }

  @Patch('periods/:id')
  @RequirePermissions('academic.manage')
  @Auditable('UPDATE', 'Periodo - Estado')
  togglePeriod(@Param('id') id: string, @Body() dto: TogglePeriodDto) {
    return this.svc.togglePeriod(id, dto.isActive);
  }

  @Patch('periods/:id/full')
  @RequirePermissions('academic.manage')
  @Auditable('UPDATE', 'Periodo')
  updatePeriodFull(@Param('id') id: string, @Body() dto: UpdatePeriodDto) {
    return this.svc.updatePeriod(id, dto);
  }

  @Delete('periods/:id')
  @RequirePermissions('academic.manage')
  @Auditable('DELETE', 'Periodo')
  deletePeriod(@Param('id') id: string) {
    return this.svc.deletePeriod(id);
  }

  // BLOQUES
  @Post('blocks')
  @RequirePermissions('academic.manage')
  @Auditable('CREATE', 'Bloque')
  createBlock(@Body() dto: CreateBlockDto) {
    return this.svc.createBlock(dto);
  }

  @Get('blocks')
  @RequirePermissions('academic.view')
  listBlocks(@Query() query: ListBlocksQueryDto) {
    return this.svc.listBlocks(query.periodId);
  }

  @Patch('blocks/:id')
  @RequirePermissions('academic.manage')
  @Auditable('UPDATE', 'Bloque')
  updateBlock(@Param('id') id: string, @Body() dto: UpdateBlockDto) {
    return this.svc.updateBlock(id, dto);
  }

  @Delete('blocks/:id')
  @RequirePermissions('academic.manage')
  @Auditable('DELETE', 'Bloque')
  deleteBlock(@Param('id') id: string) {
    return this.svc.deleteBlock(id);
  }
  @Post('blocks/:id/courses')
  @RequirePermissions('academic.manage')
  addCourse(@Param('id') id: string, @Body() dto: AddCourseToBlockDto) {
    return this.svc.addCourseToBlock(id, dto.courseId);
  }

  @Delete('blocks/:id/courses/:courseId')
  @RequirePermissions('academic.manage')
  @Auditable('DELETE', 'Bloque - Curso')
  removeCourse(@Param('id') id: string, @Param('courseId') courseId: string) {
    return this.svc.removeCourseFromBlock(id, courseId);
  }

  // PLANES DE PAGO
  @Post('payment-plans')
  @RequirePermissions('payments.manage')
  @Auditable('CREATE', 'Plan de Pago')
  createPaymentPlan(@Body() dto: CreatePaymentPlanDto) {
    return this.svc.createPaymentPlan(dto);
  }

  @Get('payment-plans')
  @RequirePermissions('payments.view')
  listPaymentPlans(@Query() query: ListPaymentPlansQueryDto) {
    return this.svc.listPaymentPlans(query.includeInactive === true);
  }

  @Patch('payment-plans/:id')
  @RequirePermissions('payments.manage')
  @Auditable('UPDATE', 'Plan de Pago')
  updatePaymentPlan(@Param('id') id: string, @Body() dto: UpdatePaymentPlanDto) {
    return this.svc.updatePaymentPlan(id, dto);
  }

  @Delete('payment-plans/:id')
  @RequirePermissions('payments.manage')
  @Auditable('DELETE', 'Plan de Pago')
  deletePaymentPlan(@Param('id') id: string) {
    return this.svc.deletePaymentPlan(id);
  }
}