import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class BillingService {
  private readonly stripe: Stripe;

  constructor(private readonly prisma: PrismaService) {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    this.stripe = new Stripe(secretKey);
  }

  async createCheckoutSession(userId: string) {
    const priceId = process.env.STRIPE_PRO_PRICE_ID;
    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';

    if (!priceId) {
      throw new Error('STRIPE_PRO_PRICE_ID is not configured');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    let subscription =
      await this.prisma.userSubscription.findUnique({
        where: { userId },
      });

    let customerId = subscription?.stripeCustomerId;

    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: [user.firstName, user.lastName]
          .filter(Boolean)
          .join(' ') || undefined,
        metadata: { userId },
      });

      customerId = customer.id;

      subscription =
        await this.prisma.userSubscription.upsert({
          where: { userId },
          create: {
            userId,
            stripeCustomerId: customerId,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000,
            ),
          },
          update: {
            stripeCustomerId: customerId,
          },
        });
    }

    const session =
      await this.stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: customerId,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        metadata: { userId },
        success_url: `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/billing`,
      });

    return {
      sessionId: session.id,
      checkoutUrl: session.url,
    };
  }

  async handleWebhook(
    rawBody: Buffer,
    signature: string,
  ) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error(
        'STRIPE_WEBHOOK_SECRET is not configured',
      );
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch {
      throw new BadRequestException(
        'Invalid Stripe webhook signature',
      );
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session =
          event.data.object as Stripe.Checkout.Session;

        const userId = session.metadata?.userId;
        const stripeSubscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id;

        if (userId) {
          await this.prisma.userSubscription.upsert({
            where: { userId },
            create: {
              userId,
              plan: 'PRO',
              status: 'ACTIVE',
              resumeUploadLimit: 100,
              jobDescriptionLimit: 100,
              stripeCustomerId:
                typeof session.customer === 'string'
                  ? session.customer
                  : null,
              stripeSubscriptionId:
                stripeSubscriptionId ?? null,
              stripePriceId:
                process.env.STRIPE_PRO_PRICE_ID,
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000,
              ),
            },
            update: {
              plan: 'PRO',
              status: 'ACTIVE',
              resumeUploadLimit: 100,
              jobDescriptionLimit: 100,
              stripeSubscriptionId:
                stripeSubscriptionId ?? undefined,
            },
          });
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription =
          event.data.object as Stripe.Subscription;

        await this.prisma.userSubscription.updateMany({
          where: {
            stripeSubscriptionId: subscription.id,
          },
          data: {
            plan: 'FREE',
            status: 'CANCELED',
            resumeUploadLimit: 3,
            jobDescriptionLimit: 5,
          },
        });

        break;
      }

        case 'invoice.payment_failed': {
            const invoice =
                event.data.object as Stripe.Invoice;

            const customerId =
                typeof invoice.customer === 'string'
                ? invoice.customer
                : invoice.customer?.id;

            if (customerId) {
                await this.prisma.userSubscription.updateMany({
                where: {
                    stripeCustomerId: customerId,
                },
                data: {
                    status: 'PAST_DUE',
                },
                });
            }

            break;
        }
    }

    return { received: true };
  }
}