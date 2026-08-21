import { Controller, Get, Post, Param, Res, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { ImportsService } from './imports.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Importaciones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('imports')
export class ImportsController {
  constructor(private svc: ImportsService) {}

  @Get('template/:type') @RequirePermissions('academic.manage')
  async template(@Param('type') type: string, @Res() res: Response) {
    const b = await this.svc.generateTemplate(type);
    res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="plantilla-${type}.xlsx"` });
    res.send(b);
  }

  @Post(':type') @RequirePermissions('academic.manage')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  async importFile(@Param('type') type: string, @UploadedFile() file: any) {
    if (!file) throw new Error('Debes subir un archivo');
    return this.svc.importFile(type, file.buffer);
  }
}