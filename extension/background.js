if (typeof importScripts === 'function') {
  importScripts('collect-job-store.js');
  importScripts('collect-result-store.js');
} else if (typeof require === 'function') {
  globalThis.MarketTratCollectJobStore = require('./collect-job-store.js');
  globalThis.MarketTratCollectResultStore = require('./collect-result-store.js');
}

const api = globalThis.chrome;
const collectJobs = new Map();
let collectJobGeneration = 0;
const workerInstanceId = globalThis.crypto?.randomUUID?.()
  || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
const collectJobStorePromise = Promise.resolve(
  globalThis.MarketTratCollectJobStore.createCollectJobStore({
    session: api?.storage?.session,
    workerId: workerInstanceId
  })
);
const collectResultStorePromise = Promise.resolve(
  globalThis.MarketTratCollectResultStore.createCollectResultStore({
    indexedDB: globalThis.indexedDB
  })
);
let collectJobPersistenceQueue = Promise.resolve();

function createCollectJobId() {
  return globalThis.crypto?.randomUUID?.()
    || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function enqueueCollectJobPersistence(operation) {
  const queued = collectJobPersistenceQueue.then(operation, operation);
  collectJobPersistenceQueue = queued.catch(() => undefined);
  return queued;
}

function persistenceError(error) {
  const detail = error?.message ? `: ${error.message}` : '';
  return new Error(`Не удалось надёжно сохранить результат сбора${detail}`);
}

function persistCollectJob(jobId, job) {
  return enqueueCollectJobPersistence(async () => {
    const [jobStore, resultStore] = await Promise.all([
      collectJobStorePromise,
      collectResultStorePromise
    ]);
    if (job.status === 'done') {
      if (!job.result || typeof job.result !== 'object') {
        throw new Error('Готовый результат сбора повреждён.');
      }
      try {
        await resultStore.save(jobId, job.result);
        await jobStore.save(jobId, job);
      } catch (error) {
        throw persistenceError(error);
      }
      return;
    }
    await jobStore.save(jobId, job);
  });
}

function removePersistedCollectJob(jobId) {
  return enqueueCollectJobPersistence(async () => {
    const [jobStore, resultStore] = await Promise.all([
      collectJobStorePromise,
      collectResultStorePromise
    ]);
    await jobStore.remove(jobId);
    await resultStore.remove(jobId);
  });
}

function clearCollectJobs() {
  collectJobGeneration += 1;
  collectJobs.clear();
  return enqueueCollectJobPersistence(async () => {
    const [jobStore, resultStore] = await Promise.all([
      collectJobStorePromise,
      collectResultStorePromise
    ]);
    await jobStore.clear();
    await resultStore.clear();
  });
}

function cleanupPersistedCollectJobs() {
  return enqueueCollectJobPersistence(async () => {
    const [jobStore, resultStore] = await Promise.all([
      collectJobStorePromise,
      collectResultStorePromise
    ]);
    const removedJobIds = await jobStore.cleanup();
    for (const jobId of removedJobIds) collectJobs.delete(jobId);
    await Promise.all(removedJobIds.map((jobId) => resultStore.remove(jobId)));
    await resultStore.cleanup();
  });
}

async function collectJobResponse(jobId) {
  const id = String(jobId || '');
  let job = collectJobs.get(id);
  const [jobStore, resultStore] = await Promise.all([
    collectJobStorePromise,
    collectResultStorePromise
  ]);
  if (!job) {
    job = await jobStore.load(id);
    if (jobStore.wasInterrupted(job)) {
      await removePersistedCollectJob(id);
      return {
        ok: true,
        status: 'error',
        error: 'Сбор был прерван перезапуском фонового процесса. Запустите его ещё раз; прежний отчёт не изменён.'
      };
    }
  }
  if (!job) return { ok: false, error: 'Задача сбора не найдена. Запустите сбор заново.' };
  if (job.status === 'running') return { ok: true, status: 'running' };

  let result = null;
  if (job.status === 'done') {
    result = job.result || await resultStore.load(id);
    if (!result) {
      await removePersistedCollectJob(id);
      return {
        ok: true,
        status: 'error',
        error: 'Готовый результат сбора не удалось восстановить. Запустите сбор ещё раз.'
      };
    }
  }
  if (job.status === 'done') return { ok: true, status: 'done', ...result };
  return { ok: true, status: 'error', error: job.error };
}

async function acknowledgeCollectJob(jobId) {
  const id = String(jobId || '');
  if (!id) throw new Error('Не указан идентификатор задачи сбора.');
  collectJobs.delete(id);
  await removePersistedCollectJob(id);
}

if (api?.storage?.session && globalThis.indexedDB) {
  cleanupPersistedCollectJobs().catch((error) => {
    console.error('Не удалось очистить устаревшие задачи сбора:', error);
  });
}

async function openAppPage() {
  const url = api.runtime.getURL('app.html');
  if (typeof api.runtime.getContexts === 'function') {
    const contexts = await api.runtime.getContexts({
      contextTypes: ['TAB'],
      documentUrls: [url]
    }).catch(() => []);
    const appContext = contexts.find((context) => context.tabId >= 0);
    if (appContext) {
      await chromeCall(api.tabs.update, appContext.tabId, { active: true });
      if (appContext.windowId >= 0) {
        await chromeCall(api.windows.update, appContext.windowId, { focused: true }).catch(() => null);
      }
      return;
    }
  } else if (globalThis.clients?.matchAll) {
    const clients = await globalThis.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const appClient = clients.find((client) => client.url === url);
    if (appClient) {
      await appClient.focus();
      return;
    }
  }
  await chromeCall(api.tabs.create, { url, active: true });
}

function emitProgress(message, value = null, max = null) {
  try {
    const result = api.runtime.sendMessage({
      type: 'SPEND_PROGRESS',
      message,
      value,
      max
    });
    if (result && typeof result.catch === 'function') result.catch(() => {});
  } catch {
    // Popup may be closed while collection is still running.
  }
}

const progressSourceLabels = {
  ozon: 'Ozon',
  wildberries: 'Wildberries',
  yandex: 'Яндекс Маркет'
};

async function trackSourceProgress(source, work) {
  try {
    const result = await work();
    emitProgress(`${progressSourceLabels[source]}: готово, строк ${(result.rows || []).length}.`);
    return {
      source,
      rows: result.rows || [],
      stats: result.stats || {},
      supersededReceipts: Array.isArray(result.supersededReceipts) ? result.supersededReceipts : []
    };
  } catch (error) {
    emitProgress(`${progressSourceLabels[source]}: ошибка: ${error.message}`);
    throw error;
  }
}

function chromeCall(fn, ...args) {
  return new Promise((resolve, reject) => {
    fn(...args, (result) => {
      const err = api.runtime.lastError;
      if (err) reject(new Error(err.message));
      else resolve(result);
    });
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clampConcurrency(value, fallback, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.max(1, Math.min(max, Math.floor(parsed)));
}

async function mapWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index], index);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => runWorker()
  );
  await Promise.all(workers);
  return results;
}

