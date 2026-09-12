import { Controller, Get, Post, Patch, Put, Delete, Body, Param, Query, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PeopleService } from './people.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { Auditable } from '../audit/audit.decorator';
import { Response } from 'express';

import {
  CreateStudentDto,
  UpdateStudentDto,
  UpdateStudentFullDto,
  ListStudentsQueryDto,
  PhotoInfoQueryDto,
} from './dto/student.dto';
import {
  CreateTeacherDto,
  UpdateTeacherProfileDto,
  UpdateTeacherFullDto,
  ListTeachersQueryDto,
} from './dto/teacher.dto';
import {
  SetTeacherCoursesDto,
  SetTeacherTurnosDto,
  SetTeacherSedesDto,
  SetTeacherUnavailableDaysDto,
  SetTeacherSedeDaysDto,
} from './dto/teacher-assignments.dto';

@ApiTags('Personas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('people')
export class PeopleController {
  constructor(private svc: PeopleService) {}

  // ===== ALUMNOS =====
  @Post('students')
  @RequirePermissions('enrollment.manage')
  @Auditable('CREATE', 'Estudiante')
  createStudent(@Body() dto: CreateStudentDto) {
    return this.svc.createStudent(dto);
  }

  @Get('students')
  @RequirePermissions('enrollment.view')
  listStudents(@Query() query: ListStudentsQueryDto) {
    return this.svc.listStudents(query.search);
  }

  @Get('students/export')
  @RequirePermissions('enrollment.view')
  async exportStudents(@Query() query: ListStudentsQueryDto, @Res() res: Response) {
    const b = await this.svc.exportStudentsExcel(query.search);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="alumnos.xlsx"',
    });
    res.send(b);
  }

  @Get('students/:id/enrollments')
  @RequirePermissions('enrollment.view')
  getEnrollments(@Param('id') id: string) {
    return this.svc.getStudentEnrollments(id);
  }

  @Get('students/:id/photo-info')
  @RequirePermissions('enrollment.view')
  getPhotoInfo(@Param('id') id: string, @Query() query: PhotoInfoQueryDto) {
    return this.svc.replaceStudentPhoto(id, query.newDni);
  }

  @Patch('students/:id')
  @RequirePermissions('enrollment.manage')
  @Auditable('UPDATE', 'Estudiante')
  updateStudent(@Param('id') id: string, @Body() dto: UpdateStudentDto) {
    return this.svc.updatePerson(id, dto);
  }

  @Patch('students/:id/full')
  @RequirePermissions('enrollment.manage')
  @Auditable('UPDATE', 'Student')
  updateStudentFull(@Param('id') id: string, @Body() dto: UpdateStudentFullDto) {
    return this.svc.updateStudentFull(id, dto);
  }

  @Delete('students/:id')
  @RequirePermissions('enrollment.manage')
  @Auditable('DELETE', 'Estudiante')
  deleteStudent(@Param('id') id: string) {
    return this.svc.deletePerson(id);
  }

  // ===== DOCENTES =====
  @Post('teachers')
  @RequirePermissions('academic.manage')
  @Auditable('CREATE', 'Docente')
  createTeacher(@Body() dto: CreateTeacherDto) {
    return this.svc.createTeacher(dto);
  }

  @Get('teachers')
  @RequirePermissions('academic.view')
  listTeachers(@Query() query: ListTeachersQueryDto) {
    return this.svc.listTeachers(query.search);
  }

  @Patch('teachers/:profileId')
  @RequirePermissions('academic.manage')
  @Auditable('UPDATE', 'Docente')
  updateTeacher(@Param('profileId') id: string, @Body() dto: UpdateTeacherProfileDto) {
    return this.svc.updateTeacherProfile(id, dto);
  }

  @Patch('teachers/:profileId/full')
  @RequirePermissions('academic.manage')
  @Auditable('UPDATE', 'Docente')
  updateTeacherFull(@Param('profileId') id: string, @Body() dto: UpdateTeacherFullDto) {
    return this.svc.updateTeacherFull(id, dto);
  }

  @Put('teachers/:profileId/courses')
  @RequirePermissions('academic.manage')
  @Auditable('UPDATE_COURSE', 'Docente - Curso')
  setCourses(@Param('profileId') id: string, @Body() dto: SetTeacherCoursesDto) {
    return this.svc.setTeacherCourses(id, dto.courseIds || []);
  }

  @Put('teachers/:profileId/turnos')
  @RequirePermissions('academic.manage')
  @Auditable('UPDATE_TURNS', 'Docente - Turno')
  setTurnos(@Param('profileId') id: string, @Body() dto: SetTeacherTurnosDto) {
    return this.svc.setTeacherTurnos(id, dto.turnoIds || []);
  }

  @Put('teachers/:profileId/sedes')
  @RequirePermissions('academic.manage')
  @Auditable('UPDATE_SEDE', 'Docente - Sede')
  setSedes(@Param('profileId') id: string, @Body() dto: SetTeacherSedesDto) {
    return this.svc.setTeacherSedes(id, dto.sedeIds || []);
  }

  @Put('teachers/:profileId/unavailable-days')
  @RequirePermissions('academic.manage')
  @Auditable('UPDATE_AVAILABILITY', 'Docente - Disponibilidad')
  setUnavailable(@Param('profileId') id: string, @Body() dto: SetTeacherUnavailableDaysDto) {
    return this.svc.setTeacherUnavailableDays(id, dto.days || []);
  }

  @Delete('teachers/:profileId')
  @RequirePermissions('academic.manage')
  @Auditable('DELETE', 'Docente')
  deleteTeacher(@Param('profileId') id: string) {
    return this.svc.deleteTeacher(id);
  }

  @Put('teachers/:profileId/sede-days')
  @RequirePermissions('academic.manage')
  @Auditable('UPDATE_SEDE_DAYS', 'Docente - Disponibilidad - Sedes')
  setSedeDays(@Param('profileId') id: string, @Body() dto: SetTeacherSedeDaysDto) {
    return this.svc.setTeacherSedeDays(id, dto.sedeId, dto.days || []);
  }
}