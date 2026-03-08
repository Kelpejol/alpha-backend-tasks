import { Module } from '@nestjs/common';

import { DocumentsModule } from '../documents/documents.module';
import { LlmModule } from '../llm/llm.module';
import { QueueModule } from '../queue/queue.module';
import { SummariesModule } from '../summaries/summaries.module';
import { SummaryGenerationWorker } from './summary-generation.worker';

@Module({
  imports: [QueueModule, DocumentsModule, SummariesModule, LlmModule],
  providers: [SummaryGenerationWorker],
})
export class WorkersModule {}
