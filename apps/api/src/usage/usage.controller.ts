import {
  Controller,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SessionGuard } from '../auth/session.guard.js';
import { UsageService } from './usage.service.js';

@Controller({
  path: 'usage',
  version: '1',
})
@UseGuards(SessionGuard)
export class UsageController {
  constructor(private readonly usage: UsageService) {}

  @Get()
  getUsage(@Req() request: any) {
    return this.usage.getUsage(request.user.id);
  }
}