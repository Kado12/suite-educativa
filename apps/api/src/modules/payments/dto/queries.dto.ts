import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus } from '@suite/database';

export class ListPaymentsQueryDto {
  @ApiProperty({ required: false, description: 'Filtrar por período' })
  @IsString()
  @IsOptional()
  periodId?: string;

  @ApiProperty({ required: false, enum: PaymentStatus, description: 'Filtrar por estado' })
  @IsEnum(PaymentStatus, {
    message: 'Estado inválido. Debe ser PENDING, PAID u OVERDUE',
  })
  @IsOptional()
  status?: PaymentStatus;

  @ApiProperty({ 
    required: false, 
    description: 'Buscar por nombre o documento del estudiante',
    example: 'Juan Pérez' 
  })
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'La búsqueda no puede exceder 100 caracteres' })
  studentSearch?: string;
}

export class ExportPaymentsQueryDto {
  @ApiProperty({ required: false, description: 'Filtrar por período' })
  @IsString()
  @IsOptional()
  periodId?: string;

  @ApiProperty({ required: false, enum: PaymentStatus })
  @IsEnum(PaymentStatus, {
    message: 'Estado inválido. Debe ser PENDING, PAID u OVERDUE',
  })
  @IsOptional()
  status?: PaymentStatus;

  @ApiProperty({ 
    required: false, 
    description: 'Buscar por nombre o documento del estudiante' 
  })
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'La búsqueda no puede exceder 100 caracteres' })
  studentSearch?: string;
}

export class StatsQueryDto {
  @ApiProperty({ required: false, description: 'Filtrar estadísticas por período' })
  @IsString()
  @IsOptional()
  periodId?: string;
}