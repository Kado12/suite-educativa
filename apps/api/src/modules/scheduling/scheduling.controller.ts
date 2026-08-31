import { Controller, Get, Post, Delete, Param, UseGuards, Query, Res, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SchedulingService } from './scheduling.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { Auditable } from '../audit/audit.decorator';
import { Response } from 'express';

@ApiTags('Horarios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('scheduling')
export class SchedulingController {
  constructor(private svc: SchedulingService) {}

  @Post('generate/:blockId') @RequirePermissions('scheduling.manage') @Auditable('GENERATE', 'Horario')
  generate(@Param('blockId') blockId: string) { return this.svc.generate(blockId); }

  @Get('result/:blockId') @RequirePermissions('scheduling.view')
  getResult(@Param('blockId') blockId: string) { return this.svc.getResult(blockId); }

  @Get('export/:blockId') @RequirePermissions('scheduling.view')
  async export(
    @Param('blockId') blockId: string,
    @Query('sedeId') sedeId: string, @Query('teacherProfileId') teacherProfileId: string,
    @Query('areaId') areaId: string, @Query('turnoId') turnoId: string, @Query('sectionId') sectionId: string,
    @Res() res: Response,
  ) {
    const b = await this.svc.exportExcel({ blockId, sedeId, teacherProfileId, areaId, turnoId, sectionId });
    res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': 'attachment; filename="horario.xlsx"' });
    res.send(b);
  }

  @Get('validate/:blockId') @RequirePermissions('scheduling.view')
  validate(@Param('blockId') b: string) { return this.svc.validate(b); }

  @Get('sessions/:blockId') @RequirePermissions('scheduling.view')
  listSessions(@Param('blockId') b: string) { return this.svc.listSessions(b); }

  @Patch('sessions/:id') @RequirePermissions('scheduling.manage') @Auditable('UPDATE', 'Horario - Sesion')
  updateSession(@Param('id') id: string, @Body() b: any) { return this.svc.updateSession(id, b); }

  @Post('sessions') @RequirePermissions('scheduling.manage') @Auditable('CREATE', 'Horario - Sesion')
  createSession(@Body() b: any) { return this.svc.createSession(b); }

  @Delete('sessions/:id') @RequirePermissions('scheduling.manage') @Auditable('DELETE', 'Horario - Sesion')
  deleteSession(@Param('id') id: string) { return this.svc.deleteSession(id); }

  @Delete('clear/:blockId') @RequirePermissions('scheduling.manage') @Auditable('CLEAR', 'Horario')
  clear(@Param('blockId') blockId: string) { return this.svc.clear(blockId); }
}