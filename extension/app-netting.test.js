const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const categoryEngine = require('./categories.js');
const analyticsCore = require('./analytics-core.js');
const analyticsUtils = require('./analytics-utils.js');
const reportQuality = require('./report-quality.js');
const sourceHealth = require('./source-health.js');
const preferenceEngine = require('./preferences.js');
const lifecycleEngine = require('./lifecycle.js');

function fakeElement() {
  return {
    dataset: {},
    style: { setProperty() {} },
    classList: { add() {}, remove() {}, toggle() {} },
    parentElement: null,
    options: [],
    value: '',
    checked: true,
    hidden: false,
    disabled: false,
    textContent: '',
    addEventListener() {},
    append() {},
    appendChild() {},
    removeChild() {},
    setAttribute() {},
    toggleAttribute() {},
    closest() { return fakeElement(); },
    scrollIntoView() {},
    focus() {}
  };
}

const elements = new Map();
function element(id = '') {
  if (!elements.has(id)) {
    const item = fakeElement();
    item.parentElement = fakeElement();
    elements.set(id, item);
  }
  return elements.get(id);
}

const fullSource = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
const source = fullSource.split("els.collect.addEventListener('click', collect);")[0];

const context = {
  console,
  chrome: null,
  globalThis: null,
  MarketTratPreferences: preferenceEngine,
  MarketTratAnalyticsCore: analyticsCore,
  MarketTratAnalyticsUtils: analyticsUtils,
  MarketTratReportQuality: reportQuality,
  MarketTratSourceHealth: sourceHealth,
  localStorage: {
    getItem() { return null; },
    setItem() {},
    removeItem() {}
  },
  navigator: { hardwareConcurrency: 8 },
  document: {
    documentElement: fakeElement(),
    body: fakeElement(),
    getElementById: element,
    querySelector: () => element('query'),
    querySelectorAll: () => [],
    createElement: () => fakeElement(),
    createElementNS: () => fakeElement()
  },
  requestAnimationFrame(callback) { callback(); },
  fetch() { return Promise.reject(new Error('offline')); }
};
Object.assign(context, analyticsUtils);
context.globalThis = context;
vm.createContext(context);
vm.runInContext(source, context);

let classifierCalls = 0;
context.guessSpendCategory = () => {
  classifierCalls += 1;
  return 'Продукты';
};
assert.equal(context.withCategory({ title: 'Чай', category: 'Дом' }).category, 'Дом');
assert.equal(classifierCalls, 0, 'готовая категория не должна запускать повторную классификацию');
assert.equal(context.withCategory({ title: 'Чай', category: '' }).category, 'Продукты');
assert.equal(classifierCalls, 1);

