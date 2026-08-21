import { Controller, Post, Get, Res, Param, UseGuards, UseInterceptors, UploadedFiles, UploadedFile, Request } from '@nestjs/common';
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { ToolsService } from './tools.service';
import { AuditService } from '../audit/audit.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { PrismaService } from '../../prisma/prisma.service';

const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

@ApiTags('Herramientas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tools')
export class ToolsController {
  constructor(private svc: ToolsService, private audit: AuditService, private prisma: PrismaService) {}

  private async logTool(user: any, action: string, details: any, ip: string) {
    let userName = `${user.lastName}, ${user.firstName}`;
    let userEmail = user.email;
    try {
      const fullUser = await this.prisma.user.findUnique({ where: { id: user.id } });
      if (fullUser) {
        userName = `${fullUser.lastName}, ${fullUser.firstName}`;
        userEmail = fullUser.email;
      }
    } catch {}

    this.audit.log({
      userId: user.id,
      userName,
      userEmail,
      action,
      entity: 'Tool',
      details,
      ipAddress: ip,
    }).catch(() => {});
  }

  @Get('template/:type') @RequirePermissions('tools.view')
  async template(@Param('type') type: string, @Res() res: Response) {
    const b = await this.svc.generateToolTemplate(type);
    res.set({ 'Content-Type': XLSX, 'Content-Disposition': `attachment; filename="plantilla-${type}.xlsx"` });
    res.send(b);
  }

  @Post('preview') @RequirePermissions('tools.view')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  preview(@UploadedFile() file: any) {
    if (!file) throw new Error('Sube un archivo');
    return this.svc.preview(file.buffer);
  }

  @Post('compare') @RequirePermissions('tools.view')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'fileA', maxCount: 1 }, { name: 'fileB', maxCount: 1 }]))
  @ApiConsumes('multipart/form-data')
  async compare(@UploadedFiles() files: any, @Request() req) {
    if (!files?.fileA?.[0] || !files?.fileB?.[0]) throw new Error('Sube ambos archivos');
    const result = await this.svc.compare(files.fileA[0].buffer, files.fileB[0].buffer);
    this.logTool(req.user, 'COMPARE', {
      fileA: files.fileA[0].originalname,
      fileB: files.fileB[0].originalname,
      summary: result.summary,
    }, req.ip);
    return result;
  }

  @Post('compare/export') @RequirePermissions('tools.view')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'fileA', maxCount: 1 }, { name: 'fileB', maxCount: 1 }]))
  async compareExport(@UploadedFiles() files: any, @Res() res: Response) {
    const b = await this.svc.compareExport(files.fileA[0].buffer, files.fileB[0].buffer);
    res.set({ 'Content-Type': XLSX, 'Content-Disposition': 'attachment; filename="comparativa.xlsx"' }); res.send(b);
  }

  @Post('schedule/transform') @RequirePermissions('tools.view')
  @UseInterceptors(FileInterceptor('file'))
  async transform(@UploadedFile() file: any, @Request() req) {
    if (!file) throw new Error('Sube el archivo');
    const result = await this.svc.transformSchedule(file.buffer);
    this.logTool(req.user, 'TRANSFORM', {
      file: file.originalname,
      totalRows: result.total,
    }, req.ip);
    return result;
  }

  @Post('schedule/transform/export') @RequirePermissions('tools.view')
  @UseInterceptors(FileInterceptor('file'))
  async transformExport(@UploadedFile() file: any, @Res() res: Response) {
    const b = await this.svc.scheduleExport(file.buffer);
    res.set({ 'Content-Type': XLSX, 'Content-Disposition': 'attachment; filename="horario_ordenado.xlsx"' }); res.send(b);
  }

  @Post('cross') @RequirePermissions('tools.view')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'fileInfo', maxCount: 1 }, { name: 'fileSchedule', maxCount: 1 }]))
  @ApiConsumes('multipart/form-data')
  async cross(@UploadedFiles() files: any, @Request() req) {
    if (!files?.fileInfo?.[0] || !files?.fileSchedule?.[0]) throw new Error('Sube ambos archivos');
    const result = await this.svc.cross(files.fileInfo[0].buffer, files.fileSchedule[0].buffer);
    this.logTool(req.user, 'CROSS', {
      fileInfo: files.fileInfo[0].originalname,
      fileSchedule: files.fileSchedule[0].originalname,
      summary: result.summary,
    }, req.ip);
    return result;
  }

  @Post('cross/export') @RequirePermissions('tools.view')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'fileInfo', maxCount: 1 }, { name: 'fileSchedule', maxCount: 1 }]))
  async crossExport(@UploadedFiles() files: any, @Res() res: Response) {
    const b = await this.svc.crossExport(files.fileInfo[0].buffer, files.fileSchedule[0].buffer);
    res.set({ 'Content-Type': XLSX, 'Content-Disposition': 'attachment; filename="horario_con_dni.xlsx"' }); res.send(b);
  }
}