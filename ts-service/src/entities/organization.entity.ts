import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

/**
 * Organization represents a multi-tenant workspace within the platform.
 * 
 * It serves as the primary security boundary for talent profiles, 
 * attachments, and assessments.
 */
@Entity({ name: 'organizations' })
export class Organization {
  /**
   * Unique identifier for the organization.
   */
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id!: string;

  /**
   * Human-readable name of the organization or workspace.
   */
  @Column({ name: 'display_name', type: 'varchar', length: 120 })
  displayName!: string;

  /**
   * Timestamp when the organization was registered in the system.
   */
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
