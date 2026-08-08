const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const preferences = require('./preferences.js');

const baseRow = {
  date: '2024-02-10',
  source: 'ozon',
  marketplace_id: 'order-42',
  item_index: '0',
  title: 'Кофе в зёрнах',
  amount: '100.00',
  currency: 'RUB',
  type: 'purchase',
  category: 'Продукты'
};

const id = preferences.stableRowId(baseRow);
assert.match(id, /^mt_[0-9a-z]{14}$/);
assert.equal(preferences.stableRowId({ ...baseRow, category: 'Другое', note: 'Не влияет' }), id);
assert.notEqual(preferences.stableRowId({ ...baseRow, item_index: '1' }), id);
assert.equal(preferences.stableRowId({ ...baseRow, amount: '100,00' }), id);
assert.equal(preferences.withStableRowIds([{ ...baseRow, rowId: 'persisted-id' }])[0].rowId, 'persisted-id');
const repeatedRows = preferences.withStableRowIds([
  { ...baseRow, marketplace_id: '', item_index: '' },
  { ...baseRow, marketplace_id: '', item_index: '' }
]);
assert.notEqual(repeatedRows[0].rowId, repeatedRows[1].rowId);
assert.equal(repeatedRows[1].rowId, `${repeatedRows[0].rowId}_2`);
assert.notEqual(
  preferences.stableRowId({ ...baseRow, marketplace_id: '55887469-0288-ae92b46c-7399-4fa3-aeeb-e472be915820-0-0' }),
  preferences.stableRowId({ ...baseRow, marketplace_id: '55887469-0288-82307747-54ad-4999-b8da-40646d7a0fbb-0-0' })
);

const rules = [
  { id: 'low', keywords: ['кофе'], category: 'Продукты', priority: 1 },
  { id: 'high', keywords: ['зёрнах'], category: 'Работа', profile: 'Бизнес', priority: 20 },
  { id: 'disabled', keywords: ['кофе'], category: 'Не применять', priority: 100, enabled: false }
];
assert.equal(preferences.matchKeywordRule(baseRow, rules).id, 'high');
assert.equal(preferences.applyKeywordRules(baseRow, rules).category, 'Работа');
assert.equal(preferences.applyKeywordRules({ ...baseRow, source: 'wildberries' }, [
  { keywords: ['кофе'], source: 'ozon', category: 'Только Ozon', priority: 5 }
]).category, 'Продукты');
assert.equal(preferences.applyKeywordRules(baseRow, [
  { keyword: 'кофе', category: 'Старое', priority: 10 },
  { keyword: 'кофе', category: 'Новое', priority: 10 }
]).category, 'Новое');
assert.equal(preferences.applyKeywordRules({ ...baseRow, source: 'wildberries', title: 'Кофе в зёрнах' }, [
  { keywords: ['кофе', 'зернах'], match: 'all', sources: ['wb', 'yandex'], category: 'Совпало всё' }
]).category, 'Совпало всё');
assert.equal(preferences.applyKeywordRules({ ...baseRow, title: 'Только кофе' }, [
  { keywords: ['кофе', 'зернах'], match: 'all', category: 'Не применять' }
]).category, 'Продукты');
assert.equal(preferences.ruleMatchesRow({ ...baseRow, title: 'Чай зелёный' }, { keyword: 'чай' }), true);
assert.equal(preferences.ruleMatchesRow({ ...baseRow, title: 'Чай зелёный' }, {
  keywords: ['чай'], sources: []
}), true);
assert.equal(preferences.ruleMatchesRow({ ...baseRow, title: 'Случайный товар' }, { keyword: 'чай' }), false);
assert.equal(preferences.ruleMatchesRow({ ...baseRow, title: 'Кофе-зерна арабика' }, {
  keywords: ['кофе зерна'], category: 'Продукты'
}), true);
assert.equal(preferences.ruleMatchesRow({ ...baseRow, title: 'Крем для обуви' }, {
  keywords: ['крем'], negativeKeywords: ['обуви'], category: 'Красота'
}), false);
assert.equal(preferences.ruleMatchesRow({ ...baseRow, amount: '99.00' }, {
  keywords: ['кофе'], amountMin: 100, category: 'Продукты'
}), false);
const similarRule = preferences.deriveCategoryRule({ ...baseRow, title: 'Кофе арабика в зернах 1 кг' }, 'Продукты');
assert.deepEqual(similarRule.sources, ['ozon']);
assert.equal(similarRule.match, 'all');
assert.equal(preferences.ruleMatchesRow({ ...baseRow, title: 'Кофе арабика зернах свежей обжарки' }, similarRule), true);

