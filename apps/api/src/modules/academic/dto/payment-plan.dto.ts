import { IsString, IsNotEmpty, MaxLength, IsOptional, IsInt, IsNumber, Min, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreatePaymentPlanDto {
  @ApiProperty({ example: 'Mensual 2026-II' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MaxLength(50)
  name: string;

  @ApiProperty({ example: 4 })
  @Type(() => Number)
  @IsInt({ message: 'Las cuotas deben ser un número entero' })
  @Min(1, { message: 'Debe tener al menos 1 cuota' })
  installments: number;

  @ApiProperty({ example: 500.00 })
  @Type(() => Number)
  @IsNumber({}, { message: 'El monto debe ser un número' })
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  amount: number;
}

export class UpdatePaymentPlanDto {
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
  installments?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}

export class ListPaymentPlansQueryDto {
  @ApiProperty({ required: false, type: Boolean })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeInactive?: boolean;
}