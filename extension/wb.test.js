const assert = require('node:assert/strict');
const {
  allowedReceiptUrl,
  assertCollectedRowLimit,
  decodeHtml,
  fatalCollectionError,
  isWildberriesReceiptsPageReady,
  parseWbReceiptItems,
  recordsFromWbReceipt,
  rowsFromWbReceipts,
  stripTags,
  wbOperationType
} = require('./background.js');

assert.equal(allowedReceiptUrl('https://receipt.wb.ru/receipt/123'), 'https://receipt.wb.ru/receipt/123');
assert.throws(() => allowedReceiptUrl('https://evil.example/collect'), /запрещённый адрес чека/);
assert.throws(() => allowedReceiptUrl('http://receipt.wb.ru/receipt/123'), /запрещённый адрес чека/);
assert.equal(decodeHtml('&amp;'), '&');
assert.equal(decodeHtml('&#38;amp;'), '&amp;', 'вложенная сущность не должна раскодироваться дважды');
assert.equal(stripTags('<script>alert(1)</script > Товар'), 'Товар');
assert.equal(stripTags('<script>alert(1)</script\t\n data-x="1"> Товар'), 'Товар');
assert.equal(stripTags('<style>body{display:none}</style > Чек &amp; товар'), 'Чек & товар');
assert.doesNotThrow(() => assertCollectedRowLimit(100000));
assert.throws(() => assertCollectedRowLimit(100001), /Сбор остановлен/);
let overflow;
try {
  assertCollectedRowLimit(100001);
} catch (error) {
  overflow = error;
}
assert.equal(overflow.code, 'ROW_LIMIT_EXCEEDED');
assert.equal(fatalCollectionError([
  { ok: true, result: { source: 'wildberries', rows: [{ title: 'Успешная строка' }] } },
  { ok: false, error: overflow }
]), overflow, 'переполнение одного источника должно отменять весь сбор');
assert.equal(fatalCollectionError([
  { ok: true, result: { source: 'wildberries', rows: [] } },
  { ok: false, error: new Error('Ozon временно недоступен') }
]), null, 'обычная ошибка одного источника сохраняет успешную часть с предупреждением');

assert.equal(isWildberriesReceiptsPageReady({
  url: 'https://www.wildberries.ru/lk/receipts/get',
  readyState: 'complete',
  challenge: false
}), true);
assert.equal(isWildberriesReceiptsPageReady({
  url: 'https://www.wildberries.ru/lk/receipts/get',
  readyState: 'complete',
  challenge: true
}), false);
assert.equal(isWildberriesReceiptsPageReady({
  url: 'https://www.wildberries.ru/lk/receipts/get',
  readyState: 'loading',
  challenge: false
}), false);
assert.equal(isWildberriesReceiptsPageReady({
  url: 'https://www.wildberries.ru/lk/myorders/archive',
  readyState: 'complete',
  challenge: false
}), false);

function wbItem(title, amount) {
  return `
    <div class="products-item">
      <div class="products-cell products-cell_name">
        <div class="products-prop-value">Наименование ${title}</div>
      </div>
      <div class="products-cell products-cell_price"></div>
      <div class="products-cell_cost">
        <div class="products-prop-value">${amount}</div>
      </div>
    </div>
  `;
}

const items = parseWbReceiptItems(`
  ${wbItem('Футболка оверсайз', '1299,00 ₽')}
  ${wbItem('Услуга доставки', '100,00 ₽')}
  ${wbItem('Комиссия сервиса', '15,00 ₽')}
  <div class="total"></div>
`);

assert.deepEqual(items, [
  { title: 'Футболка оверсайз', amount: 1299, itemIndex: 1 },
  { title: 'Услуга доставки', amount: 100, itemIndex: 2 },
  { title: 'Комиссия сервиса', amount: 15, itemIndex: 3 }
]);
assert.equal(items.reduce((sum, item) => sum + item.amount, 0), 1414);
assert.equal(wbOperationType({}, 'purchase'), 'purchase');
assert.equal(wbOperationType({}, 'refund'), 'refund');
assert.equal(wbOperationType({ operationTypeId: 1 }, ''), 'purchase');
assert.equal(wbOperationType({ operationTypeId: 2 }, ''), 'refund');
assert.throws(() => wbOperationType({ operationTypeId: 99 }, ''), /неизвестный тип операции/);

assert.deepEqual(parseWbReceiptItems(wbItem('Подарок', '0,00 ₽') + '</body>'), [{ title: 'Подарок', amount: 0, itemIndex: 1 }]);
assert.deepEqual(parseWbReceiptItems(wbItem('Нет цены', '') + '</body>'), []);
assert.deepEqual(parseWbReceiptItems(wbItem('Сломанная цена', '1.2.3') + '</body>'), []);

async function verifyWbReceiptFailures() {
  const originalFetch = globalThis.fetch;
  const receipt = { receiptUid: 'synthetic', operationTypeId: 1, operationDateTime: '2026-01-02T10:00:00', operationSum: 100, link: 'https://receipt.wb.ru/synthetic' };
  try {
    globalThis.fetch = async () => new Response('<h2>Кассовый чек</h2>Приход' + wbItem('Товар', '100.00') + wbItem('Подарок', '0.00') + '<div class="total"></div>');
    const purchase = await recordsFromWbReceipt(receipt);
    assert.equal(purchase.rows.length, 2);
    assert.equal(purchase.rows[1].amount, '0.00');
    assert.equal(purchase.rows[1].parse_quality, 'complete');
    assert.equal(purchase.rows.reduce((sum, row) => sum + Number(row.amount), 0), 100);

    const mixed = await rowsFromWbReceipts([receipt, { ...receipt, operationTypeId: 99, link: '' }], 2);
    assert.equal(mixed.rows.length, 2, 'повреждённый чек не должен удалять исправные');
    assert.equal(mixed.stats.parsedReceipts, 1);
    assert.equal(mixed.stats.skippedReceipts, 1);
    assert.equal(mixed.stats.fallbackReceipts, 0);
    assert.equal(mixed.stats.failedReceipts, 1);

    globalThis.fetch = async () => new Response('<h2>Кассовый чек</h2>Возврат прихода' + wbItem('Товар', '100.00') + '<div class="total"></div>');
    const refund = await recordsFromWbReceipt({ ...receipt, operationTypeId: 2 });
    assert.equal(refund.rows[0].amount, '-100.00');
    assert.equal(refund.rows[0].type, 'refund');

    globalThis.fetch = async () => new Response('<h1>Подтвердите, что вы не робот</h1>');
    const fallback = await rowsFromWbReceipts([receipt, { ...receipt, operationTypeId: 99, link: '' }], 2);
    assert.equal(fallback.rows[0].amount, '100.00');
    assert.equal(fallback.stats.fallbackReceipts, 1);
    assert.equal(fallback.stats.skippedReceipts, 1);
    assert.equal(fallback.stats.parsedReceipts, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
}
verifyWbReceiptFailures().catch(error => { process.nextTick(() => { throw error; }); });
