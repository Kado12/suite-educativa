import { IsString, IsOptional } from 'class-validator';

export class ResolvePasswordResetDto {
  @IsString()
  @IsOptional()
  customPassword?: string;
}