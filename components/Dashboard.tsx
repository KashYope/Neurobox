import React from 'react';
import { useTranslation } from 'react-i18next';
import { Brain, User, Menu, Plus, Building2, CheckCircle2, X, Search } from 'lucide-react';
import { Button } from './Button';
import { Exercise, Situation, UserProfile } from '../types';
import { ExerciseCard } from './ExerciseCard';
import { LanguageSelector } from './LanguageSelector';
import { BuyMeACoffeeButton } from './BuyMeACoffeeButton';
import { SyncStatus } from '../services/syncService';

interface DashboardProps {
  user: UserProfile | null;
  exercises: Exercise[];
  syncStatus: SyncStatus;
  isAdminMenuOpen: boolean;
  situationFilter: Situation | 'All';
  handleExerciseClick: (ex: Exercise) => void;
  handlePartnerAccess: () => void;
  handleModerationAccess: () => void;
  handleContributionAccess: () => void;
  setSituationFilter: (filter: Situation | 'All') => void;
  setIsAdminMenuOpen: (isOpen: boolean) => void;
  setView: (view: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  exercises,
  syncStatus,
  isAdminMenuOpen,
  situationFilter,
  handleExerciseClick,
  handlePartnerAccess,
  handleModerationAccess,
  handleContributionAccess,
  setSituationFilter,
  setIsAdminMenuOpen,
  setView,
}) => {
  const { t } = useTranslation(['common']);

  const showSyncStatus =
    !syncStatus.isOnline || syncStatus.pendingMutations > 0 || syncStatus.isSyncing;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-teal-600 p-1.5 rounded-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-800 hidden md:block">{t('app.name')}</span>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
                <User className="w-4 h-4" />
                <span className="font-medium">{user.name}</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsAdminMenuOpen(true)}
              aria-label="Ouvrir le menu administrateur"
              aria-expanded={isAdminMenuOpen}
              className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            >
              <Menu className="w-5 h-5" />
              <span className="sr-only">{t('menu.adminSpace')}</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="border-t border-gray-100 overflow-x-auto hide-scrollbar">
          <div className="max-w-6xl mx-auto px-4 py-3 flex gap-2 min-w-max">
            <button
              onClick={() => setSituationFilter('All')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                situationFilter === 'All'
                  ? 'bg-slate-800 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {t('labels.all')}
            </button>
            {Object.values(Situation).map((sit) => (
              <button
                key={sit}
                onClick={() => setSituationFilter(sit)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  situationFilter === sit
                    ? 'bg-teal-600 text-white shadow-md transform scale-105'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {t(`situations.${sit}`)}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Context Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            {situationFilter === 'All' ? t('dashboard.recommendedForYou') : t(`situations.${situationFilter}`)}
          </h2>
          <p className="text-slate-500">
            {situationFilter === 'All'
              ? t('dashboard.basedOnProfile', { neurotypes: user?.neurotypes.map(nt => t(`neuroTypes.${nt}`)).join(', ') || '' })
              : t('dashboard.specificTechniques')
            }
          </p>
        </div>

        {/* Grid */}
        {exercises.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
            {exercises.map((ex) => (
              <ExerciseCard
                key={ex.id}
                exercise={ex}
                onClick={() => handleExerciseClick(ex)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="bg-slate-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">{t('dashboard.noTechniquesFound')}</h3>
            <p className="text-slate-500 mb-6">{t('dashboard.tryChangeFilter')}</p>
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => setSituationFilter('All')}>
                {t('buttons.viewAll')}
              </Button>
              <Button variant="primary" onClick={() => setView('add')}>
                {t('buttons.addTechnique')}
              </Button>
            </div>
          </div>
        )}
      </main>

      {isAdminMenuOpen && (
        <div className="fixed inset-0 z-40 flex" aria-modal="true" role="dialog">
          <div
            className="flex-1 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsAdminMenuOpen(false)}
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
                onClick={() => setIsAdminMenuOpen(false)}
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
                onClick={handleContributionAccess}
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
                  <Button variant="outline" className="w-full justify-center" onClick={handlePartnerAccess}>
                      <Building2 className="w-4 h-4 mr-2" />
                      {t('adminMenu.partnerSpace')}
                  </Button>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <BuyMeACoffeeButton onSupport={() => setIsAdminMenuOpen(false)} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
