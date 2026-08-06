const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'));
const html = fs.readFileSync(path.join(__dirname, 'app.html'), 'utf8');
const background = fs.readFileSync(path.join(__dirname, 'background.js'), 'utf8');
const rootReadme = fs.readFileSync(path.join(__dirname, '..', 'README.md'), 'utf8');
const extensionReadme = fs.readFileSync(path.join(__dirname, 'README.md'), 'utf8');
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const changelog = fs.readFileSync(path.join(__dirname, '..', 'CHANGELOG.md'), 'utf8');

assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
assert.equal(packageJson.version, manifest.version);
assert.match(changelog, new RegExp(`^## ${manifest.version}\\b`, 'm'));
assert.equal(rootReadme.includes(`Текущий релиз: \`${manifest.version}\``), true);
assert.equal(extensionReadme.includes(`Версия: \`${manifest.version}\``), true);
assert.deepEqual(manifest.permissions, ['scripting', 'storage', 'unlimitedStorage']);
assert.deepEqual(manifest.optional_permissions, ['cookies']);
assert.equal(manifest.host_permissions, undefined);
assert.equal(manifest.minimum_chrome_version, '116');
assert.deepEqual(manifest.content_security_policy, {
  extension_pages: "script-src 'self'; object-src 'self'"
});
assert.ok(!manifest.permissions.includes('cookies'));
assert.ok(!manifest.permissions.includes('activeTab'));
assert.ok(!manifest.permissions.includes('tabs'));
assert.ok(manifest.optional_permissions.includes('cookies'));

assert.deepEqual(manifest.optional_host_permissions, [
  'https://www.ozon.ru/*',
  'https://ozon.ru/*',
  'https://www.wildberries.ru/*',
  'https://wildberries.ru/*',
  'https://astro.wildberries.ru/*',
  'https://receipt.wb.ru/*',
  'https://market.yandex.ru/*',
  'https://check.yandex.ru/*'
]);
assert.equal(manifest.content_scripts, undefined);
assert.match(background, /runtime\.getContexts/);
assert.match(background, /importScripts\('collect-job-store\.js'\)/);
assert.match(background, /importScripts\('collect-result-store\.js'\)/);
assert.match(background, /message\.name !== 'wbid-sdk-id-token'/);
assert.match(background, /sender\?\.id === api\.runtime\.id/);
assert.match(background, /sender\?\.url === api\.runtime\.getURL\('app\.html'\)/);
assert.match(background, /collectJobStorePromise/);
assert.match(background, /message\?\.type === 'SPEND_CLEAR_COLLECT_JOBS'/);
assert.match(background, /message\?\.type === 'SPEND_COLLECT_ACK'/);
assert.match(background, /async function acknowledgeCollectJob/);
assert.match(background, /generation !== collectJobGeneration/);
assert.match(background, /async function startCollectJob/);
assert.match(background, /await persistCollectJob\(jobId, job\)/);
assert.equal(manifest.background.type, undefined);
assert.deepEqual(manifest.icons, {
  16: 'icons/icon-16.png',
  32: 'icons/icon-32.png',
  48: 'icons/icon-48.png',
  128: 'icons/icon-128.png'
});
for (const [size, file] of Object.entries(manifest.icons)) {
  const png = fs.readFileSync(path.join(__dirname, file));
  assert.equal(png.subarray(1, 4).toString('ascii'), 'PNG');
  assert.equal(png.readUInt32BE(16), Number(size));
  assert.equal(png.readUInt32BE(20), Number(size));
}

const scripts = ['categories.js', 'csv.js', 'update.js', 'preferences.js', 'intelligence.js', 'lifecycle.js', 'storage.js', 'privacy.js', 'app.js'];
const scriptOrder = scripts
  .map((script) => html.indexOf(`src="${script}"`));
assert.ok(scriptOrder.every((index) => index >= 0));
assert.deepEqual(scriptOrder, [...scriptOrder].sort((left, right) => left - right));

for (const file of [
  manifest.background.service_worker,
  'collect-job-store.js',
  'collect-result-store.js',
  ...Object.values(manifest.icons),
  ...Object.values(manifest.action.default_icon),
  'app.html',
  'app.css',
  ...scripts,
  ...manifest.web_accessible_resources.flatMap((entry) => entry.resources)
]) {
  assert.equal(fs.existsSync(path.join(__dirname, file)), true, `${file} must exist`);
}

console.log('manifest.test.js: ok');