context.classifySpendCategory = categoryEngine.classifySpendCategory;
const ambiguousCategory = JSON.parse(JSON.stringify(context.withCategory({
  source: 'ozon', title: 'Сумка для ноутбука', category: ''
})));
assert.equal(ambiguousCategory.category, 'unknown');
assert.equal(ambiguousCategory.category_needs_review, true);
assert.equal(ambiguousCategory.category_suggestion, 'Аксессуары');
const confidentCategory = JSON.parse(JSON.stringify(context.withCategory({
  source: 'ozon', title: 'Крем для обуви', category: ''
})));
assert.equal(confidentCategory.category, 'Бытовая химия');
assert.equal(confidentCategory.category_needs_review, false);
assert.equal(context.withCategory({ title: 'Яндекс Плюс', category: 'Подписки' }).category, 'Цифровые покупки');
assert.equal(context.withCategory({ title: 'Подарочная бумага', category: 'Пакеты и упаковка' }).category, 'Дом');
const migratedLegacyTobacco = JSON.parse(JSON.stringify(context.prepareSourceRow({
  title: 'POD система Vaporesso XROS', category: 'Продукты'
})));
assert.equal(migratedLegacyTobacco.category, 'Табак и никотин');
assert.equal(migratedLegacyTobacco.base_category, '');
for (const [title, oldCategory, expected] of [
  ['Скотч прозрачный, клейкая лента', 'Продукты', 'Дом'],
  ['Крем сливочный для торта', 'Красота и уход', 'Продукты'],
  ['Чехол для электронной книги', 'Книги', 'Аксессуары'],
  ['Ключ активации Windows 11 Pro', 'Электроника', 'Цифровые покупки']
]) {
  const migrated = context.prepareSourceRow({ title, category: oldCategory });
  assert.equal(migrated.category, expected, title);
  assert.equal(migrated.base_category, '', `${title}: старая автоматическая категория должна обновляться дальше`);
}
assert.equal(context.prepareSourceRow({ title: 'Кофе молотый', category: 'Продукты' }).base_category, 'Продукты');
const preservedProvidedTobacco = JSON.parse(JSON.stringify(context.prepareSourceRow({
  title: 'POD система Vaporesso XROS', category: 'Продукты', category_origin: 'provided'
})));
assert.equal(preservedProvidedTobacco.category, 'Продукты');
assert.equal(preservedProvidedTobacco.base_category, 'Продукты');
const refreshedCollectedCategory = JSON.parse(JSON.stringify(context.prepareSourceRow({
  source: 'ozon',
  receipt_url: 'https://www.ozon.ru/receipt?id=legacy-category',
  raw_title: 'Заказ № LEGACY-CATEGORY',
  title: 'POD система Vaporesso XROS',
  base_category: 'Продукты',
  category: 'Продукты',
  category_origin: 'provided'
})));
assert.equal(refreshedCollectedCategory.category, 'Табак и никотин');
assert.equal(refreshedCollectedCategory.base_category, '', 'категория старого сборщика должна пересчитаться');
const preservedLegacyManualCategory = context.prepareSourceRow({
  source: 'ozon',
  receipt_url: 'https://www.ozon.ru/receipt?id=manual-category',
  raw_title: 'Заказ № MANUAL-CATEGORY',
  title: 'POD система Vaporesso XROS',
  base_category: 'Моя категория',
  category: 'Моя категория',
  category_origin: 'manual'
});
assert.equal(preservedLegacyManualCategory.base_category, 'Моя категория', 'явная старая ручная категория должна сохраниться');
assert.equal(preservedLegacyManualCategory.category_origin, 'manual');
context.categoryQualityFixture = [
  { ...ambiguousCategory, amount: '500.00' },
  { ...confidentCategory, amount: '300.00' },
  { ...confidentCategory, title: 'Ручная правка', category_origin: 'manual', amount: '200.00' }
];
const categoryQuality = JSON.parse(JSON.stringify(context.categoryQuality(context.categoryQualityFixture)));
assert.deepEqual(categoryQuality, {
  total: 3,
  reviewRows: [{ ...ambiguousCategory, amount: '500.00' }],
  reviewAmount: 500,
  confirmed: 1,
  confident: 1,
  coverage: 67
});
assert.equal(context.categoryQuality([
  { ...confidentCategory, source: 'ozon', title: 'Одинаковый товар', category_origin: 'manual', amount: '100.00' },
  { ...confidentCategory, source: 'ozon', title: 'Одинаковый товар', category_origin: 'manual', amount: '100.00' },
  { ...confidentCategory, source: 'ozon', title: 'Другой товар', category_origin: 'rule', category_rule_id: 'rule-1', amount: '100.00' },
  { ...confidentCategory, source: 'wildberries', title: 'Ещё товар', category_origin: 'rule', category_rule_id: 'rule-1', amount: '100.00' }
]).confirmed, 2, 'счётчик показывает решения, а не число затронутых строк');
assert.equal(context.categoryReviewGroupCount([
  { ...ambiguousCategory, source: 'ozon', title: 'Один спорный товар', amount: '100.00' },
  { ...ambiguousCategory, source: 'ozon', title: 'Один спорный товар', amount: '100.00' },
  { ...ambiguousCategory, source: 'wildberries', title: 'Один спорный товар', amount: '100.00' }
]), 2, 'счётчик вкладки показывает решения по группам, а не число строк');
assert.deepEqual(JSON.parse(JSON.stringify(context.sparseOperationOverride({
  category: 'Продукты', profile: 'personal', note: '', excluded: false
}, {
  category: 'Продукты', profile: 'personal', note: '', excluded: false
}))), {}, 'сохранение возврата не должно создавать фиктивную ручную правку');
assert.deepEqual(JSON.parse(JSON.stringify(context.sparseOperationOverride({
  category: 'Продукты', profile: 'personal', note: '', excluded: false
}, {
  category: 'Дом', profile: 'personal', note: '', excluded: false
}))), { category: 'Дом' });

context.legacyBudgetFixture = { 'Дом': 15000, 'Книги': 3000 };
vm.runInContext('legacyBudgets = legacyBudgetFixture', context);
const migratedLegacySettings = JSON.parse(JSON.stringify(context.normalizeSettings({})));
assert.deepEqual(migratedLegacySettings.budgets[context.currentMonthKey()], {
  total: null,
  categories: context.legacyBudgetFixture
});
vm.runInContext('legacyBudgets = {}', context);

