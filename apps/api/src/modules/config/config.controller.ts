import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { INSTITUTION } from '../../config/institution';

@Controller('config')
export class ConfigController {
  @Public()
  @Get('public')
  getPublic() {
    return { institution: INSTITUTION };
  }
}