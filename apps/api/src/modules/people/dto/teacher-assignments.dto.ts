import { IsArray, IsString, IsInt, Min, Max, ArrayNotEmpty, IsOptional, ArrayMaxSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class SetTeacherCoursesDto {
  @ApiProperty({ type: [String], description: 'Array de IDs de cursos' })
  @IsArray({ message: 'courseIds debe ser un array' })
  @IsString({ each: true, message: 'Cada courseId debe ser un string' })
  @IsOptional()
  courseIds?: string[];
}

export class SetTeacherTurnosDto {
  @ApiProperty({ type: [String], description: 'Array de IDs de turnos' })
  @IsArray({ message: 'turnoIds debe ser un array' })
  @IsString({ each: true })
  @IsOptional()
  turnoIds?: string[];
}

export class SetTeacherSedesDto {
  @ApiProperty({ type: [String], description: 'Array de IDs de sedes' })
  @IsArray({ message: 'sedeIds debe ser un array' })
  @IsString({ each: true })
  @IsOptional()
  sedeIds?: string[];
}

export class SetTeacherUnavailableDaysDto {
  @ApiProperty({ type: [Number], description: 'Array de días (1=Lunes, 5=Viernes)', example: [1, 3, 5] })
  @IsArray({ message: 'days debe ser un array' })
  @IsInt({ each: true, message: 'Cada día debe ser un número entero' })
  @Min(1, { each: true, message: 'El día mínimo es 1 (Lunes)' })
  @Max(5, { each: true, message: 'El día máximo es 5 (Viernes)' })
  @IsOptional()
  days?: number[];
}

export class SetTeacherSedeDaysDto {
  @ApiProperty({ description: 'ID de la sede' })
  @IsString()
  sedeId: string;

  @ApiProperty({ type: [Number], description: 'Array de días disponibles en esta sede (1-5)', example: [1, 2, 3] })
  @IsArray({ message: 'days debe ser un array' })
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(5, { each: true })
  @IsOptional()
  days?: number[];
}