const normalizedDamagedSettings = JSON.parse(JSON.stringify(context.normalizeSettings({
  profiles: [{ id: 'Дом', name: 'Дом' }, { id: 'дом', name: 'Дубликат' }, null],
  activeProfile: 'missing',
  dataProfile: 'missing',
  budgets: { broken: [], '2026-07': { total: -1, categories: { Дом: 5000, bad: 'NaN' } } },
  overrides: [],
  customRules: [{ keyword: '', category: 'Дом' }]
})));
assert.deepEqual(normalizedDamagedSettings.profiles, [{ id: 'дом', name: 'Дом' }]);
assert.equal(normalizedDamagedSettings.activeProfile, 'all');
assert.equal(normalizedDamagedSettings.dataProfile, 'дом');
assert.deepEqual(normalizedDamagedSettings.budgets['2026-07'], { total: null, categories: { Дом: 5000 } });

const advancedRuleSettings = JSON.parse(JSON.stringify(context.normalizeSettings({
  customRules: [{
    id: 'advanced',
    keywords: ['кофе', 'зерна'],
    negativeKeywords: ['игрушка'],
    sources: ['ozon', 'wb'],
    match: 'all',
    category: 'Продукты',
    priority: 120,
    enabled: false,
    amountMin: 100,
    amountMax: 5000
  }]
})));
assert.deepEqual(advancedRuleSettings.customRules, [{
  id: 'advanced',
  keyword: 'кофе, зерна',
  keywords: ['кофе', 'зерна'],
  negativeKeywords: ['игрушка'],
  sources: ['ozon', 'wildberries'],
  match: 'all',
  category: 'Продукты',
  priority: 120,
  enabled: false,
  amountMin: 100,
  amountMax: 5000
}]);

const closure = lifecycleEngine.closeMonth(lifecycleEngine.createMonthClosure('2026-07'), [{
  rowId: 'purchase-1', date: '2026-07-01', source: 'ozon', title: 'Чай', amount: 100, category: 'Продукты'
}], { now: '2026-08-01', confirmReview: true });
const maximumSettings = JSON.parse(JSON.stringify(context.normalizeSettings({
  profiles: [{ id: 'personal', name: 'Личный' }, { id: 'work', name: 'Рабочий' }],
  budgets: {
    '2026-07': { total: 1000, categories: { Продукты: 500 } },
    ['work\u00012026-07']: { total: 2000, categories: { Электроника: 1500 } },
    ['missing\u00012026-07']: { total: 9999, categories: {} }
  },
  refundClaims: [{
    rowId: 'purchase-1', source: 'ozon', marketplace_id: 'order-1', title: 'Чай', amount: 100,
    profile: 'work', purchaseDate: '2026-07-01', createdAt: '2026-07-02', status: 'reconciled'
  }],
  warranties: [{
    id: 'archive-1', kind: 'warranty', rowId: 'purchase-1', marketplace_id: 'order-1', source: 'ozon',
    title: 'Чайник', issuedAt: '2026-07-01', expiresAt: '2027-07-01', url: 'https://example.test/receipt',
    note: 'Серийный номер', addedAt: '2026-07-01', profile: 'work'
  }],
  monthClosures: { ['work\u00012026-07']: closure },
  recurringDecisions: { ['work\u0001coffee']: 'confirmed', bad: 'unknown' },
  anomalyDismissals: { ['work\u0001duplicate\u0001row']: true, falseValue: false }
})));
assert.equal(maximumSettings.refundClaims[0].expectedAmount, 100);
assert.equal(maximumSettings.refundClaims[0].status, 'received');
assert.equal(maximumSettings.refundClaims[0].profile, 'work');
assert.equal(maximumSettings.warranties[0].url, 'https://example.test/receipt');
assert.equal(maximumSettings.warranties[0].profile, 'work');
assert.equal(maximumSettings.monthClosures['work\u00012026-07'].status, 'closed');
assert.equal(maximumSettings.recurringDecisions['work\u0001coffee'], 'confirmed');
assert.equal(maximumSettings.anomalyDismissals['work\u0001duplicate\u0001row'], true);
assert.equal(maximumSettings.budgets['work\u00012026-07'].total, 2000);
assert.equal(maximumSettings.budgets['missing\u00012026-07'], undefined);
assert.notEqual(
  context.categoryRuleSignature({ keywords: ['крем'], negativeKeywords: ['обуви'], sources: [], match: 'any' }),
  context.categoryRuleSignature({ keywords: ['крем'], negativeKeywords: ['лица'], sources: [], match: 'any' })
);
assert.notEqual(
  context.categoryRuleSignature({ keywords: ['крем'], sources: [], match: 'any', amountMin: 100 }),
  context.categoryRuleSignature({ keywords: ['крем'], sources: [], match: 'any', amountMin: 500 })
);
assert.equal(
  context.categoryRuleSignature({ keywords: ['зерна', 'кофе'], sources: ['wb', 'ozon'], match: 'all' }),
  context.categoryRuleSignature({ keywords: ['кофе', 'зерна'], sources: ['ozon', 'wildberries'], match: 'all' })
);

