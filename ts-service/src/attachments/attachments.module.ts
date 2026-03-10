import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProfileAttachment } from '../entities/profile-attachment.entity';
import { ProfilesModule } from '../profiles/profiles.module';
import { AttachmentsController } from './attachments.controller';
import { AttachmentsService } from './attachments.service';

/**
 * AttachmentsModule provides the infrastructure for securely linking 
 * documents and files to professional profiles.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([ProfileAttachment]),
    ProfilesModule,
  ],
  controllers: [AttachmentsController],
  providers: [AttachmentsService],
  exports: [AttachmentsService],
})
export class AttachmentsModule { }
