
import { ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { SessionGuard } from '../auth/session.guard.js';
import { CreateMatchDto } from './dto/create-match.dto.js';
import { MatchingService } from './matching.service.js';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

type AuthenticatedRequest = FastifyRequest & {
  user: {
    id: string;
  };
};

@ApiTags('matching')
@Controller({
  path: 'matches',
  version: '1',
})
@UseGuards(SessionGuard)
export class MatchingController {
  constructor(
    private readonly matchingService: MatchingService,
  ) {}

  @Get(':id')
  getMatch(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.matchingService.getMatch(
      request.user.id,
      id,
    );
  }

  @Post()
  createMatch(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateMatchDto,
  ) {
    return this.matchingService.createMatch(
      request.user.id,
      dto,
    );
  }
}