import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/auth-user.decorator';
import { AuthUser } from '../auth/auth.types';
import { FakeAuthGuard } from '../auth/fake-auth.guard';
import { CreateCandidateDocumentDto } from './dto/create-candidate-document.dto';
import { DocumentsService } from './documents.service';

@Controller('candidates/:candidateId/documents')
@UseGuards(FakeAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  async uploadDocument(
    @Param('candidateId') candidateId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateCandidateDocumentDto,
  ) {
    return this.documentsService.uploadCandidateDocument(candidateId, user, dto);
  }
}
