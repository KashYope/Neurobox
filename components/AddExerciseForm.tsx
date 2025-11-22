import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Image as ImageIcon } from 'lucide-react';
import { Button } from './Button';
import { Exercise, Situation } from '../types';
import { COMMUNITY_CONTENT_IMAGE_URL } from '../constants';

export const AddExerciseForm: React.FC<{ onCancel: () => void; onSubmit: (ex: Exercise) => void }> = ({ onCancel, onSubmit }) => {
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
      imageUrl: formData.imageUrl || COMMUNITY_CONTENT_IMAGE_URL,
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
