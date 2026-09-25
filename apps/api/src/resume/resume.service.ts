import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../database/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { UsageService } from '../usage/usage.service.js';

@Injectable()
export class ResumeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    @InjectQueue('resume-processing')
    private readonly resumeQueue: Queue,
    private readonly usage: UsageService,
  ) {}

  async upload(
    userId: string,
    file: {
        filename: string;
        mimetype: string;
        size: number;
        buffer: Buffer;
    },
    ) {
    await this.usage.consumeResumeUpload(userId);
    const safeFilename = file.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageKey = `${userId}/${randomUUID()}-${safeFilename}`;

    await this.storage.upload(
        storageKey,
        file.buffer,
        file.mimetype,
    );

    const resume = await this.prisma.resume.create({
        data: {
        userId,
        originalName: file.filename,
        storageKey,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        },
    });

    await this.resumeQueue.add(
        'process-resume',
        { resumeId: resume.id },
        {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 100,
        },
    );

    return resume;
    }

  async getStatus(userId: string, id: string) {
  const resume = await this.prisma.resume.findFirst({
    where: {
      id,
      userId,
    },
    select: {
      id: true,
      status: true,
      progress: true,
      errorMessage: true,
      updatedAt: true,
    },
  });

  if (!resume) {
    throw new NotFoundException('Resume not found');
  }

  return resume;
}

  async list(userId: string) {
    return this.prisma.resume.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getVersions(userId: string, resumeId: string) {
    const resume = await this.prisma.resume.findFirst({
      where: {
        id: resumeId,
        userId,
      },
    });

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    return this.prisma.resumeVersion.findMany({
      where: { resumeId },
      orderBy: { versionNumber: 'desc' },
    });
  }
}