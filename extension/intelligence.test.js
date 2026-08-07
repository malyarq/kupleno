const assert = require('node:assert/strict');
const intelligence = require('./intelligence.js');

const sourceRows = [
  { date: '2026-01-05', source: 'ozon', title: 'Кофе Lavazza Oro зерно 1 кг', amount: '1000.00' },
  { date: '2026-02-04', source: 'wildberries', title: 'Lavazza Oro кофе 1000 г зерновой', amount: '1100.00' },
  { date: '2026-03-06', source: 'ozon', title: 'Кофе Lavazza Oro 1 кг', amount: '1600.00' },
  { date: '2026-01-01', source: 'ozon', title: 'Подписка Музыка', amount: '199.00' },
  { date: '2026-02-01', source: 'ozon', title: 'Музыка подписка', amount: '199.00' },
  { date: '2026-03-03', source: 'ozon', title: 'Подписка музыка', amount: '199.00' },
  { date: '2026-04-03', source: 'ozon', title: 'Подписка музыка', amount: '199.00' },
  { date: '2026-04-10', source: 'ozon', title: 'Кабель USB C', amount: '499.00' },
  { date: '2026-04-10', source: 'ozon', title: 'USB-C кабель', amount: '500.00' },
  { date: '2026-04-11', source: 'ozon', title: 'Игровая приставка', amount: '15000.00' },
  { date: '2026-04-12', source: 'ozon', title: 'Неизвестный товар', amount: '-700.00', type: 'refund' },
  { date: '2026-04-13', source: 'ozon', title: 'Доставка', amount: '399.00', service: true },
  { date: '2026-04-14', source: 'ozon', title: 'Исключенный товар', amount: '99999.00', excluded: true }
];
const before = JSON.parse(JSON.stringify(sourceRows));

const normalized = intelligence.normalizeProductIdentity(sourceRows[0]);
assert.equal(normalized.key, 'lavazza|oro|зерно|кофе');
assert.deepEqual(normalized.quantity, { value: 1000, unit: 'g', source: 'title' });

const report = intelligence.analyze(sourceRows);
assert.deepEqual(sourceRows, before, 'движок не должен менять строки пользователя');
assert.equal(report.meta.processedRows, 11);
assert.deepEqual(report.meta.ignored, { excluded: 1, service: 1, invalid: 0 });

const coffee = report.groups.find((group) => group.name.includes('Lavazza'));
assert.ok(coffee, 'похожие написания должны попасть в одну группу');
assert.equal(coffee.purchaseCount, 3);
assert.equal(coffee.similarTitles.length, 3);

const coffeeHistory = report.priceHistory.find((item) => item.name.includes('Lavazza') && item.unit === 'g');
assert.ok(coffeeHistory);
assert.deepEqual(coffeeHistory.observations.map((item) => item.unitPrice), [1, 1.1, 1.6]);
assert.equal(coffeeHistory.changePercent, 0.4545);
assert.equal(coffeeHistory.needsReview, false);

const subscription = report.recurring.find((item) => item.name.includes('Подписка'));
assert.ok(subscription, 'четыре близких ежемесячных покупки должны быть кандидатом на повторение');
assert.equal(subscription.confirmed, false);
assert.ok(subscription.intervalDays >= 29 && subscription.intervalDays <= 31);
assert.ok(subscription.estimatedAnnualAmount > 2300);

const anomalyTypes = report.anomalies.map((item) => item.type);
assert.ok(anomalyTypes.includes('possible_duplicate'));
assert.ok(anomalyTypes.includes('price_increase'));
assert.ok(anomalyTypes.includes('large_new_expense'));
assert.ok(anomalyTypes.includes('refund_without_purchase'));
assert.equal(report.anomalies.find((item) => item.type === 'refund_without_purchase').rowIndexes[0], 10);

