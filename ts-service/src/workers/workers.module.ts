import { Module } from '@nestjs/common';

import { AttachmentsModule } from '../attachments/attachments.module';
import { AssessmentsModule } from '../assessments/assessments.module';
import { LlmModule } from '../llm/llm.module';
import { QueueModule } from '../queue/queue.module';
import { IntelligenceGenerationWorker } from './intelligence-generation.worker';

/**
 * WorkersModule consolidates all asynchronous background workers responsible
 * for intensive processing tasks.
 */
@Module({
  imports: [
    QueueModule,
    AttachmentsModule,
    AssessmentsModule,
    LlmModule,
  ],
  providers: [IntelligenceGenerationWorker],
})
export class WorkersModule { }
