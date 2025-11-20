import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

export const SUPPORTED_LANGUAGES = {
  fr: 'Français',
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  nl: 'Nederlands'
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'fr',
    supportedLngs: Object.keys(SUPPORTED_LANGUAGES),
    debug: false,
    
    // Lazy load - only load language when needed
    load: 'currentOnly',
    preload: [], // Don't preload any languages
    
    interpolation: {
      escapeValue: false
    },
    
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      // Cache loaded translations in memory
      requestOptions: {
        cache: 'default'
      }
    },
    
    ns: ['common', 'onboarding'],
    defaultNS: 'common',
    
    detection: {
      // Priority: 1. User selection (localStorage) 2. Browser language
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'neurobox_user_language', // Custom key for high priority
      cookieMinutes: 10080, // 7 days
      lookupQuerystring: 'lng',
      lookupSessionStorage: 'neurobox_user_language'
    },
    
    react: {
      useSuspense: true,
      // Re-render when language changes
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p']
    }
  });

export default i18n;
