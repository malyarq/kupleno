'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

const requiredFiles = [
  '.nvmrc',
  '.github/CODEOWNERS',
  '.github/dependabot.yml',
  '.github/ISSUE_TEMPLATE/config.yml',
  '.github/ISSUE_TEMPLATE/bug_report.yml',
  '.github/ISSUE_TEMPLATE/feature_request.yml',
  '.github/PULL_REQUEST_TEMPLATE.md',
  '.github/workflows/verify-release.yml',
  '.github/workflows/release-candidate.yml',
  'CHANGELOG.md',
  'CONTRIBUTING.md',
  'PRIVACY.md',
  'RELEASE.md',
  'SECURITY.md',
  'SUPPORT.md',
  'THIRD_PARTY_NOTICES.md',
  'docs/ARCHITECTURE.md',
  'docs/DATA_AND_COMPATIBILITY.md',
  'docs/GITHUB_SETTINGS.md',
  'docs/MAINTENANCE.md',
  'docs/TESTING.md'
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
  assert.match(source, /permissions:\n\s+contents: read/);
}

const candidateWorkflow = read('.github/workflows/release-candidate.yml');
assert.match(candidateWorkflow, /npm run verify:release/);
assert.doesNotMatch(candidateWorkflow, /workflow_dispatch|inputs\.tag/);
assert.doesNotMatch(candidateWorkflow, /gh release|softprops\/action-gh-release|contents:\s*write/i);

const candidateScript = read('scripts/verify-release-candidate.sh');
assert.match(candidateScript, /status --porcelain --untracked-files=all/);
assert.match(candidateScript, /cat-file -t/);
assert.match(candidateScript, /rev-parse "refs\/tags\/\$TAG\^\{commit\}"/);
assert.match(candidateScript, /npm --prefix "\$ROOT" run verify:reproducible/);

const packageScript = read('scripts/package-extension.sh');
assert.match(packageScript, /Refusing ambiguous root archive/);
for (const required of ['LICENSE', 'PRIVACY.md', 'SECURITY.md', 'SUPPORT.md', 'THIRD_PARTY_NOTICES.md']) {
  assert.ok(packageScript.includes(required), `${required} must be included in the package`);
}

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
