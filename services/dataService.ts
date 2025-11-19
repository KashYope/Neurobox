import { Exercise, UserProfile, NeuroType, Situation, ModerationStatus } from '../types';
import { INITIAL_EXERCISES } from '../constants';
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

const filterDeleted = (list: Exercise[]): Exercise[] => list.filter(ex => !ex.deletedAt);

export const getExercises = (): Exercise[] => {
  const cache = syncService.getCachedExercises();
  if (cache.length === 0) {
    return filterDeleted(INITIAL_EXERCISES);
  }
  return filterDeleted(cache);
};

export const saveExercise = (exercise: Exercise): void => {
  syncService.createExercise(exercise);
};

export const incrementThanks = (exerciseId: string): void => {
  syncService.incrementThanks(exerciseId);
};

// The Recommendation Algorithm
export const getRecommendedExercises = (
  exercises: Exercise[],
  user: UserProfile | null,
  situation: Situation | 'All'
): Exercise[] => {
  let list = filterDeleted(exercises);

  // Hide exercises waiting for review or rejected for the public catalog
  list = list.filter(ex => (ex.moderationStatus ?? 'approved') === 'approved');

  // 1. Filter by Situation
  if (situation !== 'All') {
    list = list.filter(ex => ex.situation.includes(situation));
  }

  // 2. Score based on User Profile (Neurotype match) and Community Thanks
  if (user) {
    interface ScoredExercise extends Exercise {
      _tempScore: number;
    }

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
    .sort((a: ScoredExercise, b: ScoredExercise) => b._tempScore - a._tempScore)
    .map(({ _tempScore, ...ex }: ScoredExercise) => ex);
  } else {
    // Just sort by popularity if no user
    list.sort((a, b) => b.thanksCount - a.thanksCount);
  }

  return list;
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