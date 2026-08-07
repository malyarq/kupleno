'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repositoryUrl = 'https://github.com/malyarq/market-trat';

function parseTag(rawTag) {
  const match = /^v?(\d+\.\d+\.\d+)$/.exec(rawTag || '');
  if (!match) {
    throw new Error(`Expected a version tag like v0.15.4, got: ${rawTag || '<empty>'}`);
  }

  return { tag: `v${match[1]}`, version: match[1] };
}

function extractChangelogSection(changelog, version) {
  const lines = changelog.split(/\r?\n/);
  const start = lines.findIndex((line) => {
    const match = /^##\s+(\d+\.\d+\.\d+)(?:\s|$)/.exec(line);
    return match?.[1] === version;
  });
  if (start < 0) {
    throw new Error(`CHANGELOG.md has no section for ${version}`);
  }

  const next = lines.findIndex((line, index) => index > start && /^##\s+/.test(line));
  const body = lines.slice(start + 1, next < 0 ? lines.length : next).join('\n').trim();
  if (!body) {
    throw new Error(`CHANGELOG.md section ${version} is empty`);
  }

  return body;
}

function buildReleaseNotes(changelog, rawTag) {
  const { tag, version } = parseTag(rawTag);
  const changes = extractChangelogSection(changelog, version);
  const source = `${repositoryUrl}/blob/${tag}`;

  return [
    '## Что изменилось',
    '',
    changes,
    '',
    '## Установка и совместимость',
    '',
    '- Поддерживаются Chrome, Edge и Яндекс Браузер на Chromium 116+.',
    '- Перед обновлением сохраните backup в расширении. Данные остаются только в браузере.',
    `- Порядок установки и обновления: [README.md](${source}/README.md).`,
    `- Контракт данных и откат: [docs/DATA_AND_COMPATIBILITY.md](${source}/docs/DATA_AND_COMPATIBILITY.md).`,
    '',
    '## Что проверено',
    '',
    '- Выпуск собран из точного аннотированного тега, ZIP воспроизводим и запущен в чистом Chromium.',
    '- SHA-256, состав архива, версия, документация, тесты категорий и сценарии интерфейса проверены до публикации.',
    '- CI не имеет пользовательских сессий маркетплейсов. Текущая работа живых сборщиков подтверждается отдельно.',
    '',
    `Конфиденциальность: [PRIVACY.md](${source}/PRIVACY.md) · Помощь: [SUPPORT.md](${source}/SUPPORT.md)`,
    ''
  ].join('\n');
}

function main() {
  const [rawTag, outputPath] = process.argv.slice(2);
  if (!outputPath) {
    throw new Error('Usage: node scripts/release-notes.js vX.Y.Z output.md');
  }

  const root = path.join(__dirname, '..');
  const changelog = fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8');
  const notes = buildReleaseNotes(changelog, rawTag);
  fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true });
  fs.writeFileSync(outputPath, notes);
  console.log(`Release notes written to ${outputPath}`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { buildReleaseNotes, extractChangelogSection, parseTag };
