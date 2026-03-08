import { IsOptional, IsString, MaxLength } from 'class-validator';

export class GenerateCandidateSummaryDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  promptVersion?: string;
}
