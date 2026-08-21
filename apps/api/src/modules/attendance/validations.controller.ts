import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ValidationsService } from './validations.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Validaciones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('validations')
export class ValidationsController {
  constructor(private svc: ValidationsService) {}

  @Get() @RequirePermissions('attendance.view')
  getWeekStatus(@Query('periodId') periodId: string, @Query('weekNumber') weekNumber: string) {
    return this.svc.getWeekStatus(periodId, parseInt(weekNumber) || 1);
  }

  @Post() @RequirePermissions('attendance.validate')
  setStatus(@Body() body: any, @Request() req) {
    return this.svc.setStatus(body, req.user.id);
  }
}