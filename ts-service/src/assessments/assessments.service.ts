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
import { TalentAssessment } from '../entities/talent-assessment.entity';
import {
  AssessmentResult,
  INTELLIGENCE_ENGINE,
  IntelligenceEngine,
} from '../llm/intelligence-engine.interface';
import { ProfilesService } from '../profiles/profiles.service';
import { EnqueuedJob, QueueService } from '../queue/queue.service';
import { TriggerTalentAssessmentDto } from './dto/trigger-talent-assessment.dto';

/**
 * Payload for the asynchronous assessment generation background task.
 */
export interface AssessmentJobPayload {
  assessmentId: string;
  profileId: string;
  orgId: string;
}

/**
 * Encapsulates the response when an assessment request is successfully queued.
 */
export interface AssessmentGenerationAccepted {
  assessment: TalentAssessment;
  job: EnqueuedJob<AssessmentJobPayload>;
}

/**
 * AssessmentsService orchestrates the evaluation of talent profiles using
 * advanced intelligence engines.
 */
@Injectable()
export class AssessmentsService {
  constructor(
    @InjectRepository(TalentAssessment)
    private readonly assessmentRepository: Repository<TalentAssessment>,
    private readonly profilesService: ProfilesService,
    private readonly queueService: QueueService,
    @Inject(INTELLIGENCE_ENGINE)
    private readonly summarizationProvider: IntelligenceEngine,
  ) { }

  /**
   * Initiates a new professional assessment for the specified profile.
   * Registers a pending assessment and enqueues it for asynchronous processing.
   * 
   * @param profileId - The identifier for the talent profile.
   * @param user - Authenticated user context.
   * @param dto - Configuration for the assessment.
   */
  async requestAssessmentGeneration(
    profileId: string,
    user: AuthUser,
    dto: TriggerTalentAssessmentDto,
  ): Promise<AssessmentGenerationAccepted> {
    await this.profilesService.getProfileForOrganizationOrFail(profileId, user);

    const assessment = await this.assessmentRepository.save(
      this.assessmentRepository.create({
        assessmentId: randomUUID(),
        profileId,
        orgId: user.workspaceId,
        status: 'pending',
        score: null,
        strengths: [],
        concerns: [],
        summary: null,
        recommendedDecision: null,
        provider: this.getProviderName(),
        runtimeVersion: dto.runtimeVersion?.trim() || 'v1',
        failureLog: null,
      }),
    );

    const job = this.queueService.enqueue<AssessmentJobPayload>(
      'talent.assessment.generate',
      {
        assessmentId: assessment.assessmentId,
        profileId,
        orgId: user.workspaceId,
      },
    );

    return { assessment, job };
  }

  /**
   * Retrieves all assessments associated with a specific talent profile.
   */
  async listAssessmentsForProfile(
    profileId: string,
    user: AuthUser,
  ): Promise<TalentAssessment[]> {
    await this.profilesService.getProfileForOrganizationOrFail(profileId, user);

    return this.assessmentRepository.find({
      where: { profileId, orgId: user.workspaceId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Retrieves a specific assessment by ID, strictly enforcing multi-tenant
   * boundaries.
   */
  async getAssessmentOrFail(
    profileId: string,
    assessmentId: string,
    user: AuthUser,
  ): Promise<TalentAssessment> {
    await this.profilesService.getProfileForOrganizationOrFail(profileId, user);

    const assessment = await this.assessmentRepository.findOne({
      where: {
        assessmentId,
        profileId,
        orgId: user.workspaceId,
      },
    });

    if (!assessment) {
      throw new NotFoundException('Professional assessment not found for this profile');
    }

    return assessment;
  }

  /**
   * Finalizes an assessment with the results produced by the intelligence engine.
   */
  async finalizeAssessment(
    assessmentId: string,
    result: AssessmentResult,
  ): Promise<TalentAssessment> {
    const assessment = await this.assessmentRepository.findOne({ where: { assessmentId } });
    if (!assessment) {
      throw new NotFoundException('Assessment record not found');
    }

    assessment.status = 'completed';
    assessment.score = result.score;
    assessment.strengths = result.strengths;
    assessment.concerns = result.concerns;
    assessment.summary = result.summary;
    assessment.recommendedDecision = result.recommendedDecision;
    assessment.failureLog = null;

    return this.assessmentRepository.save(assessment);
  }

  /**
   * Marks an assessment as failed and logs the error details.
   */
  async markAsFailed(assessmentId: string, failureLog: string): Promise<TalentAssessment> {
    const assessment = await this.assessmentRepository.findOne({ where: { assessmentId } });
    if (!assessment) {
      throw new NotFoundException('Assessment record not found');
    }

    assessment.status = 'failed';
    assessment.failureLog = failureLog;

    return this.assessmentRepository.save(assessment);
  }

  /**
   * Validates the integrity and format of the results returned by the provider.
   */
  validateEngineResult(result: AssessmentResult): AssessmentResult {
    if (!Number.isFinite(result.score) || result.score < 0 || result.score > 100) {
      throw new InternalServerErrorException('Intelligence engine produced invalid score');
    }

    if (!Array.isArray(result.strengths) || !Array.isArray(result.concerns)) {
      throw new InternalServerErrorException('Intelligence engine produced malformed analysis arrays');
    }

    const strengthsValid = result.strengths.every((s: string) => typeof s === 'string' && s.trim());
    const concernsValid = result.concerns.every((c: string) => typeof c === 'string' && c.trim());

    if (!strengthsValid || !concernsValid) {
      throw new InternalServerErrorException('Intelligence engine produced invalid content items');
    }

    const allowedOutcomes = new Set(['advance', 'hold', 'reject']);

    if (!result.summary || !result.recommendedDecision) {
      throw new InternalServerErrorException('Intelligence engine results missing required narrative fields');
    }

    if (!allowedOutcomes.has(result.recommendedDecision)) {
      throw new InternalServerErrorException('Intelligence engine suggested an invalid strategic outcome');
    }

    return result;
  }

  private getProviderName(): string {
    return this.summarizationProvider.constructor.name;
  }
}
