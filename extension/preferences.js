(function exposePreferences(root) {
  const overrideFields = ['category', 'excluded', 'profile', 'note'];

  function normalizeText(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/ё/g, 'е')
      .replace(/[^0-9a-zа-я]+/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function normalizeSource(value) {
    const source = normalizeText(value);
    if (source === 'wb') return 'wildberries';
    if (source === 'яндекс' || source === 'яндекс маркет') return 'yandex';
    return source;
  }

  function numericAmount(value) {
    const amount = Number(String(value ?? '').replace(/[\s\u00a0]+/g, '').replace(',', '.'));
    return Number.isFinite(amount) ? amount : 0;
  }

  function operationType(row) {
    const type = normalizeText(row?.type ?? row?.is_return);
    if (type === 'refund' || type === 'return' || type === 'возврат' || type === '1') return 'refund';
    if (type === 'purchase' || type === 'покупка' || type === '0') return 'purchase';
    return numericAmount(row?.amount) < 0 ? 'refund' : 'purchase';
  }

  function normalizedMarketplaceId(row) {
    return String(
      row?.marketplace_id || row?.marketplaceId || row?.order_id || row?.orderId || row?.receipt_url || ''
    ).trim().toLowerCase();
  }

  function dateValue(value) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}`;
    }
    const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    return match ? `${match[1]}-${match[2]}-${match[3]}` : String(value || '').trim();
  }

  function fixedAmount(value) {
    return numericAmount(value).toFixed(2);
  }

  function hashText(value, seed) {
    let hash = seed >>> 0;
    const text = String(value);
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36).padStart(7, '0');
  }

  function stableRowId(row) {
    const identity = [
      normalizeSource(row?.source || row?.marketplace),
      normalizedMarketplaceId(row),
      String(row?.item_index ?? row?.itemIndex ?? row?.sku ?? row?.offer_id ?? '').trim().toLowerCase(),
      dateValue(row?.date),
      operationType(row),
      normalizeText(row?.title),
      fixedAmount(row?.amount),
      String(row?.currency || 'RUB').trim().toUpperCase()
    ].join('\u0001');
    return `mt_${hashText(identity, 2166136261)}${hashText(identity, 2246822507)}`;
  }

  function withStableRowIds(rows) {
    const used = new Set();
    const occurrences = new Map();
    return (Array.isArray(rows) ? rows : []).map((row) => {
      const baseId = String(row?.rowId || stableRowId(row));
      let occurrence = (occurrences.get(baseId) || 0) + 1;
      let rowId = occurrence === 1 ? baseId : `${baseId}_${occurrence}`;
      while (used.has(rowId)) {
        occurrence += 1;
        rowId = `${baseId}_${occurrence}`;
      }
      occurrences.set(baseId, occurrence);
      used.add(rowId);
      return { ...row, rowId };
    });
  }

  function ruleKeywords(rule) {
    const values = Array.isArray(rule?.keywords)
      ? rule.keywords
      : Array.isArray(rule?.tokens)
        ? rule.tokens
        : [rule?.keyword ?? rule?.token ?? rule?.contains];
    return values.map(normalizeText).filter(Boolean);
  }

  function sourceMatches(row, rule) {
    if (rule?.source === undefined && rule?.sources === undefined) return true;
    const allowed = Array.isArray(rule.sources)
      ? rule.sources
      : Array.isArray(rule.source)
        ? rule.source
        : [rule.source];
    const normalized = allowed.map(normalizeSource).filter(Boolean);
    return normalized.length === 0
      || normalized.includes(normalizeSource(row?.source || row?.marketplace));
  }

  function keywordMatches(title, keywords, mode) {
    if (!keywords.length) return false;
    const paddedTitle = ` ${title} `;
    const matches = keywords.map((keyword) => {
      if (!keyword) return false;
      return mode === 'exact'
        ? title === keyword
        : paddedTitle.includes(` ${keyword} `);
    });
    return mode === 'all' ? matches.every(Boolean) : matches.some(Boolean);
  }

  function ruleMatchesRow(row, rule) {
    if (!rule || rule.enabled === false || !sourceMatches(row, rule)) return false;
    const title = normalizeText(row?.title);
    if (!title) return false;
    const mode = rule.match === 'all' || rule.match === 'exact' ? rule.match : 'any';
    if (!keywordMatches(title, ruleKeywords(rule), mode)) return false;
    const negative = ruleKeywords({ keywords: rule.negativeKeywords || rule.excludes || [] });
    if (negative.length && keywordMatches(title, negative, 'any')) return false;
    const amount = Math.abs(numericAmount(row?.amount));
    const min = Number(rule.amountMin);
    const max = Number(rule.amountMax);
    if (Number.isFinite(min) && min >= 0 && amount < min) return false;
    if (Number.isFinite(max) && max >= 0 && amount > max) return false;
    return true;
  }

  function matchKeywordRule(row, rules) {
    const title = normalizeText(row?.title);
    if (!title) return null;
    return (Array.isArray(rules) ? rules : [])
      .map((rule, index) => ({ rule, index, priority: Number(rule?.priority) || 0 }))
      .filter(({ rule }) => ruleMatchesRow({ ...row, title }, rule))
      .sort((left, right) => right.priority - left.priority || right.index - left.index)[0]?.rule || null;
  }

  function preferencePatch(value) {
    const patch = {};
    for (const field of overrideFields) {
      if (!Object.prototype.hasOwnProperty.call(value || {}, field)) continue;
      if (field === 'excluded') patch.excluded = value.excluded === true;
      else patch[field] = String(value[field] ?? '').trim();
    }
    return patch;
  }

  function applyRuleToRow(row, rules) {
    const rule = matchKeywordRule(row, rules);
    if (!rule) return { ...row };
    const patch = preferencePatch(rule);
    return {
      ...row,
      ...patch,
      ...(Object.prototype.hasOwnProperty.call(patch, 'category') ? {
        category_confidence: 'confirmed',
        category_origin: 'rule',
        category_reason: `Правило: ${(ruleKeywords(rule)).join(' + ')}`,
        category_needs_review: false,
        category_rule_id: String(rule.id || '')
      } : {})
    };
  }

  function applyKeywordRules(rowsOrRow, rules) {
    if (Array.isArray(rowsOrRow)) return rowsOrRow.map((row) => applyRuleToRow(row, rules));
    return applyRuleToRow(rowsOrRow || {}, rules);
  }

  function overrideMap(overrides) {
    if (Array.isArray(overrides)) {
      return new Map(overrides.flatMap((override) => {
        const id = String(override?.rowId || override?.id || '').trim();
        return id ? [[id, override]] : [];
      }));
    }
    return new Map(Object.entries(overrides || {}));
  }

  function applyOverrides(rowsOrRow, overrides) {
    const byId = overrideMap(overrides);
    const apply = (value) => {
      const row = value?.rowId ? value : { ...value, rowId: stableRowId(value) };
      const override = byId.get(String(row.rowId));
      if (!override) return { ...row };
      const patch = preferencePatch(override);
      return {
        ...row,
        ...patch,
        ...(Object.prototype.hasOwnProperty.call(patch, 'category') ? {
          category_confidence: 'confirmed',
          category_origin: 'manual',
          category_reason: 'Подтверждено вручную',
          category_needs_review: false,
          category_rule_id: ''
        } : {})
      };
    };
    if (Array.isArray(rowsOrRow)) return rowsOrRow.map(apply);
    return apply(rowsOrRow || {});
  }

  function applyPreferences(rows, preferences) {
    const identified = withStableRowIds(rows);
    const ruled = applyKeywordRules(identified, preferences?.rules || preferences?.keywordRules || []);
    return applyOverrides(ruled, preferences?.overrides || {});
  }

  const similarStopWords = new Set([
    'для', 'или', 'при', 'под', 'над', 'без', 'это', 'как', 'набор', 'комплект',
    'штук', 'штуки', 'шт', 'цвет', 'размер', 'новый', 'новая', 'новое', 'мужской',
    'женский', 'детский', 'оригинальный', 'универсальный'
  ]);

  function deriveCategoryRule(row, category) {
    const words = normalizeText(row?.title)
      .split(' ')
      .filter((word) => word.length >= 4 && !/^\d+$/.test(word) && !similarStopWords.has(word));
    const keywords = [...new Set(words)].slice(0, 3);
    if (!keywords.length) {
      const fallback = normalizeText(row?.title);
      if (fallback) keywords.push(fallback);
    }
    const source = normalizeSource(row?.source || row?.marketplace);
    return {
      keywords,
      keyword: keywords.join(' '),
      negativeKeywords: [],
      match: keywords.length > 1 ? 'all' : 'any',
      sources: source ? [source] : [],
      category: String(category || '').trim(),
      priority: 100,
      enabled: true
    };
  }

  function dateParts(value) {
    if (typeof value === 'string') {
      const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
    }
    const date = value instanceof Date ? value : new Date(value === undefined ? Date.now() : value);
    if (Number.isNaN(date.getTime())) return dateParts(new Date());
    return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
  }

  function pad2(value) {
    return String(value).padStart(2, '0');
  }

  function monthWindow(now) {
    const { year, month, day } = dateParts(now);
    const daysInMonth = new Date(year, month, 0).getDate();
    const elapsedDays = Math.min(Math.max(day, 1), daysInMonth);
    const key = `${year}-${pad2(month)}`;
    return {
      key,
      from: `${key}-01`,
      to: `${key}-${pad2(daysInMonth)}`,
      daysInMonth,
      elapsedDays,
      remainingDays: daysInMonth - elapsedDays
    };
  }

  function signedAmount(row) {
    const amount = numericAmount(row?.amount);
    return operationType(row) === 'refund' ? -Math.abs(amount) : amount;
  }

  function finiteLimit(value) {
    const limit = Number(value);
    return Number.isFinite(limit) && limit > 0 ? limit : null;
  }

  function normalizeBudgets(budgets) {
    const config = budgets || {};
    const structured = config.categories && typeof config.categories === 'object';
    const categories = structured
      ? config.categories
      : Object.fromEntries(Object.entries(config).filter(([key]) => !['total', 'overall', 'monthly'].includes(key)));
    return {
      total: finiteLimit(config.total ?? config.overall ?? config.monthly),
      categories: Object.fromEntries(Object.entries(categories)
        .map(([category, limit]) => [String(category).trim(), finiteLimit(limit)])
        .filter(([category, limit]) => category && limit !== null))
    };
  }

  function roundMoney(value) {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  }

  function forecastAmount(spent, window) {
    return roundMoney(Math.max(0, spent) / window.elapsedDays * window.daysInMonth);
  }

  function budgetLine(spentValue, limit, window, extra) {
    const spent = roundMoney(Math.max(0, spentValue));
    const forecast = forecastAmount(spent, window);
    const result = {
      ...extra,
      spent,
      limit,
      remaining: limit === null ? null : roundMoney(limit - spent),
      forecast,
      percent: limit === null ? null : roundMoney(spent / limit * 100),
      forecastPercent: limit === null ? null : roundMoney(forecast / limit * 100),
      overBudget: limit !== null && spent > limit,
      forecastOverBudget: limit !== null && forecast > limit
    };
    result.status = limit === null
      ? 'unlimited'
      : result.overBudget
        ? 'over'
        : result.forecastOverBudget
          ? 'forecast-over'
          : 'ok';
    return result;
  }

  function buildBudgetSummary(rows, budgets, now) {
    const window = monthWindow(now);
    const config = normalizeBudgets(budgets);
    const spendByCategory = new Map();
    let spent = 0;

    for (const row of Array.isArray(rows) ? rows : []) {
      if (row?.excluded === true || !dateValue(row?.date).startsWith(window.key)) continue;
      const amount = signedAmount(row);
      if (!amount) continue;
      spent += amount;
      const category = String(row?.category || 'unknown').trim() || 'unknown';
      spendByCategory.set(category, (spendByCategory.get(category) || 0) + amount);
    }

    const categories = [...new Set([...Object.keys(config.categories), ...spendByCategory.keys()])]
      .map((category) => budgetLine(
        spendByCategory.get(category) || 0,
        config.categories[category] ?? null,
        window,
        { category }
      ))
      .sort((left, right) => {
        const leftRatio = left.limit ? left.spent / left.limit : -1;
        const rightRatio = right.limit ? right.spent / right.limit : -1;
        return rightRatio - leftRatio || right.spent - left.spent || left.category.localeCompare(right.category, 'ru');
      });

    return {
      month: window.key,
      window,
      ...budgetLine(spent, config.total, window),
      categories
    };
  }

  function addDays(value, days) {
    const { year, month, day } = dateParts(value);
    const date = new Date(Date.UTC(year, month - 1, day + days));
    return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
  }

  function claimAmount(claim) {
    return Math.abs(numericAmount(claim?.amount ?? claim?.expectedAmount));
  }

  function sameMoney(left, right) {
    return Math.abs(left - right) < 0.005;
  }

  function refundMatchScore(claim, refund) {
    if (normalizeSource(claim?.source || claim?.marketplace) !== normalizeSource(refund?.source || refund?.marketplace)) {
      return -1;
    }
    const expectedAmount = claimAmount(claim);
    if (!expectedAmount || !sameMoney(expectedAmount, Math.abs(numericAmount(refund?.amount)))) return -1;

    const purchaseDate = dateValue(claim?.purchaseDate || claim?.orderDate || claim?.purchase_date);
    const refundDate = dateValue(refund?.date);
    if (purchaseDate && refundDate && refundDate < purchaseDate) return -1;

    const claimId = normalizedMarketplaceId(claim);
    const refundId = normalizedMarketplaceId(refund);
    const sameId = Boolean(claimId && refundId && claimId === refundId);
    const claimTitle = normalizeText(claim?.title);
    const sameTitle = Boolean(claimTitle && claimTitle === normalizeText(refund?.title));
    if (claimId && refundId && claimId !== refundId && !sameTitle) return -1;
    return (sameId ? 4 : 0) + (sameTitle ? 2 : 0) || -1;
  }

  function claimId(claim) {
    const existing = String(claim?.id || claim?.claimId || '').trim();
    if (existing) return existing;
    const identity = [
      normalizeSource(claim?.source || claim?.marketplace),
      normalizedMarketplaceId(claim),
      normalizeText(claim?.title),
      fixedAmount(claimAmount(claim)),
      dateValue(claim?.createdAt || claim?.claimedAt || claim?.date)
    ].join('\u0001');
    return `claim_${hashText(identity, 2166136261)}${hashText(identity, 2246822507)}`;
  }

  function reconcileRefundClaims(claims, rows, options) {
    const now = dateValue(options?.now || new Date());
    const dueDays = Number.isInteger(options?.dueDays) && options.dueDays >= 0 ? options.dueDays : 14;
    const refunds = withStableRowIds((Array.isArray(rows) ? rows : []).filter((row) => operationType(row) === 'refund'));
    const usedRefundIds = new Set();

    const reconciledClaims = (Array.isArray(claims) ? claims : []).map((claim) => {
      const id = claimId(claim);
      if (claim?.status === 'cancelled') return { ...claim, id, status: 'cancelled' };
      if (claim?.status === 'reconciled') {
        const savedMatch = refunds.find((refund) => refund.rowId === claim.matchedRowId);
        if (savedMatch) {
          usedRefundIds.add(savedMatch.rowId);
          return { ...claim, id, status: 'reconciled' };
        }
      }
      const match = refunds
        .filter((refund) => !usedRefundIds.has(refund.rowId))
        .map((refund, index) => ({ refund, index, score: refundMatchScore(claim, refund) }))
        .filter((candidate) => candidate.score > 0)
        .sort((left, right) => right.score - left.score || left.index - right.index)[0]?.refund;
      if (match) {
        usedRefundIds.add(match.rowId);
        return {
          ...claim,
          id,
          status: 'reconciled',
          matchedRowId: match.rowId,
          reconciledAt: dateValue(match.date) || now
        };
      }

      const createdAt = dateValue(claim?.createdAt || claim?.claimedAt || claim?.date || now);
      const dueDate = dateValue(claim?.dueDate || claim?.expectedBy) || addDays(createdAt, dueDays);
      return {
        ...claim,
        id,
        createdAt,
        dueDate,
        status: now > dueDate ? 'overdue' : 'pending',
        matchedRowId: null,
        reconciledAt: null
      };
    });

    const count = (status) => reconciledClaims.filter((claim) => claim.status === status).length;
    const amount = (status) => roundMoney(reconciledClaims
      .filter((claim) => (status ? claim.status === status : claim.status !== 'cancelled'))
      .reduce((sum, claim) => sum + claimAmount(claim), 0));
    return {
      claims: reconciledClaims,
      unmatchedRefunds: refunds.filter((refund) => !usedRefundIds.has(refund.rowId)),
      summary: {
        total: reconciledClaims.length,
        pending: count('pending'),
        overdue: count('overdue'),
        reconciled: count('reconciled'),
        cancelled: count('cancelled'),
        expectedAmount: amount(),
        pendingAmount: amount('pending'),
        overdueAmount: amount('overdue'),
        reconciledAmount: amount('reconciled')
      }
    };
  }

  const exported = {
    stableRowId,
    withStableRowIds,
    matchKeywordRule,
    ruleMatchesRow,
    deriveCategoryRule,
    applyKeywordRules,
    applyOverrides,
    applyPreferences,
    monthWindow,
    getMonthWindow: monthWindow,
    buildBudgetSummary,
    budgetSummary: buildBudgetSummary,
    reconcileRefundClaims
  };

  root.MarketTratPreferences = exported;
  if (typeof module !== 'undefined') module.exports = exported;
})(typeof globalThis !== 'undefined' ? globalThis : window);
