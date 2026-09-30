import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateReflectionReport, buildRecommendationProfile, REFLECTION_QUESTIONS, SCALE_LIMITS } from '../features/assessment/model';
import { getRecommendedExercises, getRecommendationReasons } from '../services/dataService';
import { Exercise, RecommendationProfile, Situation, SupportNeed } from '../types';

const exercise = (id: string, supportNeeds: SupportNeed[], thanksCount = 0): Exercise => ({
  id,
  title: id,
  description: `${id} description`,
  situation: [Situation.Focus],
  neurotypes: [],
  duration: '2 min',
  steps: ['Try it'],
  tags: [],
  supportNeeds,
  thanksCount,
  moderationStatus: 'approved'
});

test('reflection scoring uses neutral bands and produces each support mapping', () => {
  const report = calculateReflectionReport(REFLECTION_QUESTIONS.map(question => ({ questionId: question.id, score: SCALE_LIMITS[question.scale].max })));
  assert.equal(report.domains.length, 5);
  assert.ok(report.domains.every(domain => domain.score === 100 && domain.band === 'veryProminent'));
  const mappedNeeds = new Set(report.needs.map(item => item.need));
  Object.values(SupportNeed).forEach(need => assert.equal(mappedNeeds.has(need), true, `missing ${need}`));
});

test('recommendation profile stores only a bounded derived support profile', () => {
  const report = calculateReflectionReport(REFLECTION_QUESTIONS.map(question => ({ questionId: question.id, score: SCALE_LIMITS[question.scale].max })));
  const profile = buildRecommendationProfile(report);
  assert.equal(profile.source, 'assessment');
  assert.ok(profile.needs.length <= 8);
  assert.equal('answers' in profile, false);
  assert.equal('domains' in profile, false);
});

test('guest ordering remains deterministic and verified feedback breaks ties', () => {
  const list = [exercise('b', [], 10), exercise('a', [], 0), exercise('c', [], 15)];
  assert.deepEqual(getRecommendedExercises(list, null, 'All').map(item => item.id), ['c', 'b', 'a']);
});

test('support weights outrank feedback and expose at most two reasons', () => {
  const profile: RecommendationProfile = {
    version: 1,
    source: 'assessment',
    createdAt: new Date(0).toISOString(),
    needs: [
      { need: SupportNeed.Focus, weight: 90 },
      { need: SupportNeed.TaskInitiation, weight: 80 },
      { need: SupportNeed.Organization, weight: 70 }
    ]
  };
  const focused = exercise('focused', [SupportNeed.Organization, SupportNeed.Focus, SupportNeed.TaskInitiation]);
  const popular = exercise('popular', [], 1000);
  const ranked = getRecommendedExercises([popular, focused], null, 'All', profile);
  assert.equal(ranked[0].id, 'focused');
  assert.deepEqual(getRecommendationReasons(focused, profile), [SupportNeed.Focus, SupportNeed.TaskInitiation]);
});

test('situation selection remains a hard filter', () => {
  const focus = exercise('focus', [SupportNeed.Focus]);
  const sleep = { ...exercise('sleep', [SupportNeed.Recovery]), situation: [Situation.Sleep] };
  assert.deepEqual(getRecommendedExercises([focus, sleep], null, Situation.Sleep).map(item => item.id), ['sleep']);
});

test('older records without support needs remain usable', () => {
  const legacy = { ...exercise('legacy', []), supportNeeds: undefined } as unknown as Exercise;
  assert.deepEqual(getRecommendedExercises([legacy], null, 'All').map(item => item.id), ['legacy']);
  assert.deepEqual(getRecommendationReasons(legacy, null), []);
});
