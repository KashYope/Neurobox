import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from '../ui';
import { getSupportedLanguages, loadLanguageTranslations } from '../../services/languageService';
export const LanguageSelector = () => {
    const { t, i18n } = useTranslation(['common']);
    const currentLang = i18n.language;
    const languages = getSupportedLanguages();
    const changeLanguage = async (lang) => {
        try {
            await loadLanguageTranslations(lang);
        }
        catch (error) {
            console.error('Failed to change language:', error);
        }
    };
    return (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500", children: [_jsx(Globe, { className: "w-4 h-4" }), _jsx("span", { children: t('languageSelector.label') })] }), _jsx("div", { className: "space-y-1", children: Object.entries(languages).map(([code, name]) => (_jsx("button", { onClick: () => changeLanguage(code), className: `w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${currentLang === code
                        ? 'bg-teal-50 text-teal-700 font-medium border border-teal-200'
                        : 'text-slate-600 hover:bg-slate-50'}`, children: name }, code))) })] }));
};
