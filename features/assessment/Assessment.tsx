import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Camera, Check, ChevronLeft, Download, Eraser, LockKeyhole, RotateCcw, Sparkles, X } from 'lucide-react';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { Html5Qrcode } from 'html5-qrcode';
import {
  clearAssessmentProgress,
  saveAssessmentProgress,
  saveRecommendationProfile
} from '../../services/storage/offlineDb';
import {
  AssessmentLocale,
  buildRecommendationProfile,
  calculateReflectionReport,
  ReflectionAnswer,
  REFLECTION_QUESTIONS
} from './model';

interface AssessmentProps {
  locale: AssessmentLocale;
  initialAnswers?: ReflectionAnswer[];
  initialIndex?: number;
  onBack: () => void;
  onOpenToolbox: () => void;
  onPersonalized: () => void;
}

const copy = {
  en: {
    title: 'Explore your support profile', subtitle: 'A private self-reflection for noticing patterns and choosing practical supports.',
    privacy: 'Your answers and results stay in this browser. NDee does not upload them, score your health, or provide a diagnosis.',
    notMedical: 'This is not a medical or risk-assessment tool and does not replace professional care. If you are in immediate danger, contact local emergency services.',
    acknowledge: 'I understand what this reflection can and cannot do.', start: 'Start reflection', resume: 'Continue reflection',
    scale: ['Not at all', 'Rarely', 'Sometimes', 'Often', 'Very often'], previous: 'Previous', progress: 'Question',
    results: 'Your reflection profile', resultsIntro: 'These scores describe patterns in your responses, not conditions or diagnoses.',
    bands: { lighter: 'Less prominent', somewhat: 'Somewhat prominent', prominent: 'Prominent', veryProminent: 'Very prominent' },
    domains: { attention: 'Attention & action', sensory: 'Sensory & energy', literacy: 'Reading & writing', coordination: 'Coordination & sequencing', numbers: 'Numbers & time' },
    personalize: 'Personalize my toolbox', personalized: 'Personalization saved on this device only.', openToolbox: 'Open my toolbox',
    review: 'Review answers', closeReview: 'Back to results', download: 'Download private PDF', qr: 'Show transfer QR', scan: 'Import transfer QR',
    reset: 'Delete reflection', resetConfirm: 'Delete all reflection answers from this device?', camera: 'Point the camera at an NDee transfer QR.',
    cameraError: 'The camera could not be started. Check permission and try again.', invalidQr: 'This is not a compatible NDee transfer QR.',
    methods: 'How this works', methodsText: 'NDee groups your responses into five reflection areas and turns the most prominent practical needs into optional toolbox preferences. The questionnaire is inspired by lived-experience themes, but it is not a validated clinical instrument.'
  },
  fr: {
    title: 'Explorez votre profil de soutien', subtitle: 'Une auto-réflexion privée pour repérer des tendances et choisir des soutiens pratiques.',
    privacy: 'Vos réponses et résultats restent dans ce navigateur. NDee ne les envoie pas, n’évalue pas votre santé et ne pose aucun diagnostic.',
    notMedical: 'Ceci n’est ni un outil médical ni une évaluation des risques et ne remplace pas un accompagnement professionnel. En cas de danger immédiat, contactez les services d’urgence locaux.',
    acknowledge: 'Je comprends ce que cette réflexion peut et ne peut pas faire.', start: 'Commencer la réflexion', resume: 'Continuer la réflexion',
    scale: ['Pas du tout', 'Rarement', 'Parfois', 'Souvent', 'Très souvent'], previous: 'Précédent', progress: 'Question',
    results: 'Votre profil de réflexion', resultsIntro: 'Ces scores décrivent les tendances de vos réponses, pas des troubles ni des diagnostics.',
    bands: { lighter: 'Peu présent', somewhat: 'Assez présent', prominent: 'Présent', veryProminent: 'Très présent' },
    domains: { attention: 'Attention et action', sensory: 'Sensoriel et énergie', literacy: 'Lecture et écriture', coordination: 'Coordination et séquençage', numbers: 'Nombres et temps' },
    personalize: 'Personnaliser ma boîte à outils', personalized: 'Personnalisation enregistrée uniquement sur cet appareil.', openToolbox: 'Ouvrir ma boîte à outils',
    review: 'Revoir les réponses', closeReview: 'Retour aux résultats', download: 'Télécharger le PDF privé', qr: 'Afficher le QR de transfert', scan: 'Importer un QR de transfert',
    reset: 'Supprimer la réflexion', resetConfirm: 'Supprimer toutes les réponses de réflexion de cet appareil ?', camera: 'Placez un QR de transfert NDee devant la caméra.',
    cameraError: 'La caméra n’a pas pu démarrer. Vérifiez l’autorisation puis réessayez.', invalidQr: 'Ce QR de transfert NDee n’est pas compatible.',
    methods: 'Comment cela fonctionne', methodsText: 'NDee regroupe vos réponses en cinq espaces de réflexion et transforme les besoins pratiques les plus présents en préférences facultatives pour la boîte à outils. Le questionnaire s’inspire de thèmes d’expérience vécue, mais ce n’est pas un instrument clinique validé.'
  }
} as const;

