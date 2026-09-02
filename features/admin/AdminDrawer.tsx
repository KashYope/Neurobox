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
        className="flex-1 bg-[#26332f]/35 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        id="admin-menu"
        ref={drawerRef}
        className="flex h-full w-full max-w-sm flex-col border-l bg-[var(--ndee-canvas)] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b p-5">
          <div>
            <p className="ndee-eyebrow">{t('adminMenu.adminSpace')}</p>
            <h2 className="mt-1 text-lg font-bold text-[var(--ndee-ink)]">{t('adminMenu.quickActions')}</h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="ndee-focus flex h-11 w-11 items-center justify-center rounded-full border bg-white/70 text-[var(--ndee-muted)] hover:bg-white"
            aria-label={t('buttons.close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
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
            <div className="rounded-2xl border bg-[var(--ndee-sky)] p-4 text-xs text-[var(--ndee-muted)]" role="status" aria-live="polite">
              {syncStatus.lastError
                ? syncStatus.lastError
                : !syncStatus.isOnline
                  ? t('adminMenu.offlineMode')
                  : syncStatus.isSyncing
                    ? t('adminMenu.syncing')
                    : t('adminMenu.pendingChanges', { count: syncStatus.pendingMutations })}
            </div>
          )}

          <div className="space-y-3 rounded-2xl border bg-white/65 p-4">
            <p className="ndee-eyebrow">{t('adminMenu.adminSpace')}</p>
            <p className="text-xs leading-relaxed text-[var(--ndee-muted)]">{t('adminMenu.partnerAccessDescription')}</p>
            <Button variant="outline" className="w-full justify-center" onClick={onPartnerAccess}>
              <Building2 className="w-4 h-4 mr-2" />
              {partnerSession ? t('adminMenu.myWorkspace') : t('adminMenu.partnerLogin')}
            </Button>
          </div>

          <div className="rounded-2xl border bg-white/65 p-4">
            <BuyMeACoffeeButton onSupport={onClose} />
          </div>
        </div>
      </div>
    </div>
  );
};
