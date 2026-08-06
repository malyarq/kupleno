(function exposeCollectJobStore(root, factory) {
  const exported = factory();
  if (typeof module === 'object' && module.exports) module.exports = exported;
  if (root) root.MarketTratCollectJobStore = exported;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  'use strict';

  const keyPrefix = 'markettrat-collect-job-v1:';
  const allowedStatuses = new Set(['running', 'done', 'error']);
  const DEFAULT_TTLS = Object.freeze({
    doneMs: 72 * 60 * 60 * 1000,
    errorMs: 24 * 60 * 60 * 1000,
    runningMs: 30 * 60 * 1000
  });

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function jobIdFromKey(key) {
    if (!key.startsWith(keyPrefix)) return null;
    const id = key.slice(keyPrefix.length);
    return id && id.length <= 200 && /^[a-z0-9-]+$/i.test(id) ? id : null;
  }

  function jobKey(jobId) {
    const id = String(jobId || '').trim();
    if (!id || id.length > 200 || !/^[a-z0-9-]+$/i.test(id)) {
      throw new TypeError('Некорректный идентификатор задачи сбора.');
    }
    return `${keyPrefix}${id}`;
  }

  function normalizeStoredJob(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    if (!allowedStatuses.has(value.status) || typeof value.owner !== 'string' || !value.owner) return null;
    const updatedAt = new Date(value.updatedAt);
    if (!Number.isFinite(updatedAt.getTime())) return null;
    return clone({
      owner: value.owner,
      status: value.status,
      error: value.status === 'error' ? String(value.error || 'Не удалось собрать данные.') : '',
      updatedAt: updatedAt.toISOString()
    });
  }

  function ttlValue(value, name) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) throw new TypeError(`${name}: ожидается неотрицательное число.`);
    return parsed;
  }

  function createCollectJobStore(options = {}) {
    const session = options.session;
    const workerId = String(options.workerId || '').trim();
    const now = typeof options.now === 'function' ? options.now : () => new Date();
    if (!workerId) throw new TypeError('workerId: ожидается непустая строка.');

    async function save(jobId, job) {
      if (!session || typeof session.set !== 'function') {
        throw new Error('Хранилище состояния задач недоступно.');
      }
      const status = allowedStatuses.has(job?.status) ? job.status : 'error';
      const value = {
        owner: workerId,
        status,
        error: status === 'error' ? String(job?.error || 'Не удалось собрать данные.') : '',
        updatedAt: new Date(now()).toISOString()
      };
      await session.set({ [jobKey(jobId)]: value });
      return value;
    }

    async function load(jobId) {
      if (!session || typeof session.get !== 'function') return null;
      const key = jobKey(jobId);
      const values = await session.get(key);
      return normalizeStoredJob(values?.[key]);
    }

    async function remove(jobId) {
      if (!session || typeof session.remove !== 'function') {
        throw new Error('Хранилище состояния задач недоступно.');
      }
      await session.remove(jobKey(jobId));
    }

    async function clear() {
      if (!session || typeof session.get !== 'function' || typeof session.remove !== 'function') {
        throw new Error('Хранилище состояния задач недоступно.');
      }
      const values = await session.get(null);
      const keys = Object.keys(values || {}).filter((key) => key.startsWith(keyPrefix));
      if (keys.length) await session.remove(keys);
      return keys.length;
    }

    async function cleanup(ttls = DEFAULT_TTLS) {
      if (!session || typeof session.get !== 'function' || typeof session.remove !== 'function') {
        throw new Error('Хранилище состояния задач недоступно.');
      }
      const limits = {
        doneMs: ttlValue(ttls.doneMs, 'doneMs'),
        errorMs: ttlValue(ttls.errorMs, 'errorMs'),
        runningMs: ttlValue(ttls.runningMs, 'runningMs')
      };
      const currentTime = new Date(now()).getTime();
      if (!Number.isFinite(currentTime)) throw new TypeError('now: некорректная дата.');
      const values = await session.get(null);
      const removedJobIds = [];
      const keys = Object.keys(values || {}).filter((key) => {
        if (!key.startsWith(keyPrefix)) return false;
        const job = normalizeStoredJob(values[key]);
        const jobId = jobIdFromKey(key);
        const age = job ? currentTime - new Date(job.updatedAt).getTime() : Infinity;
        const limit = job ? limits[`${job.status}Ms`] : 0;
        if (age >= 0 && age <= limit) return false;
        if (jobId) removedJobIds.push(jobId);
        return true;
      });
      if (keys.length) await session.remove(keys);
      return removedJobIds;
    }

    function wasInterrupted(job) {
      return job?.status === 'running' && job.owner !== workerId;
    }

    return Object.freeze({ save, load, remove, clear, cleanup, wasInterrupted });
  }

  return Object.freeze({ DEFAULT_TTLS, createCollectJobStore });
});
