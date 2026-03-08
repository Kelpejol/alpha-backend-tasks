import { randomUUID } from 'crypto';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuthUser } from '../auth/auth.types';
import { CandidatesService } from '../candidates/candidates.service';
import { CandidateDocument } from '../entities/candidate-document.entity';
import { CreateCandidateDocumentDto } from './dto/create-candidate-document.dto';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(CandidateDocument)
    private readonly documentRepository: Repository<CandidateDocument>,
    private readonly candidatesService: CandidatesService,
  ) {}

  async uploadCandidateDocument(
    candidateId: string,
    user: AuthUser,
    dto: CreateCandidateDocumentDto,
  ): Promise<CandidateDocument> {
    await this.candidatesService.ensureCandidateForWorkspace(candidateId, user);

    const document = this.documentRepository.create({
      id: randomUUID(),
      candidateId,
      workspaceId: user.workspaceId,
      documentType: dto.documentType.trim(),
      fileName: dto.fileName.trim(),
      storageKey: dto.storageKey.trim(),
      rawText: dto.rawText.trim(),
    });

    return this.documentRepository.save(document);
  }

  async getDocumentsForCandidate(
    candidateId: string,
    workspaceId: string,
  ): Promise<CandidateDocument[]> {
    return this.documentRepository.find({
      where: { candidateId, workspaceId },
      order: { uploadedAt: 'ASC' },
    });
  }
}
