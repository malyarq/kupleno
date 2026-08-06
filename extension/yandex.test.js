const assert = require('node:assert/strict');
const { filterYandexRows, rowsFromYandexReceiptHtml } = require('./background.js');

function receiptHtml(settlement, itemAmount = 699, total = itemAmount, date = '02.06.26 11:50') {
  return `
    <div class="header">Кассовый чек. Приход</div>
    <table class="info-table">
      <tr><td>Смена N 72</td><td>${date}</td></tr>
    </table>
    <table class="receipt-table">
      <tr><td>N</td><td>Наим. пр.</td><td>Цена</td><td>Кол-во</td><td>НДС</td><td>Стоимость</td></tr>
      <tr>
        <td>1.</td>
        <td>Товар<br><div>Признак способа расчета: ${settlement}</div></td>
        <td>${itemAmount}.00</td><td>1.000</td><td>НДС 5%</td><td>${itemAmount}.00</td>
      </tr>
      <tr><td></td><td>ИТОГ</td><td></td><td></td><td></td><td>${total}.00</td></tr>
    </table>
  `;
}

const prepayment = rowsFromYandexReceiptHtml({
  orderId: '57730677568',
  id: '1',
  type: 'INCOME',
  fiscalUrl: 'https://check.yandex.ru/?fn=1&fpd=1&n=1'
}, receiptHtml('ПРЕДОПЛАТА 100%'));

const full = rowsFromYandexReceiptHtml({
  orderId: '57730677568',
  id: '2',
  type: 'OFFSET_ADVANCE_ON_DELIVERED',
  fiscalUrl: 'https://check.yandex.ru/?fn=2&fpd=2&n=2'
}, receiptHtml('ПОЛНЫЙ РАСЧЕТ'));

assert.equal(prepayment[0].title, 'Товар');
assert.equal(prepayment[0].date, '2026-06-02 11:50');

const filtered = filterYandexRows([...prepayment, ...full]);
assert.equal(filtered.prepaymentRowsDropped, 1);
assert.deepEqual(filtered.rows.map((row) => row.amount), ['699.00']);

const repeatedPrepayment = filterYandexRows([
  ...prepayment,
  { ...prepayment[0], item_index: '2' },
  ...full
]);
assert.equal(repeatedPrepayment.prepaymentRowsDropped, 1);
assert.equal(repeatedPrepayment.rows.length, 2);
assert.equal(repeatedPrepayment.rows.reduce((sum, row) => sum + Number(row.amount), 0), 1398);

const noServices = rowsFromYandexReceiptHtml({
  orderId: '57730677569',
  id: '3',
  type: 'INCOME',
  fiscalUrl: 'https://check.yandex.ru/?fn=3&fpd=3&n=3'
}, `
  <div class="header">Кассовый чек. Приход</div>
  <table class="info-table"><tr><td>Смена N 72</td><td>02.06.26 11:50</td></tr></table>
  <table class="receipt-table">
    <tr><td>N</td><td>Наим. пр.</td><td>Цена</td><td>Кол-во</td><td>НДС</td><td>Стоимость</td></tr>
    <tr><td>1.</td><td>Товар<br><div>Признак способа расчета: ПОЛНЫЙ РАСЧЕТ</div></td><td>699.00</td><td>1.000</td><td>НДС 5%</td><td>699.00</td></tr>
    <tr><td>2.</td><td>Доставка<br><div>Признак способа расчета: ПОЛНЫЙ РАСЧЕТ</div></td><td>99.00</td><td>1.000</td><td>НДС 5%</td><td>99.00</td></tr>
    <tr><td>3.</td><td>Сервисный сбор<br><div>Признак способа расчета: ПОЛНЫЙ РАСЧЕТ</div></td><td>49.00</td><td>1.000</td><td>НДС 5%</td><td>49.00</td></tr>
    <tr><td></td><td>ИТОГ</td><td></td><td></td><td></td><td>847.00</td></tr>
  </table>
`);

assert.deepEqual(noServices.map((row) => row.title), ['Товар', 'Доставка', 'Сервисный сбор']);
assert.equal(noServices.reduce((sum, row) => sum + Number(row.amount), 0), 847);