const changed = preferences.applyPreferences([baseRow], {
  rules,
  overrides: {
    [id]: { category: 'Подарки', excluded: true, profile: 'Личное', note: 'Для мамы' }
  }
})[0];
assert.deepEqual(
  { category: changed.category, excluded: changed.excluded, profile: changed.profile, note: changed.note },
  { category: 'Подарки', excluded: true, profile: 'Личное', note: 'Для мамы' }
);
assert.equal(baseRow.excluded, undefined, 'исходная строка не мутируется');
assert.equal(preferences.applyOverrides(baseRow, [{ rowId: id, note: 'Массив override' }]).note, 'Массив override');

assert.deepEqual(preferences.monthWindow('2024-02-10'), {
  key: '2024-02',
  from: '2024-02-01',
  to: '2024-02-29',
  daysInMonth: 29,
  elapsedDays: 10,
  remainingDays: 19
});

const budget = preferences.buildBudgetSummary([
  { date: '2024-02-02', source: 'ozon', title: 'Кофе', amount: '100', category: 'Продукты', type: 'purchase' },
  { date: '2024-02-04', source: 'ozon', title: 'Кофе', amount: '-20', category: 'Продукты', type: 'refund' },
  { date: '2024-02-08', source: 'ozon', title: 'Книга', amount: '50', category: 'Книги', type: 'purchase' },
  { date: '2024-02-09', source: 'ozon', title: 'Не учитывать', amount: '30', category: 'Книги', excluded: true },
  { date: '2024-01-31', source: 'ozon', title: 'Старое', amount: '999', category: 'Книги' }
], {
  total: 300,
  categories: { 'Продукты': 200, 'Книги': 100, 'Дом': 500 }
}, '2024-02-10');

assert.equal(budget.month, '2024-02');
assert.equal(budget.spent, 130);
assert.equal(budget.forecast, 377);
assert.equal(budget.status, 'forecast-over');
assert.equal(budget.categories.find((item) => item.category === 'Продукты').spent, 80);
assert.equal(budget.categories.find((item) => item.category === 'Продукты').forecast, 232);
assert.equal(budget.categories.find((item) => item.category === 'Книги').spent, 50);
assert.equal(budget.categories.find((item) => item.category === 'Дом').spent, 0);

const exactBudget = preferences.buildBudgetSummary([
  { date: '2024-02-02', source: 'ozon', title: 'Покупка', amount: 100, category: 'Дом', type: 'purchase' },
  { date: '2024-02-03', source: 'ozon', title: 'Возврат положительной суммой', amount: 20, category: 'Дом', type: 'refund' },
  { date: '2024-02-04', source: 'ozon', title: 'Лишний отрицательный расход', amount: -200, category: 'Дом', type: 'purchase' }
], { total: 80, 'Дом': 80 }, '2024-02-29');
assert.equal(exactBudget.spent, 0);
assert.equal(exactBudget.status, 'ok');
assert.equal(exactBudget.categories.find((item) => item.category === 'Дом').spent, 0);

const exactLimit = preferences.buildBudgetSummary([
  { date: '2024-02-02', source: 'ozon', title: 'Покупка', amount: 80, category: 'Дом', type: 'purchase' }
], { total: 80, categories: { 'Дом': 80 } }, '2024-02-29');
assert.equal(exactLimit.status, 'ok');
assert.equal(exactLimit.percent, 100);

const refundRows = [
  {
    date: '2024-03-12',
    source: 'ozon',
    marketplace_id: 'order-1',
    title: 'Телефон — возврат',
    amount: '-1000.00',
    type: 'refund'
  },
  {
    date: '2024-03-14',
    source: 'wildberries',
    title: 'Кроссовки мужские',
    amount: '-500.00',
    type: 'refund'
  },
  {
    date: '2024-03-14',
    source: 'ozon',
    marketplace_id: 'another-order',
    title: 'Чехол',
    amount: '-100.00',
    type: 'refund'
  }
];

