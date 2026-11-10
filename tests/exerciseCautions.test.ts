import test from 'node:test';
import assert from 'node:assert/strict';
import { exerciseCautions } from '../services/exerciseCautions';
import { exerciseTranslationService } from '../services/exerciseTranslationService';
import { INITIAL_EXERCISES } from '../constants';

test('identical precautions are shown once while distinct instructions remain', () => {
  assert.deepEqual(exerciseCautions('Stop if uncomfortable.', '  STOP   IF UNCOMFORTABLE. '), ['Stop if uncomfortable.']);
  assert.deepEqual(exerciseCautions('General note', 'Specific instruction'), ['General note', 'Specific instruction']);
  assert.deepEqual(exerciseCautions('General note', '  '), ['General note']);
});

test('warning translations honour explicit IDs and retain safety text on empty translation', () => {
  const exercise = { ...INITIAL_EXERCISES[0], warningStringId: 'custom.warning' };
  assert.equal(exerciseTranslationService.translateExercise(exercise, { 'custom.warning': 'Translated precaution' }).warning, 'Translated precaution');
  assert.equal(exerciseTranslationService.translateExercise(exercise, { 'custom.warning': '' }).warning, exercise.warning);
});

test('all built-in precautions have a nonempty translation in each supported language', async () => {
  const { readFile } = await import('node:fs/promises');
  const warnings = INITIAL_EXERCISES.filter(exercise => exercise.warning);
  for (const lang of ['fr', 'en', 'de', 'es', 'nl']) {
    const locale = JSON.parse(await readFile(`public/locales/${lang}/exercise.json`, 'utf8'));
    assert.deepEqual(Object.keys(locale.warnings).sort(), warnings.map(exercise => exercise.id).sort());
    for (const exercise of warnings) {
      assert.ok(locale.warnings[exercise.id]?.trim(), `${lang}: ${exercise.id}`);
      if (lang === 'fr') assert.equal(locale.warnings[exercise.id], exercise.warning);
      else assert.notEqual(locale.warnings[exercise.id], exercise.warning);
    }
  }
});
