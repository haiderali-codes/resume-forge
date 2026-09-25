import { IsUUID } from 'class-validator';

export class CreateMatchDto {
  @IsUUID()
  resumeId!: string;

  @IsUUID()
  jobDescriptionId!: string;
}