async function queryTabs(url) {
  return chromeCall(api.tabs.query, { url }).catch(() => []);
}

function isPreferredTab(tab, source, preferredPath) {
  if (source === 'yandex') {
    try {
      const url = new URL(tab.url || '');
      return url.hostname === 'market.yandex.ru'
        && url.pathname === '/my/orders'
        && url.searchParams.get('filter') === 'COMPLETED';
    } catch {
      return false;
    }
  }
  if (source !== 'ozon') return tab.url?.startsWith(preferredPath);
  try {
    const url = new URL(tab.url || '');
    const preferred = new URL(preferredPath);
    return url.hostname.replace(/^www\./, '') === 'ozon.ru'
      && url.pathname.replace(/\/$/, '') === '/my/e-check'
      && url.searchParams.get('archive') === preferred.searchParams.get('archive');
  } catch {
    return false;
  }
}

async function waitForTabComplete(tabId, timeoutMs = 30000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const tab = await chromeCall(api.tabs.get, tabId).catch(() => null);
    if (tab?.status === 'complete') return tab;
    await sleep(500);
  }

  return chromeCall(api.tabs.get, tabId);
}

async function getOrCreateTab(source) {
  const configs = {
    ozon: {
      urls: ['https://www.ozon.ru/*', 'https://ozon.ru/*'],
      preferredPath: 'https://www.ozon.ru/my/e-check?archive=1'
    },
    wildberries: {
      urls: ['https://www.wildberries.ru/*', 'https://wildberries.ru/*'],
      preferredPath: 'https://www.wildberries.ru/lk/receipts/get'
    },
    yandex: {
      urls: ['https://market.yandex.ru/*'],
      preferredPath: 'https://market.yandex.ru/my/orders?filter=COMPLETED'
    }
  };
  const config = configs[source];
  if (!config) throw new Error(`${source}: неизвестный источник`);

  for (const pattern of config.urls) {
    const tabs = await queryTabs(pattern);
    const exact = tabs.find((tab) => isPreferredTab(tab, source, config.preferredPath));
    if (exact) {
      return {
        tab: await waitForTabComplete(exact.id),
        created: false
      };
    }
  }

  const tab = await chromeCall(api.tabs.create, {
    url: config.preferredPath,
    active: false
  });
  return {
    tab: await waitForTabComplete(tab.id),
    created: true
  };
}

async function closeManagedTab(managedTab, source) {
  if (!managedTab?.created || !managedTab.tab?.id) return;
  await chromeCall(api.tabs.remove, managedTab.tab.id)
    .then(() => emitProgress(`${source}: временная вкладка закрыта.`))
    .catch(() => null);
}

async function ensureContentScript(tabId) {
  await chromeCall(api.scripting.executeScript, {
    target: { tabId },
    files: ['content.js']
  });
}

async function collectFromTab(source, options) {
  const managedTab = await getOrCreateTab(source);
  const tab = managedTab.tab;
  try {
    await ensureContentScript(tab.id);
    const response = await chromeCall(api.tabs.sendMessage, tab.id, {
      type: 'SPEND_COLLECT_SOURCE',
      source,
      options
    });

    if (!response?.ok) {
      throw new Error(response?.error || `${source}: не удалось собрать данные`);
    }

    return response;
  } finally {
    await closeManagedTab(managedTab, source);
  }
}

async function collectFromTabKeepOpen(source, options) {
  const managedTab = await getOrCreateTab(source);
  const tab = managedTab.tab;
  try {
    await ensureContentScript(tab.id);
    const response = await chromeCall(api.tabs.sendMessage, tab.id, {
      type: 'SPEND_COLLECT_SOURCE',
      source,
      options
    });
    if (!response?.ok) {
      throw new Error(response?.error || `${source}: не удалось собрать данные`);
    }
    return { response, managedTab };
  } catch (error) {
    await closeManagedTab(managedTab, source);
    throw error;
  }
}

