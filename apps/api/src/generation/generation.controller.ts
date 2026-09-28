import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { SessionGuard } from '../auth/session.guard.js';
import { CreateGenerationDto } from './dto/create-generation.dto.js';
import { GenerationService } from './generation.service.js';

type AuthenticatedRequest = FastifyRequest & {
  user: {
    id: string;
  };
};

@ApiTags('generation')
@Controller({
  path: 'generations',
  version: '1',
})
@UseGuards(SessionGuard)
export class GenerationController {
  constructor(
    private readonly generationService: GenerationService,
  ) {}

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateGenerationDto,
  ) {
    return this.generationService.createGeneration(
      request.user.id,
      dto,
    );
  }

  @Get(':id')
  get(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.generationService.getGeneration(
      request.user.id,
      id,
    );
  }

  @Get(':id/download')
  async download(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Res({ passthrough: true }) reply: any,
  ) {
    const result =
      await this.generationService.downloadGeneration(
        request.user.id,
        id,
      );

    reply.header(
      'Content-Disposition',
      `attachment; filename="${result.fileName}"`,
    );

    reply.header(
      'Content-Type',
      'application/pdf',
    );

    return new StreamableFile(result.buffer);
  }
}