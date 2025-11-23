import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

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
  FileSpreadsheet,
  Heart,
  Image as ImageIcon,
  Languages,
  Lock,
  LogOut,
  ShieldCheck,
  UploadCloud,
  User,
  Users,
  UserPlus,
  XCircle,
  Zap
} from '../components/ui';
import { Onboarding } from '../components/onboarding/Onboarding';
import { Dashboard } from '../features/dashboard/Dashboard';
import { PartnerPortal } from '../features/partners/PartnerPortal';
import { BatchTranslationPanel } from '../features/admin/BatchTranslationPanel';
import { Exercise, NeuroType, Situation, UserProfile, PartnerAccount } from '../types';
import {
  getUser,
  saveUser,
  getExercises,
  getRecommendedExercises,
  saveExercise,
  incrementThanks,
  moderateExercise
} from '../services/dataService';
import { syncService, SyncStatus } from '../services/syncService';
import { apiClient, type AdminMetricsResponse } from '../services/apiClient';

// --- Components ---

const TagBadge: React.FC<{ text: string }> = ({ text }) => (
  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 mr-2 mb-2">
    {text}
  </span>
);

const ExerciseDetail: React.FC<{ 
  exercise: Exercise; 
  onBack: () => void; 
  onThanks: () => void 
}> = ({ exercise, onBack, onThanks }) => {
  const { t } = useTranslation(['common', 'exercise']);
  const [hasThanked, setHasThanked] = useState(false);

  const handleThanks = () => {
    if (!hasThanked) {
      onThanks();
      setHasThanked(true);
    }
  };

  return (
    <div className="animate-slide-in bg-white min-h-screen md:min-h-0 pb-20">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 p-4 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="!p-2">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h2 className="text-lg font-bold truncate">{exercise.title}</h2>
      </div>

      <div className="max-w-3xl mx-auto p-4 md:p-8">
        {/* Hero Image/GIF */}
        <div className="rounded-2xl overflow-hidden shadow-lg mb-8 aspect-video bg-gray-100 relative">
          <img 
            src={exercise.imageUrl} 
            alt={exercise.title}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/e2e8f0/94a3b8?text=NeuroSooth' }}
          />
          <div className="absolute bottom-4 left-4 flex gap-2">
            {exercise.situation.map(s => (
              <span key={s} className="bg-black/70 text-white px-3 py-1 rounded-full text-xs backdrop-blur-sm">
                {t(`situations.${s}`)}
              </span>
            ))}
          </div>
        </div>

        {/* Header Info */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>{exercise.duration}</span>
            </div>
            <div className="flex items-center gap-1 text-sm font-medium text-rose-600 bg-rose-50 px-3 py-1 rounded-full">
              <Heart className="w-4 h-4 fill-rose-600" />
              <span>{t('exercise:detail.peopleHelped', { count: exercise.thanksCount + (hasThanked ? 1 : 0) })}</span>
            </div>
          </div>
          
          <p className="text-lg text-slate-700 leading-relaxed">
            {exercise.description}
          </p>
        </div>

        {/* Warning Box */}
        {exercise.warning && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg mb-8 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">{exercise.warning}</p>
          </div>
        )}

        {/* Steps */}
        <div className="space-y-6 mb-12">
          <h3 className="text-xl font-bold text-slate-900 mb-4">{t('exercise:detail.instructions')}</h3>
          {exercise.steps.map((step, idx) => (
            <div key={idx} className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm">
                {idx + 1}
              </div>
              <p className="text-slate-700 mt-1">{step}</p>
            </div>
          ))}
        </div>

        {/* Action */}
        <div className="border-t border-gray-100 pt-8 text-center">
          <p className="text-slate-500 mb-4 text-sm">{t('exercise:detail.wasItHelpful')}</p>
          <Button 
            size="lg" 
            variant={hasThanked ? "outline" : "primary"}
            onClick={handleThanks}
            disabled={hasThanked}
            className={hasThanked ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-rose-600 hover:bg-rose-700 text-white"}
          >
            <Heart className={`w-5 h-5 mr-2 ${hasThanked ? 'fill-rose-600' : ''}`} />
            {hasThanked ? t('exercise:detail.thanksSent') : t('exercise:detail.sayThanks')}
          </Button>
        </div>
      </div>
    </div>
  );
};

const AddExerciseForm: React.FC<{ onCancel: () => void; onSubmit: (ex: Exercise) => void }> = ({ onCancel, onSubmit }) => {
  const { t } = useTranslation(['common', 'exercise']);
  const [formData, setFormData] = useState<Partial<Exercise>>({
    title: '',
    description: '',
    duration: '',
    steps: [''],
    situation: [],
    neurotypes: [],
    tags: [],
    imageUrl: ''
  });

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

  const doSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) return;

    const timestamp = new Date().toISOString();
    const newEx: Exercise = {
      id: Date.now().toString(),
      title: formData.title!,
      description: formData.description!,
      situation: formData.situation?.length ? formData.situation : [Situation.Stress],
      neurotypes: formData.neurotypes || [],
      duration: formData.duration || '5 min',
      steps: formData.steps?.filter(s => s.trim() !== '') || [],
      imageUrl: formData.imageUrl || 'https://placehold.co/600x400/94a3b8/ffffff?text=Community+Content',
      tags: ['Community'],
      thanksCount: 0,
      isCommunitySubmitted: true,
      moderationStatus: 'pending',
      createdAt: timestamp,
      updatedAt: timestamp
    };

    onSubmit(newEx);
  };

  return (
    <div className="fixed inset-0 bg-slate-50 z-50 overflow-y-auto animate-slide-in">
      <div className="max-w-2xl mx-auto bg-white min-h-screen shadow-xl">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold">{t('exercise:creation.title')}</h2>
          <Button variant="ghost" size="sm" onClick={onCancel}>{t('exercise:creation.cancel')}</Button>
        </div>

        <form onSubmit={doSubmit} className="p-6 space-y-6">
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-sm flex gap-3">
            <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>
              {t('exercise:creation.communityNote')}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('exercise:creation.form.title')}</label>
            <input
              className="w-full border p-2 rounded-lg" 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})} 
              placeholder={t('exercise:creation.form.titlePlaceholder')}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('exercise:creation.form.description')}</label>
            <textarea 
              className="w-full border p-2 rounded-lg" 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
              placeholder={t('exercise:creation.form.descriptionPlaceholder')}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('exercise:creation.form.image')}</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <ImageIcon className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                <input 
                  className="w-full border p-2 pl-10 rounded-lg" 
                  value={formData.imageUrl} 
                  onChange={e => setFormData({...formData, imageUrl: e.target.value})} 
                  placeholder="https://..."
                />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1">{t('exercise:creation.form.imageHelper')}</p>
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
                      ? 'bg-teal-600 text-white border-teal-600' 
                      : 'bg-white text-slate-600 border-slate-200'
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
              className="w-full border p-2 rounded-lg" 
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
                  className="w-full border p-2 rounded-lg"
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

