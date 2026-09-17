import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { PrismaService } from '../../prisma/prisma.service';
import { STORAGE_FOLDER } from '../../config/storage';
import * as path from 'path';

export interface BulkPhotoResult {
  matched: number;
  updated: number;
  skipped: number;
  errors: {
    filename: string;
    reason: 'no_dni' | 'student_not_found' | 'duplicate_dni' | 'not_image' | 'too_large';
    detail?: string;
  }[];
}

@Injectable()
export class UploadService {
  constructor(private config: ConfigService, private prisma: PrismaService) {
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
      folder: STORAGE_FOLDER,
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
      await cloudinary.uploader.destroy(`${STORAGE_FOLDER}/${publicId}`, { invalidate: true });
    } catch {}
  }

  async renameImage(oldPublicId: string, newPublicId: string): Promise<string | null> {
    try {
      const result = await cloudinary.uploader.rename(
        `${STORAGE_FOLDER}/${oldPublicId}`,
        `${STORAGE_FOLDER}/${newPublicId}`,
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

  async bulkStudentPhotos(files: any[]): Promise<BulkPhotoResult> {
    const result: BulkPhotoResult = {
      matched: 0,
      updated: 0,
      skipped: 0,
      errors: [],
    };

    // 1. Pre-procesar todos los archivos: extraer DNI y detectar duplicados
    const dniCounter = new Map<string, number>();
    const fileMap: { file: any; dni: string | null }[] = [];

    for (const file of files) {
      // Validar que sea imagen
      if (!file.mimetype?.startsWith('image/')) {
        result.errors.push({
          filename: file.originalname,
          reason: 'not_image',
          detail: `Tipo ${file.mimetype} no soportado`,
        });
        continue;
      }
      // Validar tamaño
      if (file.size > 5 * 1024 * 1024) {
        result.errors.push({
          filename: file.originalname,
          reason: 'too_large',
          detail: `${(file.size / 1024 / 1024).toFixed(1)}MB (máx 5MB)`,
        });
        continue;
      }
      // Extraer DNI del nombre del archivo
      const dni = path.parse(file.originalname).name.replace(/\D/g, '');
      if (!dni || dni.length < 7) {
        result.errors.push({
          filename: file.originalname,
          reason: 'no_dni',
          detail: 'El nombre no contiene un DNI válido (mínimo 7 dígitos)',
        });
        continue;
      }
      // Normalizar a 8 dígitos
      const normalizedDni = dni.length === 7 ? '0' + dni : dni;
      dniCounter.set(normalizedDni, (dniCounter.get(normalizedDni) || 0) + 1);
      fileMap.push({ file, dni: normalizedDni });
    }

    // 2. Procesar los archivos válidos
    for (const { file, dni } of fileMap) {
      // Detectar duplicados
      if (dni && (dniCounter.get(dni) || 0) > 1) {
        result.errors.push({
          filename: file.originalname,
          reason: 'duplicate_dni',
          detail: `DNI ${dni} aparece en varios archivos`,
        });
        result.skipped++;
        continue;
      }

      // Buscar alumno
      const person = await this.prisma.person.findUnique({ where: { dni: dni! } });
      if (!person) {
        result.errors.push({
          filename: file.originalname,
          reason: 'student_not_found',
          detail: `No existe alumno con DNI ${dni}`,
        });
        continue;
      }

      // Subir y actualizar
      try {
        const url = await this.uploadImage(file.buffer, file.mimetype, dni);
        const hadPhoto = !!person.photoUrl;
        await this.prisma.person.update({ where: { id: person.id }, data: { photoUrl: url } });
        if (hadPhoto) result.updated++;
        else result.matched++;
      } catch {
        result.errors.push({
          filename: file.originalname,
          reason: 'not_image',
          detail: 'Error al subir a Cloudinary',
        });
      }
    }

    return result;
  }
}