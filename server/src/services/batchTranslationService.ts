import { randomUUID } from 'crypto';
import { pool } from '../db.js';
import { translationService } from './translationService.js';

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

    const runTask = async (index: number): Promise<void> => {
      if (index >= tasks.length) {
        console.log(`[BatchTranslation] All tasks completed for job ${job.id}`);
        job.status = 'completed';
        job.completedAt = new Date();
        jobs.set(job.id, job);
        return;
      }

      const task = tasks[index];
      console.log(`[BatchTranslation] Processing task ${index + 1}/${tasks.length}: stringId=${task.stringId}, lang=${task.lang}`);
      
      try {
        // Fetch source text from database
        const stringQuery = 'SELECT source_text, source_lang FROM exercise_strings WHERE id = $1';
        const stringResult = await pool.query<{ source_text: string; source_lang: string }>(stringQuery, [task.stringId]);
        
        if (stringResult.rows.length === 0) {
          console.error(`[BatchTranslation] String ${task.stringId} not found`);
          job.errors.push(`String ${task.stringId} not found`);
        } else {
          const { source_text, source_lang } = stringResult.rows[0];
          
          // Translate text
          const result = await translationService.translate(source_text, source_lang, task.lang);
          
          if (result.error) {
            console.error(`[BatchTranslation] Translation error for ${task.stringId}:`, result.error);
            job.errors.push(`Translation error for ${task.stringId}: ${result.error}`);
          } else {
            // Insert/update translation in database
            const upsertQuery = `
              INSERT INTO exercise_translations (string_id, lang, translated_text, translation_method, translated_at)
              VALUES ($1, $2, $3, $4, NOW())
              ON CONFLICT (string_id, lang) 
              DO UPDATE SET 
                translated_text = EXCLUDED.translated_text,
                translation_method = EXCLUDED.translation_method,
                updated_at = NOW()
            `;
            await pool.query(upsertQuery, [task.stringId, task.lang, result.translatedText, 'google_translate']);
            console.log(`[BatchTranslation] Successfully translated ${task.stringId} to ${task.lang}`);
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[BatchTranslation] Task failed:`, errorMsg);
        job.errors.push(`Task ${task.stringId}/${task.lang} failed: ${errorMsg}`);
      }
      
      job.progress.processed += 1;
      jobs.set(job.id, job);
      
      // Small delay before next task
      setTimeout(() => runTask(index + 1), 150);
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
