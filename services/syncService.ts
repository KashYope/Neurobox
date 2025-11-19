import { INITIAL_EXERCISES } from '../constants';
import { Exercise, ServerExercise } from '../types';
import { apiClient } from './apiClient';

const CACHE_KEY = 'neurosooth_exercises_cache_v2';
const QUEUE_KEY = 'neurosooth_pending_mutations_v1';
const INITIAL_MERGE_KEY = 'neurosooth_initial_merge_done';

type PendingMutationInput =
  | { type: 'createExercise'; payload: { exercise: Exercise } }
  | { type: 'thankExercise'; payload: { exerciseId: string } };

type PendingMutation =
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
    };

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt?: number;
  pendingMutations: number;
}

type CacheListener = (exercises: Exercise[]) => void;
type StatusListener = (status: SyncStatus) => void;

const nowIso = () => new Date().toISOString();

const generateId = () =>
  (typeof crypto !== 'undefined' && 'randomUUID' in crypto && crypto.randomUUID()) ||
  `${Date.now()}-${Math.random().toString(16).slice(2)}`;

class SyncService {
  private cache: Exercise[] = [];
  private pendingMutations: PendingMutation[] = [];
  private readyResolver: (() => void) | null = null;
  private initialized = false;
  private listeners = new Set<CacheListener>();
  private statusListeners = new Set<StatusListener>();
  private status: SyncStatus = {
    isOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
    isSyncing: false,
    pendingMutations: 0
  };
  private isFlushing = false;
  private activeSyncs = 0;
  public ready: Promise<void>;

  constructor() {
    this.ready = new Promise(resolve => {
      this.readyResolver = resolve;
    });
  }

  init(): Promise<void> {
    if (this.initialized) {
      return this.ready;
    }

    this.initialized = true;
    this.cache = this.loadCache();
    this.pendingMutations = this.loadPendingMutations();
    this.updateStatus({ pendingMutations: this.pendingMutations.length });
    this.notifyCache();

    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }

    this.hydrateFromServer().finally(() => {
      this.readyResolver?.();
    });

    if (this.status.isOnline) {
      this.flushQueue();
    }

