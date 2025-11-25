import { INITIAL_EXERCISES } from '../constants';
import { apiClient, ApiError } from './apiClient';
import { getInitialSnapshot } from './storage/offlineDb';
const snapshot = await getInitialSnapshot();
const defaultStorageAdapter = snapshot.adapter;
const defaultExercises = snapshot.exercises.length ? snapshot.exercises : [...INITIAL_EXERCISES];
const defaultMutations = snapshot.pendingMutations;
const nowIso = () => new Date().toISOString();
const generateId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto && crypto.randomUUID()) ||
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;
export class SyncService {
    constructor(options = {}) {
        this.readyResolver = null;
        this.initialized = false;
        this.listeners = new Set();
        this.statusListeners = new Set();
        this.isFlushing = false;
        this.activeSyncs = 0;
        this.handleOnline = () => {
            this.updateStatus({ isOnline: true });
            this.hydrateFromServer();
            this.flushQueue();
        };
        this.handleOffline = () => {
            this.updateStatus({ isOnline: false });
        };
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
    init() {
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
    async bootstrapFromStorage() {
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
            this.hydrateFromServer()
                .catch(error => {
                console.warn('Failed to hydrate exercises', error);
            })
                .finally(() => {
                this.readyResolver?.();
            });
            if (this.status.isOnline) {
                this.flushQueue();
            }
        }
        catch (error) {
            console.warn('Failed to load offline cache', error);
            this.readyResolver?.();
        }
    }
    getCachedExercises() {
        return [...this.cache];
    }
    subscribe(listener) {
        this.listeners.add(listener);
        listener(this.getCachedExercises());
        return () => this.listeners.delete(listener);
    }
    subscribeStatus(listener) {
        this.statusListeners.add(listener);
        listener({ ...this.status });
        return () => this.statusListeners.delete(listener);
    }
    getStatus() {
        return { ...this.status };
    }
    async createExercise(exercise) {
        const timestamp = nowIso();
        const exerciseWithMeta = {
            ...exercise,
            createdAt: exercise.createdAt || timestamp,
            updatedAt: timestamp
        };
        this.upsertExercise(exerciseWithMeta);
        await this.storage.bulkUpsertExercises([exerciseWithMeta]);
        this.enqueueMutation({
            type: 'createExercise',
            payload: { exercise: exerciseWithMeta }
        });
    }
    async incrementThanks(exerciseId) {
        const timestamp = nowIso();
        let resolvedId = exerciseId;
        let updatedExercise = null;
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
        this.enqueueMutation({
            type: 'thankExercise',
            payload: { exerciseId: resolvedId }
        });
    }
    async moderateExercise(exerciseId, status, options) {
        const timestamp = nowIso();
        const patch = {
            moderationStatus: status,
            moderationNotes: options?.notes,
            moderatedBy: options?.moderator,
            moderatedAt: timestamp
        };
        if (options?.shouldDelete) {
            patch.deletedAt = timestamp;
        }
        this.updateExercise(exerciseId, patch);
        this.enqueueMutation({
            type: 'moderateExercise',
            payload: {
                exerciseId,
                status,
                notes: options?.notes,
                moderator: options?.moderator,
                shouldDelete: options?.shouldDelete
            }
        });
    }
    updateExercise(exerciseId, patch) {
        const timestamp = patch.updatedAt || nowIso();
        let updatedExercise = null;
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
    enqueueMutation(input) {
        const mutation = this.buildPendingMutation(input);
        this.pendingMutations.push(mutation);
        void this.storage.setPendingMutations(this.pendingMutations);
        this.updateStatus({ pendingMutations: this.pendingMutations.length });
        this.requestBackgroundSync();
        if (this.status.isOnline) {
            this.flushQueue();
        }
    }
    async requestBackgroundSync() {
        if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
            return;
        }
        try {
            const registration = await navigator.serviceWorker.ready;
            if ('sync' in registration) {
                await registration.sync.register('syncService');
            }
            else {
                registration.active?.postMessage('syncService');
            }
        }
        catch (error) {
            console.warn('Background sync registration failed', error);
        }
    }
    buildPendingMutation(input) {
        const base = {
            id: generateId(),
            attempts: 0,
            createdAt: Date.now()
        };
        if (input.type === 'createExercise') {
            return { ...base, type: 'createExercise', payload: { exercise: input.payload.exercise } };
        }
        if (input.type === 'thankExercise') {
            return { ...base, type: 'thankExercise', payload: { exerciseId: input.payload.exerciseId } };
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
    async flushQueue() {
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
                }
                catch (error) {
                    mutation.attempts += 1;
                    mutation.lastAttemptAt = Date.now();
                    await this.storage.setPendingMutations(this.pendingMutations);
                    const delay = Math.min(2 ** mutation.attempts * 1000, 30000);
                    await this.delay(delay);
                    if (this.markOfflineIfNeeded(error) || !this.status.isOnline) {
                        break;
                    }
                    index += 1;
                }
            }
        }
        finally {
            this.isFlushing = false;
            this.finishSync(processedAny);
        }
    }
    async dispatchMutation(mutation) {
        if (mutation.type === 'createExercise') {
            const serverExercise = await this.api.createExercise(mutation.payload.exercise);
            await this.applyServerExercise(serverExercise);
            return;
        }
        if (mutation.type === 'thankExercise') {
            const serverExercise = await this.api.thankExercise(mutation.payload.exerciseId);
            await this.applyServerExercise(serverExercise);
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
    async hydrateFromServer() {
        this.startSync();
        let didSync = false;
        try {
            const serverExercises = await this.api.fetchExercises();
            this.markOnline();
            if (serverExercises && serverExercises.length > 0) {
                this.cache = this.mergeServerAndLocal(serverExercises);
                await this.storage.replaceExercises(this.cache);
                this.notifyCache();
            }
            didSync = true;
        }
        catch (error) {
            this.markOfflineIfNeeded(error);
            console.warn('Failed to hydrate exercises', error);
        }
        finally {
            this.finishSync(didSync);
        }
    }
    mergeServerAndLocal(serverExercises) {
        const mergedMap = new Map();
        const addOrUpdate = (exercise) => {
            mergedMap.set(this.getExerciseKey(exercise), structuredClone(exercise));
        };
        const seed = this.cache.length > 0 ? this.cache : INITIAL_EXERCISES;
        seed.forEach(ex => addOrUpdate(ex));
        serverExercises.forEach(serverEx => {
            const key = this.getExerciseKey(serverEx);
            if (serverEx.deletedAt) {
                mergedMap.delete(key);
                return;
            }
            if (mergedMap.has(key)) {
                const resolved = this.resolveConflict(mergedMap.get(key), serverEx);
                mergedMap.set(key, resolved);
            }
            else {
                mergedMap.set(key, serverEx);
            }
        });
        return Array.from(mergedMap.values());
    }
    resolveConflict(localExercise, serverExercise) {
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
            thanksCount: Math.max(localExercise.thanksCount, serverExercise.thanksCount ?? 0),
            serverId: serverExercise.serverId || localExercise.serverId,
            updatedAt: preferred.updatedAt || secondary.updatedAt,
            createdAt: preferred.createdAt || secondary.createdAt
        };
    }
    upsertExercise(exercise) {
        const key = this.getExerciseKey(exercise);
        const exists = this.cache.some(ex => this.getExerciseKey(ex) === key);
        if (exists) {
            this.cache = this.cache.map(ex => this.getExerciseKey(ex) === key ? { ...ex, ...exercise } : ex);
        }
        else {
            this.cache = [...this.cache, exercise];
        }
        this.notifyCache();
    }
    async applyServerExercise(serverExercise) {
        const key = this.getExerciseKey(serverExercise);
        if (serverExercise.deletedAt) {
            await this.removeExercise(key);
            return;
        }
        let matched = false;
        let updated = null;
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
    async removeExercise(serverKey) {
        const originalLength = this.cache.length;
        this.cache = this.cache.filter(ex => this.getExerciseKey(ex) !== serverKey && ex.serverId !== serverKey);
        if (this.cache.length !== originalLength) {
            await this.storage.replaceExercises(this.cache);
            this.notifyCache();
        }
    }
    getExerciseKey(exercise) {
        return exercise.serverId || exercise.id;
    }
    notifyCache() {
        const snapshot = this.getCachedExercises();
        this.listeners.forEach(listener => listener(snapshot));
    }
    notifyStatus() {
        const snapshot = this.getStatus();
        this.statusListeners.forEach(listener => listener(snapshot));
    }
    updateStatus(patch) {
        this.status = { ...this.status, ...patch };
        this.notifyStatus();
    }
    startSync() {
        this.activeSyncs += 1;
        if (this.activeSyncs === 1) {
            this.updateStatus({ isSyncing: true });
        }
    }
    finishSync(didSync) {
        this.activeSyncs = Math.max(0, this.activeSyncs - 1);
        const patch = {};
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
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    markOnline() {
        if (!this.status.isOnline) {
            this.updateStatus({ isOnline: true });
        }
    }
    markOfflineIfNeeded(error) {
        if (error instanceof ApiError) {
            if (typeof error.status === 'number' && (error.status === 0 || error.status >= 500)) {
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
}
export const syncService = new SyncService();
