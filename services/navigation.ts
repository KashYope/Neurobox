import { Situation } from '../types';

export const getSituationFilterFromSearch = (search: string): Situation | 'All' => {
  const value = new URLSearchParams(search).get('situation');
  return Object.values(Situation).includes(value as Situation) ? value as Situation : 'All';
};

export type SiteRoute = 'home' | 'toolbox' | 'assessment' | 'admin' | 'partner';
export const siteRouteFromPath = (path: string): SiteRoute => {
  const segment = path.split('/')[1];
  return ['toolbox', 'assessment', 'admin', 'partner'].includes(segment) ? segment as SiteRoute : 'home';
};
export const sitePath = (route: SiteRoute) => route === 'home' ? '/' : `/${route}`;
