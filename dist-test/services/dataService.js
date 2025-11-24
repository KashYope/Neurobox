import { NeuroType } from '../types';
import { INITIAL_EXERCISES } from '../constants';
import { syncService } from './syncService';
import { contentResolver } from './contentResolver';
import { attachmentKeyForExerciseImage, getInitialSnapshot, readAttachment, removeAttachment, saveAttachment } from './storage/offlineDb';
const { adapter: storageAdapter, user: initialUser } = await getInitialSnapshot();
let userCache = initialUser;
export const saveUser = (user) => {
    userCache = user;
    void storageAdapter.saveUser(user);
};
export const getUser = () => userCache;
const filterDeleted = (list) => list.filter(ex => !ex.deletedAt);
export const getExercises = () => {
    const cache = syncService.getCachedExercises();
    if (cache.length === 0) {
        return filterDeleted(INITIAL_EXERCISES);
    }
    return filterDeleted(cache);
};
export const saveExercise = (exercise) => {
    syncService.createExercise(exercise);
};
export const incrementThanks = (exerciseId) => {
    syncService.incrementThanks(exerciseId);
};
// The Recommendation Algorithm
export const getRecommendedExercises = (exercises, user, situation) => {
    let list = filterDeleted(exercises);
    // Hide exercises waiting for review or rejected for the public catalog
    list = list.filter(ex => (ex.moderationStatus ?? 'approved') === 'approved');
    // 1. Filter by Situation
    if (situation !== 'All') {
        list = list.filter(ex => ex.situation.includes(situation));
    }
    // 2. Score based on User Profile (Neurotype match) and Community Thanks
    if (user) {
        list = list.map(ex => {
            let score = ex.thanksCount; // Base score is popularity
            // Boost if neurotype matches
            const hasMatchingNeurotype = ex.neurotypes.some(nt => user.neurotypes.includes(nt));
            if (hasMatchingNeurotype) {
                score += 50; // Significant boost for profile match
            }
            // Boost specifically for Trauma/ASD if somatic (simplified logic)
            if ((user.neurotypes.includes(NeuroType.Trauma) || user.neurotypes.includes(NeuroType.ASD)) &&
                (ex.tags.includes('Proprioception') || ex.tags.includes('Vagal'))) {
                score += 20;
            }
            return { ...ex, _tempScore: score };
        })
            .sort((a, b) => b._tempScore - a._tempScore)
            .map(({ _tempScore, ...ex }) => ex);
    }
    else {
        // Just sort by popularity if no user
        list.sort((a, b) => b.thanksCount - a.thanksCount);
    }
    return list;
};
export const moderateExercise = (exerciseId, status, options) => {
    void syncService.moderateExercise(exerciseId, status, options);
};
export const cacheExerciseImage = async (exerciseId, data, mimeType) => {
    await saveAttachment(attachmentKeyForExerciseImage(exerciseId), data, mimeType);
};
export const getCachedExerciseImage = async (exerciseId) => {
    const record = await readAttachment(attachmentKeyForExerciseImage(exerciseId));
    return record?.data;
};
export const clearCachedExerciseImage = async (exerciseId) => {
    await removeAttachment(attachmentKeyForExerciseImage(exerciseId));
};
/**
 * Get exercises with content resolved to the current user's language
 * This applies translation if string IDs are present
 */
export const getResolvedExercises = async (lang) => {
    const exercises = getExercises();
    return contentResolver.resolveExercises(exercises, lang);
};
/**
 * Get recommended exercises with content resolved to the current user's language
 */
export const getResolvedRecommendedExercises = async (exercises, user, situation, lang) => {
    const recommended = getRecommendedExercises(exercises, user, situation);
    return contentResolver.resolveExercises(recommended, lang);
};
