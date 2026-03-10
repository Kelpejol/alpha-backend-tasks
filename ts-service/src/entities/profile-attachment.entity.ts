import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

import { TalentProfile } from './talent-profile.entity';

/**
 * ProfileAttachment represents a specific document or data blob associated
 * with a TalentProfile.
 * 
 * It stores reference keys to external storage and the raw extracted content
 * for intelligence processing.
 */
@Entity({ name: 'profile_attachments' })
export class ProfileAttachment {
  /**
   * Unique identifier for the attachment.
   */
  @PrimaryColumn({ name: 'attachment_id', type: 'varchar', length: 64 })
  attachmentId!: string;

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
   * Functional category of the document (e.g., 'resume', 'cover_letter').
   */
  @Column({ name: 'type', type: 'varchar', length: 64 })
  type!: string;

  /**
   * Original name of the uploaded file.
   */
  @Column({ name: 'filename', type: 'varchar', length: 255 })
  filename!: string;

  /**
   * Reference key for the external storage layer.
   */
  @Column({ name: 'storage_ref', type: 'varchar', length: 500 })
  storageRef!: string;

  /**
   * Raw text content extracted from the document.
   */
  @Column({ name: 'content_blob', type: 'text' })
  contentBlob!: string;

  /**
   * Timestamp when the document was successfully uploaded.
   */
  @CreateDateColumn({ name: 'uploaded_at', type: 'timestamptz' })
  uploadedAt!: Date;

  /**
   * Managed relationship to the TalentProfile.
   * Enforces referential integrity with cascading deletes.
   */
  @ManyToOne(() => TalentProfile, (profile: TalentProfile) => profile.attachments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([
    { name: 'profile_id', referencedColumnName: 'profileId' },
    { name: 'org_id', referencedColumnName: 'orgId' },
  ])
  profile!: TalentProfile;
}
