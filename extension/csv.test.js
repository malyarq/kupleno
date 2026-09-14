const assert = require('node:assert/strict');
const {
  MAX_CSV_CHARS,
  MAX_CSV_COLUMNS,
  MAX_CSV_CELL_CHARS,
  isValidSpendDate,
  mergeSpendRows,
  parseSpendCsv
} = require('./csv.js');

assert.deepEqual(parseSpendCsv([
  '\uFEFFdate,marketplace,title,amount,currency,category',
  '2026-01-02,ozon,"Tea, green",123.4,RUB,Продукты',
  '2026-01-03,Wildberries,"Quote ""item""","-10,5",RUB,',
  '2026-01-04,yandex,Delivery,99,RUB,Доставка'
].join('\r\n')), [
  {
    date: '2026-01-02',
    source: 'ozon',
    title: 'Tea, green',
    amount: '123.40',
    currency: 'RUB',
    category: 'Продукты',
    type: 'purchase'
  },
  {
    date: '2026-01-03',
    source: 'wildberries',
    title: 'Quote "item"',
    amount: '-10.50',
    currency: 'RUB',
    category: '',
    type: 'refund'
  },
  {
    date: '2026-01-04',
    source: 'yandex',
    title: 'Delivery',
    amount: '99.00',
    currency: 'RUB',
    category: 'Доставка',
    type: 'purchase'
  }
]);

assert.equal(
  parseSpendCsv('date,marketplace,title,amount,currency,category,type\n2026-01-05,ozon,Tea,10,RUB,Продукты,refund')[0].type,
  'refund'
);
assert.deepEqual(
  parseSpendCsv('date,marketplace,title,amount,profile,note,excluded\n2026-01-05,ozon,Tea,10,work,Командировка,да')[0],
  {
    date: '2026-01-05',
    source: 'ozon',
    title: 'Tea',
    amount: '10.00',
    currency: 'RUB',
    category: '',
    type: 'purchase',
    profile: 'work',
    note: 'Командировка',
    excluded: true
  }
);
assert.deepEqual(
  parseSpendCsv('date,marketplace,title,amount,currency\n2026-01-05,ozon,Tea,10, rub ')[0].currency,
  'RUB'
);
assert.deepEqual(
  parseSpendCsv('date,marketplace,title,amount,currency\n2026-01-05,ozon,Tea,10,   ')[0].currency,
  'RUB'
);
assert.throws(
  () => parseSpendCsv('date,marketplace,title,amount,currency\n2026-01-05,ozon,Tea,10,USD'),
  /неподдерживаемая валюта USD.*только RUB/
);
assert.throws(
  () => parseSpendCsv('date,marketplace,title,amount,excluded\n2026-01-05,ozon,Tea,10,maybe'),
  /поле excluded в строке 2/
);
assert.deepEqual(
  parseSpendCsv('date,marketplace,title,amount,currency,category,type\n,ozon,Ozon PDF не разобран: Ozon cheque,0.00,RUB,unknown,purchase'),
  []
);

assert.throws(
  () => parseSpendCsv('title,amount\nx,1'),
  /date, marketplace/
);

assert.throws(
  () => parseSpendCsv('date,marketplace,title,amount\n2026-01-01,other,x,1'),
  /неизвестный marketplace/
);

for (const date of [
  '2026-02-30', '2026-99-99', 'not-a-date', '2026-01-01 24:00',
  '2026-01-01T10:00+99:99', '2026-01-01T10:00+24:00', '2026-01-01T10:00+00:60',
  '2026-01-01T10:00+14:01'
]) {
  assert.equal(isValidSpendDate(date), false, date);
  assert.throws(
    () => parseSpendCsv(`date,marketplace,title,amount\n${date},ozon,x,1`),
    /некорректная дата/
  );
}
for (const date of [
  '2024-02-29', '2026-01-01', '2026-01-01 23:59', '2026-01-01T12:30:59Z',
  '2026-01-01T12:30:59+03:00', '2026-01-01T12:30:59-1400'
]) {
  assert.equal(isValidSpendDate(date), true, date);
}

