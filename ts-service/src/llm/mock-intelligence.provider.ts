import { Injectable, Logger } from '@nestjs/common';
import { AssessmentResult, IntelligenceEngine } from './intelligence-engine.interface';

/**
 * MockIntelligenceProvider facilitates safe system testing and development
 * by simulating the output of an advanced talent evaluation engine.
 */
@Injectable()
export class MockIntelligenceProvider implements IntelligenceEngine {
  private readonly logger = new Logger(MockIntelligenceProvider.name);

  /**
   * Generates a simulated assessment result for testing purposes.
   * 
   * @param payload - Metadata regarding the talent profile and context.
   */
  async generateAssessment(payload: {
    profileId: string;
    documents: string[];
  }): Promise<AssessmentResult> {
    this.logger.log(`[Mock] Generating assessment for profile: ${payload.profileId}`);

    // Artificial latency to simulate intelligence processing
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return {
      score: 85,
      strengths: [
        'Exceptional collaborative leadership record',
        'Proven architectural expertise in distributed systems',
        'Strong alignment with strategic organizational goals',
      ],
      concerns: [
        'Limited experience with legacy mainframe integration',
      ],
      summary: `A highly qualified senior engineer with a specialized focus on modern platform 
      infrastructure and high-scale system design. Demonstrates clear strategic thinking and 
      operational excellence.`,
      recommendedDecision: 'advance',
    };
  }
}
