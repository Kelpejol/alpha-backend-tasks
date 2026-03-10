import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';

import { ProfileAttachment } from '../entities/profile-attachment.entity';
import { TalentAssessment } from './../entities/talent-assessment.entity';
import { TalentProfile } from '../entities/talent-profile.entity';
import { TalentIntelligenceSchema1740000000000 } from '../migrations/1740000000000-TalentIntelligenceSchema';

/**
 * Default connection string for the PostgreSQL database.
 */
export const defaultDatabaseUrl =
  'postgres://assessment_user:assessment_pass@localhost:5432/assessment_db';

/**
 * Generates the TypeORM configuration options for the application.
 * 
 * @param databaseUrl - The PostgreSQL connection string.
 * @returns A combined TypeOrmModuleOptions and DataSourceOptions object.
 */
export const getTypeOrmOptions = (
  databaseUrl: string,
): TypeOrmModuleOptions & DataSourceOptions => ({
  type: 'postgres',
  url: databaseUrl,
  entities: [
    TalentProfile,
    ProfileAttachment,
    TalentAssessment,
  ],
  migrations: [
    TalentIntelligenceSchema1740000000000,
  ],
  migrationsTableName: 'talent_intelligence_migrations',
  synchronize: false,
  logging: false,
});
