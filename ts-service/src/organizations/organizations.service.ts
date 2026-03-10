import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Organization } from '../entities/organization.entity';

/**
 * OrganizationsService handles the lifecycle and management of multi-tenant
 * organizations within the platform.
 */
@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
  ) { }

  /**
   * Ensures that an organization exists for the given identifier.
   * If not found, a new organization is initialized.
   * 
   * @param orgId - The unique identifier for the organization.
   * @param displayName - Optional display name for initializing the organization.
   */
  async ensureOrganization(orgId: string, displayName?: string): Promise<Organization> {
    const existing = await this.organizationRepository.findOne({ where: { id: orgId } });

    if (existing) {
      return existing;
    }

    this.logger.log(`Initializing new organization: ${orgId}`);
    const organization = this.organizationRepository.create({
      id: orgId,
      displayName: displayName || `Organization ${orgId}`,
    });

    return this.organizationRepository.save(organization);
  }

  /**
   * Retrieves an organization by its identifier.
   * 
   * @param orgId - The unique identifier to look up.
   */
  async findOrganizationById(orgId: string): Promise<Organization | null> {
    return this.organizationRepository.findOne({ where: { id: orgId } });
  }

  /**
   * Returns a complete list of organizations registered in the system.
   */
  async listAllOrganizations(): Promise<Organization[]> {
    return this.organizationRepository.find({
      order: { createdAt: 'DESC' },
    });
  }
}
