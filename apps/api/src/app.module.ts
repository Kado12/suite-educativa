import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './modules/health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AcademicModule } from './modules/academic/academic.module';
import { PeopleModule } from './modules/people/people.module';
import { UsersModule } from './modules/users/users.module';
import { EnrollmentModule } from './modules/enrollment/enrollment.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { SchedulingModule } from './modules/scheduling/scheduling.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HealthModule,
    PrismaModule,
    AuthModule,
    AcademicModule,
    PeopleModule,
    UsersModule,
    EnrollmentModule,
    PaymentsModule,
    SchedulingModule,
  ],
})
export class AppModule {}