const sameReceiptAnomalies = intelligence.detectAnomalies([
  { date: '2026-05-01', source: 'ozon', receipt_url: 'receipt-1', title: 'Кабель USB-C', amount: '500.00' },
  { date: '2026-05-01', source: 'ozon', receipt_url: 'receipt-1', title: 'Кабель USB-C', amount: '500.00' }
]);
assert.equal(sameReceiptAnomalies.some((item) => item.type === 'possible_duplicate'), false, 'позиции одного чека не являются дублем');
assert.equal(intelligence.analyze([
  { date: '2026-05-01', source: 'yandex', title: 'Работа сервиса', amount: '99.00' }
]).meta.ignored.service, 1, 'сервисный сбор не должен попадать в товарные советы');
assert.equal(intelligence.analyze([
  { date: '2026-05-01', source: 'ozon', title: 'Ключ для сервиса защищённой сети', amount: '99.00' }
]).meta.processedRows, 1, 'товар с упоминанием сервиса не является сервисным сбором');
const sameOrderAnomalies = intelligence.detectAnomalies([
  { date: '2026-05-01', source: 'ozon', receipt_url: 'receipt-pre', raw_title: 'Заказ № ORDER-1', title: 'Кабель USB-C', amount: '500.00' },
  { date: '2026-05-01', source: 'ozon', receipt_url: 'receipt-full', raw_title: 'Заказ   №   ORDER-1', title: 'Кабель USB-C', amount: '500.00' }
]);
assert.equal(sameOrderAnomalies.some((item) => item.type === 'possible_duplicate'), false, 'расчёты одного заказа не являются дублем покупки');
const differentReceiptAnomalies = intelligence.detectAnomalies([
  { date: '2026-05-01', source: 'ozon', receipt_url: 'receipt-1', title: 'Кабель USB-C', amount: '500.00' },
  { date: '2026-05-01', source: 'ozon', receipt_url: 'receipt-2', title: 'Кабель USB-C', amount: '500.00' }
]);
assert.equal(differentReceiptAnomalies.some((item) => item.type === 'possible_duplicate'), true, 'похожие покупки из разных чеков остаются кандидатом');

const staleAnomalies = intelligence.detectAnomalies([
  { date: '2020-01-01', title: 'Старый кабель USB', amount: '500.00' },
  { date: '2020-01-01', title: 'Старый кабель USB', amount: '500.00' },
  { date: '2026-05-01', title: 'Свежий ориентир', amount: '100.00' }
]);
assert.equal(staleAnomalies.some((item) => item.type === 'possible_duplicate'), false, 'давняя история не должна создавать сегодняшние задачи');

const longIdentity = intelligence.normalizeProductIdentity('ZuluPrime ZModel alpha bravo charlie delta echo foxtrot golf hotel india juliet kilo lima mike november');
assert.ok(longIdentity.tokens.includes('zuluprime'));
assert.ok(longIdentity.tokens.includes('zmodel'), 'ведущие марка и модель не должны исчезать из длинного названия');
assert.equal(longIdentity.tokens.includes('november'), false, 'для линейной работы используется ограниченное число первых признаков');

const excludedAndService = intelligence.buildPriceHistory([
  { date: '2026-01-01', title: 'Доставка', amount: '200.00' },
  { date: '2026-01-02', title: 'Товар', amount: '100.00', excluded: true },
  { date: '2026-01-03', title: 'Товар', amount: '-100.00', type: 'refund' }
]);
assert.equal(excludedAndService.length, 0, 'возвраты, сервисные и исключенные строки не формируют историю цены');

const linearRows = Array.from({ length: 100000 }, (_, index) => ({
  date: '2026-01-01', title: `Продукт item${index}`, amount: '1.00'
}));
const grouped = intelligence.groupSimilarPurchases(linearRows);
assert.equal(grouped.meta.processedRows, 100000);
assert.equal(grouped.groups.length, 100000, 'лимит 100k обрабатывается без попарного сравнения строк');
assert.throws(() => intelligence.analyze([...linearRows, { date: '2026-01-01', title: 'лишний', amount: '1' }]), /не более 100000/u);

console.log('intelligence tests passed');
