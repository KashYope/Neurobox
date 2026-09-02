import { INITIAL_EXERCISES, THANKS_VISIBILITY_THRESHOLD } from '../constants.js';
import { syncService } from './syncService.js';
import { attachmentKeyForExerciseImage, getInitialSnapshot, readAttachment, removeAttachment, saveAttachment } from './storage/offlineDb.js';
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
    return syncService.createExercise(exercise);
};
export const incrementThanks = (exerciseId) => {
    return syncService.incrementThanks(exerciseId);
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
    // 2. Use transparent buckets: profile relevance, then established verified feedback.
    const profileMatches = (exercise) => user ? exercise.neurotypes.filter(type => user.neurotypes.includes(type)).length : 0;
    const visibleThanks = (exercise) => exercise.thanksCount >= THANKS_VISIBILITY_THRESHOLD ? exercise.thanksCount : 0;
    list = [...list].sort((left, right) => {
        const matchDifference = profileMatches(right) - profileMatches(left);
        if (matchDifference !== 0)
            return matchDifference;
        const thanksDifference = visibleThanks(right) - visibleThanks(left);
        if (thanksDifference !== 0)
            return thanksDifference;
        return left.id.localeCompare(right.id);
    });
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
