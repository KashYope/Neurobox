import test from 'node:test';
import assert from 'node:assert/strict';
import { SyncService } from '../services/syncService';
import { Exercise, ServerExercise, UserProfile } from '../types';
import { AttachmentRecord, StorageAdapter, PendingMutationRecord } from '../services/storage/offlineDb';

type MockApi = {
  fetchExercises: () => Promise<ServerExercise[]>;
  createExercise: (exercise: Exercise) => Promise<ServerExercise>;
  thankExercise: (exerciseId: string) => Promise<ServerExercise>;
};

class MemoryStorage implements StorageAdapter {
  private exercises: Exercise[];
  private mutations: PendingMutationRecord[];
  private user: UserProfile | null;
  private attachments = new Map<string, AttachmentRecord>();

  constructor({ exercises = [], mutations = [], user = null }: Partial<{ exercises: Exercise[]; mutations: PendingMutationRecord[]; user: UserProfile | null }> = {}) {
    this.exercises = exercises.map(ex => structuredClone(ex));
    this.mutations = mutations.map(m => structuredClone(m));
    this.user = user ? structuredClone(user) : null;
  }

  async init(): Promise<void> {}

  async getExercises(): Promise<Exercise[]> {
    return this.exercises.map(ex => structuredClone(ex));
  }

  async bulkUpsertExercises(exercises: Exercise[]): Promise<void> {
    exercises.forEach(exercise => {
      const key = this.getKey(exercise);
      const index = this.exercises.findIndex(ex => this.getKey(ex) === key);
      if (index >= 0) {
        this.exercises[index] = structuredClone(exercise);
      } else {
        this.exercises.push(structuredClone(exercise));
      }
    });
  }

  async replaceExercises(exercises: Exercise[]): Promise<void> {
    this.exercises = exercises.map(ex => structuredClone(ex));
  }

  async countExercises(): Promise<number> {
    return this.exercises.length;
  }

  async getPendingMutations(): Promise<PendingMutationRecord[]> {
    return this.mutations.map(m => structuredClone(m));
  }

  async setPendingMutations(mutations: PendingMutationRecord[]): Promise<void> {
    this.mutations = mutations.map(m => structuredClone(m));
  }

  async getUser(): Promise<UserProfile | null> {
    return this.user ? structuredClone(this.user) : null;
  }

  async saveUser(user: UserProfile | null): Promise<void> {
    this.user = user ? structuredClone(user) : null;
  }

  async saveAttachment(record: AttachmentRecord): Promise<void> {
    this.attachments.set(record.key, structuredClone(record));
  }

  async getAttachment(key: string): Promise<AttachmentRecord | undefined> {
    const record = this.attachments.get(key);
    return record ? structuredClone(record) : undefined;
  }

  async deleteAttachment(key: string): Promise<void> {
    this.attachments.delete(key);
  }

  private getKey(exercise: Exercise): string {
    return exercise.serverId || exercise.id;
  }

  dumpMutations(): PendingMutationRecord[] {
    return this.mutations;
  }
}

const baseExercise: Exercise = {
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

const createMockApi = (overrides: Partial<MockApi> = {}): MockApi => ({
  fetchExercises: async () => [],
  createExercise: async exercise => ({ ...exercise, serverId: exercise.id, createdAt: exercise.createdAt!, updatedAt: exercise.updatedAt! }),
  thankExercise: async exerciseId => ({ ...baseExercise, id: exerciseId, serverId: exerciseId, createdAt: now(), updatedAt: now() }),
  ...overrides
});

const now = () => new Date().toISOString();

const setNavigatorOnline = (value: boolean) => {
  // @ts-expect-error navigator shim for tests
  globalThis.navigator = { onLine: value };
};

const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
  const created: ServerExercise[] = [];
  const api = createMockApi({
    createExercise: async exercise => {
      const serverExercise: ServerExercise = {
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
  (service as unknown as { handleOnline: () => void }).handleOnline();
  await waitFor(20);

  assert.equal(storage.dumpMutations().length, 0);
  assert.equal(created.length, 1);
  assert.equal(service.getCachedExercises().some(ex => ex.serverId === 'server-local-new'), true);
});

test('resolves conflicts using latest server data', async () => {
  setNavigatorOnline(true);
  const localExercise: Exercise = {
    ...baseExercise,
    id: 'conflict',
    thanksCount: 1,
    updatedAt: '2024-01-01T00:00:00.000Z'
  };

  const serverExercise: ServerExercise = {
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
  assert.equal(merged!.thanksCount, 10);
  assert.equal(merged!.updatedAt, serverExercise.updatedAt);
});
