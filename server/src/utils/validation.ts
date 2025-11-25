import { z } from 'zod';
import { NeuroType, Situation, type ModerationStatus } from '../../../types.ts';

export const exercisePayloadSchema = z.object({
  id: z.string().min(3),
  title: z.string().min(3),
  description: z.string().min(10),
  situation: z.array(z.nativeEnum(Situation)).min(1),
  neurotypes: z.array(z.nativeEnum(NeuroType)).default([]),
  duration: z.string().min(1),
  steps: z.array(z.string().min(2)).min(1),
  warning: z.string().optional(),
  imageUrl: z.string().min(4),
  tags: z.array(z.string().min(1)).default([]),
  thanksCount: z.number().int().nonnegative().optional(),
  isCommunitySubmitted: z.boolean().optional(),
  isPartnerContent: z.boolean().optional(),
  author: z.string().optional()
});

export const moderationSchema = z.object({
  status: z.union([
    z.literal('approved'),
    z.literal('pending'),
    z.literal('rejected')
  ]) satisfies z.ZodType<ModerationStatus>,
  notes: z.string().optional(),
  shouldDelete: z.boolean().optional()
});

export type ExercisePayload = z.infer<typeof exercisePayloadSchema>;
export type ModerationPayload = z.infer<typeof moderationSchema>;

// Exercise string validation schemas
export const exerciseStringSchema = z.object({
  id: z.string().min(3),
  context: z.string().optional(),
  sourceText: z.string().min(1),
  sourceLang: z.string().length(2).default('fr')
});

// Supported languages for exercise string translations (including French as a target)
const exerciseLangEnum = z.enum(['fr', 'en', 'de', 'es', 'nl']);

export const exerciseStringTranslationSchema = z.object({
  stringId: z.string().min(3),
  lang: exerciseLangEnum,
  translatedText: z.string().min(1),
  translationMethod: z.enum(['manual', 'google_api', 'deepl', 'source']).default('manual')
});

export const bulkStringImportSchema = z.object({
  strings: z.array(exerciseStringSchema).min(1),
  translations: z.array(exerciseStringTranslationSchema).optional()
});

export const batchTranslationSchema = z.object({
  targetLangs: z.array(exerciseLangEnum).min(1),
  perimeter: z.string().optional(),
  stringIds: z.array(z.string().min(1)).optional(),
  force: z.boolean().optional()
});

export type ExerciseStringPayload = z.infer<typeof exerciseStringSchema>;
export type ExerciseStringTranslationPayload = z.infer<typeof exerciseStringTranslationSchema>;
export type BulkStringImportPayload = z.infer<typeof bulkStringImportSchema>;
export type BatchTranslationPayload = z.infer<typeof batchTranslationSchema>;
