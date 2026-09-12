import { Controller, Get, Patch, Delete, Post, Param, Body, UseInterceptors, UploadedFile, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SettingsService } from './settings.service';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';

import { UpdateSettingsDto, LogoType } from './dto/settings.dto';

@Controller('settings')
export class SettingsController {
  constructor(private svc: SettingsService) {}

  // Endpoint de debug (temporal, remover en producción)
  @Get('debug-cloudinary')
  async debugCloudinary() {
    const { v2: cloudinary } = await import('cloudinary');
    const result = await cloudinary.search
      .expression('folder:suite-educativa/dev*')
      .max_results(50)
      .execute();
    return result.resources.map((r: any) => ({
      public_id: r.public_id,
      folder: r.folder,
      url: r.secure_url,
    }));
  }

  /** Endpoint público: cualquier cliente puede leer la config */
  @Get('public')
  getPublic() {
    return this.svc.getMerged();
  }

  /** Endpoint protegido: solo admin puede ver/editar */
  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('academic.manage')
  getAll() {
    return this.svc.getAll();
  }

  @Patch()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('academic.manage')
  update(@Body() body: UpdateSettingsDto) {
    return this.svc.updateMany(body as Record<string, string>);
  }

  @Delete(':key')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('academic.manage')
  reset(@Param('key') key: string) {
    return this.svc.reset(key);
  }

  @Post('logo/:which')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('academic.manage')
  @UseInterceptors(FileInterceptor('file'))
  uploadLogo(@Param('which') which: LogoType, @UploadedFile() file: any) {
    return this.svc.uploadLogo(which, file);
  }
}