const partialReceipt = rowsFromYandexReceiptHtml({
  orderId: '57730677570',
  id: '4',
  type: 'INCOME',
  fiscalUrl: 'https://check.yandex.ru/?fn=4&fpd=4&n=4'
}, `
  <div class="header">Кассовый чек. Приход</div>
  <table class="info-table"><tr><td>Смена N 72</td><td>02.06.26 11:50</td></tr></table>
  <table class="receipt-table">
    <tr><td>1.</td><td>Товар A</td><td>100.00</td><td>1.000</td><td>НДС 5%</td><td>100.00</td></tr>
    <tr><td></td><td>ИТОГ</td><td></td><td></td><td></td><td>300.00</td></tr>
  </table>
`);
assert.equal(partialReceipt.length, 1);
assert.equal(partialReceipt[0].parse_quality, 'fallback');
assert.equal(partialReceipt[0].amount, '300.00');

const missingTotal = rowsFromYandexReceiptHtml({
  orderId: '57730677571',
  id: '5',
  type: 'INCOME',
  fiscalUrl: 'https://check.yandex.ru/?fn=5&fpd=5&n=5'
}, `
  <div class="header">Кассовый чек. Приход</div>
  <table class="info-table"><tr><td>Смена N 72</td><td>02.06.26 11:50</td></tr></table>
  <table class="receipt-table">
    <tr><td>1.</td><td>Товар A</td><td>100.00</td><td>1.000</td><td>НДС 5%</td><td>100.00</td></tr>
  </table>
`);
assert.equal(missingTotal[0].parse_quality, 'unverified');

const aggregateYandexPrepayment = rowsFromYandexReceiptHtml({
  orderId: '57730677572', id: 'pre', type: 'INCOME', fiscalUrl: 'https://check.yandex.ru/?fn=6&fpd=6&n=6'
}, receiptHtml('ПРЕДОПЛАТА 100%', 100, 300, '01.06.26 11:50'));
const yandexPartialFull = rowsFromYandexReceiptHtml({
  orderId: '57730677572', id: 'full-100', type: 'OFFSET_ADVANCE_ON_DELIVERED', fiscalUrl: 'https://check.yandex.ru/?fn=7&fpd=7&n=7'
}, receiptHtml('ПОЛНЫЙ РАСЧЕТ', 100, 100, '02.06.26 11:50'));
const yandexPartiallyBalanced = filterYandexRows([...aggregateYandexPrepayment, ...yandexPartialFull]);
assert.equal(yandexPartiallyBalanced.rows.reduce((sum, row) => sum + Number(row.amount), 0), 300);
assert.equal(yandexPartiallyBalanced.aggregatePrepaymentRowsAdjusted, 1);
assert.ok(yandexPartiallyBalanced.supersededReceipts.includes('https://check.yandex.ru/?fn=6&fpd=6&n=6'));

const yandexCompleteFull = rowsFromYandexReceiptHtml({
  orderId: '57730677572', id: 'full-300', type: 'OFFSET_ADVANCE_ON_DELIVERED', fiscalUrl: 'https://check.yandex.ru/?fn=8&fpd=8&n=8'
}, receiptHtml('ПОЛНЫЙ РАСЧЕТ', 300, 300, '02.06.26 11:50'));
const yandexFullyBalanced = filterYandexRows([...aggregateYandexPrepayment, ...yandexCompleteFull]);
assert.equal(yandexFullyBalanced.rows.reduce((sum, row) => sum + Number(row.amount), 0), 300);
assert.equal(yandexFullyBalanced.aggregatePrepaymentRowsDropped, 1);

const secondAggregateYandexPrepayment = rowsFromYandexReceiptHtml({
  orderId: '57730677572', id: 'pre-2', type: 'INCOME', fiscalUrl: 'https://check.yandex.ru/?fn=9&fpd=9&n=9'
}, receiptHtml('ПРЕДОПЛАТА 100%', 100, 300, '02.06.26 11:50'));
const additiveYandexFull = rowsFromYandexReceiptHtml({
  orderId: '57730677572', id: 'full-additive', type: 'OFFSET_ADVANCE_ON_DELIVERED', fiscalUrl: 'https://check.yandex.ru/?fn=10&fpd=10&n=10'
}, receiptHtml('ПОЛНЫЙ РАСЧЕТ', 100, 100, '03.06.26 11:50'));
const additiveYandexBalanced = filterYandexRows([
  ...aggregateYandexPrepayment,
  ...secondAggregateYandexPrepayment,
  ...additiveYandexFull
]);
assert.equal(additiveYandexBalanced.rows.reduce((sum, row) => sum + Number(row.amount), 0), 600);
assert.equal(additiveYandexBalanced.aggregatePrepaymentRowsAdjusted, 1);
assert.ok(additiveYandexBalanced.supersededReceipts.includes('https://check.yandex.ru/?fn=9&fpd=9&n=9'));
