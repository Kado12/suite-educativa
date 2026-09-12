import { IsString, IsEnum, MaxLength, IsOptional, IsEmail, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSettingsDto {
  @ApiProperty({ required: false, description: 'Nombre de la institución', example: 'CPre-U' })
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  'institution.name'?: string;

  @ApiProperty({ required: false, description: 'Nombre corto', example: 'CPre' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  'institution.shortName'?: string;

  @ApiProperty({ required: false, description: 'Eslogan', example: 'Ingreso a la U' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  'institution.tagline'?: string;

  @ApiProperty({ required: false, description: 'Razón social', example: 'Centro de Preparación' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  'institution.legalName'?: string;

  @ApiProperty({ required: false, description: 'Número de documento/RUC', example: '20202020202' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9\-]+$/, { message: 'El documento contiene caracteres inválidos' })
  'institution.docNumber'?: string;

  @ApiProperty({ required: false, description: 'Dirección', example: 'Av. Universitaria 1234' })
  @IsString()
  @IsOptional()
  @MaxLength(300)
  'institution.address'?: string;

  @ApiProperty({ required: false, description: 'Teléfono', example: '+51 999-888-777' })
  @IsString()
  @IsOptional()
  @MaxLength(30)
  @Matches(/^[0-9+\-\s()]+$/, { message: 'El teléfono contiene caracteres inválidos' })
  'institution.phone'?: string;

  @ApiProperty({ required: false, description: 'Email institucional' })
  @IsEmail({}, { message: 'Email inválido' })
  @IsOptional()
  'institution.email'?: string;

  @ApiProperty({ required: false, description: 'Sitio web', example: 'cpre.uni.edu.pe' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  'institution.website'?: string;

  @ApiProperty({ required: false, description: 'Nombre de la aplicación' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  'app.name'?: string;

  @ApiProperty({ required: false, description: 'ID público del logo principal en Cloudinary' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  'logo.mainPublicId'?: string;

  @ApiProperty({ required: false, description: 'ID público del logo secundario en Cloudinary' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  'logo.secondPublicId'?: string;
}

export type LogoType = 'main' | 'second';