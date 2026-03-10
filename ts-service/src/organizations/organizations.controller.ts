import { Controller, Get, UseGuards } from '@nestjs/common';

import { FakeAuthGuard } from '../auth/fake-auth.guard';
import { Organization } from '../entities/organization.entity';
import { OrganizationsService } from './organizations.service';

/**
 * OrganizationsController provides entry points for managing high-level
 * organizational entities within the platform.
 */
@Controller('organizations')
@UseGuards(FakeAuthGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) { }

  /**
   * Retrieves a list of all organizations registered in the system.
   * This is primarily for administrative visibility.
   */
  @Get()
  async listOrganizations(): Promise<Organization[]> {
    return this.organizationsService.listAllOrganizations();
  }
}
