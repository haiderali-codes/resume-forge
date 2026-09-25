import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { JobDescriptionController } from './job-description.controller.js';
import { JobDescriptionService } from './job-description.service.js';

@Module({
  imports: [AuthModule],
  controllers: [JobDescriptionController],
  providers: [JobDescriptionService],
})
export class JobDescriptionModule {}