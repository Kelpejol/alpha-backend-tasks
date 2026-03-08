import { randomUUID } from 'crypto';

import { Injectable } from '@nestjs/common';

export type QueueJobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface EnqueuedJob<TPayload = unknown> {
  id: string;
  name: string;
  payload: TPayload;
  enqueuedAt: string;
  status: QueueJobStatus;
  processedAt?: string;
  failedAt?: string;
  errorMessage?: string;
}

type QueueJobHandler<TPayload = unknown> = (payload: TPayload) => Promise<void>;

@Injectable()
export class QueueService {
  private readonly jobs: EnqueuedJob[] = [];
  private readonly handlers = new Map<string, QueueJobHandler>();

  enqueue<TPayload>(name: string, payload: TPayload): EnqueuedJob<TPayload> {
    const job: EnqueuedJob<TPayload> = {
      id: randomUUID(),
      name,
      payload,
      enqueuedAt: new Date().toISOString(),
      status: 'queued',
    };

    this.jobs.push(job);
    this.processIfHandlerExists(job);
    return job;
  }

  registerHandler<TPayload>(name: string, handler: QueueJobHandler<TPayload>): void {
    this.handlers.set(name, handler as QueueJobHandler);
    this.jobs
      .filter((job) => job.name === name && job.status === 'queued')
      .forEach((job) => this.processIfHandlerExists(job));
  }

  getQueuedJobs(): readonly EnqueuedJob[] {
    return this.jobs;
  }

  private processIfHandlerExists(job: EnqueuedJob): void {
    const handler = this.handlers.get(job.name);
    if (!handler || job.status !== 'queued') {
      return;
    }

    setImmediate(async () => {
      try {
        job.status = 'processing';
        await handler(job.payload);
        job.status = 'completed';
        job.processedAt = new Date().toISOString();
      } catch (error) {
        job.status = 'failed';
        job.failedAt = new Date().toISOString();
        job.errorMessage =
          error instanceof Error ? error.message : 'Unknown queue handler error';
      }
    });
  }
}