const records = [
  {
    date: '2024-03-10',
    source: 'yandex',
    title: 'Материнская плата Gigabyte B650 EAGLE AX',
    amount: '22070.00',
    currency: 'RUB',
    category: 'Электроника',
    type: 'purchase'
  },
  {
    date: '2024-03-15',
    source: 'yandex',
    title: 'Материнская плата Gigabyte B650 EAGLE AX',
    amount: '-22070.00',
    currency: 'RUB',
    category: 'Электроника',
    type: 'refund'
  },
  {
    date: '2024-03-20',
    source: 'yandex',
    title: 'Материнская плата Gigabyte B650 EAGLE AX',
    amount: '20649.00',
    currency: 'RUB',
    category: 'Электроника',
    type: 'purchase'
  }
];

assert.equal(context.buildTopItems(records)[0].amount, 20649);
assert.equal(context.buildCategoryBreakdown(records).entries[0].amount, 20649);

vm.runInContext("budgets = { 'Электроника': 21000 }", context);
assert.equal(context.budgetEntries(records)[0].spent, 20649);

context.netRecords = records;
vm.runInContext('rows = netRecords', context);
const analytics = context.buildAnalyticsData(new Set(['yandex']), 'month');
assert.equal(analytics.periods[0].byCategory['Электроника'], 20649);

const known = context.collectKnownReceipts([
  { date: '2024-01-01', source: 'ozon', marketplace_id: 'ozon-old', receipt_url: 'https://ozon-old' },
  { date: '2024-02-01', source: 'ozon', marketplace_id: 'ozon-new', receipt_url: 'https://ozon-new' },
  { date: '2024-03-01', source: 'wildberries', marketplace_id: 'wb-1' },
  { date: '2024-04-01', source: 'yandex', marketplace_id: '123:fn:fpd:n' }
]);

