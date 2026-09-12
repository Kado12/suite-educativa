import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateSessionDto {
  @ApiProperty({ description: 'ID de la sección' })
  @IsString()
  @IsNotEmpty({ message: 'El ID de la sección es requerido' })
  sectionId: string;

  @ApiProperty({ description: 'ID del curso' })
  @IsString()
  @IsNotEmpty({ message: 'El ID del curso es requerido' })
  courseId: string;

  @ApiProperty({
    required: false,
    description: 'ID del perfil docente (opcional)',
  })
  @IsString()
  @IsOptional()
  teacherProfileId?: string | null;

  @ApiProperty({ description: 'Día de la semana (1=Lunes, 5=Viernes)', example: 1 })
  @Type(() => Number)
  @IsInt({ message: 'El día debe ser un número entero' })
  @Min(1, { message: 'El día mínimo es 1 (Lunes)' })
  @Max(5, { message: 'El día máximo es 5 (Viernes)' })
  dayOfWeek: number;

  @ApiProperty({ description: 'Slot horario (1 o 2)', example: 1 })
  @Type(() => Number)
  @IsInt({ message: 'El slot debe ser un número entero' })
  @Min(1, { message: 'El slot mínimo es 1' })
  @Max(2, { message: 'El slot máximo es 2' })
  slot: number;

  @ApiProperty({ description: 'ID del bloque' })
  @IsString()
  @IsNotEmpty({ message: 'El ID del bloque es requerido' })
  blockId: string;
}

export class UpdateSessionDto {
  @ApiProperty({ required: false, description: 'ID del curso' })
  @IsString()
  @IsOptional()
  courseId?: string;

  @ApiProperty({
    required: false,
    description: 'ID del perfil docente (null para remover)',
  })
  @IsString()
  @IsOptional()
  teacherProfileId?: string | null;

  @ApiProperty({ required: false, description: 'Día de la semana (1-5)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El día debe ser un número entero' })
  @Min(1, { message: 'El día mínimo es 1 (Lunes)' })
  @Max(5, { message: 'El día máximo es 5 (Viernes)' })
  dayOfWeek?: number;

  @ApiProperty({ required: false, description: 'Slot horario (1 o 2)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El slot debe ser un número entero' })
  @Min(1, { message: 'El slot mínimo es 1' })
  @Max(2, { message: 'El slot máximo es 2' })
  slot?: number;
}