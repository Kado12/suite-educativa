import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateClassroomDto {
  @ApiProperty({ example: 'Aula 11' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del aula es obligatorio' })
  @MaxLength(50)
  name: string;

  @ApiProperty({ example: 'id_sede' })
  @IsString()
  @IsNotEmpty({ message: 'El ID de la sede es obligatorio' })
  sedeId: string;
}

export class UpdateClassroomDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  sedeId?: string;
}