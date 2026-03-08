import { randomUUID } from 'crypto';

import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuthUser } from '../auth/auth.types';
import { CandidatesService } from '../candidates/candidates.service';
import { CandidateSummary } from '../entities/candidate-summary.entity';
import {
  CandidateSummaryResult,
  SUMMARIZATION_PROVIDER,
  SummarizationProvider,
} from '../llm/summarization-provider.interface';
import { EnqueuedJob, QueueService } from '../queue/queue.service';
import { GenerateCandidateSummaryDto } from './dto/generate-candidate-summary.dto';

export interface SummaryJobPayload {
  summaryId: string;
  candidateId: string;
  workspaceId: string;
}

export interface SummaryGenerationAccepted {
  summary: CandidateSummary;
  job: EnqueuedJob<SummaryJobPayload>;
}

@Injectable()
export class SummariesService {
  constructor(
    @InjectRepository(CandidateSummary)
    private readonly summaryRepository: Repository<CandidateSummary>,
    private readonly candidatesService: CandidatesService,
    private readonly queueService: QueueService,
    @Inject(SUMMARIZATION_PROVIDER)
    private readonly summarizationProvider: SummarizationProvider,
  ) {}

  async requestSummaryGeneration(
    candidateId: string,
    user: AuthUser,
    dto: GenerateCandidateSummaryDto,
  ): Promise<SummaryGenerationAccepted> {
    await this.candidatesService.getCandidateForWorkspaceOrFail(candidateId, user);

    const summary = await this.summaryRepository.save(
      this.summaryRepository.create({
        id: randomUUID(),
        candidateId,
        workspaceId: user.workspaceId,
        status: 'pending',
        score: null,
        strengths: [],
        concerns: [],
        summary: null,
        recommendedDecision: null,
        provider: this.getProviderName(),
        promptVersion: dto.promptVersion?.trim() || 'v1',
        errorMessage: null,
      }),
    );

    const job = this.queueService.enqueue<SummaryJobPayload>(
      'candidate.summary.generate',
      {
        summaryId: summary.id,
        candidateId,
        workspaceId: user.workspaceId,
      },
    );

    return { summary, job };
  }

  async listCandidateSummaries(
    candidateId: string,
    user: AuthUser,
  ): Promise<CandidateSummary[]> {
    await this.candidatesService.getCandidateForWorkspaceOrFail(candidateId, user);

    return this.summaryRepository.find({
      where: { candidateId, workspaceId: user.workspaceId },
      order: { createdAt: 'DESC' },
    });
  }

  async getCandidateSummaryOrFail(
    candidateId: string,
    summaryId: string,
    user: AuthUser,
  ): Promise<CandidateSummary> {
    await this.candidatesService.getCandidateForWorkspaceOrFail(candidateId, user);

    const summary = await this.summaryRepository.findOne({
      where: {
        id: summaryId,
        candidateId,
        workspaceId: user.workspaceId,
      },
    });

    if (!summary) {
      throw new NotFoundException('Summary not found for candidate');
    }

    return summary;
  }

  async completeSummary(
    summaryId: string,
    result: CandidateSummaryResult,
  ): Promise<CandidateSummary> {
    const summary = await this.summaryRepository.findOne({ where: { id: summaryId } });
    if (!summary) {
      throw new NotFoundException('Summary not found');
    }

    summary.status = 'completed';
    summary.score = result.score;
    summary.strengths = result.strengths;
    summary.concerns = result.concerns;
    summary.summary = result.summary;
    summary.recommendedDecision = result.recommendedDecision;
    summary.errorMessage = null;

    return this.summaryRepository.save(summary);
  }

  async failSummary(summaryId: string, errorMessage: string): Promise<CandidateSummary> {
    const summary = await this.summaryRepository.findOne({ where: { id: summaryId } });
    if (!summary) {
      throw new NotFoundException('Summary not found');
    }

    summary.status = 'failed';
    summary.errorMessage = errorMessage;

    return this.summaryRepository.save(summary);
  }

  validateProviderResult(result: CandidateSummaryResult): CandidateSummaryResult {
    if (!Number.isFinite(result.score) || result.score < 0 || result.score > 100) {
      throw new InternalServerErrorException('Invalid summarization score');
    }

    if (!Array.isArray(result.strengths) || !Array.isArray(result.concerns)) {
      throw new InternalServerErrorException('Invalid strengths/concerns format');
    }

    const strengthsAreValid = result.strengths.every(
      (value) => typeof value === 'string' && value.trim().length > 0,
    );
    const concernsAreValid = result.concerns.every(
      (value) => typeof value === 'string' && value.trim().length > 0,
    );
    if (!strengthsAreValid || !concernsAreValid) {
      throw new InternalServerErrorException(
        'Invalid strengths/concerns item format',
      );
    }

    const allowedDecisions = new Set(['advance', 'hold', 'reject']);

    if (!result.summary || !result.recommendedDecision) {
      throw new InternalServerErrorException('Missing required summary fields');
    }

    if (!allowedDecisions.has(result.recommendedDecision)) {
      throw new InternalServerErrorException('Invalid recommendedDecision value');
    }

    return result;
  }

  private getProviderName(): string {
    return this.summarizationProvider.constructor.name;
  }
}
