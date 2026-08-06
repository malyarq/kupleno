const assert = require('node:assert/strict');
const {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  HISTORY_LIMIT,
  MAX_ROWS,
  MAX_BACKUP_BYTES,
  createSnapshot,
  snapshotSummary,
  serializeBackup,
  parseBackup,
  validateRows,
  validateSettings,
  createStorage
} = require('./storage.js');

const rows = [
  {
    date: '2026-07-15',
    source: 'ozon',
    title: 'Чай',
    amount: '349.90',
    currency: 'RUB',
    category: 'Продукты',
    type: 'purchase',
    marketplace_id: 'receipt-1',
    item_index: '1'
  },
  {
    date: '2026-07-16',
    source: 'wildberries',
    title: 'Возврат обуви',
    amount: -1200,
    currency: 'RUB',
    category: 'Обувь',
    type: 'refund'
  }
];
const settings = {
  budgets: { 'Продукты': 10000 },
  theme: 'dark',
  sources: ['ozon', 'wildberries'],
  notifications: { enabled: true, threshold: 80 },
  customRules: [{
    id: 'coffee',
    keywords: ['кофе', 'зерна'],
    negativeKeywords: ['игрушка'],
    sources: ['ozon'],
    match: 'all',
    category: 'Продукты',
    priority: 120,
    enabled: true
  }],
  taxonomyVersion: 2
};

assert.equal(HISTORY_LIMIT, 12);
assert.equal(MAX_ROWS, 100000);
assert.equal(MAX_BACKUP_BYTES, 64 * 1024 * 1024);
assert.equal(validateRows(rows), true);
assert.equal(validateSettings(settings), true);

assert.throws(() => validateRows({}), /ожидается массив/);
assert.throws(
  () => validateRows([{ date: '2026-07-15', source: 'ozon', amount: '10' }]),
  /title: обязательное поле/
);
assert.throws(
  () => validateRows([{ date: '2026-07-15', source: 'other', title: 'Товар', amount: '10' }]),
  /неизвестный маркетплейс/
);
assert.throws(
  () => validateRows([{ date: '2026-07-15', source: 'ozon', title: 'Товар', amount: 'NaN' }]),
  /ожидается конечное число/
);
for (const date of [
  'not-a-date', '2026-99-99', '2026-02-30', '2026-01-01 24:00',
  '2026-01-01T10:00+99:99', '2026-01-01T10:00+24:00', '2026-01-01T10:00+00:60',
  '2026-01-01T10:00+14:01'
]) {
  assert.throws(
    () => validateRows([{ date, source: 'ozon', title: 'Товар', amount: '10' }]),
    /существующая дата/
  );
}
assert.equal(validateRows([{ date: '2024-02-29 23:59', source: 'ozon', title: 'Товар', amount: '10' }]), true);
assert.equal(validateRows([{ date: '2024-02-29T23:59:59+14:00', source: 'ozon', title: 'Товар', amount: '10' }]), true);
assert.throws(() => validateSettings([]), /ожидается обычный объект/);

const cyclicSettings = {};
cyclicSettings.self = cyclicSettings;
assert.throws(() => validateSettings(cyclicSettings), /циклическая ссылка/);
assert.throws(
  () => validateSettings(JSON.parse('{"budgets":{"__proto__":{"polluted":true}}}')),
  /небезопасное имя поля/
);

const sourceData = {
  rows,
  settings,
  metadata: { kind: 'Собрано', warningCount: 1 }
};
const snapshot = createSnapshot(sourceData, {
  id: 'snapshot-1',
  now: '2026-07-15T12:00:00+03:00'
});
assert.deepEqual(snapshot, {
  version: 1,
  id: 'snapshot-1',
  createdAt: '2026-07-15T09:00:00.000Z',
  rows,
  settings,
  metadata: { kind: 'Собрано', warningCount: 1 }
});

sourceData.rows[0].title = 'Изменено после создания';
sourceData.settings.theme = 'light';
assert.equal(snapshot.rows[0].title, 'Чай');
assert.equal(snapshot.settings.theme, 'dark');

const summary = snapshotSummary(snapshot);
assert.deepEqual(summary, {
  id: 'snapshot-1',
  createdAt: '2026-07-15T09:00:00.000Z',
  rowCount: 2,
  metadata: { kind: 'Собрано', warningCount: 1 }
});
summary.metadata.kind = 'Изменено';
assert.equal(snapshot.metadata.kind, 'Собрано');

