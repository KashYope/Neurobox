import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from './i18nContext';
import { App as CapacitorApp } from '@capacitor/app';

import {
  AlertTriangle,
  Activity,
  ArrowLeft,
  BarChart3,
  Building2,
  Button,
  CheckCircle2,
  ClipboardList,
  Clock,
  Heart,
  Languages,
  LogOut,
  ShieldCheck,
  Users,
  UserPlus,
  XCircle
} from '../components/ui';
import { Onboarding } from '../components/onboarding/Onboarding';
import { Dashboard } from '../features/dashboard/Dashboard';
import { PartnerPortal } from '../features/partners/PartnerPortal';
import { BatchTranslationPanel } from '../features/admin/BatchTranslationPanel';
import { Exercise, Situation, UserProfile, PartnerAccount, RecommendationProfile } from '../types';
import {
  getUser,
  getExercises,
  getRecommendedExercises,
  saveExercise,
  incrementThanks,
  moderateExercise
} from '../services/dataService';
import { getRecommendationProfile } from '../services/storage/offlineDb';
import { syncService, SyncStatus } from '../services/syncService';
import { apiClient, type AdminMetricsResponse } from '../services/apiClient';
import { useExerciseTranslation } from '../hooks/useExerciseTranslation';
import { ExerciseIllustration } from '../components/exercises/ExerciseIllustration';
import { THANKS_VISIBILITY_THRESHOLD } from '../constants';
import { hasThankedExercise } from '../services/helpfulVotes';
import { getSituationFilterFromSearch } from '../services/navigation';

// --- Components ---

const TagBadge: React.FC<{ text: string }> = ({ text }) => (
  <span className="mb-2 mr-2 inline-flex items-center rounded-full bg-[var(--ndee-lilac)] px-2.5 py-1 text-xs font-semibold text-[var(--ndee-ink)]">
    {text}
  </span>
);

