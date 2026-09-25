import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Sse,
  UseGuards,
} from '@nestjs/common';
import type { MessageEvent } from '@nestjs/common';
import { from, interval } from 'rxjs';
import {
  map,
  startWith,
  switchMap,
  takeWhile,
} from 'rxjs/operators';
import type { FastifyRequest } from 'fastify';
import { SessionGuard } from '../auth/session.guard.js';
import { ResumeService } from './resume.service.js';

@Controller({
  path: 'resumes',
  version: '1',
})
@UseGuards(SessionGuard)
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) { }

  @Post()
  async upload(@Req() request: FastifyRequest & { user?: { id: string } }) {
    const userId = request.user?.id;

    if (!userId) {
      throw new BadRequestException('Authenticated user not found');
    }

    const file = await request.file();

    if (!file) {
      throw new BadRequestException('A resume file is required');
    }

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only PDF and DOCX files are supported');
    }

    const buffer = await file.toBuffer();

    if (buffer.length === 0) {
      throw new BadRequestException('Uploaded file is empty');
    }

    return this.resumeService.upload(userId, {
      filename: file.filename,
      mimetype: file.mimetype,
      size: buffer.length,
      buffer,
    });
  }

  @Get()
  async list(@Req() request: FastifyRequest & { user?: { id: string } }) {
    const userId = request.user?.id;

    if (!userId) {
      throw new BadRequestException('Authenticated user not found');
    }

    return this.resumeService.list(userId);
  }

  @Get(':id/status')
  getStatus(
    @Req() request: any,
    @Param('id') id: string,
  ) {
    return this.resumeService.getStatus(
      request.user.id,
      id,
    );
  }

  @Sse(':id/events')
  events(
    @Req() request: any,
    @Param('id') id: string,
  ) {
    return interval(1000).pipe(
      startWith(0),
      switchMap(() =>
        from(
          this.resumeService.getStatus(
            request.user.id,
            id,
          ),
        ),
      ),
      map((status) => ({
        data: status,
      }) as MessageEvent),
      takeWhile(
        (event:any) =>
          event.data.status !== 'COMPLETED' &&
          event.data.status !== 'FAILED',
        true,
      ),
    );
  }

  @Get(':id/versions')
  getVersions(
    @Req() request: any,
    @Param('id') id: string,
  ) {
    return this.resumeService.getVersions(
      request.user.id,
      id,
    );
  }
}