import { INITIAL_EXERCISES } from '../constants';
import { Exercise, ModerationStatus, ServerExercise } from '../types';
import { apiClient, ApiClientType, ApiError } from './apiClient';
import {
  createHelpfulVoteEventId,
  getInstallationId,
  hasThankedExercise,
  markExerciseThanked,
  unmarkExerciseThanked
} from './helpfulVotes';
import {
  getInitialSnapshot,
  PendingMutationRecord,
  StorageAdapter
} from './storage/offlineDb';

const snapshot = await getInitialSnapshot();
const defaultStorageAdapter = snapshot.adapter;
const defaultExercises = snapshot.exercises.length ? snapshot.exercises : [...INITIAL_EXERCISES];
const defaultMutations = snapshot.pendingMutations;

type SyncApi = Pick<ApiClientType, 'fetchExercises' | 'createExercise' | 'thankExercise' | 'moderateExercise'>;

export type PendingMutationInput =
  | { type: 'createExercise'; payload: { exercise: Exercise } }
  | {
      type: 'thankExercise';
      payload: { exerciseId: string; eventId: string; installationId: string };
    }
  | {
      type: 'moderateExercise';
      payload: {
        exerciseId: string;
        status: ModerationStatus;
        notes?: string;
        moderator?: string;
        shouldDelete?: boolean;
      };
    };

export type PendingMutation = PendingMutationRecord;

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt?: number;
  pendingMutations: number;
  lastError?: string;
}

type CacheListener = (exercises: Exercise[]) => void;
type StatusListener = (status: SyncStatus) => void;

const nowIso = () => new Date().toISOString();

