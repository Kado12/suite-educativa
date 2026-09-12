import { IsString, IsOptional, IsNumber, IsDateString, Min, MaxLength, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class MarkPaidDto {
  @ApiProperty({ 
    required: false, 
    description: 'Monto pagado (si no se envía, se usa el monto total de la cuota)',
    example: 500.00 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El monto debe ser un número con máximo 2 decimales' })
  @IsPositive({ message: 'El monto debe ser positivo' })
  paidAmount?: number;

  @ApiProperty({ 
    required: false, 
    description: 'Fecha de pago en formato ISO 8601 (si no se envía, se usa la fecha actual)',
    example: '2024-01-15' 
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha debe estar en formato ISO 8601 (YYYY-MM-DD)' })
  paidDate?: string;

  @ApiProperty({ 
    required: false, 
    description: 'Número de referencia, voucher o comprobante',
    example: 'VOUCHER-12345' 
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'La referencia no puede exceder 100 caracteres' })
  reference?: string;
}