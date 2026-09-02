import { Exercise, UserProfile, NeuroType, Situation, ModerationStatus, RecommendationProfile, SupportNeed } from '../types';
import { INITIAL_EXERCISES, THANKS_VISIBILITY_THRESHOLD } from '../constants';
import { syncService } from './syncService';
import {
  AttachmentData,
  attachmentKeyForExerciseImage,
  getInitialSnapshot,
  readAttachment,
  removeAttachment,
  saveAttachment
} from './storage/offlineDb';

const { adapter: storageAdapter, user: initialUser } = await getInitialSnapshot();
let userCache: UserProfile | null = initialUser;

export const saveUser = (user: UserProfile): void => {
  userCache = user;
  void storageAdapter.saveUser(user);
};

export const getUser = (): UserProfile | null => userCache;

export const clearUser = (): void => {
  userCache = null;
  void storageAdapter.saveUser(null);
};

const filterDeleted = (list: Exercise[]): Exercise[] => list.filter(ex => !ex.deletedAt);

export const getExercises = (): Exercise[] => {
  const cache = syncService.getCachedExercises();
  if (cache.length === 0) {
    return filterDeleted(INITIAL_EXERCISES);
  }
  return filterDeleted(cache);
};

export const saveExercise = (exercise: Exercise): Promise<void> => {
  return syncService.createExercise(exercise);
};

export const incrementThanks = (exerciseId: string): Promise<boolean> => {
  return syncService.incrementThanks(exerciseId);
};

// The Recommendation Algorithm
export const getRecommendedExercises = (
  exercises: Exercise[],
  user: UserProfile | null,
  situation: Situation | 'All',
  recommendationProfile: RecommendationProfile | null = null
): Exercise[] => {
  let list = filterDeleted(exercises);

  // Hide exercises waiting for review or rejected for the public catalog
  list = list.filter(ex => (ex.moderationStatus ?? 'approved') === 'approved');

  // 1. Filter by Situation
  if (situation !== 'All') {
    list = list.filter(ex => ex.situation.includes(situation));
  }

  // 2. Use transparent buckets: profile relevance, then established verified feedback.
  const profileMatches = (exercise: Exercise): number =>
    user ? exercise.neurotypes.filter(type => user.neurotypes.includes(type)).length : 0;
  const visibleThanks = (exercise: Exercise): number =>
    exercise.thanksCount >= THANKS_VISIBILITY_THRESHOLD ? exercise.thanksCount : 0;
  const needWeight = new Map(recommendationProfile?.needs.map(item => [item.need, item.weight]) ?? []);
  const supportScore = (exercise: Exercise): number =>
    (exercise.supportNeeds ?? []).reduce((sum, need) => sum + (needWeight.get(need) ?? 0), 0);

  list = [...list].sort((left, right) => {
    const supportDifference = supportScore(right) - supportScore(left);
    if (supportDifference !== 0) return supportDifference;
    const matchDifference = profileMatches(right) - profileMatches(left);
    if (matchDifference !== 0) return matchDifference;
    const thanksDifference = visibleThanks(right) - visibleThanks(left);
    if (thanksDifference !== 0) return thanksDifference;
    return left.id.localeCompare(right.id);
  });

  return list;
};

export const getRecommendationReasons = (
  exercise: Exercise,
  recommendationProfile: RecommendationProfile | null
): SupportNeed[] => {
  if (!recommendationProfile) return [];
  const weights = new Map(recommendationProfile.needs.map(item => [item.need, item.weight]));
  return (exercise.supportNeeds ?? [])
    .filter(need => weights.has(need))
    .sort((left, right) => (weights.get(right) ?? 0) - (weights.get(left) ?? 0))
    .slice(0, 2);
};

export const moderateExercise = (
  exerciseId: string,
  status: ModerationStatus,
  options?: { moderator?: string; notes?: string; shouldDelete?: boolean }
): void => {
  void syncService.moderateExercise(exerciseId, status, options);
};

export const cacheExerciseImage = async (
  exerciseId: string,
  data: AttachmentData,
  mimeType?: string
): Promise<void> => {
  await saveAttachment(attachmentKeyForExerciseImage(exerciseId), data, mimeType);
};

export const getCachedExerciseImage = async (
  exerciseId: string
): Promise<string | undefined> => {
  const record = await readAttachment(attachmentKeyForExerciseImage(exerciseId));
  return record?.data;
};

export const clearCachedExerciseImage = async (exerciseId: string): Promise<void> => {
  await removeAttachment(attachmentKeyForExerciseImage(exerciseId));
};
