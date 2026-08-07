(function exposeMarketTratIntelligence(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.MarketTratIntelligence = api;
    root.analyzeSpendIntelligence = api.analyze;
    root.normalizeProductIdentity = api.normalizeProductIdentity;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  'use strict';

  // This module deliberately has no storage or network dependency. It is safe
  // to run on imported CSV rows as well as rows collected by the extension.
  const MAX_ROWS = 100000;
  const MAX_TOKENS = 12;
  const MAX_GROUPS_PER_TOKEN = 64;
  const MAX_RECENT_DUPLICATE_CANDIDATES = 8;
  const DEFAULT_MAX_ANOMALIES = 50;
  const DEFAULT_RECENT_DAYS = 180;
  const STOP_WORDS = new Set([
    'и', 'в', 'во', 'на', 'для', 'с', 'со', 'по', 'от', 'до', 'из', 'за', 'при', 'без', 'под',
    'the', 'a', 'an', 'of', 'and', 'with', 'for', 'to', 'in', 'new', 'товар', 'набор', 'штука',
    'шт', 'упаковка', 'уп', 'оригинал', 'original', 'цвет', 'размер', 'модель', 'заказ',
    'белый', 'белая', 'белое', 'черный', 'черная', 'черное', 'чёрный', 'чёрная', 'чёрное',
    'мужской', 'мужская', 'мужское', 'женский', 'женская', 'женское'
  ]);
  const SERVICE_TITLE = /^(?:работа сервиса|комиссия сервиса)$|(?:^|\s)(?:доставка|доставк[аиу]|комисси[яию]|сервис(?:ный|ная|ный сбор)?|service\s*fee|delivery|shipping)(?:\s|$)/iu;
  const REFUND_TYPE = /refund|return|возврат/u;
  const QUANTITY_PATTERN = /(\d+(?:[.,]\d+)?)\s*(кг|kg|г|gr|g|л|l|мл|ml|шт|pcs?|pc|уп|pack)(?=\s|$)/giu;

  function own(value, key) {
    return Object.prototype.hasOwnProperty.call(value, key);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function round(value, digits = 2) {
    const factor = 10 ** digits;
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }

  function numericAmount(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    let text = String(value ?? '').trim();
    if (!text) return null;
    text = text.replace(/[\s\u00a0₽]/gu, '').replace(',', '.').replace(/[^\d.-]/gu, '');
    if (!/^-?\d+(?:\.\d+)?$/u.test(text)) return null;
    const amount = Number(text);
    return Number.isFinite(amount) ? amount : null;
  }

  function normalizeText(value) {
    return String(value ?? '')
      .normalize('NFKD')
      .replace(/\p{M}/gu, '')
      .toLocaleLowerCase('ru-RU')
      .replace(/ё/gu, 'е')
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim()
      .replace(/\s+/gu, ' ');
  }

  function quantityUnit(rawUnit) {
    const unit = String(rawUnit || '').toLowerCase();
    if (unit === 'кг' || unit === 'kg') return { unit: 'g', multiplier: 1000 };
    if (unit === 'г' || unit === 'gr' || unit === 'g') return { unit: 'g', multiplier: 1 };
    if (unit === 'л' || unit === 'l') return { unit: 'ml', multiplier: 1000 };
    if (unit === 'мл' || unit === 'ml') return { unit: 'ml', multiplier: 1 };
    return { unit: 'item', multiplier: 1 };
  }

  function quantityFromTitle(title) {
    const matches = [...String(title ?? '').matchAll(QUANTITY_PATTERN)];
    if (matches.length !== 1) return { value: 1, unit: 'item', source: 'default' };
    const rawValue = Number(matches[0][1].replace(',', '.'));
    const descriptor = quantityUnit(matches[0][2]);
    const value = rawValue * descriptor.multiplier;
    return Number.isFinite(value) && value > 0
      ? { value, unit: descriptor.unit, source: 'title' }
      : { value: 1, unit: 'item', source: 'default' };
  }

  function quantityFromRow(row) {
    for (const key of ['quantity', 'qty', 'count', 'units']) {
      if (!own(row, key)) continue;
      const value = numericAmount(row[key]);
      if (value !== null && value > 0) return { value, unit: 'item', source: 'field' };
    }
    return quantityFromTitle(row.title);
  }

  function titleTokens(title) {
    const withoutQuantity = String(title ?? '').replace(QUANTITY_PATTERN, ' ');
    const tokens = normalizeText(withoutQuantity)
      .split(' ')
      .filter((token) => token.length >= 2 && !STOP_WORDS.has(token));
    return [...new Set(tokens)].slice(0, MAX_TOKENS).sort();
  }

  function receiptIdentity(row) {
    const source = normalizeText(row.source ?? row.marketplace ?? '');
    const receipt = String(
      row.receipt_url ?? row.receiptUrl ?? row.order_id ?? row.orderId ?? row.marketplace_id ?? ''
    ).trim();
    return source && receipt ? `${source}\u0001${receipt}` : '';
  }

  function marketplaceOrderIdentity(row) {
    const source = normalizeText(row.source ?? row.marketplace ?? '');
    if (source !== 'ozon') return '';
    const order = String(row.raw_title ?? row.rawTitle ?? '').match(/Заказ\s*№\s*(\S+)/iu)?.[1] || '';
    return order ? `${source}\u0001${order}` : '';
  }

  /**
   * Creates a stable, explainable identity. Quantity is intentionally excluded
   * from the key so that the same product in a different pack can be compared
   * by unit price.
   */
  function normalizeProductIdentity(rowOrTitle) {
    const row = typeof rowOrTitle === 'object' && rowOrTitle !== null ? rowOrTitle : { title: rowOrTitle };
    const title = String(row.title ?? row.raw_title ?? '').trim();
    const normalizedTitle = normalizeText(title);
    const tokens = titleTokens(title);
    return {
      title,
      normalizedTitle,
      tokens,
      key: tokens.join('|'),
      quantity: quantityFromRow(row)
    };
  }

  function dateDay(value) {
    const match = String(value ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/u);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const time = Date.UTC(year, month - 1, day);
    const check = new Date(time);
    return check.getUTCFullYear() === year && check.getUTCMonth() === month - 1 && check.getUTCDate() === day
      ? Math.floor(time / 86400000)
      : null;
  }

  function isRefund(row, amount) {
    return amount < 0 || REFUND_TYPE.test(String(row.type ?? row.operation ?? '')) || row.is_return === true || row.is_return === '1';
  }

  function isService(row, normalizedTitle) {
    return row.service === true || row.is_service === true || row.kind === 'service' || SERVICE_TITLE.test(normalizedTitle);
  }

  function prepare(rows) {
    if (!Array.isArray(rows)) throw new TypeError('rows: ожидается массив строк расходов.');
    if (rows.length > MAX_ROWS) throw new RangeError(`rows: допускается не более ${MAX_ROWS} строк.`);

    const entries = [];
    const ignored = { excluded: 0, service: 0, invalid: 0 };
    rows.forEach((row, index) => {
      if (!row || typeof row !== 'object' || row.excluded === true) {
        if (row?.excluded === true) ignored.excluded += 1;
        else ignored.invalid += 1;
        return;
      }
      const amount = numericAmount(row.amount);
      const identity = normalizeProductIdentity(row);
      if (amount === null || amount === 0 || !identity.key) {
        ignored.invalid += 1;
        return;
      }
      if (isService(row, identity.normalizedTitle)) {
        ignored.service += 1;
        return;
      }
      const refund = isRefund(row, amount);
      entries.push({
        rowIndex: index,
        date: String(row.date ?? ''),
        day: dateDay(row.date),
        amount: Math.abs(amount),
        refund,
        identity,
        title: identity.title,
        receiptIdentity: receiptIdentity(row),
        orderIdentity: marketplaceOrderIdentity(row)
      });
    });
    return { entries, ignored };
  }

  function overlapScore(tokens, groupTokens) {
    let overlap = 0;
    for (const token of tokens) if (groupTokens.has(token)) overlap += 1;
    const minSize = Math.min(tokens.length, groupTokens.size);
    return { overlap, ratio: minSize ? overlap / minSize : 0 };
  }

  // Candidates are obtained through an inverted token index, not by comparing
  // every title to every other title. The per-token cap keeps worst cases (for
  // example 100k rows named only “товар”) linear in the input size.
  function groupEntries(entries) {
    const groups = [];
    const exact = new Map();
    const anchors = new Map();

    for (const entry of entries) {
      let groupId = exact.get(entry.identity.key);
      if (groupId === undefined) {
        const candidates = new Set();
        for (const token of entry.identity.tokens) {
          for (const id of anchors.get(token) || []) candidates.add(id);
        }
        let winner = null;
        for (const id of candidates) {
          const group = groups[id];
          const score = overlapScore(entry.identity.tokens, group.tokenSet);
          if (score.overlap < 2 || score.ratio < 0.6) continue;
          if (!winner || score.ratio > winner.score.ratio
            || (score.ratio === winner.score.ratio && score.overlap > winner.score.overlap)) {
            winner = { id, score };
          }
        }
        if (winner) groupId = winner.id;
      }
      if (groupId === undefined) {
        groupId = groups.length;
        const group = {
          id: groupId,
          key: entry.identity.key,
          name: entry.title,
          tokenSet: new Set(entry.identity.tokens),
          entries: [],
          titles: new Set()
        };
        groups.push(group);
        exact.set(entry.identity.key, groupId);
        for (const token of entry.identity.tokens) {
          const ids = anchors.get(token) || [];
          if (ids.length < MAX_GROUPS_PER_TOKEN) ids.push(groupId);
          anchors.set(token, ids);
        }
      } else {
        exact.set(entry.identity.key, groupId);
      }
      const group = groups[groupId];
      group.entries.push(entry);
      group.titles.add(entry.title);
      entry.groupId = groupId;
    }
    return groups;
  }

  function sortedEntries(entries) {
    return [...entries].sort((a, b) => (a.day ?? Number.MAX_SAFE_INTEGER) - (b.day ?? Number.MAX_SAFE_INTEGER)
      || a.rowIndex - b.rowIndex);
  }

  function publicGroups(groups) {
    return groups.map((group) => {
      const purchases = group.entries.filter((entry) => !entry.refund);
      const refunds = group.entries.filter((entry) => entry.refund);
      const purchaseAmount = purchases.reduce((sum, entry) => sum + entry.amount, 0);
      const refundAmount = refunds.reduce((sum, entry) => sum + entry.amount, 0);
      return {
        id: group.id,
        key: group.key,
        name: group.name,
        similarTitles: [...group.titles],
        rowIndexes: group.entries.map((entry) => entry.rowIndex),
        purchaseCount: purchases.length,
        refundCount: refunds.length,
        purchaseAmount: round(purchaseAmount),
        refundAmount: round(refundAmount),
        netAmount: round(purchaseAmount - refundAmount)
      };
    }).sort((a, b) => b.purchaseAmount - a.purchaseAmount || a.name.localeCompare(b.name, 'ru'));
  }

  function buildPriceHistoryFromGroups(groups) {
    const histories = [];
    for (const group of groups) {
      const byUnit = new Map();
      for (const entry of group.entries) {
        if (entry.refund) continue;
        const quantity = entry.identity.quantity;
        const unitPrice = entry.amount / quantity.value;
        if (!Number.isFinite(unitPrice)) continue;
        const bucket = byUnit.get(quantity.unit) || [];
        bucket.push({
          rowIndex: entry.rowIndex,
          date: entry.date,
          day: entry.day,
          amount: round(entry.amount),
          quantity: round(quantity.value, 4),
          unitPrice: round(unitPrice, 4),
          quantitySource: quantity.source
        });
        byUnit.set(quantity.unit, bucket);
      }
      for (const [unit, observations] of byUnit) {
        const points = sortedEntries(observations);
        const latest = points.at(-1);
        const previous = points.length > 1 ? points.at(-2) : null;
        const change = previous ? round(latest.unitPrice - previous.unitPrice, 4) : null;
        const changePercent = previous && previous.unitPrice > 0 ? round(change / previous.unitPrice, 4) : null;
        const titleQuantities = points.filter((point) => point.quantitySource === 'title').length;
        const confidence = round(clamp(0.42 + Math.min(points.length - 1, 4) * 0.08
          + (titleQuantities === points.length ? 0.04 : 0), 0.42, 0.78), 2);
        histories.push({
          groupId: group.id,
          key: group.key,
          name: group.name,
          unit,
          observations: points.map(({ day, ...point }) => point),
          latestUnitPrice: latest.unitPrice,
          previousUnitPrice: previous?.unitPrice ?? null,
          change,
          changePercent,
          confidence,
          needsReview: points.length < 3 || confidence < 0.6
        });
      }
    }
    return histories.sort((a, b) => a.name.localeCompare(b.name, 'ru') || a.unit.localeCompare(b.unit));
  }

  function median(values) {
    if (!values.length) return null;
    const ordered = [...values].sort((a, b) => a - b);
    const middle = Math.floor(ordered.length / 2);
    return ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2;
  }

  function detectRecurringFromGroups(groups) {
    const recurring = [];
    for (const group of groups) {
      const purchases = sortedEntries(group.entries.filter((entry) => !entry.refund && entry.day !== null));
      const days = [...new Set(purchases.map((entry) => entry.day))];
      if (days.length < 3) continue;
      const intervals = [];
      for (let index = 1; index < days.length; index += 1) intervals.push(days[index] - days[index - 1]);
      const intervalDays = median(intervals);
      if (!intervalDays || intervalDays < 7 || intervalDays > 400) continue;
      const deviation = median(intervals.map((interval) => Math.abs(interval - intervalDays))) ?? intervalDays;
      const regularity = clamp(1 - deviation / intervalDays, 0, 1);
      if (regularity < 0.55) continue;
      const averageAmount = purchases.reduce((sum, entry) => sum + entry.amount, 0) / purchases.length;
      const confidence = round(clamp(0.38 + Math.min(intervals.length, 4) * 0.08 + regularity * 0.16, 0.4, 0.78), 2);
      recurring.push({
        groupId: group.id,
        key: group.key,
        name: group.name,
        occurrenceCount: purchases.length,
        intervalDays: round(intervalDays, 1),
        averageAmount: round(averageAmount),
        estimatedAnnualAmount: round(averageAmount * 365 / intervalDays),
        regularity: round(regularity, 2),
        confidence,
        // Detection is only a suggestion; only a person may confirm it.
        confirmed: false
      });
    }
    return recurring.sort((a, b) => b.estimatedAnnualAmount - a.estimatedAnnualAmount || a.name.localeCompare(b.name, 'ru'));
  }

  function percentile(values, fraction) {
    if (!values.length) return 0;
    const ordered = [...values].sort((a, b) => a - b);
    return ordered[Math.min(ordered.length - 1, Math.floor((ordered.length - 1) * fraction))];
  }

  function detectAnomaliesFromGroups(groups, histories, options) {
    const anomalies = [];
    const maxAnomalies = Number.isSafeInteger(options.maxAnomalies) && options.maxAnomalies > 0
      ? options.maxAnomalies : DEFAULT_MAX_ANOMALIES;
    const recentDays = Number.isSafeInteger(options.recentDays) && options.recentDays > 0
      ? options.recentDays : DEFAULT_RECENT_DAYS;
    const latestDay = groups.flatMap((group) => group.entries.map((entry) => entry.day))
      .filter((day) => day !== null)
      .reduce((latest, day) => Math.max(latest, day), Number.MIN_SAFE_INTEGER);
    const cutoffDay = latestDay === Number.MIN_SAFE_INTEGER ? Number.MIN_SAFE_INTEGER : latestDay - recentDays;
    const severity = { refund_without_purchase: 4, possible_duplicate: 3, price_increase: 2, large_new_expense: 1 };
    const compareAnomalies = (left, right) => (severity[right.type] || 0) - (severity[left.type] || 0)
      || (right.latestDay ?? Number.MIN_SAFE_INTEGER) - (left.latestDay ?? Number.MIN_SAFE_INTEGER)
      || (right.amount || 0) - (left.amount || 0)
      || left.name.localeCompare(right.name, 'ru');
    const poolLimit = Math.max(200, maxAnomalies * 4);
    const add = (anomaly) => {
      anomalies.push(anomaly);
      if (anomalies.length > poolLimit) anomalies.sort(compareAnomalies).splice(poolLimit);
    };
    const positiveAmounts = groups.flatMap((group) => group.entries.filter((entry) => !entry.refund).map((entry) => entry.amount));
    const medianAmount = median(positiveAmounts) || 0;
    const largeThreshold = Number.isFinite(Number(options.largeExpenseThreshold)) && Number(options.largeExpenseThreshold) > 0
      ? Number(options.largeExpenseThreshold)
      : Math.max(5000, medianAmount * 4, percentile(positiveAmounts, 0.9));

    for (const group of groups) {
      const purchases = sortedEntries(group.entries.filter((entry) => !entry.refund));
      const refunds = sortedEntries(group.entries.filter((entry) => entry.refund));
      for (let currentIndex = 0; currentIndex < purchases.length; currentIndex += 1) {
        const current = purchases[currentIndex];
        if (current.day !== null && current.day < cutoffDay) continue;
        for (let offset = 1; offset <= MAX_RECENT_DUPLICATE_CANDIDATES && currentIndex - offset >= 0; offset += 1) {
          const previous = purchases[currentIndex - offset];
          if (current.day === null || previous.day === null || current.day - previous.day > 1) break;
          if (current.receiptIdentity && current.receiptIdentity === previous.receiptIdentity) continue;
          if (current.orderIdentity && current.orderIdentity === previous.orderIdentity) continue;
          const relativeDifference = Math.abs(current.amount - previous.amount) / Math.max(current.amount, previous.amount);
          if (relativeDifference > 0.03) continue;
          add({
            type: 'possible_duplicate',
            groupId: group.id,
            name: group.name,
            rowIndexes: [previous.rowIndex, current.rowIndex],
            confidence: 0.62,
            latestDay: current.day,
            reason: 'Похожие покупки с почти одинаковой суммой сделаны в пределах одного дня.'
          });
          break;
        }
      }
      if (purchases.length === 1 && purchases[0].amount >= largeThreshold
        && (purchases[0].day === null || purchases[0].day >= cutoffDay)) {
        add({
          type: 'large_new_expense',
          groupId: group.id,
          name: group.name,
          rowIndexes: [purchases[0].rowIndex],
          amount: round(purchases[0].amount),
          threshold: round(largeThreshold),
          confidence: 0.58,
          latestDay: purchases[0].day,
          reason: 'Новая группа покупок заметно крупнее обычной суммы в этой выгрузке.'
        });
      }
      for (const refund of refunds) {
        if (refund.day !== null && refund.day < cutoffDay) continue;
        const hasEarlierPurchase = purchases.some((purchase) => refund.day === null || purchase.day === null || purchase.day <= refund.day);
        if (hasEarlierPurchase) continue;
        add({
          type: 'refund_without_purchase',
          groupId: group.id,
          name: group.name,
          rowIndexes: [refund.rowIndex],
          amount: round(refund.amount),
          confidence: 0.7,
          latestDay: refund.day,
          reason: 'Возврат не удалось сопоставить с более ранней покупкой похожего товара.'
        });
      }
    }

    const increaseThreshold = Number.isFinite(Number(options.priceIncreaseThreshold)) && Number(options.priceIncreaseThreshold) > 0
      ? Number(options.priceIncreaseThreshold) : 0.35;
    for (const history of histories) {
      if (history.changePercent === null || history.changePercent < increaseThreshold) continue;
      const current = history.observations.at(-1);
      const currentDay = dateDay(current.date);
      if (currentDay !== null && currentDay < cutoffDay) continue;
      add({
        type: 'price_increase',
        groupId: history.groupId,
        name: history.name,
        rowIndexes: [history.observations.at(-2).rowIndex, current.rowIndex],
        changePercent: history.changePercent,
        confidence: history.confidence,
        latestDay: currentDay,
        reason: 'Цена за единицу похожего товара заметно выросла относительно предыдущей покупки.'
      });
    }
    return anomalies
      .sort(compareAnomalies)
      .slice(0, maxAnomalies)
      .map(({ latestDay: _latestDay, ...anomaly }) => anomaly);
  }

  function analyze(rows, options = {}) {
    const prepared = prepare(rows);
    const groups = groupEntries(prepared.entries);
    const priceHistory = buildPriceHistoryFromGroups(groups);
    const recurring = detectRecurringFromGroups(groups);
    const anomalies = detectAnomaliesFromGroups(groups, priceHistory, options || {});
    return {
      groups: publicGroups(groups),
      priceHistory,
      recurring,
      anomalies,
      meta: {
        processedRows: prepared.entries.length,
        ignored: { ...prepared.ignored },
        maxRows: MAX_ROWS
      }
    };
  }

  return Object.freeze({
    MAX_ROWS,
    normalizeProductIdentity,
    groupSimilarPurchases(rows) {
      const prepared = prepare(rows);
      return { groups: publicGroups(groupEntries(prepared.entries)), meta: { processedRows: prepared.entries.length, ignored: { ...prepared.ignored } } };
    },
    buildPriceHistory(rows) {
      const prepared = prepare(rows);
      return buildPriceHistoryFromGroups(groupEntries(prepared.entries));
    },
    detectRecurring(rows) {
      const prepared = prepare(rows);
      return detectRecurringFromGroups(groupEntries(prepared.entries));
    },
    detectAnomalies(rows, options = {}) {
      const prepared = prepare(rows);
      const groups = groupEntries(prepared.entries);
      return detectAnomaliesFromGroups(groups, buildPriceHistoryFromGroups(groups), options || {});
    },
    analyze
  });
});
