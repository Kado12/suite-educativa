import { Controller, Get, Patch, Body, Param, Query, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { Auditable } from '../audit/audit.decorator';
import { Response } from 'express';

@ApiTags('Pagos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private svc: PaymentsService) {}

  @Get() @RequirePermissions('payments.view')
  list(
    @Query('periodId') periodId?: string,
    @Query('status') status?: string,
    @Query('studentSearch') studentSearch?: string,
  ): Promise<any> {
    return this.svc.list({ periodId, status, studentSearch });
  }

  @Get('stats') @RequirePermissions('payments.view')
  stats(@Query('periodId') periodId?: string) {
    return this.svc.getStats(periodId);
  }

  @Get('export') @RequirePermissions('payments.view')
  async export(@Query('periodId') periodId: string, @Query('status') status: string, @Query('studentSearch') studentSearch: string, @Res() res: Response) {
    const b = await this.svc.exportExcel({ periodId, status, studentSearch });
    res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': 'attachment; filename="pagos.xlsx"' });
    res.send(b);
  }

  @Patch(':id/paid') @RequirePermissions('payments.manage') @Auditable('MARK_PAID', 'Pago')
  markPaid(@Param('id') id: string, @Body() b: { paidAmount?: number; paidDate?: string }): Promise<any> {
    return this.svc.markPaid(id, b.paidAmount, b.paidDate);
  }

  @Patch(':id/overdue') @RequirePermissions('payments.manage') @Auditable('MARK_OVERDUE', 'Pago')
  markOverdue(@Param('id') id: string): Promise<any> { return this.svc.markOverdue(id); }

  @Patch(':id/reset') @RequirePermissions('payments.manage') @Auditable('RESET_PAYMENT', 'Pago')
  reset(@Param('id') id: string): Promise<any> { return this.svc.resetToPending(id); }
}