const refunds = preferences.reconcileRefundClaims([
  {
    id: 'by-marketplace-id',
    createdAt: '2024-03-01',
    source: 'ozon',
    marketplace_id: 'order-1',
    title: 'Телефон',
    amount: 1000
  },
  {
    id: 'by-title',
    createdAt: '2024-03-02',
    source: 'wildberries',
    title: 'Кроссовки мужские',
    amount: 500
  },
  {
    id: 'overdue',
    createdAt: '2024-02-01',
    dueDate: '2024-02-15',
    source: 'ozon',
    title: 'Наушники',
    amount: 2000
  },
  {
    id: 'pending',
    createdAt: '2024-03-10',
    source: 'yandex',
    title: 'Книга',
    amount: 300
  }
], refundRows, { now: '2024-03-15', dueDays: 14 });

assert.deepEqual(refunds.claims.map((claim) => claim.status), [
  'reconciled', 'reconciled', 'overdue', 'pending'
]);
assert.equal(refunds.claims[0].reconciledAt, '2024-03-12');
assert.ok(refunds.claims[0].matchedRowId);
assert.equal(refunds.claims[2].matchedRowId, null);
assert.equal(refunds.claims[3].dueDate, '2024-03-24');
assert.deepEqual(refunds.summary, {
  total: 4,
  pending: 1,
  overdue: 1,
  reconciled: 2,
  cancelled: 0,
  expectedAmount: 3800,
  pendingAmount: 300,
  overdueAmount: 2000,
  reconciledAmount: 1500
});
assert.equal(refunds.unmatchedRefunds.length, 1);

const duplicateClaims = preferences.reconcileRefundClaims([
  { id: 'first', source: 'wildberries', title: 'Кроссовки мужские', amount: 500, createdAt: '2024-03-01' },
  { id: 'second', source: 'wildberries', title: 'Кроссовки мужские', amount: 500, createdAt: '2024-03-01' }
], refundRows, { now: '2024-03-15' });
assert.deepEqual(duplicateClaims.claims.map((claim) => claim.status), ['reconciled', 'pending']);

const differentReceiptSamePurchase = preferences.reconcileRefundClaims([
  {
    id: 'different-receipt',
    source: 'wildberries',
    marketplace_id: 'purchase-receipt',
    title: 'Кроссовки мужские',
    amount: 500,
    createdAt: '2024-03-01'
  }
], [{
  date: '2024-03-14',
  source: 'wildberries',
  marketplace_id: 'refund-receipt',
  title: 'Кроссовки мужские',
  amount: '-500.00',
  type: 'refund'
}], { now: '2024-03-15' });
assert.equal(differentReceiptSamePurchase.claims[0].status, 'reconciled');

const savedClaim = preferences.reconcileRefundClaims([
  { id: 'saved', status: 'reconciled', matchedRowId: 'old-row', amount: 700, createdAt: '2024-03-01' }
], [], { now: new Date(2024, 2, 15) });
assert.equal(savedClaim.claims[0].status, 'pending');
assert.equal(savedClaim.claims[0].matchedRowId, null);

const cancelledClaim = preferences.reconcileRefundClaims([
  { id: 'cancelled', status: 'cancelled', source: 'ozon', title: 'Отменено', amount: 999 }
], [], { now: '2024-03-15' });
assert.equal(cancelledClaim.summary.cancelled, 1);
assert.equal(cancelledClaim.summary.expectedAmount, 0);

const chronologicalClaim = preferences.reconcileRefundClaims([{
  id: 'repeated-purchase',
  source: 'wildberries',
  title: 'Футболка',
  amount: 900,
  purchaseDate: '2024-03-10',
  createdAt: '2024-03-10'
}], [
  { date: '2024-03-01', source: 'wildberries', title: 'Футболка', amount: -900, type: 'refund' },
  { date: '2024-03-12', source: 'wildberries', title: 'Футболка', amount: -900, type: 'refund' }
], { now: '2024-03-15' });
assert.equal(chronologicalClaim.claims[0].status, 'reconciled');
assert.equal(chronologicalClaim.claims[0].reconciledAt, '2024-03-12');
assert.equal(chronologicalClaim.unmatchedRefunds[0].date, '2024-03-01');

const browserContext = { globalThis: null };
browserContext.globalThis = browserContext;
vm.createContext(browserContext);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'preferences.js'), 'utf8'), browserContext);
assert.equal(typeof browserContext.KuplenoPreferences.buildBudgetSummary, 'function');

console.log('preferences.test.js: ok');