const backupText = serializeBackup(snapshot, { now: '2026-07-17T10:30:00Z' });
assert.equal(backupText.endsWith('\n'), true);
const backup = parseBackup(`\uFEFF${backupText}`);
assert.deepEqual(backup, {
  format: BACKUP_FORMAT,
  version: BACKUP_VERSION,
  exportedAt: '2026-07-17T10:30:00.000Z',
  createdAt: '2026-07-15T09:00:00.000Z',
  rows: snapshot.rows,
  settings: snapshot.settings,
  metadata: { kind: 'Собрано', warningCount: 1 }
});
backup.rows[0].title = 'Изменено после импорта';
assert.equal(snapshot.rows[0].title, 'Чай');

assert.throws(() => parseBackup('{'), /некорректный JSON/);
assert.throws(() => parseBackup('[]'), /Некорректный формат/);
assert.throws(
  () => parseBackup(JSON.stringify({ ...JSON.parse(backupText), format: 'another-format' })),
  /не является резервной копией MarketTrat/
);
assert.throws(
  () => parseBackup(JSON.stringify({ ...JSON.parse(backupText), version: BACKUP_VERSION + 1 })),
  /не поддерживается/
);
assert.throws(
  () => parseBackup(JSON.stringify({ ...JSON.parse(backupText), settings: [] })),
  /settings: ожидается обычный объект/
);
assert.throws(
  () => serializeBackup({ rows: [{ ...rows[0], amount: Infinity }], settings }),
  /число должно быть конечным/
);

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function createMemoryIndexedDb() {
  const databases = new Map();
  let nextFailure = null;

  function takeFailure(storeName, operation) {
    if (!nextFailure
      || nextFailure.storeName !== storeName
      || nextFailure.operation !== operation) return null;
    const error = nextFailure.error;
    nextFailure = null;
    return error;
  }

  class MemoryTransaction {
    constructor(database, storeNames, mode) {
      this.database = database;
      this.storeNames = storeNames;
      this.mode = mode;
      this.error = null;
      this.oncomplete = null;
      this.onerror = null;
      this.onabort = null;
      this.active = true;
      this.ready = mode !== 'readwrite';
      this.queuedTasks = [];
      this.pending = 0;
      this.before = null;
      if (mode === 'readwrite') {
        if (database.state.activeWriteTransaction) database.state.writeTransactions.push(this);
        else this.activate();
      }
      this.scheduleCompletion();
    }

    activate() {
      if (!this.active || this.ready) return;
      this.ready = true;
      this.database.state.activeWriteTransaction = this;
      this.before = new Map(this.storeNames.map((name) => {
        const store = this.database.stores.get(name);
        return [name, {
          nextKey: store.nextKey,
          records: new Map([...store.records].map(([key, value]) => [key, clone(value)]))
        }];
      }));
      this.queuedTasks.splice(0).forEach((task) => queueMicrotask(task));
      this.scheduleCompletion();
    }

    release() {
      if (this.mode !== 'readwrite') return;
      const state = this.database.state;
      if (state.activeWriteTransaction === this) {
        state.activeWriteTransaction = null;
        state.writeTransactions.shift()?.activate();
        return;
      }
      const index = state.writeTransactions.indexOf(this);
      if (index >= 0) state.writeTransactions.splice(index, 1);
    }

    execute(task) {
      if (this.ready) queueMicrotask(task);
      else this.queuedTasks.push(task);
    }

    objectStore(name) {
      if (!this.storeNames.includes(name)) throw new Error(`Store ${name} is outside this transaction.`);
      return new MemoryObjectStore(this, name);
    }

    startRequest() {
      if (!this.active) throw new Error('Transaction is inactive.');
      this.pending += 1;
    }

    finishRequest() {
      if (!this.active) return;
      this.pending -= 1;
      this.scheduleCompletion();
    }

    scheduleCompletion() {
      if (!this.active || !this.ready || this.pending !== 0) return;
      setTimeout(() => {
        if (!this.active || !this.ready || this.pending !== 0) return;
        this.active = false;
        this.oncomplete?.();
        this.release();
      }, 0);
    }

    rollback() {
      if (!this.before) return;
      for (const [name, saved] of this.before) {
        const store = this.database.stores.get(name);
        store.nextKey = saved.nextKey;
        store.records = new Map([...saved.records].map(([key, value]) => [key, clone(value)]));
      }
    }

    fail(error) {
      if (!this.active) return;
      this.rollback();
      this.error = error;
      this.active = false;
      this.onerror?.();
      this.release();
    }

    abort() {
      if (!this.active) throw new Error('Transaction is inactive.');
      this.rollback();
      this.error ||= new Error('Transaction aborted.');
      this.active = false;
      this.onabort?.();
      this.release();
    }
  }

  class MemoryObjectStore {
    constructor(transaction, name) {
      this.transaction = transaction;
      this.name = name;
    }

    get state() {
      return this.transaction.database.stores.get(this.name);
    }

    request(operation, action) {
      const request = { result: undefined, error: null, onsuccess: null, onerror: null };
      this.transaction.startRequest();
      this.transaction.execute(() => {
        if (!this.transaction.active) {
          request.error = this.transaction.error || new Error('Transaction is inactive.');
          request.onerror?.();
          return;
        }
        const injected = takeFailure(this.name, operation);
        if (injected) {
          request.error = injected;
          request.onerror?.();
          this.transaction.fail(injected);
          return;
        }
        try {
          request.result = action();
          request.onsuccess?.();
          this.transaction.finishRequest();
        } catch (error) {
          request.error = error;
          request.onerror?.();
          this.transaction.fail(error);
        }
      });
      return request;
    }

    get(key) {
      return this.request('get', () => clone(this.state.records.get(key)));
    }

    getAll() {
      return this.request('getAll', () => [...this.state.records.values()].map(clone));
    }

    put(value) {
      return this.request('put', () => this.write(value, true));
    }

    add(value) {
      return this.request('add', () => this.write(value, false));
    }

    write(value, overwrite) {
      const record = clone(value);
      let key = record[this.state.keyPath];
      if ((key === undefined || key === null) && this.state.autoIncrement) {
        key = ++this.state.nextKey;
        record[this.state.keyPath] = key;
      }
      if (key === undefined || key === null) throw new Error('Key is required.');
      if (!overwrite && this.state.records.has(key)) throw new Error(`Key ${key} already exists.`);
      this.state.records.set(key, record);
      return key;
    }

    delete(key) {
      return this.request('delete', () => this.state.records.delete(key));
    }

    clear() {
      return this.request('clear', () => this.state.records.clear());
    }

    openCursor(_range, direction = 'next') {
      const request = { result: undefined, error: null, onsuccess: null, onerror: null };
      this.transaction.startRequest();
      this.transaction.execute(() => {
        if (!this.transaction.active) {
          request.error = this.transaction.error || new Error('Transaction is inactive.');
          request.onerror?.();
          return;
        }
        const injected = takeFailure(this.name, 'openCursor');
        if (injected) {
          request.error = injected;
          request.onerror?.();
          this.transaction.fail(injected);
          return;
        }

        const entries = [...this.state.records.entries()].sort(([left], [right]) => {
          if (left === right) return 0;
          const order = left < right ? -1 : 1;
          return direction === 'prev' ? -order : order;
        });
        let index = 0;
        const emit = () => {
          if (!this.transaction.active) return;
          if (index >= entries.length) {
            request.result = null;
            request.onsuccess?.();
            this.transaction.finishRequest();
            return;
          }
          const [primaryKey, value] = entries[index];
          let continued = false;
          request.result = {
            primaryKey,
            value: clone(value),
            continue: () => {
              if (continued) return;
              continued = true;
              index += 1;
              queueMicrotask(emit);
            }
          };
          request.onsuccess?.();
        };
        emit();
      });
      return request;
    }
  }

  class MemoryDatabase {
    constructor(state) {
      this.state = state;
      this.onversionchange = null;
      this.objectStoreNames = {
        contains: (name) => state.stores.has(name)
      };
    }

    get stores() {
      return this.state.stores;
    }

    createObjectStore(name, options = {}) {
      if (this.stores.has(name)) throw new Error(`Store ${name} already exists.`);
      this.stores.set(name, {
        keyPath: options.keyPath,
        autoIncrement: options.autoIncrement === true,
        nextKey: 0,
        records: new Map()
      });
    }

    transaction(storeNames, mode = 'readonly') {
      const names = Array.isArray(storeNames) ? storeNames : [storeNames];
      for (const name of names) {
        if (!this.stores.has(name)) throw new Error(`Store ${name} does not exist.`);
      }
      return new MemoryTransaction(this, names, mode);
    }

    close() {}
  }

  return {
    open(name, version) {
      const request = {
        result: null,
        error: null,
        onupgradeneeded: null,
        onsuccess: null,
        onerror: null,
        onblocked: null
      };
      queueMicrotask(() => {
        try {
          let state = databases.get(name);
          const needsUpgrade = !state;
          if (!state) {
            state = {
              version,
              stores: new Map(),
              activeWriteTransaction: null,
              writeTransactions: []
            };
            databases.set(name, state);
          }
          request.result = new MemoryDatabase(state);
          if (needsUpgrade) request.onupgradeneeded?.();
          queueMicrotask(() => request.onsuccess?.());
        } catch (error) {
          request.error = error;
          request.onerror?.();
        }
      });
      return request;
    },
    failNext(storeName, operation, error = new Error('Injected IndexedDB failure.')) {
      nextFailure = { storeName, operation, error };
    }
  };
}

