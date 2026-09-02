import { Situation } from '../types';

export const getSituationFilterFromSearch = (search: string): Situation | 'All' => {
  const value = new URLSearchParams(search).get('situation');
  return Object.values(Situation).includes(value as Situation) ? value as Situation : 'All';
};
