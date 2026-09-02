import { z } from 'zod';
import { NeuroType, Situation } from '../shared/types.js';
export const exercisePayloadSchema = z.object({
    id: z.string().min(3),
    title: z.string().min(3),
    description: z.string().min(10),
    situation: z.array(z.nativeEnum(Situation)).min(1),
    neurotypes: z.array(z.nativeEnum(NeuroType)).default([]),
    duration: z.string().min(1),
    steps: z.array(z.string().min(2)).min(1),
    warning: z.string().optional(),
    imageUrl: z.string().regex(/^\/(?!\/)[A-Za-z0-9/_.,()'%-]+$/, 'Image must be a same-origin path').optional(),
    tags: z.array(z.string().min(1)).default([]),
    author: z.string().optional()
}).strict();
export const thankExerciseSchema = z.object({
    eventId: z.string().uuid(),
    installationId: z.string().uuid()
}).strict();
export const moderationSchema = z.object({
    status: z.union([
        z.literal('approved'),
        z.literal('pending'),
        z.literal('rejected')
    ]),
    notes: z.string().optional(),
    shouldDelete: z.boolean().optional()
});
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
