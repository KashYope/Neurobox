import React from 'react';
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { getSupportedLanguages, loadLanguageTranslations, type SupportedLanguage } from '../../services/languageService';

export interface LanguageSelectorProps {}

export const LanguageSelector: React.FC<LanguageSelectorProps> = () => {
  const { t, i18n } = useTranslation(['common']);
  const currentLang = i18n.language;
  const languages = getSupportedLanguages();

  const changeLanguage = async (lang: string) => {
    try {
      await loadLanguageTranslations(lang as SupportedLanguage);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
        <Globe className="w-4 h-4" />
        <span>{t('languageSelector.label')}</span>
      </div>
      <div className="space-y-1">
        {Object.entries(languages).map(([code, name]) => (
          <button
            key={code}
            onClick={() => changeLanguage(code)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              currentLang === code
                ? 'bg-teal-50 text-teal-700 font-medium border border-teal-200'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
};