const firstCsv = parseSpendCsv([
  'date,marketplace,title,amount,currency,category,type',
  '2026-01-01,ozon,Tea,10,RUB,Продукты,purchase',
  '2026-01-02,wb,Shoes,20,RUB,Обувь,purchase'
].join('\n'));
const secondCsv = parseSpendCsv([
  'date,marketplace,title,amount,currency,category,type',
  '2026-01-01,ozon, Tea ,10.00,RUB,Продукты,purchase',
  '2026-01-03,yandex,Book,30,RUB,Книги,purchase'
].join('\n'));
const merged = mergeSpendRows([...firstCsv, ...secondCsv]);
assert.equal(merged.duplicates, 0);
assert.deepEqual(merged.rows.map((row) => row.title), ['Tea', 'Shoes', 'Tea', 'Book']);

const sameReceipt = parseSpendCsv([
  'date,marketplace,title,amount,currency,category,type,marketplace_id,item_index',
  '2026-01-01,ozon,Tea,10,RUB,Продукты,purchase,receipt-1,1',
  '2026-01-01,ozon,Tea,10,RUB,Продукты,purchase,receipt-1,1',
  '2026-01-01,ozon,Tea,10,RUB,Продукты,purchase,receipt-1,2'
].join('\n'));
const receiptMerged = mergeSpendRows(sameReceipt);
assert.equal(receiptMerged.duplicates, 1);
assert.deepEqual(receiptMerged.rows.map((row) => row.item_index), ['1', '2']);

const oldAndNewReceiptRows = parseSpendCsv([
  'date,marketplace,title,amount,currency,category,type,marketplace_id,item_index',
  '2026-06-16,wildberries,Washer,559,RUB,Авто,purchase,receipt-1,',
  '2026-06-16,wildberries,Washer,559.00,RUB,Авто,purchase,receipt-1,1'
].join('\n'));
const oldAndNewMerged = mergeSpendRows(oldAndNewReceiptRows);
assert.equal(oldAndNewMerged.duplicates, 1);
assert.deepEqual(oldAndNewMerged.rows.map((row) => row.item_index), ['1']);

const ozonSiblingReceipts = parseSpendCsv([
  'date,marketplace,title,amount,currency,category,type,marketplace_id,item_index',
  '2026-06-15,ozon,Яндекс Плюс на 12 месяцев,2024,RUB,Подписки,purchase,55887469-0288-ae92b46c-7399-4fa3-aeeb-e472be915820-0-0,1',
  '2026-06-15,ozon,Яндекс Плюс на 12 месяцев,2024,RUB,Подписки,purchase,55887469-0288-82307747-54ad-4999-b8da-40646d7a0fbb-0-0,1'
].join('\n'));
const siblingReceiptMerge = mergeSpendRows(ozonSiblingReceipts);
assert.equal(siblingReceiptMerge.duplicates, 0);
assert.equal(siblingReceiptMerge.rows.length, 2);

const repeatedUnindexedItems = parseSpendCsv([
  'date,marketplace,title,amount,currency,category,type,marketplace_id,item_index',
  '2026-06-15,ozon,Пакет,10,RUB,Продукты,purchase,receipt-repeat,',
  '2026-06-15,ozon,Пакет,10,RUB,Продукты,purchase,receipt-repeat,'
].join('\n'));
const repeatedUnindexedMerge = mergeSpendRows(repeatedUnindexedItems);
assert.equal(repeatedUnindexedMerge.duplicates, 0);
assert.deepEqual(repeatedUnindexedMerge.rows.map((row) => row.item_index), ['legacy-csv-1', 'legacy-csv-2']);
const repeatedUnindexedReimport = mergeSpendRows([...repeatedUnindexedItems, ...repeatedUnindexedItems]);
assert.equal(repeatedUnindexedReimport.duplicates, 2);
assert.equal(repeatedUnindexedReimport.rows.length, 2);

assert.throws(
  () => parseSpendCsv('x'.repeat(MAX_CSV_CHARS + 1)),
  /больше 20 МБ/
);
assert.throws(
  () => parseSpendCsv(`date,marketplace,title,amount\n2026-01-01,ozon,${'x'.repeat(MAX_CSV_CELL_CHARS + 1)},1`),
  /слишком длинное поле/
);
assert.throws(
  () => parseSpendCsv(Array.from({ length: MAX_CSV_COLUMNS + 1 }, (_, index) => `column-${index}`).join(',')),
  /больше 50 колонок/
);
