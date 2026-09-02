import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { INITIAL_EXERCISES, THANKS_VISIBILITY_THRESHOLD } from '../constants.js';
import { getIllustrationModel } from '../components/exercises/ExerciseIllustration.js';
import { getRecommendedExercises } from '../services/dataService.js';
import { exercisePayloadSchema, thankExerciseSchema } from '../server/src/utils/validation.js';
import { sanitizeImagePath } from '../server/src/utils/serializers.js';
const flattenKeys = (value, prefix = '') => {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        return [prefix];
    return Object.entries(value).flatMap(([key, child]) => flattenKeys(child, prefix ? `${prefix}.${key}` : key));
};
test('official seed data starts with truthful zero counts and local artwork', () => {
    assert.ok(INITIAL_EXERCISES.length > 0);
    INITIAL_EXERCISES.forEach(exercise => {
        assert.equal(exercise.thanksCount, 0);
        assert.match(exercise.imageUrl || '', /^\/images\/exercises\/[a-z0-9-]+\.svg$/);
    });
});
test('recommendations only use verified feedback at the visibility threshold', () => {
    const base = {
        ...INITIAL_EXERCISES[0],
        neurotypes: [],
        moderationStatus: 'approved'
    };
    const below = { ...base, id: 'a-below', thanksCount: THANKS_VISIBILITY_THRESHOLD - 1 };
    const visible = { ...base, id: 'z-visible', thanksCount: THANKS_VISIBILITY_THRESHOLD };
    assert.deepEqual(getRecommendedExercises([below, visible], null, 'All').map(exercise => exercise.id), ['z-visible', 'a-below']);
});
test('procedural illustration models are deterministic and use approved colors', () => {
    const exercise = { ...INITIAL_EXERCISES[0], id: 'community-stable', imageUrl: undefined };
    const first = getIllustrationModel(exercise);
    const second = getIllustrationModel(structuredClone(exercise));
    assert.deepEqual(first, second);
    assert.match(first.primary, /^#[0-9a-f]{6}$/i);
    assert.match(first.secondary, /^#[0-9a-f]{6}$/i);
    assert.match(first.accent, /^#[0-9a-f]{6}$/i);
});
test('exercise creation rejects client metrics, ownership flags, and external images', () => {
    const valid = {
        id: 'community-test',
        title: 'Technique test',
        description: 'Une description suffisamment longue.',
        situation: ['Stress'],
        neurotypes: [],
        duration: '2 min',
        steps: ['Respirez doucement.'],
        tags: []
    };
    assert.equal(exercisePayloadSchema.safeParse(valid).success, true);
    assert.equal(exercisePayloadSchema.safeParse({ ...valid, thanksCount: 250 }).success, false);
    assert.equal(exercisePayloadSchema.safeParse({ ...valid, isPartnerContent: true }).success, false);
    assert.equal(exercisePayloadSchema.safeParse({ ...valid, imageUrl: 'https://example.com/image.svg' }).success, false);
    assert.equal(exercisePayloadSchema.safeParse({ ...valid, imageUrl: '/images/exercises/test.svg' }).success, true);
    assert.equal(sanitizeImagePath('https://legacy.example/image.svg'), undefined);
    assert.equal(sanitizeImagePath('//legacy.example/image.svg'), undefined);
    assert.equal(sanitizeImagePath('/images/exercises/test.svg'), '/images/exercises/test.svg');
});
test('helpful vote payload requires durable UUID identities', () => {
    assert.equal(thankExerciseSchema.safeParse({ eventId: crypto.randomUUID(), installationId: crypto.randomUUID() }).success, true);
    assert.equal(thankExerciseSchema.safeParse({ eventId: 'repeat-me', installationId: 'browser' }).success, false);
});
test('all locale namespaces have the same key set as French', async () => {
    const languages = ['fr', 'en', 'de', 'es', 'nl'];
    const namespaces = ['common', 'onboarding', 'exercise', 'partner', 'moderation'];
    for (const namespace of namespaces) {
        const loaded = await Promise.all(languages.map(async (language) => {
            const file = path.join(process.cwd(), 'public', 'locales', language, `${namespace}.json`);
            return JSON.parse(await readFile(file, 'utf8'));
        }));
        const expected = flattenKeys(loaded[0]).sort();
        loaded.slice(1).forEach((locale, index) => {
            assert.deepEqual(flattenKeys(locale).sort(), expected, `${languages[index + 1]}/${namespace} differs from fr/${namespace}`);
        });
    }
});
