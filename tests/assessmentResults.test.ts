import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ProfileRadar } from '../features/assessment/ProfileRadar';
import { calculateReflectionReport, CORE_QUESTIONS, SCALE_LIMITS, DOMAINS } from '../features/assessment/model';
import { getDomainInsights, getDomainGuidance, resultCopy } from '../features/assessment/resources';

const render = (answers: Parameters<typeof calculateReflectionReport>[0]) => renderToStaticMarkup(React.createElement(ProfileRadar, {
  report: calculateReflectionReport(answers), locale: 'fr', labels: Object.fromEntries(DOMAINS.map(domain => [domain, domain]))
}));

test('radar never fills an unanswered profile or draws missing domains as zero scores', () => {
  const empty = render([]);
  assert.equal((empty.match(/Non renseigné/g) ?? []).length, 10);
  assert.ok(!empty.includes('fill-opacity="0.12"'));
  assert.ok(!empty.includes('cx="240" cy="192"'));
  const partial = render([{ questionId: CORE_QUESTIONS[0].id, score: SCALE_LIMITS[CORE_QUESTIONS[0].scale].min }]);
  assert.ok(partial.includes('cx="240" cy="192"'));
  assert.ok(!partial.includes('fill-opacity="0.12"'));
  assert.ok(partial.includes('Partiel'));
});

test('completed radar contains the five-axis shape and a readable equivalent', () => {
  const complete = render(CORE_QUESTIONS.map(question => ({ questionId: question.id, score: SCALE_LIMITS[question.scale].max })));
  assert.ok(complete.includes('fill-opacity="0.12"'));
  assert.ok(complete.includes('Lire les valeurs du graphe'));
  for (const domain of DOMAINS) assert.ok(complete.includes(`<dt>${domain}</dt>`));
  assert.ok(!complete.includes('Non renseigné'));
  assert.ok(!complete.includes('Partiel'));
});

test('every theme retains bilingual strategies, practical guides, strengths, tools and reading links', () => {
  for (const locale of ['fr', 'en'] as const) for (const domain of DOMAINS) {
    const insights = getDomainInsights(domain, locale);
    for (const key of ['tips', 'guides', 'strengths', 'tools'] as const) assert.ok(insights[key].length >= 3);
    assert.ok(getDomainGuidance(domain, locale).reading.every(resource => resource.href.startsWith('https://')));
    assert.equal(resultCopy[locale].shortLabels.length, DOMAINS.length);
  }
});
