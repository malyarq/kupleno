'use strict';

const assert = require('node:assert/strict');
const health = require('./source-health.js');

const ozon = health.diagnostic('ozon', {
  ozon: { receipts: 10, parsedReceipts: 9, failedReceipts: 1, itemRows: 20, fallbackReceipts: 1 }
}, { ozon: 'Ozon' });
assert.equal(ozon.warning, true);
assert.match(ozon.title, /пропущено 1/);
assert.deepEqual(health.connectionState({ selected: false, permissionGranted: false }), { state: 'idle', label: 'Не выбран' });
assert.deepEqual(health.connectionState({ selected: true, permissionGranted: false }), { state: 'selected', label: 'Доступ запросится при сборе' });
assert.deepEqual(health.connectionState({ selected: true, permissionGranted: true }), { state: 'ready', label: 'Готов к сбору' });
assert.deepEqual(health.connectionState({ status: { state: 'error' } }), { state: 'error', label: 'Нужно повторить' });

console.log('source-health.test.js: ok');
