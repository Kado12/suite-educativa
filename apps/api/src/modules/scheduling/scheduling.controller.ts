import { Controller, Get, Post, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SchedulingService } from './scheduling.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { Auditable } from '../audit/audit.decorator';

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

  @Delete('clear/:blockId') @RequirePermissions('scheduling.manage') @Auditable('CLEAR', 'Horario')
  clear(@Param('blockId') blockId: string) { return this.svc.clear(blockId); }
}