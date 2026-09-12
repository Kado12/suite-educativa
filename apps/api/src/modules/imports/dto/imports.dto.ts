import { IsString, IsOptional, IsEnum, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export const VALID_IMPORT_TYPES = [
  'students',
  'sections',
  'sedes',
  'areas',
  'cursos',
  'turnos',
  'salones',
  'alumnos',
  'teachers',
  'horario',
] as const;

export type ImportType = typeof VALID_IMPORT_TYPES[number];

export class ImportFileParamDto {
  @ApiProperty({ 
    enum: VALID_IMPORT_TYPES,
    description: 'Tipo de importación',
    example: 'students' 
  })
  @IsIn(VALID_IMPORT_TYPES, {
    message: `Tipo de importación inválido. Debe ser uno de: ${VALID_IMPORT_TYPES.join(', ')}`,
  })
  type: ImportType;
}

export class ImportFileBodyDto {
  @ApiProperty({ required: false, description: 'ID del bloque (para importación de horario)' })
  @IsString()
  @IsOptional()
  blockId?: string;

  @ApiProperty({ required: false, description: 'ID de la sede (filtro opcional)' })
  @IsString()
  @IsOptional()
  sedeId?: string;
}

export class ImportScheduleBodyDto {
  @ApiProperty({ description: 'ID del bloque (requerido)' })
  @IsString()
  blockId: string;

  @ApiProperty({ required: false, description: 'ID de la sede (filtro opcional)' })
  @IsString()
  @IsOptional()
  sedeId?: string;
}