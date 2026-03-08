import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CandidatesModule } from '../candidates/candidates.module';
import { CandidateSummary } from '../entities/candidate-summary.entity';
import { LlmModule } from '../llm/llm.module';
import { QueueModule } from '../queue/queue.module';
import { SummariesController } from './summaries.controller';
import { SummariesService } from './summaries.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CandidateSummary]),
    CandidatesModule,
    QueueModule,
    LlmModule,
  ],
  controllers: [SummariesController],
  providers: [SummariesService],
  exports: [SummariesService],
})
export class SummariesModule {}
