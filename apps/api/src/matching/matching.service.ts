import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma } from '@prisma/client';
import type { CreateMatchDto } from './dto/create-match.dto.js';

@Injectable()
export class MatchingService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('matching-processing')
    private readonly matchingQueue: Queue,
  ) {}

  async createMatch(userId: string, dto: CreateMatchDto) {
    const [resume, jobDescription] = await Promise.all([
      this.prisma.resume.findFirst({
        where: { id: dto.resumeId, userId },
      }),
      this.prisma.jobDescription.findFirst({
        where: { id: dto.jobDescriptionId, userId },
      }),
    ]);

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    if (!jobDescription) {
      throw new NotFoundException('Job description not found');
    }

    if (!resume.extractedText) {
      throw new NotFoundException(
        'Resume has not finished processing',
      );
    }

    const match = await this.prisma.resumeMatch.upsert({
      where: {
        resumeId_jobDescriptionId: {
          resumeId: dto.resumeId,
          jobDescriptionId: dto.jobDescriptionId,
        },
      },
      update: {
        status: 'PENDING',
        progress: 0,
        matchScore: null,
        matchedSkills: Prisma.JsonNull,
        missingSkills: Prisma.JsonNull,
        recommendations: Prisma.JsonNull,
        errorMessage: null,
      },
      create: {
        userId,
        resumeId: dto.resumeId,
        jobDescriptionId: dto.jobDescriptionId,
        status: 'PENDING',
        progress: 0,
      },
    });

    await this.matchingQueue.add(
      'calculate-match',
      { matchId: match.id },
      {
        removeOnComplete: 100,
        removeOnFail: 1000,
      },
    );

    return match;
  }

  async getMatch(userId: string, matchId: string) {
    const match = await this.prisma.resumeMatch.findFirst({
      where: {
        id: matchId,
        userId,
      },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    return match;
  }
}