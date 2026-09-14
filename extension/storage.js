(function initKuplenoStorage(root, factory) {
  const storage = factory(root);

  if (typeof module === 'object' && module.exports) module.exports = storage;
  if (root) root.KuplenoStorage = storage;
})(typeof globalThis !== 'undefined' ? globalThis : this, (root) => {
  'use strict';

  // Постоянные идентификаторы Куплено. Менять только вместе с версией схемы и миграцией.
  const DB_NAME = 'kupleno-storage-v1';
  const DB_VERSION = 1;
  const SNAPSHOT_VERSION = 1;
  const BACKUP_FORMAT = 'kupleno-backup';
  const BACKUP_VERSION = 1;
  const HISTORY_LIMIT = 12;
  const MAX_ROWS = 100000;
  const MAX_JSON_DEPTH = 20;
  const MAX_JSON_NODES = 3000000;
  const MAX_BACKUP_CHARS = 64 * 1024 * 1024;
  const MAX_BACKUP_BYTES = 64 * 1024 * 1024;

  const snapshotStoreName = 'snapshots';
  const historyStoreName = 'history';
  const metaStoreName = 'meta';
  const latestSnapshotKey = 'latestSnapshotId';
  const dataEpochKey = 'dataEpoch';
  const snapshotRevisionKey = 'snapshotRevision';
  const forbiddenKeys = new Set(['__proto__', 'prototype', 'constructor']);
  const supportedSources = new Set(['ozon', 'wildberries', 'yandex']);

  function isPlainObject(value) {
    if (!value || typeof value !== 'object') return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  }

  function own(value, key) {
    return Object.prototype.hasOwnProperty.call(value, key);
  }

  function isValidSpendDate(value) {
    const match = String(value || '').trim().match(
      /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(?:(Z)|([+-])(\d{2}):?(\d{2}))?)?$/
    );
    if (!match) return false;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (year < 1900 || month < 1 || month > 12 || day < 1) return false;
    if (day > new Date(Date.UTC(year, month, 0)).getUTCDate()) return false;
    if (match[4] === undefined) return true;
    if (Number(match[4]) > 23 || Number(match[5]) > 59 || Number(match[6] || 0) > 59) return false;
    if (match[9] !== undefined) {
      const offsetHours = Number(match[9]);
      const offsetMinutes = Number(match[10]);
      if (offsetHours > 14 || offsetMinutes > 59 || (offsetHours === 14 && offsetMinutes !== 0)) return false;
    }
    return true;
  }

  function validateJsonValue(value, path, state, depth) {
    state.nodes += 1;
    if (state.nodes > MAX_JSON_NODES) {
      throw new TypeError(`${path}: слишком много значений.`);
    }

    if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) throw new TypeError(`${path}: число должно быть конечным.`);
      return;
    }
    if (typeof value !== 'object') {
      throw new TypeError(`${path}: допускаются только JSON-совместимые значения.`);
    }
    if (depth >= MAX_JSON_DEPTH) throw new TypeError(`${path}: превышена допустимая глубина.`);
    if (state.ancestors.has(value)) throw new TypeError(`${path}: циклическая ссылка недопустима.`);
    if (Object.getOwnPropertySymbols(value).length) {
      throw new TypeError(`${path}: символьные поля недопустимы.`);
    }
    if (!Array.isArray(value) && !isPlainObject(value)) {
      throw new TypeError(`${path}: ожидается обычный объект или массив.`);
    }

    state.ancestors.add(value);
    const keys = Array.isArray(value) ? [...value.keys()].map(String) : Object.keys(value);
    for (const key of keys) {
      if (forbiddenKeys.has(key)) throw new TypeError(`${path}.${key}: небезопасное имя поля.`);
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !own(descriptor, 'value')) {
        throw new TypeError(`${path}.${key}: вычисляемые поля недопустимы.`);
      }
      validateJsonValue(descriptor.value, `${path}.${key}`, state, depth + 1);
    }
    state.ancestors.delete(value);
  }

  function validateRows(rows) {
    if (!Array.isArray(rows)) throw new TypeError('rows: ожидается массив строк отчёта.');
    if (rows.length > MAX_ROWS) throw new TypeError(`rows: допускается не более ${MAX_ROWS} строк.`);

    const state = { ancestors: new WeakSet(), nodes: 0 };
    rows.forEach((row, index) => {
      const path = `rows[${index}]`;
      if (!isPlainObject(row)) throw new TypeError(`${path}: ожидается обычный объект.`);
      validateJsonValue(row, path, state, 0);

      for (const field of ['date', 'source', 'title', 'amount']) {
        if (!own(row, field)) throw new TypeError(`${path}.${field}: обязательное поле отсутствует.`);
      }
      if (typeof row.date !== 'string' || !isValidSpendDate(row.date)) {
        throw new TypeError(`${path}.date: ожидается существующая дата YYYY-MM-DD с допустимым временем.`);
      }
      if (typeof row.source !== 'string' || !supportedSources.has(row.source)) {
        throw new TypeError(`${path}.source: неизвестный маркетплейс.`);
      }
      if (typeof row.title !== 'string' || !row.title.trim()) {
        throw new TypeError(`${path}.title: ожидается непустая строка.`);
      }
      if ((typeof row.amount === 'string' && !row.amount.trim()) || !Number.isFinite(Number(row.amount))) {
        throw new TypeError(`${path}.amount: ожидается конечное число.`);
      }
    });
    return true;
  }

  function validateSettings(settings) {
    if (!isPlainObject(settings)) throw new TypeError('settings: ожидается обычный объект.');
    validateJsonValue(settings, 'settings', { ancestors: new WeakSet(), nodes: 0 }, 0);
    return true;
  }

  function validateMetadata(metadata) {
    if (!isPlainObject(metadata)) throw new TypeError('metadata: ожидается обычный объект.');
    validateJsonValue(metadata, 'metadata', { ancestors: new WeakSet(), nodes: 0 }, 0);
    return true;
  }

  function cloneJson(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function isoTimestamp(value, path) {
    const date = value instanceof Date ? value : new Date(value);
    if (!Number.isFinite(date.getTime())) throw new TypeError(`${path}: некорректная дата.`);
    return date.toISOString();
  }

  function validateSnapshotId(id) {
    if (typeof id !== 'string' || !id.trim() || id.length > 200) {
      throw new TypeError('id: некорректный идентификатор снимка.');
    }
    return id;
  }

  function generateSnapshotId(createdAt) {
    const uuid = root?.crypto?.randomUUID?.();
    if (uuid) return `${createdAt}-${uuid}`;
    return `${createdAt}-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
  }

  function epochValue(record) {
    const value = Number(record?.value);
    return Number.isSafeInteger(value) && value >= 0 ? value : 0;
  }

  function revisionValue(record) {
    const value = Number(record?.value);
    return Number.isSafeInteger(value) && value >= 0 ? value : 0;
  }

  function expectedEpochValue(options) {
    if (!own(options, 'expectedEpoch')) return null;
    const value = Number(options.expectedEpoch);
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new TypeError('expectedEpoch: ожидается неотрицательное целое число.');
    }
    return value;
  }

  function expectedRevisionValue(options) {
    if (!own(options, 'expectedRevision')) return null;
    const value = Number(options.expectedRevision);
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new TypeError('expectedRevision: ожидается неотрицательное целое число.');
    }
    return value;
  }

  function assertCurrentEpoch(expectedEpoch, currentEpoch) {
    if (expectedEpoch === null || expectedEpoch === currentEpoch) return;
    const error = new Error('Локальные данные уже удалены в другой вкладке. Устаревшая запись отменена.');
    error.code = 'STALE_DATA_EPOCH';
    error.currentEpoch = currentEpoch;
    throw error;
  }

  function assertCurrentRevision(expectedRevision, currentRevision) {
    if (expectedRevision === null || expectedRevision === currentRevision) return;
    const error = new Error('Последний снимок уже изменён в другой вкладке. Устаревшая запись отменена.');
    error.code = 'STALE_SNAPSHOT_REVISION';
    error.currentRevision = currentRevision;
    throw error;
  }

  function snapshotWithRevision(snapshot, revision) {
    validateSnapshot(snapshot);
    return { ...snapshot, revision };
  }

  function createSnapshot(data, options = {}) {
    if (!isPlainObject(data)) throw new TypeError('snapshot: ожидается обычный объект.');

    const rows = data.rows;
    const settings = own(data, 'settings') ? data.settings : {};
    const metadata = own(data, 'metadata') ? data.metadata : {};
    validateRows(rows);
    validateSettings(settings);
    validateMetadata(metadata);

    const createdAt = isoTimestamp(
      own(options, 'now') ? options.now : (own(data, 'createdAt') ? data.createdAt : new Date()),
      'createdAt'
    );
    const id = validateSnapshotId(
      own(options, 'id') ? options.id : (own(data, 'id') ? data.id : generateSnapshotId(createdAt))
    );

    const copied = cloneJson({ rows, settings, metadata });
    return {
      version: SNAPSHOT_VERSION,
      id,
      createdAt,
      rows: copied.rows,
      settings: copied.settings,
      metadata: copied.metadata
    };
  }

  function validateSnapshot(snapshot) {
    if (!isPlainObject(snapshot)) throw new Error('Хранилище содержит повреждённый снимок.');
    if (snapshot.version !== SNAPSHOT_VERSION) {
      throw new Error(`Версия снимка ${String(snapshot.version)} не поддерживается.`);
    }
    validateSnapshotId(snapshot.id);
    isoTimestamp(snapshot.createdAt, 'createdAt');
    validateRows(snapshot.rows);
    validateSettings(snapshot.settings);
    validateMetadata(snapshot.metadata);
    return true;
  }

  function copySnapshot(snapshot) {
    validateSnapshot(snapshot);
    return cloneJson(snapshot);
  }

  function snapshotSummary(snapshot) {
    validateSnapshot(snapshot);
    return {
      id: snapshot.id,
      createdAt: snapshot.createdAt,
      rowCount: snapshot.rows.length,
      metadata: cloneJson(snapshot.metadata)
    };
  }

  function serializeBackup(data, options = {}) {
    if (!isPlainObject(data)) throw new TypeError('backup: ожидается обычный объект.');

    const rows = data.rows;
    const settings = own(data, 'settings') ? data.settings : {};
    const metadata = own(data, 'metadata') ? data.metadata : {};
    validateRows(rows);
    validateSettings(settings);
    validateMetadata(metadata);

    const exportedAt = isoTimestamp(own(options, 'now') ? options.now : new Date(), 'exportedAt');
    const createdAt = own(data, 'createdAt') ? isoTimestamp(data.createdAt, 'createdAt') : exportedAt;
    const json = JSON.stringify({
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exportedAt,
      createdAt,
      rows: cloneJson(rows),
      settings: cloneJson(settings),
      metadata: cloneJson(metadata)
    }, null, 2);
    if (json.length > MAX_BACKUP_CHARS) throw new Error('Резервная копия слишком велика.');
    return `${json}\n`;
  }

  function parseBackup(text) {
    if (typeof text !== 'string') throw new TypeError('Резервная копия должна быть текстом JSON.');
    if (text.length > MAX_BACKUP_CHARS) throw new Error('Резервная копия слишком велика.');

    let parsed;
    try {
      parsed = JSON.parse(text.replace(/^\uFEFF/, ''));
    } catch {
      throw new Error('Не удалось прочитать резервную копию: некорректный JSON.');
    }
    if (!isPlainObject(parsed)) throw new Error('Некорректный формат резервной копии.');
    if (parsed.format !== BACKUP_FORMAT) throw new Error('Файл не является резервной копией Куплено.');
    if (parsed.version !== BACKUP_VERSION) {
      throw new Error(`Версия резервной копии ${String(parsed.version)} не поддерживается.`);
    }

    const exportedAt = isoTimestamp(parsed.exportedAt, 'exportedAt');
    const createdAt = isoTimestamp(parsed.createdAt, 'createdAt');
    const settings = own(parsed, 'settings') ? parsed.settings : null;
    const metadata = own(parsed, 'metadata') ? parsed.metadata : {};
    validateRows(parsed.rows);
    validateSettings(settings);
    validateMetadata(metadata);

    return {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exportedAt,
      createdAt,
      rows: cloneJson(parsed.rows),
      settings: cloneJson(settings),
      metadata: cloneJson(metadata)
    };
  }

  function databaseError(action, error) {
    const detail = error?.message ? `: ${error.message}` : '';
    return new Error(`${action}${detail}`);
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
      throw new Error(
        'IndexedDB недоступен в этом окружении. Откройте Куплено в установленном браузерном расширении.'
      );
    }

    return new Promise((resolve, reject) => {
      let request;
      let settled = false;
      try {
        request = indexedDb.open(dbName, DB_VERSION);
      } catch (error) {
        reject(databaseError('Не удалось открыть локальное хранилище', error));
        return;
      }

      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(snapshotStoreName)) {
          database.createObjectStore(snapshotStoreName, { keyPath: 'id' });
        }
        if (!database.objectStoreNames.contains(historyStoreName)) {
          database.createObjectStore(historyStoreName, { keyPath: 'order', autoIncrement: true });
        }
        if (!database.objectStoreNames.contains(metaStoreName)) {
          database.createObjectStore(metaStoreName, { keyPath: 'key' });
        }
      };
      request.onsuccess = () => {
        const database = request.result;
        if (settled) {
          database.close();
          return;
        }
        settled = true;
        database.onversionchange = () => database.close();
        resolve(database);
      };
      request.onerror = () => {
        if (settled) return;
        settled = true;
        reject(databaseError('Не удалось открыть локальное хранилище', request.error));
      };
      request.onblocked = () => {
        if (settled) return;
        settled = true;
        reject(new Error('Обновление локального хранилища заблокировано другой вкладкой.'));
      };
    });
  }

  function pruneHistory(historyStore, snapshotStore) {
    return new Promise((resolve, reject) => {
      let seen = 0;
      const request = historyStore.openCursor(null, 'prev');
      request.onerror = () => reject(databaseError('Не удалось ограничить историю снимков', request.error));
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) {
          resolve();
          return;
        }
        seen += 1;
        if (seen > HISTORY_LIMIT) {
          historyStore.delete(cursor.primaryKey);
          snapshotStore.delete(cursor.value.id);
        }
        cursor.continue();
      };
    });
  }

  function createStorage(options = {}) {
    if (!isPlainObject(options)) throw new TypeError('options: ожидается обычный объект.');
    const dbName = options.dbName || DB_NAME;
    const hasIndexedDbOverride = own(options, 'indexedDB');
    const indexedDbOverride = options.indexedDB;
    const now = typeof options.now === 'function' ? options.now : () => new Date();
    const idFactory = typeof options.idFactory === 'function' ? options.idFactory : generateSnapshotId;
    const currentIndexedDb = () => (hasIndexedDbOverride ? indexedDbOverride : root?.indexedDB);

    async function save(data, saveOptions = {}) {
      if (!isPlainObject(saveOptions)) throw new TypeError('saveOptions: ожидается обычный объект.');
      const expectedEpoch = expectedEpochValue(saveOptions);
      const expectedRevision = expectedRevisionValue(saveOptions);
      const createdAt = isoTimestamp(now(), 'createdAt');
      const snapshot = createSnapshot(data, { now: createdAt, id: idFactory(createdAt) });
      const database = await openDatabase(currentIndexedDb(), dbName);
      try {
        const transaction = database.transaction(
          [snapshotStoreName, historyStoreName, metaStoreName],
          'readwrite'
        );
        const done = transactionDone(transaction, 'Не удалось сохранить снимок');
        const snapshots = transaction.objectStore(snapshotStoreName);
        const history = transaction.objectStore(historyStoreName);
        const meta = transaction.objectStore(metaStoreName);
        try {
          const epochRequest = requestResult(
            meta.get(dataEpochKey),
            'Не удалось проверить состояние локальных данных'
          );
          const revisionRequest = requestResult(
            meta.get(snapshotRevisionKey),
            'Не удалось проверить версию последнего снимка'
          );
          const epochRecord = await epochRequest;
          const revisionRecord = await revisionRequest;
          const currentEpoch = epochValue(epochRecord);
          const nextRevision = revisionValue(revisionRecord) + 1;
          assertCurrentEpoch(expectedEpoch, currentEpoch);
          assertCurrentRevision(expectedRevision, nextRevision - 1);
          snapshots.put(snapshot);
          history.add(snapshotSummary(snapshot));
          meta.put({ key: latestSnapshotKey, value: snapshot.id });
          meta.put({ key: snapshotRevisionKey, value: nextRevision });
          await pruneHistory(history, snapshots);
          await done;
          return snapshotWithRevision(snapshot, nextRevision);
        } catch (error) {
          try {
            transaction.abort();
          } catch {
            // Transaction is already completed or aborted.
          }
          await done.catch(() => {});
          throw error;
        }
      } finally {
        database.close();
      }
    }

    async function loadWithEpoch() {
      const database = await openDatabase(currentIndexedDb(), dbName);
      try {
        const metaTransaction = database.transaction(metaStoreName, 'readonly');
        const metaDone = transactionDone(metaTransaction, 'Не удалось прочитать состояние локальных данных');
        const meta = metaTransaction.objectStore(metaStoreName);
        const [latest, epochRecord, revisionRecord] = await Promise.all([
          requestResult(
            meta.get(latestSnapshotKey),
            'Не удалось прочитать последний снимок'
          ),
          requestResult(
            meta.get(dataEpochKey),
            'Не удалось прочитать состояние локальных данных'
          ),
          requestResult(
            meta.get(snapshotRevisionKey),
            'Не удалось прочитать версию последнего снимка'
          )
        ]);
        const epoch = epochValue(epochRecord);
        const revision = revisionValue(revisionRecord);
        await metaDone;
        if (!latest?.value) return { epoch, revision, snapshot: null };
        validateSnapshotId(latest.value);
        const snapshotTransaction = database.transaction(snapshotStoreName, 'readonly');
        const snapshotDone = transactionDone(snapshotTransaction, 'Не удалось прочитать последний снимок');
        const snapshot = await requestResult(
          snapshotTransaction.objectStore(snapshotStoreName).get(latest.value),
          'Не удалось прочитать последний снимок'
        );
        await snapshotDone;
        if (snapshot) validateSnapshot(snapshot);
        return { epoch, revision, snapshot: snapshot || null };
      } finally {
        database.close();
      }
    }

    async function load() {
      return (await loadWithEpoch()).snapshot;
    }

    async function getEpoch() {
      const database = await openDatabase(currentIndexedDb(), dbName);
      try {
        const transaction = database.transaction(metaStoreName, 'readonly');
        const done = transactionDone(transaction, 'Не удалось прочитать состояние локальных данных');
        const [record] = await Promise.all([
          requestResult(
            transaction.objectStore(metaStoreName).get(dataEpochKey),
            'Не удалось прочитать состояние локальных данных'
          ),
          done
        ]);
        return epochValue(record);
      } finally {
        database.close();
      }
    }

    async function list() {
      const database = await openDatabase(currentIndexedDb(), dbName);
      try {
        const transaction = database.transaction(historyStoreName, 'readonly');
        const done = transactionDone(transaction, 'Не удалось прочитать историю снимков');
        const [history] = await Promise.all([
          requestResult(
            transaction.objectStore(historyStoreName).getAll(),
            'Не удалось прочитать историю снимков'
          ),
          done
        ]);
        return history
          .sort((left, right) => right.order - left.order)
          .slice(0, HISTORY_LIMIT)
          .map(({ id, createdAt, rowCount, metadata }) => cloneJson({ id, createdAt, rowCount, metadata }));
      } finally {
        database.close();
      }
    }

    async function restore(id, restoreOptions = {}) {
      validateSnapshotId(id);
      if (!isPlainObject(restoreOptions)) throw new TypeError('restoreOptions: ожидается обычный объект.');
      const expectedEpoch = expectedEpochValue(restoreOptions);
      const expectedRevision = expectedRevisionValue(restoreOptions);
      const database = await openDatabase(currentIndexedDb(), dbName);
      try {
        const transaction = database.transaction([snapshotStoreName, metaStoreName], 'readwrite');
        const done = transactionDone(transaction, 'Не удалось восстановить снимок');
        const snapshots = transaction.objectStore(snapshotStoreName);
        const meta = transaction.objectStore(metaStoreName);
        try {
          const epochRequest = requestResult(
            meta.get(dataEpochKey),
            'Не удалось проверить состояние локальных данных'
          );
          const revisionRequest = requestResult(
            meta.get(snapshotRevisionKey),
            'Не удалось проверить версию последнего снимка'
          );
          const epochRecord = await epochRequest;
          const revisionRecord = await revisionRequest;
          const currentRevision = revisionValue(revisionRecord);
          assertCurrentEpoch(expectedEpoch, epochValue(epochRecord));
          assertCurrentRevision(expectedRevision, currentRevision);
          const snapshot = await requestResult(
            snapshots.get(id),
            'Не удалось восстановить снимок'
          );
          if (!snapshot) throw new Error(`Снимок ${id} не найден.`);
          validateSnapshot(snapshot);
          meta.put({ key: latestSnapshotKey, value: id });
          meta.put({ key: snapshotRevisionKey, value: currentRevision + 1 });
          await done;
          return snapshotWithRevision(snapshot, currentRevision + 1);
        } catch (error) {
          try {
            transaction.abort();
          } catch {
            // Transaction is already completed or aborted.
          }
          await done.catch(() => {});
          throw error;
        }
      } finally {
        database.close();
      }
    }

    async function clear() {
      const database = await openDatabase(currentIndexedDb(), dbName);
      try {
        const transaction = database.transaction(
          [snapshotStoreName, historyStoreName, metaStoreName],
          'readwrite'
        );
        const done = transactionDone(transaction, 'Не удалось очистить локальное хранилище');
        const snapshots = transaction.objectStore(snapshotStoreName);
        const history = transaction.objectStore(historyStoreName);
        const meta = transaction.objectStore(metaStoreName);
        try {
          const epochRequest = requestResult(
            meta.get(dataEpochKey),
            'Не удалось проверить состояние локальных данных'
          );
          const revisionRequest = requestResult(
            meta.get(snapshotRevisionKey),
            'Не удалось проверить версию последнего снимка'
          );
          const epochRecord = await epochRequest;
          const revisionRecord = await revisionRequest;
          const currentEpoch = epochValue(epochRecord);
          const nextRevision = revisionValue(revisionRecord) + 1;
          const nextEpoch = currentEpoch + 1;
          snapshots.clear();
          history.clear();
          meta.clear();
          meta.put({ key: dataEpochKey, value: nextEpoch });
          meta.put({ key: snapshotRevisionKey, value: nextRevision });
          await done;
          return { epoch: nextEpoch, revision: nextRevision };
        } catch (error) {
          try {
            transaction.abort();
          } catch {
            // Transaction is already completed or aborted.
          }
          await done.catch(() => {});
          throw error;
        }
      } finally {
        database.close();
      }
    }

    return Object.freeze({ save, load, loadWithEpoch, list, restore, clear, getEpoch });
  }

  const defaultStorage = createStorage();

  return Object.freeze({
    DB_NAME,
    DB_VERSION,
    SNAPSHOT_VERSION,
    BACKUP_FORMAT,
    BACKUP_VERSION,
    HISTORY_LIMIT,
    MAX_ROWS,
    MAX_BACKUP_BYTES,
    validateRows,
    validateSettings,
    createSnapshot,
    snapshotSummary,
    serializeBackup,
    parseBackup,
    createStorage,
    save: defaultStorage.save,
    load: defaultStorage.load,
    loadWithEpoch: defaultStorage.loadWithEpoch,
    list: defaultStorage.list,
    restore: defaultStorage.restore,
    clear: defaultStorage.clear,
    getEpoch: defaultStorage.getEpoch
  });
});
