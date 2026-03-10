import { QueueService } from '../queue/queue.service';
import { IntelligenceGenerationWorker } from './intelligence-generation.worker';

describe('IntelligenceGenerationWorker', () => {
  const payload = {
    assessmentId: 'assessment-1',
    profileId: 'profile-1',
    orgId: 'org-1',
  };

  it('finalizes assessment on successful engine call', async () => {
    const queueService = new QueueService();
    const attachmentsService = {
      findAttachmentsByProfile: jest.fn().mockResolvedValue([
        { contentBlob: 'resume text' },
        { contentBlob: 'cover letter text' },
      ]),
    };
    const assessmentsService = {
      validateEngineResult: jest.fn((result: unknown) => result),
      finalizeAssessment: jest.fn().mockResolvedValue(undefined),
      markAsFailed: jest.fn(),
    };
    const intelligenceEngine = {
      generateAssessment: jest.fn().mockResolvedValue({
        score: 80,
        strengths: ['Strong backend fundamentals'],
        concerns: ['Limited leadership examples'],
        summary: 'Good fit with moderate risk.',
        recommendedDecision: 'hold',
      }),
    };

    const worker = new IntelligenceGenerationWorker(
      queueService,
      attachmentsService as any,
      assessmentsService as any,
      intelligenceEngine as any,
    );

    worker.onModuleInit();
    queueService.enqueue('talent.assessment.generate', payload);

    // Minor delay to allow async handler to trigger
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(attachmentsService.findAttachmentsByProfile).toHaveBeenCalledWith(
      'profile-1',
      'org-1',
    );
    expect(assessmentsService.finalizeAssessment).toHaveBeenCalledWith(
      'assessment-1',
      expect.objectContaining({
        score: 80,
        recommendedDecision: 'hold',
      }),
    );
    expect(assessmentsService.markAsFailed).not.toHaveBeenCalled();
  });

  it('marks assessment as failed on engine exception', async () => {
    const queueService = new QueueService();
    const attachmentsService = {
      findAttachmentsByProfile: jest.fn().mockResolvedValue([{ contentBlob: 'resume' }]),
    };
    const assessmentsService = {
      validateEngineResult: jest.fn(),
      finalizeAssessment: jest.fn(),
      markAsFailed: jest.fn().mockResolvedValue(undefined),
    };
    const intelligenceEngine = {
      generateAssessment: jest
        .fn()
        .mockRejectedValue(new Error('engine unavailable')),
    };

    const worker = new IntelligenceGenerationWorker(
      queueService,
      attachmentsService as any,
      assessmentsService as any,
      intelligenceEngine as any,
    );

    worker.onModuleInit();
    queueService.enqueue('talent.assessment.generate', payload);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(assessmentsService.finalizeAssessment).not.toHaveBeenCalled();
    expect(assessmentsService.markAsFailed).toHaveBeenCalledWith(
      'assessment-1',
      'engine unavailable',
    );
  });
});
