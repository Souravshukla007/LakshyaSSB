/**
 * Feature: offline-support
 *
 * Minimal, dependency-free promise wrapper over IndexedDB for the
 * Local_Draft_Store (Requirement 6.1; Design §5 and Data Models →
 * Local_Draft_Store schema).
 *
 * Database:      `lssb-offline` (version 1)
 * Object store:  `drafts` (keyPath `id`)
 * Index:         `status` (non-unique)
 *
 * This module is framework-free and standards-based (Requirement 11.1): it
 * uses only the global `indexedDB` and contains no Capacitor / native imports.
 * It runs in the browser and in the Android System WebView, and is compatible
 * with the `fake-indexeddb` polyfill used by tests (which installs a global
 * `indexedDB`).
 *
 * Quota handling: write operations reject with the underlying error object, so
 * a `QuotaExceededError` propagates unchanged to callers (e.g. draftStore) that
 * need to catch it (Requirement 6.7).
 */

export const DB_NAME = 'lssb-offline';
export const DB_VERSION = 1;
export const STORE_NAME = 'drafts';
export const STATUS_INDEX = 'status';

/** Any record stored in `drafts` must carry a string `id` (the keyPath). */
export interface WithId {
  id: string;
}

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Reject with a clear, actionable error when IndexedDB is unavailable in the
 * current environment (e.g. SSR, or a test runner without the polyfill).
 */
function indexedDbUnavailable(): Error {
  return new Error(
    'IndexedDB is not available in this environment (global `indexedDB` is undefined).'
  );
}

/**
 * Lazily open the `lssb-offline` database once and reuse the connection.
 * Creates the `drafts` object store and its `status` index on first upgrade.
 */
export function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(indexedDbUnavailable());
  }

  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    let request: IDBOpenDBRequest;
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch (err) {
      reject(err);
      return;
    }

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex(STATUS_INDEX, STATUS_INDEX, { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () =>
      reject(new Error('Opening the offline database was blocked by another connection.'));
  });

  // If opening fails, clear the cached promise so a later call can retry.
  dbPromise.catch(() => {
    dbPromise = null;
  });

  return dbPromise;
}

/**
 * Run a transaction against the `drafts` store and resolve with the result of
 * `body`. Rejects on request error or transaction error/abort. For writes, the
 * transaction is awaited to completion so quota errors surface reliably.
 */
async function withStore<R>(
  mode: IDBTransactionMode,
  body: (store: IDBObjectStore) => IDBRequest<R> | { request: IDBRequest; result: () => R }
): Promise<R> {
  const db = await openDb();

  return new Promise<R>((resolve, reject) => {
    let tx: IDBTransaction;
    try {
      tx = db.transaction(STORE_NAME, mode);
    } catch (err) {
      reject(err);
      return;
    }

    const store = tx.objectStore(STORE_NAME);
    let settled = false;
    let outcome: R;

    const outer = body(store);
    const request = 'request' in outer ? outer.request : outer;
    const getResult = 'request' in outer ? outer.result : () => (outer as IDBRequest<R>).result;

    request.onsuccess = () => {
      outcome = getResult();
    };
    request.onerror = () => {
      if (!settled) {
        settled = true;
        reject(request.error);
      }
    };

    tx.oncomplete = () => {
      if (!settled) {
        settled = true;
        resolve(outcome);
      }
    };
    tx.onerror = () => {
      if (!settled) {
        settled = true;
        reject(tx.error);
      }
    };
    tx.onabort = () => {
      if (!settled) {
        settled = true;
        reject(tx.error ?? new Error('IndexedDB transaction aborted.'));
      }
    };
  });
}

/** Retrieve a single record by its `id`, or `undefined` when absent. */
export function get<T>(id: string): Promise<T | undefined> {
  return withStore<T | undefined>('readonly', (store) => store.get(id) as IDBRequest<T | undefined>);
}

/** Insert or overwrite a record (keyed by its `id`). Propagates QuotaExceededError. */
export function put<T extends WithId>(value: T): Promise<void> {
  return withStore<void>('readwrite', (store) => {
    const request = store.put(value);
    return { request, result: () => undefined };
  });
}

/** Delete a record by its `id`. */
export function del(id: string): Promise<void> {
  return withStore<void>('readwrite', (store) => {
    const request = store.delete(id);
    return { request, result: () => undefined };
  });
}

/** Retrieve all records in the `drafts` store. */
export function getAll<T>(): Promise<T[]> {
  return withStore<T[]>('readonly', (store) => store.getAll() as IDBRequest<T[]>);
}

/** Retrieve all records matching `key` on the given index (e.g. `status`). */
export function getAllByIndex<T>(indexName: string, key: IDBValidKey): Promise<T[]> {
  return withStore<T[]>('readonly', (store) => {
    const index = store.index(indexName);
    return index.getAll(key) as IDBRequest<T[]>;
  });
}

/**
 * Close and forget the cached connection. Primarily useful for tests that reset
 * the `fake-indexeddb` global between cases.
 */
export async function closeDb(): Promise<void> {
  if (!dbPromise) return;
  try {
    const db = await dbPromise;
    db.close();
  } catch {
    // ignore — opening never succeeded
  } finally {
    dbPromise = null;
  }
}
