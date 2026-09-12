import { Controller, Get, Patch, Body, Param, Query, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { Auditable } from '../audit/audit.decorator';
import { Response } from 'express';

import { MarkPaidDto } from './dto/payment-operations.dto';
import { ListPaymentsQueryDto, ExportPaymentsQueryDto, StatsQueryDto } from './dto/queries.dto';

@ApiTags('Pagos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private svc: PaymentsService) {}

  @Get()
  @RequirePermissions('payments.view')
  list(@Query() query: ListPaymentsQueryDto): Promise<any> {
    return this.svc.list(query);
  }

  @Get('stats')
  @RequirePermissions('payments.view')
  stats(@Query() query: StatsQueryDto) {
    return this.svc.getStats(query.periodId);
  }

  @Get('export')
  @RequirePermissions('payments.view')
  async export(@Query() query: ExportPaymentsQueryDto, @Res() res: Response) {
    const b = await this.svc.exportExcel(query);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="pagos.xlsx"',
    });
    res.send(b);
  }

  @Patch(':id/paid')
  @RequirePermissions('payments.manage')
  @Auditable('MARK_PAID', 'Payment')
  markPaid(@Param('id') id: string, @Body() dto: MarkPaidDto): Promise<any> {
    return this.svc.markPaid(id, dto.paidAmount, dto.paidDate, dto.reference);
  }

  @Patch(':id/overdue')
  @RequirePermissions('payments.manage')
  @Auditable('MARK_OVERDUE', 'Pago')
  markOverdue(@Param('id') id: string): Promise<any> {
    return this.svc.markOverdue(id);
  }

  @Patch(':id/reset')
  @RequirePermissions('payments.manage')
  @Auditable('RESET_PAYMENT', 'Pago')
  reset(@Param('id') id: string): Promise<any> {
    return this.svc.resetToPending(id);
  }
}