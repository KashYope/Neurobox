import { Exercise, UserProfile, NeuroType, Situation } from '../types';
import { INITIAL_EXERCISES } from '../constants';

const STORAGE_KEYS = {
  USER: 'neurosooth_user',
  EXERCISES: 'neurosooth_exercises',
};

export const saveUser = (user: UserProfile): void => {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
};

export const getUser = (): UserProfile | null => {
  const data = localStorage.getItem(STORAGE_KEYS.USER);
  return data ? JSON.parse(data) : null;
};

export const getExercises = (): Exercise[] => {
  const data = localStorage.getItem(STORAGE_KEYS.EXERCISES);
  if (!data) {
    // Initialize with defaults if empty
    localStorage.setItem(STORAGE_KEYS.EXERCISES, JSON.stringify(INITIAL_EXERCISES));
    return INITIAL_EXERCISES;
  }
  return JSON.parse(data);
};

export const saveExercise = (exercise: Exercise): void => {
  const current = getExercises();
  const updated = [...current, exercise];
  localStorage.setItem(STORAGE_KEYS.EXERCISES, JSON.stringify(updated));
};

export const incrementThanks = (exerciseId: string): void => {
  const current = getExercises();
  const updated = current.map(ex => 
    ex.id === exerciseId ? { ...ex, thanksCount: ex.thanksCount + 1 } : ex
  );
  localStorage.setItem(STORAGE_KEYS.EXERCISES, JSON.stringify(updated));
};

// The Recommendation Algorithm
export const getRecommendedExercises = (
  user: UserProfile | null, 
  situation: Situation | 'All'
): Exercise[] => {
  let exercises = getExercises();

  // 1. Filter by Situation
  if (situation !== 'All') {
    exercises = exercises.filter(ex => ex.situation.includes(situation));
  }

  // 2. Score based on User Profile (Neurotype match) and Community Thanks
  if (user) {
    interface ScoredExercise extends Exercise {
      _tempScore: number;
    }

    exercises = exercises.map(ex => {
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
    exercises.sort((a, b) => b.thanksCount - a.thanksCount);
  }

  return exercises;
};