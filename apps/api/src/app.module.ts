import 'dotenv/config';

import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { HealthController } from './health/health.controller.js';
import { AuthModule } from './auth/auth.module.js';
import { DatabaseModule } from './database/database.module.js';
import { StorageModule } from './storage/storage.module.js';
import { ResumeModule } from './resume/resume.module.js';
import { JobDescriptionModule } from './job-description/job-description.module.js';
import { ProcessingModule } from './processing/processing.module.js';
import { UsageModule } from './usage/usage.module.js';
import { BillingModule } from './billing/billing.module.js';
import { MatchingModule } from './matching/matching.module.js';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    BillingModule,
    ProcessingModule,
    StorageModule,
    ResumeModule,
    JobDescriptionModule,
    UsageModule,
    MatchingModule
  ],
  controllers: [
    AppController,
    HealthController,
  ],
  providers: [
    AppService,
  ],
})
export class AppModule {}