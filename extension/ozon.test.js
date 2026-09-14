const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const context = {
  console,
  globalThis: null,
  KuplenoTestMode: true,
  window: null,
  location: { href: 'https://www.ozon.ru/my/e-check', origin: 'https://www.ozon.ru', pathname: '/my/e-check' },
  navigator: { hardwareConcurrency: 8 },
  performance: { getEntriesByType: () => [] },
  document: {
    cookie: 'wbid-sdk-id-token=x.eyJpc3MiOiJ3Yi5ydSJ9.x',
    documentElement: { innerHTML: '' },
    querySelectorAll: () => []
  },
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
  AbortController,
  atob
};
context.globalThis = context;
context.window = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8'), context);

const {
  filterOzonRows,
  foldDeliveryIntoRows,
  parseOzonPdfRows,
  normalizeText,
  decodeHtmlEntities,
  assertCollectedRowLimit,
  extractYandexPageTokenFromHtml,
  hasYandexNextOrdersPage,
  normalizeWbReceiptPayload,
  wbPayloadShape,
  collectWildberries
} = context.KuplenoOzonTest;

assert.equal(normalizeText('&amp;'), '&');
assert.equal(normalizeText('\\u0026amp;'), '&amp;', 'unicode-escape не должен создавать второе раскодирование');
assert.equal(decodeHtmlEntities('&amp;'), '&');
assert.equal(decodeHtmlEntities('&#38;amp;'), '&amp;', 'HTML-сущность не должна раскодироваться дважды');

assert.doesNotThrow(() => assertCollectedRowLimit(100000));
assert.throws(() => assertCollectedRowLimit(100001), /Сбор остановлен/);

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

const spacedOrderNumber = filterOzonRows([
  row({ raw_title: 'Заказ № ORDER-SPACED', __ozonSettlementKind: 'prepayment' }),
  row({
    raw_title: 'Заказ   №   ORDER-SPACED',
    date: '2026-01-02 10:00',
    receipt_url: 'https://www.ozon.ru/receipt?id=receipt-spaced-full',
    __ozonSettlementKind: 'full'
  })
]);
assert.equal(spacedOrderNumber.rows.length, 1, 'пробел после № не должен разделять расчёты одного заказа');
assert.equal(spacedOrderNumber.prepaymentRowsDropped, 1);
assert.equal(spacedOrderNumber.rows[0].ozon_settlement_kind, 'full');
assert.ok(spacedOrderNumber.supersededReceipts.includes('https://www.ozon.ru/receipt?id=receipt-1'));

const liveOrderPrefix = '55887469-0288';
const livePrepaymentUrl = `https://www.ozon.ru/_action/downloadCheque?chequeId=${liveOrderPrefix}-ae92b46c-7399-4fa3-aeeb-e472be915820-0-0`;
const liveFullUrl = `https://www.ozon.ru/_action/downloadCheque?chequeId=${liveOrderPrefix}-82307747-54ad-4999-b8da-40646d7a0fbb-0-0`;
const liveStyleSiblingSettlements = filterOzonRows([
  row({ marketplace_id: '', receipt_url: livePrepaymentUrl, raw_title: 'Ozon cheque', __ozonSettlementKind: 'prepayment' }),
  row({ marketplace_id: '', receipt_url: liveFullUrl, raw_title: 'Ozon cheque', date: '2026-01-02 10:00', __ozonSettlementKind: 'full' }),
  row({ marketplace_id: '', receipt_url: liveFullUrl, raw_title: 'Ozon cheque', date: '2026-01-02 10:00', title: 'Доставка', amount: '40.00', item_index: '2', __ozonSettlementKind: 'full' })
]);
assert.equal(liveStyleSiblingSettlements.rows.length, 1, 'chequeId должен связывать предоплату и финальный чек заказа');
assert.equal(liveStyleSiblingSettlements.rows[0].amount, '140.00', 'доставка учитывается один раз в финальном чеке');
assert.equal(liveStyleSiblingSettlements.prepaymentRowsDropped, 1);
assert.ok(liveStyleSiblingSettlements.supersededReceipts.includes(livePrepaymentUrl));

const splitFullSettlement = filterOzonRows([
  row({ item_index: '1', __ozonSettlementKind: 'prepayment' }),
  row({ item_index: '2', __ozonSettlementKind: 'prepayment' }),
  row({ date: '2026-01-02 10:00', receipt_url: 'https://www.ozon.ru/receipt?id=full-1', __ozonSettlementKind: 'full' }),
  row({ date: '2026-01-03 10:00', receipt_url: 'https://www.ozon.ru/receipt?id=full-2', __ozonSettlementKind: 'full' })
]);
assert.equal(splitFullSettlement.prepaymentRowsDropped, 2);
assert.equal(splitFullSettlement.rows.length, 2);
assert.equal(splitFullSettlement.rows.reduce((sum, item) => sum + Number(item.amount), 0), 200);

