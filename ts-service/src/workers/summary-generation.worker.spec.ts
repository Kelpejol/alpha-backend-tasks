import { QueueService } from '../queue/queue.service';
import { SummaryGenerationWorker } from './summary-generation.worker';

describe('SummaryGenerationWorker', () => {
  const payload = {
    summaryId: 'summary-1',
    candidateId: 'candidate-1',
    workspaceId: 'workspace-1',
  };

  it('completes summary on successful provider call', async () => {
    const queueService = new QueueService();
    const documentsService = {
      getDocumentsForCandidate: jest.fn().mockResolvedValue([
        { rawText: 'resume text' },
        { rawText: 'cover letter text' },
      ]),
    };
    const summariesService = {
      validateProviderResult: jest.fn((result: unknown) => result),
      completeSummary: jest.fn().mockResolvedValue(undefined),
      failSummary: jest.fn(),
    };
    const summarizationProvider = {
      generateCandidateSummary: jest.fn().mockResolvedValue({
        score: 80,
        strengths: ['Strong backend fundamentals'],
        concerns: ['Limited leadership examples'],
        summary: 'Good fit with moderate risk.',
        recommendedDecision: 'hold',
      }),
    };

    const worker = new SummaryGenerationWorker(
      queueService,
      documentsService as never,
      summariesService as never,
      summarizationProvider,
    );

    worker.onModuleInit();
    queueService.enqueue('candidate.summary.generate', payload);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(documentsService.getDocumentsForCandidate).toHaveBeenCalledWith(
      'candidate-1',
      'workspace-1',
    );
    expect(summariesService.completeSummary).toHaveBeenCalledWith(
      'summary-1',
      expect.objectContaining({
        score: 80,
        recommendedDecision: 'hold',
      }),
    );
    expect(summariesService.failSummary).not.toHaveBeenCalled();
  });

  it('marks summary as failed on provider exception', async () => {
    const queueService = new QueueService();
    const documentsService = {
      getDocumentsForCandidate: jest.fn().mockResolvedValue([{ rawText: 'resume' }]),
    };
    const summariesService = {
      validateProviderResult: jest.fn(),
      completeSummary: jest.fn(),
      failSummary: jest.fn().mockResolvedValue(undefined),
    };
    const summarizationProvider = {
      generateCandidateSummary: jest
        .fn()
        .mockRejectedValue(new Error('provider unavailable')),
    };

    const worker = new SummaryGenerationWorker(
      queueService,
      documentsService as never,
      summariesService as never,
      summarizationProvider,
    );

    worker.onModuleInit();
    queueService.enqueue('candidate.summary.generate', payload);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(summariesService.completeSummary).not.toHaveBeenCalled();
    expect(summariesService.failSummary).toHaveBeenCalledWith(
      'summary-1',
      'provider unavailable',
    );
  });
});
