import { IsString, IsNotEmpty, MaxLength, IsOptional, IsInt, Min, Max, IsDateString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreatePeriodDto {
  @ApiProperty({ example: 'Semestre 2026-II' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MaxLength(50)
  name: string;

  @ApiProperty({ example: '2026-03-02', description: 'Debe ser LUNES (formato YYYY-MM-DD)' })
  @IsString()
  @IsNotEmpty({ message: 'La fecha de inicio es requerida' })
  @IsDateString({}, { message: 'Formato de fecha inválido (YYYY-MM-DD)' })
  startDate: string;

  @ApiProperty({ default: 12, minimum: 1, maximum: 52 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Las semanas deben ser un número entero' })
  @Min(1, { message: 'Debe tener al menos 1 semana' })
  @Max(52, { message: 'Máximo 52 semanas' })
  weeks?: number;
}

export class UpdatePeriodDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @IsDateString({}, { message: 'Formato de fecha inválido' })
  startDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(52)
  weeks?: number;
}

export class TogglePeriodDto {
  @ApiProperty()
  @IsBoolean()
  @Type(() => Boolean)
  isActive: boolean;
}