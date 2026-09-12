import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Matches, MaxLength } from "class-validator";

export class CreateSedeDto {
  @ApiProperty({ example: 'Sede Central' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la sede es obligatorio' })
  @MaxLength(100, { message: 'El nombre de la sede no puede superar los 100 caracteres' })
  @Matches(/^[a-zA-ZÀ-ÿ0-9\s.,'-]+$/, { message: 'El nombre de la sede contiene caracteres inválidos' })
  name: string;
}

export class UpdateSedeDto extends CreateSedeDto { }