const ExerciseDetail: React.FC<{ 
  exercise: Exercise; 
  onBack: () => void; 
  onThanks: () => Promise<boolean>
}> = ({ exercise, onBack, onThanks }) => {
  const { t } = useTranslation(['common', 'exercise']);
  const [hasThanked, setHasThanked] = useState(() => hasThankedExercise(exercise.id));
  const [thanksError, setThanksError] = useState<string | null>(null);

  useEffect(() => {
    setHasThanked(hasThankedExercise(exercise.id));
    setThanksError(null);
  }, [exercise.id]);

  const handleThanks = async () => {
    if (!hasThanked) {
      try {
        setThanksError(null);
        const accepted = await onThanks();
        if (accepted) setHasThanked(true);
      } catch {
        setThanksError(t('exercise:detail.thanksError'));
      }
    }
  };

  return (
    <div className="min-h-screen pb-20 motion-safe:animate-slide-in">
      <div className="sticky top-0 z-10 border-b bg-[rgba(248,245,239,0.92)] backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-4xl items-center gap-3 px-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="!min-h-11 !w-11 !p-0" aria-label={t('buttons.back')}><ArrowLeft className="h-5 w-5" /></Button>
          <h1 className="truncate text-base font-bold sm:text-lg">{exercise.title}</h1>
        </div>
      </div>

      <main className="mx-auto max-w-4xl p-4 sm:p-6 md:p-8">
        <div className="overflow-hidden rounded-[2rem] bg-[var(--ndee-sage)]">
          <div className="aspect-[16/8] min-h-52"><ExerciseIllustration exercise={exercise} className="h-full w-full object-cover" /></div>
        </div>

        <div className="mx-auto max-w-3xl">
          <div className="mt-6 flex flex-wrap gap-2">
            {exercise.situation.map(s => <span key={s} className="rounded-full bg-[var(--ndee-sky)] px-3 py-1.5 text-xs font-semibold text-[var(--ndee-ink)]">{t(`situations.${s}`)}</span>)}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ndee-sun)] px-3 py-1.5 text-xs font-semibold"><Clock className="h-3.5 w-3.5" />{exercise.duration}</span>
          </div>

          <h2 className="mt-6 text-3xl font-bold leading-tight sm:text-4xl">{exercise.title}</h2>
          <p className="mt-4 text-lg leading-relaxed text-[var(--ndee-muted)]">{exercise.description}</p>

          <div className="mt-6 rounded-2xl border bg-white/65 p-4 text-sm leading-relaxed text-[var(--ndee-muted)]" role="note">{t('exercise:detail.safetyNote')}</div>
          {exercise.warning && <div className="mt-4 flex items-start gap-3 rounded-2xl bg-[var(--ndee-sun)] p-4"><AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#7a632c]" /><p className="text-sm leading-relaxed text-[#5f522f]">{exercise.warning}</p></div>}

          <section className="mt-10" aria-labelledby="exercise-steps-title">
            <p className="ndee-eyebrow">{t('exercise:detail.takeYourTime')}</p>
            <h3 id="exercise-steps-title" className="mt-2 text-2xl font-bold">{t('exercise:detail.instructions')}</h3>
            <ol className="mt-6 space-y-4">{exercise.steps.map((step, idx) => <li key={idx} className="ndee-surface flex gap-4 rounded-2xl p-4 sm:p-5"><span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[var(--ndee-sage)] text-sm font-bold text-[var(--ndee-primary-strong)]">{idx + 1}</span><p className="pt-1.5 leading-relaxed text-[var(--ndee-ink)]">{step}</p></li>)}</ol>
          </section>

          <div className="mt-10 rounded-[2rem] bg-[var(--ndee-peach)] p-6 text-center sm:p-8">
            <p className="mb-4 text-sm text-[var(--ndee-muted)]">{t('exercise:detail.wasItHelpful')}</p>
            <Button size="lg" variant={hasThanked ? 'outline' : 'primary'} onClick={handleThanks} disabled={hasThanked} className={hasThanked ? 'bg-white/65' : ''}><Heart className={`mr-2 h-5 w-5 ${hasThanked ? 'fill-current' : ''}`} />{hasThanked ? t('exercise:detail.thanksSent') : t('exercise:detail.sayThanks')}</Button>
            {exercise.thanksCount >= THANKS_VISIBILITY_THRESHOLD && <p className="mt-3 text-xs text-[var(--ndee-muted)]">{t('exercise:detail.peopleFoundHelpful', { count: exercise.thanksCount })}</p>}
            {thanksError && <p className="mt-3 text-sm text-[var(--ndee-danger)]" role="alert">{thanksError}</p>}
          </div>
        </div>
      </main>
    </div>
  );
};

const AddExerciseForm: React.FC<{
  onCancel: () => void;
  onSubmit: (ex: Exercise) => Promise<'submitted' | 'queued'>;
}> = ({ onCancel, onSubmit }) => {
  const { t } = useTranslation(['common', 'exercise']);
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCancelRef = useRef(onCancel);
  const createInitialFormState = (): Partial<Exercise> => ({
    title: '',
    description: '',
    duration: '',
    steps: [''],
    situation: [],
    neurotypes: [],
    tags: [],
  });

  const [formData, setFormData] = useState<Partial<Exercise>>(createInitialFormState());
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    onCancelRef.current = onCancel;
  }, [onCancel]);

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    const focusableSelector = 'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
    (dialog?.querySelector(focusableSelector) as HTMLElement | null)?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancelRef.current();
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;
      const focusable = Array.from(dialog.querySelectorAll(focusableSelector)) as HTMLElement[];
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, []);

  const handleStepChange = (idx: number, val: string) => {
    const newSteps = [...(formData.steps || [])];
    newSteps[idx] = val;
    setFormData({ ...formData, steps: newSteps });
  };

  const addStep = () => {
    setFormData({ ...formData, steps: [...(formData.steps || []), ''] });
  };

  const toggleSituation = (sit: Situation) => {
    const current = formData.situation || [];
    if (current.includes(sit)) {
      setFormData({ ...formData, situation: current.filter(s => s !== sit) });
    } else {
      setFormData({ ...formData, situation: [...current, sit] });
    }
  };

  const doSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      setFeedback({ type: 'error', message: t('exercise:creation.feedback.missingFields') });
      return;
    }

    const timestamp = new Date().toISOString();
    const newEx: Exercise = {
      id: Date.now().toString(),
      title: formData.title!,
      description: formData.description!,
      situation: formData.situation?.length ? formData.situation : [Situation.Stress],
      neurotypes: formData.neurotypes || [],
      duration: formData.duration || '5 min',
      steps: formData.steps?.filter(s => s.trim() !== '') || [],
      tags: ['Community'],
      supportNeeds: [],
      thanksCount: 0,
      isCommunitySubmitted: true,
      moderationStatus: 'pending',
      createdAt: timestamp,
      updatedAt: timestamp
    };

    try {
      const result = await onSubmit(newEx);
      setFeedback({
        type: 'success',
        message: t(result === 'queued' ? 'exercise:creation.feedback.savedOffline' : 'exercise:creation.feedback.success')
      });
      setFormData(createInitialFormState());
    } catch (error) {
      console.error('Failed to submit exercise', error);
      setFeedback({ type: 'error', message: t('exercise:creation.feedback.error') });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[var(--ndee-canvas)] motion-safe:animate-slide-in">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="contribution-dialog-title"
        className="mx-auto min-h-screen max-w-2xl bg-[var(--ndee-surface)] shadow-xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-[rgba(255,253,249,0.94)] p-4 backdrop-blur-md">
          <h2 id="contribution-dialog-title" className="text-lg font-bold">{t('exercise:creation.title')}</h2>
          <Button variant="ghost" size="sm" onClick={onCancel}>{t('exercise:creation.cancel')}</Button>
        </div>

        <form onSubmit={doSubmit} className="space-y-6 p-6 sm:p-8">
          <div className="flex gap-3 rounded-2xl bg-[var(--ndee-sun)] p-4 text-sm leading-relaxed text-[#5f522f]">
            <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>
              {t('exercise:creation.communityNote')}
            </p>
          </div>

          {feedback && (
            <div
              role={feedback.type === 'error' ? 'alert' : 'status'}
              aria-live={feedback.type === 'error' ? 'assertive' : 'polite'}
              className={`rounded-xl border px-4 py-3 text-sm ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}
            >
              {feedback.message}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">{t('exercise:creation.form.title')}</label>
            <input
              className="w-full rounded-2xl border p-3"
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})} 
              placeholder={t('exercise:creation.form.titlePlaceholder')}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('exercise:creation.form.description')}</label>
            <textarea 
              className="w-full rounded-2xl border p-3"
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
              placeholder={t('exercise:creation.form.descriptionPlaceholder')}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('exercise:creation.form.situation')}</label>
            <div className="flex flex-wrap gap-2">
              {Object.values(Situation).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSituation(s)}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                    formData.situation?.includes(s) 
                      ? 'border-[var(--ndee-primary)] bg-[var(--ndee-primary)] text-white'
                      : 'border-[var(--ndee-border)] bg-white text-[var(--ndee-muted)]'
                  }`}
                >
                  {t(`situations.${s}`)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('exercise:creation.form.duration')}</label>
            <input 
              className="w-full rounded-2xl border p-3"
              value={formData.duration} 
              onChange={e => setFormData({...formData, duration: e.target.value})} 
              placeholder={t('exercise:creation.form.durationPlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('exercise:creation.form.steps')}</label>
            {formData.steps?.map((step, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <span className="pt-2 text-xs text-slate-400">{i+1}</span>
                <input 
                  className="w-full rounded-2xl border p-3"
                  value={step}
                  onChange={e => handleStepChange(i, e.target.value)}
                  placeholder={t('exercise:creation.form.stepPlaceholder', { number: i + 1 })}
                />
              </div>
            ))}
            <Button type="button" variant="secondary" size="sm" onClick={addStep} className="mt-2">
              {t('exercise:creation.form.addStep')}
            </Button>
          </div>

          <div className="pt-6">
             <Button type="submit" className="w-full" size="lg">{t('exercise:creation.form.submit')}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Partner contribution workflows live in features/partners/PartnerPortal.tsx.
const ModerationPanel: React.FC<{
  pendingExercises: Exercise[];
  reviewedExercises: Exercise[];
  onApprove: (exercise: Exercise, notes?: string) => void;
  onReject: (exercise: Exercise, notes?: string) => void;
  onBack: () => void;
  statusNote?: string | null;
}> = ({ pendingExercises, reviewedExercises, onApprove, onReject, onBack, statusNote }) => {
  const { t } = useTranslation(['common', 'moderation']);
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});

  const handleNoteChange = (id: string, value: string) => {
    setNotesMap(prev => ({ ...prev, [id]: value }));
  };

  const renderStatusBadge = (status: string) => {
    const base = 'px-2 py-0.5 rounded-full text-xs font-semibold';
    if (status === 'approved') {
      return <span className={`${base} bg-emerald-100 text-emerald-700`}>{t('moderation:status.approved')}</span>;
    }
    if (status === 'rejected') {
      return <span className={`${base} bg-rose-100 text-rose-700`}>{t('moderation:status.rejected')}</span>;
    }
    return <span className={`${base} bg-amber-100 text-amber-700`}>{t('moderation:status.pending')}</span>;
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b bg-[rgba(248,245,239,0.92)] backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-teal-600" />
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500">{t('moderation:header.space')}</p>
              <h1 className="text-xl font-bold text-slate-900">{t('moderation:header.review')}</h1>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onBack}>
            {t('moderation:header.backToApp')}
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        {statusNote && (
          <div className="bg-slate-100 border border-slate-200 text-slate-600 rounded-2xl p-4">
            {statusNote}
          </div>
        )}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="w-5 h-5 text-slate-500" />
            <h2 className="text-lg font-semibold text-slate-900">
              {t('moderation:queue.title', { count: pendingExercises.length })}
            </h2>
          </div>
          {pendingExercises.length === 0 ? (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-6 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6" />
              <p>{t('moderation:queue.empty')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingExercises.map(ex => (
                <div key={ex.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">
                        {t('moderation:queue.proposedOn', { date: new Date(ex.createdAt || '').toLocaleString() })}
                      </p>
                      <h3 className="text-xl font-semibold text-slate-900">{ex.title}</h3>
                      <p className="text-slate-600 mt-1">{ex.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {ex.situation.map(sit => (
                        <TagBadge key={sit} text={t(`situations.${sit}`)} />
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 mb-1">{t('moderation:queue.duration')}</p>
                      <p className="text-sm text-slate-700">{ex.duration}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 mb-1">{t('moderation:queue.tags')}</p>
                      <p className="text-sm text-slate-700">{ex.tags.join(', ')}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="text-xs font-semibold text-slate-500">{t('moderation:queue.internalNote')}</label>
                    <textarea
                      className="mt-1 w-full border border-slate-200 rounded-xl p-3 text-sm"
                      placeholder={t('moderation:queue.internalNotePlaceholder')}
                      value={notesMap[ex.id] || ''}
                      onChange={e => handleNoteChange(ex.id, e.target.value)}
                    />
                  </div>

                  <div className="mt-4 flex flex-col md:flex-row justify-end gap-3">
                    <Button
                      variant="danger"
                      onClick={() => onReject(ex, notesMap[ex.id])}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      {t('moderation:queue.reject')}
                    </Button>
                    <Button
                      onClick={() => onApprove(ex, notesMap[ex.id])}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {t('moderation:queue.approve')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-slate-500" />
            <h2 className="text-lg font-semibold text-slate-900">{t('moderation:history.title')}</h2>
          </div>
          {reviewedExercises.length === 0 ? (
            <p className="text-sm text-slate-500">{t('moderation:history.empty')}</p>
          ) : (
            <div className="space-y-3">
              {reviewedExercises.map(ex => (
                <div key={ex.id} className="bg-white border border-slate-100 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{ex.title}</p>
                    <p className="text-xs text-slate-500">
                      {t('moderation:history.moderatedBy', {
                        author: ex.moderatedBy || 'Admin',
                        date: ex.moderatedAt ? new Date(ex.moderatedAt).toLocaleString() : t('moderation:history.unknownDate')
                      })}
                    </p>
                    {ex.moderationNotes && (
                      <p className="text-sm text-slate-600 mt-1">{t('moderation:history.note', { note: ex.moderationNotes })}</p>
                    )}
                  </div>
                  {renderStatusBadge(ex.moderationStatus || 'pending')}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};


const AdminDashboard: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { t } = useTranslation(['common', 'partner', 'moderation']);
  const [accounts, setAccounts] = useState<PartnerAccount[]>([]);
  const [viewMode, setViewMode] = useState<'accounts' | 'moderation' | 'batchTranslation'>('accounts');
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<AdminMetricsResponse | null>(null);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  const [metricsUpdatedAt, setMetricsUpdatedAt] = useState<number | null>(null);
  const [adminFeedback, setAdminFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Dummy state for moderation panel props since we reuse it
  const [pendingExercises, setPendingExercises] = useState<Exercise[]>([]);
  const [reviewedExercises, setReviewedExercises] = useState<Exercise[]>([]);
  const [moderationStatus, setModerationStatus] = useState<string | null>(null);

  const loadAccounts = useCallback(async () => {
    setIsLoadingAccounts(true);
    setAccountsError(null);
    try {
      const response = await apiClient.fetchPartners();
      const mapped = response.partners;
      setAccounts(mapped);
    } catch (error: any) {
      setAccountsError(error.message || t('adminDashboard.loadAccountsError'));
    } finally {
      setIsLoadingAccounts(false);
    }
  }, [t]);

  const loadMetrics = useCallback(
    async (force = false) => {
      if (!force && metricsUpdatedAt && Date.now() - metricsUpdatedAt < 60_000) {
        return;
      }

      setIsLoadingMetrics(true);
      setMetricsError(null);
      try {
        const response = await apiClient.fetchAdminMetrics();
        setMetrics(response);
        setMetricsUpdatedAt(Date.now());
      } catch (error: any) {
        setMetricsError(error.message || t('adminDashboard.loadMetricsError'));
      } finally {
        setIsLoadingMetrics(false);
      }
    },
    [metricsUpdatedAt, t]
  );

  useEffect(() => {
    if (viewMode === 'accounts') {
      loadAccounts();
    }
  }, [viewMode, loadAccounts]);

  useEffect(() => {
    loadMetrics(true);
    const interval = setInterval(() => loadMetrics(true), 60000);
    return () => clearInterval(interval);
  }, [loadMetrics]);

  useEffect(() => {
    if (viewMode === 'moderation') {
        const loadQueue = async () => {
            try {
                const response = await apiClient.fetchModerationQueue();
                setPendingExercises(response.queue);
                setReviewedExercises(response.recent);
                setModerationStatus(t('moderation:status.synced'));
            } catch (error) {
                // Fallback to local if server fails or auth fails (though admin should be auth'd)
                setModerationStatus(t('moderation:status.serverUnavailable'));
                const all = getExercises();
                const community = all.filter(ex => ex.isCommunitySubmitted);
                setPendingExercises(community.filter(ex => (ex.moderationStatus ?? 'approved') === 'pending'));
                setReviewedExercises(community.filter(ex => (ex.moderationStatus && ex.moderationStatus !== 'pending') || ex.moderatedAt));
            }
        };
        loadQueue();
    }
  }, [viewMode, t]);

  const formatNumber = (value: number) => value.toLocaleString();

  const metricCards = metrics
    ? [
        {
          label: t('adminDashboard.totalFeedback'),
          value: metrics.totalThanks,
          subLabel: t('adminDashboard.approvedExercises', { count: formatNumber(metrics.approvedExercises) }),
          icon: Heart,
          iconColor: 'text-rose-500',
          iconBg: 'bg-rose-50'
        },
        {
          label: t('adminDashboard.exercisesInDb'),
          value: metrics.totalExercises,
          subLabel: t('adminDashboard.pendingModeration', { count: formatNumber(metrics.pendingModeration) }),
          icon: ClipboardList,
          iconColor: 'text-indigo-600',
          iconBg: 'bg-indigo-50'
        },
        {
          label: t('adminDashboard.users'),
          value: metrics.totalUsers,
          subLabel: t('adminDashboard.userSummary', {
            active: formatNumber(metrics.activeUsers),
            pending: formatNumber(metrics.pendingUsers)
          }),
          icon: Users,
          iconColor: 'text-slate-700',
          iconBg: 'bg-slate-50'
        },
        {
          label: t('adminDashboard.contentMix'),
          value: metrics.partnerExercises + metrics.communityExercises,
          subLabel: t('adminDashboard.contentSummary', {
            partner: formatNumber(metrics.partnerExercises),
            community: formatNumber(metrics.communityExercises)
          }),
          icon: BarChart3,
          iconColor: 'text-emerald-600',
          iconBg: 'bg-emerald-50'
        }
      ]
    : [];

  const handleUpdateStatus = async (id: string, status: 'active' | 'rejected') => {
     setActionInProgress(id);
     setAccountsError(null);
     setAdminFeedback(null);
     try {
       if (status === 'active') {
         await apiClient.approvePartner(id);
       } else {
         await apiClient.rejectPartner(id);
       }
       await loadAccounts();
       setAdminFeedback({
         type: 'success',
         message: status === 'active'
           ? t('common:adminFeedback.approved')
           : t('common:adminFeedback.rejected')
       });
     } catch (error: any) {
       setAccountsError(error.message || t('adminDashboard.updateAccountError'));
       setAdminFeedback({
         type: 'error',
         message: error.message || t('common:adminFeedback.updateError')
       });
     } finally {
       setActionInProgress(null);
     }
  };

  const handleLogout = async () => {
      await apiClient.logout();
      onBack();
  };

  const handleModerationDecision = (exercise: Exercise, status: 'approved' | 'rejected', notes?: string) => {
    const moderator = 'Admin';
    const targetId = exercise.serverId ?? exercise.id;
    moderateExercise(targetId, status, {
      moderator,
      notes,
      shouldDelete: status === 'rejected'
    });

    // Refresh local view
    setPendingExercises(prev => prev.filter(ex => ex.id !== exercise.id));
    setReviewedExercises(prev => [{
        ...exercise,
        moderationStatus: status,
        moderationNotes: notes,
        moderatedBy: moderator,
        moderatedAt: new Date().toISOString()
    }, ...prev]);
  };

  if (viewMode === 'batchTranslation') {
    return <BatchTranslationPanel onBack={() => {
      if (window.history.state?.view) {
        window.history.back();
      } else {
        setViewMode('accounts');
      }
    }} />;
  }

  if (viewMode === 'moderation') {
    return (
      <ModerationPanel
        pendingExercises={pendingExercises}
        reviewedExercises={reviewedExercises}
        onApprove={(ex, notes) => handleModerationDecision(ex, 'approved', notes)}
        onReject={(ex, notes) => handleModerationDecision(ex, 'rejected', notes)}
        onBack={() => {
          if (window.history.state?.view) {
            window.history.back();
          } else {
            setViewMode('accounts');
          }
        }}
        statusNote={moderationStatus}
      />
    );
  }

  const pendingAccounts = accounts.filter(a => a.status === 'pending');
  const activeAccounts = accounts.filter(a => a.status === 'active');

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b bg-[rgba(248,245,239,0.92)] text-[var(--ndee-ink)] backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-teal-400" />
            <div>
              <p className="ndee-eyebrow">NDee</p>
              <h1 className="text-xl font-bold">{t('adminDashboard.title')}</h1>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" size="sm" onClick={() => setViewMode('batchTranslation')}>
              <Languages className="w-4 h-4 mr-2" />
              {t('adminDashboard.batchTranslations')}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setViewMode('moderation')}>
              <ClipboardList className="w-4 h-4 mr-2" />
              {t('adminDashboard.moderationContent')}
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
               <LogOut className="w-4 h-4 mr-2" />
               {t('buttons.logout')}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {adminFeedback && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              adminFeedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}
          >
            {adminFeedback.message}
          </div>
        )}

        <section className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-emerald-600" />
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">{t('adminDashboard.liveOverview')}</p>
                <h2 className="text-lg font-bold text-slate-900">{t('adminDashboard.platformMetrics')}</h2>
              </div>
            </div>
            <div className="text-xs text-slate-500">
              {metricsUpdatedAt
                ? t('adminDashboard.updatedAt', { time: new Date(metricsUpdatedAt).toLocaleTimeString() })
                : t('adminDashboard.awaitingSync')}
            </div>
          </div>

          {metricsError && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {metricsError}
            </div>
          )}

          {isLoadingMetrics && !metrics ? (
            <p className="text-slate-500 italic">{t('adminDashboard.loadingMetrics')}</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {metricCards.map(card => (
                <div key={card.label} className="p-4 border border-slate-100 rounded-xl bg-slate-50/60 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">{card.label}</p>
                    <p className="text-2xl font-bold text-slate-900">{formatNumber(card.value)}</p>
                    {card.subLabel && <p className="text-xs text-slate-500">{card.subLabel}</p>}
                  </div>
                  <div className={`p-3 rounded-lg ${card.iconBg}`}>
                    <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Pending Accounts */}
        <section className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <UserPlus className="w-6 h-6 text-amber-500" />
                    <h2 className="text-lg font-bold text-slate-900">{t('adminDashboard.pendingRegistrations', { count: pendingAccounts.length })}</h2>
                </div>
            </div>

            {accountsError && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {accountsError}
              </div>
            )}

            {isLoadingAccounts ? (
                <p className="text-slate-500 italic">{t('adminDashboard.loadingAccounts')}</p>
            ) : pendingAccounts.length === 0 ? (
                <p className="text-slate-500 italic">{t('adminDashboard.noPendingAccounts')}</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                            <tr>
                                <th className="px-4 py-3 rounded-l-lg">{t('labels.organization')}</th>
                                <th className="px-4 py-3">{t('adminDashboard.contact')}</th>
                                <th className="px-4 py-3">{t('labels.email')}</th>
                                <th className="px-4 py-3 rounded-r-lg text-right">{t('adminDashboard.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {pendingAccounts.map(acc => (
                                <tr key={acc.id}>
                                    <td className="px-4 py-3 font-medium text-slate-900">{acc.organization}</td>
                                    <td className="px-4 py-3">{acc.contactName}</td>
                                    <td className="px-4 py-3">{acc.email}</td>
                                    <td className="px-4 py-3 text-right flex justify-end gap-2">
                                        <Button size="sm" variant="ghost" className="text-rose-600 hover:bg-rose-50" onClick={() => handleUpdateStatus(acc.id, 'rejected')} disabled={actionInProgress === acc.id}>
                                            {actionInProgress === acc.id ? t('adminDashboard.processing') : t('buttons.reject')}
                                        </Button>
                                        <Button size="sm" onClick={() => handleUpdateStatus(acc.id, 'active')} disabled={actionInProgress === acc.id}>
                                            {actionInProgress === acc.id ? t('adminDashboard.saving') : t('buttons.approve')}
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>

        {/* Active Accounts */}
        <section className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
             <div className="flex items-center gap-3 mb-6">
                <Building2 className="w-6 h-6 text-teal-600" />
                <h2 className="text-lg font-bold text-slate-900">{t('adminDashboard.activePartners', { count: activeAccounts.length })}</h2>
            </div>

             {isLoadingAccounts ? (
                <p className="text-slate-500 italic">{t('adminDashboard.loadingAccounts')}</p>
             ) : activeAccounts.length === 0 ? (
                <p className="text-slate-500 italic">{t('adminDashboard.noActivePartners')}</p>
             ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {activeAccounts.map(acc => (
                        <div key={acc.id} className="p-4 border border-slate-100 rounded-xl hover:border-teal-200 transition-colors">
                            <h3 className="font-semibold text-slate-900">{acc.organization}</h3>
                            <p className="text-xs text-slate-500 mt-1">{acc.contactName}</p>
                            <p className="text-xs text-slate-400">{acc.email}</p>
                            {acc.role === 'admin' && <span className="inline-block mt-2 px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded">Admin</span>}
                        </div>
                    ))}
                </div>
             )}
        </section>
      </main>
    </div>
  );
};

// --- Main App ---

type AppView = 'onboarding' | 'dashboard' | 'detail' | 'add' | 'moderation' | 'partner' | 'admin';
type NavigationState = { view: AppView; exerciseId?: string };

const isAppView = (value: unknown): value is AppView =>
  ['onboarding', 'dashboard', 'detail', 'add', 'moderation', 'partner', 'admin'].includes(String(value));

interface AppProps {
  embeddedInSiteShell?: boolean;
  headerActionsContainer?: HTMLElement | null;
}

const App: React.FC<AppProps> = ({ embeddedInSiteShell = false, headerActionsContainer = null }) => {
  const { t } = useTranslation(['common']);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [recommendationProfile, setRecommendationProfile] = useState<RecommendationProfile | null>(null);
  const [allExercises, setAllExercises] = useState<Exercise[]>(() => getExercises());
  
  // Apply translations to exercises based on current language
  const translatedExercises = useExerciseTranslation(allExercises);
  
  const [exercises, setExercises] = useState<Exercise[]>(() =>
    getRecommendedExercises(getExercises(), null, 'All')
  );
  const [view, setView] = useState<AppView>('dashboard');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [situationFilter, setSituationFilter] = useState<Situation | 'All'>(() =>
    typeof window === 'undefined' ? 'All' : getSituationFilterFromSearch(window.location.search)
  );
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(syncService.getStatus());
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [partnerSession, setPartnerSession] = useState<PartnerAccount | null>(null);
  const [pendingAdminAction, setPendingAdminAction] = useState<'moderation' | null>(null);
  const [serverModerationData, setServerModerationData] = useState<{
    queue: Exercise[];
    reviewed: Exercise[];
  } | null>(null);
  const [moderationStatusMessage, setModerationStatusMessage] = useState<string | null>(null);
  const applyNavigationState = useCallback((state: NavigationState) => {
    if (state.view === 'detail') {
      const exercise = translatedExercises.find(item => item.id === state.exerciseId);
      if (!exercise) {
        setSelectedExercise(null);
        setView('dashboard');
        return;
      }
      setSelectedExercise(exercise);
    } else {
      setSelectedExercise(null);
    }
    setView(state.view);
  }, [translatedExercises]);

  const navigateTo = useCallback((newView: AppView, exerciseId?: string) => {
    const state: NavigationState = { view: newView, ...(exerciseId ? { exerciseId } : {}) };
    window.history.pushState(state, '', window.location.pathname);
    applyNavigationState(state);
  }, [applyNavigationState]);

  const replaceView = useCallback((newView: AppView, exerciseId?: string) => {
    const state: NavigationState = { view: newView, ...(exerciseId ? { exerciseId } : {}) };
    window.history.replaceState(state, '', window.location.pathname);
    applyNavigationState(state);
  }, [applyNavigationState]);

  useEffect(() => {
    syncService.init();
    const unsubscribeCache = syncService.subscribe(setAllExercises);
    const unsubscribeStatus = syncService.subscribeStatus(setSyncStatus);

    return () => {
      unsubscribeCache();
      unsubscribeStatus();
    };
  }, []);

  // Handle browser back button and native back gesture
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state as Partial<NavigationState> | null;
      applyNavigationState({
        view: isAppView(state?.view) ? state.view : 'dashboard',
        exerciseId: typeof state?.exerciseId === 'string' ? state.exerciseId : undefined
      });
    };

    window.addEventListener('popstate', handlePopState);

    // Handle native back button for Capacitor (Android/iOS)
    let removeBackButtonListener: (() => Promise<void>) | undefined;
    void CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (view === 'dashboard' || view === 'onboarding') {
        // Allow app to exit on dashboard or onboarding
        if (canGoBack) {
          window.history.back();
        } else {
          CapacitorApp.exitApp();
        }
      } else {
        window.history.back();
      }
    }).then(listener => {
      removeBackButtonListener = () => listener.remove();
    });

    return () => {
      window.removeEventListener('popstate', handlePopState);
      void removeBackButtonListener?.();
    };
  }, [applyNavigationState, view]);

  // Push initial history state
  useEffect(() => {
    const state = window.history.state as Partial<NavigationState> | null;
    if (!isAppView(state?.view)) window.history.replaceState({ view: 'dashboard' }, '', window.location.pathname);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkSession = async () => {
      try {
         const { user } = await apiClient.getMe();
         setPartnerSession({
            id: user.id,
            organization: user.organization,
            contactName: user.contactName,
            email: user.email,
            role: user.role,
            status: 'active'
         });
      } catch {
         setPartnerSession(null);
      }
    };

    const handleSessionEvent: EventListener = () => {
      checkSession();
    };

    checkSession();
    window.addEventListener('partner-session-change', handleSessionEvent);

    return () => {
      window.removeEventListener('partner-session-change', handleSessionEvent);
    };
  }, []);

  useEffect(() => {
    // Load initial data
    const loadedUser = getUser();
    if (loadedUser) {
      setUser(loadedUser);
    }
  }, [replaceView]);

  useEffect(() => {
    const refreshProfile = () => {
      setUser(getUser());
      void getRecommendationProfile().then(setRecommendationProfile);
    };
    refreshProfile();
    window.addEventListener('ndee-personalization-change', refreshProfile);
    return () => window.removeEventListener('ndee-personalization-change', refreshProfile);
  }, []);

  useEffect(() => {
    if (pendingAdminAction === 'moderation' && partnerSession) {
      replaceView('moderation');
      setPendingAdminAction(null);
    }
  }, [pendingAdminAction, partnerSession, replaceView]);

  useEffect(() => {
    if (view === 'partner' && partnerSession?.role === 'admin') {
      replaceView('admin');
    }
  }, [view, partnerSession, replaceView]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (view !== 'moderation') {
      setServerModerationData(null);
      setModerationStatusMessage(null);
      return;
    }

    let isCancelled = false;
    const loadQueue = async () => {
      try {
        const response = await apiClient.fetchModerationQueue();
        if (!isCancelled) {
          setServerModerationData({ queue: response.queue, reviewed: response.recent });
          setModerationStatusMessage(t('moderation:status.synced'));
        }
      } catch (error) {
        if (isCancelled) return;
        const message =
          error instanceof Error && /auth/i.test(error.message)
            ? t('moderation:status.tokenRequired')
            : t('moderation:status.serverUnavailable');
        setModerationStatusMessage(message);
        setServerModerationData(null);
      }
    };

    loadQueue();
    const interval = window.setInterval(loadQueue, 45000);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [view]);

  useEffect(() => {
    if (view !== 'dashboard') {
      setIsAdminMenuOpen(false);
    }
  }, [view]);

  useEffect(() => {
    if (!isAdminMenuOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsAdminMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdminMenuOpen]);

  // Refresh recommendations when filters or user changes
  useEffect(() => {
    const recs = getRecommendedExercises(translatedExercises, user, situationFilter, recommendationProfile);
    setExercises(recs);
  }, [translatedExercises, user, situationFilter, recommendationProfile]);

  useEffect(() => {
    if (!selectedExercise) return;
    const fresh = translatedExercises.find(ex => ex.id === selectedExercise.id);
    if (fresh && fresh !== selectedExercise) {
      setSelectedExercise(fresh);
    }
  }, [translatedExercises, selectedExercise]);

  const handleOnboardingComplete = (newUser: UserProfile) => {
    setUser(newUser);
    replaceView('dashboard');
  };

  const handleExerciseClick = (ex: Exercise) => {
    setSelectedExercise(ex);
    navigateTo('detail', ex.id);
  };

  const handleAddExercise = async (newEx: Exercise): Promise<'submitted' | 'queued'> => {
    await saveExercise(newEx);
    return syncService.getStatus().pendingMutations === 0 ? 'submitted' : 'queued';
  };

  const handleThanks = (exId: string) => incrementThanks(exId);

  const handlePartnerAccess = () => {
    // If already logged in as admin, go to admin dashboard
    if (partnerSession?.role === 'admin') {
        navigateTo('admin');
    } else {
        navigateTo('partner');
    }
    setIsAdminMenuOpen(false);
  };

  const handleModerationAccess = () => {
    if (partnerSession) {
      navigateTo('moderation');
    } else {
      setPendingAdminAction('moderation');
      navigateTo('partner');
    }
    setIsAdminMenuOpen(false);
  };

  const handleContributionAccess = () => {
    navigateTo('add');
    setIsAdminMenuOpen(false);
  };

  const showSyncStatus =
    !syncStatus.isOnline || syncStatus.pendingMutations > 0 || syncStatus.isSyncing || Boolean(syncStatus.lastError);

  const communityExercises = translatedExercises.filter(ex => ex.isCommunitySubmitted);
  const parseTimestamp = (value?: string) => (value ? Date.parse(value) : 0);
  const localPendingExercises = communityExercises.filter(
    ex => (ex.moderationStatus ?? 'approved') === 'pending'
  );
  const localReviewedExercises = communityExercises
    .filter(ex => (ex.moderationStatus && ex.moderationStatus !== 'pending') || ex.moderatedAt)
    .sort((a, b) => {
      const dateA = parseTimestamp(a.moderatedAt) || parseTimestamp(a.createdAt);
      const dateB = parseTimestamp(b.moderatedAt) || parseTimestamp(b.createdAt);
      return dateB - dateA;
    })
    .slice(0, 8);
  const effectivePendingExercises = serverModerationData?.queue ?? localPendingExercises;
  const effectiveReviewedExercises = serverModerationData?.reviewed ?? localReviewedExercises;
  const displayPendingCount = effectivePendingExercises.length;

  const handleModerationDecision = (exercise: Exercise, status: 'approved' | 'rejected', notes?: string) => {
    const moderator = user?.name || 'Équipe NDee';
    const targetId = exercise.serverId ?? exercise.id;
    moderateExercise(targetId, status, {
      moderator,
      notes,
      shouldDelete: status === 'rejected'
    });
  };

  const handleSituationFilterChange = useCallback((filter: Situation | 'All') => {
    setSituationFilter(filter);
    const search = new URLSearchParams(window.location.search);
    if (filter === 'All') search.delete('situation');
    else search.set('situation', filter);
    const query = search.toString();
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
  }, []);

  // Render Helpers
  if (view === 'admin') {
      return <AdminDashboard onBack={() => {
        window.history.back();
      }} />;
  }

  if (view === 'partner') {
    return <PartnerPortal onBack={() => {
      window.history.back();
    }} />;
  }

  if (view === 'moderation') {
    return (
      <ModerationPanel
        pendingExercises={effectivePendingExercises}
        reviewedExercises={effectiveReviewedExercises}
        onApprove={(exercise, notes) => handleModerationDecision(exercise, 'approved', notes)}
        onReject={(exercise, notes) => handleModerationDecision(exercise, 'rejected', notes)}
        onBack={() => {
          window.history.back();
        }}
        statusNote={moderationStatusMessage}
      />
    );
  }

  if (view === 'onboarding') {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  if (view === 'detail' && selectedExercise) {
    return (
      <ExerciseDetail 
        exercise={selectedExercise} 
        onBack={() => {
          window.history.back();
        }}
        onThanks={() => handleThanks(selectedExercise.id)}
      />
    );
  }

  if (view === 'add') {
    return (
      <AddExerciseForm 
        onCancel={() => {
          window.history.back();
        }} 
        onSubmit={handleAddExercise} 
      />
    );
  }

  // Dashboard View
  return (
    <Dashboard
      user={user}
      recommendationProfile={recommendationProfile}
      exercises={exercises}
      situationFilter={situationFilter}
      onFilterChange={handleSituationFilterChange}
      onExerciseClick={handleExerciseClick}
      onAddTechnique={handleContributionAccess}
      onPartnerAccess={handlePartnerAccess}
      syncStatus={syncStatus}
      showSyncStatus={showSyncStatus}
      partnerSession={partnerSession}
      isAdminMenuOpen={isAdminMenuOpen}
      onOpenAdminMenu={() => setIsAdminMenuOpen(true)}
      onCloseAdminMenu={() => setIsAdminMenuOpen(false)}
      embeddedInSiteShell={embeddedInSiteShell}
      headerActionsContainer={headerActionsContainer}
    />
  );

};

export default App;
