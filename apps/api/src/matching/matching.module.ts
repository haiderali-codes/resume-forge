import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from '../auth/auth.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { MatchingController } from './matching.controller.js';
import { MatchingProcessor } from './matching.processor.js';
import { MatchingService } from './matching.service.js';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    BullModule.registerQueue({
      name: 'matching-processing',
    }),
  ],
  controllers: [MatchingController],
  providers: [MatchingService, MatchingProcessor],
})
export class MatchingModule {}