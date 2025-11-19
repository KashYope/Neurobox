import Dexie from './dexieShim';
import { INITIAL_EXERCISES } from '../../constants';
import { Exercise, UserProfile } from '../../types';

const LEGACY_KEYS = {
  EXERCISES: 'neurosooth_exercises_cache_v2',
  MUTATIONS: 'neurosooth_pending_mutations_v1',
  USER: 'neurosooth_user'
} as const;

export type MutationType = 'createExercise' | 'thankExercise' | 'moderateExercise';

export type PendingMutationRecord =
  | {
      id: string;
      type: 'createExercise';
      payload: { exercise: Exercise };
      attempts: number;
      createdAt: number;
      lastAttemptAt?: number;
    }
  | {
      id: string;
      type: 'thankExercise';
      payload: { exerciseId: string };
      attempts: number;
      createdAt: number;
      lastAttemptAt?: number;
    }
  | {
      id: string;
      type: 'moderateExercise';
      payload: {
        exerciseId: string;
        status: string;
        notes?: string;
        moderator?: string;
        shouldDelete?: boolean;
      };
      attempts: number;
      createdAt: number;
      lastAttemptAt?: number;
    };

interface UserRow {
  id: string;
  profile: UserProfile;
}

export interface AttachmentRecord {
  key: string;
  data: string;
  mimeType?: string;
  updatedAt: string;
}

export type AttachmentData = string | ArrayBuffer | Uint8Array | Blob;

type DexieTable<T> = {
  bulkPut(values: T[]): Promise<void>;
  bulkAdd(values: T[]): Promise<void>;
  clear(): Promise<void>;
  toArray(): Promise<T[]>;
  count(): Promise<number>;
  get(key: IDBValidKey): Promise<T | undefined>;
  put(value: T): Promise<void>;
  delete(key: IDBValidKey): Promise<void>;
};

export interface StorageAdapter {
  init(): Promise<void>;
  getExercises(): Promise<Exercise[]>;
  bulkUpsertExercises(exercises: Exercise[]): Promise<void>;
  replaceExercises(exercises: Exercise[]): Promise<void>;
  countExercises(): Promise<number>;
  getPendingMutations(): Promise<PendingMutationRecord[]>;
  setPendingMutations(mutations: PendingMutationRecord[]): Promise<void>;
  getUser(): Promise<UserProfile | null>;
  saveUser(user: UserProfile | null): Promise<void>;
  saveAttachment(record: AttachmentRecord): Promise<void>;
  getAttachment(key: string): Promise<AttachmentRecord | undefined>;
  deleteAttachment(key: string): Promise<void>;
}

export interface StorageSnapshot {
  adapter: StorageAdapter;
  exercises: Exercise[];
  pendingMutations: PendingMutationRecord[];
  user: UserProfile | null;
}

class OfflineDexieDB extends Dexie {
  exercises: DexieTable<Exercise>;
  users: DexieTable<UserRow>;
  pendingMutations: DexieTable<PendingMutationRecord>;
  attachments: DexieTable<AttachmentRecord>;

  constructor() {
    super('neurobox_offline');
    this.version(1).stores({
      exercises: '&id, serverId, updatedAt',
      users: '&id',
      pendingMutations: '&id, createdAt',
      attachments: '&key, updatedAt'
    });

    this.exercises = this.table<Exercise>('exercises');
    this.users = this.table<UserRow>('users');
    this.pendingMutations = this.table<PendingMutationRecord>('pendingMutations');
    this.attachments = this.table<AttachmentRecord>('attachments');
  }
}

class DexieStorageAdapter implements StorageAdapter {
  private db = new OfflineDexieDB();
  private openPromise = this.db.open();

  async init(): Promise<void> {
    await this.openPromise;
  }

  private async ensureOpen(): Promise<void> {
    if (!this.db.isOpen()) {
      await this.db.open();
    }
  }

  async getExercises(): Promise<Exercise[]> {
    await this.ensureOpen();
    return this.db.exercises.toArray();
  }

  async bulkUpsertExercises(exercises: Exercise[]): Promise<void> {
    if (!exercises.length) return;
    await this.ensureOpen();
    await this.db.exercises.bulkPut(exercises);
  }

  async replaceExercises(exercises: Exercise[]): Promise<void> {
    await this.ensureOpen();
    await this.db.exercises.clear();
    if (exercises.length) {
      await this.db.exercises.bulkAdd(exercises);
    }
  }

  async countExercises(): Promise<number> {
    await this.ensureOpen();
    return this.db.exercises.count();
  }

  async getPendingMutations(): Promise<PendingMutationRecord[]> {
    await this.ensureOpen();
    return this.db.pendingMutations.toArray();
  }

  async setPendingMutations(mutations: PendingMutationRecord[]): Promise<void> {
    await this.ensureOpen();
    await this.db.pendingMutations.clear();
    if (mutations.length) {
      await this.db.pendingMutations.bulkAdd(mutations);
    }
  }

