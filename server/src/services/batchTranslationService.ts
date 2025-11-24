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
    console.log(`[BatchTranslation] Starting job ${job.id} for languages: ${job.targetLangs.join(', ')}`);

    const query = perimeter ? 'SELECT id FROM exercise_strings WHERE context = $1' : 'SELECT id FROM exercise_strings';
    const params = perimeter ? [perimeter] : [];
    const { rows } = await pool.query<{ id: string }>(query, params);

    console.log(`[BatchTranslation] Found ${rows.length} strings to translate`);

    const tasks = rows.flatMap((row) => job.targetLangs.map((lang) => ({ stringId: row.id, lang })));
    job.progress.total = tasks.length;
    console.log(`[BatchTranslation] Total tasks: ${tasks.length}`);

    if (tasks.length === 0) {
      console.log(`[BatchTranslation] No tasks to process. Job ${job.id} completed.`);
      job.status = 'completed';
      job.completedAt = new Date();
      jobs.set(job.id, job);
      return;
    }

    const runTask = (index: number) => {
      if (index >= tasks.length) {
        console.log(`[BatchTranslation] All tasks completed for job ${job.id}`);
        job.status = 'completed';
        job.completedAt = new Date();
        jobs.set(job.id, job);
        return;
      }

      setTimeout(() => {
        const task = tasks[index];
        console.log(`[BatchTranslation] Processing task ${index + 1}/${tasks.length}: stringId=${task.stringId}, lang=${task.lang}`);
        // TODO: ACTUAL TRANSLATION IS NOT IMPLEMENTED!
        // This currently just simulates progress without performing actual translations
        job.progress.processed += 1;
        jobs.set(job.id, job);
        runTask(index + 1);
      }, 150);
    };

    runTask(0);
  } catch (error) {
    console.error(`[BatchTranslation] Job ${job.id} failed:`, error);
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
