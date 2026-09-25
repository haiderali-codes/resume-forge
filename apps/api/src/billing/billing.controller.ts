import {
  Controller,
  Headers,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SessionGuard } from '../auth/session.guard.js';
import { BillingService } from './billing.service.js';

@Controller({
  path: 'billing',
  version: '1',
})
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
  ) {}

  @Post('checkout')
  @UseGuards(SessionGuard)
  createCheckout(@Req() request: any) {
    return this.billingService.createCheckoutSession(
      request.user.id,
    );
  }

  @Post('webhook')
  handleWebhook(
    @Req() request: any,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.billingService.handleWebhook(
      request.rawBody,
      signature,
    );
  }
}