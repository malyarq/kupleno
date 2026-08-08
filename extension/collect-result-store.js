(function exposeCollectResultStore(root, factory) {
  const exported = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = exported;
  if (root) root.KuplenoCollectResultStore = exported;
})(typeof globalThis !== 'undefined' ? globalThis : this, (root) => {
  'use strict';

  const DB_NAME = 'kupleno-collect-results-v1';
  const DB_VERSION = 1;
  const STORE_NAME = 'results';
  const DEFAULT_TTL_MS = 72 * 60 * 60 * 1000;

  function jobId(jobIdValue) {
    const id = String(jobIdValue || '').trim();
    if (!id || id.length > 200 || !/^[a-z0-9-]+$/i.test(id)) {
      throw new TypeError('Некорректный идентификатор задачи сбора.');
    }
    return id;
  }

  function databaseError(action, error) {
    return new Error(`${action}${error?.message ? `: ${error.message}` : ''}`);
  }

  function requestResult(request, action) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(databaseError(action, request.error));
    });
  }

  function transactionDone(transaction, action) {
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(databaseError(action, transaction.error));
      transaction.onabort = () => reject(databaseError(action, transaction.error));
    });
  }

  function openDatabase(indexedDb, dbName) {
    if (!indexedDb || typeof indexedDb.open !== 'function') {
      throw new Error('IndexedDB недоступен для сохранения результата сбора.');
    }
    return new Promise((resolve, reject) => {
      let request;
      try {
        request = indexedDb.open(dbName, DB_VERSION);
      } catch (error) {
        reject(databaseError('Не удалось открыть хранилище результата сбора', error));
        return;
      }
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE_NAME)) {
          request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => {
        const database = request.result;
        database.onversionchange = () => database.close();
        resolve(database);
      };
      request.onerror = () => reject(databaseError('Не удалось открыть хранилище результата сбора', request.error));
      request.onblocked = () => reject(new Error('Хранилище результата сбора заблокировано другой вкладкой.'));
    });
  }

  function createIndexedDbAdapter(options = {}) {
    const dbName = options.dbName || DB_NAME;
    const hasOverride = Object.prototype.hasOwnProperty.call(options, 'indexedDB');
    const currentIndexedDb = () => (hasOverride ? options.indexedDB : root?.indexedDB);

    async function useDatabase(action, work) {
      const database = await openDatabase(currentIndexedDb(), dbName);
      try {
        return await work(database);
      } finally {
        database.close();
      }
    }

    return Object.freeze({
      put: (record) => useDatabase('save', async (database) => {
        const transaction = database.transaction(STORE_NAME, 'readwrite');
        const done = transactionDone(transaction, 'Не удалось сохранить результат сбора');
        transaction.objectStore(STORE_NAME).put(record);
        await done;
      }),
      get: (id) => useDatabase('load', async (database) => {
        const transaction = database.transaction(STORE_NAME, 'readonly');
        const done = transactionDone(transaction, 'Не удалось прочитать результат сбора');
        const record = await requestResult(transaction.objectStore(STORE_NAME).get(id), 'Не удалось прочитать результат сбора');
        await done;
        return record;
      }),
      remove: (id) => useDatabase('remove', async (database) => {
        const transaction = database.transaction(STORE_NAME, 'readwrite');
        const done = transactionDone(transaction, 'Не удалось удалить результат сбора');
        transaction.objectStore(STORE_NAME).delete(id);
        await done;
      }),
      clear: () => useDatabase('clear', async (database) => {
        const transaction = database.transaction(STORE_NAME, 'readwrite');
        const done = transactionDone(transaction, 'Не удалось очистить результаты сбора');
        transaction.objectStore(STORE_NAME).clear();
        await done;
      }),
      list: () => useDatabase('list', async (database) => {
        const transaction = database.transaction(STORE_NAME, 'readonly');
        const done = transactionDone(transaction, 'Не удалось прочитать результаты сбора');
        const records = await requestResult(transaction.objectStore(STORE_NAME).getAll(), 'Не удалось прочитать результаты сбора');
        await done;
        return records;
      })
    });
  }

  function createCollectResultStore(options = {}) {
    const adapter = options.adapter || createIndexedDbAdapter(options);
    const now = typeof options.now === 'function' ? options.now : () => new Date();
    if (!adapter || typeof adapter.put !== 'function' || typeof adapter.get !== 'function'
      || typeof adapter.remove !== 'function' || typeof adapter.clear !== 'function' || typeof adapter.list !== 'function') {
      throw new TypeError('adapter: ожидается адаптер IndexedDB для результатов сбора.');
    }

    async function save(id, result) {
      const record = { id: jobId(id), result, updatedAt: new Date(now()).toISOString() };
      if (!Number.isFinite(new Date(record.updatedAt).getTime())) throw new TypeError('now: некорректная дата.');
      await adapter.put(record);
    }

    async function load(id) {
      const record = await adapter.get(jobId(id));
      if (!record || record.id !== jobId(id) || !record.result || typeof record.result !== 'object') return null;
      return record.result;
    }

    async function remove(id) {
      await adapter.remove(jobId(id));
    }

    async function clear() {
      await adapter.clear();
    }

    async function cleanup(ttlMs = DEFAULT_TTL_MS) {
      const ttl = Number(ttlMs);
      if (!Number.isFinite(ttl) || ttl < 0) throw new TypeError('ttlMs: ожидается неотрицательное число.');
      const currentTime = new Date(now()).getTime();
      if (!Number.isFinite(currentTime)) throw new TypeError('now: некорректная дата.');
      const records = await adapter.list();
      const expiredIds = records
        .filter((record) => {
          const updatedAt = new Date(record?.updatedAt).getTime();
          const age = currentTime - updatedAt;
          return !Number.isFinite(updatedAt) || age < 0 || age > ttl;
        })
        .map((record) => record?.id)
        .filter((id) => typeof id === 'string');
      await Promise.all(expiredIds.map((id) => adapter.remove(id)));
      return expiredIds;
    }

    return Object.freeze({ save, load, remove, clear, cleanup });
  }

  return Object.freeze({ DB_NAME, DB_VERSION, STORE_NAME, DEFAULT_TTL_MS, createIndexedDbAdapter, createCollectResultStore });
});
