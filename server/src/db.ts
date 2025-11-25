import { Pool } from 'pg';
import { env } from './env.js';

export const pool = new Pool({
  connectionString: env.databaseUrl,
  allowExitOnIdle: process.env.NODE_ENV === 'test'
});

export type ExerciseRow = {
  id: string;
  client_id: string | null;
  title: string;
  description: string;
  situation: string[];
  neurotypes: string[];
  duration: string;
  steps: string[];
  warning: string | null;
  image_url: string;
  tags: string[];
  thanks_count: number;
  is_partner_content: boolean;
  is_community_submitted: boolean;
  author: string | null;
  moderation_status: string;
  moderation_notes: string | null;
  moderated_at: Date | null;
  moderated_by: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
};

export type ModerationActionRow = {
  id: string;
  exercise_id: string;
  status: string;
  notes: string | null;
  moderator: string | null;
  created_at: Date;
};

export type ExerciseStringRow = {
  id: string;
  context: string | null;
  source_text: string;
  source_lang: string;
  created_at: Date;
  updated_at: Date;
};

export type ExerciseTranslationRow = {
  string_id: string;
  lang: string;
  translated_text: string;
  translation_method: string;
  translated_at: Date;
  updated_at: Date;
};

export const withClient = async <T>(fn: (client: Pool) => Promise<T>): Promise<T> => {
  return fn(pool);
};
