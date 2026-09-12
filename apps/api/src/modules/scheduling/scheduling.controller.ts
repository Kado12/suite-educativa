import { Controller, Get, Post, Delete, Param, UseGuards, Query, Res, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SchedulingService } from './scheduling.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { Auditable } from '../audit/audit.decorator';
import { Response } from 'express';

import { CreateSessionDto, UpdateSessionDto } from './dto/session.dto';
import { ExportSchedulingQueryDto } from './dto/queries.dto';

@ApiTags('Horarios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('scheduling')
export class SchedulingController {
  constructor(private svc: SchedulingService) {}

  @Post('generate/:blockId')
  @RequirePermissions('scheduling.manage')
  @Auditable('GENERATE', 'Horario')
  generate(@Param('blockId') blockId: string) {
    return this.svc.generate(blockId);
  }

  @Get('result/:blockId')
  @RequirePermissions('scheduling.view')
  getResult(@Param('blockId') blockId: string) {
    return this.svc.getResult(blockId);
  }

  @Get('export/:blockId')
  @RequirePermissions('scheduling.view')
  async export(
    @Param('blockId') blockId: string,
    @Query() query: ExportSchedulingQueryDto,
    @Res() res: Response,
  ) {
    const b = await this.svc.exportExcel({ blockId, ...query });
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="horario.xlsx"',
    });
    res.send(b);
  }

  @Get('validate/:blockId')
  @RequirePermissions('scheduling.view')
  validate(@Param('blockId') blockId: string) {
    return this.svc.validate(blockId);
  }

  @Get('sessions/:blockId')
  @RequirePermissions('scheduling.view')
  listSessions(@Param('blockId') blockId: string) {
    return this.svc.listSessions(blockId);
  }

  @Patch('sessions/:id')
  @RequirePermissions('scheduling.manage')
  @Auditable('UPDATE', 'Horario - Sesion')
  updateSession(@Param('id') id: string, @Body() dto: UpdateSessionDto) {
    return this.svc.updateSession(id, dto);
  }

  @Post('sessions')
  @RequirePermissions('scheduling.manage')
  @Auditable('CREATE', 'Horario - Sesion')
  createSession(@Body() dto: CreateSessionDto) {
    return this.svc.createSession(dto);
  }

  @Delete('sessions/:id')
  @RequirePermissions('scheduling.manage')
  @Auditable('DELETE', 'Horario - Sesion')
  deleteSession(@Param('id') id: string) {
    return this.svc.deleteSession(id);
  }

  @Delete('clear/:blockId')
  @RequirePermissions('scheduling.manage')
  @Auditable('CLEAR', 'Horario')
  clear(@Param('blockId') blockId: string) {
    return this.svc.clear(blockId);
  }
}