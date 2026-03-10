import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AttachmentsModule } from './attachments/attachments.module';
import { AssessmentsModule } from './assessments/assessments.module';
import { AuthModule } from './auth/auth.module';
import { defaultDatabaseUrl, getTypeOrmOptions } from './config/typeorm.options';
import { HealthModule } from './health/health.module';
import { LlmModule } from './llm/llm.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { ProfilesModule } from './profiles/profiles.module';
import { QueueModule } from './queue/queue.module';
import { WorkersModule } from './workers/workers.module';

/**
 * AppModule serves as the root orchestration layer of the Talent 
 * Intelligence Service.
 * 
 * It coordinates configuration, persistence, and the integration of specialized
 * domain modules for organizations, profiles, attachments, and assessments.
 */
@Module({
  imports: [
    // Global Infrastructure & Configuration
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        getTypeOrmOptions(configService.get<string>('DATABASE_URL') ?? defaultDatabaseUrl),
    }),

    // Auxiliary & System Modules
    AuthModule,
    HealthModule,
    QueueModule,

    // Core Domain Modules
    OrganizationsModule,
    ProfilesModule,
    AttachmentsModule,
    AssessmentsModule,

    // Background Processing & Intelligence Engines
    LlmModule,
    WorkersModule,
  ],
})
export class AppModule { }
