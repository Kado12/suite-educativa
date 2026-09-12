import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EnrollmentStatus } from '@suite/database';

export class CreateEnrollmentDto {
  @ApiProperty({ description: 'ID del estudiante (person)' })
  @IsString()
  @IsNotEmpty({ message: 'El ID del estudiante es requerido' })
  studentId: string;

  @ApiProperty({ description: 'ID de la sección' })
  @IsString()
  @IsNotEmpty({ message: 'El ID de la sección es requerido' })
  sectionId: string;

  @ApiProperty({ description: 'ID del período' })
  @IsString()
  @IsNotEmpty({ message: 'El ID del período es requerido' })
  periodId: string;

  @ApiProperty({ description: 'ID del plan de pago' })
  @IsString()
  @IsNotEmpty({ message: 'El ID del plan de pago es requerido' })
  paymentPlanId: string;
}

export class UpdateStatusDto {
  @ApiProperty({ enum: EnrollmentStatus, example: 'ACTIVE' })
  @IsEnum(EnrollmentStatus, {
    message: 'El estado debe ser ACTIVE, TRANSFERRED o WITHDRAWN',
  })
  @IsNotEmpty({ message: 'El estado es requerido' })
  status: EnrollmentStatus;
}