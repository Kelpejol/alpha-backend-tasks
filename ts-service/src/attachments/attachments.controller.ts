import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/auth-user.decorator';
import { AuthUser } from '../auth/auth.types';
import { FakeAuthGuard } from '../auth/fake-auth.guard';
import { ProfileAttachment } from '../entities/profile-attachment.entity';
import { AttachmentsService } from './attachments.service';
import { RegisterProfileAttachmentDto } from './dto/register-profile-attachment.dto';

/**
 * AttachmentsController provides endpoints for managing documents and files
 * linked to professional talent profiles.
 */
@Controller('candidates/:candidateId/documents')
@UseGuards(FakeAuthGuard)
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) { }

  /**
   * Registers a new document or data attachment for the specified talent profile.
   * 
   * @param candidateId - The identifier for the target profile.
   * @param user - Authenticated user context.
   * @param dto - Metadata for the new attachment.
   */
  @Post()
  async uploadAttachment(
    @Param('candidateId') candidateId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: RegisterProfileAttachmentDto,
  ): Promise<ProfileAttachment> {
    return this.attachmentsService.registerAttachment(candidateId, user, dto);
  }
}
