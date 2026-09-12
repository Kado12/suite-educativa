import { IsString, IsOptional, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadImageDto {
  @ApiProperty({ 
    required: false, 
    description: 'ID público personalizado en Cloudinary (sin extensión)',
    example: 'student-12345678' 
  })
  @IsString()
  @IsOptional()
  @MaxLength(200, { message: 'El publicId no puede exceder 200 caracteres' })
  @Matches(/^[a-zA-Z0-9_\-\/]+$/, {
    message: 'El publicId solo puede contener letras, números, guiones, guiones bajos y barras',
  })
  publicId?: string;
}

export class ReplaceImageDto {
  @ApiProperty({ 
    required: false, 
    description: 'ID público de la imagen anterior a eliminar' 
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  oldPublicId?: string;

  @ApiProperty({ 
    description: 'ID público de la nueva imagen',
    example: 'student-12345678' 
  })
  @IsString()
  @MaxLength(200, { message: 'El newPublicId no puede exceder 200 caracteres' })
  @Matches(/^[a-zA-Z0-9_\-\/]+$/, {
    message: 'El newPublicId solo puede contener letras, números, guiones, guiones bajos y barras',
  })
  newPublicId: string;
}