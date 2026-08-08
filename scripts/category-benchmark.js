'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { classifySpendCategory, setSpendCategoryRules } = require('../extension/categories.js');

const root = path.join(__dirname, '..');
const benchmark = JSON.parse(fs.readFileSync(path.join(root, 'extension/category-benchmark.json'), 'utf8'));
const rulePack = JSON.parse(fs.readFileSync(path.join(root, 'extension/category-rules.json'), 'utf8'));
setSpendCategoryRules(rulePack);
const cases = Array.isArray(benchmark.cases) ? benchmark.cases : [];
const normal = cases.filter((entry) => entry.kind !== 'ambiguous');
const ambiguous = cases.filter((entry) => entry.kind === 'ambiguous');
const categories = new Set(normal.map((entry) => entry.expected));

assert.ok(cases.length >= 180, 'эталон должен содержать не меньше 180 названий');
assert.ok(categories.size >= 25, 'эталон должен покрывать не меньше 25 категорий');
assert.ok(normal.length >= 150, 'эталон должен содержать не меньше 150 обычных названий');
assert.ok(ambiguous.length >= 25, 'эталон должен содержать опасные неоднозначности');

const stats = {
  autoCorrect: 0,
  queuedCorrect: 0,
  unresolved: 0,
  unsafeWrong: [],
  ambiguousSafe: 0,
  ambiguousUnsafe: []
};

for (const entry of normal) {
  const result = classifySpendCategory(entry.title);
  if (result.category === entry.expected) {
    stats.autoCorrect += 1;
  } else if (result.category === 'unknown' && result.suggestedCategory === entry.expected && result.needsReview) {
    stats.queuedCorrect += 1;
  } else if (result.category === 'unknown' && result.needsReview) {
    stats.unresolved += 1;
  } else {
    stats.unsafeWrong.push({
      title: entry.title,
      expected: entry.expected,
      actual: result.category,
      suggestion: result.suggestedCategory,
      confidence: result.confidence,
      review: result.needsReview
    });
  }
}

for (const entry of ambiguous) {
  const result = classifySpendCategory(entry.title);
  if (result.category === 'unknown' && result.needsReview) stats.ambiguousSafe += 1;
  else stats.ambiguousUnsafe.push({
    title: entry.title,
    actual: result.category,
    suggestion: result.suggestedCategory,
    confidence: result.confidence,
    review: result.needsReview
  });
}

const handled = stats.autoCorrect + stats.queuedCorrect;
const coverage = handled / normal.length;
const autoCoverage = stats.autoCorrect / normal.length;
const autoPrecision = stats.autoCorrect / Math.max(1, stats.autoCorrect + stats.unsafeWrong.length);
const summary = {
  cases: cases.length,
  categories: categories.size,
  normal: normal.length,
  ambiguous: ambiguous.length,
  autoCorrect: stats.autoCorrect,
  queuedCorrect: stats.queuedCorrect,
  unresolved: stats.unresolved,
  unsafeWrong: stats.unsafeWrong.length,
  ambiguousSafe: stats.ambiguousSafe,
  ambiguousUnsafe: stats.ambiguousUnsafe.length,
  coverage: Number(coverage.toFixed(3)),
  autoCoverage: Number(autoCoverage.toFixed(3)),
  autoPrecision: Number(autoPrecision.toFixed(3))
};

if (stats.unsafeWrong.length) console.error('Опасные неверные категории:', JSON.stringify(stats.unsafeWrong, null, 2));
if (stats.ambiguousUnsafe.length) console.error('Неоднозначности приняты без проверки:', JSON.stringify(stats.ambiguousUnsafe, null, 2));
console.log(`category benchmark: ${JSON.stringify(summary)}`);

assert.equal(stats.unsafeWrong.length, 0, 'эталон не допускает уверенную неверную категорию');
assert.equal(stats.ambiguousUnsafe.length, 0, 'неоднозначные названия должны оставаться без категории');
assert.ok(coverage >= 0.9, `категория или правильная подсказка нужны минимум для 90% эталона, получено ${summary.coverage}`);
assert.ok(autoCoverage >= 0.7, `не меньше 70% обычных названий должны определяться без ручной работы, получено ${summary.autoCoverage}`);
assert.ok(autoPrecision >= 0.98, `точность автоматических решений должна быть не ниже 98%, получено ${summary.autoPrecision}`);
