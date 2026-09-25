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
import { randomUUID } from 'node:crypto';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { AppModule } from '../src/app.module.js';
import multipart from '@fastify/multipart';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter.js';

describe('Authentication API', () => {
  let app: NestFastifyApplication;

  const email = `test-${randomUUID()}@example.com`;
  const password = 'Test-Password-123';

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter({
        logger: false,
      }),
      {
        rawBody: true,
      },
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

    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();

    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  }, 20_000);

  it('registers a user', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email,
        password,
        firstName: 'Test',
        lastName: 'User',
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.email).toBe(email);
  });

  it('logs in and returns a session cookie', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email,
        password,
      })
      .expect(200);

    const cookies = response.headers['set-cookie'];

    expect(cookies).toBeDefined();

    const cookieHeader = Array.isArray(cookies)
    ? cookies.join(';')
    : cookies;

    expect(cookieHeader).toContain('session');
  });

  it('allows an authenticated user to access usage', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/v1/auth/login')
      .send({
        email,
        password,
      })
      .expect(200);

    const response = await agent
      .get('/api/v1/usage')
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        plan: expect.any(String),
        resumeUploads: expect.any(Number),
        resumeUploadLimit: expect.any(Number),
        jobDescriptions: expect.any(Number),
        jobDescriptionLimit: expect.any(Number),
      }),
    );
  });

  it('rejects unauthenticated usage requests', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/usage')
      .expect(401);

    expect(response.body).toEqual(
      expect.objectContaining({
        statusCode: 401,
        message: 'Authentication required',
        requestId: expect.any(String),
      }),
    );
  });
});