import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { CandidateSummary } from '../entities/candidate-summary.entity';
import { SUMMARIZATION_PROVIDER } from '../llm/summarization-provider.interface';
import { QueueService } from '../queue/queue.service';
import { CandidatesService } from '../candidates/candidates.service';
import { SummariesService } from './summaries.service';

describe('SummariesService', () => {
  let service: SummariesService;

  const summaryRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const candidatesService = {
    getCandidateForWorkspaceOrFail: jest.fn(),
  };

  const queueService = {
    enqueue: jest.fn(),
  };

  const summarizationProvider = {
    generateCandidateSummary: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SummariesService,
        {
          provide: getRepositoryToken(CandidateSummary),
          useValue: summaryRepository,
        },
        {
          provide: CandidatesService,
          useValue: candidatesService,
        },
        {
          provide: QueueService,
          useValue: queueService,
        },
        {
          provide: SUMMARIZATION_PROVIDER,
          useValue: summarizationProvider,
        },
      ],
    }).compile();

    service = module.get<SummariesService>(SummariesService);
  });

  it('queues summary generation with pending status', async () => {
    const pending = {
      id: 'summary-1',
      candidateId: 'candidate-1',
      workspaceId: 'workspace-1',
      status: 'pending',
      score: null,
      strengths: [],
      concerns: [],
      summary: null,
      recommendedDecision: null,
      provider: 'FakeSummarizationProvider',
      promptVersion: 'v1',
      errorMessage: null,
    };

    candidatesService.getCandidateForWorkspaceOrFail.mockResolvedValue({
      id: 'candidate-1',
      workspaceId: 'workspace-1',
    });
    summaryRepository.create.mockImplementation((value: unknown) => value);
    summaryRepository.save.mockResolvedValue(pending);
    queueService.enqueue.mockReturnValue({
      id: 'job-1',
      name: 'candidate.summary.generate',
      payload: {
        summaryId: 'summary-1',
        candidateId: 'candidate-1',
        workspaceId: 'workspace-1',
      },
      enqueuedAt: '2026-01-01T00:00:00.000Z',
      status: 'queued',
    });

    const accepted = await service.requestSummaryGeneration(
      'candidate-1',
      { userId: 'user-1', workspaceId: 'workspace-1' },
      {},
    );

    expect(candidatesService.getCandidateForWorkspaceOrFail).toHaveBeenCalled();
    expect(summaryRepository.save).toHaveBeenCalled();
    expect(queueService.enqueue).toHaveBeenCalledWith(
      'candidate.summary.generate',
      {
        summaryId: 'summary-1',
        candidateId: 'candidate-1',
        workspaceId: 'workspace-1',
      },
    );
    expect(accepted.summary.status).toBe('pending');
    expect(accepted.job.id).toBe('job-1');
  });

  it('returns candidate summary or throws for missing record', async () => {
    candidatesService.getCandidateForWorkspaceOrFail.mockResolvedValue({
      id: 'candidate-1',
      workspaceId: 'workspace-1',
    });
    summaryRepository.findOne.mockResolvedValue(null);

    await expect(
      service.getCandidateSummaryOrFail(
        'candidate-1',
        'summary-404',
        { userId: 'user-1', workspaceId: 'workspace-1' },
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
