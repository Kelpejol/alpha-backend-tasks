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
import { GenerateCandidateSummaryDto } from './dto/generate-candidate-summary.dto';
import { SummariesService } from './summaries.service';

@Controller('candidates/:candidateId/summaries')
@UseGuards(FakeAuthGuard)
export class SummariesController {
  constructor(private readonly summariesService: SummariesService) {}

  @Post('generate')
  @HttpCode(HttpStatus.ACCEPTED)
  async generateSummary(
    @Param('candidateId') candidateId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: GenerateCandidateSummaryDto,
  ) {
    const accepted = await this.summariesService.requestSummaryGeneration(
      candidateId,
      user,
      dto,
    );

    return {
      summaryId: accepted.summary.id,
      status: accepted.summary.status,
      jobId: accepted.job.id,
      enqueuedAt: accepted.job.enqueuedAt,
    };
  }

  @Get()
  async listCandidateSummaries(
    @Param('candidateId') candidateId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.summariesService.listCandidateSummaries(candidateId, user);
  }

  @Get(':summaryId')
  async getCandidateSummary(
    @Param('candidateId') candidateId: string,
    @Param('summaryId') summaryId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.summariesService.getCandidateSummaryOrFail(
      candidateId,
      summaryId,
      user,
    );
  }
}
