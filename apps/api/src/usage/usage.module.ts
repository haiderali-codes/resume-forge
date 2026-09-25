import { Global, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { UsageController } from './usage.controller.js';
import { UsageService } from './usage.service.js';

@Global()
@Module({
  imports: [AuthModule],
  controllers: [UsageController],
  providers: [UsageService],
  exports: [UsageService],
})
export class UsageModule {}