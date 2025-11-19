/*
 * Lightweight Dexie-compatible shim backed by IndexedDB when available and
 * falling back to an in-memory Map during SSR/tests. It only implements the
 * subset of the Dexie API that this project relies on (version().stores(),
 * open(), isOpen(), and simple table helpers like bulkPut, bulkAdd, clear,
 * toArray, count, get, put, and delete).
 */

export type DexieTableSchema = Record<string, string>;

interface ParsedStoreDefinition {
  keyPath?: string;
}

interface DexieBackend {
  bulkPut<T>(table: string, items: T[]): Promise<void>;
  bulkAdd<T>(table: string, items: T[]): Promise<void>;
  clear(table: string): Promise<void>;
  toArray<T>(table: string): Promise<T[]>;
  count(table: string): Promise<number>;
  get<T>(table: string, key: IDBValidKey): Promise<T | undefined>;
  put<T>(table: string, value: T): Promise<void>;
  delete(table: string, key: IDBValidKey): Promise<void>;
}

const parseStoreDefinition = (definition: string): ParsedStoreDefinition => {
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

const requestToPromise = <T>(request: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
  });

class IndexedDbBackend implements DexieBackend {
  private dbPromise: Promise<IDBDatabase>;

  constructor(
    private readonly name: string,
    private readonly version: number,
    private readonly schema: Record<string, ParsedStoreDefinition>
  ) {
    this.dbPromise = this.openDb();
  }