const unresolvedPrepayment = filterOzonRows([
  row({ receipt_url: 'https://www.ozon.ru/receipt?id=unresolved-prepayment' }),
  row({ date: '2026-01-02 10:00', receipt_url: 'https://www.ozon.ru/receipt?id=resolved-full', __ozonSettlementKind: 'full' })
]);
assert.equal(unresolvedPrepayment.rows.length, 1, 'ранний неопределённый чек не должен дублировать итоговый расчёт заказа');
assert.equal(unresolvedPrepayment.rows[0].ozon_settlement_kind, 'full');
assert.equal(unresolvedPrepayment.duplicateRowsDropped, 1);

const unresolvedSplitSettlement = filterOzonRows([
  row({ receipt_url: 'https://www.ozon.ru/receipt?id=unresolved-split', title: 'Товар A', item_index: '1' }),
  row({ receipt_url: 'https://www.ozon.ru/receipt?id=unresolved-split', title: 'Товар B', item_index: '2' }),
  row({ date: '2026-01-02 10:00', receipt_url: 'https://www.ozon.ru/receipt?id=resolved-a', title: 'Товар A', __ozonSettlementKind: 'full' }),
  row({ date: '2026-01-03 10:00', receipt_url: 'https://www.ozon.ru/receipt?id=resolved-b', title: 'Товар B', __ozonSettlementKind: 'full' })
]);
assert.equal(unresolvedSplitSettlement.rows.length, 2, 'итоговые чеки по частям должны целиком заменять ранний чек заказа');
assert.equal(unresolvedSplitSettlement.duplicateRowsDropped, 2);

const unresolvedWithoutFullCoverage = filterOzonRows([
  row({ receipt_url: 'https://www.ozon.ru/receipt?id=unresolved-partial', title: 'Товар A', item_index: '1' }),
  row({ receipt_url: 'https://www.ozon.ru/receipt?id=unresolved-partial', title: 'Товар B', item_index: '2' }),
  row({ date: '2026-01-02 10:00', receipt_url: 'https://www.ozon.ru/receipt?id=resolved-only-a', title: 'Товар A', __ozonSettlementKind: 'full' })
]);
assert.equal(unresolvedWithoutFullCoverage.rows.length, 2, 'сопоставленная позиция заменяется, несопоставленная остаётся');
assert.equal(unresolvedWithoutFullCoverage.duplicateRowsDropped, 1);

// One early receipt, two final receipts with split delivery (live regression).
const splitDeliveryRows = [
  row({ title: 'Device', amount: '300.00' }),
  row({ title: 'Accessory', amount: '100.00', item_index: '2' }),
  row({ title: 'Доставка', amount: '30.00', item_index: '3' }),
  row({ date: '2026-01-02', receipt_url: 'https://www.ozon.ru/receipt?id=final-a', title: 'Device', amount: '300.00', __ozonSettlementKind: 'full' }),
  row({ date: '2026-01-02', receipt_url: 'https://www.ozon.ru/receipt?id=final-a', title: 'Доставка', amount: '20.00', item_index: '2', __ozonSettlementKind: 'full' }),
  row({ date: '2026-01-03', receipt_url: 'https://www.ozon.ru/receipt?id=final-b', title: 'Accessory', amount: '100.00', __ozonSettlementKind: 'full' }),
  row({ date: '2026-01-03', receipt_url: 'https://www.ozon.ru/receipt?id=final-b', title: 'Доставка', amount: '10.00', item_index: '2', __ozonSettlementKind: 'full' })
];
const splitDelivery = filterOzonRows(splitDeliveryRows);
assert.equal(splitDelivery.rows.length, 2);
assert.equal(splitDelivery.rows.reduce((sum, item) => sum + Number(item.amount), 0), 430);
assert.equal(splitDelivery.duplicateRowsDropped, 3);
assert.ok(splitDelivery.supersededReceipts.includes(splitDeliveryRows[0].receipt_url));
const missingDelivery = filterOzonRows(splitDeliveryRows.filter((item) => item.amount !== '10.00'));
assert.equal(missingDelivery.duplicateRowsDropped, 2);
assert.ok(missingDelivery.rows.some(item => item.title === 'Доставка' && item.amount === '30.00'), 'uncovered delivery must remain');
const otherOrderDelivery = filterOzonRows(splitDeliveryRows.map((item) => item.amount === '10.00'
  ? { ...item, raw_title: 'Заказ №OTHER' } : item));
