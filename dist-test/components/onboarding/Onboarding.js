import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Brain, Button, Check } from '../ui';
import { saveUser } from '../../services/dataService';
import { getSupportedLanguages, loadLanguageTranslations } from '../../services/languageService';
import { NeuroType } from '../../types';
export const Onboarding = ({ onComplete }) => {
    const { t, i18n } = useTranslation(['common', 'onboarding']);
    const [name, setName] = useState('');
    const [selectedNeurotypes, setSelectedNeurotypes] = useState([]);
    const [currentLang, setCurrentLang] = useState(i18n.language);
    const languages = getSupportedLanguages();
    const handleLanguageChange = async (lang) => {
        try {
            await loadLanguageTranslations(lang);
            setCurrentLang(lang);
        }
        catch (error) {
            console.error('Failed to change language:', error);
        }
    };
    const toggleNeurotype = (type) => {
        if (selectedNeurotypes.includes(type)) {
            setSelectedNeurotypes(prev => prev.filter(t => t !== type));
        }
        else {
            setSelectedNeurotypes(prev => [...prev, type]);
        }
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name)
            return;
        const newUser = {
            name,
            neurotypes: selectedNeurotypes.length > 0 ? selectedNeurotypes : [NeuroType.None],
            sensitivities: [],
            completedOnboarding: true
        };
        saveUser(newUser);
        onComplete(newUser);
    };
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center p-4 bg-slate-50", children: _jsxs("div", { className: "max-w-md w-full bg-white rounded-2xl shadow-xl p-8", children: [_jsx("div", { className: "mb-6", children: _jsx("div", { className: "flex items-center justify-center gap-2 flex-wrap", children: Object.entries(languages).map(([code, name]) => (_jsx("button", { onClick: () => handleLanguageChange(code), className: `px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${currentLang === code
                                ? 'bg-teal-600 text-white shadow-md'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`, children: name }, code))) }) }), _jsxs("div", { className: "text-center mb-8", children: [_jsx("div", { className: "mx-auto bg-teal-100 w-16 h-16 rounded-full flex items-center justify-center mb-4", children: _jsx(Brain, { className: "w-8 h-8 text-teal-600" }) }), _jsx("h1", { className: "text-2xl font-bold text-slate-900", children: t('onboarding:title') }), _jsx("p", { className: "text-slate-600 mt-2", children: t('onboarding:subtitle') })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: t('onboarding:nameQuestion') }), _jsx("input", { type: "text", value: name, onChange: (e) => setName(e.target.value), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none", placeholder: t('onboarding:namePlaceholder'), required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-3", children: t('onboarding:neuroProfile') }), _jsx("div", { className: "grid grid-cols-1 gap-2", children: Object.values(NeuroType).filter(nt => nt !== NeuroType.None).map((type) => (_jsxs("button", { type: "button", onClick: () => toggleNeurotype(type), className: `flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${selectedNeurotypes.includes(type)
                                            ? 'border-teal-500 bg-teal-50 text-teal-800'
                                            : 'border-gray-200 hover:bg-gray-50 text-slate-600'}`, children: [_jsx("span", { children: t(`neuroTypes.${type}`) }), selectedNeurotypes.includes(type) && _jsx(Check, { className: "w-4 h-4" })] }, type))) })] }), _jsx(Button, { type: "submit", className: "w-full", size: "lg", children: t('buttons.start') })] })] }) }));
};