async function testUnavailableIndexedDb() {
  const unavailable = createStorage({ indexedDB: null });
  const message = /IndexedDB недоступен.*браузерном расширении/;
  await assert.rejects(unavailable.save({ rows, settings }), message);
  await assert.rejects(unavailable.load(), message);
  await assert.rejects(unavailable.loadWithEpoch(), message);
  await assert.rejects(unavailable.list(), message);
  await assert.rejects(unavailable.restore('snapshot-1'), message);
  await assert.rejects(unavailable.clear(), message);
  await assert.rejects(unavailable.getEpoch(), message);
}

function lifecycleData(sequence) {
  return {
    rows: [{
      ...snapshot.rows[0],
      title: `Товар ${sequence}`,
      marketplace_id: `receipt-${sequence}`
    }],
    settings: { profile: `profile-${sequence}` },
    metadata: { sequence }
  };
}

function testStorage(indexedDB, dbName) {
  let id = 0;
  let timestamp = 0;
  return createStorage({
    indexedDB,
    dbName,
    idFactory: () => `snapshot-${++id}`,
    now: () => new Date(Date.UTC(2026, 6, 1, 0, 0, timestamp++))
  });
}

async function testIndexedDbLifecycle() {
  const indexedDB = createMemoryIndexedDb();
  const storage = testStorage(indexedDB, 'lifecycle');

  assert.equal(await storage.getEpoch(), 0);
  assert.equal(await storage.load(), null);
  assert.deepEqual(await storage.loadWithEpoch(), { epoch: 0, revision: 0, snapshot: null });
  assert.deepEqual(await storage.list(), []);

  const saved = [];
  for (let sequence = 1; sequence <= HISTORY_LIMIT + 1; sequence += 1) {
    saved.push(await storage.save(lifecycleData(sequence)));
  }

  saved.at(-1).rows[0].title = 'Изменено вызывающим кодом';
  saved.at(-1).settings.profile = 'mutated';
  const latest = await storage.load();
  assert.equal(latest.id, 'snapshot-13');
  assert.equal(latest.rows[0].title, 'Товар 13');
  assert.equal(latest.settings.profile, 'profile-13');
  const latestWithEpoch = await storage.loadWithEpoch();
  assert.equal(latestWithEpoch.epoch, 0);
  assert.equal(latestWithEpoch.revision, HISTORY_LIMIT + 1);
  assert.equal(latestWithEpoch.snapshot.id, 'snapshot-13');

  const expectedSequences = Array.from({ length: HISTORY_LIMIT }, (_, index) => 13 - index);
  const history = await storage.list();
  assert.equal(history.length, HISTORY_LIMIT);
  assert.deepEqual(history.map((entry) => entry.metadata.sequence), expectedSequences);
  assert.ok(history.every((entry) => entry.rowCount === 1));
  await assert.rejects(storage.restore('snapshot-1'), /не найден/);

  const restored = await storage.restore('snapshot-5');
  assert.equal(restored.revision, HISTORY_LIMIT + 2);
  assert.equal(restored.metadata.sequence, 5);
  restored.rows[0].title = 'Изменено после restore';
  restored.settings.profile = 'changed-after-restore';
  restored.metadata.sequence = 999;
  const loadedAfterRestore = await storage.load();
  assert.equal(loadedAfterRestore.id, 'snapshot-5');
  assert.equal(loadedAfterRestore.rows[0].title, 'Товар 5');
  assert.equal(loadedAfterRestore.settings.profile, 'profile-5');
  assert.equal(loadedAfterRestore.metadata.sequence, 5);

  history[0].metadata.sequence = 999;
  assert.deepEqual((await storage.list()).map((entry) => entry.metadata.sequence), expectedSequences);

  assert.equal(await storage.clear(), 1);
  assert.equal(await storage.getEpoch(), 1);
  assert.equal(await storage.load(), null);
  assert.deepEqual(await storage.loadWithEpoch(), { epoch: 1, revision: HISTORY_LIMIT + 3, snapshot: null });
  assert.deepEqual(await storage.list(), []);
  await assert.rejects(storage.restore('snapshot-5'), /не найден/);

  await assert.rejects(
    storage.save(lifecycleData(14), { expectedEpoch: 0 }),
    (error) => error?.code === 'STALE_DATA_EPOCH' && error.currentEpoch === 1
  );
  const savedAfterClear = await storage.save(lifecycleData(14), { expectedEpoch: 1 });
  assert.equal(savedAfterClear.revision, HISTORY_LIMIT + 4);
  assert.equal(savedAfterClear.metadata.sequence, 14);
  await assert.rejects(
    storage.restore(savedAfterClear.id, { expectedEpoch: 0 }),
    (error) => error?.code === 'STALE_DATA_EPOCH' && error.currentEpoch === 1
  );
}

