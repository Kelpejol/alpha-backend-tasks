import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  CandidateSummaryInput,
  CandidateSummaryResult,
  SummarizationProvider,
} from './summarization-provider.interface';

interface GeminiResponsePart {
  text?: string;
}

interface GeminiResponseCandidate {
  content?: {
    parts?: GeminiResponsePart[];
  };
}

interface GeminiGenerateContentResponse {
  candidates?: GeminiResponseCandidate[];
}

@Injectable()
export class GeminiSummarizationProvider implements SummarizationProvider {
  constructor(private readonly configService: ConfigService) {}

  async generateCandidateSummary(
    input: CandidateSummaryInput,
  ): Promise<CandidateSummaryResult> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException('GEMINI_API_KEY is not configured');
    }

    const prompt = [
      'You are a recruiter assistant. Summarize candidate documents.',
      'Return ONLY JSON with keys: score, strengths, concerns, summary, recommendedDecision.',
      'recommendedDecision must be one of: advance, hold, reject.',
      `Candidate ID: ${input.candidateId}`,
      'Documents:',
      ...input.documents.map((doc, index) => `Document ${index + 1}: ${doc}`),
    ].join('\n');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      throw new InternalServerErrorException(`Gemini request failed: ${body}`);
    }

    const payload =
      (await response.json()) as GeminiGenerateContentResponse;
    const rawText =
      payload.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    if (!rawText) {
      throw new InternalServerErrorException('Gemini returned empty response');
    }

    try {
      return JSON.parse(rawText) as CandidateSummaryResult;
    } catch {
      throw new InternalServerErrorException(
        'Gemini returned invalid JSON payload',
      );
    }
  }
}
