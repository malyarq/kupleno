'use strict';

const assert = require('node:assert/strict');
const analytics = require('./analytics-core.js');

assert.equal(analytics.macroGroup('Продукты').label, 'Еда');
assert.equal(analytics.macroGroup('Бытовая химия').label, 'Дом и быт');
assert.equal(analytics.macroGroup('Несуществующая').label, 'Другое');
assert.match(analytics.macroColor('macro:tech'), /^#[0-9a-f]{6}$/i);

const rows = [
  { category: 'Дом', amount: '100.00' },
  { category: 'Бытовая химия', amount: '200.00' },
  { category: 'Продукты', amount: '500.00' },
  { category: 'Продукты', amount: '-50.00' },
  { category: 'Электроника', amount: '900.00' }
];
const previous = [
  { category: 'Дом', amount: '50.00' },
  { category: 'Продукты', amount: '400.00' }
];
const detailed = analytics.buildCategoryBreakdown(rows, previous, 'detail');
assert.equal(detailed.total, 1650);
assert.equal(detailed.entries.find((item) => item.category === 'Продукты').previousAmount, 400);

const macro = analytics.buildCategoryBreakdown(rows, previous, 'macro');
assert.equal(macro.total, 1650);
const home = macro.entries.find((item) => item.category === 'macro:home');
assert.equal(home.amount, 300);
assert.deepEqual(home.categories.sort(), ['Бытовая химия', 'Дом']);
assert.equal(home.previousAmount, 50);

console.log('analytics-core.test.js: ok');
