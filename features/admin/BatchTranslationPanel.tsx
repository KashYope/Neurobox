import React, { useEffect, useMemo, useState } from 'react';

import { AlertTriangle, ArrowLeft, BadgeCheck, Button, Languages, Loader2, Radio } from '../../components/ui';
import { apiClient, BatchTranslationJob } from '../../services/apiClient';

interface BatchTranslationPanelProps {
  onBack: () => void;
}

const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
  { code: 'nl', label: 'Nederlands' }
];

const formatDate = (value?: string) => {
  if (!value) return '';
  return new Date(value).toLocaleString();
};

export const BatchTranslationPanel: React.FC<BatchTranslationPanelProps> = ({ onBack }) => {
  const [selectedLangs, setSelectedLangs] = useState<string[]>(['en']);
  const [perimeter, setPerimeter] = useState('exercise');
  const [job, setJob] = useState<BatchTranslationJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  const progressPercent = useMemo(() => {
    if (!job || job.progress.total === 0) return 0;
    return Math.round((job.progress.processed / job.progress.total) * 100);
  }, [job]);

  const toggleLang = (code: string) => {
    setSelectedLangs(prev =>
      prev.includes(code) ? prev.filter(lang => lang !== code) : [...prev, code]
    );
  };

  const submitBatch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (selectedLangs.length === 0) {
      setError('Veuillez sélectionner au moins une langue cible.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        targetLangs: selectedLangs,
        perimeter: perimeter.trim() || undefined
      };
      console.log('[BatchTranslation UI] Submitting batch translation:', payload);
      const newJob = await apiClient.startBatchTranslation(payload);
      console.log('[BatchTranslation UI] Job started:', newJob);
      setJob(newJob);
    } catch (err: any) {
      console.error('[BatchTranslation UI] Failed to start job:', err);
      setError(err?.message || 'Impossible de démarrer la traduction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!job || job.status === 'completed' || job.status === 'failed') {
      return;
    }

    console.log('[BatchTranslation UI] Starting polling for job:', job.id);
    setIsPolling(true);
    const interval = setInterval(async () => {
      try {
        const nextStatus = await apiClient.fetchBatchTranslationStatus(job.id);
        console.log('[BatchTranslation UI] Status update:', {
          status: nextStatus.status,
          progress: nextStatus.progress,
          errors: nextStatus.errors
        });
        setJob(nextStatus);
        if (nextStatus.status === 'completed' || nextStatus.status === 'failed') {
          setIsPolling(false);
        }
      } catch (err: any) {
        console.error('[BatchTranslation UI] Failed to fetch status:', err);
        setError(err?.message || 'Erreur lors du rafraîchissement du statut.');
      }
    }, 1500);

    return () => {
      console.log('[BatchTranslation UI] Stopping polling and cleaning up interval');
      setIsPolling(false);
      clearInterval(interval);
    };
  }, [job]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-white hover:bg-slate-800" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400">NeuroSooth</p>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Languages className="w-5 h-5 text-teal-300" />
                Orchestration des traductions
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {isPolling && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span className="text-sm text-blue-700">Connexion active - Surveillance du statut en cours...</span>
          </div>
        )}

        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <BadgeCheck className="w-5 h-5 text-teal-600" />
            <h2 className="text-lg font-semibold text-slate-900">Déclencher une traduction batch</h2>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={submitBatch}>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Langues cibles</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {LANGUAGE_OPTIONS.map((option) => (
                  <label
                    key={option.code}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 hover:border-teal-200 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedLangs.includes(option.code)}
                      onChange={() => toggleLang(option.code)}
                      className="form-checkbox h-4 w-4 text-teal-600"
                    />
                    <div>
                      <p className="font-semibold text-slate-900">{option.label}</p>
                      <p className="text-xs text-slate-500">{option.code.toUpperCase()}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-slate-500">Périmètre</p>
              <div className="flex items-center gap-3">
                <Radio className="w-4 h-4 text-teal-600" />
                <input
                  type="text"
                  value={perimeter}
                  onChange={(event) => setPerimeter(event.target.value)}
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 focus:border-teal-500 focus:outline-none"
                  placeholder="ex: exercise, onboarding, etc."
                />
              </div>
              <p className="text-xs text-slate-500">Le périmètre est utilisé pour filtrer les chaînes (context) ciblées.</p>
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Démarrage en cours
                  </>
                ) : (
                  'Lancer la traduction'
                )}
              </Button>
              <Button type="button" variant="outline" onClick={onBack}>
                Retour
              </Button>
            </div>
          </form>
        </section>

        {job && (
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Languages className="w-5 h-5 text-teal-600" />
                <h3 className="text-lg font-semibold text-slate-900">Suivi de tâche</h3>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {job.status.toUpperCase()}
              </span>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-slate-600">Langues : {job.targetLangs.join(', ')}</p>
              {job.perimeter && <p className="text-sm text-slate-600">Périmètre : {job.perimeter}</p>}

              <div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${job.status === 'failed' ? 'bg-rose-500' : 'bg-teal-500'}`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {job.progress.processed}/{job.progress.total} - {progressPercent}%
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500">
                <div>Créée : {formatDate(job.startedAt)}</div>
                <div>{job.completedAt ? `Terminé : ${formatDate(job.completedAt)}` : 'En cours...'}</div>
              </div>

              {job.errors.length > 0 && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  <p className="font-semibold mb-1">Erreurs détectées</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {job.errors.map((errMsg, index) => (
                      <li key={index}>{errMsg}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};