  private openDb(): Promise<IDBDatabase> {
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

  private async withStore<T>(
    table: string,
    mode: IDBTransactionMode,
    handler: (store: IDBObjectStore) => Promise<T>
  ): Promise<T> {
    const db = await this.dbPromise;
    return new Promise<T>((resolve, reject) => {
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

  async bulkPut<T>(table: string, items: T[]): Promise<void> {
    if (!items.length) return;
    await this.withStore(table, 'readwrite', async store => {
      for (const item of items) {
        await requestToPromise(store.put(item as unknown as never));
      }
    });
  }

  async bulkAdd<T>(table: string, items: T[]): Promise<void> {
    if (!items.length) return;
    await this.withStore(table, 'readwrite', async store => {
      for (const item of items) {
        await requestToPromise(store.add(item as unknown as never));
      }
    });
  }

  async clear(table: string): Promise<void> {
    await this.withStore(table, 'readwrite', store => requestToPromise(store.clear()));
  }

  async toArray<T>(table: string): Promise<T[]> {
    return this.withStore(table, 'readonly', store => requestToPromise(store.getAll())) as Promise<T[]>;
  }

  async count(table: string): Promise<number> {
    return this.withStore(table, 'readonly', store => requestToPromise(store.count()));
  }

  async get<T>(table: string, key: IDBValidKey): Promise<T | undefined> {
    const result = await this.withStore(table, 'readonly', store => requestToPromise(store.get(key)));
    return (result ?? undefined) as T | undefined;
  }

  async put<T>(table: string, value: T): Promise<void> {
    await this.withStore(table, 'readwrite', store => requestToPromise(store.put(value as unknown as never)));
  }

  async delete(table: string, key: IDBValidKey): Promise<void> {
    await this.withStore(table, 'readwrite', store => requestToPromise(store.delete(key)));
  }
}

class MemoryBackend implements DexieBackend {
  private tables = new Map<string, Map<IDBValidKey, unknown>>();

  constructor(private readonly schema: Record<string, ParsedStoreDefinition>) {
    Object.keys(schema).forEach(table => {
      this.tables.set(table, new Map());
    });
  }

  private getTable(table: string): Map<IDBValidKey, unknown> {
    if (!this.tables.has(table)) {
      this.tables.set(table, new Map());
    }
    return this.tables.get(table)!;
  }

  private getKey(table: string, value: unknown): IDBValidKey {
    const config = this.schema[table];
    if (config?.keyPath && typeof value === 'object' && value !== null) {
      const key = (value as Record<string, IDBValidKey>)[config.keyPath];
      if (key === undefined) {
        throw new Error(`Value is missing primary key "${config.keyPath}" for table ${table}`);
      }
      return key;
    }

    if (typeof value === 'object' && value !== null && 'id' in value) {
      return (value as Record<string, IDBValidKey>).id;
    }

    throw new Error(`Cannot infer key for table ${table}`);
  }

  async bulkPut<T>(table: string, items: T[]): Promise<void> {
    const store = this.getTable(table);
    items.forEach(item => {
      const key = this.getKey(table, item);
      store.set(key, structuredClone(item));
    });
  }

  async bulkAdd<T>(table: string, items: T[]): Promise<void> {
    await this.bulkPut(table, items);
  }

  async clear(table: string): Promise<void> {
    this.getTable(table).clear();
  }

  async toArray<T>(table: string): Promise<T[]> {
    return Array.from(this.getTable(table).values()) as T[];
  }

  async count(table: string): Promise<number> {
    return this.getTable(table).size;
  }

  async get<T>(table: string, key: IDBValidKey): Promise<T | undefined> {
    return this.getTable(table).get(key) as T | undefined;
  }

  async put<T>(table: string, value: T): Promise<void> {
    const key = this.getKey(table, value);
    this.getTable(table).set(key, structuredClone(value));
  }

  async delete(table: string, key: IDBValidKey): Promise<void> {
    this.getTable(table).delete(key);
  }
}

const createBackend = async (
  name: string,
  version: number,
  schema: Record<string, ParsedStoreDefinition>
): Promise<DexieBackend> => {
  if (typeof indexedDB === 'undefined') {
    return new MemoryBackend(schema);
  }
  return new IndexedDbBackend(name, version, schema);
};

class DexieTable<T> {
  constructor(private readonly backendFactory: () => Promise<DexieBackend>, private readonly table: string) {}

  private async backend(): Promise<DexieBackend> {
    return this.backendFactory();
  }

  bulkPut(items: T[]): Promise<void> {
    return this.backend().then(backend => backend.bulkPut(this.table, items));
  }

  bulkAdd(items: T[]): Promise<void> {
    return this.backend().then(backend => backend.bulkAdd(this.table, items));
  }

  clear(): Promise<void> {
    return this.backend().then(backend => backend.clear(this.table));
  }

  toArray(): Promise<T[]> {
    return this.backend().then(backend => backend.toArray<T>(this.table));
  }

  count(): Promise<number> {
    return this.backend().then(backend => backend.count(this.table));
  }

  get(key: IDBValidKey): Promise<T | undefined> {
    return this.backend().then(backend => backend.get<T>(this.table, key));
  }

  put(value: T): Promise<void> {
    return this.backend().then(backend => backend.put(this.table, value));
  }

  delete(key: IDBValidKey): Promise<void> {
    return this.backend().then(backend => backend.delete(this.table, key));
  }
}

export default class Dexie {
  private versionNumber = 1;
  private schema: Record<string, ParsedStoreDefinition> = {};
  private backendPromise: Promise<DexieBackend> | null = null;

  constructor(private readonly name: string) {}

  version(versionNumber: number) {
    this.versionNumber = versionNumber;
    return {
      stores: (schema: DexieTableSchema) => {
        this.schema = Object.entries(schema).reduce<Record<string, ParsedStoreDefinition>>(
          (acc, [table, definition]) => {
            acc[table] = parseStoreDefinition(definition);
            return acc;
          },
          {}
        );
        return this;
      }
    };
  }

  private ensureBackend(): Promise<DexieBackend> {
    if (!this.backendPromise) {
      if (Object.keys(this.schema).length === 0) {
        throw new Error('Dexie schema is empty. Call version().stores() before opening the database.');
      }
      this.backendPromise = createBackend(this.name, this.versionNumber, this.schema);
    }
    return this.backendPromise;
  }

  open(): Promise<void> {
    return this.ensureBackend().then(() => undefined);
  }

  isOpen(): boolean {
    return this.backendPromise !== null;
  }

  table<T>(name: string): DexieTable<T> {
    return new DexieTable<T>(() => this.ensureBackend(), name);
  }

  close(): void {
    this.backendPromise = null;
  }
}