const METHOD_SOURCES = [
  { label: 'ASRS v1.1 information', href: 'https://www.hcp.med.harvard.edu/ncs/asrs.php' },
  { label: 'Camouflaging Autistic Traits Questionnaire research', href: 'https://molecularautism.biomedcentral.com/articles/10.1186/s13229-019-0274-6' },
  { label: 'British Dyslexia Association adult checklist', href: 'https://www.bdadyslexia.org.uk/dyslexia/how-is-dyslexia-diagnosed/dyslexia-checklists' },
  { label: 'CanChild information on developmental coordination', href: 'https://canchild.ca/en/diagnoses/developmental-coordination-disorder' },
  { label: 'Dyscalculia Network information', href: 'https://www.dyscalculianetwork.com/' }
];

const encodeTransfer = (answers: ReflectionAnswer[]) =>
  btoa(unescape(encodeURIComponent(JSON.stringify({ app: 'NDee', version: 1, answers }))));

const decodeTransfer = (value: string): ReflectionAnswer[] => {
  const parsed = JSON.parse(decodeURIComponent(escape(atob(value)))) as { app?: string; version?: number; answers?: ReflectionAnswer[] };
  if (parsed.app !== 'NDee' || parsed.version !== 1 || !Array.isArray(parsed.answers)) throw new Error('invalid');
  const questionIds = new Set(REFLECTION_QUESTIONS.map(question => question.id));
  return parsed.answers.filter(answer => questionIds.has(answer.questionId) && Number.isInteger(answer.score) && answer.score >= 0 && answer.score <= 4);
};

const QrScanner: React.FC<{ locale: AssessmentLocale; onClose: () => void; onAnswers: (answers: ReflectionAnswer[]) => void }> = ({ locale, onClose, onAnswers }) => {
  const t = copy[locale];
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const scanner = new Html5Qrcode('ndee-qr-reader');
    scannerRef.current = scanner;
    void scanner.start(
      { facingMode: 'environment' },
      { fps: 8, qrbox: { width: 220, height: 220 } },
      decoded => {
        try {
          onAnswers(decodeTransfer(decoded));
          void scanner.stop().catch(() => undefined);
        } catch {
          setError(t.invalidQr);
        }
      },
      () => undefined
    ).catch(() => setError(t.cameraError));
    return () => { void scanner.stop().catch(() => undefined); };
  }, [onAnswers, t.cameraError, t.invalidQr]);

  return <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#26332f]/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
    <div className="ndee-surface w-full max-w-md rounded-[2rem] p-6">
      <div className="flex items-center justify-between gap-4"><p className="font-bold text-[var(--ndee-ink)]">{t.camera}</p><button onClick={onClose} className="ndee-focus flex h-11 w-11 items-center justify-center rounded-full" aria-label="Close"><X /></button></div>
      <div id="ndee-qr-reader" className="mt-5 overflow-hidden rounded-2xl" />
      {error && <p className="mt-4 text-sm text-rose-700" role="alert">{error}</p>}
    </div>
  </div>;
};

