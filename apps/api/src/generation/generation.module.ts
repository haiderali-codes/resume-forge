import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AiModule } from '../ai/ai.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { GenerationController } from './generation.controller.js';
import { GenerationProcessor } from './generation.processor.js';
import { GenerationService } from './generation.service.js';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    AiModule,
    BullModule.registerQueue({
      name: 'resume-generation',
    }),
  ],
  controllers: [GenerationController],
  providers: [
    GenerationService,
    GenerationProcessor,
  ],
})
export class GenerationModule {}