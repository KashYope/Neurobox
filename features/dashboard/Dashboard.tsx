import React from 'react';
import { ExerciseCard, situationIcon } from '../../components/exercises/ExerciseCard';
import { useTranslation } from '../../src/i18nContext';

import { BrandLogo, Button, Menu, Search, User } from '../../components/ui';
import { AdminDrawer } from '../admin/AdminDrawer';
import { Exercise, PartnerAccount, Situation, UserProfile, RecommendationProfile } from '../../types';
import { SyncStatus } from '../../services/syncService';
import { getRecommendationReasons } from '../../services/dataService';

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
  embeddedInSiteShell?: boolean;
  headerActionsContainer?: HTMLElement | null;
}


export const Dashboard: React.FC<DashboardProps> = ({ user, recommendationProfile, exercises, situationFilter, onFilterChange, onExerciseClick, onAddTechnique, onPartnerAccess, syncStatus, showSyncStatus, partnerSession, isAdminMenuOpen, onOpenAdminMenu, onCloseAdminMenu, embeddedInSiteShell = false, headerActionsContainer = null }) => {
  const { t } = useTranslation(['common']);
  const catalogue = React.useRef<HTMLDivElement>(null);
  const restoredFocus = React.useRef(false);
  React.useEffect(() => {
    const id = window.history.state?.returnExerciseId;
    if (restoredFocus.current || typeof id !== 'string') return;
    const cards = Array.from(catalogue.current?.querySelectorAll('[data-exercise-id]') ?? []) as HTMLButtonElement[];
    const card = cards.find(element => element.dataset.exerciseId === id);
    if (card) {
      card.focus();
      restoredFocus.current = true;
    }
  }, [exercises]);
  const [showAll, setShowAll] = React.useState(() =>
    window.history.state?.catalogueExpandedFor === situationFilter);
  const previousSituation = React.useRef(situationFilter);
  React.useEffect(() => {
    if (previousSituation.current !== situationFilter) {
      previousSituation.current = situationFilter;
      setShowAll(window.history.state?.catalogueExpandedFor === situationFilter);
    }
  }, [situationFilter]);
  const expandCatalogue = () => {
    window.history.replaceState({ ...window.history.state, catalogueExpandedFor: situationFilter }, '', window.location.href);
    setShowAll(true);
  };
  const visibleExercises = situationFilter === 'All' || showAll ? exercises : exercises.slice(0, 3);
  const headerActions = <div className="flex items-center gap-2">
    {user && <div className="hidden items-center gap-2 rounded-full bg-white/75 px-3 py-2 text-sm text-[var(--ndee-muted)] md:flex"><User className="h-4 w-4" /><span className="font-semibold">{user.name}</span></div>}
    <button type="button" onClick={onOpenAdminMenu} aria-label={t('menu.open')} aria-expanded={isAdminMenuOpen} className="ndee-focus flex h-11 w-11 items-center justify-center rounded-full border bg-white/75 text-[var(--ndee-muted)] hover:text-[var(--ndee-ink)]"><Menu className="h-5 w-5" /></button>
  </div>;

  return (
    <div ref={catalogue} className="min-h-screen">

      {!embeddedInSiteShell && <header className="sticky top-0 z-20 border-b border-[var(--ndee-border)] bg-[rgba(248,245,239,0.92)] backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-3 px-4">
          <a href="/" className="ndee-focus rounded-xl" aria-label={t('dashboard.backHome')}><BrandLogo compact /></a>
          {headerActions}
        </div>
      </header>}

      <main className="ndee-container py-8 sm:py-10">
        <section aria-labelledby="toolbox-title">
          <p className="ndee-eyebrow">{t('dashboard.toolboxEyebrow')}</p>
          <h1 id="toolbox-title" className="mt-2 text-3xl font-semibold leading-tight sm:text-4xl">{situationFilter === 'All' ? t('ux.toolbox') : t(`situations.${situationFilter}`)}</h1>
          <p className="mt-3 max-w-2xl leading-relaxed text-[var(--ndee-muted)]">{situationFilter === 'All' ? recommendationProfile ? t('dashboard.basedOnReflection') : user ? t('dashboard.basedOnProfile', { neurotypes: user.neurotypes.map(nt => t(`neuroTypes.${nt}`)).join(', ') }) : t('dashboard.guestCatalog') : t('dashboard.specificTechniques')}</p>
        </section>

        <section className="mt-7" aria-labelledby="needs-filter-title">
          <h2 id="needs-filter-title" className="mb-3 text-sm font-semibold text-[var(--ndee-ink)]">{t('dashboard.filterPrompt')}</h2>
          <div className="hide-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
            <button onClick={() => onFilterChange('All')} aria-pressed={situationFilter === 'All'} className={`ndee-focus min-h-11 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition ${situationFilter === 'All' ? 'bg-[var(--ndee-primary)] text-white' : 'border bg-white/70 text-[var(--ndee-muted)]'}`}>{t('labels.all')}</button>
            {Object.values(Situation).map(situation => { const Icon = situationIcon(situation); const active = situationFilter === situation; return <button key={situation} onClick={() => onFilterChange(situation)} aria-pressed={active} className={`ndee-focus inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition ${active ? 'bg-[var(--ndee-primary)] text-white' : 'border bg-white/70 text-[var(--ndee-muted)] hover:bg-white'}`}><Icon className="h-4 w-4" />{t(`situations.${situation}`)}</button>; })}
          </div>
        </section>

        <p role="status" aria-live="polite" aria-atomic="true" className="mt-5 text-sm text-[var(--ndee-muted)]">{t('ux.exerciseCount', { shown: visibleExercises.length, total: exercises.length })}</p>
        {visibleExercises.length > 0 ? <>
          {situationFilter === 'All' && <section className="mt-8" aria-labelledby="featured-title"><h2 id="featured-title" className="mb-4 text-xl">{t('ux.featured')}</h2><ExerciseCard exercise={visibleExercises[0]} reasons={getRecommendationReasons(visibleExercises[0], recommendationProfile)} onClick={() => onExerciseClick(visibleExercises[0])} featured /></section>}
          {(situationFilter !== 'All' || visibleExercises.length > 1) && <section className="mt-8" aria-labelledby="exercise-list-title"><h2 id="exercise-list-title" className="mb-4 text-xl">{t(situationFilter === 'All' || showAll ? 'ux.others' : 'ux.suggestions')}</h2><div className="ndee-exercise-grid gap-5">{(situationFilter === 'All' ? visibleExercises.slice(1) : visibleExercises).map(exercise => <ExerciseCard key={exercise.id} exercise={exercise} reasons={getRecommendationReasons(exercise, recommendationProfile)} onClick={() => onExerciseClick(exercise)} />)}</div></section>}
          {situationFilter !== 'All' && !showAll && exercises.length > 3 && <Button className="mt-6" variant="outline" onClick={expandCatalogue}>{t('ux.others')}</Button>}
          {situationFilter !== 'All' && <Button className="mt-6 ml-2" variant="outline" onClick={() => onFilterChange('All')}>{t('ux.allExercises')}</Button>}
        </> : <section className="ndee-surface mt-8 rounded-2xl px-6 py-12 text-center"><Search className="mx-auto h-7 w-7" /><h2 className="mt-5 text-xl">{t('dashboard.noTechniquesFound')}</h2><p className="mt-2">{t('dashboard.tryChangeFilter')}</p><Button className="mt-6" variant="outline" onClick={() => onFilterChange('All')}>{t('buttons.viewAll')}</Button></section>}
        <div className="mt-10 border-t pt-6"><Button variant="ghost" onClick={onAddTechnique}>{t('ux.contribute')}</Button></div>

      </main>

      {!embeddedInSiteShell && <AdminDrawer isOpen={isAdminMenuOpen} onClose={onCloseAdminMenu} onAddTechnique={onAddTechnique} onPartnerAccess={onPartnerAccess} syncStatus={syncStatus} showSyncStatus={showSyncStatus} partnerSession={partnerSession} />}
    </div>
  );
};