function amountFromText(text) {
  const normalized = String(text || '')
    .replace(/\u00a0|\u202f/g, '')
    .replace(/\s/g, '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '');
  const value = Number(normalized);
  return Number.isFinite(value) ? value : 0;
}

function decodeHtml(text) {
  return String(text || '')
    .replace(/&#x([0-9a-f]+);/gi, (_, value) => String.fromCharCode(parseInt(value, 16)))
    .replace(/&#(\d+);/g, (_, value) => String.fromCharCode(Number(value)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function stripTags(html) {
  return decodeHtml(String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

const allowedReceiptHosts = new Set(['receipt.wb.ru', 'check.yandex.ru']);
const maxReceiptResponseBytes = 10 * 1024 * 1024;
const receiptRequestTimeoutMs = 25_000;

function allowedReceiptUrl(value) {
  const parsed = new URL(String(value || ''));
  if (parsed.protocol !== 'https:' || !allowedReceiptHosts.has(parsed.hostname.toLowerCase())) {
    throw new Error(`запрещённый адрес чека: ${parsed.hostname || value}`);
  }
  return parsed.href;
}

async function limitedResponseText(response) {
  const announced = Number(response.headers.get('content-length'));
  if (Number.isFinite(announced) && announced > maxReceiptResponseBytes) {
    throw new Error('ответ чека больше допустимых 10 МБ');
  }
  if (!response.body?.getReader) {
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > maxReceiptResponseBytes) throw new Error('ответ чека больше допустимых 10 МБ');
    return new TextDecoder().decode(buffer);
  }

  const reader = response.body.getReader();
  const chunks = [];
  let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maxReceiptResponseBytes) {
        await reader.cancel('response too large').catch(() => {});
        throw new Error('ответ чека больше допустимых 10 МБ');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

async function fetchText(url, options = {}) {
  const safeUrl = allowedReceiptUrl(url);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), receiptRequestTimeoutMs);
    try {
      const response = await fetch(safeUrl, {
        credentials: 'include',
        ...options,
        signal: controller.signal,
        headers: {
          accept: 'text/html,application/json,*/*',
          ...(options.headers || {})
        }
      });
      if (response.ok) return await limitedResponseText(response);
      const retryable = response.status === 429 || response.status >= 500;
      if (!retryable || attempt === 2) throw new Error(`${response.status} ${response.statusText}`.trim());
      await sleep(750 * (2 ** attempt));
    } catch (error) {
      if (error?.name === 'AbortError') throw new Error('таймаут запроса чека 25с');
      if (attempt === 2 || !/^(?:5\d\d|429)\b/.test(error.message)) throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
  throw new Error('запрос чека не выполнен');
}

function monthFromDate(date) {
  const match = String(date || '').match(/^(\d{4})-(\d{2})/);
  return match ? `${match[1]}-${match[2]}` : '';
}

function parseWbReceiptItems(html) {
  const items = [];
  const chunks = String(html || '').match(/<div class="products-item[\s\S]*?(?=<div class="products-item|<div class="total"|<\/body>)/gi) || [];

  for (const chunk of chunks) {
    const nameBlock = chunk.match(/<div class="products-cell products-cell_name[\s\S]*?(?=<div class="products-cell products-cell_price)/i)?.[0] || '';
    const cleanNameBlock = nameBlock.replace(/<div class="products-prop-value gray">[\s\S]*?<\/div>/gi, ' ');
    const title = stripTags(cleanNameBlock)
      .replace(/^Наименование\s*/i, '')
      .trim();
    const costBlock = chunk.match(/products-cell_cost[\s\S]*?<div class="products-prop-value">([\s\S]*?)<\/div>/i)?.[1] || '';
    const amount = amountFromText(stripTags(costBlock));

    if (title && amount) {
      items.push({ title, amount, itemIndex: items.length + 1 });
    }
  }

  return items;
}

function isWbServiceItemTitle(title) {
  return /^(услуга доставки|комиссия сервиса)$/i.test(String(title || '').trim());
}

function wbReceiptOperationLabel(html) {
  const header = String(html || '').match(/<h2>\s*Кассовый чек\s*<\/h2>([\s\S]{0,1500})/i)?.[1] || String(html || '').slice(0, 12000);
  const text = stripTags(header);
  if (/возврат прихода/i.test(text)) return 'refund';
  if (/приход/i.test(text)) return 'purchase';
  return '';
}

function wbOperationType(receipt, operationLabel) {
  if (operationLabel === 'refund') return 'refund';
  if (operationLabel === 'purchase') return 'purchase';
  const operationTypeId = Number(receipt?.operationTypeId);
  if (operationTypeId === 1) return 'purchase';
  if (operationTypeId === 2) return 'refund';
  throw new Error(`Wildberries: неизвестный тип операции ${receipt?.operationTypeId ?? 'не указан'}`);
}

function wbDate(rawDate) {
  const text = String(rawDate || '');
  if (!text) return '';
  return text.replace('T', ' ').replace(/Z$/, '').slice(0, 16);
}

function wbFallbackTitle(receipt) {
  return `Wildberries receipt ${receipt.receiptUid || ''}`.trim();
}

async function recordsFromWbReceipt(receipt) {
  const date = wbDate(receipt.operationDateTime);
  const receiptUrl = receipt.link || '';
  let html = '';
  let items = [];
  let operationLabel = '';
  let fallbackReason = '';
  let expectedTotal = Math.abs(Number(receipt.operationSum) || 0);

  if (receiptUrl) {
    html = await fetchText(receiptUrl).catch((error) => {
      fallbackReason = error.message;
      return '';
    });
    if (html) {
      items = parseWbReceiptItems(html);
      operationLabel = wbReceiptOperationLabel(html);
      if (!items.length) fallbackReason = 'состав чека не распознан';
      const parsedTotal = items.reduce((sum, item) => sum + Math.abs(Number(item.amount) || 0), 0);
      if (items.length && expectedTotal && Math.abs(parsedTotal - expectedTotal) > 0.01) {
        fallbackReason = `сумма состава ${parsedTotal.toFixed(2)} не совпала с итогом ${expectedTotal.toFixed(2)}`;
        items = [];
      }
    }
  } else {
    fallbackReason = 'ссылка на чек отсутствует';
  }

  const type = wbOperationType(receipt, operationLabel);
  const isReturn = type === 'refund';

  if (!items.length) {
    const amount = Number(receipt.operationSum) || 0;
    return { rows: [{
      source: 'wildberries',
      month: monthFromDate(date),
      date,
      amount: (isReturn ? -Math.abs(amount) : amount).toFixed(2),
      currency: receipt.currencyNameIso || 'RUB',
      title: `${wbFallbackTitle(receipt)} (состав не распознан)`,
      category: '',
      type,
      is_return: isReturn ? '1' : '0',
      marketplace_id: receipt.receiptUid || '',
      item_index: '1',
      receipt_url: receiptUrl,
      raw_title: `operationTypeId=${receipt.operationTypeId || ''}; fallback=${fallbackReason}`,
      raw_amount: String(receipt.operationSum ?? ''),
      parse_quality: 'fallback'
    }], fallbackReason };
  }

  return { rows: items.map((item) => ({
    source: 'wildberries',
    month: monthFromDate(date),
    date,
    amount: (isReturn ? -Math.abs(item.amount) : item.amount).toFixed(2),
    currency: receipt.currencyNameIso || 'RUB',
    title: item.title,
    category: '',
    type,
    is_return: isReturn ? '1' : '0',
    marketplace_id: receipt.receiptUid || '',
    item_index: String(item.itemIndex || ''),
    receipt_url: receiptUrl,
    raw_title: `operationTypeId=${receipt.operationTypeId || ''}`,
    raw_amount: String(item.amount),
    parse_quality: expectedTotal ? 'complete' : 'unverified'
  })), fallbackReason: '' };
}

async function rowsFromWbReceipts(receipts, concurrencyOption) {
  const concurrency = clampConcurrency(concurrencyOption, 4, 8);
  let completed = 0;
  let itemRows = 0;
  let fallbackReceipts = 0;
  let unverifiedReceipts = 0;
  emitProgress(`Wildberries: HTML-разбор в ${concurrency} потоков.`, 0, receipts.length);

  const results = await mapWithConcurrency(receipts, concurrency, async (receipt) => {
    const result = await recordsFromWbReceipt(receipt);
    const rows = result.rows;
    if (result.fallbackReason) fallbackReceipts += 1;
    if (rows.some((row) => row.parse_quality === 'unverified')) unverifiedReceipts += 1;
    completed += 1;
    itemRows += rows.length;
    if (completed === receipts.length || completed % 5 === 0) {
      emitProgress(
        `Wildberries: чеки ${completed}/${receipts.length}, строк ${itemRows}.`,
        completed,
        receipts.length
      );
    }
    return rows;
  });

  return {
    rows: results.flat(),
    stats: {
      receipts: receipts.length,
      parsedReceipts: receipts.length - fallbackReceipts,
      failedReceipts: fallbackReceipts,
      fallbackReceipts,
      unverifiedReceipts,
      itemRows
    }
  };
}

const yandexReceiptsResolver = 'src/resolvers/orderDocuments/resolveOrderReceiptsByOrderId:resolveOrderReceiptsByOrderId';

function yandexResultData(json, index) {
  return json?.results?.[index]?.data || (index === 0 ? json?.data : {}) || {};
}

function parseYandexReceiptsData(data, orderId) {
  const collection = data.collections?.orderReceipt || {};
  const ids = Array.isArray(data.result) ? data.result : [];
  return ids
    .map((id) => collection[id] || collection[String(id)])
    .filter((receipt) => receipt?.fiscalUrl)
    .map((receipt) => ({
      orderId,
      id: receipt.id || '',
      type: receipt.type || '',
      createdAt: receipt.createdAt || 0,
      fiscalUrl: receipt.fiscalUrl
    }));
}

function yandexRetryDelay(retryAfterValue, attempt) {
  const retryAfter = Number(retryAfterValue);
  if (Number.isFinite(retryAfter) && retryAfter > 60) {
    throw new Error(`Yandex resolve 429: лимит Яндекса, повторите примерно через ${Math.ceil(retryAfter / 60)} мин`);
  }
  if (Number.isFinite(retryAfter) && retryAfter > 0) return Math.min(15000, retryAfter * 1000);
  return Math.min(15000, 1500 * (2 ** attempt));
}

async function fetchYandexResolve(tabId, headers, params, path, pauseMs = 0) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (pauseMs > 0 && attempt === 0) await sleep(pauseMs);

    const [execution] = await chromeCall(api.scripting.executeScript, {
      target: { tabId },
      world: 'MAIN',
      func: async (resolver, clientHeaders, requestParams, requestPath) => {
        function decodeHtml(text) {
          return String(text || '')
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&');
        }

        function headerValue(html, key) {
          const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          return decodeHtml(html).match(new RegExp(`"${escaped}"\\s*:\\s*"([^"]+)"`))?.[1] || '';
        }

        const html = document.documentElement?.innerHTML || '';
        const url = new URL('/api/resolve/', location.origin);
        url.searchParams.set('r', resolver);
        const retpath = new URL(requestPath, location.origin).href;
        const detectedHeaders = {
          'x-market-apphost-target': 'WEB',
          'x-market-core-service': '<UNKNOWN>',
          'x-market-page-id': /^\/my\/order\/\d+/.test(requestPath)
            ? 'market:order'
            : headerValue(html, 'page') || 'market:orders'
        };
        const sk = headerValue(html, 'sk');
        const version = headerValue(html, '-version') || headerValue(html, 'version');
        const frontGlue = headerValue(html, 'marketFrontGlue');
        if (sk) detectedHeaders.sk = sk;
        if (version) detectedHeaders['x-market-app-version'] = version;
        if (frontGlue) detectedHeaders['x-market-front-glue'] = frontGlue;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);
        try {
          const response = await fetch(url.toString(), {
            method: 'POST',
            credentials: 'include',
            referrer: retpath,
            signal: controller.signal,
            headers: {
              accept: '*/*',
              'content-type': 'application/json',
              ...(clientHeaders || {}),
              ...detectedHeaders,
              'x-requested-with': 'XMLHttpRequest',
              'x-retpath-y': retpath
            },
            body: JSON.stringify({
              params: requestParams,
              path: requestPath
            })
          });

          const contentLength = Number(response.headers.get('content-length'));
          if (Number.isFinite(contentLength) && contentLength > 10 * 1024 * 1024) {
            return { ok: false, status: 413, retryAfter: '', text: '', error: 'Yandex resolve response exceeds 10 MB' };
          }
          const text = await response.text();
          if (text.length > 10 * 1024 * 1024) {
            return { ok: false, status: 413, retryAfter: '', text: '', error: 'Yandex resolve response exceeds 10 MB' };
          }

          return {
            ok: response.ok,
            status: response.status,
            retryAfter: response.headers.get('retry-after') || '',
            text
          };
        } catch (error) {
          return {
            ok: false,
            status: 0,
            retryAfter: '',
            text: '',
            error: error.name === 'AbortError' ? 'Yandex resolve timeout 20s' : error.message
          };
        } finally {
          clearTimeout(timeoutId);
        }
      },
      args: [yandexReceiptsResolver, headers || {}, params, path]
    });
    const response = execution?.result || {};

    if (response.ok) {
      if (!response.text) throw new Error(`Yandex resolve ${response.status}: empty response`);
      try {
        return JSON.parse(response.text);
      } catch {
        throw new Error(`Yandex resolve ${response.status}: bad JSON`);
      }
    }

    const retryable = response.status === 429 || response.status >= 500 || response.status === 0;
    if (!retryable || attempt === 2) {
      throw new Error(response.error || `Yandex resolve ${response.status}`);
    }
    const delay = response.status === 429
      ? yandexRetryDelay(response.retryAfter, attempt)
      : Math.min(5000, 750 * (2 ** attempt));
    emitProgress(`Яндекс Маркет: повтор запроса через ${Math.round(delay / 1000)}с.`);
    await sleep(delay);
  }

  throw new Error('Yandex resolve failed');
}

