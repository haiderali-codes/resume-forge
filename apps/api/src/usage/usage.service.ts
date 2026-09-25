import {
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class UsageService {
  constructor(private readonly prisma: PrismaService) {}

  private getCurrentPeriod() {
    const now = new Date();

    const periodStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );

    const periodEnd = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    );

    return { periodStart, periodEnd };
  }

  private async getSubscription(
    tx: any,
    userId: string,
  ) {
    const { periodStart, periodEnd } =
      this.getCurrentPeriod();

    return tx.userSubscription.upsert({
      where: { userId },
      create: {
        userId,
        plan: 'FREE',
        status: 'ACTIVE',
        resumeUploadLimit: 3,
        jobDescriptionLimit: 5,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      },
      update: {},
    });
  }

  async consumeResumeUpload(userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const subscription = await this.getSubscription(
        tx,
        userId,
      );

      const { periodStart, periodEnd } =
        this.getCurrentPeriod();

      const usage = await tx.usagePeriod.upsert({
        where: {
          userId_periodStart: {
            userId,
            periodStart,
          },
        },
        create: {
          userId,
          periodStart,
          periodEnd,
        },
        update: {},
      });

      const updated = await tx.usagePeriod.updateMany({
        where: {
          id: usage.id,
          resumeUploads: {
            lt: subscription.resumeUploadLimit,
          },
        },
        data: {
          resumeUploads: {
            increment: 1,
          },
        },
      });

      if (updated.count === 0) {
        throw new ForbiddenException(
          `Monthly resume upload limit reached: ${subscription.resumeUploadLimit}`,
        );
      }

      return {
        used: usage.resumeUploads + 1,
        limit: subscription.resumeUploadLimit,
      };
    });
  }

  async consumeJobDescription(userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const subscription = await this.getSubscription(
        tx,
        userId,
      );

      const { periodStart, periodEnd } =
        this.getCurrentPeriod();

      const usage = await tx.usagePeriod.upsert({
        where: {
          userId_periodStart: {
            userId,
            periodStart,
          },
        },
        create: {
          userId,
          periodStart,
          periodEnd,
        },
        update: {},
      });

      const updated = await tx.usagePeriod.updateMany({
        where: {
          id: usage.id,
          jobDescriptions: {
            lt: subscription.jobDescriptionLimit,
          },
        },
        data: {
          jobDescriptions: {
            increment: 1,
          },
        },
      });

      if (updated.count === 0) {
        throw new ForbiddenException(
          `Monthly job-description limit reached: ${subscription.jobDescriptionLimit}`,
        );
      }

      return {
        used: usage.jobDescriptions + 1,
        limit: subscription.jobDescriptionLimit,
      };
    });
  }

  async getUsage(userId: string) {
    const subscription = await this.prisma.userSubscription.findUnique({
      where: { userId },
    });

    const { periodStart } = this.getCurrentPeriod();

    const usage = await this.prisma.usagePeriod.findUnique({
      where: {
        userId_periodStart: {
          userId,
          periodStart,
        },
      },
    });

    return {
      plan: subscription?.plan ?? 'FREE',
      resumeUploads: usage?.resumeUploads ?? 0,
      resumeUploadLimit: subscription?.resumeUploadLimit ?? 3,
      jobDescriptions: usage?.jobDescriptions ?? 0,
      jobDescriptionLimit:
        subscription?.jobDescriptionLimit ?? 5,
    };
  }
}