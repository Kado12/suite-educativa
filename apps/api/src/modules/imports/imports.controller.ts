import { Controller, Get, Post, Param, Res, UseGuards, UseInterceptors, UploadedFile, Body, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { ImportsService } from './imports.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';

import { ImportFileParamDto, ImportFileBodyDto, ImportScheduleBodyDto } from './dto/imports.dto';

@ApiTags('Importaciones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('imports')
export class ImportsController {
  constructor(private svc: ImportsService) {}

  @Get('template/:type')
  @RequirePermissions('academic.manage')
  async template(@Param() param: ImportFileParamDto, @Res() res: Response) {
    const b = await this.svc.generateTemplate(param.type);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="plantilla-${param.type}.xlsx"`,
    });
    res.send(b);
  }

  @Post(':type')
  @RequirePermissions('academic.manage')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  async importFile(
    @Param() param: ImportFileParamDto,
    @UploadedFile() file: any,
    @Body() body: ImportFileBodyDto,
  ) {
    if (!file) throw new BadRequestException('Debes subir un archivo');
    return this.svc.importFile(param.type, file.buffer, body.blockId, body.sedeId);
  }

  @Post('horario')
  @RequirePermissions('academic.manage')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  async importSchedule(@UploadedFile() file: any, @Body() body: ImportScheduleBodyDto) {
    if (!file) throw new BadRequestException('Sube un archivo');
    return this.svc.importSchedule(file.buffer, body.blockId, body.sedeId);
  }
}