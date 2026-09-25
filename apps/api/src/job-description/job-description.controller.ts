import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SessionGuard } from '../auth/session.guard.js';
import { CreateJobDescriptionDto } from './dto/create-job-description.dto.js';
import { UpdateJobDescriptionDto } from './dto/update-job-description.dto.js';
import { JobDescriptionService } from './job-description.service.js';

@Controller({
  path: 'job-descriptions',
  version: '1',
})
@UseGuards(SessionGuard)
export class JobDescriptionController {
  constructor(
    private readonly jobDescriptionService: JobDescriptionService,
  ) {}

  @Post()
  create(@Req() request: any, @Body() dto: CreateJobDescriptionDto) {
    return this.jobDescriptionService.create(request.user.id, dto);
  }

  @Get()
  findAll(@Req() request: any) {
    return this.jobDescriptionService.findAll(request.user.id);
  }

  @Get(':id')
  findOne(@Req() request: any, @Param('id') id: string) {
    return this.jobDescriptionService.findOne(request.user.id, id);
  }

  @Patch(':id')
  update(
    @Req() request: any,
    @Param('id') id: string,
    @Body() dto: UpdateJobDescriptionDto,
  ) {
    return this.jobDescriptionService.update(
      request.user.id,
      id,
      dto,
    );
  }

  @Delete(':id')
  remove(@Req() request: any, @Param('id') id: string) {
    return this.jobDescriptionService.remove(request.user.id, id);
  }
}