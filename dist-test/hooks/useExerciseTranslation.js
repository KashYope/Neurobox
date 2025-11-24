import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { exerciseTranslationService } from '../services/exerciseTranslationService';
/**
 * Hook to translate exercises based on current language
 * Automatically fetches and applies translations when language changes
 */
export function useExerciseTranslation(exercises) {
    const { i18n } = useTranslation();
    const [translatedExercises, setTranslatedExercises] = useState(exercises);
    const [isTranslating, setIsTranslating] = useState(false);
    useEffect(() => {
        const currentLang = i18n.language;
        // Fetch and apply translations for the current language (including French if translations exist)
        const applyTranslations = async () => {
            setIsTranslating(true);
            try {
                const translations = await exerciseTranslationService.fetchTranslations(currentLang);
                const translated = exerciseTranslationService.translateExercises(exercises, translations);
                setTranslatedExercises(translated);
            }
            catch (error) {
                console.error('Failed to apply exercise translations:', error);
                // Fallback to original exercises
                setTranslatedExercises(exercises);
            }
            finally {
                setIsTranslating(false);
            }
        };
        applyTranslations();
    }, [i18n.language, exercises]);
    return translatedExercises;
}
