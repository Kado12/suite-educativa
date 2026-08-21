import { Controller, Get, Post, Patch, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PeopleService } from './people.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Personas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('people')
export class PeopleController {
  constructor(private svc: PeopleService) {}

  // Alumnos
  @Post('students') @RequirePermissions('enrollment.manage')
  createStudent(@Body() b: any) { return this.svc.createStudent(b); }
  @Get('students') @RequirePermissions('enrollment.view')
  listStudents(@Query('search') search?: string) { return this.svc.listStudents(search); }
  @Patch('students/:id') @RequirePermissions('enrollment.manage')
  updateStudent(@Param('id') id: string, @Body() b: any) { return this.svc.updatePerson(id, b); }
  @Delete('students/:id') @RequirePermissions('enrollment.manage')
  deleteStudent(@Param('id') id: string) { return this.svc.deletePerson(id); }

  // Docentes
  @Post('teachers') @RequirePermissions('academic.manage')
  createTeacher(@Body() b: any) { return this.svc.createTeacher(b); }
  @Get('teachers') @RequirePermissions('academic.view')
  listTeachers(@Query('search') search?: string) { return this.svc.listTeachers(search); }
  @Patch('teachers/:profileId') @RequirePermissions('academic.manage')
  updateTeacher(@Param('profileId') id: string, @Body() b: any) { return this.svc.updateTeacherProfile(id, b); }
  @Put('teachers/:profileId/courses') @RequirePermissions('academic.manage')
  setCourses(@Param('profileId') id: string, @Body('courseIds') ids: string[]) { return this.svc.setTeacherCourses(id, ids || []); }
  @Put('teachers/:profileId/turnos') @RequirePermissions('academic.manage')
  setTurnos(@Param('profileId') id: string, @Body('turnoIds') ids: string[]) { return this.svc.setTeacherTurnos(id, ids || []); }
  @Put('teachers/:profileId/sedes') @RequirePermissions('academic.manage')
  setSedes(@Param('profileId') id: string, @Body('sedeIds') ids: string[]) { return this.svc.setTeacherSedes(id, ids || []); }
  @Put('teachers/:profileId/unavailable-days') @RequirePermissions('academic.manage')
  setUnavailable(@Param('profileId') id: string, @Body('days') days: number[]) { return this.svc.setTeacherUnavailableDays(id, days || []); }
}