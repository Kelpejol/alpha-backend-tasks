import { AssessmentOutcome } from '../entities/talent-assessment.entity';

/**
 * AssessmentResult defines the structured output produced by an 
 * intelligence engine during the talent evaluation process.
 */
export interface AssessmentResult {
  score: number;
  strengths: string[];
  concerns: string[];
  summary: string;
  recommendedDecision: AssessmentOutcome;
}

/**
 * Identification for the primary intelligence provider injection token.
 */
export const INTELLIGENCE_ENGINE = Symbol('INTELLIGENCE_ENGINE');

/**
 * IntelligenceEngine provides a standard abstraction for generating 
 * data-driven assessments of professional talent profiles.
 */
export interface IntelligenceEngine {
  /**
   * Generates a comprehensive assessment for the specified talent profile.
   * 
   * @param payload - Data defining the profile and associated support documents.
   */
  generateAssessment(payload: {
    profileId: string;
    documents: string[];
  }): Promise<AssessmentResult>;
}
