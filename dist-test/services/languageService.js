/**
 * Language Service
 * Manages user language preference with high priority local storage
 * Implements lazy loading strategy - only loads selected language
 */
import i18n from '../src/i18n';
const LANGUAGE_KEY = 'neurobox_user_language';
const LANGUAGE_TIMESTAMP_KEY = 'neurobox_user_language_timestamp';
/**
 * Get user's preferred language from storage
 * Priority: localStorage > browser language > fallback (fr)
 */
export const getUserLanguage = () => {
    if (typeof window === 'undefined')
        return 'fr';
    try {
        const stored = localStorage.getItem(LANGUAGE_KEY);
        if (stored && isSupportedLanguage(stored)) {
            return stored;
        }
        // Fallback to browser language
        const browserLang = navigator.language.split('-')[0];
        if (isSupportedLanguage(browserLang)) {
            return browserLang;
        }
    }
    catch (error) {
        console.warn('Error reading language preference:', error);
    }
    return 'fr'; // Default fallback
};
/**
 * Save user's language preference with high priority
 * Stores both language and timestamp
 */
export const setUserLanguage = (language) => {
    if (typeof window === 'undefined')
        return;
    try {
        localStorage.setItem(LANGUAGE_KEY, language);
        localStorage.setItem(LANGUAGE_TIMESTAMP_KEY, new Date().toISOString());
        // Also update i18n
        i18n.changeLanguage(language);
    }
    catch (error) {
        console.error('Error saving language preference:', error);
    }
};
/**
 * Check if language code is supported
 */
export const isSupportedLanguage = (lang) => {
    return ['fr', 'en', 'de', 'es', 'nl'].includes(lang);
};
/**
 * Get when language preference was last updated
 */
export const getLanguageTimestamp = () => {
    if (typeof window === 'undefined')
        return null;
    try {
        const timestamp = localStorage.getItem(LANGUAGE_TIMESTAMP_KEY);
        return timestamp ? new Date(timestamp) : null;
    }
    catch {
        return null;
    }
};
/**
 * Load language translations on-demand
 * Only fetches translations when user switches language
 */
export const loadLanguageTranslations = async (language) => {
    try {
        // i18next will handle the lazy loading via HttpBackend
        await i18n.changeLanguage(language);
        setUserLanguage(language);
    }
    catch (error) {
        console.error(`Failed to load ${language} translations:`, error);
        throw error;
    }
};
/**
 * Preload user's preferred language (called on app init)
 */
export const preloadUserLanguage = async () => {
    const userLang = getUserLanguage();
    if (userLang !== i18n.language) {
        await loadLanguageTranslations(userLang);
    }
};
/**
 * Get all supported languages with their native names
 */
export const getSupportedLanguages = () => ({
    fr: 'Français',
    en: 'English',
    de: 'Deutsch',
    es: 'Español',
    nl: 'Nederlands'
});
/**
 * Clear language preference (useful for testing)
 */
export const clearLanguagePreference = () => {
    if (typeof window === 'undefined')
        return;
    try {
        localStorage.removeItem(LANGUAGE_KEY);
        localStorage.removeItem(LANGUAGE_TIMESTAMP_KEY);
    }
    catch (error) {
        console.warn('Error clearing language preference:', error);
    }
};
