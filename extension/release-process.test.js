'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

const requiredFiles = [
  '.nvmrc',
  '.github/ISSUE_TEMPLATE/config.yml',
  '.github/ISSUE_TEMPLATE/bug_report.yml',
  '.github/workflows/codeql.yml',
  '.github/workflows/verify-release.yml',
  '.github/workflows/release-candidate.yml',
  'package-lock.json',
  'CHANGELOG.md',
  'CONTRIBUTING.md',
  'MONETIZATION.md',
  'PRIVACY.md',
  'RELEASE.md',
  'SECURITY.md',
  'SUPPORT.md',
  'THIRD_PARTY_NOTICES.md',
  'docs/ARCHITECTURE.md',
  'docs/DATA_AND_COMPATIBILITY.md',
  'docs/MAINTENANCE.md',
  'docs/PRODUCT.md',
  'docs/TESTING.md',
  'assets/screenshots/analytics.png',
  'assets/screenshots/overview.png',
  'extension/analytics-core.js',
  'extension/analytics-utils.js',
  'extension/category-benchmark.json',
  'extension/fixtures/ozon-receipts.json',
  'extension/fixtures/wb-receipts.json',
  'extension/fixtures/yandex-receipts.json',
  'extension/report-quality.js',
  'extension/source-health.js',
  'scripts/browser-smoke.js',
  'scripts/category-benchmark.js',
  'scripts/check-doc-links.js',
  'scripts/performance-benchmark.js',
  'scripts/release-notes.js',
  'scripts/verify-packaged-extension.sh'
];

for (const relative of requiredFiles) {
  assert.equal(fs.existsSync(path.join(root, relative)), true, `${relative} must exist`);
}

const manifest = JSON.parse(read('extension/manifest.json'));
const packageJson = JSON.parse(read('package.json'));
assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
assert.equal(packageJson.version, manifest.version);
assert.match(read('CHANGELOG.md'), new RegExp(`^## ${manifest.version}\\b`, 'm'));
assert.ok(read('README.md').includes(`Текущий релиз: \`${manifest.version}\``));
assert.ok(read('extension/README.md').includes(`Версия: \`${manifest.version}\``));

