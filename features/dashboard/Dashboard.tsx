import React from 'react';
import {
  Activity,
  Brain,
  Flame,
  Heart,
  Menu,
  Moon,
  Search,
  User,
  Wind
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '../../components/Button';
import { AdminDrawer } from '../admin/AdminDrawer';
import { Exercise, PartnerAccount, Situation, UserProfile } from '../../types';
import { SyncStatus } from '../../services/syncService';

export interface DashboardProps {
  user: UserProfile | null;
  exercises: Exercise[];
  situationFilter: Situation | 'All';
  onFilterChange: (filter: Situation | 'All') => void;
  onExerciseClick: (exercise: Exercise) => void;
  onAddTechnique: () => void;
  onPartnerAccess: () => void;
  syncStatus: SyncStatus;
  showSyncStatus: boolean;
  partnerSession: PartnerAccount | null;
  isAdminMenuOpen: boolean;
  onOpenAdminMenu: () => void;
  onCloseAdminMenu: () => void;
}

interface ExerciseCardProps {
  exercise: Exercise;
  onClick: () => void;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, onClick }) => {
  const { t } = useTranslation(['common']);

  const getIcon = () => {
    if (exercise.situation.includes(Situation.Crisis)) return <Activity className="w-5 h-5 text-rose-500" />;
    if (exercise.situation.includes(Situation.Sleep)) return <Moon className="w-5 h-5 text-indigo-500" />;
    if (exercise.situation.includes(Situation.Anger)) return <Flame className="w-5 h-5 text-orange-500" />;
    return <Wind className="w-5 h-5 text-teal-500" />;
  };

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden border border-gray-100 flex flex-col h-full"
    >
      <div className="relative h-32 overflow-hidden bg-gray-100">
        <img
          src={exercise.imageUrl}
          alt={exercise.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/e2e8f0/94a3b8?text=NeuroSooth'; }}
        />
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-semibold text-slate-700 flex items-center gap-1">
          <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> {exercise.thanksCount}
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-slate-900 leading-tight group-hover:text-teal-700 transition-colors">
            {exercise.title}
          </h3>
          {getIcon()}
        </div>

        <p className="text-sm text-slate-500 mb-4 line-clamp-2 flex-1">
          {exercise.description}
        </p>

        <div className="flex flex-wrap gap-1 mt-auto">
          {exercise.tags.slice(0, 2).map(tag => (
            <span key={tag} className="text-[10px] uppercase tracking-wider font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  exercises,
  situationFilter,
  onFilterChange,
  onExerciseClick,
  onAddTechnique,
  onPartnerAccess,
  syncStatus,
  showSyncStatus,
  partnerSession,
  isAdminMenuOpen,
  onOpenAdminMenu,
  onCloseAdminMenu
}) => {
  const { t } = useTranslation(['common', 'dashboard']);

  return (
    <div className="min-h-screen bg-slate-50">
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
              onClick={onOpenAdminMenu}
              aria-label="Ouvrir le menu administrateur"
              aria-expanded={isAdminMenuOpen}
              className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            >
              <Menu className="w-5 h-5" />
              <span className="sr-only">{t('menu.adminSpace')}</span>
            </button>
          </div>
        </div>

        <div className="border-t border-gray-100 overflow-x-auto hide-scrollbar">
          <div className="max-w-6xl mx-auto px-4 py-3 flex gap-2 min-w-max">
            <button
              onClick={() => onFilterChange('All')}
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
                onClick={() => onFilterChange(sit)}
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

      <main className="max-w-6xl mx-auto px-4 py-6">
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

        {exercises.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
            {exercises.map((ex) => (
              <ExerciseCard
                key={ex.id}
                exercise={ex}
                onClick={() => onExerciseClick(ex)}
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
              <Button variant="outline" onClick={() => onFilterChange('All')}>
                {t('buttons.viewAll')}
              </Button>
              <Button variant="primary" onClick={onAddTechnique}>
                {t('buttons.addTechnique')}
              </Button>
            </div>
          </div>
        )}
      </main>

      <AdminDrawer
        isOpen={isAdminMenuOpen}
        onClose={onCloseAdminMenu}
        onAddTechnique={onAddTechnique}
        onPartnerAccess={onPartnerAccess}
        syncStatus={syncStatus}
        showSyncStatus={showSyncStatus}
        partnerSession={partnerSession}
      />
    </div>
  );
};
