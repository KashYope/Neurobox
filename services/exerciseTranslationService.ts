import { apiClient, ExerciseStringTranslationRecord } from './apiClient';
import { Exercise } from '../types';

interface TranslationMap {
  [stringId: string]: string;
}

class ExerciseTranslationService {
  private translationCache: Map<string, TranslationMap> = new Map();

  /**
   * Fetch translations for a given language
   */
  async fetchTranslations(lang: string): Promise<TranslationMap> {
    // Check cache first
    if (this.translationCache.has(lang)) {
      return this.translationCache.get(lang)!;
    }

    try {
      const translations = await apiClient.fetchExerciseStringTranslations(lang);
      
      // Convert array to map for easy lookup
      const translationMap: TranslationMap = {};
      translations.forEach((t: ExerciseStringTranslationRecord) => {
        translationMap[t.string_id] = t.translated_text;
      });

      this.translationCache.set(lang, translationMap);
      return translationMap;
    } catch (error) {
      console.error(`Failed to fetch translations for ${lang}:`, error);
      return {};
    }
  }

  /**
   * Apply translations to an exercise
   * Maps exercise.id + field to string_id format: exercise.{id}.{field}
   */
  translateExercise(exercise: Exercise, translations: TranslationMap, exerciseClientId?: string): Exercise {
    // Use client_id from database or fall back to exercise.id
    const baseId = exerciseClientId || exercise.id;

    // Generate string IDs based on the pattern used in seed script
    const titleId = `exercise.${baseId}.title`;
    const descriptionId = `exercise.${baseId}.description`;
    const warningId = `exercise.${baseId}.warning`;

    return {
      ...exercise,
      title: translations[titleId] || exercise.title,
      description: translations[descriptionId] || exercise.description,
      steps: exercise.steps.map((step, idx) => {
        const stepId = `exercise.${baseId}.step_${idx + 1}`;
        return translations[stepId] || step;
      }),
      warning: exercise.warning && warningId in translations
        ? translations[warningId]
        : exercise.warning
    };
  }

  /**
   * Apply translations to multiple exercises
   */
  translateExercises(exercises: Exercise[], translations: TranslationMap): Exercise[] {
    return exercises.map(ex => this.translateExercise(ex, translations));
  }

  /**
   * Clear translation cache
   */
  clearCache() {
    this.translationCache.clear();
  }
}

export const exerciseTranslationService = new ExerciseTranslationService();
