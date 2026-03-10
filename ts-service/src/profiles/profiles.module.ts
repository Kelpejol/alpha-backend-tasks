import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TalentProfile } from '../entities/talent-profile.entity';
import { OrganizationsModule } from '../organizations/organizations.module';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';

/**
 * ProfilesModule facilitates the registration and management of high-level
 * professional profile records.
 * 
 * It depends on OrganizationsModule to ensure strict multi-tenant isolation.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([TalentProfile]),
    OrganizationsModule,
  ],
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfilesModule { }
