import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { QUESTION_CATALOG } from '../features/assessment/catalog';
import { REFLECTION_QUESTIONS, CORE_QUESTIONS, DOMAINS, CONTEXT_IDS, SCALE_LIMITS, calculateReflectionReport, buildRecommendationProfile, validateAnswers, normalizedScore, answerFingerprint } from '../features/assessment/model';
import { createProgress, migrateProgress, commitAnswer, changeMode, beginModule, previousQuestion, skipContext, isAssessmentComplete } from '../features/assessment/progress';
import { applyImport, encodeTransfer, decodeTransfer, legacyCatalogHash } from '../features/assessment/transfer';
import { LEGACY_QUESTIONS, calculateLegacyReport } from '../features/assessment/legacyModel';
import { scaleOptions } from '../features/assessment/copy';
import { SUBSCALE_LABELS } from '../features/assessment/subscaleLabels';
import { SupportNeed } from '../types';

const maximums = REFLECTION_QUESTIONS.map(question => ({ questionId: question.id, score: SCALE_LIMITS[question.scale].max }));
const minimums = REFLECTION_QUESTIONS.map(question => ({ questionId: question.id, score: SCALE_LIMITS[question.scale].min }));

test('138 original bilingual items retain exact wording, order, identifiers, subscales and scales', () => {
  assert.equal(REFLECTION_QUESTIONS.length, 138);
  assert.equal(new Set(REFLECTION_QUESTIONS.map(question => question.id)).size, 138);
  assert.deepEqual(['context', ...DOMAINS].map(domain => REFLECTION_QUESTIONS.filter(question => question.domain === domain).length), [4, 18, 46, 27, 22, 21]);
  const canonical = QUESTION_CATALOG.map(({ id, subscale, scale, text }) => ({ id, subscale, scale, text }));
  assert.equal(createHash('sha256').update(JSON.stringify(canonical)).digest('hex'), '12e310e29ca4747e170ceffcb9b7d6fa7bbc8ae64a330484b0ec16237b2ee3af');
  for (const question of REFLECTION_QUESTIONS) {
    for (const locale of ['en', 'fr'] as const) {
      assert.ok(question.text[locale]);
      assert.ok(SUBSCALE_LABELS[locale][question.subscale]);
      const options = scaleOptions(question.scale, locale);
      assert.equal(options[0].value, SCALE_LIMITS[question.scale].min);
      assert.equal(options.at(-1)!.value, SCALE_LIMITS[question.scale].max);
      assert.ok(options.every(option => option.label.length));
    }
    assert.equal(question.needs.length === 0, question.domain === 'context');
  }
});

test('scale endpoints produce 0 and 100, without treating missing responses as zero', () => {
  assert.ok(calculateReflectionReport(maximums).domains.every(domain => domain.score === 100));
  assert.ok(calculateReflectionReport(minimums).domains.every(domain => domain.score === 0));
  assert.ok(calculateReflectionReport([]).domains.every(domain => domain.score === null && domain.band === null && !domain.complete));
  const partial = calculateReflectionReport([{ questionId: 'ADHD_01', score: 4 }]);
  assert.equal(partial.domains[0].score, 100);
  assert.equal(partial.domains[0].answered, 1);
  assert.equal(partial.domains[0].complete, false);
  assert.deepEqual(partial.needs, []);
});

test('each question has equal weight even when its scale has more levels', () => {
  const yesNo = REFLECTION_QUESTIONS.find(question => question.domain === 'literacy' && question.scale === 'yes_no')!;
  const frequency = REFLECTION_QUESTIONS.find(question => question.domain === 'literacy' && question.scale === 'frequency_0_4')!;
  const report = calculateReflectionReport([{ questionId: yesNo.id, score: 1 }, { questionId: frequency.id, score: 0 }]);
  assert.equal(report.domains.find(domain => domain.domain === 'literacy')!.score, 50);
  const likert = REFLECTION_QUESTIONS.find(question => question.scale === 'likert_7')!;
  assert.equal(normalizedScore(likert, 4), 0.5);
  assert.equal(normalizedScore({ ...likert, isReverse: true }, 7), 0);
});

test('context cannot change scores, recommendations, completion or personalization freshness', () => {
  const core = maximums.filter(answer => !CONTEXT_IDS.includes(answer.questionId));
  assert.deepEqual(calculateReflectionReport(maximums), calculateReflectionReport(core));
  assert.equal(isAssessmentComplete(core), true);
  assert.equal(answerFingerprint(core), answerFingerprint(maximums));
  assert.equal(calculateReflectionReport(core).total, 134);
  const needs = new Set(calculateReflectionReport(core).needs.map(item => item.need));
  Object.values(SupportNeed).forEach(need => assert.ok(needs.has(need)));
});

test('only completed modules contribute and profiles contain at most eight derived needs', () => {
  const attention = maximums.filter(answer => answer.questionId.startsWith('ADHD_'));
  const report = calculateReflectionReport(attention);
  assert.ok(report.needs.length > 0);
  assert.ok(!report.needs.some(item => item.need === SupportNeed.NumberSupport));
  const profile = buildRecommendationProfile(calculateReflectionReport(maximums));
  assert.equal(profile.needs.length, 8);
  assert.equal('answers' in profile, false);
  assert.equal('domains' in profile, false);
  assert.equal(profile.scoringVersion, 'needs-v2');
});

test('unknown, duplicate, noninteger and out-of-scale values are rejected instead of clamped', () => {
  for (const input of [null, [{}], [null], [{ questionId: 'missing', score: 1 }], [{ questionId: 'INT_02', score: 2 }], [{ questionId: 'ADHD_01', score: 1.5 }], [{ questionId: 'ADHD_01', score: NaN }], [{ questionId: 'ADHD_01', score: -1 }], [maximums[0], maximums[0]]]) {
    assert.throws(() => validateAnswers(input));
  }
});

test('modular completion returns to modules; mode switches and back navigation retain answers', () => {
  let progress = beginModule(createProgress(), 'attention');
  for (let index = 0; index < 18; index++) progress = commitAnswer(progress, 4);
  assert.equal(progress.stage, 'modules');
  assert.equal(progress.answers.length, 18);
  assert.equal(progress.isComplete, false);
  const integral = changeMode(progress, 'integral');
  assert.deepEqual(integral.answers, progress.answers);
  assert.equal(integral.currentQuestionId, 'ADHD_18');
  assert.equal(previousQuestion(integral).currentQuestionId, 'ADHD_17');
  assert.equal(migrateProgress(integral).currentQuestionId, 'ADHD_18');
});

test('context skipping completes the optional part without fabricating answers', () => {
  let progress = { ...createProgress(), mode: 'integral' as const, stage: 'questions' as const };
  const skipped = skipContext(progress);
  assert.equal(skipped.currentQuestionId, 'ADHD_01');
  assert.deepEqual(skipped.skippedContext, CONTEXT_IDS);
  assert.deepEqual(skipped.answers, []);
  assert.throws(() => commitAnswer(skipped, null));
  const one = commitAnswer(progress, null);
  assert.deepEqual(one.skippedContext, ['INT_01']);
  const revisited = commitAnswer({ ...one, currentQuestionId: 'INT_01' }, 2);
  assert.deepEqual(revisited.skippedContext, []);
});

test('a pause occurs after 25 NEW answers and survives reload; editing returns directly to results', () => {
  const first24 = maximums.slice(0, 24);
  const next = commitAnswer({ ...createProgress(), mode: 'integral', stage: 'questions', answers: first24, currentQuestionId: maximums[24].questionId }, maximums[24].score);
  assert.equal(next.stage, 'break');
  assert.equal(next.currentQuestionId, maximums[25].questionId);
  assert.equal(migrateProgress(next).stage, 'break');
  const edited = commitAnswer({ ...next, stage: 'questions', returnToResults: true, currentQuestionId: 'ADHD_01' }, 0);
  assert.equal(edited.stage, 'results');
  assert.equal(edited.answers.length, 25);
  const repeated = commitAnswer({ ...next, stage: 'questions', currentQuestionId: maximums[24].questionId }, maximums[24].score);
  assert.notEqual(repeated.stage, 'break');
});

test('visiting the final question early cannot mark the journey complete', () => {
  const last = maximums.at(-1)!;
  const next = commitAnswer({ ...createProgress(), mode: 'integral', stage: 'questions', currentQuestionId: last.questionId }, last.score);
  assert.equal(next.isComplete, false);
  assert.equal(next.stage, 'questions');
  assert.equal(next.currentQuestionId, 'INT_01');
});

