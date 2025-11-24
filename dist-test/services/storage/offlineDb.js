import Dexie from './dexieShim';
import { INITIAL_EXERCISES } from '../../constants';
const LEGACY_KEYS = {
    EXERCISES: 'neurosooth_exercises_cache_v2',
    MUTATIONS: 'neurosooth_pending_mutations_v1',
    USER: 'neurosooth_user'
};
class OfflineDexieDB extends Dexie {
    constructor() {
        super('neurobox_offline');
        this.version(1).stores({
            exercises: '&id, serverId, updatedAt',
            users: '&id',
            pendingMutations: '&id, createdAt',
            attachments: '&key, updatedAt'
        });
        // Add translations table in version 2
        this.version(2).stores({
            exercises: '&id, serverId, updatedAt',
            users: '&id',
            pendingMutations: '&id, createdAt',
            attachments: '&key, updatedAt',
            translations: '&key, targetLang, createdAt'
        });
        // Add exercise string translations in version 3
        this.version(3).stores({
            exercises: '&id, serverId, updatedAt',
            users: '&id',
            pendingMutations: '&id, createdAt',
            attachments: '&key, updatedAt',
            translations: '&key, targetLang, createdAt',
            exerciseStrings: '&id, context, updatedAt',
            exerciseStringTranslations: '[stringId+lang], stringId, lang'
        });
        this.exercises = this.table('exercises');
        this.users = this.table('users');
        this.pendingMutations = this.table('pendingMutations');
        this.attachments = this.table('attachments');
        this.translations = this.table('translations');
        this.exerciseStrings = this.table('exerciseStrings');
        this.exerciseStringTranslations = this.table('exerciseStringTranslations');
    }
}
class DexieStorageAdapter {
    constructor() {
        this.db = new OfflineDexieDB();
        this.openPromise = this.db.open();
    }
    async init() {
        await this.openPromise;
    }
    async ensureOpen() {
        if (!this.db.isOpen()) {
            await this.db.open();
        }
    }
    async getExercises() {
        await this.ensureOpen();
        return this.db.exercises.toArray();
    }
    async bulkUpsertExercises(exercises) {
        if (!exercises.length)
            return;
        await this.ensureOpen();
        await this.db.exercises.bulkPut(exercises);
    }
    async replaceExercises(exercises) {
        await this.ensureOpen();
        await this.db.exercises.clear();
        if (exercises.length) {
            await this.db.exercises.bulkAdd(exercises);
        }
    }
    async countExercises() {
        await this.ensureOpen();
        return this.db.exercises.count();
    }
    async getPendingMutations() {
        await this.ensureOpen();
        return this.db.pendingMutations.toArray();
    }
    async setPendingMutations(mutations) {
        await this.ensureOpen();
        await this.db.pendingMutations.clear();
        if (mutations.length) {
            await this.db.pendingMutations.bulkAdd(mutations);
        }
    }
    async getUser() {
        await this.ensureOpen();
        const record = await this.db.users.get('current');
        return record?.profile ?? null;
    }
    async saveUser(user) {
        await this.ensureOpen();
        if (!user) {
            await this.db.users.delete('current');
            return;
        }
        await this.db.users.put({ id: 'current', profile: user });
    }
    async saveAttachment(record) {
        await this.ensureOpen();
        await this.db.attachments.put(record);
    }
    async getAttachment(key) {
        await this.ensureOpen();
        return this.db.attachments.get(key);
    }
    async deleteAttachment(key) {
        await this.ensureOpen();
        await this.db.attachments.delete(key);
    }
    async saveTranslation(record) {
        await this.ensureOpen();
        await this.db.translations.put(record);
    }
    async getTranslation(key) {
        await this.ensureOpen();
        return this.db.translations.get(key);
    }
    async getExerciseStrings() {
        await this.ensureOpen();
        return this.db.exerciseStrings.toArray();
    }
    async bulkUpsertExerciseStrings(strings) {
        if (!strings.length)
            return;
        await this.ensureOpen();
        await this.db.exerciseStrings.bulkPut(strings);
    }
    async getExerciseStringTranslations(lang) {
        await this.ensureOpen();
        const all = await this.db.exerciseStringTranslations.toArray();
        return all.filter(t => t.lang === lang);
    }
    async bulkUpsertExerciseStringTranslations(translations) {
        if (!translations.length)
            return;
        await this.ensureOpen();
        await this.db.exerciseStringTranslations.bulkPut(translations);
    }
    async getTranslationForString(stringId, lang) {
        await this.ensureOpen();
        const all = await this.db.exerciseStringTranslations.toArray();
        return all.find(t => t.stringId === stringId && t.lang === lang);
    }
}
const cloneExercise = (exercise) => {
    const now = new Date().toISOString();
    return {
        ...structuredClone(exercise),
        createdAt: exercise.createdAt ?? now,
        updatedAt: exercise.updatedAt ?? now
    };
};
const getLegacyData = (key) => {
    if (typeof localStorage === 'undefined')
        return null;
    try {
        const raw = localStorage.getItem(key);
        if (!raw)
            return null;
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
};
const removeLegacyKey = (key) => {
    if (typeof localStorage === 'undefined')
        return;
    localStorage.removeItem(key);
};
const migrateLegacyStorage = async (adapter) => {
    if (typeof localStorage === 'undefined')
        return;
    const legacyExercises = getLegacyData(LEGACY_KEYS.EXERCISES);
    if (legacyExercises && legacyExercises.length) {
        await adapter.replaceExercises(legacyExercises.map(cloneExercise));
        removeLegacyKey(LEGACY_KEYS.EXERCISES);
    }
    const legacyMutations = getLegacyData(LEGACY_KEYS.MUTATIONS);
    if (legacyMutations) {
        await adapter.setPendingMutations(legacyMutations);
        removeLegacyKey(LEGACY_KEYS.MUTATIONS);
    }
    const legacyUser = getLegacyData(LEGACY_KEYS.USER);
    if (legacyUser) {
        await adapter.saveUser(legacyUser);
        removeLegacyKey(LEGACY_KEYS.USER);
    }
};
const ensureSeedData = async (adapter) => {
    const count = await adapter.countExercises();
    if (count === 0) {
        await adapter.bulkUpsertExercises(INITIAL_EXERCISES.map(cloneExercise));
    }
};
let adapterPromise = null;
let snapshotPromise = null;
export const getStorageAdapter = async () => {
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
export const getInitialSnapshot = async () => {
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
const bufferToBase64 = (buffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    bytes.forEach(byte => {
        binary += String.fromCharCode(byte);
    });
    return typeof btoa === 'function' ? btoa(binary) : Buffer.from(binary, 'binary').toString('base64');
};
const normalizeAttachmentData = async (data) => {
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
export const saveAttachment = async (key, data, mimeType) => {
    const adapter = await getStorageAdapter();
    const record = {
        key,
        data: await normalizeAttachmentData(data),
        mimeType,
        updatedAt: new Date().toISOString()
    };
    await adapter.saveAttachment(record);
};
export const readAttachment = async (key) => {
    const adapter = await getStorageAdapter();
    return adapter.getAttachment(key);
};
export const removeAttachment = async (key) => {
    const adapter = await getStorageAdapter();
    await adapter.deleteAttachment(key);
};
export const attachmentKeyForExerciseImage = (exerciseId) => `exercise:${exerciseId}:image`;
