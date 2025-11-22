/**
 * Content Resolver Service
 * Resolves exercise string IDs to localized text based on user's language preference
 */

import { Exercise } from '../types';
import { getStorageAdapter, ExerciseStringTranslationRecord } from './storage/offlineDb';
import { getUserLanguage } from './languageService';

interface TranslationCache {
  [stringId: string]: string;
}

class ContentResolver {
  private cache: Map<string, TranslationCache> = new Map(); // lang -> stringId -> text
  private initialized = false;

  /**
   * Resolve an exercise's string IDs to localized text
   */
  async resolveExercise(exercise: Exercise, targetLang?: string): Promise<Exercise> {
    const lang = targetLang || getUserLanguage();

    // If exercise doesn't use string IDs, return as-is (backward compatibility)
    if (!exercise.titleStringId && !exercise.descriptionStringId && !exercise.stepsStringIds) {
      return exercise;
    }

    // If language is French (source language), use the legacy content fields
    if (lang === 'fr') {
      return exercise;
    }

    // Ensure cache is loaded for this language
    await this.ensureLanguageLoaded(lang);

    const langCache = this.cache.get(lang) || {};

    // Resolve title
    const title = exercise.titleStringId && langCache[exercise.titleStringId]
      ? langCache[exercise.titleStringId]
      : exercise.title;

    // Resolve description
    const description = exercise.descriptionStringId && langCache[exercise.descriptionStringId]
      ? langCache[exercise.descriptionStringId]
      : exercise.description;

    // Resolve steps
    const steps = exercise.stepsStringIds && exercise.stepsStringIds.length > 0
      ? exercise.stepsStringIds.map((stringId, idx) => 
          langCache[stringId] || exercise.steps[idx] || ''
        ).filter(step => step)
      : exercise.steps;

    // Resolve warning
    const warning = exercise.warningStringId && langCache[exercise.warningStringId]
      ? langCache[exercise.warningStringId]
      : exercise.warning;

    return {
      ...exercise,
      title,
      description,
      steps,
      warning
    };
  }

  /**
   * Resolve multiple exercises at once
   */
  async resolveExercises(exercises: Exercise[], targetLang?: string): Promise<Exercise[]> {
    return Promise.all(exercises.map(ex => this.resolveExercise(ex, targetLang)));
  }

  /**
   * Ensure translations for a language are loaded into cache
   */
  private async ensureLanguageLoaded(lang: string): Promise<void> {
    if (this.cache.has(lang)) {
      return; // Already loaded
    }

    try {
      const adapter = await getStorageAdapter();
      const translations = await adapter.getExerciseStringTranslations(lang);

      const langCache: TranslationCache = {};
      for (const translation of translations) {
        langCache[translation.stringId] = translation.translatedText;
      }

      this.cache.set(lang, langCache);
    } catch (error) {
      console.warn(`Failed to load translations for language ${lang}:`, error);
      // Set empty cache to avoid repeated failures
      this.cache.set(lang, {});
    }
  }

  /**
   * Get a single translation by string ID
   */
  async getTranslation(stringId: string, targetLang?: string): Promise<string | undefined> {
    const lang = targetLang || getUserLanguage();

    if (lang === 'fr') {
      return undefined; // No translation needed for source language
    }

    await this.ensureLanguageLoaded(lang);
    const langCache = this.cache.get(lang);
    return langCache?.[stringId];
  }

  /**
   * Update cache with new translations (after sync or API fetch)
   */
  async updateTranslations(translations: ExerciseStringTranslationRecord[]): Promise<void> {
    for (const translation of translations) {
      let langCache = this.cache.get(translation.lang);
      if (!langCache) {
        langCache = {};
        this.cache.set(translation.lang, langCache);
      }
      langCache[translation.stringId] = translation.translatedText;
    }
  }

  /**
   * Clear cache for a specific language or all languages
   */
  clearCache(lang?: string): void {
    if (lang) {
      this.cache.delete(lang);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Preload translations for a specific language
   */
  async preloadLanguage(lang: string): Promise<void> {
    await this.ensureLanguageLoaded(lang);
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const stats: { [lang: string]: number } = {};
    for (const [lang, cache] of this.cache.entries()) {
      stats[lang] = Object.keys(cache).length;
    }
    return stats;
  }
}

// Export singleton instance
export const contentResolver = new ContentResolver();

// Helper function for quick resolution
export const resolveExercise = (exercise: Exercise, lang?: string): Promise<Exercise> => {
  return contentResolver.resolveExercise(exercise, lang);
};

export const resolveExercises = (exercises: Exercise[], lang?: string): Promise<Exercise[]> => {
  return contentResolver.resolveExercises(exercises, lang);
};
