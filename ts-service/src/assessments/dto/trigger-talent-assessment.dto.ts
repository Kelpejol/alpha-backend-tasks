import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * TriggerTalentAssessmentDto handles the configuration for initiating a new
 * professional assessment of a talent profile.
 */
export class TriggerTalentAssessmentDto {
  /**
   * Optional version identifier for the assessment runtime or prompt template.
   * Defaults to 'v1' if not provided.
   */
  @IsOptional()
  @IsString({ message: 'Runtime version must be a valid string' })
  @MaxLength(80, { message: 'Runtime version must not exceed 80 characters' })
  runtimeVersion?: string;
}
