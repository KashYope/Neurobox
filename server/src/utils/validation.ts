import { z } from 'zod';
import { NeuroType, Situation, type ModerationStatus } from '../../types.js';

export const exercisePayloadSchema = z.object({
  id: z.string().min(3),
  title: z.string().min(3),
  description: z.string().min(10),
  situation: z.array(z.nativeEnum(Situation)).min(1),
  neurotypes: z.array(z.nativeEnum(NeuroType)).min(1),
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
