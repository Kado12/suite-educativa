import { IsString, IsOptional, IsEnum, MaxLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EnrollmentStatus } from '@suite/database';

export class ListEnrollmentsQueryDto {
  @ApiProperty({ required: false, description: 'Filtrar por período' })
  @IsString()
  @IsOptional()
  periodId?: string;

  @ApiProperty({ required: false, description: 'Filtrar por sección' })
  @IsString()
  @IsOptional()
  sectionId?: string;

  @ApiProperty({ required: false, enum: EnrollmentStatus })
  @IsEnum(EnrollmentStatus, {
    message: 'Estado inválido. Debe ser ACTIVE, TRANSFERRED o WITHDRAWN',
  })
  @IsOptional()
  status?: EnrollmentStatus;

  @ApiProperty({ required: false, description: 'Buscar por nombre o documento del estudiante' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  studentSearch?: string;
}

export class CheckStudentQueryDto {
  @ApiProperty({ description: 'Documento del estudiante' })
  @IsString()
  @IsNotEmpty({ message: 'El documento es requerido' })
  dni: string;

  @ApiProperty({ description: 'ID del período' })
  @IsString()
  @IsNotEmpty({ message: 'El período es requerido' })
  periodId: string;
}

export class SuggestSectionQueryDto {
  @ApiProperty({ description: 'ID de la sede' })
  @IsString()
  @IsNotEmpty({ message: 'La sede es requerida' })
  sedeId: string;

  @ApiProperty({ description: 'ID del turno' })
  @IsString()
  @IsNotEmpty({ message: 'El turno es requerido' })
  turnoId: string;
}

export class ReEnrollmentQueryDto {
  @ApiProperty({ description: 'ID del período actual' })
  @IsString()
  @IsNotEmpty({ message: 'El período es requerido' })
  periodId: string;
}

export class ExportEnrollmentsQueryDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  periodId?: string;

  @ApiProperty({ required: false, enum: EnrollmentStatus })
  @IsEnum(EnrollmentStatus, {
    message: 'Estado inválido',
  })
  @IsOptional()
  status?: EnrollmentStatus;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  studentSearch?: string;
}

export class StatsQueryDto {
  @ApiProperty({ required: false, description: 'Filtrar por período' })
  @IsString()
  @IsOptional()
  periodId?: string;
}