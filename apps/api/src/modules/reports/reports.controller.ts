import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';

import { ConsolidatedQueryDto, PhysicalAttendanceQueryDto } from './dto/queries.dto';

@ApiTags('Reportes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('reports')
export class ReportsController {
  constructor(private svc: ReportsService) {}

  @Get('consolidated')
  @RequirePermissions('reports.view')
  getConsolidated(@Query() query: ConsolidatedQueryDto) {
    return this.svc.getConsolidated({
      periodId: query.periodId,
      mode: query.mode || 'week',
      weekNumber: query.weekNumber,
      month: query.month,
      blockId: query.blockId,
      groupBy: query.groupBy || 'teacher',
      sedeId: query.sedeId,
      areaId: query.areaId,
      courseId: query.courseId,
      teacherProfileId: query.teacherProfileId,
    });
  }

  @Get('export')
  @RequirePermissions('reports.view')
  async exportExcel(@Query() query: ConsolidatedQueryDto, @Res() res: Response) {
    const buffer = await this.svc.exportExcel({
      periodId: query.periodId,
      mode: query.mode || 'week',
      weekNumber: query.weekNumber,
      month: query.month,
      blockId: query.blockId,
      groupBy: query.groupBy || 'teacher',
      sedeId: query.sedeId,
      areaId: query.areaId,
      courseId: query.courseId,
      teacherProfileId: query.teacherProfileId,
    });
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="consolidado-${query.groupBy || 'teacher'}.xlsx"`,
    });
    res.send(buffer);
  }

  @Get('physical-attendance')
  @RequirePermissions('reports.view')
  async physicalAttendance(@Query() query: PhysicalAttendanceQueryDto, @Res() res: Response) {
    const b = await this.svc.exportPhysicalAttendance({
      periodId: query.periodId,
      weekNumber: query.weekNumber || 1,
      sedeId: query.sedeId,
      turnoId: query.turnoId,
      sectionId: query.sectionId,
    });
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="asistencia-fisica.xlsx"',
    });
    res.send(b);
  }
}