import { Column, CreateDateColumn, Entity, OneToMany, PrimaryColumn } from 'typeorm';

import { ProfileAttachment } from './profile-attachment.entity';
import { TalentAssessment } from './talent-assessment.entity';

/**
 * TalentProfile represents a distinct professional profile within the platform.
 * 
 * It is a multi-tenant entity, uniquely identified by a combination of the
 * profile identifier and the associated organization (workspace).
 */
@Entity({ name: 'talent_profiles' })
export class TalentProfile {
  /**
   * Unique identifier for the professional profile.
   */
  @PrimaryColumn({ name: 'profile_id', type: 'varchar', length: 64 })
  profileId!: string;

  /**
   * Identifier for the organization owning this profile.
   * Enforces strict multi-tenant isolation.
   */
  @PrimaryColumn({ name: 'org_id', type: 'varchar', length: 64 })
  orgId!: string;

  /**
   * Complete legal or professional name of the individual.
   */
  @Column({ name: 'full_name', type: 'varchar', length: 160, nullable: true })
  fullName!: string | null;

  /**
   * Primary contact email address for the talent.
   */
  @Column({ name: 'email_address', type: 'varchar', length: 160, nullable: true })
  emailAddress!: string | null;

  /**
   * Timestamp when the profile was first registered.
   */
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  /**
   * Collection of documents and files attached to this profile.
   */
  @OneToMany(
    () => ProfileAttachment,
    (attachment: ProfileAttachment) => attachment.profile,
  )
  attachments!: ProfileAttachment[];

  /**
   * Historical record of intelligence assessments generated for this profile.
   */
  @OneToMany(
    () => TalentAssessment,
    (assessment: TalentAssessment) => assessment.profile,
  )
  assessments!: TalentAssessment[];
}
