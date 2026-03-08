import { CreateDateColumn, Entity, OneToMany, PrimaryColumn } from 'typeorm';

import { CandidateDocument } from './candidate-document.entity';
import { CandidateSummary } from './candidate-summary.entity';

@Entity({ name: 'candidates' })
export class Candidate {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id!: string;

  @PrimaryColumn({ name: 'workspace_id', type: 'varchar', length: 64 })
  workspaceId!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @OneToMany(
    () => CandidateDocument,
    (document: CandidateDocument) => document.candidate,
  )
  documents!: CandidateDocument[];

  @OneToMany(
    () => CandidateSummary,
    (summary: CandidateSummary) => summary.candidate,
  )
  summaries!: CandidateSummary[];
}
