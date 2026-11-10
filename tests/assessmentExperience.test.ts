import assert from 'node:assert/strict';
import test from 'node:test';
import { CORE_QUESTIONS, REFLECTION_QUESTIONS, SCALE_LIMITS, DOMAINS } from '../features/assessment/model';
import { createProgress, migrateProgress, beginModule } from '../features/assessment/progress';
import { progressSummary, continueProfile, commitProfileAnswer, previousProfileQuestion, createAnswerTransition } from '../features/assessment/experience';

const allAnswers = CORE_QUESTIONS.map(question => ({ questionId: question.id, score: SCALE_LIMITS[question.scale].max }));

test('duration and completion exclude optional context and deduplicate by question identity', () => {
  assert.equal(progressSummary(null).minutes, 23);
  const progress = { ...createProgress(), answers: REFLECTION_QUESTIONS.filter(q => q.domain === 'context').map(q => ({ questionId: q.id, score: 0 })) };
  assert.equal(progressSummary(progress).percent, 0);
  assert.equal(progressSummary({ ...progress, answers: [...progress.answers, ...allAnswers] }).minutes, 0);
  for (const domain of DOMAINS) assert.ok(progressSummary(null, domain).total > 0);
});

test('guided journey starts at core, preserves answers and archives, and survives reload', () => {
  const old = { ...createProgress(), answers: allAnswers.slice(0, 7), acknowledged: true };
  const next = continueProfile(old);
  assert.equal(next.currentQuestionId, allAnswers[7].questionId);
  assert.equal(next.mode, 'integral');
  assert.deepEqual(migrateProgress(next).answers, old.answers);
  assert.equal(continueProfile({ ...old, answers: allAnswers }).stage, 'results');
});

test('guided completion with missing optional context shows results; early last answer finds first core gap', () => {
  const last = allAnswers.at(-1)!;
  const base = { ...createProgress(), mode: 'integral' as const, stage: 'questions' as const, currentQuestionId: last.questionId };
  const done = commitProfileAnswer({ ...base, answers: allAnswers.slice(0, -1) }, last.score);
  assert.equal(done.stage, 'results');
  assert.equal(done.isComplete, true);
  assert.deepEqual(done.skippedContext, []);
  const early = commitProfileAnswer(base, last.score);
  assert.equal(early.currentQuestionId, allAnswers[0].questionId);
  assert.equal(early.stage, 'questions');
});

test('theme-only selection, pauses, and results editing retain their existing destinations', () => {
  let theme = beginModule(createProgress(), 'attention');
  for (const answer of allAnswers.filter(a => a.questionId.startsWith('ADHD_'))) theme = commitProfileAnswer(theme, answer.score);
  assert.equal(theme.stage, 'modules');
  const guided = continueProfile({ ...createProgress(), answers: allAnswers.slice(0, 24) });
  const paused = commitProfileAnswer(guided, allAnswers[24].score);
  assert.equal(paused.stage, 'break');
  assert.equal(migrateProgress(paused).afterBreakStage, 'questions');
  const edit = commitProfileAnswer({ ...guided, returnToResults: true }, SCALE_LIMITS[CORE_QUESTIONS[24].scale].min);
  assert.equal(edit.stage, 'results');
});

test('automatic transition waits for storage AND delay, and ignores double clicks', async () => {
  let saved!: () => void;
  let delayed!: () => void;
  let writes = 0;
  const published: string[] = [];
  const transition = createAnswerTransition(() => { writes++; return new Promise(resolve => { saved = resolve; }); }, p => published.push(p.currentQuestionId), () => new Promise(resolve => { delayed = resolve; }));
  const progress = continueProfile(createProgress());
  const first = transition.submit(progress);
  assert.equal(await transition.submit(progress), false);
  saved(); await Promise.resolve();
  assert.deepEqual(published, []);
  delayed(); await first;
  assert.equal(writes, 1);
  assert.deepEqual(published, [progress.currentQuestionId]);
});

test('failed storage never advances and permits retry of the same response', async () => {
  let fail = true;
  let publications = 0;
  const transition = createAnswerTransition(async () => { if (fail) throw new Error('disk'); }, () => publications++, async () => {});
  const value = continueProfile(createProgress());
  await assert.rejects(transition.submit(value), /disk/);
  assert.equal(publications, 0);
  fail = false;
  assert.equal(await transition.submit(value), true);
  assert.equal(publications, 1);
});

test('leaving during transition retains persisted progress without publishing into an unmounted view', async () => {
  let finish!: () => void;
  let persisted = false;
  let published = false;
  const transition = createAnswerTransition(async () => { persisted = true; }, () => { published = true; }, () => new Promise(resolve => { finish = resolve; }));
  const task = transition.submit(continueProfile(createProgress()));
  transition.dispose(); finish(); await task;
  assert.equal(persisted, true);
  assert.equal(published, false);
  assert.equal(await transition.submit(createProgress()), false);
});


test('back from the first guided question opens themes rather than optional context', () => {
  const first = continueProfile(createProgress());
  assert.equal(previousProfileQuestion(first).stage, 'modules');
  const second = { ...first, currentQuestionId: CORE_QUESTIONS[1].id };
  assert.equal(previousProfileQuestion(second).currentQuestionId, CORE_QUESTIONS[0].id);
});

test('effect reactivation cannot publish an obsolete pending transition', async () => {
  let finish!: () => void;
  let publications = 0;
  const transition = createAnswerTransition(async () => {}, () => publications++, () => new Promise(resolve => { finish = resolve; }));
  const obsolete = transition.submit(continueProfile(createProgress()));
  transition.dispose(); transition.activate(); finish(); await obsolete;
  assert.equal(publications, 0);
  const next = transition.submit(continueProfile(createProgress()));
  finish(); await next;
  assert.equal(publications, 1);
});
