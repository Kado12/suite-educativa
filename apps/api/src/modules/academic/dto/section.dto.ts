import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max, MaxLength, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateSectionDto {
  @ApiProperty({ required: false, example: 'A11 - M' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  name?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'El salón es requerido' })
  classroomId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'El turno es requerido' })
  turnoId: string;

  @ApiProperty({ required: false, default: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El cupo debe ser un número entero' })
  @Min(1, { message: 'El cupo mínimo es 1' })
  @Max(100, { message: 'El cupo máximo es 100' })
  capacity?: number;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  enrollmentPriority?: number;
}

export class UpdateSectionDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  capacity?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  enrollmentPriority?: number;
}

// Reutilizamos el mismo DTO ya que hacen lo mismo
export class UpdateSectionFullDto extends UpdateSectionDto {}

export class ListSectionsQueryDto {
  @ApiProperty({ required: false, type: Boolean })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  onlyActive?: boolean;
}