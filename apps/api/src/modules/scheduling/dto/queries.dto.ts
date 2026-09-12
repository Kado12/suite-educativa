import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ExportSchedulingQueryDto {
  @ApiProperty({ required: false, description: 'Filtrar por sede' })
  @IsString()
  @IsOptional()
  sedeId?: string;

  @ApiProperty({ required: false, description: 'Filtrar por perfil docente' })
  @IsString()
  @IsOptional()
  teacherProfileId?: string;

  @ApiProperty({ required: false, description: 'Filtrar por área' })
  @IsString()
  @IsOptional()
  areaId?: string;

  @ApiProperty({ required: false, description: 'Filtrar por turno' })
  @IsString()
  @IsOptional()
  turnoId?: string;

  @ApiProperty({ required: false, description: 'Filtrar por sección' })
  @IsString()
  @IsOptional()
  sectionId?: string;
}