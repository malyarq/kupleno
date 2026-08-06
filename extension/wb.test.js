const assert = require('node:assert/strict');
const {
  allowedReceiptUrl,
  isWildberriesReceiptsPageReady,
  parseWbReceiptItems,
  wbOperationType
} = require('./background.js');

assert.equal(allowedReceiptUrl('https://receipt.wb.ru/receipt/123'), 'https://receipt.wb.ru/receipt/123');
assert.throws(() => allowedReceiptUrl('https://evil.example/collect'), /запрещённый адрес чека/);
assert.throws(() => allowedReceiptUrl('http://receipt.wb.ru/receipt/123'), /запрещённый адрес чека/);

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
