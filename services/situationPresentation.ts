import { Situation } from '../types';
export const situationTone: Record<Situation, string> = {
  [Situation.Stress]: 'sage', [Situation.Crisis]: 'coral', [Situation.Rumination]: 'lavender',
  [Situation.Freeze]: 'blue', [Situation.Anger]: 'terracotta', [Situation.Sleep]: 'purple',
  [Situation.Pain]: 'amber', [Situation.Focus]: 'cyan', [Situation.Trauma]: 'sage'
};

export const situationColors: Record<string, string> = {
  sage: '#dfece3', coral: '#f3dad3', lavender: '#e9e3f1', blue: '#deebf0',
  terracotta: '#efd9ce', purple: '#e4def0', amber: '#f3e8bd', cyan: '#d9edf0'
};