export const Assessment: React.FC<AssessmentProps> = ({ locale, initialAnswers = [], initialIndex = 0, onBack, onOpenToolbox, onPersonalized }) => {
  const t = copy[locale];
  const [stage, setStage] = useState<'intro' | 'questions' | 'results' | 'review'>(initialAnswers.length === REFLECTION_QUESTIONS.length ? 'results' : 'intro');
  const [answers, setAnswers] = useState<ReflectionAnswer[]>(initialAnswers);
  const [index, setIndex] = useState(Math.min(initialIndex, REFLECTION_QUESTIONS.length - 1));
  const [acknowledged, setAcknowledged] = useState(false);
  const [personalized, setPersonalized] = useState(false);
  const [qrData, setQrData] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const report = useMemo(() => calculateReflectionReport(answers), [answers]);
  const current = REFLECTION_QUESTIONS[index];
  const currentScore = answers.find(answer => answer.questionId === current?.id)?.score;

  useEffect(() => {
    if (!initialAnswers.length || answers.length) return;
    setAnswers(initialAnswers);
    setIndex(Math.min(initialIndex, REFLECTION_QUESTIONS.length - 1));
    if (initialAnswers.length === REFLECTION_QUESTIONS.length) setStage('results');
  }, [answers.length, initialAnswers, initialIndex]);

  useEffect(() => {
    if (!answers.length) return;
    void saveAssessmentProgress({ version: 1, answers, currentIndex: index, isComplete: answers.length === REFLECTION_QUESTIONS.length, locale, updatedAt: new Date().toISOString() });
  }, [answers, index, locale]);

  const answerQuestion = (score: number) => {
    const next = [...answers.filter(answer => answer.questionId !== current.id), { questionId: current.id, score }];
    setAnswers(next);
    if (index === REFLECTION_QUESTIONS.length - 1) setStage('results');
    else setIndex(value => value + 1);
  };

  const personalize = async () => {
    await saveRecommendationProfile(buildRecommendationProfile(report));
    setPersonalized(true);
    onPersonalized();
  };

  const downloadPdf = async () => {
    const doc = new jsPDF();
    doc.setFontSize(22); doc.text('NDee', 20, 24);
    doc.setFontSize(12); doc.text(t.results, 20, 34);
    doc.setFontSize(9); doc.text(doc.splitTextToSize(t.resultsIntro, 170), 20, 43);
    report.domains.forEach((domain, itemIndex) => {
      const y = 62 + itemIndex * 20;
      doc.setFontSize(12); doc.text(t.domains[domain.domain], 20, y);
      doc.setFontSize(10); doc.text(`${domain.score}% — ${t.bands[domain.band]}`, 20, y + 7);
    });
    const qr = await QRCode.toDataURL(encodeTransfer(answers), { width: 180, margin: 1 });
    doc.addImage(qr, 'PNG', 145, 145, 42, 42);
    doc.setFontSize(8); doc.text(doc.splitTextToSize(`${t.privacy} ${t.notMedical}`, 115), 20, 153);
    doc.save(`ndee-reflection-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const showQr = async () => setQrData(await QRCode.toDataURL(encodeTransfer(answers), { width: 320, margin: 2 }));
  const reset = async () => {
    if (!window.confirm(t.resetConfirm)) return;
    await clearAssessmentProgress();
    setAnswers([]); setIndex(0); setStage('intro'); setQrData(null); setPersonalized(false);
  };

  if (stage === 'intro') return <main className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
    <button onClick={onBack} className="ndee-focus mb-8 inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-[var(--ndee-muted)]"><ArrowLeft className="h-4 w-4" /> NDee</button>
    <div className="ndee-surface rounded-[2rem] p-7 sm:p-12">
      <div className="mb-6 inline-flex rounded-2xl bg-[var(--ndee-lilac)] p-3 text-[var(--ndee-primary-strong)]"><Sparkles /></div>
      <h1 className="text-3xl font-bold text-[var(--ndee-ink)] sm:text-5xl">{t.title}</h1><p className="mt-4 text-lg leading-relaxed text-[var(--ndee-muted)]">{t.subtitle}</p>
      <div className="mt-8 space-y-3 rounded-2xl bg-[var(--ndee-sage)] p-5 text-sm leading-relaxed text-[var(--ndee-ink)]"><p className="flex gap-3"><LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-[var(--ndee-primary-strong)]" />{t.privacy}</p><p>{t.notMedical}</p></div>
      <details className="mt-5 rounded-2xl border bg-white/55 p-4"><summary className="cursor-pointer font-bold">{t.methods}</summary><p className="mt-3 text-sm leading-relaxed text-[var(--ndee-muted)]">{t.methodsText}</p><ul className="mt-4 space-y-2 text-sm">{METHOD_SOURCES.map(source => <li key={source.href}><a href={source.href} target="_blank" rel="noreferrer" className="font-semibold text-[var(--ndee-primary-strong)] underline">{source.label}</a></li>)}</ul></details>
      <label className="mt-7 flex cursor-pointer items-start gap-3 text-sm font-semibold"><input type="checkbox" checked={acknowledged} onChange={event => setAcknowledged(event.target.checked)} className="mt-1 h-4 w-4" />{t.acknowledge}</label>
      <button disabled={!acknowledged} onClick={() => setStage('questions')} className="ndee-focus mt-6 min-h-12 w-full rounded-2xl bg-[var(--ndee-primary)] px-5 py-4 font-bold text-white disabled:opacity-40">{answers.length ? t.resume : t.start}</button>
      <button onClick={() => setShowScanner(true)} className="ndee-focus mt-3 min-h-11 w-full rounded-2xl border bg-white/65 px-5 py-3 font-semibold text-[var(--ndee-ink)]"><Camera className="mr-2 inline h-4 w-4" />{t.scan}</button>
    </div>
    {showScanner && <QrScanner locale={locale} onClose={() => setShowScanner(false)} onAnswers={value => { setAnswers(value); setIndex(Math.min(value.length, REFLECTION_QUESTIONS.length - 1)); setStage(value.length === REFLECTION_QUESTIONS.length ? 'results' : 'questions'); setShowScanner(false); }} />}
  </main>;

  if (stage === 'questions') return <main className="mx-auto flex min-h-[75vh] max-w-3xl flex-col justify-center px-4 py-10">
    <div className="mb-7 flex items-center justify-between"><button onClick={() => index ? setIndex(index - 1) : setStage('intro')} className="ndee-focus flex h-11 w-11 items-center justify-center rounded-full text-[var(--ndee-muted)]"><ChevronLeft /></button><span className="text-xs font-bold text-[var(--ndee-muted)]">{t.progress} {index + 1}/{REFLECTION_QUESTIONS.length}</span></div>
    <div className="h-2 overflow-hidden rounded-full bg-[var(--ndee-sage)]"><div className="h-full bg-[var(--ndee-primary)] transition-all" style={{ width: `${((index + 1) / REFLECTION_QUESTIONS.length) * 100}%` }} /></div>
    <section className="ndee-surface mt-8 rounded-[2rem] p-7 sm:p-10"><h1 className="text-2xl font-bold leading-snug text-[var(--ndee-ink)] sm:text-3xl">{current.text[locale]}</h1><div className="mt-8 grid gap-3 sm:grid-cols-5">{t.scale.map((label, score) => <button key={label} onClick={() => answerQuestion(score)} className={`ndee-focus min-h-20 rounded-2xl border px-3 py-4 text-sm font-semibold transition ${currentScore === score ? 'border-[var(--ndee-primary)] bg-[var(--ndee-sage)] text-[var(--ndee-ink)]' : 'bg-white/60 text-[var(--ndee-muted)] hover:bg-white'}`}><span className="block text-lg">{score}</span>{label}</button>)}</div></section>
  </main>;

  if (stage === 'review') return <main className="mx-auto max-w-4xl px-4 py-10"><button onClick={() => setStage('results')} className="ndee-focus mb-6 inline-flex min-h-11 items-center gap-2 rounded-xl px-2 font-semibold"><ArrowLeft className="h-4 w-4" />{t.closeReview}</button><div className="space-y-3">{REFLECTION_QUESTIONS.map((question, questionIndex) => <button key={question.id} onClick={() => { setIndex(questionIndex); setStage('questions'); }} className="ndee-focus ndee-surface flex min-h-16 w-full items-center justify-between gap-4 rounded-2xl p-4 text-left"><span>{question.text[locale]}</span><strong className="rounded-full bg-[var(--ndee-lilac)] px-3 py-1">{answers.find(answer => answer.questionId === question.id)?.score ?? '—'}/4</strong></button>)}</div></main>;

  return <main className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
    <button onClick={onBack} className="ndee-focus mb-7 inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-[var(--ndee-muted)]"><ArrowLeft className="h-4 w-4" /> NDee</button>
    <div className="rounded-[2rem] bg-[var(--ndee-lilac)] p-7 sm:p-10"><p className="ndee-eyebrow">NDee</p><h1 className="mt-2 text-3xl font-bold sm:text-5xl">{t.results}</h1><p className="mt-4 max-w-2xl leading-relaxed text-[var(--ndee-muted)]">{t.resultsIntro}</p></div>
    <div className="mt-7 grid gap-4 md:grid-cols-5">{report.domains.map((domain, domainIndex) => <div key={domain.domain} className={`rounded-2xl p-5 ${['bg-[var(--ndee-sage)]', 'bg-[var(--ndee-sky)]', 'bg-[var(--ndee-peach)]', 'bg-[var(--ndee-lilac)]', 'bg-[var(--ndee-sun)]'][domainIndex]}`}><p className="text-sm font-bold text-[var(--ndee-ink)]">{t.domains[domain.domain]}</p><p className="mt-3 text-3xl font-bold text-[var(--ndee-primary-strong)]">{domain.score}%</p><p className="mt-1 text-xs text-[var(--ndee-muted)]">{t.bands[domain.band]}</p></div>)}</div>
    <div className="ndee-surface mt-7 rounded-[2rem] p-6 sm:p-8"><h2 className="text-xl font-bold text-[var(--ndee-ink)]">{t.personalize}</h2><p className="mt-2 text-sm leading-relaxed text-[var(--ndee-muted)]">{t.privacy}</p>{personalized ? <p className="mt-5 flex items-center gap-2 font-semibold text-[var(--ndee-primary-strong)]"><Check />{t.personalized}</p> : <button onClick={personalize} className="ndee-focus mt-5 min-h-11 rounded-2xl bg-[var(--ndee-sage)] px-6 py-3 font-bold text-[var(--ndee-ink)]"><Sparkles className="mr-2 inline h-4 w-4" />{t.personalize}</button>}<button onClick={onOpenToolbox} className="ndee-focus mt-3 min-h-12 w-full rounded-2xl bg-[var(--ndee-primary)] px-6 py-4 font-bold text-white">{t.openToolbox}</button></div>
    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><button onClick={() => setStage('review')} className="rounded-xl border bg-white p-3 font-semibold">{t.review}</button><button onClick={() => void downloadPdf()} className="rounded-xl border bg-white p-3 font-semibold"><Download className="mr-2 inline h-4 w-4" />{t.download}</button><button onClick={() => void showQr()} className="rounded-xl border bg-white p-3 font-semibold">{t.qr}</button><button onClick={() => setShowScanner(true)} className="rounded-xl border bg-white p-3 font-semibold"><Camera className="mr-2 inline h-4 w-4" />{t.scan}</button><button onClick={() => void reset()} className="rounded-xl border border-rose-200 bg-white p-3 font-semibold text-rose-700"><Eraser className="mr-2 inline h-4 w-4" />{t.reset}</button></div>
    {qrData && <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#26332f]/45 p-4 backdrop-blur-sm"><div className="ndee-surface rounded-[2rem] p-6 text-center"><button onClick={() => setQrData(null)} className="ndee-focus ml-auto flex h-11 w-11 items-center justify-center rounded-full"><X /></button><img src={qrData} alt="NDee transfer QR" className="mx-auto h-72 w-72" /><p className="max-w-xs text-sm text-[var(--ndee-muted)]">{t.privacy}</p></div></div>}
    {showScanner && <QrScanner locale={locale} onClose={() => setShowScanner(false)} onAnswers={value => { setAnswers(value); setStage(value.length === REFLECTION_QUESTIONS.length ? 'results' : 'questions'); setShowScanner(false); }} />}
  </main>;
};
