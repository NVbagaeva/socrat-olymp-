/**
 * Файлы фото пробного кабинета: IndexedDB этого браузера (на сервере —
 * бакет). В проверках — память.
 */

export interface BlobStore {
  put(id: string, blob: Blob): Promise<void>;
  get(id: string): Promise<Blob | null>;
  del(id: string): Promise<void>;
}

export function memoryBlobs(): BlobStore {
  const m = new Map<string, Blob>();
  return {
    put: (id, b) => {
      m.set(id, b);
      return Promise.resolve();
    },
    get: (id) => Promise.resolve(m.get(id) ?? null),
    del: (id) => {
      m.delete(id);
      return Promise.resolve();
    },
  };
}

const DB = 'budetege-raboty';
const STORE = 'foto';

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('indexedDB'));
  });
}

function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const req = fn(db.transaction(STORE, mode).objectStore(STORE));
        req.onsuccess = () => resolve(req.result as T);
        req.onerror = () => reject(req.error ?? new Error('indexedDB'));
      }),
  );
}

export function idbBlobs(): BlobStore {
  return {
    put: (id, b) => run<void>('readwrite', (s) => s.put(b, id)).then(() => undefined),
    get: (id) => run<Blob | undefined>('readonly', (s) => s.get(id)).then((b) => b ?? null),
    del: (id) => run<void>('readwrite', (s) => s.delete(id)).then(() => undefined),
  };
}
