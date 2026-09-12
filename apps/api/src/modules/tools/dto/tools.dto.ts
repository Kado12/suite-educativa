import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export const VALID_TOOL_TEMPLATES = [
  'compare',
  'schedule',
  'cross-info',
  'cross-schedule',
  'assignments-sections',
  'assignments-courses',
] as const;

export type ToolTemplateType = typeof VALID_TOOL_TEMPLATES[number];

export class ToolTemplateParamDto {
  @ApiProperty({ 
    enum: VALID_TOOL_TEMPLATES,
    description: 'Tipo de plantilla',
    example: 'compare' 
  })
  @IsIn(VALID_TOOL_TEMPLATES, {
    message: `Tipo de plantilla inválido. Debe ser uno de: ${VALID_TOOL_TEMPLATES.join(', ')}`,
  })
  type: ToolTemplateType;
}