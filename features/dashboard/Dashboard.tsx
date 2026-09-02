import React from 'react';
import { useTranslation } from '../../src/i18nContext';

import {
  Activity,
  BrandLogo,
  Brain,
  Button,
  Clock3,
  Flame,
  Focus,
  Heart,
  Leaf,
  Menu,
  MoonStar,
  Search,
  Sparkles,
  User,
  Waves,
  Wind
} from '../../components/ui';
import { AdminDrawer } from '../admin/AdminDrawer';
import { Exercise, PartnerAccount, Situation, UserProfile, RecommendationProfile, SupportNeed } from '../../types';
import { SyncStatus } from '../../services/syncService';
import { getRecommendationReasons } from '../../services/dataService';
import { ExerciseIllustration } from '../../components/exercises/ExerciseIllustration';
import { THANKS_VISIBILITY_THRESHOLD } from '../../constants';

export interface DashboardProps {
  user: UserProfile | null;
  recommendationProfile: RecommendationProfile | null;
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
  reasons: SupportNeed[];
  onClick: () => void;
  featured?: boolean;
}

const situationIcon = (situation?: Situation) => {
  if (situation === Situation.Crisis) return Activity;
  if (situation === Situation.Sleep) return MoonStar;
  if (situation === Situation.Anger) return Flame;
  if (situation === Situation.Focus) return Focus;
  if (situation === Situation.Rumination) return Brain;
  if (situation === Situation.Trauma || situation === Situation.Pain) return Leaf;
  if (situation === Situation.Freeze) return Wind;
  return Waves;
};

