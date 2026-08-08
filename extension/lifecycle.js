(function exposeLifecycle(root, factory) {
  const exported = factory();
  if (typeof module === 'object' && module.exports) module.exports = exported;
  if (root) root.KuplenoLifecycle = exported;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  'use strict';

  const MONTH_STATUSES = Object.freeze(['open', 'needs-review', 'closed']);
  const ARCHIVE_KINDS = Object.freeze(['receipt', 'warranty']);
  const ARCHIVE_STATUSES = Object.freeze(['active', 'expiring', 'expired']);
  const RETURN_STATUSES = Object.freeze(['pending', 'partial', 'disputed', 'received', 'overdue']);
  const FORBIDDEN_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
  const DAY_MS = 24 * 60 * 60 * 1000;

  function own(value, key) {
    return Object.prototype.hasOwnProperty.call(value, key);
  }

  function isPlainObject(value) {
    if (!value || typeof value !== 'object') return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  }

  function assertJsonValue(value, path = 'value', state = { ancestors: new WeakSet(), nodes: 0 }, depth = 0) {
    state.nodes += 1;
    if (state.nodes > 100000 || depth > 20) throw new TypeError(`${path}: слишком сложное JSON-значение.`);
    if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) throw new TypeError(`${path}: число должно быть конечным.`);
      return;
    }
    if (typeof value !== 'object' || (!Array.isArray(value) && !isPlainObject(value))) {
      throw new TypeError(`${path}: допускаются только JSON-совместимые значения.`);
    }
    if (state.ancestors.has(value)) throw new TypeError(`${path}: циклическая ссылка недопустима.`);
    if (Object.getOwnPropertySymbols(value).length) throw new TypeError(`${path}: символьные поля недопустимы.`);

    state.ancestors.add(value);
    for (const key of Array.isArray(value) ? [...value.keys()].map(String) : Object.keys(value)) {
      if (FORBIDDEN_KEYS.has(key)) throw new TypeError(`${path}.${key}: небезопасное имя поля.`);
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !own(descriptor, 'value')) throw new TypeError(`${path}.${key}: вычисляемые поля недопустимы.`);
      assertJsonValue(descriptor.value, `${path}.${key}`, state, depth + 1);
    }
    state.ancestors.delete(value);
  }

  function clone(value) {
    assertJsonValue(value);
    return JSON.parse(JSON.stringify(value));
  }

  function assertObject(value, path) {
    assertJsonValue(value, path);
    if (!isPlainObject(value)) throw new TypeError(`${path}: ожидается обычный объект.`);
  }

  function assertKnownKeys(value, allowed, path) {
    for (const key of Object.keys(value)) {
      if (!allowed.has(key)) throw new TypeError(`${path}.${key}: неподдерживаемое поле.`);
    }
  }

  function stringValue(value, path, options = {}) {
    const text = String(value ?? '').trim();
    const maxLength = options.maxLength || 500;
    if (options.required && !text) throw new TypeError(`${path}: ожидается непустая строка.`);
    if (text.length > maxLength) throw new TypeError(`${path}: строка длиннее ${maxLength} символов.`);
    return text;
  }

  function money(value, path, options = {}) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || (options.positive ? parsed <= 0 : false)) {
      throw new TypeError(`${path}: ожидается ${options.positive ? 'положительное' : 'конечное'} число.`);
    }
    return roundMoney(parsed);
  }

  function roundMoney(value) {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  }

  function dayValue(value, path) {
    const text = String(value || '').trim();
    const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) throw new TypeError(`${path}: ожидается дата YYYY-MM-DD.`);
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (year < 1900 || month < 1 || month > 12 || day < 1 || day > new Date(Date.UTC(year, month, 0)).getUTCDate()) {
      throw new TypeError(`${path}: ожидается существующая дата YYYY-MM-DD.`);
    }
    return text;
  }

  function nowDay(value, path = 'now') {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return dayValue(value, path);
    const date = value instanceof Date ? value : new Date(value === undefined ? Date.now() : value);
    if (!Number.isFinite(date.getTime())) throw new TypeError(`${path}: некорректная дата.`);
    return date.toISOString().slice(0, 10);
  }

  function addDays(day, days) {
    const value = dayValue(day, 'date');
    const amount = Number(days);
    if (!Number.isSafeInteger(amount)) throw new TypeError('days: ожидается целое число.');
    const date = new Date(`${value}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + amount);
    return date.toISOString().slice(0, 10);
  }

  function monthKey(value, path = 'month') {
    const text = String(value || '').trim();
    const match = text.match(/^(\d{4})-(\d{2})$/);
    if (!match || Number(match[2]) < 1 || Number(match[2]) > 12) {
      throw new TypeError(`${path}: ожидается месяц YYYY-MM.`);
    }
    return text;
  }

  function monthFromDay(day) {
    return dayValue(day, 'date').slice(0, 7);
  }

  function nextMonth(month) {
    const value = monthKey(month);
    const year = Number(value.slice(0, 4));
    const number = Number(value.slice(5, 7));
    return `${number === 12 ? year + 1 : year}-${String(number === 12 ? 1 : number + 1).padStart(2, '0')}`;
  }

  function validateMonthClosure(value) {
    assertObject(value, 'closure');
    assertKnownKeys(value, new Set(['version', 'month', 'status', 'totals', 'review', 'closedAt', 'reopenedAt', 'previousTotals']), 'closure');
    const month = monthKey(value.month, 'closure.month');
    const status = String(value.status || '').trim();
    if (!MONTH_STATUSES.includes(status)) throw new TypeError('closure.status: неизвестный статус месяца.');
    if (value.totals !== null && value.totals !== undefined) validateTotals(value.totals, 'closure.totals');
    if (value.previousTotals !== null && value.previousTotals !== undefined) validateTotals(value.previousTotals, 'closure.previousTotals');
    if (value.closedAt !== null && value.closedAt !== undefined) dayValue(value.closedAt, 'closure.closedAt');
    if (value.reopenedAt !== null && value.reopenedAt !== undefined) dayValue(value.reopenedAt, 'closure.reopenedAt');
    return clone(value);
  }

  function validateTotals(value, path) {
    assertObject(value, path);
    assertKnownKeys(value, new Set(['rowCount', 'excludedCount', 'purchaseCount', 'refundCount', 'grossSpend', 'refundAmount', 'netSpend', 'categories']), path);
    for (const key of ['rowCount', 'excludedCount', 'purchaseCount', 'refundCount', 'grossSpend', 'refundAmount', 'netSpend']) {
      if (!Number.isFinite(Number(value[key]))) throw new TypeError(`${path}.${key}: ожидается конечное число.`);
    }
    if (!Array.isArray(value.categories)) throw new TypeError(`${path}.categories: ожидается массив.`);
    value.categories.forEach((item, index) => {
      assertObject(item, `${path}.categories[${index}]`);
      assertKnownKeys(item, new Set(['category', 'grossSpend', 'refundAmount', 'netSpend']), `${path}.categories[${index}]`);
      stringValue(item.category, `${path}.categories[${index}].category`, { required: true, maxLength: 200 });
      for (const key of ['grossSpend', 'refundAmount', 'netSpend']) money(item[key], `${path}.categories[${index}].${key}`);
    });
  }

  function createMonthClosure(month) {
    return {
      version: 1,
      month: monthKey(month),
      status: 'open',
      totals: null,
      review: { issues: [] },
      closedAt: null,
      reopenedAt: null,
      previousTotals: null
    };
  }

  function rowDate(row, path) {
    const text = String(row?.date || '').slice(0, 10);
    return dayValue(text, `${path}.date`);
  }

  function rowType(row) {
    return String(row?.type || '').trim().toLowerCase() === 'refund' || Number(row?.amount) < 0 ? 'refund' : 'purchase';
  }

  function fixedTotals(rows, month) {
    const categories = new Map();
    const issues = [];
    let rowCount = 0;
    let excludedCount = 0;
    let purchaseCount = 0;
    let refundCount = 0;
    let grossSpend = 0;
    let refundAmount = 0;

    (Array.isArray(rows) ? rows : []).forEach((row, index) => {
      assertObject(row, `rows[${index}]`);
      const date = rowDate(row, `rows[${index}]`);
      if (monthFromDay(date) !== month) return;
      if (row.excluded === true) {
        excludedCount += 1;
        return;
      }
      const amount = Math.abs(money(row.amount, `rows[${index}].amount`));
      const type = rowType(row);
      const category = stringValue(row.category, `rows[${index}].category`, { maxLength: 200 }) || 'unknown';
      const current = categories.get(category) || { category, grossSpend: 0, refundAmount: 0, netSpend: 0 };
      rowCount += 1;
      if (type === 'refund') {
        refundCount += 1;
        refundAmount += amount;
        current.refundAmount += amount;
        current.netSpend -= amount;
      } else {
        purchaseCount += 1;
        grossSpend += amount;
        current.grossSpend += amount;
        current.netSpend += amount;
      }
      categories.set(category, current);
      if (category === 'unknown' || row.category_needs_review === true) issues.push({ rowId: String(row.rowId || ''), code: 'category-needs-review' });
      if (row.parse_quality === 'fallback') issues.push({ rowId: String(row.rowId || ''), code: 'fallback-parser' });
    });

    return {
      totals: {
        rowCount,
        excludedCount,
        purchaseCount,
        refundCount,
        grossSpend: roundMoney(grossSpend),
        refundAmount: roundMoney(refundAmount),
        netSpend: roundMoney(grossSpend - refundAmount),
        categories: [...categories.values()]
          .map((item) => ({ ...item, grossSpend: roundMoney(item.grossSpend), refundAmount: roundMoney(item.refundAmount), netSpend: roundMoney(item.netSpend) }))
          .sort((left, right) => right.netSpend - left.netSpend || left.category.localeCompare(right.category, 'ru'))
      },
      issues
    };
  }

  function closeMonth(closure, rows, options = {}) {
    const current = validateMonthClosure(closure);
    if (current.status === 'closed') throw new Error('Закрытый месяц сначала нужно повторно открыть.');
    assertObject(options, 'options');
    const today = nowDay(options.now);
    const result = fixedTotals(rows, current.month);
    const approved = options.confirmReview === true;
    const status = result.issues.length && !approved ? 'needs-review' : 'closed';
    return {
      version: 1,
      month: current.month,
      status,
      totals: result.totals,
      review: { issues: result.issues },
      closedAt: status === 'closed' ? today : null,
      reopenedAt: current.reopenedAt || null,
      previousTotals: current.previousTotals || null
    };
  }

  function reopenMonth(closure, options = {}) {
    const current = validateMonthClosure(closure);
    if (current.status === 'open') return current;
    assertObject(options, 'options');
    return {
      version: 1,
      month: current.month,
      status: 'open',
      totals: null,
      review: { issues: [] },
      closedAt: null,
      reopenedAt: nowDay(options.now),
      previousTotals: current.totals || current.previousTotals || null
    };
  }

  const archiveFields = new Set(['id', 'kind', 'rowId', 'marketplace_id', 'source', 'title', 'issuedAt', 'expiresAt', 'url', 'note', 'addedAt']);

  function normalizeArchiveRecord(record, options = {}) {
    assertObject(record, 'record');
    assertKnownKeys(record, archiveFields, 'record');
    assertObject(options, 'options');
    const id = stringValue(record.id, 'record.id', { required: true, maxLength: 160 });
    const kind = stringValue(record.kind, 'record.kind', { required: true, maxLength: 30 });
    if (!ARCHIVE_KINDS.includes(kind)) throw new TypeError('record.kind: ожидается receipt или warranty.');
    const rowId = stringValue(record.rowId, 'record.rowId', { maxLength: 200 });
    const marketplaceId = stringValue(record.marketplace_id, 'record.marketplace_id', { maxLength: 300 });
    if (!rowId && !marketplaceId) throw new TypeError('record: нужна привязка rowId или marketplace_id.');
    const url = stringValue(record.url, 'record.url', { maxLength: 2048 });
    if (url && !/^https?:\/\/[^\s]+$/i.test(url)) throw new TypeError('record.url: ожидается HTTP(S)-ссылка; бинарные вложения не поддерживаются.');
    const expiresAt = record.expiresAt ? dayValue(record.expiresAt, 'record.expiresAt') : null;
    const issuedAt = record.issuedAt ? dayValue(record.issuedAt, 'record.issuedAt') : null;
    if (issuedAt && expiresAt && expiresAt < issuedAt) throw new TypeError('record.expiresAt: не может быть раньше даты выдачи.');
    const normalized = {
      id,
      kind,
      rowId: rowId || null,
      marketplace_id: marketplaceId || null,
      source: stringValue(record.source, 'record.source', { maxLength: 64 }) || null,
      title: stringValue(record.title, 'record.title', { required: true, maxLength: 500 }),
      issuedAt,
      expiresAt,
      url: url || null,
      note: stringValue(record.note, 'record.note', { maxLength: 4000 }) || null,
      addedAt: record.addedAt ? dayValue(record.addedAt, 'record.addedAt') : nowDay(options.now)
    };
    return normalized;
  }

  function archiveStatus(record, options = {}) {
    const normalized = normalizeArchiveRecord(record, options);
    const today = nowDay(options.now);
    const expiringDays = Number(options.expiringDays === undefined ? 30 : options.expiringDays);
    if (!Number.isSafeInteger(expiringDays) || expiringDays < 0) throw new TypeError('options.expiringDays: ожидается неотрицательное целое число.');
    if (!normalized.expiresAt || normalized.expiresAt > addDays(today, expiringDays)) return 'active';
    return normalized.expiresAt < today ? 'expired' : 'expiring';
  }

  function buildArchive(records, options = {}) {
    if (!Array.isArray(records)) throw new TypeError('records: ожидается массив.');
    const entries = records.map((record) => {
      const normalized = normalizeArchiveRecord(record, options);
      return { ...normalized, status: archiveStatus(normalized, options) };
    });
    const ids = new Set();
    for (const entry of entries) {
      if (ids.has(entry.id)) throw new TypeError('records: идентификаторы архива должны быть уникальны.');
      ids.add(entry.id);
    }
    entries.sort((left, right) => (left.expiresAt || '9999-12-31').localeCompare(right.expiresAt || '9999-12-31') || left.title.localeCompare(right.title, 'ru'));
    return {
      entries,
      summary: Object.fromEntries(ARCHIVE_STATUSES.map((status) => [status, entries.filter((entry) => entry.status === status).length]))
    };
  }

  const returnFields = new Set([
    'id', 'rowId', 'marketplace_id', 'source', 'title', 'expectedAmount', 'amount', 'requestedAt', 'purchaseDate', 'dueDate', 'status',
    'manualMatchRowIds', 'confirmedAt', 'note', 'candidateRowIds', 'matchedRowIds', 'receivedAmount', 'outstandingAmount'
  ]);

  function normalizeExpectedReturn(value, options = {}) {
    assertObject(value, 'return');
    assertKnownKeys(value, returnFields, 'return');
    assertObject(options, 'options');
    const id = stringValue(value.id, 'return.id', { required: true, maxLength: 160 });
    const rowId = stringValue(value.rowId, 'return.rowId', { maxLength: 200 });
    const marketplaceId = stringValue(value.marketplace_id, 'return.marketplace_id', { maxLength: 300 });
    if (!rowId && !marketplaceId) throw new TypeError('return: нужна привязка rowId или marketplace_id.');
    const requestedAt = value.requestedAt ? dayValue(value.requestedAt, 'return.requestedAt') : value.purchaseDate ? dayValue(value.purchaseDate, 'return.purchaseDate') : nowDay(options.now);
    const dueDays = Number(options.dueDays === undefined ? 14 : options.dueDays);
    if (!Number.isSafeInteger(dueDays) || dueDays < 0) throw new TypeError('options.dueDays: ожидается неотрицательное целое число.');
    const dueDate = value.dueDate ? dayValue(value.dueDate, 'return.dueDate') : addDays(requestedAt, dueDays);
    const purchaseDate = value.purchaseDate ? dayValue(value.purchaseDate, 'return.purchaseDate') : null;
    if (purchaseDate && dueDate < purchaseDate) throw new TypeError('return.dueDate: не может быть раньше покупки.');
    const suppliedStatus = value.status ? stringValue(value.status, 'return.status', { maxLength: 30 }) : 'pending';
    if (!RETURN_STATUSES.includes(suppliedStatus)) throw new TypeError('return.status: неизвестный статус возврата.');
    const manualMatchRowIds = value.manualMatchRowIds === undefined ? [] : value.manualMatchRowIds;
    if (!Array.isArray(manualMatchRowIds)) throw new TypeError('return.manualMatchRowIds: ожидается массив rowId.');
    const matches = [...new Set(manualMatchRowIds.map((item, index) => stringValue(item, `return.manualMatchRowIds[${index}]`, { required: true, maxLength: 200 })))];
    return {
      id,
      rowId: rowId || null,
      marketplace_id: marketplaceId || null,
      source: stringValue(value.source, 'return.source', { maxLength: 64 }) || null,
      title: stringValue(value.title, 'return.title', { required: true, maxLength: 500 }),
      expectedAmount: money(value.expectedAmount ?? value.amount, 'return.expectedAmount', { positive: true }),
      requestedAt,
      purchaseDate,
      dueDate,
      status: suppliedStatus,
      manualMatchRowIds: matches,
      confirmedAt: value.confirmedAt ? dayValue(value.confirmedAt, 'return.confirmedAt') : null,
      note: stringValue(value.note, 'return.note', { maxLength: 4000 }) || null
    };
  }

  function normalizeRefundRows(rows) {
    if (!Array.isArray(rows)) throw new TypeError('rows: ожидается массив строк отчёта.');
    const ids = new Set();
    return rows.flatMap((row, index) => {
      assertObject(row, `rows[${index}]`);
      const amount = money(row.amount, `rows[${index}].amount`);
      const isRefund = String(row.type || '').trim().toLowerCase() === 'refund' || amount < 0;
      if (!isRefund) return [];
      const rowId = stringValue(row.rowId, `rows[${index}].rowId`, { required: true, maxLength: 200 });
      if (ids.has(rowId)) throw new TypeError('rows: rowId возвратов должны быть уникальны.');
      ids.add(rowId);
      return [{
        rowId,
        marketplace_id: stringValue(row.marketplace_id, `rows[${index}].marketplace_id`, { maxLength: 300 }) || null,
        source: stringValue(row.source, `rows[${index}].source`, { maxLength: 64 }) || null,
        title: stringValue(row.title, `rows[${index}].title`, { required: true, maxLength: 500 }),
        amount: Math.abs(amount),
        date: rowDate(row, `rows[${index}]`)
      }];
    });
  }

  function normalizedText(value) {
    return String(value || '').trim().toLocaleLowerCase('ru').replace(/\s+/g, ' ');
  }

  function compatibleReturnRow(expected, refund) {
    if (expected.source && refund.source && expected.source !== refund.source) return false;
    if (expected.purchaseDate && refund.date < expected.purchaseDate) return false;
    return true;
  }

  function exactIdMatch(expected, refund) {
    return Boolean(expected.marketplace_id
      && refund.marketplace_id
      && expected.marketplace_id === refund.marketplace_id
      && normalizedText(expected.title) === normalizedText(refund.title)
      && compatibleReturnRow(expected, refund));
  }

  function disputedMatch(expected, refund) {
    return compatibleReturnRow(expected, refund)
      && normalizedText(expected.title) === normalizedText(refund.title)
      && Math.abs(expected.expectedAmount - refund.amount) < 0.005;
  }

  function statusForReturn(expected, receivedAmount, hasDispute, today) {
    if (receivedAmount >= expected.expectedAmount - 0.005) return 'received';
    if (receivedAmount > 0) return 'partial';
    if (hasDispute || expected.status === 'disputed') return 'disputed';
    return today > expected.dueDate ? 'overdue' : 'pending';
  }

  function reconcileExpectedReturns(expectedReturns, rows, options = {}) {
    if (!Array.isArray(expectedReturns)) throw new TypeError('expectedReturns: ожидается массив.');
    assertObject(options, 'options');
    const today = nowDay(options.now);
    const expected = expectedReturns.map((item) => normalizeExpectedReturn(item, options));
    const ids = new Set();
    for (const item of expected) {
      if (ids.has(item.id)) throw new TypeError('expectedReturns: идентификаторы должны быть уникальны.');
      ids.add(item.id);
    }
    const refunds = normalizeRefundRows(rows);
    const refundsByRowId = new Map(refunds.map((refund) => [refund.rowId, refund]));
    const refundsByMarketplaceId = new Map();
    const refundsByFingerprint = new Map();
    for (const refund of refunds) {
      if (refund.marketplace_id) {
        const bucket = refundsByMarketplaceId.get(refund.marketplace_id) || [];
        bucket.push(refund);
        refundsByMarketplaceId.set(refund.marketplace_id, bucket);
      }
      const fingerprint = `${normalizedText(refund.title)}\u0001${refund.amount.toFixed(2)}`;
      const bucket = refundsByFingerprint.get(fingerprint) || [];
      bucket.push(refund);
      refundsByFingerprint.set(fingerprint, bucket);
    }
    const used = new Set();
    const returns = expected.map((item) => {
      const manual = item.manualMatchRowIds.map((rowId) => refundsByRowId.get(rowId));
      if (manual.some((refund) => !refund)) throw new TypeError(`return ${item.id}: вручную подтверждённая строка возврата не найдена.`);
      if (manual.some((refund) => !compatibleReturnRow(item, refund))) throw new TypeError(`return ${item.id}: вручное совпадение не подходит к ожидаемому возврату.`);
      if (manual.some((refund) => used.has(refund.rowId))) throw new TypeError(`return ${item.id}: строка возврата уже привязана к другому ожиданию.`);

      let matches = manual;
      if (!matches.length) {
        const candidates = (refundsByMarketplaceId.get(item.marketplace_id) || [])
          .filter((refund) => !used.has(refund.rowId) && exactIdMatch(item, refund));
        const exactAmount = candidates.find((refund) => Math.abs(refund.amount - item.expectedAmount) < 0.005);
        if (exactAmount) {
          matches = [exactAmount];
        } else {
          matches = [];
          let matchedAmount = 0;
          for (const refund of candidates) {
            matches.push(refund);
            matchedAmount += refund.amount;
            if (matchedAmount >= item.expectedAmount - 0.005) break;
          }
        }
      }
      matches.forEach((refund) => used.add(refund.rowId));
      const receivedAmount = roundMoney(matches.reduce((sum, refund) => sum + refund.amount, 0));
      const fingerprint = `${normalizedText(item.title)}\u0001${item.expectedAmount.toFixed(2)}`;
      const candidateRowIds = matches.length ? [] : (refundsByFingerprint.get(fingerprint) || [])
        .filter((refund) => !used.has(refund.rowId) && disputedMatch(item, refund))
        .map((refund) => refund.rowId);
      const status = statusForReturn(item, receivedAmount, candidateRowIds.length > 0, today);
      return {
        ...item,
        status,
        matchedRowIds: matches.map((refund) => refund.rowId),
        candidateRowIds,
        receivedAmount,
        outstandingAmount: roundMoney(Math.max(0, item.expectedAmount - receivedAmount))
      };
    });

    const count = (status) => returns.filter((item) => item.status === status).length;
    const amount = (statuses) => roundMoney(returns
      .filter((item) => statuses.includes(item.status))
      .reduce((sum, item) => sum + item.expectedAmount, 0));
    return {
      returns,
      unmatchedRefunds: refunds.filter((refund) => !used.has(refund.rowId)),
      summary: {
        total: returns.length,
        pending: count('pending'),
        partial: count('partial'),
        disputed: count('disputed'),
        received: count('received'),
        overdue: count('overdue'),
        expectedAmount: amount(RETURN_STATUSES),
        outstandingAmount: roundMoney(returns.reduce((sum, item) => sum + item.outstandingAmount, 0))
      }
    };
  }

  function confirmDisputedReturn(expectedReturn, rows, rowIds, options = {}) {
    if (!Array.isArray(rowIds) || !rowIds.length) throw new TypeError('rowIds: выберите хотя бы одну спорную строку возврата.');
    const initial = reconcileExpectedReturns([expectedReturn], rows, options).returns[0];
    if (initial.status !== 'disputed') throw new Error('Ручное подтверждение доступно только для спорного совпадения.');
    const selected = [...new Set(rowIds.map((rowId, index) => stringValue(rowId, `rowIds[${index}]`, { required: true, maxLength: 200 })))];
    if (selected.some((rowId) => !initial.candidateRowIds.includes(rowId))) {
      throw new TypeError('rowIds: можно подтвердить только предложенное спорное совпадение.');
    }
    return {
      ...normalizeExpectedReturn(expectedReturn, options),
      manualMatchRowIds: selected,
      confirmedAt: nowDay(options.now),
      status: 'pending'
    };
  }

  function buildNextMonthBudgetTemplate(closures, options = {}) {
    if (!Array.isArray(closures)) throw new TypeError('closures: ожидается массив закрытых месяцев.');
    assertObject(options, 'options');
    const minimumMonths = Number(options.minimumMonths === undefined ? 3 : options.minimumMonths);
    const historyMonths = Number(options.historyMonths === undefined ? 6 : options.historyMonths);
    if (!Number.isSafeInteger(minimumMonths) || minimumMonths < 1) throw new TypeError('options.minimumMonths: ожидается положительное целое число.');
    if (!Number.isSafeInteger(historyMonths) || historyMonths < minimumMonths) throw new TypeError('options.historyMonths: ожидается целое число не меньше minimumMonths.');
    const targetMonth = options.month ? monthKey(options.month, 'options.month') : nextMonth(monthFromDay(nowDay(options.now)));
    const byMonth = new Map();
    closures.forEach((closure) => {
      const normalized = validateMonthClosure(closure);
      if (normalized.status === 'closed'
        && normalized.totals
        && normalized.totals.rowCount > 0
        && normalized.month < targetMonth) byMonth.set(normalized.month, normalized);
    });
    const source = [...byMonth.values()].sort((left, right) => right.month.localeCompare(left.month)).slice(0, historyMonths).reverse();
    const base = {
      month: targetMonth,
      sourceMonths: source.map((item) => item.month),
      minimumMonths,
      sufficientHistory: source.length >= minimumMonths,
      template: { total: null, categories: {} },
      estimate: null,
      reason: source.length >= minimumMonths ? null : `Нужно минимум ${minimumMonths} закрытых месяцев; сейчас ${source.length}.`
    };
    if (!base.sufficientHistory) return base;

    const totals = source.map((item) => item.totals);
    const total = roundMoney(totals.reduce((sum, item) => sum + Math.max(0, Number(item.netSpend)), 0) / totals.length);
    const categoryNames = new Set(totals.flatMap((item) => item.categories.map((category) => category.category)));
    const categories = Object.fromEntries([...categoryNames].sort((left, right) => left.localeCompare(right, 'ru')).map((category) => {
      const average = roundMoney(totals.reduce((sum, item) => {
        const line = item.categories.find((candidate) => candidate.category === category);
        return sum + Math.max(0, Number(line?.netSpend || 0));
      }, 0) / totals.length);
      return [category, average];
    }).filter(([, amount]) => amount > 0));
    return {
      ...base,
      template: { total, categories },
      estimate: { method: 'average-closed-months', total, categories: { ...categories } }
    };
  }

  return Object.freeze({
    MONTH_STATUSES,
    ARCHIVE_KINDS,
    ARCHIVE_STATUSES,
    RETURN_STATUSES,
    createMonthClosure,
    validateMonthClosure,
    closeMonth,
    reopenMonth,
    normalizeArchiveRecord,
    archiveStatus,
    buildArchive,
    normalizeExpectedReturn,
    reconcileExpectedReturns,
    confirmDisputedReturn,
    buildNextMonthBudgetTemplate
  });
});
