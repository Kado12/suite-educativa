import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class UploadService {
  constructor(private config: ConfigService) {
    cloudinary.config({
      cloud_name: this.config.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.config.get('CLOUDINARY_API_KEY'),
      api_secret: this.config.get('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadImage(buffer: Buffer, mimetype: string, publicId?: string): Promise<string> {
    if (!mimetype.startsWith('image/')) {
      throw new BadRequestException('El archivo debe ser una imagen');
    }
    if (buffer.length > 5 * 1024 * 1024) {
      throw new BadRequestException('La imagen no puede superar los 5MB');
    }

    const options: any = {
      folder: 'suite-educativa',
      resource_type: 'image',
      transformation: [{ width: 1600, height: 900, crop: 'limit' }],
    };
    if (publicId) {
      options.public_id = publicId;
      options.overwrite = true;
    }

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        options,
        (error, result) => {
          if (error) reject(new BadRequestException('Error al subir la imagen'));
          else resolve(result!.secure_url);
        },
      );
      stream.end(buffer);
    });
  }
  
  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(`suite-educativa/${publicId}`, { invalidate: true });
    } catch {}
  }

  async renameImage(oldPublicId: string, newPublicId: string): Promise<string | null> {
    try {
      const result = await cloudinary.uploader.rename(
        `suite-educativa/${oldPublicId}`,
        `suite-educativa/${newPublicId}`,
        { overwrite: true },
      );
      return result.secure_url;
    } catch {
      return null;
    }
  }

  async replaceImage(buffer: Buffer, mimetype: string, oldPublicId: string | null, newPublicId: string): Promise<string> {
    if (oldPublicId) await this.deleteImage(oldPublicId);
    return this.uploadImage(buffer, mimetype, newPublicId);
  }
}