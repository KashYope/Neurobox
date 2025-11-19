import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Heart,
  Wind,
  Brain,
  Flame,
  Moon,
  Zap,
  AlertTriangle,
  ArrowLeft,
  Plus,
  User,
  Check,
  Search,
  Activity,
  Image as ImageIcon,
  ShieldCheck,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  UploadCloud,
  FileSpreadsheet,
  LogOut,
  Lock,
  UserPlus,
  Menu,
  X,
  Coffee
} from 'lucide-react';

import { Button } from './components/Button';
import { Exercise, NeuroType, Situation, UserProfile, PartnerAccount } from './types';
import {
  getUser,
  saveUser,
  getExercises,
  getRecommendedExercises,
  saveExercise,
  incrementThanks,
  moderateExercise
} from './services/dataService';
import { syncService, SyncStatus } from './services/syncService';

// --- Components ---

const Onboarding: React.FC<{ onComplete: (user: UserProfile) => void }> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [selectedNeurotypes, setSelectedNeurotypes] = useState<NeuroType[]>([]);

  const toggleNeurotype = (type: NeuroType) => {
    if (selectedNeurotypes.includes(type)) {
      setSelectedNeurotypes(prev => prev.filter(t => t !== type));
    } else {
      setSelectedNeurotypes(prev => [...prev, type]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    
    const newUser: UserProfile = {
      name,
      neurotypes: selectedNeurotypes.length > 0 ? selectedNeurotypes : [NeuroType.None],
      sensitivities: [],
      completedOnboarding: true
    };
    
    saveUser(newUser);
    onComplete(newUser);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="mx-auto bg-teal-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Brain className="w-8 h-8 text-teal-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Bienvenue sur NeuroSooth</h1>
          <p className="text-slate-600 mt-2">Personnalisons votre expérience pour trouver les meilleures techniques de régulation.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Comment vous appelez-vous ?</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              placeholder="Votre prénom"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Profil Neuro-Atypique (Optionnel)</label>
            <div className="grid grid-cols-1 gap-2">
              {Object.values(NeuroType).filter(t => t !== NeuroType.None).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleNeurotype(type)}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${
                    selectedNeurotypes.includes(type)
                      ? 'border-teal-500 bg-teal-50 text-teal-800'
                      : 'border-gray-200 hover:bg-gray-50 text-slate-600'
                  }`}
                >
                  <span>{type}</span>
                  {selectedNeurotypes.includes(type) && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg">
            Commencer l'aventure
          </Button>
        </form>
      </div>
    </div>
  );
};

const TagBadge: React.FC<{ text: string }> = ({ text }) => (
  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 mr-2 mb-2">
    {text}
  </span>
);

const ExerciseCard: React.FC<{ exercise: Exercise; onClick: () => void }> = ({ exercise, onClick }) => {
  // Select an icon based on first situation or default
  const getIcon = () => {
    if (exercise.situation.includes(Situation.Crisis)) return <Activity className="w-5 h-5 text-rose-500" />;
    if (exercise.situation.includes(Situation.Sleep)) return <Moon className="w-5 h-5 text-indigo-500" />;
    if (exercise.situation.includes(Situation.Anger)) return <Flame className="w-5 h-5 text-orange-500" />;
    return <Wind className="w-5 h-5 text-teal-500" />;
  };

  return (
    <div 
      onClick={onClick}
      className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden border border-gray-100 flex flex-col h-full"
    >
      <div className="relative h-32 overflow-hidden bg-gray-100">
        <img 
          src={exercise.imageUrl} 
          alt={exercise.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/e2e8f0/94a3b8?text=NeuroSooth' }}
        />
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-semibold text-slate-700 flex items-center gap-1">
          <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> {exercise.thanksCount}
        </div>
      </div>
      
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-slate-900 leading-tight group-hover:text-teal-700 transition-colors">
            {exercise.title}
          </h3>
          {getIcon()}
        </div>
        
        <p className="text-sm text-slate-500 mb-4 line-clamp-2 flex-1">
          {exercise.description}
        </p>

        <div className="flex flex-wrap gap-1 mt-auto">
          {exercise.tags.slice(0, 2).map(tag => (
            <span key={tag} className="text-[10px] uppercase tracking-wider font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const ExerciseDetail: React.FC<{ 
  exercise: Exercise; 
  onBack: () => void; 
  onThanks: () => void 
}> = ({ exercise, onBack, onThanks }) => {
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
                {s}
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
              <span>{exercise.thanksCount + (hasThanked ? 1 : 0)} personnes aidées</span>
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
          <h3 className="text-xl font-bold text-slate-900 mb-4">Instructions</h3>
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
          <p className="text-slate-500 mb-4 text-sm">Cette technique vous a-t-elle aidé ?</p>
          <Button 
            size="lg" 
            variant={hasThanked ? "outline" : "primary"}
            onClick={handleThanks}
            disabled={hasThanked}
            className={hasThanked ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-rose-600 hover:bg-rose-700 text-white"}
          >
            <Heart className={`w-5 h-5 mr-2 ${hasThanked ? 'fill-rose-600' : ''}`} />
            {hasThanked ? "Merci envoyé !" : "Dire Merci"}
          </Button>
        </div>
      </div>
    </div>
  );
};

const AddExerciseForm: React.FC<{ onCancel: () => void; onSubmit: (ex: Exercise) => void }> = ({ onCancel, onSubmit }) => {
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
          <h2 className="text-lg font-bold">Ajouter une technique</h2>
          <Button variant="ghost" size="sm" onClick={onCancel}>Annuler</Button>
        </div>

        <form onSubmit={doSubmit} className="p-6 space-y-6">
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-sm flex gap-3">
            <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>
              Les contributions communautaires passent désormais par une revue humaine.
              Votre proposition apparaîtra dans la grille une fois validée par l'équipe de modération.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Titre</label>
            <input
              className="w-full border p-2 rounded-lg" 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})} 
              placeholder="Ex: Respiration Carrée"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description Courte</label>
            <textarea 
              className="w-full border p-2 rounded-lg" 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
              placeholder="A quoi ça sert ?"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Image / GIF (URL)</label>
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
            <p className="text-xs text-slate-500 mt-1">Laissez vide pour une image par défaut</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Situation (Choisir au moins 1)</label>
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
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Durée</label>
            <input 
              className="w-full border p-2 rounded-lg" 
              value={formData.duration} 
              onChange={e => setFormData({...formData, duration: e.target.value})} 
              placeholder="Ex: 2 minutes"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Étapes</label>
            {formData.steps?.map((step, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <span className="pt-2 text-xs text-slate-400">{i+1}</span>
                <input 
                  className="w-full border p-2 rounded-lg"
                  value={step}
                  onChange={e => handleStepChange(i, e.target.value)}
                  placeholder={`Étape ${i+1}`}
                />
              </div>
            ))}
            <Button type="button" variant="secondary" size="sm" onClick={addStep} className="mt-2">
              + Ajouter une étape
            </Button>
          </div>

          <div className="pt-6">
             <Button type="submit" className="w-full" size="lg">Publier la technique</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Partner Portal Helpers ---
const PARTNER_STORAGE_KEYS = {
  ACCOUNTS: 'neurosooth_partner_accounts',
  SESSION: 'neurosooth_partner_session'
};

const getStoredPartnerAccounts = (): PartnerAccount[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PARTNER_STORAGE_KEYS.ACCOUNTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const getStoredPartnerSession = (): PartnerAccount | null => {
  if (typeof window === 'undefined') return null;
  const sessionId = localStorage.getItem(PARTNER_STORAGE_KEYS.SESSION);
  if (!sessionId) return null;
  const accounts = getStoredPartnerAccounts();
  return accounts.find(acc => acc.id === sessionId) || null;
};

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

const PartnerPortal: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [accounts, setAccounts] = useState<PartnerAccount[]>(() => getStoredPartnerAccounts());
  const [activeAccount, setActiveAccount] = useState<PartnerAccount | null>(() => getStoredPartnerSession());
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

  const emitSessionChange = (session: PartnerAccount | null) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('partner-session-change', { detail: session }));
    }
  };

  const persistAccounts = (list: PartnerAccount[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(PARTNER_STORAGE_KEYS.ACCOUNTS, JSON.stringify(list));
    }
  };

  const startSession = (account: PartnerAccount) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(PARTNER_STORAGE_KEYS.SESSION, account.id);
    }
    setActiveAccount(account);
    emitSessionChange(account);
  };

  const clearSession = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(PARTNER_STORAGE_KEYS.SESSION);
    }
    setActiveAccount(null);
    emitSessionChange(null);
  };

  const handleRegister = (event: React.FormEvent) => {
    event.preventDefault();
    setAuthError(null);

    if (!authForm.organization || !authForm.contactName || !authForm.email || !authForm.password) {
      setAuthError('Tous les champs sont requis pour créer un compte.');
      return;
    }

    if (accounts.some(account => account.email.toLowerCase() === authForm.email.toLowerCase())) {
      setAuthError('Cette adresse e-mail est déjà enregistrée.');
      return;
    }

    const newAccount: PartnerAccount = {
      id: `partner-${Date.now()}`,
      organization: authForm.organization.trim(),
      contactName: authForm.contactName.trim(),
      email: authForm.email.trim(),
      password: authForm.password
    };

    const updatedAccounts = [...accounts, newAccount];
    setAccounts(updatedAccounts);
    persistAccounts(updatedAccounts);
    startSession(newAccount);
    setAuthForm({ organization: '', contactName: '', email: '', password: '' });
  };

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    setAuthError(null);

    if (!authForm.email || !authForm.password) {
      setAuthError('Veuillez renseigner votre e-mail et votre mot de passe.');
      return;
    }

    const account = accounts.find(
      acc => acc.email.toLowerCase() === authForm.email.toLowerCase() && acc.password === authForm.password
    );

    if (!account) {
      setAuthError('Identifiants incorrects.');
      return;
    }

    startSession(account);
    setAuthForm({ organization: '', contactName: '', email: '', password: '' });
  };

  const handleManualSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setManualFeedback(null);

    if (!activeAccount) {
      setManualFeedback({ type: 'error', text: 'Connectez-vous pour publier un exercice.' });
      return;
    }

    if (!manualForm.title.trim() || !manualForm.description.trim()) {
      setManualFeedback({ type: 'error', text: 'Le titre et la description sont obligatoires.' });
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
    setManualFeedback({ type: 'success', text: 'Technique publiée immédiatement pour les utilisateurs.' });
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
          setImportFeedback({ type: 'error', text: 'Aucun exercice valide trouvé dans le fichier.' });
          setFileInputKey(Date.now());
          return;
        }

        drafts.forEach(draft => {
          const exercise = createPartnerExercise(draft, activeAccount.organization);
          saveExercise(exercise);
        });

        setImportFeedback({
          type: 'success',
          text: `${drafts.length} exercice(s) importé(s) depuis ${file.name}.`
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Import impossible. Vérifiez votre fichier.';
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
              {authMode === 'login' ? 'Connexion partenaire' : 'Créer un compte partenaire'}
            </h2>
            <p className="text-sm text-slate-500">L'accès est réservé aux établissements accompagnés.</p>
          </div>
        </div>

        <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="space-y-4">
          {authMode === 'register' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Organisation</label>
                <input
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  value={authForm.organization}
                  onChange={e => setAuthForm(prev => ({ ...prev, organization: e.target.value }))}
                  placeholder="Centre hospitalier, association..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Référent</label>
                <input
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  value={authForm.contactName}
                  onChange={e => setAuthForm(prev => ({ ...prev, contactName: e.target.value }))}
                  placeholder="Nom et prénom"
                  required
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Email professionnel</label>
            <input
              type="email"
              className="w-full border border-slate-200 rounded-lg px-3 py-2"
              value={authForm.email}
              onChange={e => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
              placeholder="contact@organisation.fr"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mot de passe</label>
            <input
              type="password"
              className="w-full border border-slate-200 rounded-lg px-3 py-2"
              value={authForm.password}
              onChange={e => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
              placeholder="••••••••"
              required
            />
          </div>

          {authError && (
            <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-3">
              {authError}
            </div>
          )}

          <Button type="submit" className="w-full" size="lg">
            {authMode === 'login' ? 'Se connecter' : 'Créer mon accès'}
          </Button>
        </form>

        <div className="text-center text-sm text-slate-500">
          {authMode === 'login' ? (
            <button
              type="button"
              className="text-teal-600 font-medium"
              onClick={() => { setAuthMode('register'); setAuthError(null); }}
            >
              <UserPlus className="inline w-4 h-4 mr-1" /> Créer un compte partenaire
            </button>
          ) : (
            <button
              type="button"
              className="text-teal-600 font-medium"
              onClick={() => { setAuthMode('login'); setAuthError(null); }}
            >
              <User className="inline w-4 h-4 mr-1" /> J'ai déjà un accès
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
            <p className="text-sm uppercase tracking-wide text-slate-400">Compte vérifié</p>
            <h2 className="text-2xl font-semibold text-slate-900">{activeAccount.organization}</h2>
            <p className="text-sm text-slate-500">Référent : {activeAccount.contactName}</p>
            <p className="text-sm text-slate-500">Email : {activeAccount.email}</p>
          </div>
          <Button variant="ghost" onClick={clearSession}>
            <LogOut className="w-4 h-4 mr-2" /> Déconnexion
          </Button>
        </div>
      )}

      <section className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-6 h-6 text-teal-600" />
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Créer une technique manuellement</h3>
            <p className="text-sm text-slate-500">Publiez instantanément une nouvelle fiche validée par votre équipe.</p>
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
              <label className="block text-sm font-medium mb-1">Titre</label>
              <input
                className="w-full border border-slate-200 rounded-lg px-3 py-2"
                value={manualForm.title}
                onChange={e => setManualForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Respiration alternée"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Durée</label>
              <input
                className="w-full border border-slate-200 rounded-lg px-3 py-2"
                value={manualForm.duration}
                onChange={e => setManualForm(prev => ({ ...prev, duration: e.target.value }))}
                placeholder="5 minutes"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              className="w-full border border-slate-200 rounded-lg px-3 py-2"
              value={manualForm.description}
              onChange={e => setManualForm(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              placeholder="Objectif de l'exercice et contexte thérapeutique"
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Image / GIF (URL)</label>
              <input
                className="w-full border border-slate-200 rounded-lg px-3 py-2"
                value={manualForm.imageUrl}
                onChange={e => setManualForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Avertissement clinique</label>
              <input
                className="w-full border border-slate-200 rounded-lg px-3 py-2"
                value={manualForm.warning}
                onChange={e => setManualForm(prev => ({ ...prev, warning: e.target.value }))}
                placeholder="Contre-indications..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tags (séparés par des virgules)</label>
            <input
              className="w-full border border-slate-200 rounded-lg px-3 py-2"
              value={manualForm.tagsText}
              onChange={e => setManualForm(prev => ({ ...prev, tagsText: e.target.value }))}
              placeholder="Somatique, Respiration, TCC"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Situations ciblées</label>
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
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Profils neuro-atypiques concernés</label>
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
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Étapes détaillées</label>
            <div className="space-y-2">
              {manualForm.steps.map((step, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    className="flex-1 border border-slate-200 rounded-lg px-3 py-2"
                    value={step}
                    onChange={e => handleStepChange(index, e.target.value)}
                    placeholder={`Étape ${index + 1}`}
                  />
                  {manualForm.steps.length > 1 && (
                    <Button type="button" variant="ghost" onClick={() => removeStepField(index)}>
                      Supprimer
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button type="button" variant="secondary" size="sm" className="mt-3" onClick={addStepField}>
              + Ajouter une étape
            </Button>
          </div>

          <div className="pt-4">
            <Button type="submit" size="lg" className="w-full">Publier directement</Button>
          </div>
        </form>
      </section>

      <section className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-3">
          <UploadCloud className="w-6 h-6 text-teal-600" />
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Importer un fichier CSV ou JSON</h3>
            <p className="text-sm text-slate-500">Créez plusieurs techniques d'un coup. Chaque entrée est publiée automatiquement.</p>
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
              <FileSpreadsheet className="w-4 h-4" /> Format CSV
            </div>
            <p className="text-sm text-slate-500 mb-2">En-têtes conseillés : title, description, duration, situations, steps, tags, warning, imageUrl.</p>
            <p className="text-xs text-slate-400">Séparez les situations, étapes et tags avec le symbole |</p>
          </div>
          <div className="border border-dashed border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-700 font-medium mb-2">
              <FileSpreadsheet className="w-4 h-4" /> Format JSON
            </div>
            <p className="text-sm text-slate-500 mb-2">Structure attendue : tableau d'objets avec les mêmes champs que ci-dessus.</p>
            <p className="text-xs text-slate-400">Exemple : [{{"title":"Routine vagale","situations":["Stress / Anxiété"]}}]</p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
          <p className="text-sm text-slate-600">Choisissez un fichier (.csv ou .json). Le traitement peut prendre quelques secondes selon la taille.</p>
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
              <p className="text-xs uppercase tracking-wide text-slate-400">Backoffice</p>
              <h1 className="text-2xl font-semibold text-slate-900">Espace Partenaires</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Retour au catalogue
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {activeAccount ? renderWorkspace() : renderAuthForm()}
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
}> = ({ pendingExercises, reviewedExercises, onApprove, onReject, onBack }) => {
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});

  const handleNoteChange = (id: string, value: string) => {
    setNotesMap(prev => ({ ...prev, [id]: value }));
  };

  const renderStatusBadge = (status: string) => {
    const base = 'px-2 py-0.5 rounded-full text-xs font-semibold';
    if (status === 'approved') {
      return <span className={`${base} bg-emerald-100 text-emerald-700`}>Validée</span>;
    }
    if (status === 'rejected') {
      return <span className={`${base} bg-rose-100 text-rose-700`}>Refusée</span>;
    }
    return <span className={`${base} bg-amber-100 text-amber-700`}>En attente</span>;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-teal-600" />
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500">Espace modération</p>
              <h1 className="text-xl font-bold text-slate-900">Revue des propositions</h1>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onBack}>
            Retour à l'app
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        <section>
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="w-5 h-5 text-slate-500" />
            <h2 className="text-lg font-semibold text-slate-900">
              {pendingExercises.length} proposition(s) à traiter
            </h2>
          </div>
          {pendingExercises.length === 0 ? (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-6 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6" />
              <p>Toutes les contributions ont été modérées. Revenez plus tard !</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingExercises.map(ex => (
                <div key={ex.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">Proposée le {new Date(ex.createdAt || '').toLocaleString()}</p>
                      <h3 className="text-xl font-semibold text-slate-900">{ex.title}</h3>
                      <p className="text-slate-600 mt-1">{ex.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {ex.situation.map(sit => (
                        <TagBadge key={sit} text={sit} />
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 mb-1">Durée</p>
                      <p className="text-sm text-slate-700">{ex.duration}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 mb-1">Tags</p>
                      <p className="text-sm text-slate-700">{ex.tags.join(', ')}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="text-xs font-semibold text-slate-500">Note interne (optionnelle)</label>
                    <textarea
                      className="mt-1 w-full border border-slate-200 rounded-xl p-3 text-sm"
                      placeholder="Feedback à partager avec l'auteur..."
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
                      Refuser
                    </Button>
                    <Button
                      onClick={() => onApprove(ex, notesMap[ex.id])}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Valider et publier
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
            <h2 className="text-lg font-semibold text-slate-900">Historique récent</h2>
          </div>
          {reviewedExercises.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun historique de modération pour le moment.</p>
          ) : (
            <div className="space-y-3">
              {reviewedExercises.map(ex => (
                <div key={ex.id} className="bg-white border border-slate-100 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{ex.title}</p>
                    <p className="text-xs text-slate-500">{ex.moderatedBy || 'Admin'} • {ex.moderatedAt ? new Date(ex.moderatedAt).toLocaleString() : 'Date inconnue'}</p>
                    {ex.moderationNotes && (
                      <p className="text-sm text-slate-600 mt-1">Note: {ex.moderationNotes}</p>
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


// --- Main App ---

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [allExercises, setAllExercises] = useState<Exercise[]>(() => getExercises());
  const [exercises, setExercises] = useState<Exercise[]>(() =>
    getRecommendedExercises(getExercises(), null, 'All')
  );
  const [view, setView] = useState<'onboarding' | 'dashboard' | 'detail' | 'add' | 'moderation' | 'partner'>('dashboard');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [situationFilter, setSituationFilter] = useState<Situation | 'All'>('All');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(syncService.getStatus());
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [partnerSession, setPartnerSession] = useState<PartnerAccount | null>(() => getStoredPartnerSession());
  const [pendingAdminAction, setPendingAdminAction] = useState<'moderation' | null>(null);

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
    const handleSessionEvent: EventListener = () => {
      setPartnerSession(getStoredPartnerSession());
    };
    window.addEventListener('partner-session-change', handleSessionEvent);
    window.addEventListener('storage', handleSessionEvent);

    return () => {
      window.removeEventListener('partner-session-change', handleSessionEvent);
      window.removeEventListener('storage', handleSessionEvent);
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
    setView('partner');
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
  const pendingExercises = communityExercises.filter(
    ex => (ex.moderationStatus ?? 'approved') === 'pending'
  );
  const reviewedExercises = communityExercises
    .filter(ex => (ex.moderationStatus && ex.moderationStatus !== 'pending') || ex.moderatedAt)
    .sort((a, b) => {
      const dateA = parseTimestamp(a.moderatedAt) || parseTimestamp(a.createdAt);
      const dateB = parseTimestamp(b.moderatedAt) || parseTimestamp(b.createdAt);
      return dateB - dateA;
    })
    .slice(0, 8);

  const handleModerationDecision = (exercise: Exercise, status: 'approved' | 'rejected', notes?: string) => {
    const moderator = user?.name || 'Équipe NeuroSooth';
    moderateExercise(exercise.id, status, { moderator, notes });
  };

  // Render Helpers
  if (view === 'partner') {
    return <PartnerPortal onBack={() => setView('dashboard')} />;
  }

  if (view === 'moderation') {
    return (
      <ModerationPanel
        pendingExercises={pendingExercises}
        reviewedExercises={reviewedExercises}
        onApprove={(exercise, notes) => handleModerationDecision(exercise, 'approved', notes)}
        onReject={(exercise, notes) => handleModerationDecision(exercise, 'rejected', notes)}
        onBack={() => setView('dashboard')}
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-teal-600 p-1.5 rounded-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-800 hidden md:block">NeuroSooth</span>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
                <User className="w-4 h-4" />
                <span className="font-medium">{user.name}</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsAdminMenuOpen(true)}
              aria-label="Ouvrir le menu administrateur"
              aria-expanded={isAdminMenuOpen}
              className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            >
              <Menu className="w-5 h-5" />
              <span className="sr-only">Ouvrir le menu administrateur</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="border-t border-gray-100 overflow-x-auto hide-scrollbar">
          <div className="max-w-6xl mx-auto px-4 py-3 flex gap-2 min-w-max">
            <button
              onClick={() => setSituationFilter('All')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                situationFilter === 'All' 
                  ? 'bg-slate-800 text-white' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Tout
            </button>
            {Object.values(Situation).map((sit) => (
              <button
                key={sit}
                onClick={() => setSituationFilter(sit)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  situationFilter === sit 
                    ? 'bg-teal-600 text-white shadow-md transform scale-105' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {sit}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Context Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            {situationFilter === 'All' ? 'Recommandé pour vous' : situationFilter}
          </h2>
          <p className="text-slate-500">
            {situationFilter === 'All'
              ? `Basé sur votre profil ${user?.neurotypes.join(', ') || ''}`
              : `Techniques de régulation spécifiques`
            }
          </p>
        </div>

        {/* Grid */}
        {exercises.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
            {exercises.map((ex) => (
              <ExerciseCard 
                key={ex.id} 
                exercise={ex} 
                onClick={() => handleExerciseClick(ex)} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="bg-slate-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">Aucune technique trouvée</h3>
            <p className="text-slate-500 mb-6">Essayez de changer de filtre ou ajoutez votre propre technique.</p>
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => setSituationFilter('All')}>
                Voir tout
              </Button>
              <Button variant="primary" onClick={() => setView('add')}>
                Ajouter une technique
              </Button>
            </div>
          </div>
        )}
      </main>

      {isAdminMenuOpen && (
        <div className="fixed inset-0 z-40 flex" aria-modal="true" role="dialog">
          <div
            className="flex-1 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsAdminMenuOpen(false)}
          />
          <div
            id="admin-menu"
            className="w-full max-w-xs bg-white h-full shadow-2xl border-l border-slate-100 flex flex-col"
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-400">Espace admin</p>
                <h2 className="text-lg font-semibold text-slate-900">Actions rapides</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsAdminMenuOpen(false)}
                className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                aria-label="Fermer le menu administrateur"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-600 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Synchronisation</p>
                {showSyncStatus ? (
                  <div className="space-y-1">
                    {!syncStatus.isOnline && (
                      <p className="text-amber-700 font-semibold">Mode hors ligne</p>
                    )}
                    {syncStatus.pendingMutations > 0 && (
                      <p>{syncStatus.pendingMutations} changement(s) en attente</p>
                    )}
                    {syncStatus.isSyncing && syncStatus.isOnline && (
                      <p className="flex items-center gap-2 text-teal-700">
                        <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                        Synchronisation…
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="flex items-center gap-2 text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                    Données parfaitement synchronisées
                  </p>
                )}
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Compte sécurisé</p>
                {partnerSession ? (
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{partnerSession.organization}</p>
                    <p className="text-xs text-slate-500">{partnerSession.email}</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">
                    Connectez-vous via l'espace partenaires pour débloquer les accès sensibles.
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={handlePartnerAccess}
                >
                  <Building2 className="w-4 h-4" />
                  Espace partenaires
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-between gap-2"
                  onClick={handleModerationAccess}
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    Modération
                  </span>
                  {pendingExercises.length > 0 && (
                    <span className="text-xs font-bold bg-rose-50 text-rose-600 rounded-full px-2 py-0.5">
                      {pendingExercises.length}
                    </span>
                  )}
                </Button>
                {!partnerSession && (
                  <p className="text-xs text-slate-500 pl-8 -mt-2">
                    Accès restreint aux comptes partenaires.
                  </p>
                )}
                <Button
                  variant="primary"
                  className="w-full justify-center gap-2"
                  onClick={handleContributionAccess}
                >
                  <Plus className="w-4 h-4" />
                  Ajouter une technique
                </Button>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 space-y-3">
              <a
                href="https://www.buymeacoffee.com/K42H"
                target="_blank"
                rel="noreferrer"
                onClick={() => setIsAdminMenuOpen(false)}
                className="inline-flex items-center justify-center w-full gap-2 rounded-lg bg-amber-500 text-white font-semibold py-2 px-4 hover:bg-amber-600 transition-colors shadow-sm"
              >
                <Coffee className="w-4 h-4" />
                Soutenir NeuroSooth
              </a>
              <p className="text-xs text-slate-400 text-center">Merci pour votre soutien à la régulation émotionnelle.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}