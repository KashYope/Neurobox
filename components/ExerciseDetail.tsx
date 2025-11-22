import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, Zap, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from './Button';
import { Exercise } from '../types';
import { PLACEHOLDER_IMAGE_URL } from '../constants';

export const ExerciseDetail: React.FC<{
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
            onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE_URL }}
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
