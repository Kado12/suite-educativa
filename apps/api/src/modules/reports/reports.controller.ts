import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService, GroupBy, ReportMode } from './reports.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Reportes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('reports')
export class ReportsController {
  constructor(private svc: ReportsService) {}

  private parse(q: any) {
    return {
      periodId: q.periodId, mode: (q.mode || 'week') as ReportMode,
      weekNumber: q.weekNumber ? parseInt(q.weekNumber) : undefined,
      month: q.month, blockId: q.blockId, groupBy: (q.groupBy || 'teacher') as GroupBy,
      sedeId: q.sedeId, areaId: q.areaId, courseId: q.courseId, teacherProfileId: q.teacherProfileId,
    };
  }

  @Get('consolidated') @RequirePermissions('reports.view')
  getConsolidated(@Query() q: any) { return this.svc.getConsolidated(this.parse(q)); }

  @Get('export') @RequirePermissions('reports.view')
  async exportExcel(@Query() q: any, @Res() res: Response) {
    const buffer = await this.svc.exportExcel(this.parse(q));
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="consolidado-${q.groupBy}.xlsx"`,
    });
    res.send(buffer);
  }
}