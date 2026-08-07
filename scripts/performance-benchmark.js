'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const analytics = require('../extension/analytics-core.js');
const reportQuality = require('../extension/report-quality.js');
const categories = require('../extension/categories.js');

const root = path.join(__dirname, '..');
const rowCount = 100_000;
const categoryNames = analytics.macroGroups.flatMap((group) => group.categories).filter((category) => category !== 'unknown');
const sources = ['ozon', 'wildberries', 'yandex'];
const rows = Array.from({ length: rowCount }, (_, index) => ({
  source: sources[index % sources.length],
  date: `2025-${String(index % 12 + 1).padStart(2, '0')}-${String(index % 27 + 1).padStart(2, '0')}`,
  title: `Покупка ${index}`,
  amount: index % 31 === 0 ? -99 : 100 + index % 5000,
  category: categoryNames[index % categoryNames.length],
  parse_quality: index % 997 === 0 ? 'unverified' : 'complete'
}));

function measure(run) {
  const started = performance.now();
  const value = run();
  return { value, ms: Math.round((performance.now() - started) * 10) / 10 };
}

const macro = measure(() => analytics.buildCategoryBreakdown(rows, rows.slice(0, 10_000), 'macro'));
const detail = measure(() => analytics.buildCategoryBreakdown(rows, rows.slice(0, 10_000), 'detail'));
const audit = measure(() => reportQuality.auditCollection(rows, {
  sources,
  stats: Object.fromEntries(sources.map((source) => [source, {
    receipts: Math.ceil(rowCount / sources.length),
    parsedReceipts: Math.ceil(rowCount / sources.length),
    itemRows: Math.ceil(rowCount / sources.length)
  }]))
}));
const classifierTitles = ['Кофе молотый', 'Крем для обуви', 'Ключ активации Windows 11 Pro', 'Чехол для электронной книги'];
const classifier = measure(() => Array.from({ length: 10_000 }, (_, index) => (
  categories.classifySpendCategory(`${classifierTitles[index % classifierTitles.length]} партия ${index}`)
)));

const result = {
  rows: rowCount,
  analyticsMacroMs: macro.ms,
  analyticsDetailMs: detail.ms,
  reportAuditMs: audit.ms,
  categoryClassifications: classifier.value.length,
  categoryClassifierMs: classifier.ms,
  totalMs: Math.round((macro.ms + detail.ms + audit.ms + classifier.ms) * 10) / 10
};

assert.equal(macro.value.entries.length, analytics.macroGroups.length - 1);
assert.ok(detail.value.entries.length >= 20);
assert.equal(audit.value.rowCount, rowCount);
assert.ok(result.analyticsMacroMs < 1_500, `крупные категории: ${result.analyticsMacroMs} мс`);
assert.ok(result.analyticsDetailMs < 1_500, `подробные категории: ${result.analyticsDetailMs} мс`);
assert.ok(result.reportAuditMs < 1_500, `проверка полноты: ${result.reportAuditMs} мс`);
assert.ok(result.categoryClassifierMs < 2_000, `определение 10 000 категорий: ${result.categoryClassifierMs} мс`);
assert.ok(result.totalMs < 4_000, `общий бюджет превышен: ${result.totalMs} мс`);

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'performance-core.json'), `${JSON.stringify(result, null, 2)}\n`);
console.log(`performance: ok (${result.totalMs} мс)`);
