import { Module } from '@nestjs/common';
import { AI_PROVIDER } from './ai-provider.js';
import { MockAiProvider } from './mock-ai.provider.js';

@Module({
  providers: [
    {
      provide: AI_PROVIDER,
      useClass: MockAiProvider,
    },
  ],
  exports: [AI_PROVIDER],
})
export class AiModule {}