for (const workflow of ['.github/workflows/verify-release.yml', '.github/workflows/release-candidate.yml']) {
  const source = read(workflow);
  const uses = [...source.matchAll(/^\s*uses:\s*([^\s#]+)/gm)].map((match) => match[1]);
  assert.ok(uses.length > 0, `${workflow} must use pinned actions`);
  for (const action of uses) {
    assert.match(action, /^[^@]+@[0-9a-f]{40}$/, `${action} must be pinned to a full commit SHA`);
  }
  assert.match(source, /npm ci/);
  assert.match(source, /playwright install --with-deps chromium/);
}

const candidateWorkflow = read('.github/workflows/release-candidate.yml');
assert.match(candidateWorkflow, /^name: Build and publish release/m);
assert.match(candidateWorkflow, /^permissions:\n\s+contents: read/m);
assert.match(candidateWorkflow, /publish:\n[\s\S]+?permissions:\n\s+actions: read\n\s+contents: write/);
assert.match(candidateWorkflow, /npm run verify:release/);
assert.match(candidateWorkflow, /workflow_dispatch:/);
assert.match(candidateWorkflow, /inputs\.tag \|\| github\.ref_name/);
assert.match(candidateWorkflow, /github\.event_name == 'push' \|\| github\.ref == 'refs\/heads\/main'/);
assert.match(candidateWorkflow, /ref: \$\{\{ inputs\.tag \|\| github\.ref \}\}/);
assert.match(candidateWorkflow, /gh release view/);
assert.match(candidateWorkflow, /gh release create/);
assert.match(candidateWorkflow, /gh release edit/);
assert.match(candidateWorkflow, /gh release delete/);
assert.match(candidateWorkflow, /gh run download/);
assert.match(candidateWorkflow, /--verify-tag/);
assert.match(candidateWorkflow, /--draft/);
assert.match(candidateWorkflow, /--latest/);
assert.match(candidateWorkflow, /cleanup_failed_draft/);
assert.match(candidateWorkflow, /refusing to replace immutable assets/);
for (const asset of ['markettrat-extension.zip', 'SHA256SUMS', 'provenance.txt', 'release-evidence.json']) {
  assert.ok(candidateWorkflow.includes(`dist/${asset}`), `${asset} must be published from dist/`);
}

const verifyWorkflow = read('.github/workflows/verify-release.yml');
assert.match(verifyWorkflow, /permissions:\n\s+contents: read/);
assert.match(verifyWorkflow, /push:\n\s+branches: \[main\]/);
assert.doesNotMatch(verifyWorkflow, /pull_request:|statuses:\s*write|MarketTrat verification/);
assert.doesNotMatch(verifyWorkflow, /contents:\s*write|gh release|softprops\/action-gh-release/i);

const codeqlWorkflow = read('.github/workflows/codeql.yml');
assert.match(codeqlWorkflow, /push:\n\s+branches: \[main\]/);
assert.match(codeqlWorkflow, /schedule:/);
assert.match(codeqlWorkflow, /workflow_dispatch:/);
assert.match(codeqlWorkflow, /security-events: write/);
assert.match(codeqlWorkflow, /languages: javascript-typescript/);
for (const action of [...codeqlWorkflow.matchAll(/^\s*uses:\s*([^\s#]+)/gm)].map((match) => match[1])) {
  assert.match(action, /^[^@]+@[0-9a-f]{40}$/, `${action} must be pinned to a full commit SHA`);
}

const candidateScript = read('scripts/verify-release-candidate.sh');
assert.match(candidateScript, /status --porcelain --untracked-files=all/);
assert.match(candidateScript, /cat-file -t/);
assert.match(candidateScript, /rev-parse "refs\/tags\/\$TAG\^\{commit\}"/);
assert.match(candidateScript, /npm --prefix "\$ROOT" run verify:reproducible/);

const releaseNotes = require('../scripts/release-notes.js');
assert.deepEqual(releaseNotes.parseTag('v1.2.3'), { tag: 'v1.2.3', version: '1.2.3' });
assert.throws(() => releaseNotes.parseTag('latest'), /Expected a version tag/);
assert.equal(
  releaseNotes.extractChangelogSection('# Changelog\n\n## 1.2.3\n\n- Fixed\n\n## 1.2.2\n\n- Old\n', '1.2.3'),
  '- Fixed'
);
const generatedNotes = releaseNotes.buildReleaseNotes(read('CHANGELOG.md'), `v${manifest.version}`);
assert.match(generatedNotes, new RegExp(`blob/v${manifest.version}/README\\.md`));
assert.match(generatedNotes, /CI не имеет пользовательских сессий маркетплейсов/);

const packageScript = read('scripts/package-extension.sh');
assert.match(packageScript, /Refusing ambiguous root archive/);
for (const required of ['LICENSE', 'PRIVACY.md', 'SECURITY.md', 'SUPPORT.md', 'THIRD_PARTY_NOTICES.md']) {
  assert.ok(packageScript.includes(required), `${required} must be included in the package`);
}

const verifyScript = read('scripts/verify.sh');
assert.match(verifyScript, /verify:categories/);
assert.match(verifyScript, /verify:performance/);
assert.match(verifyScript, /check-doc-links\.js/);
assert.match(verifyScript, /verify-packaged-extension\.sh/);
assert.doesNotMatch(verifyScript, /npm --prefix "\$ROOT" run verify:browser\s*\n\s*"\$ROOT\/scripts\/package-extension\.sh"/);

const packagedSmoke = read('scripts/verify-packaged-extension.sh');
assert.match(packagedSmoke, /unzip -q "\$ARCHIVE"/);
assert.match(packagedSmoke, /verify:browser -- "\$stage\/extension"/);

const thirdParty = read('THIRD_PARTY_NOTICES.md');
const vendoredCheck = read('scripts/check-vendored-dependencies.sh');
for (const hash of vendoredCheck.match(/[0-9a-f]{64}/g) || []) {
  assert.ok(thirdParty.includes(hash), `vendored hash ${hash} must be documented`);
}

assert.equal(
  fs.existsSync(path.join(root, 'markettrat-extension.zip')),
  false,
  'obsolete root archive must not exist; build only into dist/'
);

console.log('release-process.test.js: ok');
