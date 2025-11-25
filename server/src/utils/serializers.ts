import type { ExerciseRow } from '../db.js';
import type { ServerExercise } from '../../../types.ts';

const toIso = (value: Date | null | undefined): string | undefined =>
  value ? value.toISOString() : undefined;

export const mapExerciseRow = (row: ExerciseRow): ServerExercise => {
  return {
    id: row.client_id || row.id,
    serverId: row.id,
    title: row.title,
    description: row.description,
    duration: row.duration,
    steps: row.steps,
    tags: row.tags,
    situation: row.situation,
    neurotypes: row.neurotypes,
    warning: row.warning || undefined,
    imageUrl: row.image_url,
    thanksCount: row.thanks_count,
    isPartnerContent: row.is_partner_content,
    isCommunitySubmitted: row.is_community_submitted,
    author: row.author || undefined,
    moderationStatus: row.moderation_status as ServerExercise['moderationStatus'],
    moderationNotes: row.moderation_notes || undefined,
    moderatedAt: toIso(row.moderated_at),
    moderatedBy: row.moderated_by || undefined,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    deletedAt: toIso(row.deleted_at)
  };
};
