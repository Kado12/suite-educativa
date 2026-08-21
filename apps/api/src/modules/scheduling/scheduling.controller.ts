import { Controller, Get, Post, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SchedulingService } from './scheduling.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Horarios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('scheduling')
export class SchedulingController {
  constructor(private svc: SchedulingService) {}

  @Post('generate/:blockId') @RequirePermissions('scheduling.manage')
  generate(@Param('blockId') blockId: string) { return this.svc.generate(blockId); }

  @Get('result/:blockId') @RequirePermissions('scheduling.view')
  getResult(@Param('blockId') blockId: string) { return this.svc.getResult(blockId); }

  @Delete('clear/:blockId') @RequirePermissions('scheduling.manage')
  clear(@Param('blockId') blockId: string) { return this.svc.clear(blockId); }
}