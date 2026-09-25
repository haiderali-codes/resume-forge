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
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { AppModule } from '../src/app.module.js';

import { readFileSync } from 'node:fs';

function createTestPdf(): Buffer {
  return readFileSync(
    new URL('./fixtures/test-resume.pdf', import.meta.url),
  );
}

describe('Resume processing API', () => {
  let app: NestFastifyApplication;
  let agent: ReturnType<typeof request.agent>;

  const email = `resume-${randomUUID()}@example.com`;
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

    await agent.post('/api/v1/auth/register').send({
      email,
      password,
      firstName: 'Resume',
      lastName: 'Tester',
    }).expect(201);

    await agent.post('/api/v1/auth/login').send({
      email,
      password,
    }).expect(200);
  }, 30_000);

  afterAll(async () => {
    await app.close();
  }, 30_000);

  it('uploads and processes a resume', async () => {
    const response = await agent
      .post('/api/v1/resumes')
      .attach(
        'file',
        createTestPdf(),
        {
          filename: 'test-resume.pdf',
          contentType: 'application/pdf',
        },
      )
      .expect(201);

    const resumeId = response.body.id as string;

    expect(resumeId).toBeDefined();
    expect(response.body.status).toBe('UPLOADED');

    let finalStatus: {
      id: string;
      status: string;
      progress: number;
      extractedText?: string | null;
      errorMessage?: string | null;
    } | null = null;

    for (let attempt = 0; attempt < 30; attempt += 1) {
      const statusResponse = await agent
        .get(`/api/v1/resumes/${resumeId}/status`)
        .expect(200);

      finalStatus = statusResponse.body;
      console.log('Final resume status:', finalStatus);
      if (
        finalStatus.status === 'COMPLETED' ||
        finalStatus.status === 'FAILED'
      ) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    expect(finalStatus).not.toBeNull();
    expect(finalStatus?.status).toBe('COMPLETED');
    expect(finalStatus?.progress).toBe(100);
    expect(finalStatus?.errorMessage).toBeNull();

    const resumesResponse = await agent
    .get('/api/v1/resumes')
    .expect(200);

    const processedResume = (
    resumesResponse.body as Array<{
        id: string;
        extractedText?: string | null;
    }>
    ).find((resume) => resume.id === resumeId);

    expect(processedResume).toBeDefined();
    expect(processedResume?.extractedText).toBeTruthy();
  }, 40_000);
});