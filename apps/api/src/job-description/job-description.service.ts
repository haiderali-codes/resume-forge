import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateJobDescriptionDto } from './dto/create-job-description.dto.js';
import { UpdateJobDescriptionDto } from './dto/update-job-description.dto.js';
import { UsageService } from '../usage/usage.service.js';

@Injectable()
export class JobDescriptionService {
  constructor(private readonly prisma: PrismaService, private readonly usage: UsageService) {}

  async create(userId: string, dto: CreateJobDescriptionDto) {
    await this.usage.consumeJobDescription(userId);
    return this.prisma.jobDescription.create({
      data: {
        userId,
        title: dto.title.trim(),
        company: dto.company?.trim() || null,
        description: dto.description.trim(),
        sourceUrl: dto.sourceUrl?.trim() || null,
      },
    });
  }

  findAll(userId: string) {
    return this.prisma.jobDescription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const jobDescription = await this.prisma.jobDescription.findFirst({
      where: { id, userId },
    });

    if (!jobDescription) {
      throw new NotFoundException('Job description not found');
    }

    return jobDescription;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateJobDescriptionDto,
  ) {
    await this.findOne(userId, id);

    return this.prisma.jobDescription.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && {
          title: dto.title.trim(),
        }),
        ...(dto.company !== undefined && {
          company: dto.company.trim() || null,
        }),
        ...(dto.description !== undefined && {
          description: dto.description.trim(),
        }),
        ...(dto.sourceUrl !== undefined && {
          sourceUrl: dto.sourceUrl.trim() || null,
        }),
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    await this.prisma.jobDescription.delete({
      where: { id },
    });

    return { deleted: true };
  }
}