    return this.ready;
  }

  getCachedExercises(): Exercise[] {
    return [...this.cache];
  }

  subscribe(listener: CacheListener): () => void {
    this.listeners.add(listener);
    listener(this.getCachedExercises());
    return () => this.listeners.delete(listener);
  }

  subscribeStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener({ ...this.status });
    return () => this.statusListeners.delete(listener);
  }

  getStatus(): SyncStatus {
    return { ...this.status };
  }

  async createExercise(exercise: Exercise): Promise<void> {
    const timestamp = nowIso();
    const exerciseWithMeta: Exercise = {
      ...exercise,
      createdAt: exercise.createdAt || timestamp,
      updatedAt: timestamp
    };

    this.upsertExercise(exerciseWithMeta);
    this.enqueueMutation({
      type: 'createExercise',
      payload: { exercise: exerciseWithMeta }
    });
  }

  async incrementThanks(exerciseId: string): Promise<void> {
    const timestamp = nowIso();
    let resolvedId = exerciseId;

    this.cache = this.cache.map(ex => {
      const isTarget = ex.id === exerciseId || ex.serverId === exerciseId;
      if (isTarget && ex.serverId) {
        resolvedId = ex.serverId;
      }

      return isTarget
        ? {
            ...ex,
            thanksCount: ex.thanksCount + 1,
            updatedAt: timestamp
          }
        : ex;
    });
    this.persistCache();
    this.notifyCache();

    this.enqueueMutation({
      type: 'thankExercise',
      payload: { exerciseId: resolvedId }
    });
  }

  enqueueMutation(input: PendingMutationInput): void {
    const mutation = this.buildPendingMutation(input);
    this.pendingMutations.push(mutation);
    this.persistQueue();
    this.updateStatus({ pendingMutations: this.pendingMutations.length });

    if (this.status.isOnline) {
      this.flushQueue();
    }
  }

  private buildPendingMutation(input: PendingMutationInput): PendingMutation {
    const base = {
      id: generateId(),
      attempts: 0,
      createdAt: Date.now()
    };

    if (input.type === 'createExercise') {
      return { ...base, type: 'createExercise', payload: input.payload };
    }

    return { ...base, type: 'thankExercise', payload: input.payload };
  }

  async flushQueue(): Promise<void> {
    if (this.isFlushing || !this.status.isOnline || this.pendingMutations.length === 0) {
      return;
    }

    this.isFlushing = true;
    this.startSync();
    let processedAny = false;

    try {
      let index = 0;
      while (index < this.pendingMutations.length && this.status.isOnline) {
        const mutation = this.pendingMutations[index];
        try {
          await this.dispatchMutation(mutation);
          this.pendingMutations.splice(index, 1);
          this.persistQueue();
          this.updateStatus({ pendingMutations: this.pendingMutations.length });
          processedAny = true;
        } catch (error) {
          mutation.attempts += 1;
          mutation.lastAttemptAt = Date.now();
          this.persistQueue();
          const delay = Math.min(2 ** mutation.attempts * 1000, 30000);
          await this.delay(delay);

          if (!this.status.isOnline) {
            break;
          }
        }
      }
    } finally {
      this.isFlushing = false;
      this.finishSync(processedAny);
    }
  }

  private async dispatchMutation(mutation: PendingMutation): Promise<void> {
    if (mutation.type === 'createExercise') {
      const serverExercise = await apiClient.createExercise(mutation.payload.exercise);
      this.applyServerExercise(serverExercise);
      return;
    }

    if (mutation.type === 'thankExercise') {
      const serverExercise = await apiClient.thankExercise(mutation.payload.exerciseId);
      this.applyServerExercise(serverExercise);
    }
  }

  private async hydrateFromServer(): Promise<void> {
    this.startSync();
    let didSync = false;

    try {
      const serverExercises = await apiClient.fetchExercises();
      if (serverExercises && serverExercises.length > 0) {
        this.cache = this.mergeServerAndLocal(serverExercises);
        this.persistCache();
        this.notifyCache();
      }
      didSync = true;
    } catch (error) {
      console.warn('Failed to hydrate exercises', error);
    } finally {
      this.finishSync(didSync);
    }
  }

  private mergeServerAndLocal(serverExercises: ServerExercise[]): Exercise[] {
    const mergedMap = new Map<string, Exercise>();
    const addOrUpdate = (exercise: Exercise) => {
      mergedMap.set(this.getExerciseKey(exercise), exercise);
    };

    const seed = this.ensureInitialSeed(this.cache);
    seed.forEach(ex => addOrUpdate(ex));

    serverExercises.forEach(serverEx => {
      const key = this.getExerciseKey(serverEx);
      if (mergedMap.has(key)) {
        const resolved = this.resolveConflict(mergedMap.get(key)!, serverEx);
        mergedMap.set(key, resolved);
      } else {
        mergedMap.set(key, serverEx);
      }
    });

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(INITIAL_MERGE_KEY, 'true');
    }

    return Array.from(mergedMap.values());
  }

  private ensureInitialSeed(current: Exercise[]): Exercise[] {
    if (current.length > 0) {
      return current;
    }

    const cachedInitialMerge =
      typeof localStorage !== 'undefined' && localStorage.getItem(INITIAL_MERGE_KEY) === 'true';

    if (cachedInitialMerge) {
      return current;
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CACHE_KEY, JSON.stringify(INITIAL_EXERCISES));
    }

    return [...INITIAL_EXERCISES];
  }

  private resolveConflict(localExercise: Exercise, serverExercise: ServerExercise): Exercise {
    const localUpdated = localExercise.updatedAt ? Date.parse(localExercise.updatedAt) : 0;
    const serverUpdated = serverExercise.updatedAt ? Date.parse(serverExercise.updatedAt) : Date.now();

    const preferred = serverUpdated >= localUpdated ? serverExercise : localExercise;
    const secondary = preferred === serverExercise ? localExercise : serverExercise;

    return {
      ...secondary,
      ...preferred,
      thanksCount: Math.max(localExercise.thanksCount, serverExercise.thanksCount ?? 0),
      serverId: serverExercise.serverId || localExercise.serverId,
      updatedAt: preferred.updatedAt || secondary.updatedAt,
      createdAt: preferred.createdAt || secondary.createdAt
    };
  }

  private upsertExercise(exercise: Exercise): void {
    const key = this.getExerciseKey(exercise);
    const exists = this.cache.some(ex => this.getExerciseKey(ex) === key);

    if (exists) {
      this.cache = this.cache.map(ex =>
        this.getExerciseKey(ex) === key ? { ...ex, ...exercise } : ex
      );
    } else {
      this.cache = [...this.cache, exercise];
    }

    this.persistCache();
    this.notifyCache();
  }

  private applyServerExercise(serverExercise: ServerExercise): void {
    const key = this.getExerciseKey(serverExercise);
    let matched = false;

    this.cache = this.cache.map(ex => {
      if (this.getExerciseKey(ex) === key || ex.id === serverExercise.id) {
        matched = true;
        return this.resolveConflict(ex, serverExercise);
      }
      return ex;
    });

    if (!matched) {
      this.cache = [...this.cache, serverExercise];
    }

    this.persistCache();
    this.notifyCache();
  }

  private loadCache(): Exercise[] {
    if (typeof localStorage === 'undefined') {
      return [...INITIAL_EXERCISES];
    }

    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) {
        localStorage.setItem(CACHE_KEY, JSON.stringify(INITIAL_EXERCISES));
        return [...INITIAL_EXERCISES];
      }

      const parsed = JSON.parse(cached) as Exercise[];
      return parsed.length ? parsed : [...INITIAL_EXERCISES];
    } catch (error) {
      console.warn('Failed to parse exercise cache', error);
      return [...INITIAL_EXERCISES];
    }
  }

  private persistCache(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(CACHE_KEY, JSON.stringify(this.cache));
  }

  private loadPendingMutations(): PendingMutation[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }

    try {
      const cached = localStorage.getItem(QUEUE_KEY);
      return cached ? (JSON.parse(cached) as PendingMutation[]) : [];
    } catch (error) {
      console.warn('Failed to parse pending mutations', error);
      return [];
    }
  }

  private persistQueue(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(QUEUE_KEY, JSON.stringify(this.pendingMutations));
  }

  private getExerciseKey(exercise: Exercise): string {
    return exercise.serverId || exercise.id;
  }

  private notifyCache(): void {
    const snapshot = this.getCachedExercises();
    this.listeners.forEach(listener => listener(snapshot));
  }

  private notifyStatus(): void {
    const snapshot = this.getStatus();
    this.statusListeners.forEach(listener => listener(snapshot));
  }

  private updateStatus(patch: Partial<SyncStatus>): void {
    this.status = { ...this.status, ...patch };
    this.notifyStatus();
  }

  private startSync(): void {
    this.activeSyncs += 1;
    if (this.activeSyncs === 1) {
      this.updateStatus({ isSyncing: true });
    }
  }

  private finishSync(didSync: boolean): void {
    this.activeSyncs = Math.max(0, this.activeSyncs - 1);
    const patch: Partial<SyncStatus> = {};
    if (didSync) {
      patch.lastSyncedAt = Date.now();
    }
    if (this.activeSyncs === 0) {
      patch.isSyncing = false;
    }
    if (Object.keys(patch).length > 0) {
      this.updateStatus(patch);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private handleOnline = () => {
    this.updateStatus({ isOnline: true });
    this.hydrateFromServer();
    this.flushQueue();
  };

  private handleOffline = () => {
    this.updateStatus({ isOnline: false });
  };
}

export const syncService = new SyncService();
