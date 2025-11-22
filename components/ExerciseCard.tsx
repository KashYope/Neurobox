import React from 'react';
import { Heart, Wind, Moon, Flame, Activity } from 'lucide-react';
import { Exercise, Situation } from '../types';
import { PLACEHOLDER_IMAGE_URL } from '../constants';

export const ExerciseCard: React.FC<{ exercise: Exercise; onClick: () => void }> = ({ exercise, onClick }) => {
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
          onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE_URL }}
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
