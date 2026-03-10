import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { TalentProfile } from './talent-profile.entity';

export type AssessmentStatus = 'pending' | 'completed' | 'failed';
export type AssessmentOutcome = 'advance' | 'hold' | 'reject';

/**
 * TalentAssessment represents an intelligence-driven evaluation of a 
 * professional profile.
 * 
 * It stores structured analysis produced by the assessment engine, 
 * including scores, strategic strengths, and Identified risk factors.
 */
@Entity({ name: 'talent_assessments' })
export class TalentAssessment {
  /**
   * Unique identifier for the assessment.
   */
  @PrimaryColumn({ name: 'assessment_id', type: 'varchar', length: 64 })
  assessmentId!: string;

  /**
   * Reference to the parent TalentProfile.
   */
  @Column({ name: 'profile_id', type: 'varchar', length: 64 })
  profileId!: string;

  /**
   * Multi-tenant organization identifier.
   */
  @Column({ name: 'org_id', type: 'varchar', length: 64 })
  orgId!: string;

  /**
   * Current lifecycle state of the assessment.
   */
  @Column({ name: 'assessment_status', type: 'varchar', length: 20 })
  status!: AssessmentStatus;

  /**
   * Quantitative integrity or suitability score (0-100).
   */
  @Column({ name: 'integrity_score', type: 'int', nullable: true })
  score!: number | null;

  /**
   * Structured list of strategic strengths identified by the engine.
   */
  @Column({ name: 'key_strengths', type: 'text', array: true, default: '{}' })
  strengths!: string[];

  /**
   * Structured list of risk factors or concerns identified by the engine.
   */
  @Column({ name: 'risk_factors', type: 'text', array: true, default: '{}' })
  concerns!: string[];

  /**
   * Comprehensive narrative analysis of the talent profile.
   */
  @Column({ name: 'full_narrative', type: 'text', nullable: true })
  summary!: string | null;

  /**
   * Recommended strategic decision based on the analysis.
   */
  @Column({ name: 'decision_recommendation', type: 'varchar', length: 20, nullable: true })
  recommendedDecision!: AssessmentOutcome | null;

  /**
   * Name of the intelligence engine provider used for this assessment.
   */
  @Column({ name: 'engine_provider', type: 'varchar', length: 80 })
  provider!: string;

  /**
   * Version of the assessment runtime/prompt used.
   */
  @Column({ name: 'runtime_version', type: 'varchar', length: 80 })
  runtimeVersion!: string;

  /**
   * Descriptive log of errors encountered during processing.
   */
  @Column({ name: 'failure_log', type: 'text', nullable: true })
  failureLog!: string | null;

  /**
   * Timestamp when the assessment request was successfully registered.
   */
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  /**
   * Timestamp of the last state modification.
   */
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Managed relationship to the TalentProfile.
   * Enforces referential integrity with cascading deletes.
   */
  @ManyToOne(() => TalentProfile, (profile: TalentProfile) => profile.assessments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([
    { name: 'profile_id', referencedColumnName: 'profileId' },
    { name: 'org_id', referencedColumnName: 'orgId' },
  ])
  profile!: TalentProfile;
}
