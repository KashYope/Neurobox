/*
 * Lightweight Dexie-compatible shim backed by IndexedDB when available and
 * falling back to an in-memory Map during SSR/tests. It only implements the
 * subset of the Dexie API that this project relies on (version().stores(),
 * open(), isOpen(), and simple table helpers like bulkPut, bulkAdd, clear,
 * toArray, count, get, put, and delete).
 */
const parseStoreDefinition = (definition) => {
    const tokens = definition
        .split(',')
        .map(token => token.trim())
        .filter(Boolean);
    if (tokens.length === 0) {
        return {};
    }
    const primary = tokens[0];
    if (primary.startsWith('&')) {
        return { keyPath: primary.replace(/^&/, '') };
    }
    return {};
};
const requestToPromise = (request) => new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
});
class IndexedDbBackend {
    constructor(name, version, schema) {
        this.name = name;
        this.version = version;
        this.schema = schema;
        this.dbPromise = this.openDb();
    }
    openDb() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.name, this.version);
            request.onupgradeneeded = () => {
                const db = request.result;
                Object.entries(this.schema).forEach(([table, config]) => {
                    if (!db.objectStoreNames.contains(table)) {
                        db.createObjectStore(table, config.keyPath ? { keyPath: config.keyPath } : undefined);
                    }
                });
            };
            request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB database'));
            request.onsuccess = () => resolve(request.result);
        });
    }
    async withStore(table, mode, handler) {
        const db = await this.dbPromise;
        return new Promise((resolve, reject) => {
            const tx = db.transaction(table, mode);
            const store = tx.objectStore(table);
            Promise.resolve(handler(store))
                .then(result => {
                tx.oncomplete = () => resolve(result);
                tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'));
                tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
            })
                .catch(error => {
                tx.abort();
                reject(error);
            });
        });
    }
    async bulkPut(table, items) {
        if (!items.length)
            return;
        await this.withStore(table, 'readwrite', async (store) => {
            for (const item of items) {
                await requestToPromise(store.put(item));
            }
        });
    }
    async bulkAdd(table, items) {
        if (!items.length)
            return;
        await this.withStore(table, 'readwrite', async (store) => {
            for (const item of items) {
                await requestToPromise(store.add(item));
            }
        });
    }
    async clear(table) {
        await this.withStore(table, 'readwrite', store => requestToPromise(store.clear()));
    }
    async toArray(table) {
        return this.withStore(table, 'readonly', store => requestToPromise(store.getAll()));
    }
    async count(table) {
        return this.withStore(table, 'readonly', store => requestToPromise(store.count()));
    }
    async get(table, key) {
        const result = await this.withStore(table, 'readonly', store => requestToPromise(store.get(key)));
        return (result ?? undefined);
    }
    async put(table, value) {
        await this.withStore(table, 'readwrite', store => requestToPromise(store.put(value)));
    }
    async delete(table, key) {
        await this.withStore(table, 'readwrite', store => requestToPromise(store.delete(key)));
    }
}
class MemoryBackend {
    constructor(schema) {
        this.schema = schema;
        this.tables = new Map();
        Object.keys(schema).forEach(table => {
            this.tables.set(table, new Map());
        });
    }
    getTable(table) {
        if (!this.tables.has(table)) {
            this.tables.set(table, new Map());
        }
        return this.tables.get(table);
    }
    getKey(table, value) {
        const config = this.schema[table];
        if (config?.keyPath && typeof value === 'object' && value !== null) {
            const key = value[config.keyPath];
            if (key === undefined) {
                throw new Error(`Value is missing primary key "${config.keyPath}" for table ${table}`);
            }
            return key;
        }
        if (typeof value === 'object' && value !== null && 'id' in value) {
            return value.id;
        }
        throw new Error(`Cannot infer key for table ${table}`);
    }
    async bulkPut(table, items) {
        const store = this.getTable(table);
        items.forEach(item => {
            const key = this.getKey(table, item);
            store.set(key, structuredClone(item));
        });
    }
    async bulkAdd(table, items) {
        await this.bulkPut(table, items);
    }
    async clear(table) {
        this.getTable(table).clear();
    }
    async toArray(table) {
        return Array.from(this.getTable(table).values());
    }
    async count(table) {
        return this.getTable(table).size;
    }
    async get(table, key) {
        return this.getTable(table).get(key);
    }
    async put(table, value) {
        const key = this.getKey(table, value);
        this.getTable(table).set(key, structuredClone(value));
    }
    async delete(table, key) {
        this.getTable(table).delete(key);
    }
}
const createBackend = async (name, version, schema) => {
    if (typeof indexedDB === 'undefined') {
        return new MemoryBackend(schema);
    }
    return new IndexedDbBackend(name, version, schema);
};
class DexieTable {
    constructor(backendFactory, table) {
        this.backendFactory = backendFactory;
        this.table = table;
    }
    async backend() {
        return this.backendFactory();
    }
    bulkPut(items) {
        return this.backend().then(backend => backend.bulkPut(this.table, items));
    }
    bulkAdd(items) {
        return this.backend().then(backend => backend.bulkAdd(this.table, items));
    }
    clear() {
        return this.backend().then(backend => backend.clear(this.table));
    }
    toArray() {
        return this.backend().then(backend => backend.toArray(this.table));
    }
    count() {
        return this.backend().then(backend => backend.count(this.table));
    }
    get(key) {
        return this.backend().then(backend => backend.get(this.table, key));
    }
    put(value) {
        return this.backend().then(backend => backend.put(this.table, value));
    }
    delete(key) {
        return this.backend().then(backend => backend.delete(this.table, key));
    }
}
export default class Dexie {
    constructor(name) {
        this.name = name;
        this.versionNumber = 1;
        this.schema = {};
        this.backendPromise = null;
    }
    version(versionNumber) {
        this.versionNumber = versionNumber;
        return {
            stores: (schema) => {
                this.schema = Object.entries(schema).reduce((acc, [table, definition]) => {
                    acc[table] = parseStoreDefinition(definition);
                    return acc;
                }, {});
                return this;
            }
        };
    }
    ensureBackend() {
        if (!this.backendPromise) {
            if (Object.keys(this.schema).length === 0) {
                throw new Error('Dexie schema is empty. Call version().stores() before opening the database.');
            }
            this.backendPromise = createBackend(this.name, this.versionNumber, this.schema);
        }
        return this.backendPromise;
    }
    open() {
        return this.ensureBackend().then(() => undefined);
    }
    isOpen() {
        return this.backendPromise !== null;
    }
    table(name) {
        return new DexieTable(() => this.ensureBackend(), name);
    }
    close() {
        this.backendPromise = null;
    }
}
