import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidationStatus } from '@suite/database';

export class GetWeekStatusQueryDto {
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

export class SetStatusDto {
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

  @ApiProperty({ enum: ValidationStatus, example: 'VALIDATED' })
  @IsEnum(ValidationStatus, {
    message: 'El estado debe ser PENDING, VALIDATED u OBSERVED',
  })
  @IsNotEmpty({ message: 'El estado es requerido' })
  status: ValidationStatus;

  @ApiProperty({ 
    required: false, 
    description: 'Comentario (requerido si estado es OBSERVED)',
    example: 'Faltas injustificadas' 
  })
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'El comentario no puede exceder 500 caracteres' })
  comment?: string;
}