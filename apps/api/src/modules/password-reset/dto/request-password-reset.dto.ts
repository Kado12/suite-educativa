import { IsEmail, IsNotEmpty } from 'class-validator';

export class RequestPasswordResetDto {
  @IsEmail({}, { message: 'Debe ser un email válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;
}