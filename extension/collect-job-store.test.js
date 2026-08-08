const assert = require('node:assert/strict');
const { createCollectJobStore } = require('./collect-job-store.js');

function memorySession() {
  const values = new Map();
  return {
    async set(entries) {
      for (const [key, value] of Object.entries(entries)) {
        values.set(key, JSON.parse(JSON.stringify(value)));
      }
    },
    async get(key) {
      if (key === null) return Object.fromEntries([...values].map(([name, value]) => [name, JSON.parse(JSON.stringify(value))]));
      return values.has(key) ? { [key]: JSON.parse(JSON.stringify(values.get(key))) } : {};
    },
    async remove(key) {
      for (const name of Array.isArray(key) ? key : [key]) values.delete(name);
    }
  };
}

async function main() {
  const session = memorySession();
  let clock = '2026-07-16T10:00:00Z';
  const firstWorker = createCollectJobStore({
    session,
    workerId: 'worker-a',
    now: () => clock
  });
  const restartedWorker = createCollectJobStore({ session, workerId: 'worker-b', now: () => clock });

  await firstWorker.save('job-1', { status: 'running', result: { rows: [{ title: 'Не должно попасть в session' }] } });
  const interrupted = await restartedWorker.load('job-1');
  assert.deepEqual(interrupted, {
    owner: 'worker-a',
    status: 'running',
    error: '',
    updatedAt: '2026-07-16T10:00:00.000Z'
  });
  assert.equal(restartedWorker.wasInterrupted(interrupted), true);
  const storedSession = await session.get('kupleno-collect-job-v1:job-1');
  assert.equal(Object.hasOwn(storedSession['kupleno-collect-job-v1:job-1'], 'result'), false);

  clock = '2026-07-16T10:01:00Z';
  await firstWorker.save('job-1', { status: 'done', result: { rows: [{ title: 'Чай' }] } });
  const recovered = await restartedWorker.load('job-1');
  assert.deepEqual(recovered, {
    owner: 'worker-a',
    status: 'done',
    error: '',
    updatedAt: '2026-07-16T10:01:00.000Z'
  });
  assert.equal(restartedWorker.wasInterrupted(recovered), false);

  await session.set({ unrelated: { keep: true } });
  assert.equal(await restartedWorker.clear(), 1);
  assert.equal(await restartedWorker.load('job-1'), null);
  assert.deepEqual(await session.get('unrelated'), { unrelated: { keep: true } });

  clock = '2026-07-16T10:00:00Z';
  await firstWorker.save('recoverable-done', { status: 'done' });
  clock = '2026-07-16T10:16:00Z';
  assert.deepEqual(await firstWorker.cleanup(), []);
  assert.equal((await firstWorker.load('recoverable-done')).status, 'done');
  clock = '2026-07-19T10:00:01Z';
  assert.deepEqual(await firstWorker.cleanup(), ['recoverable-done']);

  clock = '2026-07-16T10:00:00Z';
  await firstWorker.save('old-done', { status: 'done' });
  clock = '2026-07-16T10:01:30Z';
  await firstWorker.save('old-error', { status: 'error', error: 'Сеть недоступна' });
  clock = '2026-07-16T10:02:00Z';
  await firstWorker.save('old-running', { status: 'running' });
  clock = '2026-07-16T10:32:01Z';
  assert.deepEqual(await firstWorker.cleanup({ doneMs: 15 * 60 * 1000, errorMs: 15 * 60 * 1000, runningMs: 30 * 60 * 1000 }), ['old-done', 'old-error', 'old-running']);
  assert.equal(await firstWorker.load('old-done'), null);
  assert.equal(await firstWorker.load('old-error'), null);
  assert.equal(await firstWorker.load('old-running'), null);

  const unavailable = createCollectJobStore({ session: null, workerId: 'worker-c' });
  await assert.rejects(unavailable.save('job-2', { status: 'running' }), /недоступно/);
  assert.equal(await unavailable.load('job-2'), null);
  await assert.rejects(unavailable.remove('job-2'), /недоступно/);
  await assert.rejects(unavailable.clear(), /недоступно/);
  await assert.rejects(unavailable.cleanup(), /недоступно/);
  await assert.rejects(firstWorker.load('../bad'), /Некорректный идентификатор/);

  console.log('collect-job-store.test.js: ok');
}

main().catch((error) => {
  process.nextTick(() => {
    throw error;
  });
});