assert.equal(known.ozon.slice(0, 2).join(','), 'ozon-new,https://ozon-new');
assert.equal(known.wildberries.join(','), 'wb-1');
assert.equal(known.yandexOrders.join(','), '123');
assert.equal(context.hasKnownReceipts(known), true);
const normalizedLegacyReport = context.normalizeCollectionReport({
  sources: ['ozon'],
  warnings: [
    'Ozon: агрегатная предоплата сверена с полным расчетом; скорректировано 1, погашено 2',
    'Ozon: состав не распознан у чеков 1; сохранены только итоговые суммы'
  ]
});
assert.equal(normalizedLegacyReport.warnings.length, 1, 'успешная сверка не является предупреждением');
assert.equal(context.warningCountAfterNormalization(2, {
  warnings: ['Ozon: агрегатная предоплата сверена с полным расчетом', 'Ozon: состав не распознан']
}, normalizedLegacyReport), 1);
const legacyOzonDuplicates = Array.from({ length: 3 }, (_, index) => ([
  {
    date: `2026-01-0${index + 1}`,
    source: 'ozon',
    raw_title: `Заказ № ORDER-${index}`,
    title: `Товар ${index}`,
    amount: '100.00',
    receipt_url: `https://www.ozon.ru/receipt?id=pre-${index}`,
    parse_quality: 'complete'
  },
  {
    date: `2026-01-1${index + 1}`,
    source: 'ozon',
    raw_title: `Заказ   №   ORDER-${index}`,
    title: `Товар ${index}`,
    amount: '100.00',
    receipt_url: `https://www.ozon.ru/receipt?id=full-${index}`,
    parse_quality: 'complete'
  }
])).flat();
assert.equal(context.legacyOzonSettlementDuplicateCount(legacyOzonDuplicates), 3);
assert.equal(context.needsOzonSettlementRepair(legacyOzonDuplicates), true);
assert.deepEqual(JSON.parse(JSON.stringify(context.collectKnownReceipts(legacyOzonDuplicates).ozon)), [], 'ремонт требует полного Ozon-сканирования');
assert.equal(context.needsOzonSettlementRepair(legacyOzonDuplicates.slice(0, 1)), false, 'один чек не требует пересбора');
assert.equal(context.needsOzonSettlementRepair(legacyOzonDuplicates.slice(0, 2).map((row) => ({
  ...row,
  ozon_settlement_kind: 'full'
}))), false, 'новые уже сверенные чеки не должны просить повторный пересбор');
const unresolvedAndFull = legacyOzonDuplicates.slice(0, 2).map((row, index) => ({
  ...row,
  ozon_settlement_kind: index ? 'full' : ''
}));
assert.equal(context.needsOzonSettlementRepair(unresolvedAndFull), true, 'неопределённый ранний чек и итоговый расчёт требуют полного пересбора');
assert.deepEqual(JSON.parse(JSON.stringify(context.collectKnownReceipts(unresolvedAndFull).ozon)), []);
const liveOrderPrefix = '55887469-0288';
const liveStyleSettlementDuplicate = [
  {
    source: 'ozon',
    date: '2026-08-01',
    title: 'Кабель USB-C',
    amount: '500.00',
    receipt_url: `https://www.ozon.ru/_action/downloadCheque?chequeId=${liveOrderPrefix}-ae92b46c-7399-4fa3-aeeb-e472be915820-0-0`,
    raw_title: 'Ozon cheque',
    parse_quality: 'complete',
    ozon_settlement_kind: 'prepayment'
  },
  {
    source: 'ozon',
    date: '2026-08-02',
    title: 'Кабель USB-C',
    amount: '540.00',
    receipt_url: `https://www.ozon.ru/_action/downloadCheque?chequeId=${liveOrderPrefix}-82307747-54ad-4999-b8da-40646d7a0fbb-0-0`,
    raw_title: 'Ozon cheque',
    parse_quality: 'complete',
    ozon_settlement_kind: 'full'
  }
];
assert.equal(context.legacyOzonSettlementDuplicateCount(liveStyleSettlementDuplicate), 1, 'предоплата и финальный чек с доставкой требуют ремонта');
assert.equal(context.needsOzonSettlementRepair(liveStyleSettlementDuplicate), true);
assert.deepEqual(JSON.parse(JSON.stringify(context.collectKnownReceipts(liveStyleSettlementDuplicate).ozon)), [], 'ремонт новых расчётов тоже требует полного Ozon-сканирования');
const unresolvedPrepayment = liveStyleSettlementDuplicate.slice(0, 1);
assert.equal(context.needsOzonSettlementRepair(unresolvedPrepayment), false, 'одна ожидающая предоплата ещё не является дублем');
assert.equal(context.needsOzonFullScan(unresolvedPrepayment), true, 'ожидающая предоплата требует полного сбора до появления финального чека');
assert.deepEqual(JSON.parse(JSON.stringify(context.collectKnownReceipts(unresolvedPrepayment).ozon)), []);
assert.deepEqual(
  JSON.parse(JSON.stringify(context.mergeCollectedRows([{ title: 'CSV без id' }], [{ title: 'Собрано' }]))),
  [{ title: 'CSV без id' }, { title: 'Собрано' }]
);
assert.deepEqual(
  JSON.parse(JSON.stringify(context.mergeCollectedRows([], [{ title: 'Первый сбор' }]))),
  [{ title: 'Первый сбор' }]
);
const replacedFallback = context.mergeCollectedRows([
  { source: 'wildberries', receipt_url: 'https://receipt.wb.ru/1', title: 'Чек без состава', amount: '300.00' },
  { source: 'wildberries', receipt_url: 'https://receipt.wb.ru/old', title: 'Старый чек', amount: '50.00' }
], [
  { source: 'wildberries', receipt_url: 'https://receipt.wb.ru/1', title: 'Товар A', amount: '100.00' },
  { source: 'wildberries', receipt_url: 'https://receipt.wb.ru/1', title: 'Товар B', amount: '200.00' }
]);
assert.equal(replacedFallback.map((row) => row.title).join(','), 'Старый чек,Товар A,Товар B');
assert.equal(replacedFallback.reduce((sum, row) => sum + Number(row.amount), 0), 350);
const completeReceipt = [
  { source: 'wildberries', receipt_url: 'https://receipt.wb.ru/complete', title: 'Товар A', amount: '100.00' },
  { source: 'wildberries', receipt_url: 'https://receipt.wb.ru/complete', title: 'Товар B', amount: '200.00' }
];
const fallbackDidNotDowngrade = context.mergeCollectedRows(completeReceipt, [
  { source: 'wildberries', receipt_url: 'https://receipt.wb.ru/complete', title: 'Wildberries receipt (состав не распознан)', amount: '300.00', parse_quality: 'fallback' }
]);
assert.equal(fallbackDidNotDowngrade.map((row) => row.title).join(','), 'Товар A,Товар B');
const partialDidNotDowngrade = context.mergeCollectedRows(completeReceipt, [
  { source: 'wildberries', receipt_url: 'https://receipt.wb.ru/complete', title: 'Товар A', amount: '100.00' }
]);
assert.equal(partialDidNotDowngrade.map((row) => row.title).join(','), 'Товар A,Товар B');
const explicitSettlementReplacement = context.mergeCollectedRows(completeReceipt, [], [
  'wildberries\u0001https://receipt.wb.ru/complete'
]);
assert.equal(explicitSettlementReplacement.length, 0);
for (const source of ['ozon', 'yandex']) {
  const prepaymentUrl = `https://receipt.example/${source}/prepayment`;
  const partialSettlementMerge = context.mergeCollectedRows([
    { source, receipt_url: prepaymentUrl, title: 'Товар A', amount: '100.00', parse_quality: 'complete' },
    { source, receipt_url: prepaymentUrl, title: 'Товар B', amount: '200.00', parse_quality: 'complete' }
  ], [
    { source, receipt_url: prepaymentUrl, title: 'Частично погашенная предоплата', amount: '200.00', parse_quality: 'fallback' },
    { source, receipt_url: `https://receipt.example/${source}/full`, title: 'Товар A', amount: '100.00', parse_quality: 'complete' }
  ], [
    `${source}\u0001${prepaymentUrl}`
  ]);
  assert.equal(partialSettlementMerge.reduce((sum, row) => sum + Number(row.amount), 0), 300);
  assert.equal(partialSettlementMerge.length, 2);
}
const correctedLegacyReceipt = context.mergeCollectedRows([
  { source: 'wildberries', receipt_url: 'https://receipt.wb.ru/legacy', title: 'Товар A', amount: '100.00' },
  { source: 'wildberries', receipt_url: 'https://receipt.wb.ru/legacy', title: 'Товар B', amount: '300.00' }
], [
  { source: 'wildberries', receipt_url: 'https://receipt.wb.ru/legacy', title: 'Товар A', amount: '100.00', parse_quality: 'complete' },
  { source: 'wildberries', receipt_url: 'https://receipt.wb.ru/legacy', title: 'Товар B', amount: '200.00', parse_quality: 'complete' }
]);
assert.equal(correctedLegacyReceipt.reduce((sum, row) => sum + Number(row.amount), 0), 300);
element('periodChartMode').value = 'category';
const segments = context.periodChartSegments(analytics.periods[0]);
assert.equal(segments[0].key, 'Электроника');
assert.equal(segments[0].amount, 20649);
assert.ok(context.periodChartSegmentTitle(analytics.periods[0], segments[0]).includes('Электроника: 100%'));

