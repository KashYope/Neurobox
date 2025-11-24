import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '../../components/language/LanguageSelector';
import { Building2, Button, Plus, X } from '../../components/ui';
import { BuyMeACoffeeButton } from './BuyMeACoffeeButton';
export const AdminDrawer = ({ isOpen, onClose, onAddTechnique, onPartnerAccess, syncStatus, showSyncStatus, partnerSession }) => {
    const { t } = useTranslation(['common']);
    useEffect(() => {
        if (!isOpen)
            return;
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);
    if (!isOpen)
        return null;
    return (_jsxs("div", { className: "fixed inset-0 z-40 flex", "aria-modal": "true", role: "dialog", children: [_jsx("div", { className: "flex-1 bg-slate-900/40 backdrop-blur-sm", onClick: onClose }), _jsxs("div", { id: "admin-menu", className: "w-full max-w-xs bg-white h-full shadow-2xl border-l border-slate-100 flex flex-col", children: [_jsxs("div", { className: "p-4 border-b border-slate-100 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs uppercase tracking-widest text-slate-400", children: t('adminMenu.adminSpace') }), _jsx("h2", { className: "text-lg font-semibold text-slate-900", children: t('adminMenu.quickActions') })] }), _jsx("button", { type: "button", onClick: onClose, className: "w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50", "aria-label": t('buttons.close'), children: _jsx(X, { className: "w-4 h-4" }) })] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-4 space-y-5", children: [_jsxs(Button, { variant: "primary", className: "w-full justify-center gap-2", onClick: onAddTechnique, children: [_jsx(Plus, { className: "w-4 h-4" }), t('adminMenu.addTechnique')] }), _jsx(LanguageSelector, {}), _jsxs("div", { className: "bg-white border border-slate-200 rounded-xl p-4 space-y-3", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-slate-500", children: t('adminMenu.adminSpace') }), _jsx("p", { className: "text-xs text-slate-500", children: "Access partner portal and administration." }), _jsxs(Button, { variant: "outline", className: "w-full justify-center", onClick: onPartnerAccess, children: [_jsx(Building2, { className: "w-4 h-4 mr-2" }), partnerSession ? 'My Workspace' : 'Partner / Admin Login'] })] }), _jsx("div", { className: "bg-white border border-slate-200 rounded-xl p-4", children: _jsx(BuyMeACoffeeButton, { onSupport: onClose }) })] })] })] }));
};