async function testConcurrentRevisionCas() {
  const indexedDB = createMemoryIndexedDb();
  const dbName = 'concurrent-revision';
  const first = testStorage(indexedDB, dbName);
  const second = testStorage(indexedDB, dbName);
  const [firstView, secondView] = await Promise.all([first.loadWithEpoch(), second.loadWithEpoch()]);
  assert.deepEqual(firstView, { epoch: 0, revision: 0, snapshot: null });
  assert.deepEqual(secondView, firstView);

  const attempts = await Promise.allSettled([
    first.save(lifecycleData(1), { expectedEpoch: firstView.epoch, expectedRevision: firstView.revision }),
    second.save(lifecycleData(2), { expectedEpoch: secondView.epoch, expectedRevision: secondView.revision })
  ]);
  const saved = attempts.find((attempt) => attempt.status === 'fulfilled');
  const stale = attempts.find((attempt) => attempt.status === 'rejected');
  assert.equal(saved?.status, 'fulfilled');
  assert.equal(stale?.status, 'rejected');
  assert.equal(saved.value.revision, 1);
  assert.equal(stale.reason?.code, 'STALE_SNAPSHOT_REVISION');
  assert.equal(stale.reason?.currentRevision, 1);

  const afterSave = await first.loadWithEpoch();
  assert.equal(afterSave.revision, 1);
  assert.equal(afterSave.snapshot.id, saved.value.id);

  const newer = await second.save(lifecycleData(3), { expectedEpoch: 0, expectedRevision: afterSave.revision });
  assert.equal(newer.revision, 2);
  await assert.rejects(
    first.restore(saved.value.id, { expectedEpoch: 0, expectedRevision: afterSave.revision }),
    (error) => error?.code === 'STALE_SNAPSHOT_REVISION' && error.currentRevision === 2
  );
  const afterStaleRestore = await second.loadWithEpoch();
  assert.equal(afterStaleRestore.revision, 2);
  assert.equal(afterStaleRestore.snapshot.id, newer.id);

  await second.clear();
  await assert.rejects(
    first.save(lifecycleData(4), { expectedEpoch: afterStaleRestore.epoch, expectedRevision: afterStaleRestore.revision }),
    (error) => error?.code === 'STALE_DATA_EPOCH' && error.currentEpoch === 1
  );
  assert.deepEqual(await first.loadWithEpoch(), { epoch: 1, revision: 3, snapshot: null });
}

async function testRecoveryAfterFailedTransaction() {
  const indexedDB = createMemoryIndexedDb();
  const storage = testStorage(indexedDB, 'failure-recovery');

  await storage.save(lifecycleData(1));
  indexedDB.failNext('history', 'openCursor', new Error('injected cursor failure'));
  await assert.rejects(storage.save(lifecycleData(2)), /injected cursor failure/);

  assert.equal((await storage.load()).metadata.sequence, 1);
  assert.deepEqual((await storage.list()).map((entry) => entry.metadata.sequence), [1]);
  await assert.rejects(storage.restore('snapshot-2'), /не найден/);

  const recovered = await storage.save(lifecycleData(3));
  assert.equal(recovered.id, 'snapshot-3');
  assert.equal((await storage.load()).metadata.sequence, 3);
  assert.deepEqual((await storage.list()).map((entry) => entry.metadata.sequence), [3, 1]);
}

async function main() {
  await testUnavailableIndexedDb();
  await testIndexedDbLifecycle();
  await testConcurrentRevisionCas();
  await testRecoveryAfterFailedTransaction();
  console.log('storage.test.js: ok');
}

main().catch((error) => {
  process.nextTick(() => {
    throw error;
  });
});
