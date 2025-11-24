import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';

export const SUPPORTED_LANGUAGES = {
  fr: 'Français',
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  nl: 'Nederlands'
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

// Initialize i18next with React support and HTTP backend
i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    lng: 'fr', // Force French as default, ignore browser language
    fallbackLng: 'fr',
    supportedLngs: Object.keys(SUPPORTED_LANGUAGES),
    
    interpolation: {
      escapeValue: false
    },
    
    ns: ['common', 'onboarding', 'exercise', 'partner', 'moderation'],
    defaultNS: 'common',
    
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      requestOptions: {
        cache: 'default',
        credentials: 'same-origin',
        mode: 'cors'
      }
    },
    
    // Load all namespaces eagerly to ensure offline availability
    preload: Object.keys(SUPPORTED_LANGUAGES),
    
    // Disable language detection to prevent browser language override
    detection: {
      order: ['localStorage'],
      caches: ['localStorage'],
      lookupLocalStorage: 'neurobox_user_language'
    },
    
    react: {
      useSuspense: false,
      bindI18n: false, // Disable to prevent React 19 event system bug
      bindI18nStore: false // Disable to prevent event system bug
    }
  });

export default i18n;