const generateId = () =>
  (typeof crypto !== 'undefined' && 'randomUUID' in crypto && crypto.randomUUID()) ||
  `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export interface SyncServiceOptions {
  storage?: StorageAdapter;
  apiClient?: SyncApi;
  initialExercises?: Exercise[];
  initialMutations?: PendingMutation[];
}

export class SyncService {
  private storage: StorageAdapter;
  private api: SyncApi;
  private cache: Exercise[];
  private pendingMutations: PendingMutation[];
  private readyResolver: (() => void) | null = null;
  private initialized = false;
  private listeners = new Set<CacheListener>();
  private statusListeners = new Set<StatusListener>();
  private status: SyncStatus;
  private isFlushing = false;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private activeSyncs = 0;
  public ready: Promise<void>;

  constructor(options: SyncServiceOptions = {}) {
    this.storage = options.storage ?? defaultStorageAdapter;
    this.api = options.apiClient ?? apiClient;
    this.cache = options.initialExercises?.length ? [...options.initialExercises] : [...defaultExercises];
    this.pendingMutations = [...(options.initialMutations ?? defaultMutations)];
    const isOnline = typeof navigator === 'undefined' ? true : navigator.onLine;
    this.status = {
      isOnline,
      isSyncing: false,
      pendingMutations: this.pendingMutations.length
    };
    this.ready = Promise.resolve();
  }

  init(): Promise<void> {
    if (this.initialized) {
      return this.ready;
    }

    this.initialized = true;
    this.ready = new Promise(resolve => {
      this.readyResolver = resolve;
    });

    this.bootstrapFromStorage();

    return this.ready;
  }

  private async bootstrapFromStorage(): Promise<void> {
    try {
      this.cache = await this.storage.getExercises();
      if (this.cache.length === 0) {
        this.cache = [...INITIAL_EXERCISES];
        await this.storage.replaceExercises(this.cache);
      }

      this.pendingMutations = await this.storage.getPendingMutations();
      this.updateStatus({ pendingMutations: this.pendingMutations.length });
      this.notifyCache();

      if (typeof window !== 'undefined') {
        window.addEventListener('online', this.handleOnline);
        window.addEventListener('offline', this.handleOffline);
      }

      if (this.status.isOnline) {
        await this.hydrateFromServer();
        await this.flushQueue();
      }
      this.readyResolver?.();
    } catch (error) {
      console.warn('Failed to load offline cache', error);
      this.readyResolver?.();
    }
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
    await this.storage.bulkUpsertExercises([exerciseWithMeta]);
    await this.enqueueMutation({
      type: 'createExercise',
      payload: { exercise: exerciseWithMeta }
    });
    if (this.status.isOnline) {
      await this.flushQueue();
      if (this.status.lastError) throw new Error(this.status.lastError);
    }
  }

  async incrementThanks(exerciseId: string): Promise<boolean> {
    if (hasThankedExercise(exerciseId)) return false;

    const timestamp = nowIso();
    let resolvedId = exerciseId;
    let updatedExercise: Exercise | null = null;

    this.cache = this.cache.map(ex => {
      const isTarget = ex.id === exerciseId || ex.serverId === exerciseId;
      if (isTarget && ex.serverId) {
        resolvedId = ex.serverId;
      }

      if (!isTarget) {
        return ex;
      }

      const next = {
        ...ex,
        thanksCount: ex.thanksCount + 1,
        updatedAt: timestamp
      };
      updatedExercise = next;
      return next;
    });

    if (updatedExercise) {
      await this.storage.bulkUpsertExercises([updatedExercise]);
      this.notifyCache();
    }

    await this.enqueueMutation({
      type: 'thankExercise',
      payload: {
        exerciseId: resolvedId,
        eventId: createHelpfulVoteEventId(),
        installationId: getInstallationId()
      }
    });
    if (this.status.isOnline) {
      await this.flushQueue();
      if (this.status.lastError) throw new Error(this.status.lastError);
    }
    markExerciseThanked(exerciseId);
    return true;
  }

  async moderateExercise(
    exerciseId: string,
    status: ModerationStatus,
    options?: { moderator?: string; notes?: string; shouldDelete?: boolean }
  ): Promise<void> {
    const timestamp = nowIso();
    const patch: Partial<Exercise> = {
      moderationStatus: status,
      moderationNotes: options?.notes,
      moderatedBy: options?.moderator,
      moderatedAt: timestamp
    };

    if (options?.shouldDelete) {
      patch.deletedAt = timestamp;
    }

    this.updateExercise(exerciseId, patch);
    await this.enqueueMutation({
      type: 'moderateExercise',
      payload: {
        exerciseId,
        status,
        notes: options?.notes,
        moderator: options?.moderator,
        shouldDelete: options?.shouldDelete
      }
    });
    if (this.status.isOnline) {
      await this.flushQueue();
      if (this.status.lastError) throw new Error(this.status.lastError);
    }
  }

  updateExercise(exerciseId: string, patch: Partial<Exercise>): void {
    const timestamp = patch.updatedAt || nowIso();
    let updatedExercise: Exercise | null = null;

    this.cache = this.cache.map(ex => {
      const matches = ex.id === exerciseId || ex.serverId === exerciseId;
      if (!matches) {
        return ex;
      }

      const next = { ...ex, ...patch, updatedAt: timestamp };
      updatedExercise = next;
      return next;
    });

    if (updatedExercise) {
      void this.storage.bulkUpsertExercises([updatedExercise]);
      this.notifyCache();
    }
  }

  async enqueueMutation(input: PendingMutationInput): Promise<void> {
    const mutation = this.buildPendingMutation(input);
    this.pendingMutations.push(mutation);
    await this.storage.setPendingMutations(this.pendingMutations);
    this.updateStatus({ pendingMutations: this.pendingMutations.length, lastError: undefined });
    void this.requestBackgroundSync();
  }

  private async requestBackgroundSync(): Promise<void> {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const registrationWithSync = registration as ServiceWorkerRegistration & {
        sync?: { register(tag: string): Promise<void> };
      };
      if (registrationWithSync.sync) {
        await registrationWithSync.sync.register('syncService');
      } else {
        registration.active?.postMessage('syncService');
      }
    } catch (error) {
      console.warn('Background sync registration failed', error);
    }
  }

  private buildPendingMutation(input: PendingMutationInput): PendingMutation {
    const base = {
      id: generateId(),
      attempts: 0,
      createdAt: Date.now()
    };

    if (input.type === 'createExercise') {
      return { ...base, type: 'createExercise', payload: { exercise: input.payload.exercise } };
    }

    if (input.type === 'thankExercise') {
      return {
        ...base,
        type: 'thankExercise',
        payload: {
          exerciseId: input.payload.exerciseId,
          eventId: input.payload.eventId,
          installationId: input.payload.installationId
        }
      };
    }

    return {
      ...base,
      type: 'moderateExercise',
      payload: {
        exerciseId: input.payload.exerciseId,
        status: input.payload.status,
        notes: input.payload.notes,
        moderator: input.payload.moderator,
        shouldDelete: input.payload.shouldDelete
      }
    };
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
          this.markOnline();
          this.pendingMutations.splice(index, 1);
          await this.storage.setPendingMutations(this.pendingMutations);
          this.updateStatus({ pendingMutations: this.pendingMutations.length });
          processedAny = true;
        } catch (error) {
          mutation.attempts += 1;
          mutation.lastAttemptAt = Date.now();
          await this.storage.setPendingMutations(this.pendingMutations);
          const retryable = this.isRetryable(error);
          if (this.markOfflineIfNeeded(error) || retryable || !this.status.isOnline) {
            this.scheduleRetry(Math.min(2 ** mutation.attempts * 1000, 30000));
            break;
          }
          this.pendingMutations.splice(index, 1);
          await this.revertRejectedMutation(mutation);
          await this.storage.setPendingMutations(this.pendingMutations);
          this.updateStatus({
            pendingMutations: this.pendingMutations.length,
            lastError: error instanceof Error ? error.message : 'A synchronization change was rejected'
          });
        }
      }
    } finally {
      this.isFlushing = false;
      this.finishSync(processedAny);
    }
  }

  private async dispatchMutation(mutation: PendingMutation): Promise<void> {
    if (mutation.type === 'createExercise') {
      const serverExercise = await this.api.createExercise(mutation.payload.exercise);
      await this.applyServerExercise(serverExercise);
      return;
    }

    if (mutation.type === 'thankExercise') {
      const response = await this.api.thankExercise(mutation.payload.exerciseId, {
        eventId: mutation.payload.eventId,
        installationId: mutation.payload.installationId
      });
      await this.applyServerExercise(response.exercise);
      return;
    }

    if (mutation.type === 'moderateExercise') {
      const serverExercise = await this.api.moderateExercise(mutation.payload.exerciseId, {
        status: mutation.payload.status,
        notes: mutation.payload.notes,
        shouldDelete: mutation.payload.shouldDelete
      });
      await this.applyServerExercise(serverExercise);
    }
  }

  private async hydrateFromServer(): Promise<void> {
    this.startSync();
    let didSync = false;

    try {
      const serverExercises = await this.api.fetchExercises();
      this.markOnline();
      this.cache = this.mergeServerAndLocal(serverExercises ?? []);
      this.cache = this.applyPendingThanksOverlay(this.cache);
      await this.storage.replaceExercises(this.cache);
      this.notifyCache();
      didSync = true;
    } catch (error) {
      this.markOfflineIfNeeded(error);
      console.warn('Failed to hydrate exercises', error);
    } finally {
      this.finishSync(didSync);
    }
  }

  private mergeServerAndLocal(serverExercises: ServerExercise[]): Exercise[] {
    const mergedMap = new Map<string, Exercise>();
    const addOrUpdate = (exercise: Exercise) => {
      mergedMap.set(this.getExerciseKey(exercise), structuredClone(exercise));
    };

    const pendingCreateIds = new Set(
      this.pendingMutations
        .filter(mutation => mutation.type === 'createExercise')
        .map(mutation => mutation.payload.exercise.id)
    );
    this.cache.filter(exercise => pendingCreateIds.has(exercise.id)).forEach(ex => addOrUpdate(ex));

    serverExercises.forEach(serverEx => {
      const key = this.getExerciseKey(serverEx);
      if (serverEx.deletedAt) {
        mergedMap.delete(key);
        return;
      }

      if (mergedMap.has(key)) {
        const resolved = this.resolveConflict(mergedMap.get(key)!, serverEx);
        mergedMap.set(key, resolved);
      } else {
        mergedMap.set(key, serverEx);
      }
    });

    return Array.from(mergedMap.values());
  }

  private resolveConflict(localExercise: Exercise, serverExercise: ServerExercise): Exercise {
    const localUpdated = localExercise.updatedAt ? Date.parse(localExercise.updatedAt) : 0;
    const serverUpdated = serverExercise.updatedAt ? Date.parse(serverExercise.updatedAt) : Date.now();

    if (serverExercise.deletedAt) {
      return { ...localExercise, ...serverExercise };
    }

    const preferred = serverUpdated >= localUpdated ? serverExercise : localExercise;
    const secondary = preferred === serverExercise ? localExercise : serverExercise;

    return {
      ...secondary,
      ...preferred,
      thanksCount: serverExercise.thanksCount ?? 0,
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

    this.notifyCache();
  }

  private async applyServerExercise(serverExercise: ServerExercise): Promise<void> {
    const key = this.getExerciseKey(serverExercise);
    if (serverExercise.deletedAt) {
      await this.removeExercise(key);
      return;
    }

    let matched = false;
    let updated: Exercise | null = null;

    this.cache = this.cache.map(ex => {
      if (this.getExerciseKey(ex) === key || ex.id === serverExercise.id) {
        matched = true;
        const resolved = this.resolveConflict(ex, serverExercise);
        updated = resolved;
        return resolved;
      }
      return ex;
    });

    if (!matched) {
      this.cache = [...this.cache, serverExercise];
      updated = serverExercise;
    }

    if (updated) {
      await this.storage.bulkUpsertExercises([updated]);
    }
    this.notifyCache();
  }

  private async removeExercise(serverKey: string): Promise<void> {
    const originalLength = this.cache.length;
    this.cache = this.cache.filter(ex => this.getExerciseKey(ex) !== serverKey && ex.serverId !== serverKey);
    if (this.cache.length !== originalLength) {
      await this.storage.replaceExercises(this.cache);
      this.notifyCache();
    }
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
      patch.lastError = undefined;
    }
    if (this.activeSyncs === 0) {
      patch.isSyncing = false;
    }
    if (Object.keys(patch).length > 0) {
      this.updateStatus(patch);
    }
  }

  private applyPendingThanksOverlay(exercises: Exercise[]): Exercise[] {
    const pendingById = new Map<string, number>();
    this.pendingMutations.forEach(mutation => {
      if (mutation.type !== 'thankExercise') return;
      pendingById.set(mutation.payload.exerciseId, (pendingById.get(mutation.payload.exerciseId) ?? 0) + 1);
    });
    return exercises.map(exercise => {
      const pending = pendingById.get(exercise.serverId || exercise.id) ?? pendingById.get(exercise.id) ?? 0;
      return pending ? { ...exercise, thanksCount: exercise.thanksCount + pending } : exercise;
    });
  }

  private async revertRejectedMutation(mutation: PendingMutation): Promise<void> {
    if (mutation.type === 'createExercise') {
      this.cache = this.cache.filter(exercise => exercise.id !== mutation.payload.exercise.id);
      await this.storage.replaceExercises(this.cache);
      this.notifyCache();
      return;
    }
    if (mutation.type !== 'thankExercise') return;
    let reverted: Exercise | undefined;
    this.cache = this.cache.map(exercise => {
      if (exercise.id !== mutation.payload.exerciseId && exercise.serverId !== mutation.payload.exerciseId) {
        return exercise;
      }
      reverted = { ...exercise, thanksCount: Math.max(0, exercise.thanksCount - 1) };
      return reverted;
    });
    if (reverted) {
      unmarkExerciseThanked(reverted.id);
      await this.storage.bulkUpsertExercises([reverted]);
      this.notifyCache();
    }
  }

  private isRetryable(error: unknown): boolean {
    if (error instanceof ApiError) {
      return error.status === 408 || error.status === 429 || error.status === undefined || error.status >= 500;
    }
    return error instanceof TypeError;
  }

  private scheduleRetry(ms: number): void {
    if (this.retryTimer || typeof setTimeout !== 'function') return;
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      if (this.status.isOnline) void this.flushQueue();
    }, ms);
  }

  private markOnline(): void {
    if (!this.status.isOnline) {
      this.updateStatus({ isOnline: true });
    }
  }

  private markOfflineIfNeeded(error: unknown): boolean {
    if (error instanceof ApiError) {
      if (error.status === 0) {
        this.updateStatus({ isOnline: false });
        return true;
      }
      return false;
    }

    if (error instanceof TypeError) {
      this.updateStatus({ isOnline: false });
      return true;
    }

    return false;
  }

  private handleOnline = () => {
    this.updateStatus({ isOnline: true });
    void this.hydrateFromServer().then(() => this.flushQueue());
  };

  private handleOffline = () => {
    this.updateStatus({ isOnline: false });
  };
}

export const syncService = new SyncService();
