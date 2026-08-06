const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const context = {
  console,
  globalThis: null,
  MarketTratTestMode: true,
  window: null,
  location: { href: 'https://www.ozon.ru/my/e-check', origin: 'https://www.ozon.ru', pathname: '/my/e-check' },
  navigator: { hardwareConcurrency: 8 },
  performance: { getEntriesByType: () => [] },
  document: { documentElement: { innerHTML: '' }, querySelectorAll: () => [] },
  chrome: {
    runtime: {
      onMessage: { addListener() {} },
      sendMessage: () => Promise.resolve({}),
      getURL: (value) => value
    }
  },
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

const {
  filterOzonRows,
  foldDeliveryIntoRows,
  parseOzonPdfRows,
  extractYandexPageTokenFromHtml,
  hasYandexNextOrdersPage
} = context.MarketTratOzonTest;

function row(overrides = {}) {
  return {
    source: 'ozon',
    date: '2026-01-01 10:00',
    amount: '100.00',
    currency: 'RUB',
    title: 'Товар A',
    type: 'purchase',
    is_return: '0',
    marketplace_id: 'ORDER-1',
    receipt_url: 'https://www.ozon.ru/receipt?id=receipt-1',
    raw_title: 'Заказ №ORDER-1',
    item_index: '1',
    ...overrides
  };
}

const partialSettlement = filterOzonRows([
  row({ __ozonSettlementKind: 'prepayment' }),
  row({ title: 'Товар B', amount: '200.00', item_index: '2', __ozonSettlementKind: 'prepayment' }),
  row({ date: '2026-01-02 10:00', receipt_url: 'https://www.ozon.ru/receipt?id=receipt-2', __ozonSettlementKind: 'full' })
]);
assert.equal(partialSettlement.rows.map((item) => item.title).join(','), 'Товар B,Товар A');
assert.equal(partialSettlement.rows.reduce((sum, item) => sum + Number(item.amount), 0), 300);
assert.equal(partialSettlement.prepaymentRowsDropped, 1);

const splitFullSettlement = filterOzonRows([
  row({ item_index: '1', __ozonSettlementKind: 'prepayment' }),
  row({ item_index: '2', __ozonSettlementKind: 'prepayment' }),
  row({ date: '2026-01-02 10:00', receipt_url: 'https://www.ozon.ru/receipt?id=full-1', __ozonSettlementKind: 'full' }),
  row({ date: '2026-01-03 10:00', receipt_url: 'https://www.ozon.ru/receipt?id=full-2', __ozonSettlementKind: 'full' })
]);
assert.equal(splitFullSettlement.prepaymentRowsDropped, 2);
assert.equal(splitFullSettlement.rows.length, 2);
assert.equal(splitFullSettlement.rows.reduce((sum, item) => sum + Number(item.amount), 0), 200);

const repeatedPurchase = filterOzonRows([
  row({ date: '2026-01-01 10:00', receipt_url: 'https://www.ozon.ru/receipt?id=purchase-1' }),
  row({ date: '2026-02-01 10:00', receipt_url: 'https://www.ozon.ru/receipt?id=refund', amount: '-100.00', type: 'refund', is_return: '1' }),
  row({ date: '2026-03-01 10:00', receipt_url: 'https://www.ozon.ru/receipt?id=purchase-2' })
]);
assert.equal(repeatedPurchase.rows.map((item) => item.amount).join(','), '100.00,-100.00,100.00');
assert.equal(repeatedPurchase.adjustmentRowsDropped, 0);

const identicalItems = filterOzonRows([
  row({ item_index: '1' }),
  row({ item_index: '2' })
]);
assert.equal(identicalItems.rows.length, 2);

const deliveryOnly = foldDeliveryIntoRows([
  row({ title: 'Доставка', amount: '299.00' })
]);
assert.equal(deliveryOnly.rows.length, 1);
assert.equal(deliveryOnly.rows[0].amount, '299.00');
assert.equal(deliveryOnly.deliveryRowsDropped, 0);

const oppositeSignDelivery = foldDeliveryIntoRows([
  row({ title: 'Товар', amount: '100.00' }),
  row({ title: 'Доставка', amount: '-10.00', type: 'refund', is_return: '1' })
]);
assert.equal(oppositeSignDelivery.rows.reduce((sum, item) => sum + Number(item.amount), 0), 90);
assert.equal(oppositeSignDelivery.rows.length, 2);

const allocatedDelivery = foldDeliveryIntoRows([
  row({ title: 'Товар A', amount: '100.00', item_index: '1' }),
  row({ title: 'Товар B', amount: '300.00', item_index: '2' }),
  row({ title: 'Доставка', amount: '40.00', item_index: '3' })
]);
assert.equal(allocatedDelivery.rows.map((item) => item.amount).join(','), '110.00,330.00');
assert.equal(allocatedDelivery.rows.reduce((sum, item) => sum + Number(item.amount), 0), 440);

const fallbackRecord = row({ date: '', title: 'Чек' });
const purchase = parseOzonPdfRows(`
  КАССОВЫЙ ЧЕК
  02.06.2026 11:50
  ПОЛНЫЙ РАСЧЕТ
  1. Товар A
  ≡ 699,00
  ИТОГ ≡ 699,00
`, fallbackRecord);
assert.equal(purchase[0].amount, '699.00');
assert.equal(purchase[0].type, 'purchase');

const refund = parseOzonPdfRows(`
  КАССОВЫЙ ЧЕК ВОЗВРАТ ПРИХОДА
  03.06.2026 11:50
  1. Товар A
  ≡ 699,00
  ИТОГ ≡ 699,00
`, fallbackRecord);
assert.equal(refund[0].amount, '-699.00');
assert.equal(refund[0].type, 'refund');
assert.equal(parseOzonPdfRows('чек без строк и итога', fallbackRecord).length, 0);
const mismatchedTotal = parseOzonPdfRows(`
  КАССОВЫЙ ЧЕК
  04.06.2026 11:50
  1. Товар A
  ≡ 100,00
  ИТОГ ≡ 300,00
`, fallbackRecord);
assert.equal(mismatchedTotal.length, 1);
assert.equal(mismatchedTotal[0].parse_quality, 'fallback');
assert.equal(mismatchedTotal[0].amount, '300.00');
const ozonMissingTotal = parseOzonPdfRows(`
  КАССОВЫЙ ЧЕК
  04.06.2026 11:50
  1. Товар A
  ≡ 100,00
`, fallbackRecord);
assert.equal(ozonMissingTotal[0].parse_quality, 'unverified');

function ozonSettlementReceipt({ receiptId, date, settlement, itemAmount, total }) {
  const fallback = row({
    date: '',
    receipt_url: `https://www.ozon.ru/receipt?id=${receiptId}`,
    title: 'Чек заказа'
  });
  return parseOzonPdfRows(`
    КАССОВЫЙ ЧЕК
    ${date}
    ${settlement}
    1. Товар A
    ≡ ${itemAmount},00
    ИТОГ ≡ ${total},00
  `, fallback);
}

const aggregatePrepayment = ozonSettlementReceipt({
  receiptId: 'aggregate-pre', date: '01.06.2026 11:50', settlement: 'ПРЕДОПЛАТА 100%', itemAmount: 100, total: 300
});
const partialFull = ozonSettlementReceipt({
  receiptId: 'aggregate-full-100', date: '02.06.2026 11:50', settlement: 'ПОЛНЫЙ РАСЧЕТ', itemAmount: 100, total: 100
});
const partiallyBalanced = filterOzonRows([...aggregatePrepayment, ...partialFull]);
assert.equal(partiallyBalanced.rows.reduce((sum, item) => sum + Number(item.amount), 0), 300);
assert.equal(partiallyBalanced.aggregatePrepaymentRowsAdjusted, 1);
assert.ok(partiallyBalanced.supersededReceipts.includes('https://www.ozon.ru/receipt?id=aggregate-pre'));

const completeFull = ozonSettlementReceipt({
  receiptId: 'aggregate-full-300', date: '02.06.2026 11:50', settlement: 'ПОЛНЫЙ РАСЧЕТ', itemAmount: 300, total: 300
});
const fullyBalanced = filterOzonRows([...aggregatePrepayment, ...completeFull]);
assert.equal(fullyBalanced.rows.reduce((sum, item) => sum + Number(item.amount), 0), 300);
assert.equal(fullyBalanced.aggregatePrepaymentRowsDropped, 1);

const secondAggregatePrepayment = ozonSettlementReceipt({
  receiptId: 'aggregate-pre-2', date: '02.06.2026 11:50', settlement: 'ПРЕДОПЛАТА 100%', itemAmount: 100, total: 300
});
const additiveFull = ozonSettlementReceipt({
  receiptId: 'aggregate-full-additive', date: '03.06.2026 11:50', settlement: 'ПОЛНЫЙ РАСЧЕТ', itemAmount: 100, total: 100
});
const additiveBalanced = filterOzonRows([
  ...aggregatePrepayment,
  ...secondAggregatePrepayment,
  ...additiveFull
]);
assert.equal(additiveBalanced.rows.reduce((sum, item) => sum + Number(item.amount), 0), 600);
assert.equal(additiveBalanced.aggregatePrepaymentRowsAdjusted, 1);
assert.ok(additiveBalanced.supersededReceipts.includes('https://www.ozon.ru/receipt?id=aggregate-pre-2'));

const yandexNextWithoutToken = '{"hasNext":true,"orders":[{"id":123456}]}';
assert.equal(hasYandexNextOrdersPage(yandexNextWithoutToken), true);
assert.equal(extractYandexPageTokenFromHtml(yandexNextWithoutToken), '');

console.log('ozon.test.js: ok');