const orderRecords = [
  { date: '2024-01-01', source: 'ozon', title: 'Big small month', amount: '1.00', currency: 'RUB', category: 'A', type: 'purchase' },
  { date: '2024-01-02', source: 'ozon', title: 'Small big month', amount: '50.00', currency: 'RUB', category: 'B', type: 'purchase' },
  { date: '2024-02-01', source: 'ozon', title: 'Big overall', amount: '100.00', currency: 'RUB', category: 'A', type: 'purchase' },
  { date: '2024-02-02', source: 'ozon', title: 'Small overall', amount: '1.00', currency: 'RUB', category: 'B', type: 'purchase' }
];
context.orderRecords = orderRecords;
vm.runInContext('rows = orderRecords', context);
const orderedAnalytics = context.buildAnalyticsData(new Set(['ozon']), 'month');
const categoryOrder = new Map(context.buildCategoryBreakdown(orderRecords).entries.map((item, index) => [item.category, index]));
assert.equal(context.periodChartSegments(orderedAnalytics.periods[0], categoryOrder).map((item) => item.key).join(','), 'A,B');
assert.equal(context.averageForPeriods(orderedAnalytics.total, orderedAnalytics.periods), 76);
vm.runInContext("detailFilter = { type: 'category', category: 'A', label: 'A' }", context);
const filteredAnalytics = context.buildAnalyticsData(new Set(['ozon']), 'month');
assert.equal(filteredAnalytics.total, 101);
assert.equal(context.averageForPeriods(filteredAnalytics.total, filteredAnalytics.periods), 50.5);
assert.equal(context.analyticsScopeName(), 'A');
assert.equal(context.totalForRange(new Set(['ozon']), { from: Date.UTC(2024, 0, 1), to: Date.UTC(2024, 1, 29) }, 'month'), 101);
vm.runInContext("detailFilter = toggleCategoryFilter({ category: 'B', label: 'B' })", context);
const multiCategoryAnalytics = context.buildAnalyticsData(new Set(['ozon']), 'month');
assert.equal(multiCategoryAnalytics.total, 152);
assert.equal(context.analyticsScopeName(), 'A, B');
vm.runInContext("detailFilter = toggleCategoryFilter({ category: 'A', label: 'A' })", context);
const onlySecondCategoryAnalytics = context.buildAnalyticsData(new Set(['ozon']), 'month');
assert.equal(onlySecondCategoryAnalytics.total, 51);
assert.equal(context.analyticsScopeName(), 'B');
const unfilteredAnalytics = context.buildAnalyticsData(new Set(['ozon']), 'month', true);
assert.equal(unfilteredAnalytics.total, 152);
vm.runInContext('detailFilter = null', context);
assert.equal(context.averagePeriodLabel('week'), 'в среднем за неделю');
assert.equal(JSON.stringify(context.quickPeriodRange('last-7-days', new Date(2024, 5, 17))), '{"from":"2024-06-11","to":"2024-06-17"}');
assert.equal(JSON.stringify(context.quickPeriodRange('this-quarter', new Date(2024, 5, 17))), '{"from":"2024-04-01","to":"2024-06-30"}');
assert.equal(JSON.stringify(context.quickPeriodRange('prev-quarter', new Date(2024, 0, 17))), '{"from":"2023-10-01","to":"2023-12-31"}');
assert.equal(JSON.stringify(context.quickPeriodRange('prev-year', new Date(2024, 5, 17))), '{"from":"2023-01-01","to":"2023-12-31"}');

