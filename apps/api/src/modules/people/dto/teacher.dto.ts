import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsEmail,
  IsInt,
  Min,
  Max,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

const DNI_REGEX = /^\d{8}$/;
const NAME_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
const PHONE_REGEX = /^[0-9+\-\s()]{6,20}$/;

export class CreateTeacherDto {
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

  @ApiProperty({ example: '12345678', description: 'DNI obligatorio para docentes' })
  @IsString()
  @IsNotEmpty({ message: 'El DNI es requerido para docentes' })
  @Matches(DNI_REGEX, { message: 'El DNI debe tener exactamente 8 dígitos' })
  dni: string;

  @ApiProperty({ required: false, example: '987654321' })
  @IsString()
  @IsOptional()
  @Matches(PHONE_REGEX, { message: 'Formato de teléfono inválido' })
  phone?: string;

  @ApiProperty({ required: false, example: 'docente@email.com' })
  @IsEmail({}, { message: 'Email inválido' })
  @IsOptional()
  email?: string;

  @ApiProperty({ required: false, default: 5, minimum: 1, maximum: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La prioridad debe ser un número entero' })
  @Min(1)
  @Max(10)
  priority?: number;

  @ApiProperty({ required: false, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  yearsExperience?: number;

  @ApiProperty({ required: false, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxSessionsPerWeek?: number;

  @ApiProperty({ required: false, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxSections?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}

export class UpdateTeacherProfileDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  priority?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  yearsExperience?: number | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxSessionsPerWeek?: number | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxSections?: number | null;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string | null;
}

export class UpdateTeacherFullDto {
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
  @Matches(DNI_REGEX, { message: 'El DNI debe tener exactamente 8 dígitos' })
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
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  priority?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  yearsExperience?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxSessionsPerWeek?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxSections?: number;
}

export class ListTeachersQueryDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  search?: string;
}