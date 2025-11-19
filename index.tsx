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
  Image as ImageIcon
} from 'lucide-react';

import { Button } from './components/Button';
import { Exercise, NeuroType, Situation, UserProfile } from './types';
import {
  getUser,
  saveUser,
  getExercises,
  getRecommendedExercises,
  saveExercise,
  incrementThanks
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


// --- Main App ---

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [allExercises, setAllExercises] = useState<Exercise[]>(() => getExercises());
  const [exercises, setExercises] = useState<Exercise[]>(() =>
    getRecommendedExercises(getExercises(), null, 'All')
  );
  const [view, setView] = useState<'onboarding' | 'dashboard' | 'detail' | 'add'>('dashboard');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [situationFilter, setSituationFilter] = useState<Situation | 'All'>('All');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(syncService.getStatus());

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
    // Load initial data
    const loadedUser = getUser();
    if (loadedUser) {
      setUser(loadedUser);
    } else {
      setView('onboarding');
    }
  }, []);

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

  const showSyncStatus =
    !syncStatus.isOnline || syncStatus.pendingMutations > 0 || syncStatus.isSyncing;

  // Render Helpers
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
          
          <div className="flex items-center gap-4 flex-wrap justify-end text-right">
             {user && (
               <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
                 <User className="w-4 h-4" />
                 <span className="font-medium">{user.name}</span>
               </div>
             )}
             {showSyncStatus && (
               <div className="flex flex-col items-end gap-1 text-xs min-w-[140px]">
                 {!syncStatus.isOnline && (
                   <span className="text-amber-700 bg-amber-100 px-3 py-1 rounded-full font-semibold">
                     Mode hors ligne
                   </span>
                 )}
                 {syncStatus.pendingMutations > 0 && (
                   <span className="text-slate-500">
                     {syncStatus.pendingMutations} changement(s) en attente
                   </span>
                 )}
                 {syncStatus.isSyncing && syncStatus.isOnline && (
                   <span className="flex items-center gap-1 text-teal-700">
                     <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                     Synchronisation…
                   </span>
                 )}
               </div>
             )}
             <Button variant="primary" size="sm" onClick={() => setView('add')}>
               <Plus className="w-4 h-4 md:mr-2" />
               <span className="hidden md:inline">Contribuer</span>
             </Button>
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
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}