async function fetchYandexReceiptOrder(tabId, headers, orderId, archived, pauseMs) {
  const json = await fetchYandexResolve(
    tabId,
    headers,
    [{ orderId: Number(orderId), archived }],
    `/my/order/${orderId}`,
    pauseMs
  );
  return {
    orderId,
    archived,
    receipts: parseYandexReceiptsData(yandexResultData(json, 0), orderId)
  };
}

async function fetchYandexReceiptOrderSafe(tabId, headers, orderId, pauseMs) {
  let firstError = '';
  try {
    const active = await fetchYandexReceiptOrder(tabId, headers, orderId, false, pauseMs);
    if (active.receipts.length) return active;
  } catch (error) {
    firstError = error.message;
    if (/429|лимит Яндекса|timeout/i.test(firstError)) return { orderId, receipts: [], error: firstError };
  }

  try {
    return await fetchYandexReceiptOrder(tabId, headers, orderId, true, pauseMs);
  } catch (error) {
    return {
      orderId,
      receipts: [],
      error: [firstError, error.message].filter(Boolean).join('; ')
    };
  }
}

async function collectYandexReceipts(metadata, options = {}) {
  if (!options.tabId) throw new Error('Яндекс Маркет: вкладка для получения чеков закрыта.');
  const ids = [...new Set(metadata.orderIds || [])];
  const headers = metadata.headers || {};
  const receiptsByUrl = new Map();
  const failedByOrder = new Map();
  let archivedOrders = 0;
  let noReceiptOrders = 0;
  let completed = 0;
  const concurrency = clampConcurrency(options.receiptConcurrency, 1, 2);
  const pauseMs = Math.max(0, Number(options.apiPauseMs) || 0);
  emitProgress(`Яндекс Маркет: получаю ссылки на чеки в ${concurrency} потоков, заказов ${ids.length}.`, 0, ids.length);

  await mapWithConcurrency(ids, concurrency, async (orderId) => {
    const result = await fetchYandexReceiptOrderSafe(options.tabId, headers, orderId, pauseMs);
    if (result.error) {
      failedByOrder.set(result.orderId, result.error);
    } else if (!result.receipts.length) {
      noReceiptOrders += 1;
    } else {
      if (result.archived) archivedOrders += 1;
      for (const receipt of result.receipts) receiptsByUrl.set(receipt.fiscalUrl, receipt);
      failedByOrder.delete(result.orderId);
    }
    completed += 1;
    if (completed === ids.length || completed % 20 === 0) {
      emitProgress(`Яндекс Маркет: чеки ${completed}/${ids.length}, ссылок ${receiptsByUrl.size}.`, completed, ids.length);
    }
  });

  const failedOrders = failedByOrder.size;

  if (!receiptsByUrl.size) {
    throw new Error(`Яндекс Маркет: ссылки на чеки не найдены. Заказов проверено: ${ids.length}, ошибок: ${failedOrders}.`);
  }

  return {
    receipts: [...receiptsByUrl.values()],
    stats: {
      orders: ids.length,
      receipts: receiptsByUrl.size,
      archivedOrders,
      noReceiptOrders,
      failedOrders
    }
  };
}

