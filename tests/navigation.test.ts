import assert from 'node:assert/strict';
import test from 'node:test';
import { getSituationFilterFromSearch } from '../services/navigation';
import { Situation } from '../types';

test('reads a supported situation from the URL', () => {
  assert.equal(getSituationFilterFromSearch('?situation=Stress'), Situation.Stress);
  assert.equal(getSituationFilterFromSearch('?source=home&situation=Sleep'), Situation.Sleep);
});

test('falls back to All when the situation is absent or unknown', () => {
  assert.equal(getSituationFilterFromSearch(''), 'All');
  assert.equal(getSituationFilterFromSearch('?situation=Unknown'), 'All');
});

test('site routes distinguish public and professional spaces without matching unrelated prefixes', async () => {
  const { siteRouteFromPath, sitePath } = await import('../services/navigation');
  for (const route of ['toolbox', 'assessment', 'admin', 'partner'] as const) {
    assert.equal(siteRouteFromPath(`/${route}`), route);
    assert.equal(siteRouteFromPath(`/${route}/nested`), route);
    assert.equal(sitePath(route), `/${route}`);
  }
  assert.equal(siteRouteFromPath('/administrator'), 'home');
  assert.equal(siteRouteFromPath('/'), 'home');
  assert.equal(sitePath('home'), '/');
});
