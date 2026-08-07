'use strict';

const assert = require('node:assert/strict');
const utils = require('./analytics-utils.js');

assert.equal(utils.formatCount(21, ['покупка', 'покупки', 'покупок']), '21 покупка');
assert.equal(utils.formatCount(12, ['покупка', 'покупки', 'покупок']), '12 покупок');
assert.equal(utils.parseRowDate('2026-02-29'), null);
assert.equal(utils.parseRowDate('2024-02-29').toISOString(), '2024-02-29T00:00:00.000Z');
assert.equal(utils.periodKey(new Date('2026-01-01T00:00:00Z'), 'week'), '2026-W01');
assert.deepEqual(utils.periodBounds('2026-02', 'month'), { from: '2026-02-01', to: '2026-02-28' });
assert.deepEqual(utils.quickPeriodRange('last-7-days', new Date(2024, 5, 17)), { from: '2024-06-11', to: '2024-06-17' });
assert.deepEqual(utils.previousRange({ from: Date.UTC(2026, 0, 8), to: Date.UTC(2026, 0, 14) }), {
  from: Date.UTC(2026, 0, 1),
  to: Date.UTC(2026, 0, 7)
});

console.log('analytics-utils.test.js: ok');
