import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ValidationsService } from './validations.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';

import { GetWeekStatusQueryDto, SetStatusDto } from './dto/validations.dto';

@ApiTags('Validaciones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('validations')
export class ValidationsController {
  constructor(private svc: ValidationsService) {}

  @Get()
  @RequirePermissions('attendance.view')
  getWeekStatus(@Query() query: GetWeekStatusQueryDto) {
    return this.svc.getWeekStatus(query.periodId, query.weekNumber);
  }

  @Post()
  @RequirePermissions('attendance.validate')
  setStatus(@Body() dto: SetStatusDto, @Request() req) {
    return this.svc.setStatus(dto, req.user.id);
  }
}