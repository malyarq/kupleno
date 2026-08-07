'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.join(__dirname, 'app.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, 'app.css'), 'utf8');
const app = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');

test('первый запуск ведёт к одному понятному действию', () => {
  assert.match(html, /id="onboardingTitle">Посмотрите, куда уходят деньги на маркетплейсах/);
  assert.match(html, /id="onboardingStart"[^>]*disabled[^>]*>Собрать мои покупки</);
  assert.match(html, /id="onboardingUpload"[^>]*>Загрузить CSV</);
  assert.match(html, /id="collectHint"[^>]*>Сбор может занять несколько минут/);
  assert.match(app, /els\.onboardingStart\.addEventListener\('click',[\s\S]*?els\.collect\.click\(\)/);
  assert.ok(html.indexOf('class="sources"') < html.indexOf('id="onboardingStart"'), 'сначала выбор магазина, потом запуск');
  assert.match(css, /body\.first-run \.run-details \.toolbar[\s\S]*?display: none !important/);
});

test('пример изолирован и возвращает пользователя к своим данным', () => {
  const showDemoBody = app.match(/function showDemo\(\) \{([\s\S]*?)\n\}/)?.[1] || '';
  const completeBody = app.match(/function completeOnboarding\(\) \{([\s\S]*?)\n\}/)?.[1] || '';
  for (const id of ['demoBanner', 'demoStart', 'demoUpload', 'demoExit']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(showDemoBody, /demoRestoreState = captureAppState\(\)/);
  assert.match(showDemoBody, /setDemoUi\(true\)/);
  assert.match(showDemoBody, /hideOnboardingForSession\(\)/);
  assert.doesNotMatch(showDemoBody, /completeOnboarding\(\)|localStorage\.setItem/);
  assert.match(app, /function exitDemo\([\s\S]*?restoreCapturedState\(restoreState\)/);
  assert.match(app, /els\.onboardingPanel\.hidden = false/);
  assert.match(css, /body\.demo-mode \.view-tabs/);
  assert.match(completeBody, /localStorage\.setItem\(onboardingStorageKey, '1'\)/);
});

test('главный экран выбирает следующий шаг', () => {
  for (const id of ['homeGuide', 'homeGuideTitle', 'homeGuidePrimary', 'homeNextStepList']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(app, /function homeGuideTasks\(/);
  assert.match(app, /function renderHomeGuide\(/);
  assert.match(app, /tasks\.slice\(1, 2\)/);
  assert.match(html, /id="toggleAnalyticsDetails"[^>]*aria-expanded="false"/);
  assert.match(css, /\.secondary-analysis[\s\S]*?display: none !important/);
  assert.match(app, /friendlyWarningText/);
});

test('устаревшая категория подписок не предлагается новым пользователям', () => {
  assert.match(app, /!\['other', 'Подписки'\]\.includes\(category\)/);
  assert.match(app, /for \(const row of records\) names\.add\(row\.category \|\| 'unknown'\)/);
});

test('сложность не конкурирует с основным сценарием', () => {
  const tabLabels = [...html.matchAll(/class="tab-button[^>]*>([^<]+)/g)].map((match) => match[1].trim());
  assert.deepEqual(tabLabels, ['Главное', 'Категории', 'Советы', 'Настройки']);
  assert.doesNotMatch(tabLabels.join(' '), /Диагностика|Контроль|Аналитика/);
  assert.match(html, /<details class="analytics-filter-details">/);
  assert.match(html, /id="openDiagnostics"/);
  assert.match(css, /body:not\(\.has-data\) \.view-tabs/);
});

test('категории не превращаются в обязательную разметку истории', () => {
  const tasksBody = app.match(/function homeGuideTasks\([\s\S]*?\n\}/)?.[0] || '';
  assert.doesNotMatch(tasksBody, /quality\.reviewRows|Проверить .*покуп/);
  assert.match(html, /Отчёт уже готов — разбирать всю историю не нужно/);
  assert.match(app, /let categoryReviewShownCount = 5/);
  assert.match(app, /Остальное можно не разбирать/);
  assert.match(app, /els\.categoryReviewBadge\.hidden = true/);
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

test('магазины показывают понятное состояние до и после сбора', () => {
  for (const id of ['sourceOzonState', 'sourceWbState', 'sourceYandexState']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(app, /function renderSourceConnectionStates\(/);
  assert.match(app, /refreshSourcePermissionStates/);
  assert.match(css, /\.source-choice\[data-state="done"\]/);
});

test('главный экран честно отделяет полноту чеков от качества категорий', () => {
  assert.match(html, /id="reportTrustSources"/);
  assert.match(html, /id="openCollectionAudit"/);
  assert.match(app, /reportQuality\.auditCollection/);
  assert.match(app, /Полноту загруженной таблицы проверить нельзя/);
  assert.match(app, /учтено только общей суммой/);
});

test('крупные категории и деньги по возвратам видны без технических разделов', () => {
  assert.match(html, /id="categoryLevel"[\s\S]*?<option value="macro" selected>Крупно/);
  assert.match(html, /id="moneyRecovery"/);
  assert.match(app, /buildCategoryBreakdown\(records, previousRecords, els\.categoryLevel\.value\)/);
  assert.match(app, /function renderMoneyRecovery\(/);
});

test('клавиатура не попадает в скрытые разделы', () => {
  assert.match(html, /class="skip-link"/);
  assert.match(html, /role="tablist"/);
  assert.match(html, /role="tabpanel"[^>]*inert/);
  assert.match(app, /panel\.toggleAttribute\('inert', !active\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});
