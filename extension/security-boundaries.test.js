const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const content = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');
const background = fs.readFileSync(path.join(__dirname, 'background.js'), 'utf8');
const app = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'));

assert.match(content, /const allowedFetchHosts = new Set\(\[/);
for (const host of ['ozon.ru', 'receipt.wb.ru', 'astro.wildberries.ru', 'market.yandex.ru', 'check.yandex.ru']) {
  assert.ok(content.includes(`'${host}'`), `${host} должен быть в явном списке`);
}
assert.match(content, /const maxTextResponseBytes = 10 \* 1024 \* 1024/);
assert.match(content, /const maxPdfResponseBytes = 25 \* 1024 \* 1024/);
assert.match(content, /const requestTimeoutMs = 25_000/);
assert.match(content, /if \(response\.ok\) return await responseBytes\(response, maxBytes\)/);
assert.match(content, /pdf\.numPages > 50/);
assert.match(background, /const allowedReceiptHosts = new Set\(\['receipt\.wb\.ru', 'check\.yandex\.ru'\]\)/);
assert.match(background, /const maxReceiptResponseBytes = 10 \* 1024 \* 1024/);
assert.match(background, /response\.status === 429 \|\| response\.status >= 500/);
assert.match(background, /if \(response\.ok\) return await limitedResponseText\(response\)/);
assert.equal(manifest.host_permissions, undefined);
assert.ok(manifest.permissions.includes('unlimitedStorage'));
assert.doesNotMatch(app, /contents\/extension\/category-rules\.json/);

console.log('security-boundaries.test.js: ok');
