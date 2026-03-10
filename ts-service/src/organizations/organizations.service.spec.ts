import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Organization } from '../entities/organization.entity';
import { OrganizationsService } from './organizations.service';

describe('OrganizationsService', () => {
  let service: OrganizationsService;

  const organizationRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        {
          provide: getRepositoryToken(Organization),
          useValue: organizationRepository,
        },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
  });

  describe('ensureOrganization', () => {
    it('returns existing organization if found', async () => {
      const mockOrg = { id: 'org-123', displayName: 'Existing Org' };
      organizationRepository.findOne.mockResolvedValue(mockOrg);

      const result = await service.ensureOrganization('org-123');

      expect(result).toEqual(mockOrg);
      expect(organizationRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'org-123' },
      });
      expect(organizationRepository.create).not.toHaveBeenCalled();
    });

    it('initializes and returns new organization if not found', async () => {
      organizationRepository.findOne.mockResolvedValue(null);
      organizationRepository.create.mockImplementation((dto) => dto);
      organizationRepository.save.mockImplementation(async (org) => ({
        ...org,
        createdAt: new Date(),
      }));

      const result = await service.ensureOrganization('org-456', 'New Org');

      expect(result.id).toBe('org-456');
      expect(result.displayName).toBe('New Org');
      expect(organizationRepository.create).toHaveBeenCalled();
      expect(organizationRepository.save).toHaveBeenCalled();
    });
  });

  describe('listAllOrganizations', () => {
    it('returns all registered organizations', async () => {
      const mockOrgs = [
        { id: '1', displayName: 'Org 1' },
        { id: '2', displayName: 'Org 2' },
      ];
      organizationRepository.find.mockResolvedValue(mockOrgs);

      const result = await service.listAllOrganizations();

      expect(result).toEqual(mockOrgs);
      expect(organizationRepository.find).toHaveBeenCalled();
    });
  });
});
