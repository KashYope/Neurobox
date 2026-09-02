import i18n from 'i18next';
import HttpBackend from 'i18next-http-backend';
export const SUPPORTED_LANGUAGES = {
    fr: 'Français',
    en: 'English',
    de: 'Deutsch',
    es: 'Español',
    nl: 'Nederlands'
};
const getInitialLanguage = () => {
    if (typeof localStorage === 'undefined')
        return 'fr';
    try {
        const stored = localStorage.getItem('neurobox_user_language');
        if (stored && stored in SUPPORTED_LANGUAGES)
            return stored;
    }
    catch {
        // Storage can be unavailable in private browsing; browser language remains a safe fallback.
    }
    const browserLanguage = typeof navigator === 'undefined' ? '' : navigator.language.split('-')[0];
    return browserLanguage in SUPPORTED_LANGUAGES ? browserLanguage : 'fr';
};
// React subscribes through the custom context in i18nContext.tsx.
i18n
    .use(HttpBackend)
    .init({
    lng: getInitialLanguage(),
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
});
export default i18n;
