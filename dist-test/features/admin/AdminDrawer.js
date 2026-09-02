import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useRef } from 'react';
import { useTranslation } from '../../src/i18nContext.js';
import { LanguageSelector } from '../../components/language/LanguageSelector.js';
import { Building2, Button, Plus, X } from '../../components/ui/index.js';
import { BuyMeACoffeeButton } from './BuyMeACoffeeButton.js';
export const AdminDrawer = ({ isOpen, onClose, onAddTechnique, onPartnerAccess, syncStatus, showSyncStatus, partnerSession }) => {
    const { t } = useTranslation(['common']);
    const drawerRef = useRef(null);
    const closeButtonRef = useRef(null);
    useEffect(() => {
        if (!isOpen)
            return;
        const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        closeButtonRef.current?.focus();
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
            else if (event.key === 'Tab') {
                const focusable = drawerRef.current?.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
                if (!focusable?.length)
                    return;
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                }
                else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            previouslyFocused?.focus();
        };
    }, [isOpen, onClose]);
    if (!isOpen)
        return null;
    return (_jsxs("div", { className: "fixed inset-0 z-40 flex", "aria-modal": "true", role: "dialog", children: [_jsx("div", { className: "flex-1 bg-slate-900/40 backdrop-blur-sm", onClick: onClose }), _jsxs("div", { id: "admin-menu", ref: drawerRef, className: "w-full max-w-xs bg-white h-full shadow-2xl border-l border-slate-100 flex flex-col", children: [_jsxs("div", { className: "p-4 border-b border-slate-100 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs uppercase tracking-widest text-slate-400", children: t('adminMenu.adminSpace') }), _jsx("h2", { className: "text-lg font-semibold text-slate-900", children: t('adminMenu.quickActions') })] }), _jsx("button", { ref: closeButtonRef, type: "button", onClick: onClose, className: "w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50", "aria-label": t('buttons.close'), children: _jsx(X, { className: "w-4 h-4" }) })] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-4 space-y-5", children: [_jsxs(Button, { variant: "primary", className: "w-full justify-center gap-2", onClick: onAddTechnique, children: [_jsx(Plus, { className: "w-4 h-4" }), t('adminMenu.addTechnique')] }), _jsx(LanguageSelector, {}), showSyncStatus && (_jsx("div", { className: "rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600", role: "status", "aria-live": "polite", children: syncStatus.lastError
                                    ? syncStatus.lastError
                                    : !syncStatus.isOnline
                                        ? t('adminMenu.offlineMode')
                                        : syncStatus.isSyncing
                                            ? t('adminMenu.syncing')
                                            : t('adminMenu.pendingChanges', { count: syncStatus.pendingMutations }) })), _jsxs("div", { className: "bg-white border border-slate-200 rounded-xl p-4 space-y-3", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-slate-500", children: t('adminMenu.adminSpace') }), _jsx("p", { className: "text-xs text-slate-500", children: t('adminMenu.partnerAccessDescription') }), _jsxs(Button, { variant: "outline", className: "w-full justify-center", onClick: onPartnerAccess, children: [_jsx(Building2, { className: "w-4 h-4 mr-2" }), partnerSession ? t('adminMenu.myWorkspace') : t('adminMenu.partnerLogin')] })] }), _jsx("div", { className: "bg-white border border-slate-200 rounded-xl p-4", children: _jsx(BuyMeACoffeeButton, { onSupport: onClose }) })] })] })] }));
};