  async getUser(): Promise<UserProfile | null> {
    await this.ensureOpen();
    const record = await this.db.users.get('current');
    return record?.profile ?? null;
  }

  async saveUser(user: UserProfile | null): Promise<void> {
    await this.ensureOpen();
    if (!user) {
      await this.db.users.delete('current');
      return;
    }
    await this.db.users.put({ id: 'current', profile: user });
  }

  async saveAttachment(record: AttachmentRecord): Promise<void> {
    await this.ensureOpen();
    await this.db.attachments.put(record);
  }

  async getAttachment(key: string): Promise<AttachmentRecord | undefined> {
    await this.ensureOpen();
    return this.db.attachments.get(key);
  }

  async deleteAttachment(key: string): Promise<void> {
    await this.ensureOpen();
    await this.db.attachments.delete(key);
  }
}

const cloneExercise = (exercise: Exercise): Exercise => {
  const now = new Date().toISOString();
  return {
    ...structuredClone(exercise),
    createdAt: exercise.createdAt ?? now,
    updatedAt: exercise.updatedAt ?? now
  };
};

const getLegacyData = <T>(key: string): T | null => {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const removeLegacyKey = (key: string): void => {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(key);
};

const migrateLegacyStorage = async (adapter: StorageAdapter): Promise<void> => {
  if (typeof localStorage === 'undefined') return;

  const legacyExercises = getLegacyData<Exercise[]>(LEGACY_KEYS.EXERCISES);
  if (legacyExercises && legacyExercises.length) {
    await adapter.replaceExercises(legacyExercises.map(cloneExercise));
    removeLegacyKey(LEGACY_KEYS.EXERCISES);
  }

  const legacyMutations = getLegacyData<PendingMutationRecord[]>(LEGACY_KEYS.MUTATIONS);
  if (legacyMutations) {
    await adapter.setPendingMutations(legacyMutations);
    removeLegacyKey(LEGACY_KEYS.MUTATIONS);
  }

  const legacyUser = getLegacyData<UserProfile>(LEGACY_KEYS.USER);
  if (legacyUser) {
    await adapter.saveUser(legacyUser);
    removeLegacyKey(LEGACY_KEYS.USER);
  }
};

const ensureSeedData = async (adapter: StorageAdapter): Promise<void> => {
  const count = await adapter.countExercises();
  if (count === 0) {
    await adapter.bulkUpsertExercises(INITIAL_EXERCISES.map(cloneExercise));
  }
};

let adapterPromise: Promise<StorageAdapter> | null = null;
let snapshotPromise: Promise<StorageSnapshot> | null = null;

export const getStorageAdapter = async (): Promise<StorageAdapter> => {
  if (!adapterPromise) {
    adapterPromise = (async () => {
      const adapter = new DexieStorageAdapter();
      await adapter.init();
      await migrateLegacyStorage(adapter);
      await ensureSeedData(adapter);
      return adapter;
    })();
  }
  return adapterPromise;
};

export const getInitialSnapshot = async (): Promise<StorageSnapshot> => {
  if (!snapshotPromise) {
    snapshotPromise = (async () => {
      const adapter = await getStorageAdapter();
      const [exercises, pendingMutations, user] = await Promise.all([
        adapter.getExercises(),
        adapter.getPendingMutations(),
        adapter.getUser()
      ]);
      return { adapter, exercises, pendingMutations, user };
    })();
  }
  return snapshotPromise;
};

const bufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });
  return typeof btoa === 'function' ? btoa(binary) : Buffer.from(binary, 'binary').toString('base64');
};

const normalizeAttachmentData = async (data: AttachmentData): Promise<string> => {
  if (typeof data === 'string') {
    return data;
  }
  if (data instanceof Uint8Array) {
    return bufferToBase64(data.buffer);
  }
  if (data instanceof ArrayBuffer) {
    return bufferToBase64(data);
  }
  if (typeof Blob !== 'undefined' && data instanceof Blob) {
    const buffer = await data.arrayBuffer();
    return bufferToBase64(buffer);
  }
  throw new Error('Unsupported attachment payload');
};

export const saveAttachment = async (key: string, data: AttachmentData, mimeType?: string): Promise<void> => {
  const adapter = await getStorageAdapter();
  const record: AttachmentRecord = {
    key,
    data: await normalizeAttachmentData(data),
    mimeType,
    updatedAt: new Date().toISOString()
  };
  await adapter.saveAttachment(record);
};

export const readAttachment = async (key: string): Promise<AttachmentRecord | undefined> => {
  const adapter = await getStorageAdapter();
  return adapter.getAttachment(key);
};

export const removeAttachment = async (key: string): Promise<void> => {
  const adapter = await getStorageAdapter();
  await adapter.deleteAttachment(key);
};

export const attachmentKeyForExerciseImage = (exerciseId: string): string => `exercise:${exerciseId}:image`;
