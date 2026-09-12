import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';

import { GetDailyQueryDto, SaveDailyDto, GetWeeklyQueryDto } from './dto/attendance.dto';

@ApiTags('Asistencia')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private svc: AttendanceService) {}

  @Get('daily')
  @RequirePermissions('attendance.view')
  getDaily(@Query() query: GetDailyQueryDto) {
    return this.svc.getDaily(query.date, query.sedeId);
  }

  @Post('daily')
  @RequirePermissions('attendance.manage')
  saveDaily(@Body() dto: SaveDailyDto) {
    return this.svc.saveDaily(dto.date, dto.records);
  }

  @Get('weekly')
  @RequirePermissions('attendance.view')
  getWeekly(@Query() query: GetWeeklyQueryDto) {
    return this.svc.getWeekly(query.teacherProfileId, query.periodId, query.weekNumber);
  }
}