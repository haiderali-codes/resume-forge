import { Module } from '@nestjs/common';
import { ResumeController } from './resume.controller.js';
import { ResumeService } from './resume.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { ProcessingModule } from '../processing/processing.module.js';

@Module({
  imports: [AuthModule,ProcessingModule],
  controllers: [ResumeController],
  providers: [ResumeService],
})
export class ResumeModule {}