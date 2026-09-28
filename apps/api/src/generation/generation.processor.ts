import { Inject } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import PDFDocument from 'pdfkit';
import { randomUUID } from 'node:crypto';

import { PrismaService } from '../database/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';
import {
  AI_PROVIDER,
  type AiProvider,
} from '../ai/ai-provider.js';

type GenerationJob = {
  generationId: string;
};

function createPdf(text: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const document = new PDFDocument({
      size: 'A4',
      margin: 50,
    });

    const chunks: Buffer[] = [];

    document.on('data', (chunk: Buffer) => chunks.push(chunk));
    document.on('end', () => resolve(Buffer.concat(chunks)));
    document.on('error', reject);

    document
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('Tailored Resume', { align: 'center' })
      .moveDown();

    document
      .fontSize(10)
      .font('Helvetica')
      .text(text, {
        width: 495,
        lineGap: 4,
        align: 'left',
      });

    document.end();
  });
}

@Processor('resume-generation')
export class GenerationProcessor extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    @Inject(AI_PROVIDER)
    private readonly aiProvider: AiProvider,
  ) {
    super();
  }

  async process(job: Job<GenerationJob>) {
    const { generationId } = job.data;

    try {
      const generation =
        await this.prisma.resumeGeneration.findUnique({
          where: { id: generationId },
          include: {
            resume: true,
            jobDescription: true,
          },
        });

      if (!generation || !generation.resume.extractedText) {
        throw new Error('Generation data is incomplete');
      }

      await this.prisma.resumeGeneration.update({
        where: { id: generationId },
        data: {
          status: 'PROCESSING',
          progress: 25,
        },
      });

      await job.updateProgress(25);

      const result =
        await this.aiProvider.generateTailoredResume({
          resumeText: generation.resume.extractedText,
          jobDescription: generation.jobDescription.description,
        });

      await this.prisma.resumeGeneration.update({
        where: { id: generationId },
        data: {
          progress: 60,
          provider: result.provider,
          model: result.model,
          outputText: result.outputText,
        },
      });

      await job.updateProgress(60);

      const pdfBuffer = await createPdf(result.outputText);

      const storageKey =
        `${generation.userId}/generations/` +
        `${generationId}-${randomUUID()}.pdf`;

      await this.storage.upload(
        storageKey,
        pdfBuffer,
        'application/pdf',
      );

      const latestVersion =
        await this.prisma.resumeVersion.findFirst({
          where: {
            resumeId: generation.resumeId,
          },
          orderBy: {
            versionNumber: 'desc',
          },
        });

      const versionNumber =
        (latestVersion?.versionNumber ?? 0) + 1;

      await this.prisma.resumeVersion.create({
        data: {
          resumeId: generation.resumeId,
          versionNumber,
          storageKey,
          originalName: `tailored-resume-${generationId}.pdf`,
          mimeType: 'application/pdf',
          sizeBytes: pdfBuffer.length,
          extractedText: result.outputText,
        },
      });

      await this.prisma.resumeGeneration.update({
        where: { id: generationId },
        data: {
          status: 'COMPLETED',
          progress: 100,
          storageKey,
          errorMessage: null,
        },
      });

      await job.updateProgress(100);

      return {
        generationId,
        status: 'COMPLETED',
        storageKey,
      };
    } catch (error) {
      await this.prisma.resumeGeneration.update({
        where: { id: generationId },
        data: {
          status: 'FAILED',
          errorMessage:
            error instanceof Error
              ? error.message
              : 'Generation failed',
        },
      });

      throw error;
    }
  }
}