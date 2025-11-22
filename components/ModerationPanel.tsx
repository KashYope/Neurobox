import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, ClipboardList, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Button } from './Button';
import { Exercise } from '../types';
import { TagBadge } from './TagBadge';

export const ModerationPanel: React.FC<{
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
