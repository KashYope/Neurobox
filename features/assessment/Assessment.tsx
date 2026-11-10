import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Camera, Download, Sparkles } from 'lucide-react';
import QRCode from 'qrcode';
import { ExerciseCard } from '../../components/exercises/ExerciseCard';
import { getExercises, getRecommendedExercises, getRecommendationReasons } from '../../services/dataService';
import { syncService } from '../../services/syncService';
import { useExerciseTranslation } from '../../hooks/useExerciseTranslation';
import { useTranslation } from '../../src/i18nContext';
import { clearAssessmentProgress, getAssessmentProgress, saveAssessmentProgress, getRecommendationProfile, saveRecommendationProfile } from '../../services/storage/offlineDb';
import { AssessmentLocale, AssessmentModule, REFLECTION_QUESTIONS, DOMAINS, QUESTION_BY_ID, calculateReflectionReport, buildRecommendationProfile, answerFingerprint } from './model';
import { progressSummary, continueProfile, commitProfileAnswer, themeNumber, previousProfileQuestion, createAnswerTransition } from './experience';
import { AssessmentProgress, createProgress, beginModule } from './progress';
import { ProfileRadar } from './ProfileRadar';
import { ScoreRow } from './ScoreRow';
import { getDomainGuidance, getDomainInsights, resultCopy } from './resources';
import { LEGACY_QUESTIONS, calculateLegacyReport } from './legacyModel';
import { applyImport, decodeTransfer, encodeTransfer } from './transfer';
import { getCopy, getExperienceCopy, METHOD_SOURCES, scaleOptions } from './copy';
import { SUBSCALE_LABELS } from './subscaleLabels';
import { AssessmentDialog, QrScanner } from './AssessmentDialog';

interface AssessmentProps {
  locale: AssessmentLocale;
  onBack: () => void;
  onOpenToolbox: () => void;
  onOpenExercise: (id: string) => void;
  onPersonalized: () => void;
  resumeOnOpen?: boolean;
}
const buttonBase = 'ndee-focus min-h-11 rounded-xl border px-4 py-3 text-sm font-semibold disabled:opacity-40';
const button = `${buttonBase} bg-white/75`;
const primary = `${buttonBase} bg-[var(--ndee-primary)] text-white`;
const surface = 'ndee-surface rounded-2xl p-5 sm:p-6';

