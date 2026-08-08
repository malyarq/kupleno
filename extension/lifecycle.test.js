const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const lifecycle = require('./lifecycle.js');

const rows = [
  { rowId: 'purchase-1', date: '2026-06-02', source: 'ozon', marketplace_id: 'order-1', title: 'Чай', amount: '100', type: 'purchase', category: 'Продукты' },
  { rowId: 'refund-1', date: '2026-06-10', source: 'ozon', marketplace_id: 'order-1', title: 'Чай', amount: '-30', type: 'refund', category: 'Продукты' },
  { rowId: 'review-1', date: '2026-06-12', source: 'ozon', marketplace_id: 'order-2', title: 'Неизвестное', amount: '20', type: 'purchase', category: 'unknown', category_needs_review: true },
  { rowId: 'excluded-1', date: '2026-06-13', source: 'ozon', marketplace_id: 'order-3', title: 'Исключено', amount: '99', type: 'purchase', category: 'Дом', excluded: true },
  { rowId: 'other-month', date: '2026-07-01', source: 'ozon', marketplace_id: 'order-4', title: 'Июль', amount: '999', type: 'purchase', category: 'Дом' }
];

const open = lifecycle.createMonthClosure('2026-06');
assert.equal(open.status, 'open');
const needsReview = lifecycle.closeMonth(open, rows, { now: '2026-07-01' });
assert.equal(needsReview.status, 'needs-review');
assert.equal(needsReview.totals.netSpend, 90);
assert.equal(needsReview.totals.excludedCount, 1);
assert.equal(needsReview.review.issues.length, 1);
assert.equal(open.totals, null, 'входной объект не мутируется');

const closed = lifecycle.closeMonth(needsReview, rows, { now: '2026-07-02', confirmReview: true });
assert.equal(closed.status, 'closed');
assert.equal(closed.closedAt, '2026-07-02');
assert.throws(() => lifecycle.closeMonth(closed, rows), /повторно открыть/);
const reopened = lifecycle.reopenMonth(closed, { now: '2026-07-03' });
assert.equal(reopened.status, 'open');
assert.equal(reopened.totals, null);
assert.equal(reopened.previousTotals.netSpend, 90);
assert.equal(closed.status, 'closed');
assert.throws(() => lifecycle.createMonthClosure('2026-13'), /YYYY-MM/);

const warranty = {
  id: 'warranty-1',
  kind: 'warranty',
  rowId: 'purchase-1',
  marketplace_id: 'order-1',
  source: 'ozon',
  title: 'Чайник',
  issuedAt: '2026-01-10',
  expiresAt: '2026-08-20',
  url: 'https://example.test/receipt/1',
  note: 'Гарантия магазина',
  addedAt: '2026-01-10'
};
assert.equal(lifecycle.archiveStatus(warranty, { now: '2026-08-01', expiringDays: 30 }), 'expiring');
assert.equal(lifecycle.archiveStatus({ ...warranty, expiresAt: '2026-07-31' }, { now: '2026-08-01' }), 'expired');
assert.equal(lifecycle.archiveStatus({ ...warranty, expiresAt: null }, { now: '2026-08-01' }), 'active');
const archive = lifecycle.buildArchive([warranty, { ...warranty, id: 'receipt-1', kind: 'receipt', expiresAt: null }], { now: '2026-08-01' });
assert.deepEqual(archive.summary, { active: 1, expiring: 1, expired: 0 });
assert.throws(() => lifecycle.normalizeArchiveRecord({ ...warranty, blob: 'AA==' }), /неподдерживаемое поле/);
assert.throws(() => lifecycle.normalizeArchiveRecord({ ...warranty, url: 'data:application/pdf;base64,AA==' }), /HTTP\(S\)-ссылка/);
assert.throws(() => lifecycle.normalizeArchiveRecord({ ...warranty, rowId: '', marketplace_id: '' }), /rowId или marketplace_id/);
assert.equal(warranty.note, 'Гарантия магазина', 'архив не меняет запись пользователя');

