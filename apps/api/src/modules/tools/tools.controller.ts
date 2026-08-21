import { Controller, Post, Res, UseGuards, UseInterceptors, UploadedFiles, UploadedFile } from '@nestjs/common';
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { ToolsService } from './tools.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';

const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

@ApiTags('Herramientas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tools')
export class ToolsController {
  constructor(private svc: ToolsService) {}

  @Post('compare') @RequirePermissions('tools.view')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'fileA', maxCount: 1 }, { name: 'fileB', maxCount: 1 }]))
  @ApiConsumes('multipart/form-data')
  compare(@UploadedFiles() files: any) {
    if (!files?.fileA?.[0] || !files?.fileB?.[0]) throw new Error('Sube ambos archivos');
    return this.svc.compare(files.fileA[0].buffer, files.fileB[0].buffer);
  }

  @Post('compare/export') @RequirePermissions('tools.view')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'fileA', maxCount: 1 }, { name: 'fileB', maxCount: 1 }]))
  async compareExport(@UploadedFiles() files: any, @Res() res: Response) {
    const b = await this.svc.compareExport(files.fileA[0].buffer, files.fileB[0].buffer);
    res.set({ 'Content-Type': XLSX, 'Content-Disposition': 'attachment; filename="comparativa.xlsx"' }); res.send(b);
  }

  @Post('schedule/transform') @RequirePermissions('tools.view')
  @UseInterceptors(FileInterceptor('file'))
  transform(@UploadedFile() file: any) {
    if (!file) throw new Error('Sube el archivo');
    return this.svc.transformSchedule(file.buffer);
  }

  @Post('schedule/transform/export') @RequirePermissions('tools.view')
  @UseInterceptors(FileInterceptor('file'))
  async transformExport(@UploadedFile() file: any, @Res() res: Response) {
    const b = await this.svc.scheduleExport(file.buffer);
    res.set({ 'Content-Type': XLSX, 'Content-Disposition': 'attachment; filename="horario_ordenado.xlsx"' }); res.send(b);
  }

  @Post('cross') @RequirePermissions('tools.view')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'fileInfo', maxCount: 1 }, { name: 'fileSchedule', maxCount: 1 }]))
  cross(@UploadedFiles() files: any) {
    if (!files?.fileInfo?.[0] || !files?.fileSchedule?.[0]) throw new Error('Sube ambos archivos');
    return this.svc.cross(files.fileInfo[0].buffer, files.fileSchedule[0].buffer);
  }

  @Post('cross/export') @RequirePermissions('tools.view')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'fileInfo', maxCount: 1 }, { name: 'fileSchedule', maxCount: 1 }]))
  async crossExport(@UploadedFiles() files: any, @Res() res: Response) {
    const b = await this.svc.crossExport(files.fileInfo[0].buffer, files.fileSchedule[0].buffer);
    res.set({ 'Content-Type': XLSX, 'Content-Disposition': 'attachment; filename="horario_con_dni.xlsx"' }); res.send(b);
  }
}