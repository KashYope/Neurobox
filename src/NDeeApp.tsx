import React, { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import {
  Activity,
  ArrowRight,
  BookHeart,
  Brain,
  Flame,
  Focus,
  HandHeart,
  Languages,
  Leaf,
  LockKeyhole,
  MoonStar,
  ShieldCheck,
  Sparkles,
  Waves,
  Wind,
  X
} from 'lucide-react';
import ToolboxApp from './App';
import { useTranslation } from './i18nContext';
import { BrandLogo } from '../components/BrandLogo';
import { Situation } from '../types';
import type { ReflectionAnswer } from '../features/assessment/model';
import {
  clearAssessmentProgress,
  clearRecommendationProfile,
  getAssessmentProgress
} from '../services/storage/offlineDb';
import { clearUser } from '../services/dataService';
import { apiClient } from '../services/apiClient';
import { persistToken } from '../services/tokenStore';
import { getSupportedLanguages, loadLanguageTranslations, type SupportedLanguage } from '../services/languageService';

type PublicRoute = 'home' | 'assessment' | 'toolbox';

const Assessment = lazy(() => import('../features/assessment/Assessment').then(module => ({ default: module.Assessment })));

const routeFromPath = (): PublicRoute => {
  if (window.location.pathname.startsWith('/assessment')) return 'assessment';
  if (window.location.pathname.startsWith('/toolbox')) return 'toolbox';
  return 'home';
};

const shellCopy = {
  en: { tagline: 'The toolbox for neurodiversity', home: 'Home', profile: 'Profile reflection', toolbox: 'Toolbox', privacy: 'Privacy', hero: 'Understand your patterns. Choose what helps.', intro: 'NDee combines a private self-reflection with practical, everyday exercises. Use either tool on its own—or connect them only when you choose.', profileTitle: 'Explore my profile', profileText: 'Notice attention, sensory, literacy, coordination, and number-processing patterns. Results stay on your device.', toolboxTitle: 'Open the toolbox', toolboxText: 'Browse the full exercise library immediately. No account, name, or assessment required.', local: 'Private by design', localText: 'Reflection data never goes to the NDee server. Personalization is explicit, optional, and removable.', notMedical: 'NDee is a wellbeing and self-reflection tool, not a medical device. It does not diagnose, assess risk, or replace professional care.', clearAssessment: 'Delete reflection data', clearPersonalization: 'Remove personalization', clearAll: 'Erase all personal data', cleared: 'Local data removed.', unavailable: 'The reflection is currently available in English and French.', switchEnglish: 'Continue in English', switchFrench: 'Continuer en français' },
  fr: { tagline: 'La boîte à outils de la neurodiversité', home: 'Accueil', profile: 'Auto-réflexion', toolbox: 'Boîte à outils', privacy: 'Confidentialité', hero: 'Comprendre vos tendances. Choisir ce qui aide.', intro: 'NDee associe une auto-réflexion privée à des exercices pratiques du quotidien. Utilisez chaque outil séparément, ou reliez-les uniquement si vous le choisissez.', profileTitle: 'Explorer mon profil', profileText: 'Repérez des tendances liées à l’attention, au sensoriel, à la lecture, à la coordination et aux nombres. Les résultats restent sur votre appareil.', toolboxTitle: 'Ouvrir la boîte à outils', toolboxText: 'Parcourez immédiatement tous les exercices. Aucun compte, nom ou questionnaire requis.', local: 'Privé par conception', localText: 'Les données de réflexion ne sont jamais envoyées au serveur NDee. La personnalisation est explicite, facultative et supprimable.', notMedical: 'NDee est un outil de bien-être et d’auto-réflexion, pas un dispositif médical. Il ne pose pas de diagnostic, n’évalue pas les risques et ne remplace pas un accompagnement professionnel.', clearAssessment: 'Supprimer la réflexion', clearPersonalization: 'Retirer la personnalisation', clearAll: 'Effacer toutes mes données', cleared: 'Données locales supprimées.', unavailable: 'L’auto-réflexion est actuellement disponible en français et en anglais.', switchEnglish: 'Continue in English', switchFrench: 'Continuer en français' },
  de: { tagline: 'Die Toolbox für Neurodiversität', home: 'Start', profile: 'Selbstreflexion', toolbox: 'Toolbox', privacy: 'Datenschutz', hero: 'Muster verstehen. Hilfreiches auswählen.', intro: 'NDee verbindet eine private Selbstreflexion mit praktischen Übungen. Beide Werkzeuge können unabhängig genutzt werden.', profileTitle: 'Mein Profil erkunden', profileText: 'Die Selbstreflexion ist derzeit auf Englisch und Französisch verfügbar.', toolboxTitle: 'Toolbox öffnen', toolboxText: 'Alle Übungen sofort ansehen. Kein Konto, Name oder Fragebogen erforderlich.', local: 'Privat konzipiert', localText: 'Reflexionsdaten verlassen dieses Gerät nicht.', notMedical: 'NDee ist kein medizinisches Werkzeug und stellt keine Diagnosen.', clearAssessment: 'Reflexionsdaten löschen', clearPersonalization: 'Personalisierung entfernen', clearAll: 'Alle persönlichen Daten löschen', cleared: 'Lokale Daten gelöscht.', unavailable: 'Die Selbstreflexion ist derzeit auf Englisch und Französisch verfügbar.', switchEnglish: 'Continue in English', switchFrench: 'Continuer en français' },
  es: { tagline: 'La caja de herramientas para la neurodiversidad', home: 'Inicio', profile: 'Autorreflexión', toolbox: 'Herramientas', privacy: 'Privacidad', hero: 'Comprende tus patrones. Elige lo que ayuda.', intro: 'NDee combina una autorreflexión privada con ejercicios prácticos. Puedes usar cada herramienta por separado.', profileTitle: 'Explorar mi perfil', profileText: 'La autorreflexión está disponible actualmente en inglés y francés.', toolboxTitle: 'Abrir las herramientas', toolboxText: 'Consulta todos los ejercicios al instante. No se requiere cuenta, nombre ni cuestionario.', local: 'Privado por diseño', localText: 'Los datos de reflexión no salen de este dispositivo.', notMedical: 'NDee no es una herramienta médica y no ofrece diagnósticos.', clearAssessment: 'Borrar la reflexión', clearPersonalization: 'Quitar personalización', clearAll: 'Borrar todos mis datos', cleared: 'Datos locales eliminados.', unavailable: 'La autorreflexión está disponible actualmente en inglés y francés.', switchEnglish: 'Continue in English', switchFrench: 'Continuer en français' },
  nl: { tagline: 'De toolbox voor neurodiversiteit', home: 'Home', profile: 'Zelfreflectie', toolbox: 'Toolbox', privacy: 'Privacy', hero: 'Begrijp je patronen. Kies wat helpt.', intro: 'NDee combineert een privé-zelfreflectie met praktische oefeningen. Beide hulpmiddelen zijn apart te gebruiken.', profileTitle: 'Mijn profiel verkennen', profileText: 'De zelfreflectie is momenteel beschikbaar in het Engels en Frans.', toolboxTitle: 'Toolbox openen', toolboxText: 'Bekijk meteen alle oefeningen. Geen account, naam of vragenlijst nodig.', local: 'Privé ontworpen', localText: 'Reflectiegegevens verlaten dit apparaat niet.', notMedical: 'NDee is geen medisch hulpmiddel en stelt geen diagnoses.', clearAssessment: 'Reflectie verwijderen', clearPersonalization: 'Personalisatie verwijderen', clearAll: 'Alle persoonlijke gegevens wissen', cleared: 'Lokale gegevens verwijderd.', unavailable: 'De zelfreflectie is momenteel beschikbaar in het Engels en Frans.', switchEnglish: 'Continue in English', switchFrench: 'Continuer en français' }
} as const;

const experienceCopy = {
  en: { prompt: 'What would feel helpful right now?', promptText: 'Choose what is closest to your experience. You can change your mind at any time.', allNeeds: 'Browse every practice', allNeedsText: 'Take your time and explore the complete toolbox.', reflectionLabel: 'When you have more space', privacyShort: 'No account is needed. Your personal choices stay on this device.' },
  fr: { prompt: 'De quoi avez-vous besoin maintenant ?', promptText: 'Choisissez ce qui ressemble le plus à votre vécu. Vous pourrez changer d’avis à tout moment.', allNeeds: 'Voir toutes les pratiques', allNeedsText: 'Prenez votre temps et parcourez toute la boîte à outils.', reflectionLabel: 'Quand vous avez plus d’espace', privacyShort: 'Aucun compte n’est nécessaire. Vos choix personnels restent sur cet appareil.' },
  de: { prompt: 'Was würde Ihnen gerade helfen?', promptText: 'Wählen Sie, was Ihrer Situation am nächsten kommt. Sie können jederzeit neu entscheiden.', allNeeds: 'Alle Übungen ansehen', allNeedsText: 'Nehmen Sie sich Zeit und erkunden Sie die ganze Toolbox.', reflectionLabel: 'Wenn Sie mehr Raum haben', privacyShort: 'Kein Konto nötig. Ihre persönlichen Angaben bleiben auf diesem Gerät.' },
  es: { prompt: '¿Qué podría ayudarte ahora?', promptText: 'Elige lo que más se acerque a tu experiencia. Puedes cambiar de idea en cualquier momento.', allNeeds: 'Ver todas las prácticas', allNeedsText: 'Tómate tu tiempo y explora toda la caja de herramientas.', reflectionLabel: 'Cuando tengas más espacio', privacyShort: 'No necesitas una cuenta. Tus elecciones personales permanecen en este dispositivo.' },
  nl: { prompt: 'Wat zou nu helpend voelen?', promptText: 'Kies wat het dichtst bij je ervaring komt. Je kunt altijd opnieuw kiezen.', allNeeds: 'Alle oefeningen bekijken', allNeedsText: 'Neem je tijd en verken de volledige toolbox.', reflectionLabel: 'Wanneer je meer ruimte hebt', privacyShort: 'Geen account nodig. Je persoonlijke keuzes blijven op dit apparaat.' }
} as const;

const needOptions = [
  { value: Situation.Stress, icon: Waves, tone: 'bg-[var(--ndee-sage)]' },
  { value: Situation.Crisis, icon: Activity, tone: 'bg-[var(--ndee-peach)]' },
  { value: Situation.Rumination, icon: Brain, tone: 'bg-[var(--ndee-lilac)]' },
  { value: Situation.Freeze, icon: Wind, tone: 'bg-[var(--ndee-sky)]' },
  { value: Situation.Anger, icon: Flame, tone: 'bg-[var(--ndee-peach)]' },
  { value: Situation.Sleep, icon: MoonStar, tone: 'bg-[var(--ndee-lilac)]' },
  { value: Situation.Pain, icon: HandHeart, tone: 'bg-[var(--ndee-sun)]' },
  { value: Situation.Focus, icon: Focus, tone: 'bg-[var(--ndee-sky)]' },
  { value: Situation.Trauma, icon: Leaf, tone: 'bg-[var(--ndee-sage)]' }
] as const;

const NDeeApp: React.FC = () => {
  const { i18n, t: translate } = useTranslation(['common']);
  const [route, setRoute] = useState<PublicRoute>(routeFromPath);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [status, setStatus] = useState('');
  const [answers, setAnswers] = useState<ReflectionAnswer[]>([]);
  const [assessmentIndex, setAssessmentIndex] = useState(0);
  const [assessmentKey, setAssessmentKey] = useState(0);
  const [toolboxHeaderActions, setToolboxHeaderActions] = useState<HTMLDivElement | null>(null);
  const language = (i18n.language?.split('-')[0] || 'fr') as keyof typeof shellCopy;
  const resolvedLanguage = language in shellCopy ? language : 'fr';
  const t = shellCopy[resolvedLanguage];
  const experience = experienceCopy[resolvedLanguage];

  useEffect(() => {
    const onPopState = () => setRoute(routeFromPath());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    void getAssessmentProgress().then(progress => {
      if (!progress) return;
      setAnswers(progress.answers);
      setAssessmentIndex(progress.currentIndex);
    });
  }, []);

  useEffect(() => {
    if (route !== 'assessment') return;
    void getAssessmentProgress().then(progress => {
      if (!progress) return;
      setAnswers(progress.answers);
      setAssessmentIndex(progress.currentIndex);
      setAssessmentKey(value => value + 1);
    });
  }, [route]);

  const navigate = useCallback((next: PublicRoute) => {
    const path = next === 'home' ? '/' : `/${next}`;
    window.history.pushState({ ndeeRoute: next }, '', path);
    setRoute(next);
    window.scrollTo(0, 0);
  }, []);

  const openSituation = useCallback((situation: Situation) => {
    const search = new URLSearchParams({ situation });
    window.history.pushState({ ndeeRoute: 'toolbox' }, '', `/toolbox?${search.toString()}`);
    setRoute('toolbox');
    window.scrollTo(0, 0);
  }, []);

  const changeLanguage = async (next: SupportedLanguage) => {
    if (next === resolvedLanguage) return;

    await loadLanguageTranslations(next);
    window.location.reload();
  };

  const removeAssessment = async () => { await clearAssessmentProgress(); setAnswers([]); setAssessmentIndex(0); setAssessmentKey(value => value + 1); setStatus(t.cleared); };
  const removePersonalization = async () => { await clearRecommendationProfile(); window.dispatchEvent(new Event('ndee-personalization-change')); setStatus(t.cleared); };
  const removeAll = async () => {
    await Promise.all([clearAssessmentProgress(), clearRecommendationProfile()]);
    await apiClient.logout().catch(() => undefined);
    persistToken('partner');
    persistToken('moderator');
    clearUser();
    localStorage.removeItem('neurosooth_installation_id_v1');
    localStorage.removeItem('neurosooth_helpful_exercises_v1');
    setAnswers([]); setAssessmentIndex(0); setAssessmentKey(value => value + 1); setStatus(t.cleared);
    window.dispatchEvent(new Event('ndee-personalization-change'));
    window.dispatchEvent(new Event('partner-session-change'));
  };

  const header = <header className="sticky top-0 z-40 border-b border-[var(--ndee-border)] bg-[rgba(248,245,239,0.9)] backdrop-blur-md">
    <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-3 px-4">
      <button onClick={() => navigate('home')} className="ndee-focus rounded-xl text-left" aria-label={`${t.home} — NDee`}><BrandLogo compact /></button>
      <nav className="flex items-center gap-1" aria-label={`${t.home} / ${t.toolbox}`}>
        <button onClick={() => navigate('home')} className="ndee-focus hidden min-h-11 rounded-xl px-3 py-2 text-sm font-semibold text-[var(--ndee-muted)] hover:bg-white/70 sm:block">{t.home}</button>
        <button onClick={() => navigate('toolbox')} className={`ndee-focus min-h-11 rounded-xl px-3 py-2 text-sm font-semibold text-[var(--ndee-ink)] hover:bg-white/70 ${route === 'toolbox' ? 'hidden sm:block' : ''}`}>{t.toolbox}</button>
        <button onClick={() => setPrivacyOpen(true)} className="ndee-focus min-h-11 rounded-xl px-3 py-2 text-sm font-semibold text-[var(--ndee-muted)] hover:bg-white/70" aria-label={t.privacy}><LockKeyhole className="inline h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">{t.privacy}</span></button>
        <div className="ml-1 flex min-h-11 items-center rounded-xl border border-[var(--ndee-border)] bg-white/70 px-1"><Languages className="mx-1 h-4 w-4 text-[var(--ndee-muted)]" /><select aria-label={translate('languageSelector.label')} value={resolvedLanguage} onChange={event => void changeLanguage(event.target.value as SupportedLanguage)} className="min-h-9 border-0 bg-transparent py-1 text-xs font-bold outline-none">{Object.entries(getSupportedLanguages()).map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></div>
        {route === 'toolbox' && <div ref={setToolboxHeaderActions} />}
      </nav>
    </div>
  </header>;

  let content: React.ReactNode;
  if (route === 'toolbox') content = <ToolboxApp embeddedInSiteShell headerActionsContainer={toolboxHeaderActions} />;
  else if (route === 'assessment' && (resolvedLanguage === 'en' || resolvedLanguage === 'fr')) content = <Suspense fallback={<div className="p-12 text-center font-semibold text-slate-600">NDee…</div>}><Assessment key={assessmentKey} locale={resolvedLanguage} initialAnswers={answers} initialIndex={assessmentIndex} onBack={() => navigate('home')} onOpenToolbox={() => navigate('toolbox')} onPersonalized={() => window.dispatchEvent(new Event('ndee-personalization-change'))} /></Suspense>;
  else if (route === 'assessment') content = <main className="mx-auto max-w-xl px-4 py-20 text-center"><div className="ndee-surface rounded-[2rem] p-8"><Sparkles className="mx-auto h-10 w-10 text-[var(--ndee-primary)]" /><h1 className="mt-5 text-3xl font-bold">{t.profileTitle}</h1><p className="mt-4 text-[var(--ndee-muted)]">{t.unavailable}</p><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><button onClick={() => void changeLanguage('en')} className="ndee-focus min-h-11 rounded-2xl bg-[var(--ndee-primary)] px-5 py-3 font-bold text-white">{t.switchEnglish}</button><button onClick={() => void changeLanguage('fr')} className="ndee-focus min-h-11 rounded-2xl border bg-white px-5 py-3 font-bold">{t.switchFrench}</button></div></div></main>;
  else content = <main>
    <section className="mx-auto max-w-6xl px-4 py-10 sm:py-16">
      <div className="max-w-3xl">
        <p className="ndee-eyebrow">{t.tagline}</p>
        <h1 className="mt-3 text-3xl font-bold leading-tight text-[var(--ndee-ink)] sm:text-5xl">{experience.prompt}</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--ndee-muted)] sm:text-lg">{experience.promptText}</p>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {needOptions.map(({ value, icon: Icon, tone }) => <button key={value} onClick={() => openSituation(value)} className={`ndee-focus group min-h-32 rounded-3xl border border-white/70 p-4 text-left shadow-[0_8px_28px_rgba(66,77,71,0.06)] transition hover:-translate-y-0.5 ${tone}`}>
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/75 text-[var(--ndee-primary-strong)]"><Icon className="h-5 w-5" /></span>
          <span className="mt-5 block text-sm font-bold leading-snug text-[var(--ndee-ink)]">{translate(`situations.${value}`)}</span>
        </button>)}
        <button onClick={() => navigate('toolbox')} className="ndee-focus group min-h-32 rounded-3xl border border-[var(--ndee-border)] bg-white/80 p-4 text-left shadow-[0_8px_28px_rgba(66,77,71,0.06)] transition hover:-translate-y-0.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--ndee-canvas)] text-[var(--ndee-primary-strong)]"><BookHeart className="h-5 w-5" /></span>
          <span className="mt-5 block text-sm font-bold leading-snug text-[var(--ndee-ink)]">{experience.allNeeds}</span>
        </button>
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-[1.15fr_.85fr]">
        <button onClick={() => navigate('assessment')} className="ndee-focus rounded-[2rem] bg-[var(--ndee-lilac)] p-7 text-left sm:p-8">
          <p className="ndee-eyebrow">{experience.reflectionLabel}</p><Sparkles className="mt-5 h-7 w-7 text-[var(--ndee-primary-strong)]" /><h2 className="mt-4 text-2xl font-bold">{t.profileTitle}</h2><p className="mt-2 max-w-xl leading-relaxed text-[var(--ndee-muted)]">{t.profileText}</p><span className="mt-5 inline-flex items-center gap-2 font-bold text-[var(--ndee-primary-strong)]">{t.profileTitle}<ArrowRight className="h-4 w-4" /></span>
        </button>
        <div className="ndee-surface rounded-[2rem] p-7 sm:p-8"><ShieldCheck className="h-7 w-7 text-[var(--ndee-primary)]" /><h2 className="mt-4 text-xl font-bold">{t.local}</h2><p className="mt-2 text-sm leading-relaxed text-[var(--ndee-muted)]">{experience.privacyShort}</p><p className="mt-4 text-xs leading-relaxed text-[var(--ndee-muted)]">{t.notMedical}</p></div>
      </div>
    </section>
  </main>;

  return <div className="min-h-screen text-[var(--ndee-ink)]">{header}{content}{privacyOpen && <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[#26332f]/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true"><div className="ndee-surface w-full max-w-lg rounded-[2rem] p-7"><button onClick={() => setPrivacyOpen(false)} className="ndee-focus ml-auto flex h-11 w-11 items-center justify-center rounded-full" aria-label={translate('buttons.close')}><X /></button><LockKeyhole className="h-8 w-8 text-[var(--ndee-primary)]" /><h2 className="mt-4 text-2xl font-bold">{t.privacy}</h2><p className="mt-3 text-sm leading-relaxed text-[var(--ndee-muted)]">{t.localText}</p><p className="mt-3 text-sm leading-relaxed text-[var(--ndee-muted)]">{t.notMedical}</p><div className="mt-6 grid gap-3"><button onClick={() => void removeAssessment()} className="ndee-focus min-h-11 rounded-2xl border bg-white/70 p-3 font-semibold">{t.clearAssessment}</button><button onClick={() => void removePersonalization()} className="ndee-focus min-h-11 rounded-2xl border bg-white/70 p-3 font-semibold">{t.clearPersonalization}</button><button onClick={() => void removeAll()} className="ndee-focus min-h-11 rounded-2xl bg-[var(--ndee-danger)] p-3 font-semibold text-white">{t.clearAll}</button></div>{status && <p className="mt-4 text-sm font-semibold text-[var(--ndee-primary-strong)]">{status}</p>}</div></div>}</div>;
};

export default NDeeApp;
