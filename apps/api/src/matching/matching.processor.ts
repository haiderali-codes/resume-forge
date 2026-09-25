import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { PrismaService } from '../database/prisma.service.js';

const SKILLS = [
  'JavaScript',
  'TypeScript',
  'React',
  'Next.js',
  'Angular',
  'Node.js',
  'Express',
  'NestJS',
  'GraphQL',
  'PostgreSQL',
  'MySQL',
  'Redis',
  'Docker',
  'AWS',
  'Azure',
  'GCP',
  'Stripe',
  'Git',
  'REST',
  'HTML',
  'CSS',
  'Tailwind',
];

type MatchJob = {
  matchId: string;
};

@Processor('matching-processing')
export class MatchingProcessor extends WorkerHost {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<MatchJob>) {
    const { matchId } = job.data;

    try {
      const match = await this.prisma.resumeMatch.findUnique({
        where: { id: matchId },
        include: {
          resume: true,
          jobDescription: true,
        },
      });

      if (!match || !match.resume.extractedText) {
        throw new Error('Match data is incomplete');
      }

      await this.prisma.resumeMatch.update({
        where: { id: matchId },
        data: {
          status: 'PROCESSING',
          progress: 25,
        },
      });

      const resumeText = match.resume.extractedText.toLowerCase();
      const jobText =
        match.jobDescription.description.toLowerCase();

      const requiredSkills = SKILLS.filter((skill) =>
        jobText.includes(skill.toLowerCase()),
      );

      const matchedSkills = requiredSkills.filter((skill) =>
        resumeText.includes(skill.toLowerCase()),
      );

      const missingSkills = requiredSkills.filter(
        (skill) => !matchedSkills.includes(skill),
      );

      const matchScore =
        requiredSkills.length === 0
          ? 0
          : Math.round(
              (matchedSkills.length / requiredSkills.length) * 100,
            );

      const recommendations = missingSkills.map(
        (skill) => `Add more evidence of ${skill} experience`,
      );

      await this.prisma.resumeMatch.update({
        where: { id: matchId },
        data: {
          status: 'COMPLETED',
          progress: 100,
          matchScore,
          matchedSkills,
          missingSkills,
          recommendations,
          errorMessage: null,
        },
      });

      await job.updateProgress(100);

      return {
        matchId,
        status: 'COMPLETED',
      };
    } catch (error) {
      await this.prisma.resumeMatch.update({
        where: { id: matchId },
        data: {
          status: 'FAILED',
          errorMessage:
            error instanceof Error
              ? error.message
              : 'Matching failed',
        },
      });

      throw error;
    }
  }
}