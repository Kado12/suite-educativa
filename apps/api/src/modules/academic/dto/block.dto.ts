import { IsString, IsNotEmpty, MaxLength, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateBlockDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'El período es requerido' })
  periodId: string;

  @ApiProperty({ example: 'Bloque 1' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MaxLength(50)
  name: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt({ message: 'La semana inicio debe ser un número entero' })
  @Min(1, { message: 'La semana debe ser al menos 1' })
  startWeek: number;

  @ApiProperty({ example: 6 })
  @Type(() => Number)
  @IsInt({ message: 'La semana fin debe ser un número entero' })
  @Min(1)
  endWeek: number;
}

export class UpdateBlockDto {
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
  startWeek?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  endWeek?: number;
}

export class ListBlocksQueryDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  periodId?: string;
}

export class AddCourseToBlockDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'El courseId es requerido' })
  courseId: string;
}