const sourceStackRecords = [
  { date: '2024-01-01', source: 'wildberries', title: 'WB', amount: '100.00', currency: 'RUB', category: 'A', type: 'purchase' },
  { date: '2024-01-01', source: 'yandex', title: 'Yandex', amount: '80.00', currency: 'RUB', category: 'A', type: 'purchase' },
  { date: '2024-01-01', source: 'ozon', title: 'Ozon', amount: '10.00', currency: 'RUB', category: 'A', type: 'purchase' }
];
context.sourceStackRecords = sourceStackRecords;
vm.runInContext('rows = sourceStackRecords', context);
element('periodChartMode').value = 'source';
const sourceStackAnalytics = context.buildAnalyticsData(new Set(['ozon', 'wildberries', 'yandex']), 'month');
assert.equal(context.periodChartSegments(sourceStackAnalytics.periods[0]).map((item) => item.key).join(','), 'ozon,wildberries,yandex');

const exportRecords = [
  { date: '2024-01-10', source: 'ozon', title: 'Jan', amount: '10.00', currency: 'RUB', category: 'A', type: 'purchase' },
  { date: '2024-02-10', source: 'ozon', title: 'Feb Ozon', amount: '20.00', currency: 'RUB', category: 'A', type: 'purchase' },
  { date: '2024-02-11', source: 'wildberries', title: 'Feb WB', amount: '30.00', currency: 'RUB', category: 'B', type: 'purchase' },
  { date: '2024-03-10', source: 'yandex', title: 'Mar', amount: '40.00', currency: 'RUB', category: 'C', type: 'purchase' }
];
context.exportRecords = exportRecords;
vm.runInContext('rows = exportRecords', context);
element('dateFrom').value = '2024-02-01';
element('dateTo').value = '2024-02-29';
element('analyticsOzon').checked = true;
element('analyticsWb').checked = false;
element('analyticsYandex').checked = true;
assert.deepEqual(context.csvExportRows().map((row) => row.title), ['Feb Ozon']);
assert.equal(context.csvExportSuffix(), '2024-02-01_2024-02-29');
assert.deepEqual(context.dataExportRows().map((row) => row.title), exportRecords.map((row) => row.title));

