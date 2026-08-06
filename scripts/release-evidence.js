'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function archiveEntries(archive) {
  return execFileSync('unzip', ['-Z1', archive], { encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function validateEvidence(evidence, archive) {
  if (!evidence || evidence.schemaVersion !== 1) throw new Error('Unsupported release evidence schema.');
  if (!/^\d+\.\d+\.\d+$/.test(evidence.version)) throw new Error('Invalid evidence version.');
  if (!/^[0-9a-f]{40}$/.test(evidence.gitCommit)) throw new Error('Invalid evidence commit.');
  if (!/^[0-9a-f]{64}$/.test(evidence.sha256)) throw new Error('Invalid evidence SHA-256.');
  if (evidence.artifact !== path.basename(archive)) throw new Error('Evidence artifact name mismatch.');
  if (evidence.sha256 !== sha256(archive)) throw new Error('Evidence SHA-256 mismatch.');
  const entries = archiveEntries(archive);
  if (JSON.stringify(evidence.archiveEntries) !== JSON.stringify(entries)) {
    throw new Error('Evidence archive entries mismatch.');
  }
  if (!entries.includes('manifest.json') || !entries.includes('LICENSE') || !entries.includes('PRIVACY.md')) {
    throw new Error('Evidence archive is missing required files.');
  }
  return evidence;
}

function writeEvidence(output, archive, version, gitCommit, dirty, expectedTag, tagMatchesHead) {
  const evidence = {
    schemaVersion: 1,
    artifact: path.basename(archive),
    sha256: sha256(archive),
    version,
    gitCommit,
    gitDirty: dirty === 'true',
    expectedTag,
    tagMatchesHead: tagMatchesHead === 'true',
    archiveEntries: archiveEntries(archive)
  };
  validateEvidence(evidence, archive);
  fs.writeFileSync(output, `${JSON.stringify(evidence, null, 2)}\n`);
}

function main(argv) {
  const [mode, ...args] = argv;
  if (mode === 'write' && args.length === 7) {
    writeEvidence(...args);
    return;
  }
  if (mode === 'verify' && args.length === 2) {
    const [evidenceFile, archive] = args;
    validateEvidence(JSON.parse(fs.readFileSync(evidenceFile, 'utf8')), archive);
    process.stdout.write('release evidence: ok\n');
    return;
  }
  throw new Error('Usage: release-evidence.js write <evidence> <archive> <version> <commit> <dirty> <tag> <tagMatchesHead> | verify <evidence> <archive>');
}

if (require.main === module) main(process.argv.slice(2));

module.exports = { archiveEntries, sha256, validateEvidence, writeEvidence };
