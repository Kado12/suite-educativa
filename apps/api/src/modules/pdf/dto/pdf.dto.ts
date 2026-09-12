import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StudentRecordParamDto {
  @ApiProperty({ description: 'ID del estudiante (person)' })
  @IsString()
  @IsNotEmpty({ message: 'El studentId es requerido' })
  studentId: string;
}

export class PaymentReceiptParamDto {
  @ApiProperty({ description: 'ID del pago' })
  @IsString()
  @IsNotEmpty({ message: 'El paymentId es requerido' })
  paymentId: string;
}

export class StudentCardParamDto {
  @ApiProperty({ description: 'ID del estudiante (person)' })
  @IsString()
  @IsNotEmpty({ message: 'El studentId es requerido' })
  studentId: string;
}