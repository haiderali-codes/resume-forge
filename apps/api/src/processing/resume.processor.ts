import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import mammoth from 'mammoth';
import { createRequire } from 'node:module';
import { PrismaService } from '../database/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse/lib/pdf-parse.js');

type ResumeJob = {
  resumeId: string;
};

@Processor('resume-processing')
export class ResumeProcessor extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {
    super();
  }

  private async extractText(
    buffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    if (mimeType === 'application/pdf') {
      const result = await pdfParse(buffer);
      return result.text.trim();
    }

    if (
      mimeType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const result = await mammoth.extractRawText({ buffer });
      return result.value.trim();
    }

    throw new Error(`Unsupported file type: ${mimeType}`);
  }

  async process(job: Job<ResumeJob>) {
    const { resumeId } = job.data;

    try {
      const resume = await this.prisma.resume.findUnique({
        where: { id: resumeId },
      });

      if (!resume) {
        throw new Error('Resume not found');
      }

      await this.prisma.resume.update({
        where: { id: resumeId },
        data: {
          status: 'PROCESSING',
          progress: 10,
          errorMessage: null,
        },
      });

      await job.updateProgress(10);

      const buffer = await this.storage.download(
        resume.storageKey,
      );

      await this.prisma.resume.update({
        where: { id: resumeId },
        data: {
          progress: 25,
        },
      });

      await job.updateProgress(25);

      const extractedText = await this.extractText(
        buffer,
        resume.mimeType,
      );

      await this.prisma.resume.update({
        where: { id: resumeId },
        data: {
          status: 'COMPLETED',
          progress: 100,
          extractedText,
          errorMessage: null,
        },
      });

      const latestVersion =
        await this.prisma.resumeVersion.findFirst({
          where: { resumeId },
          orderBy: { versionNumber: 'desc' },
          select: { versionNumber: true },
        });

      const versionNumber =
        (latestVersion?.versionNumber ?? 0) + 1;

      await this.prisma.resumeVersion.create({
        data: {
          resumeId,
          versionNumber,
          storageKey: resume.storageKey,
          originalName: resume.originalName,
          mimeType: resume.mimeType,
          sizeBytes: resume.sizeBytes,
          extractedText,
        },
      });

      await job.updateProgress(100);

      return {
        resumeId,
        status: 'COMPLETED',
        versionNumber,
      };
    } catch (error) {
      await this.prisma.resume.update({
        where: { id: resumeId },
        data: {
          status: 'FAILED',
          errorMessage:
            error instanceof Error
              ? error.message
              : 'Resume processing failed',
        },
      });

      throw error;
    }
  }
}