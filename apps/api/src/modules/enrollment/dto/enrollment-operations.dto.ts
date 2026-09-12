import { IsString, IsNotEmpty, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateActiveSectionDto {
  @ApiProperty({ description: 'ID del estudiante' })
  @IsString()
  @IsNotEmpty({ message: 'El ID del estudiante es requerido' })
  studentId: string;

  @ApiProperty({ description: 'Nueva sección' })
  @IsString()
  @IsNotEmpty({ message: 'El ID de la sección es requerido' })
  sectionId: string;
}

export class ChangePlanDto {
  @ApiProperty({ description: 'ID del nuevo plan de pago' })
  @IsString()
  @IsNotEmpty({ message: 'El ID del plan es requerido' })
  planId: string;

  @ApiProperty({
    description: 'Forzar restauración de cuotas pagadas a pendiente',
    default: false,
  })
  @Type(() => Boolean)
  @IsBoolean({ message: 'forceRestore debe ser booleano' })
  forceRestore: boolean;
}