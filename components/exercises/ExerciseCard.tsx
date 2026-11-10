import React from 'react';
import { useTranslation } from '../../src/i18nContext';
import { Activity, Brain, Clock3, Flame, Focus, Heart, Leaf, MoonStar, Waves, Wind } from '../ui';
import { Exercise, Situation, SupportNeed } from '../../types';
import { ExerciseIllustration } from './ExerciseIllustration';
import { THANKS_VISIBILITY_THRESHOLD } from '../../constants';
import { situationTone } from '../../services/situationPresentation';

interface ExerciseCardProps {
  exercise: Exercise;
  reasons: SupportNeed[];
  onClick: () => void;
  featured?: boolean;
}

export const situationIcon = (situation?: Situation) => {
  if (situation === Situation.Crisis) return Activity;
  if (situation === Situation.Sleep) return MoonStar;
  if (situation === Situation.Anger) return Flame;
  if (situation === Situation.Focus) return Focus;
  if (situation === Situation.Rumination) return Brain;
  if (situation === Situation.Trauma || situation === Situation.Pain) return Leaf;
  if (situation === Situation.Freeze) return Wind;
  return Waves;
};

export const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, reasons, onClick, featured = false }) => {
  const { t } = useTranslation(['common']);
  const Icon = situationIcon(exercise.situation[0]);

  return (
    <button
      type="button"
      data-exercise-id={exercise.id}
      onClick={onClick}
      className={`ndee-focus group overflow-hidden rounded-[var(--ndee-radius-card)] border border-[var(--ndee-border)] bg-[var(--ndee-surface)] text-left shadow-[0_12px_38px_rgba(66,77,71,0.07)] transition motion-safe:hover:-translate-y-0.5 hover:shadow-[0_16px_44px_rgba(66,77,71,0.11)] ${featured ? 'sm:col-span-2 lg:grid lg:grid-cols-[1.05fr_.95fr]' : 'flex h-full flex-col'}`}
    >
      {featured ? <div className="relative h-40 overflow-hidden bg-[var(--ndee-sage)] lg:h-full lg:min-h-48"><ExerciseIllustration exercise={exercise} className="h-full w-full object-cover" /></div> : <div className="px-5 pt-5"><span style={{ background: `var(--situation-${situationTone[exercise.situation[0] ?? Situation.Stress]})` }} className="flex h-11 w-11 items-center justify-center rounded-xl"><Icon aria-hidden="true" className="h-5 w-5" /></span></div>}

      <div className={`flex flex-1 flex-col ${featured ? 'p-6 sm:p-7' : 'p-5'}`}>
        <h3 className={`${featured ? 'text-2xl' : 'text-lg'} font-semibold leading-tight text-[var(--ndee-ink)]`}>{exercise.title}</h3>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--ndee-muted)]">{exercise.description}</p>

        {reasons.length > 0 && <p className="mt-4 text-xs font-semibold leading-relaxed text-[var(--ndee-primary-strong)]">{t('dashboard.suggestedBecause', { reasons: reasons.map(reason => t(`supportNeeds.${reason}`)).join(', ') })}</p>}

        <div className="mt-3 flex flex-wrap gap-2">{exercise.situation.map(situation => <span key={situation} style={{ background: `var(--situation-${situationTone[situation]})` }} className="rounded-full px-2 py-1 text-xs text-[var(--ndee-ink)]">{t(`situations.${situation}`)}</span>)}</div>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-5 text-xs font-semibold text-[var(--ndee-muted)]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ndee-canvas)] px-3 py-1.5"><Clock3 aria-hidden="true" className="h-3.5 w-3.5" />{exercise.duration}</span>
          {exercise.thanksCount >= THANKS_VISIBILITY_THRESHOLD ? <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ndee-peach)] px-3 py-1.5"><Heart aria-hidden="true" className="h-3.5 w-3.5" />{exercise.thanksCount}</span> : <span className="rounded-full bg-[var(--ndee-sage)] px-3 py-1.5">{t(exercise.isCommunitySubmitted || exercise.isPartnerContent ? 'badges.teamApproved' : 'badges.editorialPick')}</span>}
        </div>
      </div>
    </button>
  );
};

