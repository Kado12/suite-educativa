import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { ValidationsService } from './validations.service';
import { AttendanceController } from './attendance.controller';
import { ValidationsController } from './validations.controller';

@Module({
  controllers: [AttendanceController, ValidationsController],
  providers: [AttendanceService, ValidationsService],
})
export class AttendanceModule {}