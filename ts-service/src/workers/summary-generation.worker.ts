import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { DocumentsService } from '../documents/documents.service';
import {
  CandidateSummaryResult,
  SUMMARIZATION_PROVIDER,
  SummarizationProvider,
} from '../llm/summarization-provider.interface';
import { QueueService } from '../queue/queue.service';
import { SummaryJobPayload, SummariesService } from '../summaries/summaries.service';

@Injectable()
export class SummaryGenerationWorker implements OnModuleInit {
  private readonly logger = new Logger(SummaryGenerationWorker.name);

  constructor(
    private readonly queueService: QueueService,
    private readonly documentsService: DocumentsService,
    private readonly summariesService: SummariesService,
    @Inject(SUMMARIZATION_PROVIDER)
    private readonly summarizationProvider: SummarizationProvider,
  ) {}

  onModuleInit(): void {
    this.queueService.registerHandler<SummaryJobPayload>(
      'candidate.summary.generate',
      async (payload) => {
        await this.processJob(payload);
      },
    );
  }

  private async processJob(payload: SummaryJobPayload): Promise<void> {
    try {
      const documents = await this.documentsService.getDocumentsForCandidate(
        payload.candidateId,
        payload.workspaceId,
      );

      const result = await this.summarizationProvider.generateCandidateSummary({
        candidateId: payload.candidateId,
        documents: documents.map((doc) => doc.rawText),
      });

      const validated: CandidateSummaryResult =
        this.summariesService.validateProviderResult(result);

      await this.summariesService.completeSummary(payload.summaryId, validated);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown worker error';
      this.logger.error(`Summary generation failed: ${message}`);
      await this.summariesService.failSummary(payload.summaryId, message);
      throw error;
    }
  }
}