// --- Partner Portal Helpers ---
interface PartnerExerciseDraft {
  title: string;
  description: string;
  duration?: string;
  steps?: string[];
  tags?: string[];
  situation?: Situation[];
  neurotypes?: NeuroType[];
  warning?: string;
  imageUrl?: string;
}

const splitToList = (value: unknown, pattern: RegExp = /[,;|]/): string[] => {
  if (Array.isArray(value)) {
    return value.map(item => `${item}`.trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(pattern)
      .map(item => item.trim())
      .filter(Boolean);
  }
  if (value === undefined || value === null) return [];
  const asString = `${value}`.trim();
  return asString ? [asString] : [];
};

const splitStepsInput = (value: unknown): string[] => {
  return splitToList(value, /\r?\n|\|/);
};

const mapStringsToSituations = (values: string[]): Situation[] => {
  const lowerValues = values.map(value => value.toLowerCase());
  const matches = lowerValues
    .map(value =>
      Object.values(Situation).find(option =>
        option.toLowerCase() === value || option.toLowerCase().includes(value)
      )
    )
    .filter((value): value is Situation => Boolean(value));
  return matches;
};

const mapStringsToNeurotypes = (values: string[]): NeuroType[] => {
  const lowerValues = values.map(value => value.toLowerCase());
  const matches = lowerValues
    .map(value =>
      Object.values(NeuroType).find(option =>
        option.toLowerCase() === value || option.toLowerCase().includes(value)
      )
    )
    .filter((value): value is NeuroType => Boolean(value));
  return matches;
};

const createPartnerExercise = (draft: PartnerExerciseDraft, author?: string): Exercise => {
  const timestamp = new Date().toISOString();
  const steps = (draft.steps || []).map(step => step.trim()).filter(Boolean);
  const tags = (draft.tags || []).map(tag => tag.trim()).filter(Boolean);
  const situation = draft.situation && draft.situation.length > 0 ? draft.situation : [Situation.Stress];

  return {
    id: `partner-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: draft.title,
    description: draft.description,
    duration: draft.duration && draft.duration.trim() ? draft.duration : '5 min',
    steps: steps.length ? steps : ['Respiration consciente pendant 60 secondes'],
    tags: tags.length ? tags : ['Partenaire'],
    situation,
    neurotypes: draft.neurotypes || [],
    warning: draft.warning,
    imageUrl: draft.imageUrl && draft.imageUrl.trim()
      ? draft.imageUrl
      : 'https://placehold.co/600x400/0f172a/ffffff?text=Espace+Partenaire',
    thanksCount: 0,
    author,
    isPartnerContent: true,
    moderationStatus: 'approved',
    createdAt: timestamp,
    updatedAt: timestamp
  };
};

const parseCsvLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
};

const mapRowToDraft = (row: Record<string, string>): PartnerExerciseDraft => {
  const title = row['title'] || row['nom'] || '';
  const description = row['description'] || row['desc'] || row['details'] || '';
  const duration = row['duration'] || row['duree'];
  const steps = splitStepsInput(row['steps'] || row['etapes']);
  const tags = splitToList(row['tags'] || row['motscles']);
  const situationStrings = splitToList(row['situations'] || row['situation']);
  const neuroStrings = splitToList(row['neurotypes']);

  return {
    title: title.trim(),
    description: description.trim(),
    duration: duration?.trim(),
    steps,
    tags,
    situation: mapStringsToSituations(situationStrings),
    neurotypes: mapStringsToNeurotypes(neuroStrings),
    warning: (row['warning'] || row['alerte'])?.trim(),
    imageUrl: (row['imageurl'] || row['image'])?.trim()
  };
};

const parseCsvDrafts = (content: string): PartnerExerciseDraft[] => {
  const lines = content
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length < 2) {
    throw new Error('Le fichier CSV doit contenir un en-tête et au moins une ligne.');
  }

  const headers = parseCsvLine(lines[0]).map(header => header.toLowerCase());
  const drafts = lines.slice(1).map(line => {
    const values = parseCsvLine(line);
    if (values.every(value => value.trim().length === 0)) {
      return null;
    }

    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] ?? '';
    });

    return mapRowToDraft(row);
  })
  .filter((draft): draft is PartnerExerciseDraft => Boolean(draft && draft.title && draft.description));

  return drafts;
};

const parseJsonDrafts = (content: string): PartnerExerciseDraft[] => {
  let data: unknown;
  try {
    data = JSON.parse(content);
  } catch {
    throw new Error('JSON invalide. Veuillez vérifier la structure du fichier.');
  }

  const entries = Array.isArray(data) ? data : [data];
  const drafts = entries.map((entry) => {
    if (typeof entry !== 'object' || entry === null) {
      return null;
    }

    const obj = entry as Record<string, unknown>;
    const title = typeof obj.title === 'string' ? obj.title : '';
    const description = typeof obj.description === 'string' ? obj.description : '';

    return {
      title: title.trim(),
      description: description.trim(),
      duration: typeof obj.duration === 'string' ? obj.duration : undefined,
      steps: splitStepsInput(obj.steps),
      tags: splitToList(obj.tags),
      situation: mapStringsToSituations(splitToList(obj.situations ?? obj.situation)),
      neurotypes: mapStringsToNeurotypes(splitToList(obj.neurotypes ?? obj.neurotype)),
      warning: typeof obj.warning === 'string' ? obj.warning.trim() : undefined,
      imageUrl: typeof obj.imageUrl === 'string'
        ? obj.imageUrl
        : typeof obj.image === 'string'
          ? obj.image
          : undefined,
    } as PartnerExerciseDraft;
  }).filter((draft): draft is PartnerExerciseDraft => Boolean(draft && draft.title && draft.description));

  return drafts;
};

interface PartnerFormState {
  title: string;
  description: string;
  duration: string;
  warning: string;
  imageUrl: string;
  situation: Situation[];
  steps: string[];
  tagsText: string;
  neurotypes: NeuroType[];
}

const createEmptyPartnerForm = (): PartnerFormState => ({
  title: '',
  description: '',
  duration: '5 min',
  warning: '',
  imageUrl: '',
  situation: [Situation.Stress],
  steps: [''],
  tagsText: 'Partenaire',
  neurotypes: []
});

const LegacyPartnerPortal: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { t } = useTranslation(['common', 'partner']);
  const [activeAccount, setActiveAccount] = useState<PartnerAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({
    organization: '',
    contactName: '',
    email: '',
    password: ''
  });
  const [authError, setAuthError] = useState<string | null>(null);
  const [manualForm, setManualForm] = useState<PartnerFormState>(createEmptyPartnerForm());
  const [manualFeedback, setManualFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [importFeedback, setImportFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [fileInputKey, setFileInputKey] = useState<number>(Date.now());

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { user } = await apiClient.getMe();
        setActiveAccount({
            id: user.id,
            organization: user.organization,
            contactName: user.contactName,
            email: user.email,
            role: user.role,
            status: 'active',
            password: '' // Not needed/secure
        });
      } catch (e) {
        setActiveAccount(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  const emitSessionChange = (session: PartnerAccount | null) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('partner-session-change', { detail: session }));
    }
  };

  const handleLogout = async () => {
    try {
      await apiClient.logout();
      setActiveAccount(null);
      emitSessionChange(null);
    } catch (e) {
      console.error('Logout failed', e);
    }
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthError(null);

    if (!authForm.organization || !authForm.contactName || !authForm.email || !authForm.password) {
      setAuthError(t('partner:auth.errors.allFieldsRequired'));
      return;
    }

    try {
      await apiClient.register({
        organization: authForm.organization.trim(),
        contactName: authForm.contactName.trim(),
        email: authForm.email.trim(),
        password: authForm.password
      });

      alert(t('partner:auth.registrationSuccess'));
      setAuthMode('login');
      setAuthForm({ organization: '', contactName: '', email: '', password: '' });
    } catch (error: any) {
      setAuthError(error.message || t('partner:auth.errors.generic'));
    }
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthError(null);

    if (!authForm.email || !authForm.password) {
      setAuthError(t('partner:auth.errors.missingCredentials'));
      return;
    }

    try {
      const { user } = await apiClient.login({
        email: authForm.email,
        password: authForm.password
      });

      const account = {
        id: user.id,
        organization: user.organization,
        contactName: user.contactName,
        email: user.email,
        role: user.role,
        status: 'active' as const,
        password: ''
      };

      setActiveAccount(account);
      emitSessionChange(account);
      setAuthForm({ organization: '', contactName: '', email: '', password: '' });
    } catch (error: any) {
      setAuthError(error.message || t('partner:auth.errors.invalidCredentials'));
    }
  };

  const handleManualSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setManualFeedback(null);

    if (!activeAccount) {
      setManualFeedback({ type: 'error', text: t('partner:manual.loginRequired') });
      return;
    }

    if (!manualForm.title.trim() || !manualForm.description.trim()) {
      setManualFeedback({ type: 'error', text: t('partner:manual.validationError') });
      return;
    }

    const tagsList = splitToList(manualForm.tagsText, /[,;|]/);

    const draft: PartnerExerciseDraft = {
      title: manualForm.title.trim(),
      description: manualForm.description.trim(),
      duration: manualForm.duration.trim(),
      warning: manualForm.warning.trim() || undefined,
      imageUrl: manualForm.imageUrl.trim() || undefined,
      steps: manualForm.steps.map(step => step.trim()).filter(Boolean),
      tags: tagsList,
      situation: manualForm.situation.length ? manualForm.situation : [Situation.Stress],
      neurotypes: manualForm.neurotypes,
    };

    const exercise = createPartnerExercise(draft, `${activeAccount.organization} • ${activeAccount.contactName}`);
    saveExercise(exercise);
    setManualFeedback({ type: 'success', text: t('partner:manual.success') });
    setManualForm(createEmptyPartnerForm());
  };

  const toggleSituation = (value: Situation) => {
    setManualForm(prev => {
      const exists = prev.situation.includes(value);
      const situation = exists ? prev.situation.filter(item => item !== value) : [...prev.situation, value];
      return { ...prev, situation };
    });
  };

  const toggleNeurotype = (value: NeuroType) => {
    setManualForm(prev => {
      const exists = prev.neurotypes.includes(value);
      const neurotypes = exists ? prev.neurotypes.filter(item => item !== value) : [...prev.neurotypes, value];
      return { ...prev, neurotypes };
    });
  };

  const handleStepChange = (index: number, value: string) => {
    setManualForm(prev => {
      const steps = [...prev.steps];
      steps[index] = value;
      return { ...prev, steps };
    });
  };

  const addStepField = () => {
    setManualForm(prev => ({ ...prev, steps: [...prev.steps, ''] }));
  };

  const removeStepField = (index: number) => {
    setManualForm(prev => ({ ...prev, steps: prev.steps.filter((_, idx) => idx !== index) }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeAccount) return;
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const content = reader.result ? String(reader.result) : '';
        const drafts = file.name.toLowerCase().endsWith('.json')
          ? parseJsonDrafts(content)
          : parseCsvDrafts(content);

        if (drafts.length === 0) {
          setImportFeedback({ type: 'error', text: t('partner:import.noValidExercise') });
          setFileInputKey(Date.now());
          return;
        }

        drafts.forEach(draft => {
          const exercise = createPartnerExercise(draft, activeAccount.organization);
          saveExercise(exercise);
        });

        setImportFeedback({
          type: 'success',
          text: t('partner:import.success', { count: drafts.length, fileName: file.name })
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : t('partner:import.error');
        setImportFeedback({ type: 'error', text: message });
      } finally {
        setFileInputKey(Date.now());
      }
    };

    reader.readAsText(file);
  };

  const renderAuthForm = () => (
    <div className="max-w-xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Lock className="w-8 h-8 text-slate-600" />
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              {authMode === 'login' ? t('partner:auth.loginTitle') : t('partner:auth.registerTitle')}
            </h2>
            <p className="text-sm text-slate-500">{t('partner:auth.accessRestricted')}</p>
          </div>
        </div>

        <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="space-y-4">
          {authMode === 'register' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">{t('partner:auth.organization')}</label>
                <input
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  value={authForm.organization}
                  onChange={e => setAuthForm(prev => ({ ...prev, organization: e.target.value }))}
                  placeholder={t('partner:auth.organizationPlaceholder')}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('partner:auth.contactName')}</label>
                <input
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  value={authForm.contactName}
                  onChange={e => setAuthForm(prev => ({ ...prev, contactName: e.target.value }))}
                  placeholder={t('partner:auth.contactNamePlaceholder')}
                  required
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">{t('partner:auth.email')}</label>
            <input
              type="email"
              className="w-full border border-slate-200 rounded-lg px-3 py-2"
              value={authForm.email}
              onChange={e => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
              placeholder={t('partner:auth.emailPlaceholder')}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('partner:auth.password')}</label>
            <input
              type="password"
              className="w-full border border-slate-200 rounded-lg px-3 py-2"
              value={authForm.password}
              onChange={e => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
              placeholder={t('partner:auth.passwordPlaceholder')}
              required
            />
          </div>

          {authError && (
            <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-3">
              {authError}
            </div>
          )}

          <Button type="submit" className="w-full" size="lg">
            {authMode === 'login' ? t('partner:auth.loginAction') : t('partner:auth.createAccess')}
          </Button>
        </form>

        <div className="text-center text-sm text-slate-500">
          {authMode === 'login' ? (
            <button
              type="button"
              className="text-teal-600 font-medium"
              onClick={() => { setAuthMode('register'); setAuthError(null); }}
            >
              <UserPlus className="inline w-4 h-4 mr-1" /> {t('partner:auth.createAccountLink')}
            </button>
          ) : (
            <button
              type="button"
              className="text-teal-600 font-medium"
              onClick={() => { setAuthMode('login'); setAuthError(null); }}
            >
              <User className="inline w-4 h-4 mr-1" /> {t('partner:auth.hasAccountLink')}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderWorkspace = () => (
    <div className="space-y-8">
      {activeAccount && (
        <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-slate-400">{t('partner:workspace.verifiedAccount')}</p>
            <h2 className="text-2xl font-semibold text-slate-900">{activeAccount.organization}</h2>
            <p className="text-sm text-slate-500">{t('partner:workspace.referent', { name: activeAccount.contactName })}</p>
            <p className="text-sm text-slate-500">{t('partner:workspace.email', { email: activeAccount.email })}</p>
          </div>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" /> {t('partner:workspace.logout')}
          </Button>
        </div>
      )}

      <section className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-6 h-6 text-teal-600" />
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{t('partner:manual.title')}</h3>
            <p className="text-sm text-slate-500">{t('partner:manual.subtitle')}</p>
          </div>
        </div>

        {manualFeedback && (
          <div className={`text-sm rounded-xl border px-4 py-3 ${
            manualFeedback.type === 'success'
              ? 'bg-teal-50 border-teal-200 text-teal-700'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}>
            {manualFeedback.text}
          </div>
        )}

        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('partner:manual.form.title')}</label>
              <input
                className="w-full border border-slate-200 rounded-lg px-3 py-2"
                value={manualForm.title}
                onChange={e => setManualForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder={t('partner:manual.form.titlePlaceholder')}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('partner:manual.form.duration')}</label>
              <input
                className="w-full border border-slate-200 rounded-lg px-3 py-2"
                value={manualForm.duration}
                onChange={e => setManualForm(prev => ({ ...prev, duration: e.target.value }))}
                placeholder={t('partner:manual.form.durationPlaceholder')}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('partner:manual.form.description')}</label>
            <textarea
              className="w-full border border-slate-200 rounded-lg px-3 py-2"
              value={manualForm.description}
              onChange={e => setManualForm(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              placeholder={t('partner:manual.form.descriptionPlaceholder')}
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('partner:manual.form.image')}</label>
              <input
                className="w-full border border-slate-200 rounded-lg px-3 py-2"
                value={manualForm.imageUrl}
                onChange={e => setManualForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                placeholder={t('partner:manual.form.imagePlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('partner:manual.form.warning')}</label>
              <input
                className="w-full border border-slate-200 rounded-lg px-3 py-2"
                value={manualForm.warning}
                onChange={e => setManualForm(prev => ({ ...prev, warning: e.target.value }))}
                placeholder={t('partner:manual.form.warningPlaceholder')}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('partner:manual.form.tags')}</label>
            <input
              className="w-full border border-slate-200 rounded-lg px-3 py-2"
              value={manualForm.tagsText}
              onChange={e => setManualForm(prev => ({ ...prev, tagsText: e.target.value }))}
              placeholder={t('partner:manual.form.tagsPlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('partner:manual.form.situations')}</label>
            <div className="flex flex-wrap gap-2">
              {Object.values(Situation).map(item => (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleSituation(item)}
                  className={`px-3 py-1 rounded-full text-xs border ${manualForm.situation.includes(item)
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  {t(`situations.${item}`)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('partner:manual.form.neurotypes')}</label>
            <div className="flex flex-wrap gap-2">
              {Object.values(NeuroType).filter(type => type !== NeuroType.None).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleNeurotype(type)}
                  className={`px-3 py-1 rounded-full text-xs border ${manualForm.neurotypes.includes(type)
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  {t(`neuroTypes.${type}`)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('partner:manual.form.detailedSteps')}</label>
            <div className="space-y-2">
              {manualForm.steps.map((step, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    className="flex-1 border border-slate-200 rounded-lg px-3 py-2"
                    value={step}
                    onChange={e => handleStepChange(index, e.target.value)}
                    placeholder={t('partner:manual.form.stepPlaceholder', { number: index + 1 })}
                  />
                  {manualForm.steps.length > 1 && (
                    <Button type="button" variant="ghost" onClick={() => removeStepField(index)}>
                      {t('partner:manual.form.deleteStep')}
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button type="button" variant="secondary" size="sm" className="mt-3" onClick={addStepField}>
              {t('partner:manual.form.addStep')}
            </Button>
          </div>

          <div className="pt-4">
            <Button type="submit" size="lg" className="w-full">{t('partner:manual.publish')}</Button>
          </div>
        </form>
      </section>

      <section className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-3">
          <UploadCloud className="w-6 h-6 text-teal-600" />
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{t('partner:import.title')}</h3>
            <p className="text-sm text-slate-500">{t('partner:import.subtitle')}</p>
          </div>
        </div>

        {importFeedback && (
          <div className={`text-sm rounded-xl border px-4 py-3 ${
            importFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}>
            {importFeedback.text}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="border border-dashed border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-700 font-medium mb-2">
              <FileSpreadsheet className="w-4 h-4" /> {t('partner:import.csvFormat')}
            </div>
            <p className="text-sm text-slate-500 mb-2">{t('partner:import.csvHeaders')}</p>
            <p className="text-xs text-slate-400">{t('partner:import.csvSeparator')}</p>
          </div>
          <div className="border border-dashed border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-700 font-medium mb-2">
              <FileSpreadsheet className="w-4 h-4" /> {t('partner:import.jsonFormat')}
            </div>
            <p className="text-sm text-slate-500 mb-2">{t('partner:import.jsonStructure')}</p>
            <p className="text-xs text-slate-400">{t('partner:import.jsonExample')}</p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
          <p className="text-sm text-slate-600">{t('partner:import.fileInput')}</p>
          <input
            key={fileInputKey}
            type="file"
            accept=".csv,.json,application/json,text/csv"
            onChange={handleFileUpload}
            className="w-full text-sm"
          />
        </div>
      </section>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-teal-600 text-white rounded-xl p-2">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">{t('partner:workspace.backoffice')}</p>
              <h1 className="text-2xl font-semibold text-slate-900">{t('partner:workspace.partnerSpace')}</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" /> {t('partner:workspace.backToCatalog')}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {isLoading ? <div className="text-center py-8">Loading...</div> : (activeAccount ? renderWorkspace() : renderAuthForm())}
      </main>
    </div>
  );
};

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
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-20">
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

  // Dummy state for moderation panel props since we reuse it
  const [pendingExercises, setPendingExercises] = useState<Exercise[]>([]);
  const [reviewedExercises, setReviewedExercises] = useState<Exercise[]>([]);
  const [moderationStatus, setModerationStatus] = useState<string | null>(null);

  const loadAccounts = useCallback(async () => {
    setIsLoadingAccounts(true);
    setAccountsError(null);
    try {
      const response = await apiClient.fetchPartners();
      const mapped = response.partners.map(acc => ({
        ...acc,
        password: ''
      }));
      setAccounts(mapped);
    } catch (error: any) {
      setAccountsError(error.message || 'Unable to load partner accounts');
    } finally {
      setIsLoadingAccounts(false);
    }
  }, []);

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
        setMetricsError(error.message || 'Unable to load platform metrics');
      } finally {
        setIsLoadingMetrics(false);
      }
    },
    [metricsUpdatedAt]
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
          label: 'Total Thanks',
          value: metrics.totalThanks,
          subLabel: `${formatNumber(metrics.approvedExercises)} approved exercises`,
          icon: Heart,
          iconColor: 'text-rose-500',
          iconBg: 'bg-rose-50'
        },
        {
          label: 'Exercises in DB',
          value: metrics.totalExercises,
          subLabel: `${formatNumber(metrics.pendingModeration)} pending moderation`,
          icon: ClipboardList,
          iconColor: 'text-indigo-600',
          iconBg: 'bg-indigo-50'
        },
        {
          label: 'Users',
          value: metrics.totalUsers,
          subLabel: `${formatNumber(metrics.activeUsers)} active / ${formatNumber(metrics.pendingUsers)} pending`,
          icon: Users,
          iconColor: 'text-slate-700',
          iconBg: 'bg-slate-50'
        },
        {
          label: 'Content Mix',
          value: metrics.partnerExercises + metrics.communityExercises,
          subLabel: `${formatNumber(metrics.partnerExercises)} partner / ${formatNumber(metrics.communityExercises)} community`,
          icon: BarChart3,
          iconColor: 'text-emerald-600',
          iconBg: 'bg-emerald-50'
        }
      ]
    : [];

  const handleUpdateStatus = async (id: string, status: 'active' | 'rejected') => {
     setActionInProgress(id);
     setAccountsError(null);
     try {
       if (status === 'active') {
         await apiClient.approvePartner(id);
       } else {
         await apiClient.rejectPartner(id);
       }
       await loadAccounts();
     } catch (error: any) {
       setAccountsError(error.message || 'Unable to update account status');
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
    return <BatchTranslationPanel onBack={() => setViewMode('accounts')} />;
  }

  if (viewMode === 'moderation') {
    return (
      <ModerationPanel
        pendingExercises={pendingExercises}
        reviewedExercises={reviewedExercises}
        onApprove={(ex, notes) => handleModerationDecision(ex, 'approved', notes)}
        onReject={(ex, notes) => handleModerationDecision(ex, 'rejected', notes)}
        onBack={() => setViewMode('accounts')}
        statusNote={moderationStatus}
      />
    );
  }

  const pendingAccounts = accounts.filter(a => a.status === 'pending');
  const activeAccounts = accounts.filter(a => a.status === 'active');

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-teal-400" />
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400">NeuroSooth</p>
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" size="sm" onClick={() => setViewMode('batchTranslation')}>
              <Languages className="w-4 h-4 mr-2" />
              Batch Traductions
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setViewMode('moderation')}>
              <ClipboardList className="w-4 h-4 mr-2" />
              Moderation Content
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout} className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800">
               <LogOut className="w-4 h-4 mr-2" />
               Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <section className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-emerald-600" />
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Live overview</p>
                <h2 className="text-lg font-bold text-slate-900">Platform metrics</h2>
              </div>
            </div>
            <div className="text-xs text-slate-500">
              {metricsUpdatedAt
                ? `Updated ${new Date(metricsUpdatedAt).toLocaleTimeString()}`
                : 'Awaiting first sync'}
            </div>
          </div>

          {metricsError && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {metricsError}
            </div>
          )}

          {isLoadingMetrics && !metrics ? (
            <p className="text-slate-500 italic">Loading platform metrics...</p>
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
                    <h2 className="text-lg font-bold text-slate-900">Pending Registrations ({pendingAccounts.length})</h2>
                </div>
            </div>

            {accountsError && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {accountsError}
              </div>
            )}

            {isLoadingAccounts ? (
                <p className="text-slate-500 italic">Loading partner accounts...</p>
            ) : pendingAccounts.length === 0 ? (
                <p className="text-slate-500 italic">No pending account requests.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                            <tr>
                                <th className="px-4 py-3 rounded-l-lg">Organization</th>
                                <th className="px-4 py-3">Contact</th>
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3 rounded-r-lg text-right">Actions</th>
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
                                            {actionInProgress === acc.id ? 'Processing...' : 'Reject'}
                                        </Button>
                                        <Button size="sm" onClick={() => handleUpdateStatus(acc.id, 'active')} disabled={actionInProgress === acc.id}>
                                            {actionInProgress === acc.id ? 'Saving...' : 'Approve'}
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
                <h2 className="text-lg font-bold text-slate-900">Active Partners ({activeAccounts.length})</h2>
            </div>

             {isLoadingAccounts ? (
                <p className="text-slate-500 italic">Loading partner accounts...</p>
             ) : activeAccounts.length === 0 ? (
                <p className="text-slate-500 italic">No active partners yet.</p>
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

const App: React.FC = () => {
  const { t } = useTranslation(['common']);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [allExercises, setAllExercises] = useState<Exercise[]>(() => getExercises());
  const [exercises, setExercises] = useState<Exercise[]>(() =>
    getRecommendedExercises(getExercises(), null, 'All')
  );
  const [view, setView] = useState<'onboarding' | 'dashboard' | 'detail' | 'add' | 'moderation' | 'partner' | 'admin'>('dashboard');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [situationFilter, setSituationFilter] = useState<Situation | 'All'>('All');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(syncService.getStatus());
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [partnerSession, setPartnerSession] = useState<PartnerAccount | null>(null);
  const [pendingAdminAction, setPendingAdminAction] = useState<'moderation' | null>(null);
  const [serverModerationData, setServerModerationData] = useState<{
    queue: Exercise[];
    reviewed: Exercise[];
  } | null>(null);
  const [moderationStatusMessage, setModerationStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    syncService.init();
    const unsubscribeCache = syncService.subscribe(setAllExercises);
    const unsubscribeStatus = syncService.subscribeStatus(setSyncStatus);

    return () => {
      unsubscribeCache();
      unsubscribeStatus();
    };
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
            status: 'active',
            password: ''
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
    } else {
      setView('onboarding');
    }
  }, []);

  useEffect(() => {
    if (pendingAdminAction === 'moderation' && partnerSession) {
      setView('moderation');
      setPendingAdminAction(null);
    }
  }, [pendingAdminAction, partnerSession]);

  useEffect(() => {
    if (view === 'partner' && partnerSession?.role === 'admin') {
      setView('admin');
    }
  }, [view, partnerSession]);

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
    const recs = getRecommendedExercises(allExercises, user, situationFilter);
    setExercises(recs);
  }, [allExercises, user, situationFilter]);

  useEffect(() => {
    if (!selectedExercise) return;
    const fresh = allExercises.find(ex => ex.id === selectedExercise.id);
    if (fresh && fresh !== selectedExercise) {
      setSelectedExercise(fresh);
    }
  }, [allExercises, selectedExercise]);

  const handleOnboardingComplete = (newUser: UserProfile) => {
    setUser(newUser);
    setView('dashboard');
  };

  const handleExerciseClick = (ex: Exercise) => {
    setSelectedExercise(ex);
    setView('detail');
  };

  const handleAddExercise = (newEx: Exercise) => {
    saveExercise(newEx);
    setView('dashboard');
  };

  const handleThanks = (exId: string) => {
    incrementThanks(exId);
  };

  const handlePartnerAccess = () => {
    // If already logged in as admin, go to admin dashboard
    if (partnerSession?.role === 'admin') {
        setView('admin');
    } else {
        setView('partner');
    }
    setIsAdminMenuOpen(false);
  };

  const handleModerationAccess = () => {
    if (partnerSession) {
      setView('moderation');
    } else {
      setPendingAdminAction('moderation');
      setView('partner');
    }
    setIsAdminMenuOpen(false);
  };

  const handleContributionAccess = () => {
    setView('add');
    setIsAdminMenuOpen(false);
  };

  const showSyncStatus =
    !syncStatus.isOnline || syncStatus.pendingMutations > 0 || syncStatus.isSyncing;

  const communityExercises = allExercises.filter(ex => ex.isCommunitySubmitted);
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
    const moderator = user?.name || 'Équipe NeuroSooth';
    const targetId = exercise.serverId ?? exercise.id;
    moderateExercise(targetId, status, {
      moderator,
      notes,
      shouldDelete: status === 'rejected'
    });
  };

  // Render Helpers
  if (view === 'admin') {
      return <AdminDashboard onBack={() => setView('dashboard')} />;
  }

  if (view === 'partner') {
    return <PartnerPortal onBack={() => setView('dashboard')} />;
  }

  if (view === 'moderation') {
    return (
      <ModerationPanel
        pendingExercises={effectivePendingExercises}
        reviewedExercises={effectiveReviewedExercises}
        onApprove={(exercise, notes) => handleModerationDecision(exercise, 'approved', notes)}
        onReject={(exercise, notes) => handleModerationDecision(exercise, 'rejected', notes)}
        onBack={() => setView('dashboard')}
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
        onBack={() => setView('dashboard')}
        onThanks={() => handleThanks(selectedExercise.id)}
      />
    );
  }

  if (view === 'add') {
    return (
      <AddExerciseForm 
        onCancel={() => setView('dashboard')} 
        onSubmit={handleAddExercise} 
      />
    );
  }

  // Dashboard View
  return (
    <Dashboard
      user={user}
      exercises={exercises}
      situationFilter={situationFilter}
      onFilterChange={setSituationFilter}
      onExerciseClick={handleExerciseClick}
      onAddTechnique={handleContributionAccess}
      onPartnerAccess={handlePartnerAccess}
      syncStatus={syncStatus}
      showSyncStatus={showSyncStatus}
      partnerSession={partnerSession}
      isAdminMenuOpen={isAdminMenuOpen}
      onOpenAdminMenu={() => setIsAdminMenuOpen(true)}
      onCloseAdminMenu={() => setIsAdminMenuOpen(false)}
    />
  );

};

export default App;
