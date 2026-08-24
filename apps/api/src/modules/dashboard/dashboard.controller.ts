import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { Response } from 'express';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private svc: DashboardService) {}

  @Get('overview') @RequirePermissions('dashboard.view')
  getOverview() { return this.svc.getOverview(); }

  @Get('charts') @RequirePermissions('dashboard.view')
  getCharts(@Query('periodId') periodId?: string, @Query('sedeId') sedeId?: string) {
    return this.svc.getCharts(periodId, sedeId);
  }

  @Get('export') @RequirePermissions('dashboard.view')
  async exportStats(@Res() res: Response) {
    const b = await this.svc.exportStats();
    res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': 'attachment; filename="estadisticas.xlsx"' });
    res.send(b);
  }
}