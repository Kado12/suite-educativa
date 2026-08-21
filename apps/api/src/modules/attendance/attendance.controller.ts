import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Asistencia')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private svc: AttendanceService) {}

  @Get('daily') @RequirePermissions('attendance.view')
  getDaily(@Query('date') date: string, @Query('sedeId') sedeId?: string) {
    return this.svc.getDaily(date, sedeId);
  }

  @Post('daily') @RequirePermissions('attendance.manage')
  saveDaily(@Body() body: { date: string; records: any[] }) {
    return this.svc.saveDaily(body.date, body.records);
  }

  @Get('weekly') @RequirePermissions('attendance.view')
  getWeekly(
    @Query('teacherProfileId') teacherProfileId: string,
    @Query('periodId') periodId: string,
    @Query('weekNumber') weekNumber: string,
  ) {
    return this.svc.getWeekly(teacherProfileId, periodId, parseInt(weekNumber) || 1);
  }
}