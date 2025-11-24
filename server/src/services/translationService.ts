import { env } from '../env.js';

const GOOGLE_TRANSLATE_API_URL = 'https://translation.googleapis.com/language/translate/v2';

interface GoogleTranslateResponse {
  data: {
    translations: Array<{
      translatedText: string;
      detectedSourceLanguage?: string;
    }>;
  };
}

interface TranslationResult {
  translatedText: string;
  error?: string;
}

class ServerTranslationService {
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000;

  /**
   * Translate a single text using Google Cloud Translation API
   */
  async translate(
    text: string,
    sourceLang: string,
    targetLang: string
  ): Promise<TranslationResult> {
    if (!env.googleTranslateApiKey) {
      return {
        translatedText: text,
        error: 'Google Translate API key not configured'
      };
    }

    if (!text || text.trim().length === 0) {
      return { translatedText: text };
    }

    if (sourceLang === targetLang) {
      return { translatedText: text };
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const url = new URL(GOOGLE_TRANSLATE_API_URL);
        url.searchParams.append('key', env.googleTranslateApiKey);
        url.searchParams.append('q', text);
        url.searchParams.append('source', sourceLang);
        url.searchParams.append('target', targetLang);
        url.searchParams.append('format', 'text');

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

        const data: GoogleTranslateResponse = await response.json();
        const translatedText = data.data.translations[0].translatedText;

        console.log(`[TranslationService] Successfully translated to ${targetLang} (attempt ${attempt})`);
        return { translatedText };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`[TranslationService] Translation attempt ${attempt} failed:`, lastError.message);

        if (attempt < this.MAX_RETRIES) {
          await this.delay(this.RETRY_DELAY_MS * attempt);
        }
      }
    }

    // All retries failed
    return {
      translatedText: text,
      error: lastError?.message || 'Translation failed after retries'
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const translationService = new ServerTranslationService();