assert.equal(otherOrderDelivery.duplicateRowsDropped, 2, 'another order cannot cover delivery');
assert.ok(otherOrderDelivery.rows.some(item => item.title === 'Доставка' && item.amount === '30.00'));

const partiallyReturnedRows = [
  row({ title: 'Device', amount: '300.00' }),
  row({ title: 'Returned accessory', amount: '50.00', item_index: '2' }),
  row({ title: 'Device', amount: '300.00', date: '2026-01-02', receipt_url: 'https://www.ozon.ru/receipt?id=final', __ozonSettlementKind: 'full' }),
  row({ title: 'Returned accessory', amount: '-50.00', date: '2026-01-03', receipt_url: 'https://www.ozon.ru/receipt?id=refund', type: 'refund', is_return: '1' })
];
const partiallyReturned = filterOzonRows(partiallyReturnedRows);
assert.equal(partiallyReturned.rows.length, 3);
assert.equal(partiallyReturned.rows.reduce((sum, item) => sum + Number(item.amount), 0), 300);
assert.equal(partiallyReturned.rows.filter((item) => item.title === 'Returned accessory').length, 2);
assert.equal(partiallyReturned.duplicateRowsDropped, 1);
const insufficientRefund = filterOzonRows(partiallyReturnedRows.map((item) => item.type === 'refund'
  ? { ...item, amount: '-25.00' } : item));
assert.equal(insufficientRefund.duplicateRowsDropped, 1);
assert.ok(insufficientRefund.rows.some(item => item.amount === '50.00'));
const priorRefund = filterOzonRows(partiallyReturnedRows.map((item) => item.type === 'refund'
  ? { ...item, date: '2025-12-01' } : item));
assert.equal(priorRefund.duplicateRowsDropped, 1);
assert.ok(priorRefund.rows.some(item => item.amount === '50.00'));

const quantities = filterOzonRows([
  row({ amount: '80.00', item_index: '1' }),
  row({ amount: '80.00', item_index: '2' }),
  row({ amount: '160.00', date: '2026-01-02', receipt_url: 'https://www.ozon.ru/receipt?id=combined', __ozonSettlementKind: 'full' })
]);
assert.equal(quantities.rows.length, 1);
assert.equal(quantities.rows[0].amount, '160.00');
const splitQuantity = filterOzonRows([
  row({ amount: '160.00' }),
  row({ amount: '80.00', date: '2026-01-02', receipt_url: 'https://www.ozon.ru/receipt?id=split-1', __ozonSettlementKind: 'full' }),
  row({ amount: '80.00', date: '2026-01-03', receipt_url: 'https://www.ozon.ru/receipt?id=split-2', __ozonSettlementKind: 'full' })
]);
assert.equal(splitQuantity.rows.length, 2);
assert.equal(splitQuantity.rows.reduce((sum, item) => sum + Number(item.amount), 0), 160);
const changedPrice = filterOzonRows([
  row({ amount: '100.00' }),
  row({ amount: '99.00', date: '2026-01-02', receipt_url: 'https://www.ozon.ru/receipt?id=price', __ozonSettlementKind: 'full' })
]);
assert.equal(changedPrice.rows.length, 2, 'unequal product prices need evidence, not a tolerance');
const sharedCover = filterOzonRows([
  row({ receipt_url: 'https://www.ozon.ru/receipt?id=early-1' }),
  row({ receipt_url: 'https://www.ozon.ru/receipt?id=early-2' }),
  row({ date: '2026-01-02', receipt_url: 'https://www.ozon.ru/receipt?id=cover', __ozonSettlementKind: 'full' })
]);
assert.equal(sharedCover.rows.length, 2, 'one final item can replace only one early item');

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

const deliverySettlement = filterOzonRows([
  row({ title: 'Доставка', amount: '150.00' }),
  row({ title: 'Доставка', amount: '150.00', date: '2026-01-02', receipt_url: 'https://www.ozon.ru/receipt?id=delivery-final', __ozonSettlementKind: 'full' })
]);
assert.equal(deliverySettlement.rows.length, 1, 'standalone delivery receipts also have a settlement lifecycle');
assert.equal(deliverySettlement.rows[0].amount, '150.00');
assert.equal(deliverySettlement.rows[0].ozon_settlement_kind, 'full');
assert.equal(deliverySettlement.duplicateRowsDropped, 1);
const uncoveredDeliveryOnly = filterOzonRows([
  row({ title: 'Доставка', amount: '150.00' }),
  row({ title: 'Доставка', amount: '100.00', date: '2026-01-02', receipt_url: 'https://www.ozon.ru/receipt?id=delivery-part', __ozonSettlementKind: 'full' })
]);
assert.equal(uncoveredDeliveryOnly.rows.length, 2);

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

