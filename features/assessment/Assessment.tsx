import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Camera, Download, LockKeyhole, Sparkles } from 'lucide-react';
import QRCode from 'qrcode';
import { useTranslation } from '../../src/i18nContext';
import { clearAssessmentProgress, getAssessmentProgress, saveAssessmentProgress, getRecommendationProfile, saveRecommendationProfile } from '../../services/storage/offlineDb';
import { AssessmentLocale, AssessmentModule, REFLECTION_QUESTIONS, CONTEXT_IDS, DOMAINS, QUESTION_BY_ID, calculateReflectionReport, buildRecommendationProfile, answerFingerprint } from './model';
import { AssessmentProgress, createProgress, beginModule, changeMode, commitAnswer, skipContext, previousQuestion } from './progress';
import { LEGACY_QUESTIONS, calculateLegacyReport } from './legacyModel';
import { applyImport, decodeTransfer, encodeTransfer } from './transfer';
import { getCopy, METHOD_SOURCES, scaleOptions } from './copy';
import { SUBSCALE_LABELS } from './subscaleLabels';
import { AssessmentDialog, QrScanner } from './AssessmentDialog';

interface AssessmentProps {
  locale: AssessmentLocale;
  onBack: () => void;
  onOpenToolbox: () => void;
  onPersonalized: () => void;
}
const button = 'ndee-focus min-h-11 rounded-2xl border bg-white/75 px-4 py-3 text-sm font-semibold disabled:opacity-40';
const primary = `${button} bg-[var(--ndee-primary)] text-white`;
const surface = 'ndee-surface rounded-3xl p-6 sm:p-8';

