import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';

import { ListAuditLogsQueryDto, AuditStatsQueryDto } from './dto/queries.dto';

@ApiTags('Auditoría')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('audit')
export class AuditController {
  constructor(private svc: AuditService) {}

  @Get()
  @RequirePermissions('users.view')
  list(@Query() query: ListAuditLogsQueryDto): Promise<any> {
    return this.svc.list({
      userId: query.userId,
      entity: query.entity,
      action: query.action,
      startDate: query.startDate,
      endDate: query.endDate,
      page: query.page || 1,
      pageSize: query.pageSize || 50,
    });
  }

  @Get('stats')
  @RequirePermissions('users.view')
  stats(@Query() query: AuditStatsQueryDto) {
    return this.svc.getStats(query.days || 30);
  }
}