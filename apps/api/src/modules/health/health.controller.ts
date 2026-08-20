import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { APP_NAME } from '@suite/shared';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  health() {
    return {
      app: APP_NAME,
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}