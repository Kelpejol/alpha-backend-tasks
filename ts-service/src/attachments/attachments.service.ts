import { randomUUID } from 'crypto';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuthUser } from '../auth/auth.types';
import { ProfileAttachment } from '../entities/profile-attachment.entity';
import { ProfilesService } from '../profiles/profiles.service';
import { RegisterProfileAttachmentDto } from './dto/register-profile-attachment.dto';

/**
 * AttachmentsService manages the lifecycle of document and file attachments 
 * linked to professional talent profiles.
 */
@Injectable()
export class AttachmentsService {
  constructor(
    @InjectRepository(ProfileAttachment)
    private readonly attachmentRepository: Repository<ProfileAttachment>,
    private readonly profilesService: ProfilesService,
  ) { }

  /**
   * Registers and persists a new document attachment for a specific talent 
   * profile, strictly isolated by organization.
   * 
   * @param profileId - The identifier for the target profile.
   * @param user - The authenticated user performing the upload.
   * @param dto - Metadata regarding the attachment.
   */
  async registerAttachment(
    profileId: string,
    user: AuthUser,
    dto: RegisterProfileAttachmentDto,
  ): Promise<ProfileAttachment> {
    await this.profilesService.ensureProfileForOrganization(profileId, user);

    const attachment = this.attachmentRepository.create({
      attachmentId: randomUUID(),
      profileId,
      orgId: user.workspaceId,
      type: dto.attachmentType.trim(),
      filename: dto.originalName.trim(),
      storageRef: dto.storageReference.trim(),
      contentBlob: dto.contentBlob.trim(),
    });

    return this.attachmentRepository.save(attachment);
  }

  /**
   * Retrieves all attachments associated with a specific talent profile.
   * 
   * @param profileId - The profile to query.
   * @param orgId - The organization identifier (multi-tenant guard).
   */
  async findAttachmentsByProfile(
    profileId: string,
    orgId: string,
  ): Promise<ProfileAttachment[]> {
    return this.attachmentRepository.find({
      where: { profileId, orgId },
      order: { uploadedAt: 'ASC' },
    });
  }
}
