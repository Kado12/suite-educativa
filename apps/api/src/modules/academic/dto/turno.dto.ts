import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from "class-validator";

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class CreateTurnoDto {
  @ApiProperty({ example: 'Mañana' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del turno es obligatorio' })
  @MaxLength(50)
  name: string;

  @ApiProperty({ example: '08:00' })
  @IsString()
  @IsNotEmpty()
  @Matches(TIME_REGEX, { message: 'El formato de la hora de inicio es inválido. Debe ser HH:mm' })
  slot1Start: string;

  @ApiProperty({ example: '11:00' })
  @IsString()
  @IsNotEmpty()
  @Matches(TIME_REGEX, { message: 'El formato de la hora de inicio es inválido. Debe ser HH:mm' })
  slot1End: string;

  @ApiProperty({ example: '12:00' })
  @IsString()
  @IsNotEmpty()
  @Matches(TIME_REGEX, { message: 'El formato de la hora de inicio es inválido. Debe ser HH:mm' })
  slot2Start: string;

  @ApiProperty({ example: '15:00' })
  @IsString()
  @IsNotEmpty()
  @Matches(TIME_REGEX, { message: 'El formato de la hora de inicio es inválido. Debe ser HH:mm' })
  slot2End: string;
}

export class UpdateTurnoDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @Matches(TIME_REGEX, { message: 'Formato de hora inválido (HH:mm)' })
  slot1Start?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @Matches(TIME_REGEX, { message: 'Formato de hora inválido (HH:mm)' })
  slot1End?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @Matches(TIME_REGEX, { message: 'Formato de hora inválido (HH:mm)' })
  slot2Start?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @Matches(TIME_REGEX, { message: 'Formato de hora inválido (HH:mm)' })
  slot2End?: string;
}