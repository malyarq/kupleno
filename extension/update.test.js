const assert = require('node:assert/strict');
const {
  compareVersions,
  isNewerVersion,
  normalizeVersion,
  shouldCheckForUpdate,
  updateCheckIntervalMs,
  updateHelpUrl
} = require('./update.js');

assert.equal(normalizeVersion('v0.6.1'), '0.6.1');
assert.equal(compareVersions('0.10.0', '0.9.9') > 0, true);
assert.equal(compareVersions('0.6.0', '0.6'), 0);
assert.equal(isNewerVersion('0.6.1', '0.6.0'), true);
assert.equal(isNewerVersion('0.6.0', '0.6.0'), false);
assert.equal(shouldCheckForUpdate(null, 1000), true);
assert.equal(shouldCheckForUpdate(1000, 1000 + updateCheckIntervalMs - 1), false);
assert.equal(shouldCheckForUpdate(1000, 1000 + updateCheckIntervalMs), true);
assert.equal(shouldCheckForUpdate(2000, 1000), true, 'сломанные часы не должны навсегда отключать проверку');
assert.ok(updateHelpUrl.includes('kupleno#'));
