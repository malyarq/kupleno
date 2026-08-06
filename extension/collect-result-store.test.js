const assert = require('node:assert/strict');
const { createCollectResultStore } = require('./collect-result-store.js');

function memoryAdapter() {
  const values = new Map();
  let failure = null;
  const failNext = (operation, error = new Error(`injected ${operation} failure`)) => {
    failure = { operation, error };
  };
  const maybeFail = (operation) => {
    if (failure?.operation !== operation) return;
    const error = failure.error;
    failure = null;
    throw error;
  };
  return {
    failNext,
    async put(record) {
      maybeFail('put');
      values.set(record.id, JSON.parse(JSON.stringify(record)));
    },
    async get(id) {
      maybeFail('get');
      const value = values.get(id);
      return value ? JSON.parse(JSON.stringify(value)) : undefined;
    },
    async remove(id) {
      maybeFail('remove');
      values.delete(id);
    },
    async clear() {
      maybeFail('clear');
      values.clear();
    },
    async list() {
      maybeFail('list');
      return [...values.values()].map((value) => JSON.parse(JSON.stringify(value)));
    }
  };
}

async function main() {
  const adapter = memoryAdapter();
  let clock = '2026-07-16T10:00:00Z';
  const store = createCollectResultStore({ adapter, now: () => clock });
  const result = { rows: [{ title: 'Чай' }], warnings: [], stats: {} };

  await store.save('job-1', result);
  result.rows[0].title = 'Изменено после сохранения';
  const restartedStore = createCollectResultStore({ adapter, now: () => clock });
  const restored = await restartedStore.load('job-1');
  assert.equal(restored.rows[0].title, 'Чай');
  restored.rows[0].title = 'Изменено после чтения';
  assert.equal((await store.load('job-1')).rows[0].title, 'Чай');

  clock = '2026-07-16T10:16:00Z';
  assert.deepEqual(await store.cleanup(), []);
  assert.equal((await store.load('job-1')).rows[0].title, 'Чай');

  clock = '2026-07-16T10:15:01Z';
  assert.deepEqual(await store.cleanup(15 * 60 * 1000), ['job-1']);
  assert.equal(await store.load('job-1'), null);

  adapter.failNext('put');
  await assert.rejects(store.save('job-2', { rows: [] }), /injected put failure/);
  adapter.failNext('remove');
  await assert.rejects(store.remove('job-2'), /injected remove failure/);
  await assert.rejects(store.save('../bad', { rows: [] }), /Некорректный идентификатор/);
  await assert.rejects(store.cleanup(-1), /неотрицательное число/);

  console.log('collect-result-store.test.js: ok');
}

main().catch((error) => {
  process.nextTick(() => {
    throw error;
  });
});
