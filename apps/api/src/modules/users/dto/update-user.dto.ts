import { ApiProperty } from "@nestjs/swagger";
import { Role } from "@suite/database";
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, Matches, MinLength } from "class-validator";

export class UpdateUserDto {
  @ApiProperty({ required: false, example: 'nuevo.correo@suite.edu' })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsOptional()
  email?: string;

  @ApiProperty({ required: false, example: 'Jose Eduardo' })
  @IsString()
  @IsOptional()
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, { message: 'El nombre solo puede contener letras y espacios' })
  firstName?: string;

  @ApiProperty({ required: false, example: 'Bernales Soto' })
  @IsString()
  @IsOptional()
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, { message: 'El apellido solo puede contener letras y espacios' })
  lastName?: string;

  @ApiProperty({ enum: Role, required: false })
  @IsEnum(Role, { message: 'Rol invalido' })
  @IsOptional()
  role?: Role;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ required: false, example: 'NuevaContraseña123! (mínimo 6 caracteres)' })
  @IsString()
  @IsOptional()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  newPassword?: string;
}