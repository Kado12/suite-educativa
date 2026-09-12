import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  IsDateString,
  IsArray,
  ValidateNested,
  ArrayMaxSize,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { AttendanceStatus } from '@suite/database';

export class GetDailyQueryDto {
  @ApiProperty({ 
    description: 'Fecha en formato ISO 8601 (YYYY-MM-DD)',
    example: '2026-09-12' 
  })
  @IsString()
  @IsNotEmpty({ message: 'La fecha es requerida' })
  @IsDateString({}, { message: 'Formato de fecha inválido (YYYY-MM-DD)' })
  date: string;

  @ApiProperty({ required: false, description: 'Filtrar por sede' })
  @IsString()
  @IsOptional()
  sedeId?: string;
}

export class AttendanceRecordItemDto {
  @ApiProperty({ description: 'ID de la sesión' })
  @IsString()
  @IsNotEmpty({ message: 'El sessionId es requerido' })
  sessionId: string;

  @ApiProperty({ enum: AttendanceStatus, example: 'PRESENT' })
  @IsEnum(AttendanceStatus, {
    message: 'El estado debe ser PRESENT o ABSENT',
  })
  @IsNotEmpty({ message: 'El estado es requerido' })
  status: AttendanceStatus;

  @ApiProperty({ 
    required: false, 
    description: 'Minutos de tardanza (0 si no aplica)',
    example: 0,
    minimum: 0,
    maximum: 180 
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Los minutos de tardanza deben ser un número entero' })
  @Min(0, { message: 'Los minutos de tardanza no pueden ser negativos' })
  @Max(180, { message: 'Los minutos de tardanza no pueden exceder 180 (3 horas)' })
  lateMinutes?: number;

  @ApiProperty({ 
    required: false, 
    description: 'Snapshot del docente que dictó (override)',
  })
  @IsString()
  @IsOptional()
  teacherProfileId?: string | null;

  @ApiProperty({ 
    required: false, 
    description: 'Snapshot del curso dictado (override)',
  })
  @IsString()
  @IsOptional()
  courseId?: string | null;
}

export class SaveDailyDto {
  @ApiProperty({ 
    description: 'Fecha en formato ISO 8601 (YYYY-MM-DD)',
    example: '2026-09-12' 
  })
  @IsString()
  @IsNotEmpty({ message: 'La fecha es requerida' })
  @IsDateString({}, { message: 'Formato de fecha inválido (YYYY-MM-DD)' })
  date: string;

  @ApiProperty({ 
    type: [AttendanceRecordItemDto],
    description: 'Lista de registros de asistencia' 
  })
  @IsArray({ message: 'records debe ser un array' })
  @ValidateNested({ each: true })
  @ArrayMaxSize(500, { message: 'Máximo 500 registros por envío' })
  @Type(() => AttendanceRecordItemDto)
  records: AttendanceRecordItemDto[];
}

export class GetWeeklyQueryDto {
  @ApiProperty({ description: 'ID del perfil docente' })
  @IsString()
  @IsNotEmpty({ message: 'El teacherProfileId es requerido' })
  teacherProfileId: string;

  @ApiProperty({ description: 'ID del período' })
  @IsString()
  @IsNotEmpty({ message: 'El periodId es requerido' })
  periodId: string;

  @ApiProperty({ description: 'Número de semana', example: 1 })
  @Type(() => Number)
  @IsInt({ message: 'weekNumber debe ser un número entero' })
  @Min(1, { message: 'La semana debe ser al menos 1' })
  weekNumber: number;
}