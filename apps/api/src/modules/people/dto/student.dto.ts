import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsEmail,
  IsDateString,
  IsEnum,
  MaxLength,
  Matches,
  IsIn,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DocType } from '@suite/database';

const DNI_REGEX = /^\d{8}$/;
const CARNET_REGEX = /^0\d{0,8}$/;
const NAME_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
const PHONE_REGEX = /^[0-9+\-\s()]{6,20}$/;

export class CreateStudentDto {
  @ApiProperty({ example: 'Juan Carlos' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @Matches(NAME_REGEX, { message: 'El nombre solo puede contener letras y espacios' })
  @MaxLength(80)
  firstName: string;

  @ApiProperty({ example: 'Pérez García' })
  @IsString()
  @IsNotEmpty({ message: 'El apellido es requerido' })
  @Matches(NAME_REGEX, { message: 'El apellido solo puede contener letras y espacios' })
  @MaxLength(80)
  lastName: string;

  @ApiProperty({ required: false, example: '12345678' })
  @IsString()
  @IsOptional()
  @MaxLength(12)
  dni?: string;

  @ApiProperty({ required: false, example: '987654321' })
  @IsString()
  @IsOptional()
  @Matches(PHONE_REGEX, { message: 'Formato de teléfono inválido' })
  phone?: string;

  @ApiProperty({ required: false, example: 'alumno@email.com' })
  @IsEmail({}, { message: 'Email inválido' })
  @IsOptional()
  email?: string;

  @ApiProperty({ required: false, example: '2005-03-15' })
  @IsDateString({}, { message: 'Formato de fecha inválido (YYYY-MM-DD)' })
  @IsOptional()
  birthDate?: string;

  @ApiProperty({ required: false, enum: ['M', 'F', 'O'] })
  @IsString()
  @IsOptional()
  @IsIn(['M', 'F', 'O'], { message: 'Género debe ser M, F u O' })
  gender?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  address?: string;
}

export class UpdateStudentDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @Matches(NAME_REGEX, { message: 'El nombre solo puede contener letras y espacios' })
  @MaxLength(80)
  firstName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @Matches(NAME_REGEX, { message: 'El apellido solo puede contener letras y espacios' })
  @MaxLength(80)
  lastName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(12)
  dni?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @Matches(PHONE_REGEX, { message: 'Formato de teléfono inválido' })
  phone?: string;

  @ApiProperty({ required: false })
  @IsEmail({}, { message: 'Email inválido' })
  @IsOptional()
  email?: string;

  @ApiProperty({ required: false })
  @IsDateString({}, { message: 'Formato de fecha inválido' })
  @IsOptional()
  birthDate?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @IsIn(['M', 'F', 'O'], { message: 'Género debe ser M, F u O' })
  gender?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  address?: string;
}

export class UpdateStudentFullDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @Matches(NAME_REGEX, { message: 'El nombre solo puede contener letras y espacios' })
  @MaxLength(80)
  firstName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @Matches(NAME_REGEX, { message: 'El apellido solo puede contener letras y espacios' })
  @MaxLength(80)
  lastName?: string;

  @ApiProperty({ required: false, enum: DocType })
  @IsEnum(DocType, { message: 'Tipo de documento inválido' })
  @IsOptional()
  docType?: DocType;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(12)
  dni?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @Matches(PHONE_REGEX, { message: 'Formato de teléfono inválido' })
  phone?: string;

  @ApiProperty({ required: false })
  @IsEmail({}, { message: 'Email inválido' })
  @IsOptional()
  email?: string;

  @ApiProperty({ required: false })
  @IsDateString({}, { message: 'Formato de fecha inválido' })
  @IsOptional()
  birthDate?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @IsIn(['M', 'F', 'O'])
  gender?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  address?: string;

  @ApiProperty({ required: false, description: 'URL de la foto en Cloudinary' })
  @IsString()
  @IsOptional()
  photoUrl?: string;
}

export class ListStudentsQueryDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  search?: string;

  @ApiProperty({ 
    required: false, 
    description: 'Timestamp para cache-busting (ignorado por el backend)',
    example: '1789186933526' 
  })
  @IsString()
  @IsOptional()
  _t?: string;
}

export class PhotoInfoQueryDto {
  @ApiProperty({ required: true, description: 'Nuevo DNI para renombrar la foto' })
  @IsString()
  @IsNotEmpty({ message: 'newDni es requerido' })
  newDni: string;
}