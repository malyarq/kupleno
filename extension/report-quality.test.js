'use strict';

const assert = require('node:assert/strict');
const quality = require('./report-quality.js');

const complete = quality.auditCollection([
  { source: 'ozon', date: '2026-01-01', amount: '100.00', parse_quality: 'complete' },
  { source: 'ozon', date: '2026-02-01', amount: '200.00', parse_quality: 'complete' }
], {
  sources: ['ozon'],
  stats: { ozon: { receipts: 2, parsedReceipts: 2, itemRows: 2 } },
  warnings: []
});
assert.equal(complete.state, 'complete');
assert.equal(complete.coverage, 100);
assert.equal(complete.totalAmount, 300);
assert.deepEqual({ from: complete.sources[0].from, to: complete.sources[0].to }, { from: '2026-01-01', to: '2026-02-01' });

const partial = quality.auditCollection([
  { source: 'wildberries', date: '2026-02-01', amount: '900.00', parse_quality: 'fallback' },
  { source: 'wildberries', date: '2026-02-02', amount: '100.00', parse_quality: 'unverified' }
], {
  sources: ['wildberries'],
  stats: { wildberries: { receipts: 3, parsedReceipts: 2, fallbackReceipts: 1, unverifiedReceipts: 1, itemRows: 2 } },
  warnings: ['Wildberries: один чек не разобран']
});
assert.equal(partial.state, 'attention');
assert.equal(partial.missingReceipts, 1);
assert.equal(partial.fallbackAmount, 900);
assert.equal(partial.unverifiedAmount, 100);

const imported = quality.auditCollection([{ source: 'ozon', date: '2026-01-01', amount: '42.00' }], {});
assert.equal(imported.state, 'imported');
assert.equal(imported.coverage, null);

const mixed = quality.auditCollection([
  { source: 'ozon', amount: '42.00' },
  { source: 'ozon', amount: '100.00', parse_quality: 'complete' }
], {
  sources: ['ozon'],
  stats: { ozon: { receipts: 1, parsedReceipts: 1 } },
  hasUnverifiedCsv: true
});
assert.equal(mixed.state, 'mixed', 'новый сбор не подтверждает полноту ранее импортированного CSV');
assert.equal(mixed.parsed, 1);
assert.equal(mixed.rowCount, 2);
assert.equal(quality.auditCollection([
  { source: 'ozon', amount: '42.00' },
  { source: 'yandex', amount: '100.00' }
], { stats: { ozon: { receipts: 1, parsedReceipts: 1 } } }).state, 'attention');

console.log('report-quality.test.js: ok');
