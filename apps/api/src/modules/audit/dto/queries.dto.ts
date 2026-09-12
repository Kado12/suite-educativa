import { IsString, IsOptional, IsDateString, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ListAuditLogsQueryDto {
  @ApiProperty({ required: false, description: 'Filtrar por ID de usuario' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty({ required: false, description: 'Filtrar por entidad (User, Sede, etc.)' })
  @IsString()
  @IsOptional()
  entity?: string;

  @ApiProperty({ required: false, description: 'Filtrar por acción (CREATE, UPDATE, etc.)' })
  @IsString()
  @IsOptional()
  action?: string;

  @ApiProperty({ 
    required: false, 
    description: 'Fecha inicial en formato ISO 8601 (YYYY-MM-DD)',
    example: '2026-01-01' 
  })
  @IsDateString({}, { message: 'startDate debe estar en formato ISO 8601 (YYYY-MM-DD)' })
  @IsOptional()
  startDate?: string;

  @ApiProperty({ 
    required: false, 
    description: 'Fecha final en formato ISO 8601 (YYYY-MM-DD)',
    example: '2026-12-31' 
  })
  @IsDateString({}, { message: 'endDate debe estar en formato ISO 8601 (YYYY-MM-DD)' })
  @IsOptional()
  endDate?: string;

  @ApiProperty({ required: false, description: 'Número de página', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page debe ser un número entero' })
  @Min(1, { message: 'page debe ser al menos 1' })
  page?: number;

  @ApiProperty({ 
    required: false, 
    description: 'Registros por página', 
    default: 50, 
    minimum: 1, 
    maximum: 200 
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'pageSize debe ser un número entero' })
  @Min(1, { message: 'pageSize debe ser al menos 1' })
  @Max(200, { message: 'pageSize no puede exceder 200' })
  pageSize?: number;
}

export class AuditStatsQueryDto {
  @ApiProperty({ 
    required: false, 
    description: 'Número de días hacia atrás para calcular estadísticas', 
    default: 30, 
    minimum: 1, 
    maximum: 365 
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'days debe ser un número entero' })
  @Min(1, { message: 'days debe ser al menos 1' })
  @Max(365, { message: 'days no puede exceder 365' })
  days?: number;
}