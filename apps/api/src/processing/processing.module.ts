import 'dotenv/config';

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { Redis } from 'ioredis';
import { ResumeProcessor } from './resume.processor.js';

const redis = new Redis({
  host: process.env.REDIS_HOST ?? 'localhost',
  port: Number(process.env.REDIS_PORT ?? 6379),
  maxRetriesPerRequest: null,
});

@Module({
  imports: [
    BullModule.forRoot({
      connection: redis as any,
    }),
    BullModule.registerQueue({
      name: 'resume-processing',
    }),
  ],
  providers: [ResumeProcessor],
  exports: [BullModule],
})
export class ProcessingModule {}