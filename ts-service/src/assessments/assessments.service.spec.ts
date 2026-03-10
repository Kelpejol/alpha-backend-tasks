import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { TalentAssessment } from '../entities/talent-assessment.entity';
import { INTELLIGENCE_ENGINE } from '../llm/intelligence-engine.interface';
import { QueueService } from '../queue/queue.service';
import { ProfilesService } from '../profiles/profiles.service';
import { AssessmentsService } from './assessments.service';

describe('AssessmentsService', () => {
  let service: AssessmentsService;

  const assessmentRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const profilesService = {
    getProfileForOrganizationOrFail: jest.fn(),
    ensureProfileForOrganization: jest.fn(),
  };

  const queueService = {
    enqueue: jest.fn(),
  };

  const intelligenceEngine = {
    generateAssessment: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssessmentsService,
        {
          provide: getRepositoryToken(TalentAssessment),
          useValue: assessmentRepository,
        },
        {
          provide: ProfilesService,
          useValue: profilesService,
        },
        {
          provide: QueueService,
          useValue: queueService,
        },
        {
          provide: INTELLIGENCE_ENGINE,
          useValue: intelligenceEngine,
        },
      ],
    }).compile();

    service = module.get<AssessmentsService>(AssessmentsService);
  });

  describe('requestAssessmentGeneration', () => {
    it('queues assessment generation with pending status', async () => {
      const mockResult = {
        assessmentId: 'assessment-1',
        profileId: 'profile-1',
        orgId: 'org-1',
        status: 'pending',
        score: null,
        strengths: [],
        concerns: [],
        summary: null,
        recommendedDecision: null,
        provider: 'MockIntelligenceProvider',
        runtimeVersion: 'v1',
        failureLog: null,
      };

      profilesService.getProfileForOrganizationOrFail.mockResolvedValue({
        profileId: 'profile-1',
        orgId: 'org-1',
      });
      assessmentRepository.create.mockImplementation((value: unknown) => value);
      assessmentRepository.save.mockResolvedValue(mockResult);
      queueService.enqueue.mockReturnValue({
        id: 'job-1',
        name: 'talent.assessment.generate',
        payload: {
          assessmentId: 'assessment-1',
          profileId: 'profile-1',
          orgId: 'org-1',
        },
        enqueuedAt: '2026-03-10T18:00:00.000Z',
        status: 'queued',
      });

      const accepted = await service.requestAssessmentGeneration(
        'profile-1',
        { userId: 'user-1', workspaceId: 'org-1' },
        {},
      );

      expect(profilesService.getProfileForOrganizationOrFail).toHaveBeenCalled();
      expect(assessmentRepository.save).toHaveBeenCalled();
      expect(queueService.enqueue).toHaveBeenCalledWith(
        'talent.assessment.generate',
        {
          assessmentId: 'assessment-1',
          profileId: 'profile-1',
          orgId: 'org-1',
        },
      );
      expect(accepted.assessment.status).toBe('pending');
      expect(accepted.job.id).toBe('job-1');
    });
  });

  describe('getAssessmentOrFail', () => {
    it('returns assessment or throws for missing record', async () => {
      profilesService.getProfileForOrganizationOrFail.mockResolvedValue({
        profileId: 'profile-1',
        orgId: 'org-1',
      });
      assessmentRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getAssessmentOrFail(
          'profile-1',
          'assessment-404',
          { userId: 'user-1', workspaceId: 'org-1' },
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
