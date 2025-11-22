import React, { useEffect } from 'react';
import { Building2, CheckCircle2, Plus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { LanguageSelector } from '../../components/language/LanguageSelector';
import { Button } from '../../components/Button';
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

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
        className="w-full max-w-xs bg-white h-full shadow-2xl border-l border-slate-100 flex flex-col"
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400">{t('adminMenu.adminSpace')}</p>
            <h2 className="text-lg font-semibold text-slate-900">{t('adminMenu.quickActions')}</h2>
          </div>
          <button
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

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-600 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t('adminMenu.synchronization')}</p>
            {showSyncStatus ? (
              <div className="space-y-1">
                {!syncStatus.isOnline && (
                  <p className="text-amber-700 font-semibold">{t('adminMenu.offlineMode')}</p>
                )}
                {syncStatus.pendingMutations > 0 && (
                  <p>{t('adminMenu.pendingChanges', { count: syncStatus.pendingMutations })}</p>
                )}
                {syncStatus.isSyncing && syncStatus.isOnline && (
                  <p className="flex items-center gap-2 text-teal-700">
                    <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                    {t('adminMenu.syncing')}
                  </p>
                )}
              </div>
            ) : (
              <p className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                {t('adminMenu.dataSynced')}
              </p>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t('adminMenu.adminSpace')}</p>
            <p className="text-xs text-slate-500">
              Access partner portal and administration.
            </p>
            <Button variant="outline" className="w-full justify-center" onClick={onPartnerAccess}>
              <Building2 className="w-4 h-4 mr-2" />
              {partnerSession ? 'My Workspace' : 'Partner / Admin Login'}
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