for (const value of ['=1+1', '+SUM(A1:A2)', '@cmd', '-2+3', '  =HYPERLINK("x")', '\t@cmd', '\r+1', '\n-1']) {
  const encoded = context.csvCell(value);
  assert.ok(encoded.startsWith("'") || encoded.startsWith('"\''), `${JSON.stringify(value)} должен быть нейтрализован`);
}
assert.equal(context.csvCell('-1490.00', false), '-1490.00');
const formulaSafeCsv = context.makeCsv([{
  date: '2026-01-01',
  source: 'ozon',
  title: '=HYPERLINK("https://example.test")',
  amount: '-1490.00',
  currency: 'RUB',
  category: '+Опасная категория',
  type: 'refund',
  marketplace_id: '@order',
  item_index: '-1'
}]);
assert.match(formulaSafeCsv, /"'=HYPERLINK\(""https:\/\/example\.test""\)"/);
assert.match(formulaSafeCsv, /,-1490\.00,/);
assert.match(formulaSafeCsv, /'\+Опасная категория/);

assert.equal(context.automaticPersistenceAllowed(), true);
vm.runInContext('dataEpoch = 4', context);
assert.equal(context.isNewerDataEpoch(4), false);
assert.equal(context.isNewerDataEpoch(3), false);
assert.equal(context.isNewerDataEpoch(5), true);
assert.equal(context.adoptLoadedDataEpoch(3), false);
assert.equal(vm.runInContext('dataEpoch', context), 4);
assert.equal(context.adoptLoadedDataEpoch(4), true);
assert.equal(context.adoptLoadedDataEpoch(6), true);
assert.equal(vm.runInContext('dataEpoch', context), 6);
assert.equal(context.adoptLoadedDataEpoch(-1), false);
vm.runInContext('dataEpoch = 4', context);
assert.equal(context.adoptLoadedDataRevision(7), true);
assert.equal(vm.runInContext('dataRevision', context), 7);
const storageConflictBody = source.slice(source.indexOf('function markStorageConflict('), source.indexOf('function currentMonthKey('));
assert.match(storageConflictBody, /setMutationControlsDisabled\(true\)/);

const originalRemoveItem = context.localStorage.removeItem;
context.localStorage.removeItem = () => {
  throw new Error('injected localStorage failure');
};
assert.equal(context.cleanupLegacyStorageAfterCommit(), false);
context.localStorage.removeItem = originalRemoveItem;
assert.equal(context.cleanupLegacyStorageAfterCommit(), true);
context.withAutomaticPersistenceSuppressed(() => {
  assert.equal(context.automaticPersistenceAllowed(), false);
  context.withAutomaticPersistenceSuppressed(() => {
    assert.equal(context.automaticPersistenceAllowed(), false);
  });
  assert.equal(context.automaticPersistenceAllowed(), false);
});
assert.equal(context.automaticPersistenceAllowed(), true);
const restoreSnapshotBody = source.slice(source.indexOf('function restoreSnapshot('), source.indexOf('function restoreLastRun('));
assert.match(restoreSnapshotBody, /withAutomaticPersistenceSuppressed/);
const refundClaimsBody = source.slice(source.indexOf('function renderRefundClaims('), source.indexOf('function downloadBlob('));
assert.match(refundClaimsBody, /automaticPersistenceAllowed\(\)/);
context.withAutomaticPersistenceSuppressed(async () => {
  assert.equal(context.automaticPersistenceAllowed(), false);
  await Promise.resolve();
  assert.equal(context.automaticPersistenceAllowed(), false);
}).then(() => {
  assert.equal(context.automaticPersistenceAllowed(), true);
}).catch((error) => {
  process.nextTick(() => {
    throw error;
  });
});

const collectBody = source.slice(source.indexOf('async function collect()'), source.indexOf("api?.runtime?.onMessage"));
assert.match(collectBody, /collectionInProgress = true/);
assert.match(collectBody, /generation !== collectGeneration/);
assert.doesNotMatch(collectBody, /updateResult\(\[\]/, 'сбор не должен очищать текущий отчёт до успешного ответа');

const initializeBody = fullSource.slice(fullSource.indexOf('async function initializeApp()'));
const loadIndex = initializeBody.indexOf('featureStorage.loadWithEpoch()');
const legacyRestoreIndex = initializeBody.indexOf('restoreLastRun()');
const migrationSaveIndex = initializeBody.indexOf("persistSnapshot('Миграция старого отчёта')");
assert.ok(loadIndex >= 0 && legacyRestoreIndex > loadIndex && migrationSaveIndex > legacyRestoreIndex);
assert.match(initializeBody, /adoptLoadedDataEpoch\(loaded\.epoch\)/);
assert.match(initializeBody, /dataEpoch === 0 && restoreLastRun\(\)/);
assert.match(fullSource, /markettrat-last-run-v1/);
assert.match(fullSource, /markettrat-budgets-v1/);

const deleteAllDataBody = fullSource.slice(
  fullSource.indexOf('async function deleteAllData()'),
  fullSource.indexOf('function demoRows()')
);
assert.ok(
  deleteAllDataBody.indexOf('await clearBackgroundCollectJobs()')
    < deleteAllDataBody.indexOf('await featureStorage.clear()')
);
assert.match(deleteAllDataBody, /collectJobCleanupError/);
const resetAfterClearBody = fullSource.slice(
  fullSource.indexOf('function resetLocalDataAfterClear('),
  fullSource.indexOf('function renderLog()')
);
assert.match(resetAfterClearBody, /for \(const \[, input\] of collectSourceInputs\) input\.checked = false/);
assert.match(resetAfterClearBody, /setMutationControlsDisabled\(false\)/);

const diagnostic = context.sourceDiagnostic('ozon', {
  ozon: { receipts: 18, parsedReceipts: 17, failedReceipts: 1, itemRows: 42 }
});
assert.equal(diagnostic.label, '17/18 чеков');
assert.ok(diagnostic.title.includes('пропущено 1'));

const largeOverrideRows = Array.from({ length: 100000 }, (_, index) => ({
  rowId: `large-${index}`,
  source: 'ozon',
  date: '2026-08-01',
  title: `Товар ${index}`,
  amount: '1.00',
  category: 'Дом',
  profile: 'personal'
}));
context.largeOverrideRows = largeOverrideRows;
context.largeOverrides = Object.fromEntries(largeOverrideRows.map((row) => [row.rowId, { category: 'Дом' }]));
const overrideRenderStartedAt = Date.now();
vm.runInContext(`
  sourceRows = largeOverrideRows;
  rows = largeOverrideRows;
  appSettings.overrides = largeOverrides;
  operationOverridesShownCount = 100;
  renderOperationOverrides();
`, context);
assert.ok(Date.now() - overrideRenderStartedAt < 2000, '100k ручных правок должны рендериться без квадратичного поиска');
assert.match(element('operationOverridesSummary').textContent, /100000/);
