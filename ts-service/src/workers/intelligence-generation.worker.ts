import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { AttachmentsService } from '../attachments/attachments.service';
import {
  AssessmentResult,
  INTELLIGENCE_ENGINE,
  IntelligenceEngine,
} from '../llm/intelligence-engine.interface';
import { QueueService } from '../queue/queue.service';
import { AssessmentJobPayload, AssessmentsService } from '../assessments/assessments.service';

/**
 * IntelligenceGenerationWorker consumes asynchronous generation tasks from 
 * the persistent queue and coordinates with LLM providers to produce 
 * strategic talent assessments.
 */
@Injectable()
export class IntelligenceGenerationWorker implements OnModuleInit {
  private readonly logger = new Logger(IntelligenceGenerationWorker.name);

  constructor(
    private readonly queueService: QueueService,
    private readonly attachmentsService: AttachmentsService,
    private readonly assessmentsService: AssessmentsService,
    @Inject(INTELLIGENCE_ENGINE)
    private readonly summarizationProvider: IntelligenceEngine,
  ) { }

  /**
   * Initializes the worker by registering the intelligence generation
   * task handler with the queue system.
   */
  onModuleInit(): void {
    this.queueService.registerHandler<AssessmentJobPayload>(
      'talent.assessment.generate',
      async (payload) => {
        await this.processAssessmentTask(payload);
      },
    );
  }

  /**
   * Executes the assessment generation lifecycle:
   * 1. Aggregates profile attachments and extracted context.
   * 2. Invokes the intelligence engine.
   * 3. Validates and persists the produced analysis.
   * 
   * @param payload - Metadata for the target assessment.
   */
  private async processAssessmentTask(payload: AssessmentJobPayload): Promise<void> {
    this.logger.log(`Starting intelligence generation for assessment: ${payload.assessmentId}`);

    try {
      const attachments = await this.attachmentsService.findAttachmentsByProfile(
        payload.profileId,
        payload.orgId,
      );

      // Consolidate document blobs for engine consumption
      const contextBlobs = attachments.map((doc) => doc.contentBlob);

      const rawResult = await this.summarizationProvider.generateAssessment({
        profileId: payload.profileId,
        documents: contextBlobs,
      });

      const validated: AssessmentResult =
        this.assessmentsService.validateEngineResult(rawResult);

      await this.assessmentsService.finalizeAssessment(payload.assessmentId, validated);

      this.logger.log(`Successfully completed assessment: ${payload.assessmentId}`);
    } catch (error) {
      const failureMessage = error instanceof Error ? error.message : 'Unknown intelligence generation failure';

      this.logger.error(`Assessment generation failed for [${payload.assessmentId}]: ${failureMessage}`);

      await this.assessmentsService.markAsFailed(payload.assessmentId, failureMessage);

      // Re-throw to allow queue-level retry logic if configured
      throw error;
    }
  }
}
