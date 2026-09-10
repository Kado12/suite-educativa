import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PasswordResetService } from './password-reset.service';
import { PasswordResetController } from './password-reset.controller';
import { ResendService } from '../../common/services/resend.service';
import { NotificationsGateway } from '../../common/gateways/notifications.gateway';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [PasswordResetController],
  providers: [PasswordResetService, ResendService, NotificationsGateway],
  exports: [PasswordResetService, NotificationsGateway],
})
export class PasswordResetModule {}