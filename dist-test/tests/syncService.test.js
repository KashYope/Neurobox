import test from 'node:test';
import assert from 'node:assert/strict';
import { SyncService } from '../services/syncService';
class MemoryStorage {
    constructor({ exercises = [], mutations = [], user = null } = {}) {
        this.attachments = new Map();
        this.exercises = exercises.map(ex => structuredClone(ex));
        this.mutations = mutations.map(m => structuredClone(m));
        this.user = user ? structuredClone(user) : null;
    }
    async init() { }
    async getExercises() {
        return this.exercises.map(ex => structuredClone(ex));
    }
    async bulkUpsertExercises(exercises) {
        exercises.forEach(exercise => {
            const key = this.getKey(exercise);
            const index = this.exercises.findIndex(ex => this.getKey(ex) === key);
            if (index >= 0) {
                this.exercises[index] = structuredClone(exercise);
            }
            else {
                this.exercises.push(structuredClone(exercise));
            }
        });
    }
    async replaceExercises(exercises) {
        this.exercises = exercises.map(ex => structuredClone(ex));
    }
    async countExercises() {
        return this.exercises.length;
    }
    async getPendingMutations() {
        return this.mutations.map(m => structuredClone(m));
    }
    async setPendingMutations(mutations) {
        this.mutations = mutations.map(m => structuredClone(m));
    }
    async getUser() {
        return this.user ? structuredClone(this.user) : null;
    }
    async saveUser(user) {
        this.user = user ? structuredClone(user) : null;
    }
    async saveAttachment(record) {
        this.attachments.set(record.key, structuredClone(record));
    }
    async getAttachment(key) {
        const record = this.attachments.get(key);
        return record ? structuredClone(record) : undefined;
    }
    async deleteAttachment(key) {
        this.attachments.delete(key);
    }
    getKey(exercise) {
        return exercise.serverId || exercise.id;
    }
    dumpMutations() {
        return this.mutations;
    }
}
const baseExercise = {
    id: 'seed-1',
    title: 'Seed',
    description: 'Seed',
    situation: [],
    neurotypes: [],
    duration: '1m',
    steps: [],
    imageUrl: '',
    tags: [],
    thanksCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
};
const createMockApi = (overrides = {}) => ({
    fetchExercises: async () => [],
    createExercise: async (exercise) => ({ ...exercise, serverId: exercise.id, createdAt: exercise.createdAt, updatedAt: exercise.updatedAt }),
    thankExercise: async (exerciseId) => ({ ...baseExercise, id: exerciseId, serverId: exerciseId, createdAt: now(), updatedAt: now() }),
    ...overrides
});
const now = () => new Date().toISOString();
const setNavigatorOnline = (value) => {
    // @ts-expect-error navigator shim for tests
    globalThis.navigator = { onLine: value };
};
const waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));
test('hydrates from offline cache when offline', async () => {
    setNavigatorOnline(false);
    const storage = new MemoryStorage({ exercises: [baseExercise] });
    const api = createMockApi();
    const service = new SyncService({ storage, apiClient: api, initialExercises: [baseExercise], initialMutations: [] });
    await service.init();
    const cached = service.getCachedExercises();
    assert.equal(cached.length, 1);
    assert.equal(cached[0].id, baseExercise.id);
});
test('replays pending mutations when coming back online', async () => {
    setNavigatorOnline(false);
    const storage = new MemoryStorage();
    const created = [];
    const api = createMockApi({
        createExercise: async (exercise) => {
            const serverExercise = {
                ...exercise,
                serverId: `server-${exercise.id}`,
                createdAt: exercise.createdAt || now(),
                updatedAt: exercise.updatedAt || now()
            };
            created.push(serverExercise);
            return serverExercise;
        }
    });
    const service = new SyncService({ storage, apiClient: api, initialExercises: [], initialMutations: [] });
    await service.init();
    await service.createExercise({ ...baseExercise, id: 'local-new' });
    assert.equal(storage.dumpMutations().length, 1);
    setNavigatorOnline(true);
    service.handleOnline();
    await waitFor(20);
    assert.equal(storage.dumpMutations().length, 0);
    assert.equal(created.length, 1);
    assert.equal(service.getCachedExercises().some(ex => ex.serverId === 'server-local-new'), true);
});
test('resolves conflicts using latest server data', async () => {
    setNavigatorOnline(true);
    const localExercise = {
        ...baseExercise,
        id: 'conflict',
        thanksCount: 1,
        updatedAt: '2024-01-01T00:00:00.000Z'
    };
    const serverExercise = {
        ...localExercise,
        serverId: 'conflict',
        thanksCount: 10,
        updatedAt: '2024-02-01T00:00:00.000Z',
        createdAt: '2024-01-01T00:00:00.000Z'
    };
    const storage = new MemoryStorage({ exercises: [localExercise] });
    const api = createMockApi({ fetchExercises: async () => [serverExercise] });
    const service = new SyncService({ storage, apiClient: api, initialExercises: [localExercise], initialMutations: [] });
    await service.init();
    const merged = service.getCachedExercises().find(ex => ex.id === 'conflict');
    assert.ok(merged);
    assert.equal(merged.thanksCount, 10);
    assert.equal(merged.updatedAt, serverExercise.updatedAt);
});
