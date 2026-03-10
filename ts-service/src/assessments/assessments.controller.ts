import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/auth-user.decorator';
import { AuthUser } from '../auth/auth.types';
import { FakeAuthGuard } from '../auth/fake-auth.guard';
import { AssessmentsService } from './assessments.service';
import { TriggerTalentAssessmentDto } from './dto/trigger-talent-assessment.dto';

/**
 * AssessmentsController provides advanced intelligence-driven evaluation 
 * services for professional candidate profiles.
 */
@Controller('candidates/:candidateId/summaries')
@UseGuards(FakeAuthGuard)
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) { }

  /**
   * Triggers a new intelligence summary/assessment for the specified candidate.
   * Returns a 202 Accepted status indicating asynchronous processing.
   */
  @Post('generate')
  @HttpCode(HttpStatus.ACCEPTED)
  async triggerAssessment(
    @Param('candidateId') candidateId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: TriggerTalentAssessmentDto,
  ) {
    const accepted = await this.assessmentsService.requestAssessmentGeneration(
      candidateId,
      user,
      dto,
    );

    return {
      summaryId: accepted.assessment.assessmentId,
      status: accepted.assessment.status,
      jobId: accepted.job.id,
      enqueuedAt: accepted.job.enqueuedAt,
    };
  }

  /**
   * Lists all summaries previously conducted for the specified candidate.
   */
  @Get()
  async listAssessments(
    @Param('candidateId') candidateId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.assessmentsService.listAssessmentsForProfile(candidateId, user);
  }

  /**
   * Retrieves the detailed results of a specific intelligence summary.
   */
  @Get(':summaryId')
  async getAssessment(
    @Param('candidateId') candidateId: string,
    @Param('summaryId') summaryId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.assessmentsService.getAssessmentOrFail(
      candidateId,
      summaryId,
      user,
    );
  }
}
