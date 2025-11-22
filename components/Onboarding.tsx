import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Brain, Check } from 'lucide-react';
import { Button } from './Button';
import { NeuroType, UserProfile } from '../types';
import { loadLanguageTranslations, getSupportedLanguages, SupportedLanguage } from '../services/languageService';
import { saveUser } from '../services/dataService';

export const Onboarding: React.FC<{ onComplete: (user: UserProfile) => void }> = ({ onComplete }) => {
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Language Selector */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {Object.entries(languages).map(([code, name]) => (
              <button
                key={code}
                onClick={() => handleLanguageChange(code)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  currentLang === code
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <div className="text-center mb-8">
          <div className="mx-auto bg-teal-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Brain className="w-8 h-8 text-teal-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{t('onboarding:title')}</h1>
          <p className="text-slate-600 mt-2">{t('onboarding:subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('onboarding:nameQuestion')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              placeholder={t('onboarding:namePlaceholder')}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">{t('onboarding:neuroProfile')}</label>
            <div className="grid grid-cols-1 gap-2">
              {Object.values(NeuroType).filter(nt => nt !== NeuroType.None).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleNeurotype(type)}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${
                    selectedNeurotypes.includes(type)
                      ? 'border-teal-500 bg-teal-50 text-teal-800'
                      : 'border-gray-200 hover:bg-gray-50 text-slate-600'
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
