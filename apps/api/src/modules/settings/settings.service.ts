import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class SettingsService {
  private cache: Record<string, string> | null = null;
  private cacheAt = 0;

  constructor(
    private prisma: PrismaService,
    private upload: UploadService,
    private config: ConfigService,
  ) {}

  /** Valores por defecto (pueden venir de ENV o hardcodeados) */
  private getDefaults(): Record<string, string> {
    return {
      'institution.name': this.config.get('INSTITUTION_NAME') || 'CPre-U',
      'institution.shortName': this.config.get('INSTITUTION_SHORT_NAME') || 'CPre',
      'institution.tagline': this.config.get('INSTITUTION_TAGLINE') || 'Ingreso a la U',
      'institution.legalName': this.config.get('INSTITUTION_LEGAL_NAME') || 'Centro de Preparación para la Universidad',
      'institution.docNumber': this.config.get('INSTITUTION_DOC_NUMBER') || '20202020202',
      'institution.address': this.config.get('INSTITUTION_ADDRESS') || 'Av. Universitaria 1234, Lima, Perú',
      'institution.phone': this.config.get('INSTITUTION_PHONE') || '+51 999-888-777',
      'institution.email': this.config.get('INSTITUTION_EMAIL') || 'cpre@uni.edu.pe',
      'institution.website': this.config.get('INSTITUTION_WEBSITE') || 'cpre.uni.edu.pe',
      'app.name': this.config.get('APP_NAME') || 'Suite Académica',
      'logo.mainPublicId': this.config.get('LOGO_MAIN_PUBLIC_ID') || 'logo-cpre',
      'logo.secondPublicId': this.config.get('LOGO_SECOND_PUBLIC_ID') || 'logo-u',
    };
  }

  /** BD → ENV/default (con cache de 60s) */
  async getMerged(): Promise<Record<string, string>> {
    if (this.cache && Date.now() - this.cacheAt < 60_000) return this.cache;
    const rows = await this.prisma.setting.findMany();
    const db = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    const defaults = this.getDefaults();
    const merged: Record<string, string> = {};
    for (const [k, defaultVal] of Object.entries(defaults)) {
      merged[k] = db[k] !== undefined && db[k] !== null && db[k] !== '' ? db[k]! : defaultVal;
    }
    this.cache = merged;
    this.cacheAt = Date.now();
    return merged;
  }

  /** Para la UI: muestra qué viene de BD y qué de default */
  async getAll() {
    const rows = await this.prisma.setting.findMany();
    const db = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    const defaults = this.getDefaults();
    return Object.entries(defaults).map(([key, defaultVal]) => ({
      key,
      defaultVal,
      dbValue: db[key] ?? null,
      value: db[key] !== undefined && db[key] !== null && db[key] !== '' ? db[key] : defaultVal,
      source: db[key] !== undefined && db[key] !== null && db[key] !== '' ? 'db' : 'default',
    }));
  }

  async updateMany(data: Record<string, string>) {
    const defaults = this.getDefaults();
    for (const [key, value] of Object.entries(data)) {
      if (!(key in defaults)) continue;
      await this.prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }
    this.cache = null;
    return this.getMerged();
  }

  async reset(key: string) {
    await this.prisma.setting.deleteMany({ where: { key } });
    this.cache = null;
    return this.getMerged();
  }

  async uploadLogo(which: 'main' | 'second', file: any) {
    const publicId = `institution/logo-${which}`;
    const url = await this.upload.uploadImage(file.buffer, file.mimetype, publicId);
    await this.updateMany({ [`logo.${which}PublicId`]: publicId });
    return { publicId, url };
  }
}