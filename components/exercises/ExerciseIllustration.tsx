import React from 'react';
import { Exercise, NeuroType, Situation } from '../../types';

export type IllustrationCategory = Situation | 'General';
export type IllustrationProfile = NeuroType | 'Universal';

export interface IllustrationModel {
  category: IllustrationCategory;
  profile: IllustrationProfile;
  primary: string;
  secondary: string;
  accent: string;
  variant: number;
}

type Palette = readonly [primary: string, secondary: string, accent: string];

/** One stable palette per exercise category. Keep this map exhaustive for future situations. */
const CATEGORY_PALETTES: Record<IllustrationCategory, Palette> = {
  [Situation.Crisis]: ['#f3d8d3', '#e8bbb6', '#744e4c'],
  [Situation.Rumination]: ['#e9e3f1', '#d0c4df', '#5f5573'],
  [Situation.Freeze]: ['#deebf0', '#bdd6df', '#476670'],
  [Situation.Stress]: ['#dfece3', '#bed8c7', '#3f6258'],
  [Situation.Anger]: ['#f5dfd5', '#e8c0af', '#79584d'],
  [Situation.Sleep]: ['#e5e6f2', '#c5c9df', '#535970'],
  [Situation.Pain]: ['#f3e8bd', '#e0cf91', '#705f32'],
  [Situation.Focus]: ['#dcebf0', '#b8d5df', '#456874'],
  [Situation.Trauma]: ['#eadfe7', '#d6becf', '#6f5265'],
  General: ['#ebe8df', '#d8d4c8', '#59635f']
};

/** Fixed precedence makes a multi-profile exercise independent from array ordering. */
const PROFILE_PRECEDENCE: NeuroType[] = [
  NeuroType.ADHD,
  NeuroType.ASD,
  NeuroType.Trauma,
  NeuroType.HighSensitivity,
  NeuroType.None
];

const hashString = (value: string): number => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const resolveCategory = (exercise: Exercise): IllustrationCategory =>
  exercise.situation[0] ?? 'General';

const resolveProfile = (exercise: Exercise): IllustrationProfile =>
  PROFILE_PRECEDENCE.find(profile => exercise.neurotypes.includes(profile)) ?? 'Universal';

export const getIllustrationModel = (exercise: Exercise): IllustrationModel => {
  const category = resolveCategory(exercise);
  const profile = resolveProfile(exercise);
  const [primary, secondary, accent] = CATEGORY_PALETTES[category];

  return {
    category,
    profile,
    primary,
    secondary,
    accent,
    variant: hashString(exercise.id) % 4
  };
};

const ProfileShape: React.FC<{ model: IllustrationModel }> = ({ model }) => {
  const line = {
    fill: 'none',
    stroke: model.accent,
    strokeWidth: 12,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const
  };

  if (model.profile === NeuroType.ADHD) {
    return <g>
      <ellipse cx="600" cy="400" rx="245" ry="125" {...line} transform="rotate(-18 600 400)" />
      <ellipse cx="600" cy="400" rx="245" ry="125" {...line} transform="rotate(42 600 400)" opacity="0.62" />
      <circle cx="600" cy="400" r="72" fill={model.accent} opacity="0.2" />
      <circle cx="815" cy="310" r="25" fill={model.accent} />
      <circle cx="420" cy="520" r="18" fill={model.accent} opacity="0.7" />
    </g>;
  }

  if (model.profile === NeuroType.ASD) {
    return <g>
      {[0, 1, 2].map(row => [0, 1, 2].map(column => (
        <rect key={`${row}-${column}`} x={430 + column * 125} y={230 + row * 125} width="92" height="92" rx="24" fill={model.accent} opacity={0.12 + ((row + column) % 3) * 0.12} />
      )))}
      <rect x="407" y="207" width="386" height="386" rx="76" {...line} />
    </g>;
  }

  if (model.profile === NeuroType.Trauma) {
    return <g>
      <path d="M360 475 C405 245 795 245 840 475" {...line} />
      <path d="M420 485 C455 330 745 330 780 485" {...line} opacity="0.68" />
      <path d="M485 500 C515 420 685 420 715 500" {...line} opacity="0.42" />
      <circle cx="600" cy="505" r="42" fill={model.accent} opacity="0.2" />
    </g>;
  }

  if (model.profile === NeuroType.HighSensitivity) {
    return <g transform="translate(600 400)">
      {[0, 60, 120, 180, 240, 300].map(angle => (
        <ellipse key={angle} cx="0" cy="-142" rx="64" ry="142" fill={model.accent} opacity="0.16" transform={`rotate(${angle})`} />
      ))}
      <circle r="82" {...line} />
      <circle r="35" fill={model.accent} opacity="0.24" />
    </g>;
  }

  if (model.profile === NeuroType.None) {
    return <g>
      <circle cx="530" cy="400" r="155" {...line} />
      <circle cx="670" cy="400" r="155" {...line} opacity="0.58" />
      <path d="M510 400 H690" {...line} opacity="0.45" />
    </g>;
  }

  return <g>
    <circle cx="600" cy="400" r="178" {...line} />
    <path d="M455 400 C520 300 680 300 745 400 C680 500 520 500 455 400Z" fill={model.accent} opacity="0.16" />
    <circle cx="600" cy="400" r="48" fill={model.accent} opacity="0.5" />
  </g>;
};

const ProceduralArtwork: React.FC<{
  exercise: Exercise;
  className?: string;
  decorative?: boolean;
}> = ({ exercise, className, decorative = false }) => {
  const model = getIllustrationModel(exercise);
  const offset = model.variant * 26;

  return (
    <svg
      viewBox="0 0 1200 800"
      className={className}
      preserveAspectRatio="xMidYMid slice"
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : exercise.title}
    >
      <rect width="1200" height="800" fill={model.primary} />
      <circle cx={165 + offset} cy="135" r="125" fill={model.secondary} opacity="0.62" />
      <circle cx={1035 - offset} cy="670" r="190" fill={model.secondary} opacity="0.52" />
      <path d="M0 690 C260 570 410 780 650 675 C865 580 990 615 1200 510 V800 H0Z" fill={model.secondary} opacity="0.34" />
      <ProfileShape model={model} />
    </svg>
  );
};

/**
 * All exercises use the same generated visual grammar. Legacy imageUrl values stay in
 * the data model for backwards compatibility but are intentionally not rendered here.
 */
export const ExerciseIllustration: React.FC<{
  exercise: Exercise;
  className?: string;
  decorative?: boolean;
}> = ({ exercise, className = 'w-full h-full object-cover', decorative = false }) => (
  <ProceduralArtwork exercise={exercise} className={className} decorative={decorative} />
);
