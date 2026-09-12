import { IsString, IsNotEmpty, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAreaDto {
  @ApiProperty({ example: 'Matemáticas' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MaxLength(80)
  @Matches(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-\.]+$/, {
    message: 'El nombre contiene caracteres no permitidos',
  })
  name: string;
}

export class UpdateAreaDto extends CreateAreaDto {}