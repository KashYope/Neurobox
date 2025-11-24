import { getStorageAdapter } from './storage/offlineDb';
const GOOGLE_TRANSLATE_API_URL = 'https://translation.googleapis.com/language/translate/v2';
// Get API key from environment variable or localStorage for development
const getApiKey = () => {
    if (typeof import.meta.env !== 'undefined' && import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY) {
        return import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY;
    }
    if (typeof localStorage !== 'undefined') {
        return localStorage.getItem('google_translate_api_key');
    }
    return null;
};
// Create a hash key for translation caching
const createTranslationKey = (text, sourceLang, targetLang) => {
    // Simple hash function for creating cache keys
    const str = `${sourceLang}:${targetLang}:${text}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return `trans_${Math.abs(hash).toString(36)}`;
};
class TranslationService {
    constructor() {
        this.cache = new Map();
        this.pendingTranslations = new Map();
        this.apiCallCount = 0;
        this.MAX_TEXT_LENGTH = 5000;
    }
    /**
     * Translate text using Google Cloud Translation API with aggressive caching
     */
    async translate(text, options) {
        const { sourceLang = 'fr', targetLang, format = 'text' } = options;
        // Return original text if source and target are the same
        if (sourceLang === targetLang) {
            return text;
        }
        // Check if text is empty
        if (!text || text.trim().length === 0) {
            return text;
        }
        // Check text length limit
        if (text.length > this.MAX_TEXT_LENGTH) {
            console.warn(`Text exceeds maximum length (${this.MAX_TEXT_LENGTH} characters). Truncating...`);
            text = text.substring(0, this.MAX_TEXT_LENGTH);
        }
        const cacheKey = createTranslationKey(text, sourceLang, targetLang);
        // Check memory cache first
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        // Check if translation is already pending
        if (this.pendingTranslations.has(cacheKey)) {
            return this.pendingTranslations.get(cacheKey);
        }
        // Check IndexedDB cache
        try {
            const adapter = await getStorageAdapter();
            const cachedTranslation = await adapter.getTranslation(cacheKey);
            if (cachedTranslation) {
                this.cache.set(cacheKey, cachedTranslation.translatedText);
                return cachedTranslation.translatedText;
            }
        }
        catch (error) {
            console.warn('Failed to read from translation cache:', error);
        }
        // Perform translation
        const translationPromise = this.performTranslation(text, sourceLang, targetLang, format, cacheKey);
        this.pendingTranslations.set(cacheKey, translationPromise);
        try {
            const result = await translationPromise;
            return result;
        }
        finally {
            this.pendingTranslations.delete(cacheKey);
        }
    }
    async performTranslation(text, sourceLang, targetLang, format, cacheKey) {
        const apiKey = getApiKey();
        if (!apiKey) {
            console.warn('Google Translate API key not configured. Returning original text.');
            return text;
        }
        try {
            this.apiCallCount++;
            const url = new URL(GOOGLE_TRANSLATE_API_URL);
            url.searchParams.append('key', apiKey);
            url.searchParams.append('q', text);
            url.searchParams.append('source', sourceLang);
            url.searchParams.append('target', targetLang);
            url.searchParams.append('format', format);
            const response = await fetch(url.toString(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Translation API error: ${response.status} - ${errorText}`);
            }
            const data = await response.json();
            const translatedText = data.data.translations[0].translatedText;
            // Cache the translation
            this.cache.set(cacheKey, translatedText);
            try {
                const adapter = await getStorageAdapter();
                const record = {
                    key: cacheKey,
                    sourceText: text,
                    sourceLang,
                    targetLang,
                    translatedText,
                    createdAt: new Date().toISOString()
                };
                await adapter.saveTranslation(record);
            }
            catch (error) {
                console.warn('Failed to cache translation:', error);
            }
            return translatedText;
        }
        catch (error) {
            console.error('Translation failed:', error);
            // Return original text as fallback
            return text;
        }
    }
    /**
     * Batch translate multiple texts
     */
    async translateBatch(texts, options) {
        // Translate texts in parallel
        const translations = await Promise.all(texts.map(text => this.translate(text, options)));
        return translations;
    }
    /**
     * Translate exercise content (title, description, steps, warning)
     */
    async translateExerciseContent(content, targetLang, sourceLang = 'fr') {
        const [title, description, steps, warning] = await Promise.all([
            this.translate(content.title, { sourceLang, targetLang }),
            this.translate(content.description, { sourceLang, targetLang }),
            this.translateBatch(content.steps, { sourceLang, targetLang }),
            content.warning
                ? this.translate(content.warning, { sourceLang, targetLang })
                : Promise.resolve(undefined)
        ]);
        return { title, description, steps, warning };
    }
    /**
     * Get translation statistics
     */
    getStats() {
        return {
            cacheSize: this.cache.size,
            apiCallCount: this.apiCallCount,
            pendingTranslations: this.pendingTranslations.size
        };
    }
    /**
     * Clear memory cache (IndexedDB cache persists)
     */
    clearMemoryCache() {
        this.cache.clear();
    }
}
// Export singleton instance
export const translationService = new TranslationService();
// Helper function to set API key (for development/testing)
export const setGoogleTranslateApiKey = (apiKey) => {
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('google_translate_api_key', apiKey);
    }
};
