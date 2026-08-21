import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { EnrollmentService } from './enrollment.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { Auditable } from '../audit/audit.decorator';

@ApiTags('Matrículas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('enrollments')
export class EnrollmentController {
  constructor(private svc: EnrollmentService) {}
  
  @Post() @RequirePermissions('enrollment.manage') @Auditable('CREATE', 'Matricula')
  create(@Body() b: any): Promise<any> { return this.svc.create(b); }

  @Get() @RequirePermissions('enrollment.view')
  list(
    @Query('periodId') periodId?: string,
    @Query('sectionId') sectionId?: string,
    @Query('status') status?: string,
    @Query('studentSearch') studentSearch?: string,
  ): Promise<any> {
    return this.svc.list({ periodId, sectionId, status, studentSearch });
  }

  @Get('stats') @RequirePermissions('enrollment.view')
  stats(@Query('periodId') periodId?: string) {
    return this.svc.getStats(periodId);
  }

  @Patch(':id/status') @RequirePermissions('enrollment.manage') @Auditable('UPDATE', 'Matricula')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.svc.updateStatus(id, status);
  }

  @Delete(':id') @RequirePermissions('enrollment.manage') @Auditable('DELETE', 'Matricula')
  delete(@Param('id') id: string) { return this.svc.delete(id); }
}