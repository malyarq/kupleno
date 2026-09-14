'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
const start = source.indexOf('function syncAnalyticsFilterDisclosure()');
const end = source.indexOf('function detailFilterName()');
assert.ok(start >= 0 && end > start, 'нужны функции управления панелью фильтров');

const attributes = new Map();
let focusCalls = 0;
const panel = {
  toggleAttribute(name, value) {
    attributes.set(name, Boolean(value));
  },
  setAttribute(name, value) {
    attributes.set(name, String(value));
  }
};
const details = { open: false };
const toggle = {
  setAttribute(name, value) {
    attributes.set(name, String(value));
  },
  focus() {
    focusCalls += 1;
  }
};
const context = { globalThis: null, els: { analyticsFilterDetails: details, analyticsFilterToggle: toggle, analyticsFilterPanel: panel } };
context.globalThis = context;
vm.createContext(context);
vm.runInContext(`const els = globalThis.els;\n${source.slice(start, end)}\nglobalThis.sync = syncAnalyticsFilterDisclosure; globalThis.close = closeAnalyticsFilterDisclosure;`, context);

context.sync();
assert.equal(attributes.get('aria-expanded'), 'false');
assert.equal(attributes.get('aria-hidden'), 'true');
assert.equal(attributes.get('inert'), true);

details.open = true;
context.sync();
assert.equal(attributes.get('aria-expanded'), 'true');
assert.equal(attributes.get('aria-hidden'), 'false');
assert.equal(attributes.get('inert'), false);

context.close({ restoreFocus: true });
assert.equal(details.open, false);
assert.equal(focusCalls, 1);
assert.match(source, /document\.addEventListener\?\.\('pointerdown'/);
assert.match(source, /event\.key !== 'Escape'/);

console.log('analytics-filter-disclosure.test.js: ok');