const returnRows = [
  { rowId: 'refund-exact-1', date: '2026-07-04', source: 'ozon', marketplace_id: 'order-10', title: 'Кофе', amount: '-40', type: 'refund' },
  { rowId: 'refund-exact-2', date: '2026-07-05', source: 'ozon', marketplace_id: 'order-10', title: 'Кофе', amount: '-60', type: 'refund' },
  { rowId: 'refund-partial', date: '2026-07-05', source: 'ozon', marketplace_id: 'order-11', title: 'Чай', amount: '-40', type: 'refund' },
  { rowId: 'refund-disputed', date: '2026-07-06', source: 'wildberries', marketplace_id: 'different-receipt', title: 'Кроссовки', amount: '-500', type: 'refund' }
];
const expectedReturns = [
  { id: 'full', rowId: 'purchase-full', marketplace_id: 'order-10', source: 'ozon', title: 'Кофе', expectedAmount: 100, requestedAt: '2026-07-01' },
  { id: 'partial', rowId: 'purchase-partial', marketplace_id: 'order-11', source: 'ozon', title: 'Чай', expectedAmount: 200, requestedAt: '2026-07-01', dueDate: '2026-07-20' },
  { id: 'disputed', rowId: 'purchase-disputed', marketplace_id: 'order-12', source: 'wildberries', title: 'Кроссовки', expectedAmount: 500, requestedAt: '2026-07-01' },
  { id: 'overdue', rowId: 'purchase-overdue', marketplace_id: 'order-13', source: 'ozon', title: 'Дом', expectedAmount: 10, requestedAt: '2026-06-01', dueDate: '2026-06-15' }
];
const reconciled = lifecycle.reconcileExpectedReturns(expectedReturns, returnRows, { now: '2026-07-10' });
assert.deepEqual(reconciled.returns.map((item) => item.status), ['received', 'partial', 'disputed', 'overdue']);
assert.equal(reconciled.returns[0].receivedAmount, 100);
assert.equal(reconciled.returns[1].outstandingAmount, 160);
assert.deepEqual(reconciled.returns[2].candidateRowIds, ['refund-disputed']);
const confirmed = lifecycle.confirmDisputedReturn(reconciled.returns[2], returnRows, ['refund-disputed'], { now: '2026-07-10' });
const manuallyReconciled = lifecycle.reconcileExpectedReturns([confirmed], returnRows, { now: '2026-07-10' }).returns[0];
assert.equal(manuallyReconciled.status, 'received');
assert.equal(manuallyReconciled.confirmedAt, '2026-07-10');
assert.throws(() => lifecycle.confirmDisputedReturn(reconciled.returns[2], returnRows, ['refund-exact-1']), /спорное совпадение/);
assert.throws(() => lifecycle.reconcileExpectedReturns([{ ...expectedReturns[0], id: 'bad', manualMatchRowIds: ['missing'] }], returnRows), /не найдена/);
assert.equal(expectedReturns[2].manualMatchRowIds, undefined, 'входные ожидания не мутируются');

const sharedOrderReturns = lifecycle.reconcileExpectedReturns([
  { id: 'item-a', rowId: 'purchase-a', marketplace_id: 'shared-order', source: 'ozon', title: 'Товар A', expectedAmount: 100, requestedAt: '2026-07-01' },
  { id: 'item-b', rowId: 'purchase-b', marketplace_id: 'shared-order', source: 'ozon', title: 'Товар B', expectedAmount: 200, requestedAt: '2026-07-01' }
], [
  { rowId: 'refund-b', date: '2026-07-05', source: 'ozon', marketplace_id: 'shared-order', title: 'Товар B', amount: -200, type: 'refund' },
  { rowId: 'refund-a', date: '2026-07-05', source: 'ozon', marketplace_id: 'shared-order', title: 'Товар A', amount: -100, type: 'refund' }
], { now: '2026-07-10' });
assert.deepEqual(sharedOrderReturns.returns.map((item) => item.matchedRowIds), [['refund-a'], ['refund-b']]);
assert.deepEqual(sharedOrderReturns.returns.map((item) => item.status), ['received', 'received']);

function closedMonth(month, netSpend, category) {
  return {
    version: 1,
    month,
    status: 'closed',
    totals: {
      rowCount: 1,
      excludedCount: 0,
      purchaseCount: 1,
      refundCount: 0,
      grossSpend: netSpend,
      refundAmount: 0,
      netSpend,
      categories: [{ category, grossSpend: netSpend, refundAmount: 0, netSpend }]
    },
    review: { issues: [] },
    closedAt: `${month}-28`,
    reopenedAt: null,
    previousTotals: null
  };
}

const insufficient = lifecycle.buildNextMonthBudgetTemplate([closedMonth('2026-04', 100, 'Дом'), closedMonth('2026-05', 200, 'Дом')], { month: '2026-07' });
assert.equal(insufficient.sufficientHistory, false);
assert.equal(insufficient.estimate, null);
const template = lifecycle.buildNextMonthBudgetTemplate([
  closedMonth('2026-03', 100, 'Дом'),
  closedMonth('2026-04', 200, 'Дом'),
  closedMonth('2026-05', 300, 'Дом')
], { month: '2026-07' });
assert.equal(template.sufficientHistory, true);
assert.deepEqual(template.template, { total: 200, categories: { Дом: 200 } });
assert.equal(template.estimate.method, 'average-closed-months');
const emptyClosed = lifecycle.closeMonth(lifecycle.createMonthClosure('2026-01'), [], { now: '2026-02-01', confirmReview: true });
const emptyHistory = lifecycle.buildNextMonthBudgetTemplate([
  emptyClosed,
  { ...emptyClosed, month: '2026-02', closedAt: '2026-03-01' },
  { ...emptyClosed, month: '2026-03', closedAt: '2026-04-01' }
], { month: '2026-04' });
assert.equal(emptyHistory.sufficientHistory, false);
assert.equal(emptyHistory.sourceMonths.length, 0);

const browserContext = { globalThis: null };
browserContext.globalThis = browserContext;
vm.createContext(browserContext);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'lifecycle.js'), 'utf8'), browserContext);
assert.equal(typeof browserContext.KuplenoLifecycle.closeMonth, 'function');

console.log('lifecycle.test.js: ok');
