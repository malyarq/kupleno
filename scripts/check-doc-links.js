'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const markdownFiles = [
  ...fs.readdirSync(root).filter((name) => name.endsWith('.md')).map((name) => path.join(root, name)),
  ...fs.readdirSync(path.join(root, 'docs')).filter((name) => name.endsWith('.md')).map((name) => path.join(root, 'docs', name)),
  path.join(root, 'extension', 'README.md')
];
const missing = [];

for (const file of markdownFiles) {
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/gu)) {
    const rawTarget = match[1].trim().replace(/^<|>$/gu, '');
    if (!rawTarget || /^(?:https?:|mailto:|#)/u.test(rawTarget)) continue;
    const target = decodeURIComponent(rawTarget.split('#')[0]);
    const resolved = path.resolve(path.dirname(file), target);
    if (!fs.existsSync(resolved)) missing.push(`${path.relative(root, file)} → ${rawTarget}`);
  }
}

assert.deepEqual(missing, [], `битые локальные ссылки:\n${missing.join('\n')}`);
console.log(`documentation links: ok (${markdownFiles.length} файлов)`);
