import test from 'node:test';
import assert from 'node:assert/strict';
import { getStorageAdapter, getAssessmentProgress, saveAssessmentProgress, clearAssessmentProgress } from '../services/storage/offlineDb';
import { createProgress } from '../features/assessment/progress';

const key = 'neuroalign_secure_data_v1';
const secret = 'neuroalign_internal_privacy_key_2025';
const encode = (value: unknown) => btoa(JSON.stringify(value).split('').map((c, index) => String.fromCharCode(c.charCodeAt(0) ^ secret.charCodeAt(index % secret.length))).join(''));

test('assessment storage migrations are durable, preserve failures and clear archives', async t => {
  const data = new Map<string, string>();
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (id: string) => data.get(id) ?? null, setItem: (id: string, value: string) => data.set(id, value), removeItem: (id: string) => data.delete(id)
  } });
  const adapter = await getStorageAdapter();
  const table = (adapter as unknown as { db: { assessmentProgress: {
    get(id: string): Promise<unknown>; put(value: unknown): Promise<void>; delete(id: string): Promise<void>
  } } }).db.assessmentProgress;
  try {
    await t.test('the existing v1 row becomes an archive without pretending the new assessment is complete', async () => {
      await table.put({ id: 'current', version: 1, answers: [{ questionId: 'att-1', score: 4 }], isComplete: true, currentIndex: 29 });
      const restored = await getAssessmentProgress();
      assert.equal(restored!.version, 2);
      assert.equal(restored!.archives.length, 1);
      assert.equal(restored!.isComplete, false);
      assert.deepEqual((await getAssessmentProgress())!.archives, restored!.archives);
    });
    await t.test('legacy localStorage is removed only after the new row is successfully written', async () => {
      await clearAssessmentProgress();
      const raw = encode({ answers: [{ questionId: 'ADHD_01', score: 3 }], index: 137, locale: 'en' });
      data.set(key, raw);
      const originalPut = table.put;
      table.put = async () => { throw new Error('quota'); };
      await assert.rejects(getAssessmentProgress);
      assert.equal(data.get(key), raw);
      assert.equal(await table.get('current'), undefined);
      table.put = originalPut;
      const restored = await getAssessmentProgress();
      assert.equal(restored!.locale, 'en');
      assert.deepEqual(restored!.answers, [{ questionId: 'ADHD_01', score: 3 }]);
      assert.equal(restored!.currentQuestionId, 'INT_01');
      assert.equal(data.has(key), false);
    });
    await t.test('corrupt or unknown-version data is preserved', async () => {
      await clearAssessmentProgress();
      const corrupt = '{not-decodable';
      data.set(key, corrupt);
      await assert.rejects(getAssessmentProgress);
      assert.equal(data.get(key), corrupt);
      data.delete(key);
      const future = { id: 'current', version: 99, answers: [] };
      await table.put(future);
      await assert.rejects(getAssessmentProgress);
      assert.deepEqual(await table.get('current'), future);
    });
    await t.test('legacy answers coexist with the current archive and do not overwrite newer answers', async () => {
      await clearAssessmentProgress();
      await table.put({ id: 'current', version: 1, answers: [{ questionId: 'att-1', score: 4 }, { questionId: 'ADHD_01', score: 2 }] });
      data.set(key, encode({ answers: [{ questionId: 'ADHD_01', score: 4 }, { questionId: 'ADHD_02', score: 3 }] }));
      const saved = await getAssessmentProgress();
      assert.equal(saved!.archives.length, 1);
      assert.equal(saved!.answers.find(answer => answer.questionId === 'ADHD_01')!.score, 2);
      assert.equal(saved!.answers.find(answer => answer.questionId === 'ADHD_02')!.score, 3);
    });
    await t.test('deletion waits for pending saves and removes the whole record and legacy source', async () => {
      const pending = saveAssessmentProgress(createProgress());
      data.set(key, encode({ answers: [] }));
      const removal = clearAssessmentProgress();
      await Promise.all([pending, removal]);
      assert.equal(await getAssessmentProgress(), null);
      assert.equal(data.has(key), false);
    });
  } finally {
    await clearAssessmentProgress();
    if (previousStorage) Object.defineProperty(globalThis, 'localStorage', previousStorage);
    else delete (globalThis as { localStorage?: unknown }).localStorage;
  }
});
