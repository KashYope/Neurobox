import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Copyright, Mail } from '../../components/ui';
export const BuyMeACoffeeButton = ({ onSupport }) => {
    const { t } = useTranslation(['common']);
    // Simple obfuscation to prevent simple scraping
    const emailParts = ['cestmoikash', '+neuro', '@', 'gmail.com'];
    const email = emailParts.join('');
    return (_jsxs("div", { className: "space-y-3", children: [_jsx("a", { href: "https://buymeacoffee.com/k42h", target: "_blank", rel: "noopener noreferrer", className: "flex items-center justify-center gap-2 w-full bg-[#FFDD00] text-black font-bold py-3 rounded-xl hover:bg-[#FFEA00] transition-colors shadow-sm", onClick: onSupport, children: _jsx("span", { children: t('adminMenu.buyCoffee') }) }), _jsxs("a", { href: `mailto:${email}`, className: "flex items-center justify-center gap-2 w-full bg-slate-100 text-slate-600 font-medium py-2 rounded-xl hover:bg-slate-200 transition-colors", onClick: onSupport, children: [_jsx(Mail, { className: "w-4 h-4" }), _jsx("span", { children: t('adminMenu.feedback') })] }), _jsxs("div", { className: "flex items-center justify-center gap-1.5 text-xs text-slate-400 pt-2", children: [_jsx(Copyright, { className: "w-3 h-3 scale-x-[-1] inline-block" }), _jsx("span", { children: t('adminMenu.openSource') })] })] }));
};