export const Assessment: React.FC<AssessmentProps> = ({ locale, onBack, onOpenToolbox, onOpenExercise, onPersonalized, resumeOnOpen = false }) => {
  const t = getCopy(locale);
  const ux = getExperienceCopy(locale, progressSummary(null).minutes, DOMAINS.length);
  const { t: translate } = useTranslation(['common']);
  const [catalogue, setCatalogue] = useState(getExercises);
  const translatedCatalogue = useExerciseTranslation(catalogue);
  const [progress, setProgress] = useState<AssessmentProgress | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selection, setSelection] = useState<{ questionId: string; score: number } | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [includeContext, setIncludeContext] = useState(false);
  const [modal, setModal] = useState<'qr' | 'scan' | null>(null);
  const [qrData, setQrData] = useState('');
  const [importText, setImportText] = useState('');
  const [reviewFilter, setReviewFilter] = useState<{ domain?: AssessmentModule; subscale?: string }>({});
  const [loadAttempt, setLoadAttempt] = useState(0);
  const alive = useRef(true);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let disposed = false;
    setLoadFailed(false);
    void Promise.all([getAssessmentProgress(), getRecommendationProfile()]).then(([saved, profile]) => {
      if (disposed) return;
      const value = saved && resumeOnOpen && saved.acknowledged ? continueProfile(saved) : saved ?? createProgress(locale);
      setProgress(value); setAcknowledged(value.acknowledged); setHasProfile(!!profile);
    }).catch(() => { if (!disposed) setLoadFailed(true); });
    return () => { disposed = true; };
  }, [loadAttempt, resumeOnOpen]);

  useEffect(() => {
    const refresh = () => { void getRecommendationProfile().then(profile => setHasProfile(!!profile)).catch(() => undefined); };
    window.addEventListener('ndee-personalization-change', refresh);
    return () => window.removeEventListener('ndee-personalization-change', refresh);
  }, []);

  useEffect(() => {
    if (progress?.stage !== 'results') return;
    const unsubscribe = syncService.subscribe(() => setCatalogue(getExercises()));
    void syncService.init();
    return unsubscribe;
  }, [progress?.stage]);

  const current = progress ? QUESTION_BY_ID.get(progress.currentQuestionId)! : REFLECTION_QUESTIONS[0];
  const storedScore = progress?.answers.find(answer => answer.questionId === current.id)?.score;
  // Lier le brouillon à son identifiant dès le rendu : aucune réponse ne fuit vers la question suivante.
  const selected = selection?.questionId === current.id ? selection.score : storedScore ?? null;
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [progress?.stage, current.id]);
  const report = useMemo(() => calculateReflectionReport(progress?.answers ?? []), [progress?.answers]);
  const fingerprint = useMemo(() => answerFingerprint(progress?.answers ?? []), [progress?.answers]);

  const transition = useMemo(() => createAnswerTransition(async value => {
    await saveAssessmentProgress(value);
    window.dispatchEvent(new Event('ndee-assessment-change'));
  }, value => {
    setSelection(null); setProgress(value); setSavedNotice(true);
  }), []);
  useEffect(() => { alive.current = true; transition.activate(); return () => { alive.current = false; transition.dispose(); }; }, [transition]);
  useEffect(() => {
    if (!savedNotice) return;
    const timeout = window.setTimeout(() => setSavedNotice(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [savedNotice, progress?.updatedAt]);

  const persist = async (next: AssessmentProgress): Promise<boolean> => {
    if (busyRef.current) return false;
    busyRef.current = true; setBusy(true); setError(''); setNotice('');
    try {
      return await transition.submit({ ...next, locale, updatedAt: new Date().toISOString() });
    } catch { if (alive.current) setError(t.storageError); return false; }
    finally { busyRef.current = false; if (alive.current) setBusy(false); }
  };

  const answer = (score: number) => {
    if (busyRef.current || !progress) return;
    setSelection({ questionId: current.id, score });
    if (!progress.returnToResults) void persist(commitProfileAnswer(progress, score));
  };

  const reset = async () => {
    if (busyRef.current || !window.confirm(t.resetConfirm)) return;
    busyRef.current = true; setBusy(true);
    try {
      await clearAssessmentProgress(); setProgress(createProgress(locale)); setLoadFailed(false); setAcknowledged(false);
      setSelection(null); setError(''); setNotice(''); setQrData(''); setIncludeContext(false); window.dispatchEvent(new Event('ndee-assessment-change'));
    } catch { setError(t.storageError); }
    finally { busyRef.current = false; setBusy(false); }
  };

  const importValue = async (value: string): Promise<boolean> => {
    if (!progress || busyRef.current) return false;
    try {
      const imported = decodeTransfer(value);
      const conflicts = imported.kind === 'full' && imported.answers.some(answer => progress.answers.some(local => local.questionId === answer.questionId && local.score !== answer.score));
      if (conflicts && !window.confirm(t.importConflict)) { setModal(null); return false; }
      if (await persist(applyImport(progress, imported))) { setModal(null); setImportText(''); setNotice(t.importSuccess); return true; }
    } catch { setError(t.invalidQr); }
    return false;
  };

  const exportQr = async () => {
    if (!progress) return;
    setError('');
    try { setQrData(await QRCode.toDataURL(encodeTransfer(progress.answers, includeContext), { width: 640, margin: 4, errorCorrectionLevel: 'M' })); setModal('qr'); }
    catch { setError(t.exportError); }
  };
  const downloadPdf = async () => {
    if (!progress || busyRef.current) return;
    busyRef.current = true; setBusy(true); setError('');
    try {
      const { createAssessmentPdf } = await import('./exportPdf');
      const doc = await createAssessmentPdf(progress.answers, locale, includeContext);
      doc.save(`ndee-reflection-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch { setError(t.exportError); }
    finally { busyRef.current = false; setBusy(false); }
  };

  const personalize = async () => {
    if (!progress || busyRef.current) return;
    busyRef.current = true; setBusy(true); setError('');
    try {
      await saveRecommendationProfile(buildRecommendationProfile(report));
      const value = { ...progress, personalizedFingerprint: fingerprint, updatedAt: new Date().toISOString() };
      await saveAssessmentProgress(value);
      setProgress(value); setHasProfile(true); onPersonalized(); setNotice(t.personalized);
    } catch { setError(t.storageError); }
    finally { busyRef.current = false; setBusy(false); }
  };

  const moduleLabel = (module: AssessmentModule) => module === 'context' ? t.context : t.domains[module];
  const openReview = (domain?: AssessmentModule, subscale?: string) => {
    if (!progress) return;
    setReviewFilter({ domain, subscale }); void persist({ ...progress, stage: 'review' });
  };
  const leave = async () => {
    if (!progress) return;
    // Une sélection clavier non confirmée reste un brouillon.
    const next = progress;
    if (await persist(next)) onBack();
  };

  if (!progress || loadFailed) return <main className="mx-auto max-w-3xl px-4 py-12"><div className={surface}>
    <h1 className="text-2xl font-semibold">{loadFailed ? t.loadError : t.loading}</h1>
    {loadFailed && <div className="mt-6 flex flex-wrap gap-3"><button className={button} onClick={() => setLoadAttempt(value => value + 1)}>{t.retry}</button><button disabled={busy} className={button} onClick={() => void reset()}>{t.reset}</button></div>}
    {error && <p role="alert">{error}</p>}
  </div></main>;

  const personalized = hasProfile && progress.personalizedFingerprint === fingerprint;
  const suggestionProfile = personalized ? buildRecommendationProfile(report) : null;
  const suggestions = getRecommendedExercises(translatedCatalogue, null, 'All', suggestionProfile).slice(0, 3);
  const summary = progressSummary(progress);
  const themeSummary = progressSummary(progress, current.domain);
  const resume = () => void persist(continueProfile(progress));

  const method = <details className="mt-5 rounded-2xl border bg-white/55 p-4"><summary className="cursor-pointer font-semibold">{t.methods}</summary><p className="mt-3 text-sm leading-relaxed">{t.methodsDetail}</p><ul className="mt-4 space-y-2 text-sm">{METHOD_SOURCES.map(source => <li key={source.href}><a href={source.href} target="_blank" rel="noreferrer" className="underline">{source.label}</a></li>)}</ul></details>;
  const title = progress.stage === 'intro' ? ux.introduction : progress.stage === 'modules' ? ux.profile : progress.stage === 'questions' ? current.text[locale] : progress.stage === 'break' ? t.breakTitle : progress.stage === 'archives' ? t.archiveTitle : progress.stage === 'review' ? t.review : ux.profile;

  return <main className={`ndee-container py-8 sm:py-12 ${progress.stage === 'questions' ? 'ndee-question-layout' : ''}`}>
    {progress.stage === 'questions' && <aside className="ndee-question-sidebar" aria-label={ux.profile}><p className="ndee-eyebrow">{ux.profile}</p><p className="mt-3 font-semibold">{current.domain === 'context' ? ux.context : `${ux.theme} ${themeNumber(current.domain)} / ${DOMAINS.length} · ${moduleLabel(current.domain)}`}</p><progress aria-label={ux.profile} className="mt-4 h-2 w-full" value={summary.percent} max={100} /><p className="mt-2 text-sm">{summary.percent} % · ≈ {summary.minutes} {ux.remaining}</p><p className="mt-3 text-sm text-[var(--ndee-muted)]">{translate('ux.privacyShort')}</p></aside>}
    <div className="ndee-question-content">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      {progress.stage !== 'questions' && <button disabled={busy} onClick={() => void leave()} className={button}><ArrowLeft className="mr-2 inline h-4 w-4" />{translate('ux.now')}</button>}
      <span role="status" aria-live="polite" className="min-h-6 text-sm text-[var(--ndee-muted)]">{busy ? t.saving : savedNotice ? ux.saved : ''}</span>
    </div>
    {error && <p role="alert" className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900">{error}</p>}
    {notice && <p role="status" className="mb-5 rounded-2xl bg-[var(--ndee-sage)] p-4">{notice}</p>}
    <fieldset disabled={busy} className="min-w-0">
      <h1 ref={heading} tabIndex={-1} className="mb-5 text-2xl font-semibold leading-snug outline-none sm:text-3xl">{title}</h1>

      {progress.stage === 'intro' && <section className="ndee-intro-layout">
        <div><p className="text-lg leading-relaxed">{t.subtitle}</p><p className="mt-4 font-semibold">{ux.duration}</p>
          {progress.answers.length > 0 && <p className="mt-3">{summary.percent} % · ≈ {summary.minutes} {ux.remaining}</p>}
          <label className="mt-6 flex min-h-11 items-center gap-3"><input type="checkbox" className="h-5 w-5" checked={acknowledged} onChange={event => setAcknowledged(event.target.checked)} />{ux.understood}</label>
          <button disabled={!acknowledged} className={`${primary} mt-4`} onClick={() => void persist(continueProfile({ ...progress, acknowledged: true }))}>{summary.complete ? ux.profile : progress.answers.length ? ux.resume : ux.start}</button>
          <button disabled={!acknowledged} className={`${button} mt-4 ml-3`} onClick={() => void persist({ ...progress, acknowledged: true, stage: 'modules' })}>{ux.choose}</button>
          <details className="mt-6"><summary className="ndee-focus cursor-pointer py-3 text-sm">{ux.already}</summary><button className={`${button} mt-3`} onClick={() => setModal('scan')}><Camera className="mr-2 inline h-4 w-4" />{ux.import}</button></details>
          {progress.archives.length > 0 && <button className={`${button} mt-4`} onClick={() => void persist({ ...progress, stage: 'archives' })}>{t.archiveTitle}</button>}
        </div>
        <div><div className="space-y-3 border-l-4 border-[var(--ndee-primary)] pl-5 text-sm leading-relaxed"><p>{translate('ux.privacyShort')}</p><p>{translate('ux.noDiagnosis')}</p></div>{method}</div>
      </section>}

      {progress.stage === 'modules' && <>
        <p className="mb-4">{summary.percent} % · ≈ {summary.minutes} {ux.remaining}</p>
        <button className={`${primary} mb-6`} onClick={resume}>{summary.complete ? ux.profile : ux.resume}</button>
        {summary.completed > 0 && <button className={`${button} mb-6 ml-3`} onClick={() => void persist({ ...progress, stage: 'results' })}>{translate('ux.viewProfile')}</button>}
        <div className="divide-y">{DOMAINS.map((module, index) => {
          const item = progressSummary(progress, module);
          return <button key={module} className="ndee-focus flex w-full items-center gap-4 py-5 text-left" onClick={() => void persist(beginModule(progress, module))}>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--ndee-sage)]">{index + 1}</span>
            <span className="flex-1"><span className="block text-lg font-semibold">{moduleLabel(module)}</span><span className="mt-2 block text-sm text-[var(--ndee-muted)]">{item.complete ? ux.complete : item.completed ? `${ux.partial} · ${item.percent} % · ≈ ${item.minutes} ${ux.remaining}` : `${ux.empty} · ≈ ${item.minutes} ${ux.minutes}`}</span><progress aria-label={moduleLabel(module)} value={item.percent} max={100} className="mt-3 h-2 w-full" /></span>
          </button>;
        })}</div>
        <details className="mt-6"><summary className="ndee-focus cursor-pointer py-3">{ux.context} · {ux.optional}</summary><p className="mt-2 text-sm">{t.contextHint}</p><button className={`${button} mt-4`} onClick={() => void persist(beginModule(progress, 'context'))}>{ux.start}</button></details>
      </>}

      {progress.stage === 'questions' && <section>
        <p className="mb-5 text-sm text-[var(--ndee-muted)]">{current.domain === 'context' ? ux.optional : `${moduleLabel(current.domain)} · ${themeSummary.percent} % · ≈ ${themeSummary.minutes} ${ux.remaining}`}</p>
        {current.id === 'INT_04' && <p className="mb-5 rounded-xl bg-[var(--ndee-peach)] p-4 text-sm">{t.crisisHelp}</p>}
        <fieldset className="ndee-answer-scale" style={{ '--answer-count': scaleOptions(current.scale, locale).length } as React.CSSProperties} aria-describedby="answer-instructions"><legend className="sr-only">{current.text[locale]}</legend>{scaleOptions(current.scale, locale).map(option => <label key={option.value} className={`ndee-answer flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm ${selected === option.value ? 'border-[var(--ndee-primary)] bg-[var(--ndee-sage)] font-semibold' : 'bg-white/60'}`}>
          <input type="radio" name={`answer-${current.id}`} value={option.value} checked={selected === option.value}
            onChange={() => setSelection({ questionId: current.id, score: option.value })}
            onClick={() => answer(option.value)}
            onKeyDown={event => {
              if (event.repeat && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); return; }
              if (['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'].includes(event.key)) {
                event.preventDefault();
                const options = scaleOptions(current.scale, locale);
                const direction = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
                const index = options.findIndex(item => item.value === option.value);
                const next = options[(index + direction + options.length) % options.length];
                setSelection({ questionId: current.id, score: next.value });
                (event.currentTarget.closest('fieldset')?.querySelector(`input[value="${next.value}"]`) as HTMLInputElement | null)?.focus();
              } else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); answer(option.value); }
            }}
            className="h-5 w-5 shrink-0 accent-[var(--ndee-primary)]" />{option.label}
        </label>)}</fieldset>
        <div id="answer-instructions" className="mt-3 space-y-1 text-sm text-[var(--ndee-muted)]"><p>{progress.returnToResults ? t.validateFirst : ux.next}</p><p>{progress.returnToResults ? ux.keyboardReview : ux.keyboard}</p></div>
        {error && selected !== null && !progress.returnToResults && <button className={`${primary} mt-4`} onClick={() => answer(selected)}>{ux.retry}</button>}
        {current.domain === 'context' && <button className="ndee-focus mt-4 min-h-11 rounded-xl px-2 underline" onClick={() => void persist(commitProfileAnswer(progress, null))}>{ux.skip}</button>}
        <div className="mt-7 flex items-start justify-between gap-3 border-t pt-5">
          <button className={button} onClick={() => void persist(progress.returnToResults ? { ...progress, returnToResults: false, stage: 'results' } : previousProfileQuestion(progress))}>{progress.returnToResults ? t.closeReview : t.previous}</button>
          {progress.returnToResults ? <button className={primary} disabled={selected === null} onClick={() => selected !== null && void persist(commitProfileAnswer(progress, selected))}>{t.saveEdit}</button> : <details><summary className="ndee-focus min-h-11 cursor-pointer rounded-xl border bg-white px-4 py-3 text-sm">{ux.options}</summary><div className="mt-2 grid gap-2"><button className={button} onClick={() => void persist({ ...progress, stage: 'modules' })}>{ux.choose}</button><button className={button} onClick={() => void leave()}>{ux.quit}</button></div></details>}
        </div>
      </section>}

      {progress.stage === 'break' && <section className={surface}><p>{t.breakText}</p><button className={`${primary} mt-6`} onClick={() => void persist({ ...progress, stage: progress.afterBreakStage })}>{t.continue}</button></section>}

      {progress.stage === 'results' && <>
        {!summary.complete && <section className="mb-6 border-l-4 border-[var(--ndee-primary)] pl-5">
          <h2 className="text-lg font-semibold">{ux.profileProgress}</h2>
          <p className="mt-2 text-sm">{summary.percent} % · ≈ {summary.minutes} {ux.remaining}{summary.theme ? ` · ${moduleLabel(summary.theme)}` : ''}</p>
          <button className={`${primary} mt-4`} onClick={resume}>{ux.resume}</button>
        </section>}
        <p className="mb-6">{ux.results} <strong>{report.complete ? t.complete : t.partial}</strong></p>
        <ProfileRadar report={report} locale={locale} labels={t.domains} />
        <p className="mb-5 text-sm leading-relaxed text-[var(--ndee-muted)]">{resultCopy[locale].resourcesNote}</p>
        <div className="space-y-4">{report.domains.filter(domain => domain.answered > 0).map(domain => <section key={domain.domain} className={surface}>
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">{t.domains[domain.domain]}</h2><span className="text-sm">{domain.score === null ? t.empty : t.bands[domain.band!]}</span></div>
          <p className="mt-2 text-sm">{domain.score === null ? t.empty : domain.complete ? t.complete : t.partial}</p>
          <details open className="mt-4"><summary className="ndee-focus cursor-pointer py-3 font-semibold">{t.details}</summary><p className="mt-3 text-sm">{domain.score === null ? t.empty : `${domain.score} % · ${domain.answered}/${domain.total}`}</p><div className="mt-3 space-y-2">{domain.subscales.map(subscale => <ScoreRow key={subscale.id} label={SUBSCALE_LABELS[locale][subscale.id]} detail={`${subscale.answered}/${subscale.total} · ${subscale.score === null ? t.empty : subscale.complete ? t.complete : t.partial}`} score={subscale.score} onClick={() => openReview(domain.domain, subscale.id)} />)}</div></details>
          <div className="mt-6 space-y-4 border-t pt-5 text-sm leading-relaxed">
            <div><h3 className="font-semibold">{resultCopy[locale].advice}</h3><p className="mt-1">{getDomainGuidance(domain.domain, locale).advice}</p></div>
            <div className="border-l-4 border-[var(--ndee-primary)] pl-4"><h3 className="font-semibold">{resultCopy[locale].tip}</h3><p className="mt-1">{getDomainGuidance(domain.domain, locale).tip}</p></div>
            <div><h3 className="font-semibold">{resultCopy[locale].strategies}</h3><ul className="mt-2 list-disc space-y-2 pl-5">{getDomainInsights(domain.domain, locale).tips.map(tip => <li key={tip}>{tip}</li>)}</ul></div>
            <details><summary className="ndee-focus cursor-pointer py-3 font-semibold">{resultCopy[locale].more}</summary><div className="mt-3 space-y-5">
              <div><h3 className="font-semibold">{resultCopy[locale].guides}</h3><ul className="mt-2 list-disc space-y-3 pl-5">{getDomainInsights(domain.domain, locale).guides.map(guide => <li key={guide}>{guide}</li>)}</ul></div>
              <div><h3 className="font-semibold">{resultCopy[locale].strengths}</h3><p className="mt-1 text-[var(--ndee-muted)]">{resultCopy[locale].strengthsNote}</p><ul className="mt-2 list-disc space-y-2 pl-5">{getDomainInsights(domain.domain, locale).strengths.map(strength => <li key={strength}>{strength}</li>)}</ul></div>
              <div><h3 className="font-semibold">{resultCopy[locale].tools}</h3><ul className="mt-2 list-disc space-y-2 pl-5">{getDomainInsights(domain.domain, locale).tools.map(tool => <li key={tool}>{tool}</li>)}</ul></div>
            </div></details>
            <div><h3 className="font-semibold">{resultCopy[locale].reading}</h3><ul className="mt-2 space-y-1">{getDomainGuidance(domain.domain, locale).reading.map(resource => <li key={resource.href}><a className="ndee-focus inline-flex min-h-11 items-center rounded-lg py-2 underline underline-offset-4" href={resource.href} target="_blank" rel="noreferrer">{resource.title} ({resultCopy[locale].english})<span className="sr-only"> · {locale === 'fr' ? 'nouvel onglet' : 'new tab'}</span></a></li>)}</ul></div>
          </div>
          <button className={`${button} mt-4`} onClick={() => openReview(domain.domain)}>{t.viewAnswers}</button>
        </section>)}</div>
        <section className={`${surface} mt-6`}><h2 className="text-xl font-semibold">{ux.help}</h2><div className="ndee-exercise-grid mt-5 gap-4">{suggestions.map(exercise => <ExerciseCard key={exercise.id} exercise={exercise} reasons={getRecommendationReasons(exercise, suggestionProfile)} onClick={() => onOpenExercise(exercise.id)} />)}</div><p className="mt-3 text-sm">{t.personalizationHint}</p>
          {report.needs.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{report.needs.slice(0, 8).map(item => <span key={item.need} className="rounded-full bg-[var(--ndee-sage)] px-3 py-2 text-sm">{translate(`supportNeeds.${item.need}`)}</span>)}</div>}
          {!report.domains.some(domain => domain.complete) ? <p className="mt-4 text-sm">{t.finishModule}</p> : personalized ? <p className="mt-4 font-semibold">{t.personalized}</p> : <><p className="mt-4 text-sm">{hasProfile ? t.changed : t.privacy}</p><button className={`${primary} mt-4`} onClick={() => void personalize()}><Sparkles className="mr-2 inline h-4 w-4" />{hasProfile ? t.updatePersonalization : t.personalize}</button></>}
          <button className={`${button} mt-4 ml-2`} onClick={onOpenToolbox}>{t.openToolbox}</button>
        </section>
        {method}
        <details className="mt-6 border-t pt-3"><summary className="ndee-focus cursor-pointer py-3 font-semibold">{ux.transfer}</summary><div className="py-4"><label className="flex items-start gap-3"><input className="mt-1 h-5 w-5" type="checkbox" checked={includeContext} onChange={event => setIncludeContext(event.target.checked)} />{t.includeContext}</label><p className="mt-3 text-sm">{t.exportHint}</p><div className="mt-5 flex flex-wrap gap-3"><button className={button} onClick={() => void downloadPdf()}><Download className="mr-2 inline h-4 w-4" />{t.download}</button><button className={button} onClick={() => void exportQr()}>{t.qr}</button><button className={button} onClick={() => setModal('scan')}>{t.scan}</button></div></div></details>
        <details className="mt-3 border-t pt-3"><summary className="ndee-focus cursor-pointer py-3 font-semibold">{ux.manage}</summary><div className="mt-3 flex flex-wrap gap-3"><button className={button} onClick={() => openReview()}>{t.review}</button><button className={button} onClick={() => void persist({ ...progress, stage: 'modules' })}>{ux.choose}</button><button className={button} onClick={() => void persist({ ...progress, stage: 'archives' })}>{t.archiveTitle}</button><button className={`${button} text-[var(--ndee-danger)]`} onClick={() => void reset()}>{t.reset}</button></div></details>
      </>}

      {progress.stage === 'review' && <><div className="mb-5 flex flex-wrap gap-3"><button className={button} onClick={() => void persist({ ...progress, stage: 'results' })}>{t.closeReview}</button>{reviewFilter.domain && <button className={button} onClick={() => setReviewFilter({})}>{t.allAnswers}</button>}</div>
        <div className="space-y-3">{REFLECTION_QUESTIONS.filter(question => (!reviewFilter.domain || question.domain === reviewFilter.domain) && (!reviewFilter.subscale || question.subscale === reviewFilter.subscale)).map(question => {
          const answer = progress.answers.find(item => item.questionId === question.id);
          const label = answer ? scaleOptions(question.scale, locale).find(option => option.value === answer.score)!.label : progress.skippedContext.includes(question.id) ? t.skipped : t.empty;
          return <button key={question.id} className={`${button} flex w-full flex-col gap-3 p-5 text-left sm:flex-row sm:items-center sm:justify-between`} onClick={() => void persist({ ...progress, currentQuestionId: question.id, stage: 'questions', returnToResults: true })}><span>{question.text[locale]}</span><strong className="shrink-0 rounded-xl bg-[var(--ndee-lilac)] p-2 text-sm">{label}</strong></button>;
        })}</div>
      </>}

      {progress.stage === 'archives' && <><p className="mb-5">{t.archiveHint}</p><button className={`${button} mb-5`} onClick={() => void persist({ ...progress, stage: progress.acknowledged ? 'results' : 'intro' })}>{progress.acknowledged ? t.closeReview : t.continue}</button>
        {!progress.archives.length && <p>{t.archiveEmpty}</p>}
        <div className="space-y-5">{progress.archives.map(archive => <details key={archive.id} className={surface}><summary className="cursor-pointer font-semibold">{t.archiveDate} {new Date(archive.updatedAt).toLocaleDateString(locale)} · {archive.answers.length}/30</summary><div className="mt-4 grid gap-3 sm:grid-cols-2">{calculateLegacyReport(archive.answers).domains.map(domain => <p key={domain.domain}>{t.domains[domain.domain]} : {domain.score}% · {t.bands[domain.band]}</p>)}</div><div className="mt-5 space-y-3">{LEGACY_QUESTIONS.map(question => { const answer = archive.answers.find(item => item.questionId === question.id); return <p key={question.id} className="border-t pt-3 text-sm">{question.text[locale]} <strong>{answer ? t.oldScale[answer.score] : t.empty}</strong></p>; })}</div></details>)}</div>
      </>}
    </fieldset>
    </div>
    {modal && <AssessmentDialog title={modal === 'qr' ? t.qr : t.scan} closeLabel={t.close} onClose={() => setModal(null)}>
      {modal === 'qr' ? <><img src={qrData} alt={t.qr} className="mx-auto w-full max-w-sm" /><p className="mt-3 text-sm">{includeContext ? t.contextIncluded : t.contextExcluded}</p><p className="mt-3 text-sm">{t.exportHint}</p></> : <>
        <QrScanner locale={locale} onScan={importValue} />
        <details className="mt-5"><summary className="cursor-pointer font-semibold">{t.importText}</summary><label className="sr-only" htmlFor="assessment-import">{t.importText}</label><textarea id="assessment-import" className="ndee-focus mt-3 min-h-24 w-full rounded-xl border p-3" value={importText} onChange={event => setImportText(event.target.value)} /><button disabled={busy || !importText.trim()} className={`${button} mt-3`} onClick={() => void importValue(importText.trim())}>{t.importButton}</button></details>
        {error && <p role="alert" className="mt-4 text-rose-800">{error}</p>}
      </>}
    </AssessmentDialog>}
  </main>;
};
