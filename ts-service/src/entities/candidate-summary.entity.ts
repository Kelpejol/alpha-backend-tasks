import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Candidate } from './candidate.entity';

export type CandidateSummaryStatus = 'pending' | 'completed' | 'failed';
export type CandidateDecision = 'advance' | 'hold' | 'reject';

@Entity({ name: 'candidate_summaries' })
export class CandidateSummary {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id!: string;

  @Column({ name: 'candidate_id', type: 'varchar', length: 64 })
  candidateId!: string;

  @Column({ name: 'workspace_id', type: 'varchar', length: 64 })
  workspaceId!: string;

  @Column({ type: 'varchar', length: 20 })
  status!: CandidateSummaryStatus;

  @Column({ type: 'int', nullable: true })
  score!: number | null;

  @Column({ type: 'text', array: true, default: '{}' })
  strengths!: string[];

  @Column({ type: 'text', array: true, default: '{}' })
  concerns!: string[];

  @Column({ type: 'text', nullable: true })
  summary!: string | null;

  @Column({ name: 'recommended_decision', type: 'varchar', length: 20, nullable: true })
  recommendedDecision!: CandidateDecision | null;

  @Column({ type: 'varchar', length: 80 })
  provider!: string;

  @Column({ name: 'prompt_version', type: 'varchar', length: 80 })
  promptVersion!: string;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => Candidate, (candidate: Candidate) => candidate.summaries, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([
    { name: 'candidate_id', referencedColumnName: 'id' },
    { name: 'workspace_id', referencedColumnName: 'workspaceId' },
  ])
  candidate!: Candidate;
}
