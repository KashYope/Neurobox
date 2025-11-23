import { randomUUID } from 'crypto';
import { pool } from '../db.js';

export type BatchTranslationStatus = 'queued' | 'running' | 'completed' | 'failed';

export interface BatchTranslationJob {
  id: string;
  targetLangs: string[];
  perimeter?: string;
  status: BatchTranslationStatus;
  progress: {
    processed: number;
    total: number;
  };
  startedAt: string;
  completedAt?: string;
  errors: string[];
}

interface InternalJob extends Omit<BatchTranslationJob, 'startedAt' | 'completedAt'> {
  startedAt: Date;
  completedAt?: Date;
}

const jobs = new Map<string, InternalJob>();

const serializeJob = (job: InternalJob): BatchTranslationJob => ({
  ...job,
  startedAt: job.startedAt.toISOString(),
  completedAt: job.completedAt?.toISOString()
});

const processJob = async (job: InternalJob, perimeter?: string) => {
  try {
    job.status = 'running';

    const query = perimeter ? 'SELECT id FROM exercise_strings WHERE context = $1' : 'SELECT id FROM exercise_strings';
    const params = perimeter ? [perimeter] : [];
    const { rows } = await pool.query<{ id: string }>(query, params);

    const tasks = rows.flatMap((row) => job.targetLangs.map((lang) => ({ stringId: row.id, lang })));
    job.progress.total = tasks.length;

    if (tasks.length === 0) {
      job.status = 'completed';
      job.completedAt = new Date();
      jobs.set(job.id, job);
      return;
    }

    const runTask = (index: number) => {
      if (index >= tasks.length) {
        job.status = 'completed';
        job.completedAt = new Date();
        jobs.set(job.id, job);
        return;
      }

      setTimeout(() => {
        job.progress.processed += 1;
        jobs.set(job.id, job);
        runTask(index + 1);
      }, 150);
    };

    runTask(0);
  } catch (error) {
    job.status = 'failed';
    job.errors.push(error instanceof Error ? error.message : 'Unexpected error during batch processing');
    job.completedAt = new Date();
    jobs.set(job.id, job);
  }
};

export const startBatchTranslation = async (targetLangs: string[], perimeter?: string): Promise<BatchTranslationJob> => {
  const job: InternalJob = {
    id: randomUUID(),
    targetLangs,
    perimeter,
    status: 'queued',
    progress: {
      processed: 0,
      total: 0
    },
    startedAt: new Date(),
    errors: []
  };

  jobs.set(job.id, job);
  void processJob(job, perimeter);

  return serializeJob(job);
};

export const getBatchTranslationStatus = (id: string): BatchTranslationJob | undefined => {
  const job = jobs.get(id);
  return job ? serializeJob(job) : undefined;
};
