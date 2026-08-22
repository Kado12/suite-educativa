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
import { AttendanceModule } from './modules/attendance/attendance.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ImportsModule } from './modules/imports/imports.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ToolsModule } from './modules/tools/tools.module';
import { AuditModule } from './modules/audit/audit.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditInterceptor } from './modules/audit/audit.interceptor';
import { UploadModule } from './modules/upload/upload.module';
import { PdfModule } from './modules/pdf/pdf.module';

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
    AttendanceModule,
    ReportsModule,
    ImportsModule,
    DashboardModule,
    ToolsModule,
    AuditModule,
    UploadModule,
    PdfModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor}
  ]
})
export class AppModule {}