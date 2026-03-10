import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TalentAssessment } from '../entities/talent-assessment.entity';
import { LlmModule } from '../llm/llm.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { QueueModule } from '../queue/queue.module';
import { AssessmentsController } from './assessments.controller';
import { AssessmentsService } from './assessments.service';

/**
 * AssessmentsModule provides the specialized logic for evaluating 
 * talent profiles using advanced intelligence engines.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([TalentAssessment]),
    ProfilesModule,
    QueueModule,
    LlmModule,
  ],
  controllers: [AssessmentsController],
  providers: [AssessmentsService],
  exports: [AssessmentsService],
})
export class AssessmentsModule { }
