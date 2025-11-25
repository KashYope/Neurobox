import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  ArrowLeft,
  Building2,
  Button,
  ClipboardList,
  FileSpreadsheet,
  Lock,
  LogOut,
  Download,
  UploadCloud,
  User,
  UserPlus
} from '../../components/ui';
import { saveExercise } from '../../services/dataService';
import { apiClient } from '../../services/apiClient';
import { Exercise, NeuroType, PartnerAccount, Situation } from '../../types';

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

const csvTemplateContent = [
  'title,description,duration,situations,steps,tags,neurotypes,warning,imageUrl',
  '"Respiration 5-5-5","Breathing exercise to calm the nervous system","5 min","Stress|Anxiety","Inhale for 5|Hold for 5|Exhale for 5","Breathing|Relaxation","ADHD|ASD","Avoid if dizziness","https://placehold.co/600x400/0f172a/ffffff?text=Respiration"'
].join('\n');

const jsonTemplateContent = JSON.stringify(
  [
    {
      title: 'Respiration 5-5-5',
      description: 'Breathing exercise to calm the nervous system',
      duration: '5 min',
      situations: ['Stress', 'Anxiety'],
      steps: ['Inhale for 5', 'Hold for 5', 'Exhale for 5'],
      tags: ['Breathing', 'Relaxation'],
      neurotypes: ['ADHD', 'ASD'],
      warning: 'Avoid if dizziness',
      imageUrl: 'https://placehold.co/600x400/0f172a/ffffff?text=Respiration'
    }
  ],
  null,
  2
);

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

export interface PartnerPortalProps {
  onBack: () => void;
}

export const PartnerPortal: React.FC<PartnerPortalProps> = ({ onBack }) => {
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

  const handleDownloadTemplate = (format: 'csv' | 'json') => {
    const content = format === 'csv' ? csvTemplateContent : jsonTemplateContent;
    const blob = new Blob([content], {
      type: format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json'
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = format === 'csv'
      ? 'neurobox-partner-template.csv'
      : 'neurobox-partner-template.json';
    link.click();

    URL.revokeObjectURL(url);
  };

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
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <FileSpreadsheet className="w-4 h-4" /> {t('partner:import.csvFormat')}
              </div>
              <Button variant="outline" size="sm" onClick={() => handleDownloadTemplate('csv')}>
                <Download className="w-4 h-4 mr-1" /> {t('partner:import.downloadCsvTemplate')}
              </Button>
            </div>
            <p className="text-sm text-slate-500 mb-2">{t('partner:import.csvHeaders')}</p>
            <p className="text-xs text-slate-400">{t('partner:import.csvSeparator')}</p>
          </div>
          <div className="border border-dashed border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <FileSpreadsheet className="w-4 h-4" /> {t('partner:import.jsonFormat')}
              </div>
              <Button variant="outline" size="sm" onClick={() => handleDownloadTemplate('json')}>
                <Download className="w-4 h-4 mr-1" /> {t('partner:import.downloadJsonTemplate')}
              </Button>
            </div>
            <p className="text-sm text-slate-500 mb-2">{t('partner:import.jsonStructure')}</p>
            <p className="text-xs text-slate-400">{t('partner:import.jsonExample')}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-500">{t('partner:import.templateHelper')}</p>

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
