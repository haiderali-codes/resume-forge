import { Test, type TestingModule } from '@nestjs/testing';
import {
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import request from 'supertest';
import fastifyCookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { AppModule } from '../src/app.module.js';

describe('Resume matching API', () => {
  let app: NestFastifyApplication;
  let agent: ReturnType<typeof request.agent>;

  const email = `matching-${randomUUID()}@example.com`;
  const password = 'Test-Password-123';

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter({
        logger: false,
        bodyLimit: 10 * 1024 * 1024,
      }),
    );

    await app.register(fastifyCookie as any);

    await app.register(multipart as any, {
      limits: {
        fileSize: 10 * 1024 * 1024,
        files: 1,
      },
    });

    app.setGlobalPrefix('api');

    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/v1/auth/register')
      .send({
        email,
        password,
        firstName: 'Matching',
        lastName: 'Tester',
      })
      .expect(201);

    await agent
      .post('/api/v1/auth/login')
      .send({
        email,
        password,
      })
      .expect(200);
  }, 30_000);

  afterAll(async () => {
    await app.close();
  }, 30_000);

  it('matches a processed resume against a job description', async () => {
    const resumeResponse = await agent
      .post('/api/v1/resumes')
      .attach(
        'file',
        readFileSync(
          new URL('./fixtures/test-resume.pdf', import.meta.url),
        ),
        {
          filename: 'test-resume.pdf',
          contentType: 'application/pdf',
        },
      )
      .expect(201);

    const resumeId = resumeResponse.body.id as string;

    let resumeStatus = 'UPLOADED';

    for (let attempt = 0; attempt < 30; attempt += 1) {
      const statusResponse = await agent
        .get(`/api/v1/resumes/${resumeId}/status`)
        .expect(200);

      resumeStatus = statusResponse.body.status;

      if (resumeStatus === 'COMPLETED') {
        break;
      }

      if (resumeStatus === 'FAILED') {
        throw new Error(
          `Resume processing failed: ${statusResponse.body.errorMessage}`,
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    expect(resumeStatus).toBe('COMPLETED');

    const jobDescriptionResponse = await agent
      .post('/api/v1/job-descriptions')
      .send({
        title: 'Senior Full Stack Engineer',
        company: 'Example Technologies',
        description:
          'We need experience with React, Next.js, Node.js, NestJS, PostgreSQL, Redis, Docker, AWS, and Stripe.',
        sourceUrl: 'https://example.com/jobs/123',
      })
      .expect(201);

    const jobDescriptionId =
      jobDescriptionResponse.body.id as string;

    const matchResponse = await agent
      .post('/api/v1/matches')
      .send({
        resumeId,
        jobDescriptionId,
      })
      .expect(201);

    const matchId = matchResponse.body.id as string;

    let finalMatch: {
      status: string;
      progress: number;
      matchScore?: number | null;
      matchedSkills?: unknown;
      missingSkills?: unknown;
      recommendations?: unknown;
      errorMessage?: string | null;
    } | null = null;

    for (let attempt = 0; attempt < 30; attempt += 1) {
      const response = await agent
        .get(`/api/v1/matches/${matchId}`)
        .expect(200);

      finalMatch = response.body;

      if (
        finalMatch.status === 'COMPLETED' ||
        finalMatch.status === 'FAILED'
      ) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    expect(finalMatch).not.toBeNull();

    if (finalMatch?.status === 'FAILED') {
      throw new Error(
        `Matching failed: ${finalMatch.errorMessage}`,
      );
    }

    expect(finalMatch?.status).toBe('COMPLETED');
    expect(finalMatch?.progress).toBe(100);
    expect(finalMatch?.matchScore).toBeTypeOf('number');
    expect(finalMatch?.matchedSkills).toBeDefined();
    expect(finalMatch?.missingSkills).toBeDefined();
    expect(finalMatch?.recommendations).toBeDefined();
  }, 60_000);
});