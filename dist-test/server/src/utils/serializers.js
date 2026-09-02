import { NeuroType, Situation } from '../shared/types.js';
const toEnumArray = (values, allowed) => values.filter((value) => allowed.includes(value));
const toIso = (value) => value ? value.toISOString() : undefined;
export const sanitizeImagePath = (value) => value && /^\/(?!\/)[A-Za-z0-9/_.,()'%-]+$/.test(value) ? value : undefined;
export const mapExerciseRow = (row) => {
    return {
        id: row.client_id || row.id,
        serverId: row.id,
        title: row.title,
        description: row.description,
        duration: row.duration,
        steps: row.steps,
        tags: row.tags,
        situation: toEnumArray(row.situation, Object.values(Situation)),
        neurotypes: toEnumArray(row.neurotypes, Object.values(NeuroType)),
        warning: row.warning || undefined,
        imageUrl: sanitizeImagePath(row.image_url),
        thanksCount: row.thanks_count,
        isPartnerContent: row.is_partner_content,
        isCommunitySubmitted: row.is_community_submitted,
        author: row.author || undefined,
        moderationStatus: row.moderation_status,
        moderationNotes: row.moderation_notes || undefined,
        moderatedAt: toIso(row.moderated_at),
        moderatedBy: row.moderated_by || undefined,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
        deletedAt: toIso(row.deleted_at)
    };
};
