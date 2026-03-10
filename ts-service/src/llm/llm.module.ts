import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { INTELLIGENCE_ENGINE } from './intelligence-engine.interface';
import { MockIntelligenceProvider } from './mock-intelligence.provider';
import { VertexIntelligenceProvider } from './vertex-intelligence.provider';

/**
 * LlmModule establishes the infrastructure for advanced intelligence-driven
 * talent assessments.
 * 
 * It dynamically selects the appropriate intelligence engine (Vertex AI vs Mock)
 * based on the system configuration.
 */
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: INTELLIGENCE_ENGINE,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        // Toggle engine based on configuration
        const useMock = configService.get<string>('USE_MOCK_LLM') === 'true';
        return useMock
          ? new MockIntelligenceProvider()
          : new VertexIntelligenceProvider(configService);
      },
    },
  ],
  exports: [INTELLIGENCE_ENGINE],
})
export class LlmModule { }
