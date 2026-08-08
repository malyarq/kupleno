'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { parseWbReceiptItems, rowsFromYandexReceiptHtml } = require('./background.js');

const fixture = (name) => JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf8'));

const context = {
  console,
  globalThis: null,
  KuplenoTestMode: true,
  window: null,
  location: { href: 'https://www.ozon.ru/my/e-check', origin: 'https://www.ozon.ru', pathname: '/my/e-check' },
  navigator: { hardwareConcurrency: 8 },
  performance: { getEntriesByType: () => [] },
  document: { documentElement: { innerHTML: '' }, querySelectorAll: () => [] },
  chrome: { runtime: { onMessage: { addListener() {} }, sendMessage: () => Promise.resolve({}), getURL: (value) => value } },
  setTimeout,
  clearTimeout,
  URL,
  TextDecoder,
  Uint8Array,
  AbortController
};
context.globalThis = context;
context.window = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8'), context);
const { parseOzonPdfRows } = context.KuplenoOzonTest;

function assertRows(name, rows, expected) {
  assert.equal(rows.length, expected.rows, `${name}: rows`);
  if (!rows.length) return;
  assert.equal(rows.reduce((sum, row) => sum + Number(row.amount), 0).toFixed(2), Number(expected.amount).toFixed(2), `${name}: amount`);
  assert.equal(rows[0].type, expected.type, `${name}: type`);
  assert.equal(rows[0].parse_quality, expected.quality, `${name}: quality`);
}

for (const item of fixture('ozon-receipts.json')) {
  const rows = parseOzonPdfRows(item.text, {
    source: 'ozon',
    date: '',
    title: 'Чек заказа',
    marketplace_id: `fixture-${item.name}`,
    receipt_url: 'https://www.ozon.ru/receipt?id=fixture'
  });
  assertRows(`Ozon / ${item.name}`, rows, item.expected);
}

for (const item of fixture('wb-receipts.json')) {
  const rows = parseWbReceiptItems(item.html);
  assert.equal(rows.length, item.expected.rows, `Wildberries / ${item.name}: rows`);
  assert.equal(rows.reduce((sum, row) => sum + row.amount, 0), item.expected.amount, `Wildberries / ${item.name}: amount`);
  assert.deepEqual(rows.map((row) => row.title), item.expected.titles, `Wildberries / ${item.name}: titles`);
}

for (const [index, item] of fixture('yandex-receipts.json').entries()) {
  const rows = rowsFromYandexReceiptHtml({
    orderId: `fixture-${index}`,
    id: `fixture-${index}`,
    type: item.type,
    fiscalUrl: `https://check.yandex.ru/?fn=${index + 1}&fpd=1&n=1`
  }, item.html);
  assertRows(`Яндекс Маркет / ${item.name}`, rows, item.expected);
}

console.log('parser-fixtures.test.js: ok');
