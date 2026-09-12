import { IsString, IsOptional, IsEnum, IsInt, Min, Max, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

export type GroupBy = 'teacher' | 'course' | 'sede' | 'area' | 'sedeCourse';
export type ReportMode = 'week' | 'month' | 'period' | 'block';

// Helper para transformar strings vacíos a undefined
const emptyToUndefined = () => Transform(({ value }) => {
  if (value === '' || value === null || value === undefined) return undefined;
  return value;
});

export class ConsolidatedQueryDto {
  @ApiProperty({ description: 'ID del período' })
  @IsString()
  periodId: string;

  @ApiProperty({ 
    enum: ['week', 'month', 'period', 'block'], 
    default: 'week',
    description: 'Modo de consolidación' 
  })
  @IsEnum(['week', 'month', 'period', 'block'] as ReportMode[], {
    message: 'Modo inválido. Debe ser week, month, period o block',
  })
  @IsOptional()
  mode?: ReportMode;

  @ApiProperty({ required: false, description: 'Número de semana (modo week)', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'weekNumber debe ser un número entero' })
  @Min(1, { message: 'La semana debe ser al menos 1' })
  @Max(52, { message: 'La semana no puede exceder 52' })
  weekNumber?: number;

  @ApiProperty({ 
    required: false, 
    description: 'Mes en formato YYYY-MM (modo month)',
    example: '2026-09' 
  })
  @emptyToUndefined()
  @IsString()
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'Formato de mes inválido. Debe ser YYYY-MM (ej: 2026-09)',
  })
  month?: string;

  @ApiProperty({ required: false, description: 'ID del bloque (modo block)' })
  @emptyToUndefined()
  @IsString()
  @IsOptional()
  blockId?: string;

  @ApiProperty({ 
    enum: ['teacher', 'course', 'sede', 'area', 'sedeCourse'],
    default: 'teacher',
    description: 'Agrupación de resultados' 
  })
  @IsEnum(['teacher', 'course', 'sede', 'area', 'sedeCourse'] as GroupBy[], {
    message: 'Agrupación inválida',
  })
  @IsOptional()
  groupBy?: GroupBy;

  @ApiProperty({ required: false, description: 'Filtrar por sede' })
  @emptyToUndefined()
  @IsString()
  @IsOptional()
  sedeId?: string;

  @ApiProperty({ required: false, description: 'Filtrar por área' })
  @emptyToUndefined()
  @IsString()
  @IsOptional()
  areaId?: string;

  @ApiProperty({ required: false, description: 'Filtrar por curso' })
  @emptyToUndefined()
  @IsString()
  @IsOptional()
  courseId?: string;

  @ApiProperty({ required: false, description: 'Filtrar por docente' })
  @emptyToUndefined()
  @IsString()
  @IsOptional()
  teacherProfileId?: string;
}

export class PhysicalAttendanceQueryDto {
  @ApiProperty({ description: 'ID del período' })
  @IsString()
  periodId: string;

  @ApiProperty({ description: 'Número de semana', example: 1, default: 1 })
  @Type(() => Number)
  @IsInt({ message: 'weekNumber debe ser un número entero' })
  @Min(1, { message: 'La semana debe ser al menos 1' })
  @Max(52, { message: 'La semana no puede exceder 52' })
  weekNumber: number;

  @ApiProperty({ required: false, description: 'Filtrar por sede' })
  @emptyToUndefined()
  @IsString()
  @IsOptional()
  sedeId?: string;

  @ApiProperty({ required: false, description: 'Filtrar por turno' })
  @emptyToUndefined()
  @IsString()
  @IsOptional()
  turnoId?: string;

  @ApiProperty({ required: false, description: 'Filtrar por sección' })
  @emptyToUndefined()
  @IsString()
  @IsOptional()
  sectionId?: string;
}