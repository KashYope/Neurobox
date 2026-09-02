import React, { useEffect, useRef } from 'react';
import { useTranslation } from '../../src/i18nContext';

import { LanguageSelector } from '../../components/language/LanguageSelector';
import { Building2, Button, Plus, X } from '../../components/ui';
import { BuyMeACoffeeButton } from './BuyMeACoffeeButton';
import { SyncStatus } from '../../services/syncService';
import { PartnerAccount } from '../../types';

export interface AdminDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTechnique: () => void;
  onPartnerAccess: () => void;
  syncStatus: SyncStatus;
  showSyncStatus: boolean;
  partnerSession: PartnerAccount | null;
}

export const AdminDrawer: React.FC<AdminDrawerProps> = ({
  isOpen,
  onClose,
  onAddTechnique,
  onPartnerAccess,
  syncStatus,
  showSyncStatus,
  partnerSession
}) => {
  const { t } = useTranslation(['common']);
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'Tab') {
        const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex" aria-modal="true" role="dialog">
      <div
        className="flex-1 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        id="admin-menu"
        ref={drawerRef}
        className="w-full max-w-xs bg-white h-full shadow-2xl border-l border-slate-100 flex flex-col"
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400">{t('adminMenu.adminSpace')}</p>
            <h2 className="text-lg font-semibold text-slate-900">{t('adminMenu.quickActions')}</h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            aria-label={t('buttons.close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          <Button
            variant="primary"
            className="w-full justify-center gap-2"
            onClick={onAddTechnique}
          >
            <Plus className="w-4 h-4" />
            {t('adminMenu.addTechnique')}
          </Button>

          <LanguageSelector />

          {showSyncStatus && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600" role="status" aria-live="polite">
              {syncStatus.lastError
                ? syncStatus.lastError
                : !syncStatus.isOnline
                  ? t('adminMenu.offlineMode')
                  : syncStatus.isSyncing
                    ? t('adminMenu.syncing')
                    : t('adminMenu.pendingChanges', { count: syncStatus.pendingMutations })}
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t('adminMenu.adminSpace')}</p>
            <p className="text-xs text-slate-500">{t('adminMenu.partnerAccessDescription')}</p>
            <Button variant="outline" className="w-full justify-center" onClick={onPartnerAccess}>
              <Building2 className="w-4 h-4 mr-2" />
              {partnerSession ? t('adminMenu.myWorkspace') : t('adminMenu.partnerLogin')}
            </Button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <BuyMeACoffeeButton onSupport={onClose} />
          </div>
        </div>
      </div>
    </div>
  );
};
