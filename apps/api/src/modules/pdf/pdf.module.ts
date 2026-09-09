import { Module } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { PdfController } from './pdf.controller';
import { EnrollmentModule } from '../enrollment/enrollment.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [EnrollmentModule, SettingsModule],
  controllers: [PdfController],
  providers: [PdfService],
})
export class PdfModule {}