import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsDateString,
  IsEnum,
  IsBoolean,
  MaxLength,
  Matches,
  IsIn,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { DocType } from '@suite/database';

const NAME_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
const PHONE_REGEX = /^[0-9+\-\s()]{6,20}$/;

export class CreateWizardDto {
  @ApiProperty({ example: 'Juan Carlos' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @Matches(NAME_REGEX, { message: 'El nombre solo puede contener letras y espacios' })
  @MaxLength(80)
  firstName: string;

  @ApiProperty({ example: 'Pérez García' })
  @IsString()
  @IsNotEmpty({ message: 'El apellido es requerido' })
  @Matches(NAME_REGEX, { message: 'El apellido solo puede contener letras y espacios' })
  @MaxLength(80)
  lastName: string;

  @ApiProperty({ enum: DocType, example: 'DNI' })
  @IsEnum(DocType, { message: 'Tipo de documento inválido' })
  @IsNotEmpty({ message: 'El tipo de documento es requerido' })
  docType: DocType;

  @ApiProperty({ example: '12345678' })
  @IsString()
  @IsNotEmpty({ message: 'El documento es requerido' })
  @MaxLength(12)
  dni: string;

  @ApiProperty({ required: false, example: '987654321' })
  @IsString()
  @IsOptional()
  @Matches(PHONE_REGEX, { message: 'Formato de teléfono inválido' })
  phone?: string;

  @ApiProperty({ required: false, example: 'alumno@email.com' })
  @IsEmail({}, { message: 'Email inválido' })
  @IsOptional()
  email?: string;

  @ApiProperty({ required: false, example: '2005-03-15' })
  @IsDateString({}, { message: 'Formato de fecha inválido (YYYY-MM-DD)' })
  @IsOptional()
  birthDate?: string;

  @ApiProperty({ required: false, enum: ['M', 'F', 'O'] })
  @IsString()
  @IsOptional()
  @IsIn(['M', 'F', 'O'], { message: 'Género debe ser M, F u O' })
  gender?: string;

  @ApiProperty({ required: false, description: 'URL de la foto en Cloudinary' })
  @IsString()
  @IsOptional()
  photoUrl?: string;

  @ApiProperty({ description: 'ID de la sección' })
  @IsString()
  @IsNotEmpty({ message: 'La sección es requerida' })
  sectionId: string;

  @ApiProperty({ description: 'ID del período' })
  @IsString()
  @IsNotEmpty({ message: 'El período es requerido' })
  periodId: string;

  @ApiProperty({ description: 'ID del plan de pago' })
  @IsString()
  @IsNotEmpty({ message: 'El plan de pago es requerido' })
  paymentPlanId: string;

  @ApiProperty({ description: 'Si la primera cuota ya fue pagada', default: false })
  @Type(() => Boolean)
  @IsBoolean({ message: 'firstPaymentPaid debe ser booleano' })
  firstPaymentPaid: boolean;
}