const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, reasons, onClick, featured = false }) => {
  const { t } = useTranslation(['common']);
  const Icon = situationIcon(exercise.situation[0]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`ndee-focus group overflow-hidden rounded-[1.75rem] border border-white/80 bg-[var(--ndee-surface)] text-left shadow-[0_12px_38px_rgba(66,77,71,0.07)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_44px_rgba(66,77,71,0.11)] ${featured ? 'sm:col-span-2 lg:grid lg:grid-cols-[1.05fr_.95fr]' : 'flex h-full flex-col'}`}
    >
      <div className={`relative overflow-hidden bg-[var(--ndee-sage)] ${featured ? 'h-48 lg:h-full lg:min-h-72' : 'h-40'}`}>
        <ExerciseIllustration exercise={exercise} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]" />
        <div className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/85 text-[var(--ndee-primary-strong)] backdrop-blur-sm"><Icon className="h-5 w-5" /></div>
      </div>

      <div className={`flex flex-1 flex-col ${featured ? 'p-6 sm:p-7' : 'p-5'}`}>
        {featured && <p className="ndee-eyebrow mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4" />{t('dashboard.gentleStartingPoint')}</p>}
        <h3 className={`${featured ? 'text-2xl' : 'text-lg'} font-bold leading-tight text-[var(--ndee-ink)]`}>{exercise.title}</h3>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--ndee-muted)]">{exercise.description}</p>

        {reasons.length > 0 && <p className="mt-4 text-xs font-semibold leading-relaxed text-[var(--ndee-primary-strong)]">{t('dashboard.suggestedBecause', { reasons: reasons.map(reason => t(`supportNeeds.${reason}`)).join(', ') })}</p>}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-5 text-xs font-semibold text-[var(--ndee-muted)]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ndee-canvas)] px-3 py-1.5"><Clock3 className="h-3.5 w-3.5" />{exercise.duration}</span>
          {exercise.thanksCount >= THANKS_VISIBILITY_THRESHOLD ? <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ndee-peach)] px-3 py-1.5"><Heart className="h-3.5 w-3.5" />{exercise.thanksCount}</span> : <span className="rounded-full bg-[var(--ndee-sage)] px-3 py-1.5">{t(exercise.isCommunitySubmitted || exercise.isPartnerContent ? 'badges.teamApproved' : 'badges.editorialPick')}</span>}
        </div>
      </div>
    </button>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ user, recommendationProfile, exercises, situationFilter, onFilterChange, onExerciseClick, onAddTechnique, onPartnerAccess, syncStatus, showSyncStatus, partnerSession, isAdminMenuOpen, onOpenAdminMenu, onCloseAdminMenu }) => {
  const { t } = useTranslation(['common']);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-[var(--ndee-border)] bg-[rgba(248,245,239,0.92)] backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-3 px-4">
          <a href="/" className="ndee-focus rounded-xl" aria-label={t('dashboard.backHome')}><BrandLogo compact /></a>
          <div className="flex items-center gap-2">
            {user && <div className="hidden items-center gap-2 rounded-full bg-white/75 px-3 py-2 text-sm text-[var(--ndee-muted)] sm:flex"><User className="h-4 w-4" /><span className="font-semibold">{user.name}</span></div>}
            <button type="button" onClick={onOpenAdminMenu} aria-label={t('menu.open')} aria-expanded={isAdminMenuOpen} className="ndee-focus flex h-11 w-11 items-center justify-center rounded-full border bg-white/75 text-[var(--ndee-muted)] hover:text-[var(--ndee-ink)]"><Menu className="h-5 w-5" /></button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <section aria-labelledby="toolbox-title">
          <p className="ndee-eyebrow">{t('dashboard.toolboxEyebrow')}</p>
          <h1 id="toolbox-title" className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">{situationFilter === 'All' ? t('dashboard.recommendedForYou') : t(`situations.${situationFilter}`)}</h1>
          <p className="mt-3 max-w-2xl leading-relaxed text-[var(--ndee-muted)]">{situationFilter === 'All' ? recommendationProfile ? t('dashboard.basedOnReflection') : user ? t('dashboard.basedOnProfile', { neurotypes: user.neurotypes.map(nt => t(`neuroTypes.${nt}`)).join(', ') }) : t('dashboard.guestCatalog') : t('dashboard.specificTechniques')}</p>
        </section>

        <section className="mt-7" aria-labelledby="needs-filter-title">
          <h2 id="needs-filter-title" className="mb-3 text-sm font-bold text-[var(--ndee-ink)]">{t('dashboard.filterPrompt')}</h2>
          <div className="hide-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-2">
            <button onClick={() => onFilterChange('All')} aria-pressed={situationFilter === 'All'} className={`ndee-focus min-h-11 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition ${situationFilter === 'All' ? 'bg-[var(--ndee-primary)] text-white' : 'border bg-white/70 text-[var(--ndee-muted)]'}`}>{t('labels.all')}</button>
            {Object.values(Situation).map(situation => { const Icon = situationIcon(situation); const active = situationFilter === situation; return <button key={situation} onClick={() => onFilterChange(situation)} aria-pressed={active} className={`ndee-focus inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition ${active ? 'bg-[var(--ndee-primary)] text-white' : 'border bg-white/70 text-[var(--ndee-muted)] hover:bg-white'}`}><Icon className="h-4 w-4" />{t(`situations.${situation}`)}</button>; })}
          </div>
        </section>

        {exercises.length > 0 ? <section className="mt-7 grid grid-cols-1 gap-5 pb-20 sm:grid-cols-2 lg:grid-cols-3" aria-label={t('dashboard.exerciseList')}>{exercises.map((exercise, index) => <ExerciseCard key={exercise.id} exercise={exercise} reasons={getRecommendationReasons(exercise, recommendationProfile)} onClick={() => onExerciseClick(exercise)} featured={index === 0 && situationFilter === 'All'} />)}</section> : <section className="ndee-surface mt-8 rounded-[2rem] px-6 py-16 text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--ndee-sky)]"><Search className="h-7 w-7 text-[var(--ndee-primary-strong)]" /></div><h2 className="mt-5 text-xl font-bold">{t('dashboard.noTechniquesFound')}</h2><p className="mt-2 text-[var(--ndee-muted)]">{t('dashboard.tryChangeFilter')}</p><div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><Button variant="outline" onClick={() => onFilterChange('All')}>{t('buttons.viewAll')}</Button><Button onClick={onAddTechnique}>{t('buttons.addTechnique')}</Button></div></section>}
      </main>

      <AdminDrawer isOpen={isAdminMenuOpen} onClose={onCloseAdminMenu} onAddTechnique={onAddTechnique} onPartnerAccess={onPartnerAccess} syncStatus={syncStatus} showSyncStatus={showSyncStatus} partnerSession={partnerSession} />
    </div>
  );
};
