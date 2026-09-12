import { Controller, Post, UseGuards, UseInterceptors, UploadedFile, Body, UploadedFiles, BadRequestException } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

import { UploadImageDto, ReplaceImageDto } from './dto/upload.dto';

@ApiTags('Upload')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('upload')
export class UploadController {
  constructor(private svc: UploadService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  async upload(@UploadedFile() file: any, @Body() body: UploadImageDto) {
    if (!file) throw new BadRequestException('Debes subir un archivo');
    const url = await this.svc.uploadImage(file.buffer, file.mimetype, body.publicId);
    return { url };
  }

  @Post('replace-image')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  async replace(@UploadedFile() file: any, @Body() body: ReplaceImageDto) {
    if (!file) throw new BadRequestException('Debes subir un archivo');
    const url = await this.svc.replaceImage(
      file.buffer,
      file.mimetype,
      body.oldPublicId || null,
      body.newPublicId,
    );
    return { url };
  }

  @Post('bulk-student-photos')
  @UseInterceptors(FilesInterceptor('files'))
  @ApiConsumes('multipart/form-data')
  async bulkPhotos(@UploadedFiles() files: any[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Debes subir al menos una imagen');
    }
    return this.svc.bulkStudentPhotos(files);
  }
}