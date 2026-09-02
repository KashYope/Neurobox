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
