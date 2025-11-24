import { apiClient } from './apiClient';
class ExerciseTranslationService {
    constructor() {
        this.translationCache = new Map();
    }
    /**
     * Fetch translations for a given language
     */
    async fetchTranslations(lang) {
        // Check cache first
        if (this.translationCache.has(lang)) {
            return this.translationCache.get(lang);
        }
        try {
            const translations = await apiClient.fetchExerciseStringTranslations(lang);
            // Convert array to map for easy lookup
            const translationMap = {};
            translations.forEach((t) => {
                translationMap[t.string_id] = t.translated_text;
            });
            this.translationCache.set(lang, translationMap);
            return translationMap;
        }
        catch (error) {
            console.error(`Failed to fetch translations for ${lang}:`, error);
            return {};
        }
    }
    /**
     * Apply translations to an exercise
     * Maps exercise.id + field to string_id format: exercise.{id}.{field}
     */
    translateExercise(exercise, translations, exerciseClientId) {
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
    translateExercises(exercises, translations) {
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
