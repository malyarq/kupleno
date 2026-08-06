'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.join(__dirname, 'app.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, 'app.css'), 'utf8');
const app = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');

test('первый запуск ведёт к одному понятному действию', () => {
  assert.match(html, /id="onboardingTitle">Первый отчёт — за три понятных шага/);
  assert.match(html, /id="onboardingStart"[^>]*>Собрать мои покупки</);
  assert.match(html, /id="collectHint"[^>]*>Сбор может занять несколько минут/);
  assert.match(app, /els\.onboardingStart\.addEventListener\('click',[\s\S]*?els\.collect\.click\(\)/);
});

test('пример не отключает обучение для следующего запуска', () => {
  const showDemoBody = app.match(/function showDemo\(\) \{([\s\S]*?)\n\}/)?.[1] || '';
  const completeBody = app.match(/function completeOnboarding\(\) \{([\s\S]*?)\n\}/)?.[1] || '';
  assert.match(showDemoBody, /hideOnboardingForSession\(\)/);
  assert.doesNotMatch(showDemoBody, /completeOnboarding\(\)|localStorage\.setItem/);
  assert.match(completeBody, /localStorage\.setItem\(onboardingStorageKey, '1'\)/);
});

test('главный экран выбирает следующий шаг', () => {
  for (const id of ['homeGuide', 'homeGuideTitle', 'homeGuidePrimary', 'homeNextStepList']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(app, /function homeGuideTasks\(/);
  assert.match(app, /function renderHomeGuide\(/);
  assert.match(app, /friendlyWarningText/);
});

test('сложность не конкурирует с основным сценарием', () => {
  const tabLabels = [...html.matchAll(/class="tab-button[^>]*>([^<]+)/g)].map((match) => match[1].trim());
  assert.deepEqual(tabLabels, ['Главное', 'Проверить', 'Советы', 'Настройки']);
  assert.doesNotMatch(tabLabels.join(' '), /Диагностика|Контроль|Аналитика/);
  assert.match(html, /<details class="analytics-filter-details">/);
  assert.match(html, /id="openDiagnostics"/);
  assert.match(css, /body:not\(\.has-data\) \.view-tabs/);
});

test('ошибка показывает понятное объяснение раньше технических сведений', () => {
  assert.match(html, /id="warningTitle">Не всё получилось/);
  assert.match(html, /id="warningText"/);
  assert.match(html, /id="warningDetails"[^>]*>Технические сведения/);
  assert.match(app, /Браузер не дал доступ к выбранным магазинам/);
  assert.match(app, /Один из магазинов не увидел вход в аккаунт/);
});

test('общий сброс снимает и фильтр профиля', () => {
  const resetBody = app.match(/function resetAnalyticsFilters\(\) \{([\s\S]*?)\n\}/)?.[1] || '';
  assert.match(resetBody, /appSettings\.activeProfile = 'all'/);
  assert.match(resetBody, /localStorage\.setItem\(activeProfileStorageKey, appSettings\.activeProfile\)/);
  assert.match(resetBody, /renderProfiles\(\)/);
});

test('мобильная таблица помещает важные колонки на ширине 390 px', () => {
  const mobile = css.match(/@media \(max-width: 760px\) \{([\s\S]*?)\n\}/)?.[1] || '';
  assert.match(mobile, /grid-template-columns: 52px 66px minmax\(60px, 1fr\) minmax\(68px, auto\) 26px/);
  assert.match(mobile, /\.detail-row\.header span:nth-child\(2\)[\s\S]*?\.detail-row \.category-pill[\s\S]*?display: none/);
});
