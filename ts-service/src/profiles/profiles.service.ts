import { randomUUID } from 'crypto';

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuthUser } from '../auth/auth.types';
import { TalentProfile } from '../entities/talent-profile.entity';
import { OrganizationsService } from '../organizations/organizations.service';
import { RegisterTalentProfileDto } from './dto/register-talent-profile.dto';

/**
 * ProfilesService handles the orchestration and lifecycle management of 
 * professional talent profiles within established organization boundaries.
 */
@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(TalentProfile)
    private readonly profileRepository: Repository<TalentProfile>,
    private readonly organizationsService: OrganizationsService,
  ) { }

  /**
   * Registers a new professional profile within the current user's organization.
   * Ensures organizational persistence before profile creation.
   * 
   * @param user - The authenticated administrative user.
   * @param dto - The registration payload.
   */
  async registerProfile(
    user: AuthUser,
    dto: RegisterTalentProfileDto,
  ): Promise<TalentProfile> {
    await this.organizationsService.ensureOrganization(user.workspaceId);

    const profile = this.profileRepository.create({
      profileId: randomUUID(),
      orgId: user.workspaceId,
      fullName: dto.fullName.trim(),
      emailAddress: dto.emailAddress?.trim() ?? null,
    });

    return this.profileRepository.save(profile);
  }

  /**
   * Internal method to ensure a profile exists for async attachment workflows.
   * 
   * @param profileId - The identifier for the profile.
   * @param user - The authenticated user requesting the profile.
   */
  async ensureProfileForOrganization(
    profileId: string,
    user: AuthUser,
  ): Promise<TalentProfile> {
    const existing = await this.profileRepository.findOne({
      where: { profileId, orgId: user.workspaceId },
    });

    if (existing) {
      return existing;
    }

    await this.organizationsService.ensureOrganization(user.workspaceId);

    const created = this.profileRepository.create({
      profileId,
      orgId: user.workspaceId,
      fullName: 'System Generated Profile',
    });

    return this.profileRepository.save(created);
  }

  /**
   * Retrieves a professional profile by ID, strictly enforcing organizational 
   * isolation.
   * 
   * @param profileId - The target profile identifier.
   * @param user - The authenticated user or system identity.
   */
  async getProfileForOrganizationOrFail(
    profileId: string,
    user: AuthUser,
  ): Promise<TalentProfile> {
    const profile = await this.profileRepository.findOne({
      where: { profileId, orgId: user.workspaceId },
    });

    if (!profile) {
      throw new NotFoundException('Professional profile not found in your organization');
    }

    return profile;
  }

  /**
   * Provides a collection of all talent profiles registered within the
   * organization.
   * 
   * @param user - The authenticated user.
   */
  async listProfilesForOrganization(user: AuthUser): Promise<TalentProfile[]> {
    return this.profileRepository.find({
      where: { orgId: user.workspaceId },
      order: { createdAt: 'DESC' },
    });
  }
}