export const Assessment: React.FC<AssessmentProps> = ({ locale, onBack, onOpenToolbox, onPersonalized }) => {
  const t = getCopy(locale);
  const { t: translate } = useTranslation(['common']);
  const [progress, setProgress] = useState<AssessmentProgress | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
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
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let disposed = false;
    setLoadFailed(false);
    void Promise.all([getAssessmentProgress(), getRecommendationProfile()]).then(([saved, profile]) => {
      if (disposed) return;
      const value = saved ?? createProgress(locale);
      setProgress(value); setAcknowledged(value.acknowledged); setHasProfile(!!profile);
    }).catch(() => { if (!disposed) setLoadFailed(true); });
    return () => { disposed = true; };
  }, [loadAttempt]);

  useEffect(() => {
    const refresh = () => { void getRecommendationProfile().then(profile => setHasProfile(!!profile)).catch(() => undefined); };
    window.addEventListener('ndee-personalization-change', refresh);
    return () => window.removeEventListener('ndee-personalization-change', refresh);
  }, []);

  const current = progress ? QUESTION_BY_ID.get(progress.currentQuestionId)! : REFLECTION_QUESTIONS[0];
  const storedScore = progress?.answers.find(answer => answer.questionId === current.id)?.score;
  // Lier le brouillon à son identifiant dès le rendu : aucune réponse ne fuit vers la question suivante.
  const selected = selection?.questionId === current.id ? selection.score : storedScore ?? null;
  useEffect(() => { heading.current?.focus(); }, [progress?.stage, current.id]);
  const report = useMemo(() => calculateReflectionReport(progress?.answers ?? []), [progress?.answers]);
  const fingerprint = useMemo(() => answerFingerprint(progress?.answers ?? []), [progress?.answers]);

  const persist = async (next: AssessmentProgress): Promise<boolean> => {
    if (busyRef.current) return false;
    busyRef.current = true; setBusy(true); setError(''); setNotice('');
    try {
      const value = { ...next, locale, updatedAt: new Date().toISOString() };
      await saveAssessmentProgress(value);
      setSelection(null);
      setProgress(value);
      return true;
    } catch { setError(t.storageError); return false; }
    finally { busyRef.current = false; setBusy(false); }
  };

  const reset = async () => {
    if (busyRef.current || !window.confirm(t.resetConfirm)) return;
    busyRef.current = true; setBusy(true);
    try {
      await clearAssessmentProgress(); setProgress(createProgress(locale)); setLoadFailed(false); setAcknowledged(false);
      setSelection(null); setError(''); setNotice(''); setQrData(''); setIncludeContext(false);
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
    const next = progress.stage === 'questions' && selected !== null && selected !== storedScore ? commitAnswer(progress, selected) : progress;
    if (await persist(next)) onBack();
  };

  if (!progress || loadFailed) return <main className="mx-auto max-w-3xl px-4 py-12"><div className={surface}>
    <h1 className="text-2xl font-bold">{loadFailed ? t.loadError : t.loading}</h1>
    {loadFailed && <div className="mt-6 flex flex-wrap gap-3"><button className={button} onClick={() => setLoadAttempt(value => value + 1)}>{t.retry}</button><button disabled={busy} className={button} onClick={() => void reset()}>{t.reset}</button></div>}
    {error && <p role="alert">{error}</p>}
  </div></main>;

  const personalized = hasProfile && progress.personalizedFingerprint === fingerprint;
  const answeredIds = new Set(progress.answers.map(answer => answer.questionId));
  const contextAnswered = CONTEXT_IDS.filter(id => answeredIds.has(id)).length;
  const contextDone = contextAnswered + progress.skippedContext.length;
  const sequence = REFLECTION_QUESTIONS.filter(question => progress.mode === 'integral' || question.domain === current.domain);
  const position = sequence.findIndex(question => question.id === current.id);
  const moduleQuestions = REFLECTION_QUESTIONS.filter(question => question.domain === current.domain);
  const moduleAnswered = moduleQuestions.filter(question => answeredIds.has(question.id)).length;
  const changeJourneyMode = (mode: 'modular' | 'integral') => {
    // La sélection radio devient une réponse uniquement lors de la validation explicite.
    void persist(progress.stage === 'intro' ? { ...progress, mode } : changeMode(progress, mode));
  };

  const method = <details className="mt-5 rounded-2xl border bg-white/55 p-4"><summary className="cursor-pointer font-bold">{t.methods}</summary><p className="mt-3 text-sm leading-relaxed">{t.methodsDetail}</p><ul className="mt-4 space-y-2 text-sm">{METHOD_SOURCES.map(source => <li key={source.href}><a href={source.href} target="_blank" rel="noreferrer" className="underline">{source.label}</a></li>)}</ul></details>;
  const title = progress.stage === 'intro' ? t.title : progress.stage === 'modules' ? t.overview : progress.stage === 'questions' ? current.text[locale] : progress.stage === 'break' ? t.breakTitle : progress.stage === 'archives' ? t.archiveTitle : progress.stage === 'review' ? t.review : t.results;

  return <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <button disabled={busy} onClick={() => void leave()} className={button}><ArrowLeft className="mr-2 inline h-4 w-4" />{t.leave}</button>
      <span role="status" className="text-xs text-[var(--ndee-muted)]">{busy ? t.saving : t.saved}</span>
    </div>
    {error && <p role="alert" className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900">{error}</p>}
    {notice && <p role="status" className="mb-5 rounded-2xl bg-[var(--ndee-sage)] p-4">{notice}</p>}
    <fieldset disabled={busy} className="min-w-0">
      {(progress.stage === 'intro' || progress.stage === 'modules' || progress.stage === 'questions' || progress.stage === 'break') && <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <label className="text-sm font-semibold">{t.mode}<select className="ndee-focus ml-3 min-h-11 rounded-xl border bg-white px-3" value={progress.mode} onChange={event => changeJourneyMode(event.target.value as 'modular' | 'integral')}><option value="modular">{t.modules}</option><option value="integral">{t.integral}</option></select></label>
        {progress.stage !== 'intro' && <button className={button} onClick={() => void persist({ ...progress, stage: 'results' })}>{t.summary}</button>}
      </div>}
      {progress.stage !== 'intro' && <div className="mb-6">
        <div className="mb-2 flex flex-wrap justify-between gap-2 text-sm"><span>{t.coreProgress} : {report.answered}/{report.total}</span><span>{t.optionalProgress} : {contextAnswered}/4 · {progress.skippedContext.length} {t.skipped.toLowerCase()}</span></div>
        <progress aria-label={t.coreProgress} value={report.answered} max={report.total} className="h-2 w-full accent-[var(--ndee-primary)]" />
      </div>}
      <h1 ref={heading} tabIndex={-1} className="mb-5 text-2xl font-bold leading-snug outline-none sm:text-3xl">{title}</h1>

      {progress.stage === 'intro' && <section className={surface}>
        <p className="text-lg">{t.subtitle}</p><p className="mt-4 font-semibold">{t.fullHint}</p>
        <div className="mt-6 space-y-3 rounded-2xl bg-[var(--ndee-sage)] p-5 text-sm"><p><LockKeyhole className="mr-2 inline h-4 w-4" />{t.privacy}</p><p>{t.notMedical}</p></div>
        {method}
        <label className="mt-6 flex items-start gap-3"><input type="checkbox" className="mt-1 h-5 w-5" checked={acknowledged} onChange={event => setAcknowledged(event.target.checked)} />{t.acknowledge}</label>
        <div className="mt-6 flex flex-wrap gap-3"><button disabled={!acknowledged} className={primary} onClick={() => void persist({ ...progress, acknowledged: true, stage: progress.isComplete ? 'results' : progress.mode === 'modular' ? 'modules' : 'questions' })}>{progress.answers.length ? t.resume : t.start}</button><button className={button} onClick={() => setModal('scan')}><Camera className="mr-2 inline h-4 w-4" />{t.scan}</button>{progress.archives.length > 0 && <button className={button} onClick={() => void persist({ ...progress, stage: 'archives' })}>{t.archiveTitle}</button>}</div>
      </section>}

      {progress.stage === 'modules' && <><p className="mb-6">{t.moduleHint}</p><div className="grid gap-4 sm:grid-cols-2">
        {(['context', ...DOMAINS] as AssessmentModule[]).map(module => {
          const result = report.domains.find(domain => domain.domain === module);
          const completed = result?.complete ?? contextDone === 4;
          return <button key={module} className={`${surface} ndee-focus text-left`} onClick={() => void persist(beginModule(progress, module))}>
            <span className="text-lg font-bold">{moduleLabel(module)}</span><span className="mt-3 block text-sm">{result ? `${result.answered}/${result.total}` : `${contextAnswered}/4`} {t.answered} · {completed ? t.complete : (result?.answered ?? contextDone) ? t.partial : t.empty}</span>
            {module === 'context' && <span className="mt-3 block text-sm text-[var(--ndee-muted)]">{t.contextHint}</span>}
          </button>;
        })}
      </div></>}

      {progress.stage === 'questions' && <section className={surface}>
        <p className="mb-5 text-sm font-semibold">{moduleLabel(current.domain)} · {t.progress} {position + 1}/{sequence.length} · {moduleAnswered}/{moduleQuestions.length} {t.answered}</p>
        {current.domain === 'context' && <p className="mb-5 rounded-xl bg-[var(--ndee-sage)] p-4 text-sm">{t.contextHint}</p>}
        {current.id === 'INT_04' && <p className="mb-5 rounded-xl bg-[var(--ndee-peach)] p-4 text-sm">{t.crisisHelp}</p>}
        <fieldset className="grid gap-3 sm:grid-cols-2"><legend className="sr-only">{current.text[locale]}</legend>{scaleOptions(current.scale, locale).map(option => <label key={option.value} className={`ndee-focus flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border p-4 text-sm font-semibold ${selected === option.value ? 'border-[var(--ndee-primary)] bg-[var(--ndee-sage)]' : 'bg-white/60'}`}>
          <input type="radio" name={`answer-${current.id}`} value={option.value} checked={selected === option.value} onChange={() => setSelection({ questionId: current.id, score: option.value })} className="h-5 w-5 shrink-0 accent-[var(--ndee-primary)]" />{option.label}
        </label>)}</fieldset>
        <div className="mt-7 flex flex-wrap gap-3"><button className={button} onClick={() => void persist(progress.returnToResults ? { ...progress, returnToResults: false, stage: 'results' } : previousQuestion(progress))}>{progress.returnToResults ? t.closeReview : t.previous}</button><button className={primary} disabled={selected === null} onClick={() => selected !== null && void persist(commitAnswer(progress, selected))}>{progress.returnToResults ? t.saveEdit : t.next}</button></div>
        {current.domain === 'context' && <div className="mt-4 flex flex-wrap gap-3"><button className={button} onClick={() => void persist(commitAnswer(progress, null))}>{t.skip}</button><button className={button} onClick={() => void persist(skipContext(progress))}>{t.skipContext}</button></div>}
        <button className={`${button} mt-4`} onClick={() => void persist({ ...progress, stage: 'modules' })}>{t.backModules}</button>
      </section>}

      {progress.stage === 'break' && <section className={surface}><p>{t.breakText}</p><button className={`${primary} mt-6`} onClick={() => void persist({ ...progress, stage: progress.afterBreakStage })}>{t.continue}</button></section>}

      {progress.stage === 'results' && <>
        <p className="mb-6">{t.resultsIntro} <strong>{report.complete ? t.complete : t.partial}</strong></p>
        <div className="space-y-4">{report.domains.map(domain => <section key={domain.domain} className={surface}>
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">{t.domains[domain.domain]}</h2><span className="text-2xl font-bold">{domain.score === null ? '—' : `${domain.score}%`}</span></div>
          <p className="mt-2 text-sm">{domain.answered}/{domain.total} {t.answered} · {domain.score === null ? t.empty : `${t.bands[domain.band!]} · ${domain.complete ? t.complete : t.partial}`}</p>
          <details className="mt-4"><summary className="cursor-pointer font-semibold">{t.details}</summary><div className="mt-3 space-y-2">{domain.subscales.map(subscale => <button key={subscale.id} className={`${button} flex w-full items-center justify-between gap-4 text-left`} onClick={() => openReview(domain.domain, subscale.id)}><span>{SUBSCALE_LABELS[locale][subscale.id]}<span className="mt-1 block text-xs font-normal">{subscale.answered}/{subscale.total} · {subscale.score === null ? t.empty : subscale.complete ? t.complete : t.partial}</span></span><span className="shrink-0">{subscale.score === null ? '—' : `${subscale.score}%`}</span></button>)}</div></details>
          <button className={`${button} mt-4`} onClick={() => openReview(domain.domain)}>{t.viewAnswers}</button>
        </section>)}</div>
        <section className={`${surface} mt-6`}><h2 className="text-xl font-bold">{t.personalize}</h2><p className="mt-3 text-sm">{t.personalizationHint}</p>
          {report.needs.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{report.needs.slice(0, 8).map(item => <span key={item.need} className="rounded-full bg-[var(--ndee-sage)] px-3 py-2 text-sm">{translate(`supportNeeds.${item.need}`)} · {item.weight}%</span>)}</div>}
          {!report.domains.some(domain => domain.complete) ? <p className="mt-4 text-sm">{t.finishModule}</p> : personalized ? <p className="mt-4 font-semibold">{t.personalized}</p> : <><p className="mt-4 text-sm">{hasProfile ? t.changed : t.privacy}</p><button className={`${primary} mt-4`} onClick={() => void personalize()}><Sparkles className="mr-2 inline h-4 w-4" />{hasProfile ? t.updatePersonalization : t.personalize}</button></>}
          <button className={`${button} mt-4 ml-2`} onClick={onOpenToolbox}>{t.openToolbox}</button>
        </section>
        {method}
        <section className={`${surface} mt-6`}><label className="flex items-start gap-3"><input className="mt-1 h-5 w-5" type="checkbox" checked={includeContext} onChange={event => setIncludeContext(event.target.checked)} />{t.includeContext}</label><p className="mt-3 text-sm">{t.exportHint}</p><div className="mt-5 flex flex-wrap gap-3"><button className={button} onClick={() => void downloadPdf()}><Download className="mr-2 inline h-4 w-4" />{t.download}</button><button className={button} onClick={() => void exportQr()}>{t.qr}</button><button className={button} onClick={() => setModal('scan')}>{t.scan}</button></div></section>
        <div className="mt-5 flex flex-wrap gap-3"><button className={button} onClick={() => openReview()}>{t.review}</button><button className={button} onClick={() => void persist({ ...progress, stage: 'modules' })}>{t.backModules}</button><button className={button} onClick={() => void persist({ ...progress, stage: 'archives' })}>{t.archiveTitle}</button><button className={button} onClick={() => void reset()}>{t.reset}</button></div>
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
        <div className="space-y-5">{progress.archives.map(archive => <details key={archive.id} className={surface}><summary className="cursor-pointer font-bold">{t.archiveDate} {new Date(archive.updatedAt).toLocaleDateString(locale)} · {archive.answers.length}/30</summary><div className="mt-4 grid gap-3 sm:grid-cols-2">{calculateLegacyReport(archive.answers).domains.map(domain => <p key={domain.domain}>{t.domains[domain.domain]} : {domain.score}% · {t.bands[domain.band]}</p>)}</div><div className="mt-5 space-y-3">{LEGACY_QUESTIONS.map(question => { const answer = archive.answers.find(item => item.questionId === question.id); return <p key={question.id} className="border-t pt-3 text-sm">{question.text[locale]} <strong>{answer ? t.oldScale[answer.score] : t.empty}</strong></p>; })}</div></details>)}</div>
      </>}
    </fieldset>
    {modal && <AssessmentDialog title={modal === 'qr' ? t.qr : t.scan} closeLabel={t.close} onClose={() => setModal(null)}>
      {modal === 'qr' ? <><img src={qrData} alt={t.qr} className="mx-auto w-full max-w-sm" /><p className="mt-3 text-sm">{includeContext ? t.contextIncluded : t.contextExcluded}</p><p className="mt-3 text-sm">{t.exportHint}</p></> : <>
        <QrScanner locale={locale} onScan={importValue} />
        <details className="mt-5"><summary className="cursor-pointer font-semibold">{t.importText}</summary><label className="sr-only" htmlFor="assessment-import">{t.importText}</label><textarea id="assessment-import" className="ndee-focus mt-3 min-h-24 w-full rounded-xl border p-3" value={importText} onChange={event => setImportText(event.target.value)} /><button disabled={busy || !importText.trim()} className={`${button} mt-3`} onClick={() => void importValue(importText.trim())}>{t.importButton}</button></details>
        {error && <p role="alert" className="mt-4 text-rose-800">{error}</p>}
      </>}
    </AssessmentDialog>}
  </main>;
};