async function verifyWildberriesPagination() {
  assert.equal(JSON.stringify(normalizeWbReceiptPayload({
    data: { result: { data: { receipts: [], nextReceiptUid: '' } } }
  })), JSON.stringify({ receipts: [], nextReceiptUid: '' }));
  assert.equal(normalizeWbReceiptPayload({ error: 'token expired' }), null);
  const direct = { receipts: [{ receiptUid: 'sample' }], nextReceiptUid: 'next' };
  for (const wrapper of [direct, { result: direct }, { data: direct }, { data: { result: direct } }, { data: { GetReceiptsV4V1: direct } }]) {
    assert.equal(JSON.stringify(normalizeWbReceiptPayload(wrapper)), JSON.stringify(direct));
  }
  const shape = wbPayloadShape({ data: { receipts: [{ receiptUid: 'private-receipt' }] }, token: 'private-token', message: 'private-message' });
  assert.match(shape, /receipts:array\(1\)/);
  assert.doesNotMatch(shape, /private/);


  context.location.href = 'https://www.wildberries.ru/lk/receipts/get';
  let payloads = [
    { data: { result: { data: { receipts: [{ receiptUid: 'first' }], nextReceiptUid: 'cursor-2' } } } },
    { data: { result: { data: { receipts: [], nextReceiptUid: '' } } } }
  ];
  context.fetch = async () => new Response(JSON.stringify(payloads.shift()), { status: 200 });
  const twoPageResult = await collectWildberries({
    maxPages: 3,
    pageSize: 10,
    apiPauseMs: 0,
    knownReceipts: [],
    knownReceiptTail: 30
  });
  assert.equal(JSON.stringify(twoPageResult), JSON.stringify({
    receipts: [{ receiptUid: 'first' }],
    stats: { receipts: 1, apiPages: 2, pageSize: 10, incrementalStopped: false, limitReached: false, paginationIncomplete: false, paginationError: '' }
  }));

  const page = (ids, cursor) => ({ data: { receipts: ids.map(receiptUid => ({ receiptUid })), nextReceiptUid: cursor } });
  const options = { maxPages: 3, pageSize: 10, apiPauseMs: 0, knownReceipts: [], knownReceiptTail: 30 };
  payloads = [page(['first'], 'repeat'), page(['second'], 'repeat')];
  const cycle = await collectWildberries(options);
  assert.equal(cycle.receipts.length, 2);
  assert.equal(cycle.stats.paginationIncomplete, true, 'повтор страницы не означает полную историю');
  assert.match(cycle.stats.paginationError, /повторил/);

  payloads = [page(['first'], 'last'), page(['second'], '')];
  const exactEnd = await collectWildberries({ ...options, maxPages: 2 });
  assert.equal(exactEnd.stats.limitReached, false, 'последняя страница на лимите всё ещё завершает историю');

  payloads = [page(['known'], 'older')];
  const shortTail = await collectWildberries({ ...options, maxPages: 1, knownReceipts: ['known'] });
  assert.equal(shortTail.stats.incrementalStopped, false, 'первый известный чек ещё не завершает проверочный хвост');
  assert.equal(shortTail.stats.limitReached, true, 'лимит внутри хвоста нельзя скрывать');

  payloads = [page(['known'], 'older')];
  const boundary = await collectWildberries({ ...options, maxPages: 1, knownReceipts: ['known'], knownReceiptTail: 0 });
  assert.equal(boundary.stats.incrementalStopped, true);
  assert.equal(boundary.stats.limitReached, false);

  payloads = [
    { data: { result: { data: { receipts: [{ receiptUid: 'first' }], nextReceiptUid: 'cursor-2' } } } },
    { error: 'token expired' }
  ];
  await assert.rejects(
    collectWildberries({ maxPages: 3, pageSize: 10, apiPauseMs: 0, knownReceipts: [], knownReceiptTail: 30 }),
    /неизвестный формат/
  );
}

verifyWildberriesPagination().then(() => {
  console.log('ozon.test.js: ok');
}).catch((error) => {
  process.nextTick(() => {
    throw error;
  });
});
