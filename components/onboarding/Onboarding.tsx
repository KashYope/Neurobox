import React, { useState } from 'react';
import { useTranslation } from '../../src/i18nContext';

import { BrandLogo, Button, Check } from '../ui';
import { saveUser } from '../../services/dataService';
import { getSupportedLanguages, loadLanguageTranslations, type SupportedLanguage } from '../../services/languageService';
import { NeuroType, type UserProfile } from '../../types';

export interface OnboardingProps {
  onComplete: (user: UserProfile) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { t, i18n } = useTranslation(['common', 'onboarding']);
  const [name, setName] = useState('');
  const [selectedNeurotypes, setSelectedNeurotypes] = useState<NeuroType[]>([]);
  const [currentLang, setCurrentLang] = useState(i18n.language);
  const languages = getSupportedLanguages();

  const handleLanguageChange = async (lang: string) => {
    try {
      await loadLanguageTranslations(lang as SupportedLanguage);
      setCurrentLang(lang);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  const toggleNeurotype = (type: NeuroType) => {
    if (selectedNeurotypes.includes(type)) {
      setSelectedNeurotypes(prev => prev.filter(t => t !== type));
    } else {
      setSelectedNeurotypes(prev => [...prev, type]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const newUser: UserProfile = {
      name,
      neurotypes: selectedNeurotypes.length > 0 ? selectedNeurotypes : [NeuroType.None],
      sensitivities: [],
      completedOnboarding: true
    };

    saveUser(newUser);
    onComplete(newUser);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="ndee-surface w-full max-w-lg rounded-[2rem] p-6 sm:p-9">
        {/* Language Selector */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {Object.entries(languages).map(([code, name]) => (
              <button
                key={code}
                onClick={() => handleLanguageChange(code)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  currentLang === code
                    ? 'bg-[var(--ndee-primary)] text-white'
                    : 'border bg-white/70 text-[var(--ndee-muted)] hover:bg-white'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8 text-center">
          <BrandLogo className="mx-auto" />
          <h1 className="mt-2 text-2xl font-bold text-[var(--ndee-ink)]">{t('onboarding:title')}</h1>
          <p className="mt-2 leading-relaxed text-[var(--ndee-muted)]">{t('onboarding:subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-[var(--ndee-ink)]">{t('onboarding:nameQuestion')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-2xl border px-4 py-3"
              placeholder={t('onboarding:namePlaceholder')}
              required
            />
          </div>

          <div>
            <label className="mb-3 block text-sm font-semibold text-[var(--ndee-ink)]">{t('onboarding:neuroProfile')}</label>
            <div className="grid grid-cols-1 gap-2">
              {Object.values(NeuroType).filter(nt => nt !== NeuroType.None).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleNeurotype(type)}
                  className={`ndee-focus flex min-h-12 items-center justify-between rounded-2xl border px-4 py-3 transition ${
                    selectedNeurotypes.includes(type)
                      ? 'border-[var(--ndee-primary)] bg-[var(--ndee-sage)] text-[var(--ndee-ink)]'
                      : 'bg-white/65 text-[var(--ndee-muted)] hover:bg-white'
                  }`}
                >
                  <span>{t(`neuroTypes.${type}`)}</span>
                  {selectedNeurotypes.includes(type) && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg">
            {t('buttons.start')}
          </Button>
        </form>
      </div>
    </div>
  );
};
