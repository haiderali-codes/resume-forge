import { IsUUID } from 'class-validator';

export class CreateGenerationDto {
  @IsUUID()
  resumeId!: string;

  @IsUUID()
  jobDescriptionId!: string;
}