import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuthUser } from '../auth/auth.types';
import { Candidate } from '../entities/candidate.entity';

@Injectable()
export class CandidatesService {
  constructor(
    @InjectRepository(Candidate)
    private readonly candidateRepository: Repository<Candidate>,
  ) {}

  async ensureCandidateForWorkspace(
    candidateId: string,
    user: AuthUser,
  ): Promise<Candidate> {
    const existing = await this.candidateRepository.findOne({
      where: { id: candidateId, workspaceId: user.workspaceId },
    });

    if (existing) {
      return existing;
    }

    const created = this.candidateRepository.create({
      id: candidateId,
      workspaceId: user.workspaceId,
    });

    return this.candidateRepository.save(created);
  }

  async getCandidateForWorkspaceOrFail(
    candidateId: string,
    user: AuthUser,
  ): Promise<Candidate> {
    const candidate = await this.candidateRepository.findOne({
      where: { id: candidateId, workspaceId: user.workspaceId },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found in your workspace');
    }

    return candidate;
  }
}