function parseYandexDate(rawDate, fallbackMs = 0) {
  const match = String(rawDate || '').match(/(\d{2})\.(\d{2})\.(\d{2,4})\s+(\d{2}):(\d{2})/);
  if (match) {
    const year = match[3].length === 2 ? `20${match[3]}` : match[3];
    return `${year}-${match[2]}-${match[1]} ${match[4]}:${match[5]}`;
  }

  const date = new Date(Number(fallbackMs) || 0);
  if (!Number.isFinite(date.getTime()) || date.getTime() <= 0) return '';
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-') + ` ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function normalizeYandexText(text) {
  return String(text || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u00a0|\u202f/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function yandexSettlementKind(text) {
  const normalized = normalizeYandexText(text);
  if (/полны[ий]\s+расчет/.test(normalized)) return 'full';
  if (/предоплат|аванс/.test(normalized)) return 'prepayment';
  return '';
}

function parseYandexReceiptItems(html) {
  const table = String(html || '').match(/<table[^>]+class="receipt-table"[\s\S]*?<\/table>/i)?.[0] || '';
  const rows = table.match(/<tr[\s\S]*?<\/tr>/gi) || [];
  const items = [];

  for (const row of rows) {
    const cells = [...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((match) => match[1]);
    if (cells.length < 6 || !/^\d+\.$/.test(stripTags(cells[0]))) continue;

    const title = stripTags(String(cells[1]).split(/<br\s*\/?>/i)[0]).trim();
    const amount = amountFromText(stripTags(cells[cells.length - 1]));
    if (!title || !amount) continue;
    items.push({
      title,
      amount,
      itemIndex: items.length + 1,
      settlementKind: yandexSettlementKind(cells[1])
    });
  }

  return items;
}

function isYandexServiceItemTitle(title) {
  return /^(доставк.*|сервисный сбор|работа сервиса)$/i.test(String(title || '').trim());
}

function yandexReceiptDate(html, receipt) {
  const dateRow = String(html || '').match(/Смена\s+N[\s\S]*?<\/tr>/i)?.[0] || '';
  return parseYandexDate(stripTags(dateRow), receipt.createdAt);
}

function isYandexReturnReceipt(html, receipt) {
  const header = stripTags(String(html || '').match(/<div[^>]+class="header"[\s\S]*?<\/div>/i)?.[0] || '');
  return /возврат/i.test(header) || /RETURN|REFUND/i.test(receipt.type || '');
}

function yandexReceiptId(url) {
  try {
    const parsed = new URL(url);
    return ['fn', 'fpd', 'n'].map((key) => parsed.searchParams.get(key) || '').join(':');
  } catch {
    return url || '';
  }
}

function rowsFromYandexReceiptHtml(receipt, html) {
  const date = yandexReceiptDate(html, receipt);
  const isReturn = isYandexReturnReceipt(html, receipt);
  const items = parseYandexReceiptItems(html);
  const totalRow = (String(html || '').match(/<tr\b[^>]*>[\s\S]*?ИТОГ[\s\S]*?<\/tr>/i) || [])[0] || '';
  const totalCells = [...totalRow.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((match) => match[1]);
  const receiptTotal = totalCells.length ? amountFromText(stripTags(totalCells.at(-1))) : 0;
  const parsedTotal = items.reduce((sum, item) => sum + Math.abs(Number(item.amount) || 0), 0);
  const incomplete = !items.length || (receiptTotal && Math.abs(parsedTotal - Math.abs(receiptTotal)) > 0.01);
  const itemSettlementKinds = [...new Set(items.map((item) => item.settlementKind).filter(Boolean))];
  const fallbackSettlementKind = itemSettlementKinds.length === 1
    ? itemSettlementKinds[0]
    : yandexSettlementKind(html);

  if (incomplete && receiptTotal) {
    return [{
      source: 'yandex',
      month: monthFromDate(date),
      date,
      amount: (isReturn ? -Math.abs(receiptTotal) : Math.abs(receiptTotal)).toFixed(2),
      currency: 'RUB',
      title: `Яндекс Маркет: чек ${receipt.orderId || ''} (состав не распознан)`.trim(),
      category: '',
      type: isReturn ? 'refund' : 'purchase',
      is_return: isReturn ? '1' : '0',
      marketplace_id: `${receipt.orderId || ''}:${receipt.id || yandexReceiptId(receipt.fiscalUrl)}`,
      item_index: '1',
      receipt_url: receipt.fiscalUrl || '',
      raw_title: `orderId=${receipt.orderId || ''} receiptType=${receipt.type || ''}; fallback=receipt_total_mismatch`,
      raw_amount: String(receiptTotal),
      parse_quality: 'fallback',
      __yandexOrderId: String(receipt.orderId || ''),
      __yandexSettlementKind: fallbackSettlementKind
    }];
  }

  const parseQuality = receiptTotal ? 'complete' : 'unverified';
  return items.map((item) => ({
    source: 'yandex',
    month: monthFromDate(date),
    date,
    amount: (isReturn ? -Math.abs(item.amount) : item.amount).toFixed(2),
    currency: 'RUB',
    title: item.title,
    category: '',
    type: isReturn ? 'refund' : 'purchase',
    is_return: isReturn ? '1' : '0',
    marketplace_id: `${receipt.orderId || ''}:${receipt.id || yandexReceiptId(receipt.fiscalUrl)}`,
    item_index: String(item.itemIndex || ''),
    receipt_url: receipt.fiscalUrl || '',
    raw_title: `orderId=${receipt.orderId || ''} receiptType=${receipt.type || ''}`,
    raw_amount: String(item.amount),
    __yandexOrderId: String(receipt.orderId || ''),
    __yandexSettlementKind: item.settlementKind || '',
    parse_quality: parseQuality
  }));
}

function yandexAmountCents(value) {
  return Math.round(amountFromText(value) * 100);
}

function yandexDedupKey(row) {
  return [
    row.__yandexOrderId || row.marketplace_id || '',
    normalizeYandexText(row.title),
    Math.abs(yandexAmountCents(row.amount)),
    Math.sign(yandexAmountCents(row.amount))
  ].join('\u0001');
}

function filterYandexRows(rows) {
  const groups = new Map();
  for (const row of rows) {
    const key = yandexDedupKey(row);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }

  const filtered = [];
  const fullAvailableCents = new Map();
  let prepaymentRowsDropped = 0;
  let aggregatePrepaymentRowsAdjusted = 0;
  let aggregatePrepaymentRowsDropped = 0;
  const supersededReceipts = new Set();

  for (const group of groups.values()) {
    const fullRows = group
      .filter((row) => row.__yandexSettlementKind === 'full' && yandexAmountCents(row.amount) > 0)
      .sort((left, right) => String(left.date || '').localeCompare(String(right.date || '')));
    for (const row of fullRows) fullAvailableCents.set(row, yandexAmountCents(row.amount));
    const suppressed = new Set();
    for (const fullRow of fullRows) {
      const match = group
        .filter((row) => row.parse_quality !== 'fallback'
          && row.__yandexSettlementKind === 'prepayment'
          && String(row.date || '') <= String(fullRow.date || '')
          && !suppressed.has(row))
        .sort((left, right) => String(right.date || '').localeCompare(String(left.date || '')))[0];
      if (!match) continue;
      suppressed.add(match);
      fullAvailableCents.set(fullRow, 0);
      prepaymentRowsDropped += 1;
    }
    for (const row of group) {
      if (suppressed.has(row)) continue;
      filtered.push(row);
    }
  }

  const fallbackResiduals = new Map(filtered
    .filter((row) => row.parse_quality === 'fallback'
      && row.__yandexSettlementKind === 'prepayment'
      && yandexAmountCents(row.amount) > 0)
    .map((row) => [row, yandexAmountCents(row.amount)]));

  for (const fullRow of [...fullAvailableCents.keys()]
    .sort((left, right) => String(left.date || '').localeCompare(String(right.date || '')))) {
    let remaining = fullAvailableCents.get(fullRow) || 0;
    if (!remaining) continue;
    const candidates = [...fallbackResiduals.keys()]
      .filter((row) => row.__yandexOrderId === fullRow.__yandexOrderId
        && String(row.date || '') <= String(fullRow.date || '')
        && fallbackResiduals.get(row) > 0)
      .sort((left, right) => String(right.date || '').localeCompare(String(left.date || '')));
    for (const fallbackRow of candidates) {
      if (!remaining) break;
      const residual = fallbackResiduals.get(fallbackRow);
      const consumed = Math.min(residual, remaining);
      fallbackResiduals.set(fallbackRow, residual - consumed);
      remaining -= consumed;
    }
  }

  const balanced = [];
  for (const row of filtered) {
    if (fallbackResiduals.has(row)) {
      const amountCents = yandexAmountCents(row.amount);
      const residualCents = fallbackResiduals.get(row);
      if (!residualCents) {
        aggregatePrepaymentRowsDropped += 1;
        const receipt = String(row.receipt_url || row.marketplace_id || '').trim();
        if (receipt) supersededReceipts.add(receipt);
        continue;
      }
      if (residualCents !== amountCents) {
        aggregatePrepaymentRowsAdjusted += 1;
        const receipt = String(row.receipt_url || row.marketplace_id || '').trim();
        if (receipt) supersededReceipts.add(receipt);
        balanced.push({
          ...row,
          amount: (residualCents / 100).toFixed(2),
          raw_amount: (residualCents / 100).toFixed(2)
        });
        continue;
      }
    }
    balanced.push(row);
  }

  return {
    rows: balanced.map(({ __yandexOrderId, __yandexSettlementKind, ...row }) => row),
    prepaymentRowsDropped,
    aggregatePrepaymentRowsAdjusted,
    aggregatePrepaymentRowsDropped,
    supersededReceipts: [...supersededReceipts]
  };
}

async function rowsFromYandexReceipts(receipts, concurrencyOption) {
  const concurrency = clampConcurrency(concurrencyOption, 4, 8);
  const failed = [];
  let completed = 0;
  let parsedReceipts = 0;
  let fallbackReceipts = 0;
  let unverifiedReceipts = 0;
  emitProgress(`Яндекс Маркет: HTML-разбор в ${concurrency} потоков.`, 0, receipts.length);

  async function fetchYandexReceiptHtml(url) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await fetchText(url);
      } catch (error) {
        if (!/^429\b/.test(error.message) || attempt === 2) throw error;
        await sleep(1500 * (attempt + 1));
      }
    }
    return '';
  }

  const results = await mapWithConcurrency(receipts, concurrency, async (receipt) => {
    try {
      const html = await fetchYandexReceiptHtml(receipt.fiscalUrl);
      const rows = rowsFromYandexReceiptHtml(receipt, html);
      if (rows.length && !rows.some((row) => row.parse_quality === 'fallback')) {
        parsedReceipts += 1;
        if (rows.some((row) => row.parse_quality === 'unverified')) unverifiedReceipts += 1;
      }
      else {
        failed.push({ receipt, reason: rows.length ? 'receipt_total_mismatch' : 'no_items' });
        if (rows.length) fallbackReceipts += 1;
      }
      return rows;
    } catch (error) {
      failed.push({ receipt, reason: error.message });
      return [];
    } finally {
      completed += 1;
      if (completed === receipts.length || completed % 5 === 0) {
        emitProgress(`Яндекс Маркет: чеки ${completed}/${receipts.length}, разобрано ${parsedReceipts}, ошибок ${failed.length}.`, completed, receipts.length);
      }
    }
  });

  const filtered = filterYandexRows(results.flat());
  if (filtered.prepaymentRowsDropped) {
    emitProgress(`Яндекс Маркет: отброшено дублей предоплаты ${filtered.prepaymentRowsDropped}.`, receipts.length, receipts.length);
  }

  return {
    rows: filtered.rows,
    supersededReceipts: filtered.supersededReceipts,
    stats: {
      receipts: receipts.length,
      parsedReceipts,
      failedReceipts: failed.length,
      fallbackReceipts,
      unverifiedReceipts,
      itemRows: filtered.rows.length,
      prepaymentRowsDropped: filtered.prepaymentRowsDropped,
      aggregatePrepaymentRowsAdjusted: filtered.aggregatePrepaymentRowsAdjusted,
      aggregatePrepaymentRowsDropped: filtered.aggregatePrepaymentRowsDropped
    }
  };
}

async function collectSpend({ sources, options }) {
  const rows = [];
  const warnings = [];
  const stats = {};
  const supersededReceiptKeys = [];
  const jobs = [];
  const knownReceipts = options.knownReceipts || {};
  const knownReceiptTail = options.knownReceiptTail;

  if (sources.includes('ozon')) {
    jobs.push(trackSourceProgress('ozon', async () => {
      emitProgress('Ozon: открываю вкладку и собираю чеки...', 0, sources.length);
      const result = await collectFromTab('ozon', {
        maxPages: options.ozonMaxPages,
        parsePdf: options.ozonParsePdf !== false,
        pdfConcurrency: options.ozonPdfConcurrency,
        apiPauseMs: options.ozonApiPauseMs,
        knownReceipts: knownReceipts.ozon || [],
        knownReceiptTail
      });
      return {
        rows: result.rows || [],
        stats: result.stats || {},
        supersededReceipts: result.supersededReceipts || []
      };
    }));
  }

  if (sources.includes('wildberries')) {
    jobs.push(trackSourceProgress('wildberries', async () => {
      emitProgress('Wildberries: открываю вкладку и собираю чеки...', 0, sources.length);
      const result = await collectFromTab('wildberries', {
        maxPages: options.wbMaxPages,
        pageSize: options.wbPageSize,
        apiPauseMs: options.wbApiPauseMs,
        knownReceipts: knownReceipts.wildberries || [],
        knownReceiptTail
      });
      const parsed = await rowsFromWbReceipts(result.receipts || [], options.wbReceiptConcurrency);
      return {
        rows: parsed.rows,
        stats: { ...(result.stats || {}), ...(parsed.stats || {}) }
      };
    }));
  }

  if (sources.includes('yandex')) {
    jobs.push(trackSourceProgress('yandex', async () => {
      emitProgress('Яндекс Маркет: открываю вкладку и собираю чеки...', 0, sources.length);
      const { response: metadata, managedTab } = await collectFromTabKeepOpen('yandex', {
        maxPages: options.yandexMaxPages,
        receiptConcurrency: options.yandexReceiptConcurrency,
        apiPauseMs: options.yandexApiPauseMs,
        metadataOnly: true,
        knownOrderIds: knownReceipts.yandexOrders || [],
        knownReceiptTail
      });
      try {
        const result = await collectYandexReceipts(metadata, {
          tabId: managedTab.tab.id,
          receiptConcurrency: options.yandexReceiptConcurrency,
          apiPauseMs: options.yandexApiPauseMs
        });
        const parsed = await rowsFromYandexReceipts(result.receipts || [], 4);
        return {
          rows: parsed.rows,
          supersededReceipts: parsed.supersededReceipts || [],
          stats: {
            ...(metadata.stats || {}),
            ...(result.stats || {}),
            ...(parsed.stats || {})
          }
        };
      } finally {
        await closeManagedTab(managedTab, 'yandex');
      }
    }));
  }

  const results = await Promise.all(jobs.map((job) => job
    .then((result) => ({ ok: true, result }))
    .catch((error) => ({ ok: false, error }))));

  for (const item of results) {
    if (item.ok) {
      rows.push(...item.result.rows);
      stats[item.result.source] = item.result.stats;
      for (const receipt of item.result.supersededReceipts || []) {
        const value = String(receipt || '').trim();
        if (value) supersededReceiptKeys.push(`${item.result.source}\u0001${value}`);
      }
      const label = progressSourceLabels[item.result.source] || item.result.source;
      if (item.result.stats?.limitReached) {
        warnings.push(`${label}: достигнут лимит страниц; часть старых операций могла не попасть в отчёт`);
      }
      if (item.result.stats?.paginationIncomplete) {
        const detail = String(item.result.stats.paginationError || '').trim();
        warnings.push(`${label}: список заказов загружен не полностью${detail ? ` (${detail})` : ''}`);
      }
      if (Number(item.result.stats?.fallbackReceipts) > 0) {
        warnings.push(`${label}: состав не распознан у чеков ${Number(item.result.stats.fallbackReceipts)}; сохранены только итоговые суммы`);
      } else if (Number(item.result.stats?.failedReceipts) > 0) {
        warnings.push(`${label}: не разобрано чеков ${Number(item.result.stats.failedReceipts)}`);
      }
      if (Number(item.result.stats?.unverifiedReceipts) > 0) {
        warnings.push(`${label}: у чеков ${Number(item.result.stats.unverifiedReceipts)} не распознан итог; строки сохранены, но полнота состава не подтверждена`);
      }
      const aggregateAdjusted = Number(item.result.stats?.aggregatePrepaymentRowsAdjusted) || 0;
      const aggregateDropped = Number(item.result.stats?.aggregatePrepaymentRowsDropped) || 0;
      if (aggregateAdjusted || aggregateDropped) {
        warnings.push(`${label}: агрегатная предоплата сверена с полным расчётом; скорректировано ${aggregateAdjusted}, погашено ${aggregateDropped}`);
      }
    } else {
      warnings.push(item.error.message);
    }
  }

  if (!rows.length && warnings.length) {
    throw new Error(warnings.join('; '));
  }

  return { rows, warnings, stats, sources: [...sources], supersededReceiptKeys };
}

async function startCollectJob(sources, options) {
  const jobId = createCollectJobId();
  const generation = collectJobGeneration;
  const job = {
    status: 'running',
    result: null,
    error: ''
  };
  collectJobs.set(jobId, job);
  try {
    await persistCollectJob(jobId, job);
  } catch (error) {
    collectJobs.delete(jobId);
    throw persistenceError(error);
  }

  collectSpend({ sources, options })
    .then(async (result) => {
      if (generation !== collectJobGeneration) return;
      job.status = 'done';
      job.result = result;
      try {
        await persistCollectJob(jobId, job);
      } catch (error) {
        job.status = 'error';
        job.result = null;
        job.error = persistenceError(error).message;
        try {
          await persistCollectJob(jobId, job);
        } catch (stateError) {
          job.error = `${job.error} Состояние доступно только до закрытия фонового процесса: ${stateError.message}`;
        }
      }
    }, async (error) => {
      if (generation !== collectJobGeneration) return;
      job.status = 'error';
      job.error = error.message;
      try {
        await persistCollectJob(jobId, job);
      } catch (stateError) {
        job.error = `${job.error} Состояние доступно только до закрытия фонового процесса: ${stateError.message}`;
      }
    });

  return jobId;
}

if (api?.action?.onClicked) {
  api.action.onClicked.addListener(() => {
    openAppPage().catch(() => {});
  });
}

if (api?.runtime?.onMessage) {
  api.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const appMessageTypes = new Set([
      'SPEND_CLEAR_COLLECT_JOBS',
      'SPEND_COLLECT_START',
      'SPEND_COLLECT_STATUS',
      'SPEND_COLLECT_ACK',
      'SPEND_COLLECT'
    ]);
    const trustedApp = sender?.id === api.runtime.id
      && sender?.url === api.runtime.getURL('app.html');
    if (appMessageTypes.has(message?.type) && !trustedApp) {
      sendResponse({ ok: false, error: 'Недопустимый запрос приложения.' });
      return false;
    }

    if (message?.type === 'SPEND_CLEAR_COLLECT_JOBS') {
      clearCollectJobs()
        .then(() => sendResponse({ ok: true }))
        .catch((error) => sendResponse({ ok: false, error: error.message }));
      return true;
    }

    if (message?.type === 'SPEND_GET_COOKIE') {
      const allowedCookieUrls = new Set([
        'https://www.wildberries.ru/',
        'https://wildberries.ru/',
        'https://astro.wildberries.ru/'
      ]);
      const senderUrl = String(sender?.tab?.url || '');
      const trustedSender = sender?.id === api.runtime.id
        && /^https:\/\/(?:www\.)?wildberries\.ru\//i.test(senderUrl);
      if (!trustedSender || message.name !== 'wbid-sdk-id-token' || !allowedCookieUrls.has(message.url)) {
        sendResponse({ ok: false, error: 'Недопустимый запрос cookie.' });
        return false;
      }
      chromeCall(api.cookies.get, {
        url: message.url,
        name: message.name
      })
        .then((cookie) => sendResponse({ ok: true, value: cookie?.value || '' }))
        .catch((error) => sendResponse({ ok: false, error: error.message }));
      return true;
    }

    if (message?.type === 'SPEND_OPEN_APP') {
      openAppPage()
        .then(() => sendResponse({ ok: true }))
        .catch((error) => sendResponse({ ok: false, error: error.message }));
      return true;
    }

    if (message?.type === 'SPEND_COLLECT_START') {
      startCollectJob(
          Array.isArray(message.sources) ? message.sources : [],
          message.options || {}
        )
        .then((jobId) => sendResponse({ ok: true, jobId }))
        .catch((error) => sendResponse({ ok: false, error: error.message }));
      return true;
    }

    if (message?.type === 'SPEND_COLLECT_STATUS') {
      collectJobResponse(message.jobId)
        .then(sendResponse)
        .catch((error) => sendResponse({ ok: false, error: error.message }));
      return true;
    }

    if (message?.type === 'SPEND_COLLECT_ACK') {
      acknowledgeCollectJob(message.jobId)
        .then(() => sendResponse({ ok: true }))
        .catch((error) => sendResponse({ ok: false, error: error.message }));
      return true;
    }

    if (message?.type !== 'SPEND_COLLECT') return false;

    startCollectJob(
      Array.isArray(message.sources) ? message.sources : [],
      message.options || {}
    )
      .then((jobId) => sendResponse({ ok: true, jobId }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  });
}

if (typeof module !== 'undefined') {
  module.exports = {
    allowedReceiptUrl,
    parseWbReceiptItems,
    wbOperationType,
    filterYandexRows,
    rowsFromYandexReceiptHtml
  };
}
