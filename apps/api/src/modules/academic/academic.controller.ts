import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AcademicService } from './academic.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';

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
  @Delete('sedes/:id') @RequirePermissions('academic.manage')
  deleteSede(@Param('id') id: string) { return this.svc.deleteSede(id); }

  @Post('turnos') @RequirePermissions('academic.manage')
  createTurno(@Body() b: any) { return this.svc.createTurno(b); }
  @Get('turnos') @RequirePermissions('academic.view')
  listTurnos() { return this.svc.listTurnos(); }
  @Delete('turnos/:id') @RequirePermissions('academic.manage')
  deleteTurno(@Param('id') id: string) { return this.svc.deleteTurno(id); }

  @Post('classrooms') @RequirePermissions('academic.manage')
  createClassroom(@Body() b: { name: string; sedeId: string }) { return this.svc.createClassroom(b.name, b.sedeId); }
  @Delete('classrooms/:id') @RequirePermissions('academic.manage')
  deleteClassroom(@Param('id') id: string) { return this.svc.deleteClassroom(id); }

  @Post('sections') @RequirePermissions('academic.manage')
  createSection(@Body() b: any) { return this.svc.createSection(b); }
  @Get('sections') @RequirePermissions('academic.view')
  listSections() { return this.svc.listSections(); }
  @Patch('sections/:id') @RequirePermissions('academic.manage')
  updateSection(@Param('id') id: string, @Body() b: any) { return this.svc.updateSection(id, b); }
  @Delete('sections/:id') @RequirePermissions('academic.manage')
  deleteSection(@Param('id') id: string) { return this.svc.deleteSection(id); }

  @Post('areas') @RequirePermissions('academic.manage')
  createArea(@Body('name') name: string) { return this.svc.createArea(name); }
  @Get('areas') @RequirePermissions('academic.view')
  listAreas() { return this.svc.listAreas(); }
  @Delete('areas/:id') @RequirePermissions('academic.manage')
  deleteArea(@Param('id') id: string) { return this.svc.deleteArea(id); }

  @Post('courses') @RequirePermissions('academic.manage')
  createCourse(@Body() b: { name: string; areaId: string }) { return this.svc.createCourse(b.name, b.areaId); }
  @Delete('courses/:id') @RequirePermissions('academic.manage')
  deleteCourse(@Param('id') id: string) { return this.svc.deleteCourse(id); }

  @Post('periods') @RequirePermissions('academic.manage')
  createPeriod(@Body() b: any) { return this.svc.createPeriod(b); }
  @Get('periods') @RequirePermissions('academic.view')
  listPeriods() { return this.svc.listPeriods(); }
  @Patch('periods/:id') @RequirePermissions('academic.manage')
  togglePeriod(@Param('id') id: string, @Body('isActive') isActive: boolean) { return this.svc.togglePeriod(id, isActive); }
  @Delete('periods/:id') @RequirePermissions('academic.manage')
  deletePeriod(@Param('id') id: string) { return this.svc.deletePeriod(id); }

  @Post('blocks') @RequirePermissions('academic.manage')
  createBlock(@Body() b: any) { return this.svc.createBlock(b); }
  @Delete('blocks/:id') @RequirePermissions('academic.manage')
  deleteBlock(@Param('id') id: string) { return this.svc.deleteBlock(id); }
  @Post('blocks/:id/courses') @RequirePermissions('academic.manage')
  addCourse(@Param('id') id: string, @Body('courseId') courseId: string) { return this.svc.addCourseToBlock(id, courseId); }
  @Delete('blocks/:id/courses/:courseId') @RequirePermissions('academic.manage')
  removeCourse(@Param('id') id: string, @Param('courseId') courseId: string) { return this.svc.removeCourseFromBlock(id, courseId); }
}