test('the 30-question version is archived with its original summary, never mapped to new items', () => {
  const answers = LEGACY_QUESTIONS.map(question => ({ questionId: question.id, score: 3 }));
  const restored = migrateProgress({ version: 1, answers, currentIndex: 29, isComplete: true });
  assert.equal(restored.archives.length, 1);
  assert.deepEqual(restored.answers, []);
  assert.equal(restored.isComplete, false);
  assert.ok(calculateLegacyReport(restored.archives[0].answers).domains.every(domain => domain.score === 75));
  const oldQr = btoa(JSON.stringify({ app: 'NDee', version: 1, answers }));
  const imported = applyImport(restored, decodeTransfer(oldQr));
  assert.equal(imported.archives.length, 1);
  assert.equal(imported.stage, 'archives');
});

test('NeuroAlign migration ignores shuffled indexes and handles previously mixed imports', () => {
  const restored = migrateProgress({ answers: [maximums[0], maximums[3], { questionId: 'att-1', score: 2 }], index: 130 });
  assert.equal(restored.currentQuestionId, 'INT_02');
  assert.equal(restored.answers.length, 2);
  assert.equal(restored.archives.length, 1);
  const complete = migrateProgress({ version: 1, answers: maximums, isComplete: false, currentIndex: 0 });
  assert.equal(complete.isComplete, true);
  assert.throws(() => migrateProgress({ version: 99, answers: [] }));
  assert.throws(() => migrateProgress({ ...createProgress(), currentQuestionId: 'unknown' }));
});

test('compact QR round trips all 138 responses and excludes context unless explicitly included', () => {
  const payload = encodeTransfer(maximums, true);
  assert.ok(payload.length < 600);
  assert.deepEqual(decodeTransfer(payload), { kind: 'full', answers: maximums });
  const privatePayload = encodeTransfer(maximums);
  assert.equal(decodeTransfer(privatePayload).answers.length, 134);
  assert.ok(decodeTransfer(privatePayload).answers.every(answer => !CONTEXT_IDS.includes(answer.questionId)));
  assert.deepEqual(decodeTransfer(encodeTransfer([maximums[8]])), { kind: 'full', answers: [maximums[8]] });
});

test('historical NeuroAlign QR validates hash, length, integer values and scale ranges', () => {
  const raw = { v: 1, h: legacyCatalogHash(), d: maximums.map(answer => answer.score) };
  assert.deepEqual(decodeTransfer(JSON.stringify(raw)).answers, maximums);
  for (const invalid of [{ ...raw, h: 'wrong' }, { ...raw, d: [1] }, { ...raw, v: 2 }, { ...raw, d: raw.d.map((n, i) => i === 1 ? 7 : n) }, { ...raw, d: raw.d.map((n, i) => i === 1 ? null : n) }]) assert.throws(() => decodeTransfer(JSON.stringify(invalid)));
  assert.throws(() => decodeTransfer(JSON.stringify({ ...JSON.parse(encodeTransfer(maximums)), c: 'future-version' })));
  assert.throws(() => decodeTransfer(btoa(JSON.stringify({ app: 'NDee', version: 1, answers: [{ questionId: 'att-1', score: 2 }, { questionId: 'att-1', score: 3 }] }))));
});

test('imports preserve unrelated local answers and resume at the first gap', () => {
  const progress = { ...createProgress(), acknowledged: true, answers: [maximums[0], maximums[6]], skippedContext: ['INT_02'] };
  const imported = applyImport(progress, { kind: 'full', answers: [maximums[1], maximums[4]] });
  assert.equal(imported.answers.length, 4);
  assert.deepEqual(imported.skippedContext, []);
  assert.equal(imported.currentQuestionId, 'INT_03');
});

test('the 25-answer pause also works at a module boundary and returns to the module menu', () => {
  const coordination = maximums.filter(answer => REFLECTION_QUESTIONS.find(question => question.id === answer.questionId)!.domain === 'coordination');
  const last = coordination.at(-1)!;
  const progress = { ...createProgress(), stage: 'questions' as const, answers: [...maximums.slice(0, 3), ...coordination.slice(0, -1)], currentQuestionId: last.questionId };
  const paused = commitAnswer(progress, last.score);
  assert.equal(paused.stage, 'break');
  assert.equal(paused.afterBreakStage, 'modules');
  assert.equal(migrateProgress(paused).afterBreakStage, 'modules');
});
