import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { PrismaService } from '../database/prisma.service.js';
import type { CreateGenerationDto } from './dto/create-generation.dto.js';
import { StorageService } from '../storage/storage.service.js';

@Injectable()
export class GenerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    @InjectQueue('resume-generation')
    private readonly queue: Queue,
  ) {}

  async createGeneration(
    userId: string,
    dto: CreateGenerationDto,
  ) {
    const [resume, jobDescription] = await Promise.all([
      this.prisma.resume.findFirst({
        where: { id: dto.resumeId, userId },
      }),
      this.prisma.jobDescription.findFirst({
        where: {
          id: dto.jobDescriptionId,
          userId,
        },
      }),
    ]);

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    if (!resume.extractedText) {
      throw new NotFoundException(
        'Resume has not finished processing',
      );
    }

    if (!jobDescription) {
      throw new NotFoundException(
        'Job description not found',
      );
    }

    const generation =
      await this.prisma.resumeGeneration.create({
        data: {
          userId,
          resumeId: dto.resumeId,
          jobDescriptionId: dto.jobDescriptionId,
          status: 'PENDING',
          progress: 0,
        },
      });

    await this.queue.add(
      'generate-resume',
      {
        generationId: generation.id,
      },
      {
        removeOnComplete: 100,
        removeOnFail: 1000,
      },
    );

    return generation;
  }

  async getGeneration(userId: string, generationId: string) {
    const generation =
      await this.prisma.resumeGeneration.findFirst({
        where: {
          id: generationId,
          userId,
        },
      });

    if (!generation) {
      throw new NotFoundException(
        'Generation not found',
      );
    }

    return generation;
  }

  async downloadGeneration(userId: string, generationId: string) {
    const generation =
      await this.prisma.resumeGeneration.findFirst({
        where: {
          id: generationId,
          userId,
        },
      });

    if (!generation) {
      throw new NotFoundException('Generation not found');
    }

    if (!generation.storageKey) {
      throw new NotFoundException(
        'Generated PDF is not available yet',
      );
    }

    const buffer = await this.storage.download(
      generation.storageKey,
    );

    return {
      buffer,
      fileName: `tailored-resume-${generation.id}.pdf`,
    };
  }
}