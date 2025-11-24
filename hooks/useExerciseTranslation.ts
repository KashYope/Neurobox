import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Exercise } from '../types';
import { exerciseTranslationService } from '../services/exerciseTranslationService';

/**
 * Hook to translate exercises based on current language
 * Automatically fetches and applies translations when language changes
 */
export function useExerciseTranslation(exercises: Exercise[]): Exercise[] {
  const { i18n } = useTranslation();
  const [translatedExercises, setTranslatedExercises] = useState<Exercise[]>(exercises);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    const currentLang = i18n.language;
    
    // If French (source language), return original exercises
    if (currentLang === 'fr') {
      setTranslatedExercises(exercises);
      return;
    }

    // Fetch and apply translations for other languages
    const applyTranslations = async () => {
      setIsTranslating(true);
      try {
        const translations = await exerciseTranslationService.fetchTranslations(currentLang);
        const translated = exerciseTranslationService.translateExercises(exercises, translations);
        setTranslatedExercises(translated);
      } catch (error) {
        console.error('Failed to apply exercise translations:', error);
        // Fallback to original exercises
        setTranslatedExercises(exercises);
      } finally {
        setIsTranslating(false);
      }
    };

    applyTranslations();
  }, [i18n.language, exercises]);

  return translatedExercises;
}
