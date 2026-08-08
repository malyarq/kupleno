'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.join(__dirname, '..');
const extensionDir = path.resolve(process.argv[2] || path.join(root, 'extension'));
const manifestPath = path.join(extensionDir, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const outputDir = path.join(root, 'dist', 'browser-smoke');

assert.equal(fs.existsSync(manifestPath), true, `не найден manifest.json: ${manifestPath}`);
fs.mkdirSync(outputDir, { recursive: true });

function withinViewport(box, viewport) {
  return box
    && box.x >= -1
    && box.y >= -1
    && box.x + box.width <= viewport.width + 1;
}

function csvFile(rows, name = 'kupleno-smoke.csv') {
  const headers = ['date', 'marketplace', 'title', 'amount', 'currency', 'category', 'type', 'marketplace_id', 'item_index', 'profile', 'note', 'excluded'];
  const quote = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  return {
    name,
    mimeType: 'text/csv',
    buffer: Buffer.from([
      headers.join(','),
      ...rows.map((row) => headers.map((header) => quote(row[header])).join(','))
    ].join('\n'), 'utf8')
  };
}

const smallImport = csvFile([
  { date: '2026-06-01', marketplace: 'ozon', title: 'Кофе зерновой', amount: '490.00', currency: 'RUB', category: 'Продукты', type: 'purchase', marketplace_id: 'smoke-1', item_index: '1', profile: 'personal', note: '', excluded: 'false' },
  { date: '2026-06-02', marketplace: 'wildberries', title: 'Кроссовки', amount: '3990.00', currency: 'RUB', category: 'Обувь', type: 'purchase', marketplace_id: 'smoke-2', item_index: '1', profile: 'personal', note: '', excluded: 'false' },
  { date: '2026-06-03', marketplace: 'yandex', title: 'Наушники', amount: '6290.00', currency: 'RUB', category: 'Электроника', type: 'purchase', marketplace_id: 'smoke-3', item_index: '1', profile: 'personal', note: '', excluded: 'false' }
]);

function performanceImport(size = 10_000) {
  const sources = ['ozon', 'wildberries', 'yandex'];
  const categories = ['Продукты', 'Дом', 'Одежда', 'Электроника', 'Здоровье', 'Спорт'];
  return csvFile(Array.from({ length: size }, (_, index) => ({
    date: `2025-${String(index % 12 + 1).padStart(2, '0')}-${String(index % 27 + 1).padStart(2, '0')}`,
    marketplace: sources[index % sources.length],
    title: `Тестовая покупка ${index}`,
    amount: index % 29 === 0 ? '-99.00' : `${100 + index % 5000}.00`,
    currency: 'RUB',
    category: categories[index % categories.length],
    type: index % 29 === 0 ? 'refund' : 'purchase',
    marketplace_id: `performance-${index}`,
    item_index: '1',
    profile: 'personal',
    note: '',
    excluded: 'false'
  })), 'kupleno-performance.csv');
}

async function openDetails(page, selector) {
  const details = page.locator(selector);
  if (!await details.evaluate((node) => node.open)) {
    await details.locator(':scope > summary').click();
  }
  return details;
}

async function main() {
  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kupleno-browser-'));
  let context;
  const browserErrors = [];
  const externalRequests = [];
  try {
    context = await chromium.launchPersistentContext(profileDir, {
      channel: 'chromium',
      headless: true,
      viewport: { width: 1280, height: 720 },
      args: [
        `--disable-extensions-except=${extensionDir}`,
        `--load-extension=${extensionDir}`
      ]
    });
    context.on('request', (request) => {
      const url = request.url();
      if (/^https?:/u.test(url)) externalRequests.push(url);
    });
    await context.route('https://api.github.com/repos/malyarq/kupleno/releases/latest', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ tag_name: `v${manifest.version}` })
    }));

    let worker = context.serviceWorkers()[0];
    if (!worker) worker = await context.waitForEvent('serviceworker', { timeout: 15_000 });
    const extensionId = new URL(worker.url()).host;
    assert.match(extensionId, /^[a-p]{32}$/);

    const page = await context.newPage();
    page.on('pageerror', (error) => browserErrors.push(`pageerror: ${error.message}`));
    page.on('console', (message) => {
      if (message.type() === 'error') browserErrors.push(`console: ${message.text()}`);
    });

    await page.goto(`chrome-extension://${extensionId}/app.html`);
    await page.locator('#onboardingPanel').waitFor({ state: 'visible' });
    assert.equal(await page.title(), 'Куплено');
    assert.equal(await page.locator('#onboardingTitle').textContent(), 'Все покупки — в одной понятной картине');
    assert.equal(await page.locator('#onboardingStart').isDisabled(), true);
    assert.equal(await page.locator('#collect').isVisible(), false, 'верхняя кнопка не должна дублировать первый запуск');
    assert.equal(await page.locator('.run-details .status').isVisible(), false, 'пустой прогресс не должен отвлекать');
    assert.equal(await page.locator('.run-details .toolbar').isVisible(), false, 'импорт не должен конкурировать с первым действием');
    assert.equal(await page.locator('.view-tabs').isVisible(), false, 'пустые разделы не должны показываться до данных');

    const categoryChecks = await page.evaluate(() => [
      ['Ключ активации Windows 11 Pro', 'Цифровые покупки'],
      ['Крем сливочный для торта', 'Продукты'],
      ['Чехол для электронной книги', 'Аксессуары'],
      ['Крем универсальный', 'unknown']
    ].map(([title, expected]) => ({ title, expected, actual: globalThis.classifySpendCategory(title).category })));
    assert.deepEqual(categoryChecks.map(({ actual }) => actual), categoryChecks.map(({ expected }) => expected));

    for (const selector of ['#sourceOzon', '#sourceWb', '#sourceYandex']) {
      assert.equal(await page.locator(selector).isChecked(), false, `${selector} не должен запрашивать доступ без выбора`);
    }

    await page.locator('#sourceOzon').check();
    assert.equal(await page.locator('#onboardingStart').isEnabled(), true);
    const sourcesBox = await page.locator('.sources').boundingBox();
    const startBox = await page.locator('#onboardingStart').boundingBox();
    assert.ok(sourcesBox && startBox && startBox.y > sourcesBox.y, 'главная кнопка должна идти после выбора магазинов');
    await page.screenshot({ path: path.join(outputDir, 'first-run-desktop.png'), fullPage: true });

    await page.setViewportSize({ width: 390, height: 844 });
    const onboardingWidth = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth
    }));
    assert.ok(onboardingWidth.document <= onboardingWidth.viewport, `первый экран переполнен: ${JSON.stringify(onboardingWidth)}`);
    const mobileStartBox = await page.locator('#onboardingStart').boundingBox();
    assert.ok(
      mobileStartBox && mobileStartBox.y >= 0 && mobileStartBox.y + mobileStartBox.height <= 844,
      `главное действие первого запуска должно помещаться на первом экране: ${JSON.stringify(mobileStartBox)}`
    );
    await page.screenshot({ path: path.join(outputDir, 'first-run-mobile.png'), fullPage: true });
    await page.setViewportSize({ width: 195, height: 844 });
    const zoomedOnboardingWidth = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
      overflowing: [...document.querySelectorAll('body *')]
        .map((node) => {
          const box = node.getBoundingClientRect();
          const textBoxes = [...node.childNodes]
            .filter((child) => child.nodeType === Node.TEXT_NODE && child.textContent.trim())
            .map((child) => {
              const range = document.createRange();
              range.selectNodeContents(child);
              return range.getBoundingClientRect();
            });
          return {
            name: node.id || node.className || node.tagName,
            left: box.left,
            right: box.right,
            client: node.clientWidth,
            scroll: node.scrollWidth,
            textLeft: Math.min(...textBoxes.map((textBox) => textBox.left), box.left),
            textRight: Math.max(...textBoxes.map((textBox) => textBox.right), box.right)
          };
        })
        .filter((node) => node.left < -1
          || node.right > window.innerWidth + 1
          || node.textLeft < -1
          || node.textRight > window.innerWidth + 1)
        .slice(0, 3)
    }));
    assert.equal(zoomedOnboardingWidth.overflowing.length, 0, `первый запуск при 200% переполнен: ${JSON.stringify(zoomedOnboardingWidth)}`);
    await page.setViewportSize({ width: 1280, height: 720 });

    await page.locator('#onboardingDemo').click();
    await page.locator('#demoBanner').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#onboardingPanel').isVisible(), false);
    assert.equal(await page.locator('#demoBanner').isVisible(), true, 'пример должен быть явно помечен');
    assert.equal(await page.locator('#homeGuide').isVisible(), false, 'пример не должен повторять одно объяснение несколькими карточками');
    assert.equal(await page.locator('#reportTrust').isVisible(), false, 'примеру не нужен отдельный паспорт качества');
    assert.equal(await page.locator('#downloadCsv').isDisabled(), true, 'пример нельзя выгрузить как реальные данные');
    assert.notEqual(await page.evaluate(() => document.activeElement?.id), 'skipLink', 'мышь не должна неожиданно показывать клавиатурную ссылку');
    assert.match(await page.locator('#demoBannerTitle').textContent(), /нет ваших покупок/u);
    assert.equal(await page.locator('.view-tabs').isVisible(), false, 'пример не должен вести в настройки и ручные правки');
    assert.equal(await page.locator('#activeFilters').isVisible(), false, 'настройки по умолчанию не должны занимать строку');
    assert.ok(await page.locator('#analyticsTotal').textContent());
    assert.equal(await page.locator('#categoryBreakdown').isVisible(), true, 'категории должны оставаться на главном экране');
    assert.equal(await page.locator('#topItems').isVisible(), true, 'крупные траты должны оставаться на главном экране');
    assert.equal(await page.locator('#periodChart').isVisible(), true, 'динамика расходов должна быть видна сразу');
    assert.equal(await page.locator('#analyticsDetails').isVisible(), false, 'пример не должен показывать необязательные настройки и таблицу');
    assert.equal(await page.locator('.detail-panel').isVisible(), false, 'таблица операций не должна перегружать главный экран');
    assert.equal(await page.locator('#topItems .top-item').count(), 3, 'одинаковые товары в примере не должны дробиться из-за служебной пометки');
    await page.screenshot({ path: path.join(outputDir, 'example-desktop.png'), fullPage: true });
    await page.locator('#themeToggle').click();
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark', 'тёмная тема должна включаться без перезагрузки');
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(outputDir, 'example-dark-desktop.png'), fullPage: true });
    await page.locator('#themeToggle').click();
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'light', 'светлая тема должна восстанавливаться');
    await page.waitForTimeout(250);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('#analyticsView').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector('#periodChart')?.getAttribute('viewBox') === '0 0 420 260');
    const skipLinkState = await page.evaluate(() => {
      const link = document.querySelector('#skipLink');
      const rect = link.getBoundingClientRect();
      return { active: document.activeElement?.id, width: rect.width, height: rect.height, clipPath: getComputedStyle(link).clipPath };
    });
    assert.ok(skipLinkState.width <= 1 && skipLinkState.height <= 1 && skipLinkState.clipPath !== 'none', `клавиатурная ссылка видна без фокуса: ${JSON.stringify(skipLinkState)}`);
    const pageWidth = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth
    }));
    assert.ok(pageWidth.document <= pageWidth.viewport, `горизонтальное переполнение: ${JSON.stringify(pageWidth)}`);
    for (const selector of ['#demoBanner', '.analytics-kpis']) {
      const box = await page.locator(selector).boundingBox();
      assert.ok(box && box.x >= -1 && box.x + box.width <= 391, `${selector} выходит за ширину экрана: ${JSON.stringify(box)}`);
    }
    const mobileChartBox = await page.locator('#periodChart').boundingBox();
    assert.ok(mobileChartBox && mobileChartBox.height >= 180 && mobileChartBox.height <= 230, `график на мобильном должен быть читаемым без пустой высоты: ${JSON.stringify(mobileChartBox)}`);
    await page.screenshot({ path: path.join(outputDir, 'example-mobile.png'), fullPage: true });

    await page.locator('#demoExit').click();
    await page.locator('#onboardingPanel').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#demoBanner').isVisible(), false);
    assert.match(await page.locator('#downloadCsv').textContent(), /\(0\)/u, 'выход из примера должен вернуть пустую реальную базу');
    assert.equal(await page.evaluate(() => localStorage.getItem('kupleno-onboarding-v2')), null, 'пример не должен завершать первый запуск');

    await page.reload();
    await page.locator('#onboardingPanel').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#sourceOzon').isChecked(), true, 'выбор магазина должен переживать перезапуск');
    assert.equal(await page.locator('#onboardingStart').isEnabled(), true);

    await page.locator('#uploadCsvInput').setInputFiles(smallImport);
    await page.waitForFunction(() => document.querySelector('#downloadCsv')?.textContent?.includes('(3)'));
    await page.locator('#onboardingPanel').waitFor({ state: 'hidden' });
    assert.equal(await page.locator('#onboardingPanel').isVisible(), false, 'импорт должен завершать первый запуск');
    assert.equal(await page.locator('#categoryLevel').inputValue(), 'macro');
    const macroCategories = await page.locator('#categoryBreakdown').textContent();
    assert.match(macroCategories, /Еда/u);
    assert.match(macroCategories, /Одежда и стиль/u);
    assert.match(macroCategories, /Техника/u);
    await page.locator('#categoryLevel').selectOption('detail');
    const detailedCategories = await page.locator('#categoryBreakdown').textContent();
    assert.match(detailedCategories, /Продукты/u);
    assert.match(detailedCategories, /Обувь/u);
    assert.match(detailedCategories, /Электроника/u);
    await page.locator('#categoryLevel').selectOption('macro');
    assert.equal(await page.locator('#periodChart').isVisible(), true, 'динамика должна быть видна без отдельной кнопки');
    assert.equal(await page.locator('#analyticsDetails').getAttribute('open'), null, 'операции и дополнительные данные должны быть свёрнуты');
    const chartBox = await page.locator('.spend-dynamics-panel').boundingBox();
    const extrasBox = await page.locator('#analyticsDetails').boundingBox();
    assert.ok(chartBox && extrasBox && chartBox.y < extrasBox.y, 'сначала должен идти основной график, затем дополнительные данные');
    const kpisBox = await page.locator('.analytics-kpis').boundingBox();
    assert.ok(chartBox && kpisBox && kpisBox.y < chartBox.y, 'сначала должны идти итоговые цифры, затем график');

    await page.evaluate(() => {
      const synthetic = Array.from({ length: 1000 }, (_, index) => ({
        date: `2026-01-${String(index % 28 + 1).padStart(2, '0')}`,
        source: ['ozon', 'wildberries', 'yandex'][index % 3],
        title: `Неизвестный предмет ${String(index + 1).padStart(4, '0')}`,
        amount: `${100 + index}.00`,
        currency: 'RUB',
        category: 'unknown',
        category_suggestion: 'other',
        category_confidence: 0.2,
        category_needs_review: true,
        type: 'purchase',
        marketplace_id: `mass-review-${index}`,
        item_index: '0'
      }));
      withAutomaticPersistenceSuppressed(() => updateResult(synthetic, {}));
    });
    await page.locator('[data-view="categories"]').click();
    assert.equal(await page.locator('#categoryReviewBadge').isVisible(), false, 'вкладка не должна пугать размером очереди');
    assert.equal(await page.locator('#categoryReviewList .category-review-item').count(), 5, 'по умолчанию нужны только пять заметных групп');
    assert.equal(await page.locator('#categoryReviewList .compact-check input').first().isChecked(), false, 'запоминание для похожих не должно быть включено заранее');
    await page.locator('#categoryReviewList select').first().selectOption({ index: 1 });
    await page.locator('#categoryReviewList .compact-check').first().click();
    assert.match(await page.locator('#categoryReviewList .category-review-scope').first().textContent(), /Правило применится|совпадений нет/u, 'до сохранения должен быть показан охват правила');
    assert.match(await page.locator('#categoryReviewSummary').textContent(), /Остальное можно не разбирать/u);
    assert.doesNotMatch(await page.locator('#categoryQualityKpis').textContent(), /1000/u, 'раздел не должен предлагать разметить всю историю');
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.screenshot({ path: path.join(outputDir, 'categories-optional-desktop.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    const categoryPageWidth = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
    assert.ok(categoryPageWidth.document <= categoryPageWidth.viewport, `категории переполнены: ${JSON.stringify(categoryPageWidth)}`);
    await page.screenshot({ path: path.join(outputDir, 'categories-optional-mobile.png'), fullPage: true });
    await page.setViewportSize({ width: 1280, height: 720 });
    assert.doesNotMatch(await page.locator('#homeGuide').textContent(), /Проверить\s+\d+\s+покуп/u, 'категории не должны становиться главным заданием');
    await page.reload();
    await page.waitForFunction(() => document.querySelector('#downloadCsv')?.textContent?.includes('(3)'));

    // Advanced local features: each check goes through the visible UI and keeps
    // its assertion to the user-visible outcome, not the implementation state.
    await page.locator('[data-view="data"]').click();
    await openDetails(page, '#dataView details:has(#profilesTitle)');
    await page.locator('#dataProfileName').fill('Семейный');
    await page.locator('#addDataProfile').click();
    await page.waitForFunction(() => [...(document.querySelector('#dataProfileSelect')?.options || [])]
      .some((option) => option.textContent === 'Семейный'));
    assert.equal(await page.locator('#dataProfileSelect').inputValue(), await page.locator('#dataProfileSelect option', { hasText: 'Семейный' }).getAttribute('value'));
    page.once('dialog', (dialog) => dialog.accept());
    await page.locator('#deleteDataProfile').click();
    await page.waitForFunction(() => ![...(document.querySelector('#dataProfileSelect')?.options || [])]
      .some((option) => option.textContent === 'Семейный'));

    await page.locator('[data-view="analytics"]').click();
    await openDetails(page, '#analyticsDetails');
    await openDetails(page, '#budgetCard');
    await page.locator('#budgetMonth').fill('2026-06');
    await page.locator('#budgetMonth').press('Tab');
    await page.locator('#overallBudgetAmount').fill('12000');
    await page.locator('#saveOverallBudget').click();
    await page.waitForFunction(() => /Потрачено[\s\S]*12[\s\u00a0]000/u.test(document.querySelector('#budgetForecastStatus')?.textContent || ''));
    await page.locator('#budgetCategory').selectOption({ index: 1 });
    await page.locator('#budgetAmount').fill('1000');
    await page.locator('#saveBudget').click();
    await page.waitForFunction(() => !document.querySelector('#budgetBreakdown')?.textContent?.includes('Добавьте лимит'));

    await page.locator('[data-view="data"]').click();
    await openDetails(page, '#dataView details:has(#categoryRulesTitle)');
    await page.locator('#categoryRulePattern').fill('Кофе');
    await page.waitForFunction(() => document.querySelector('#categoryRulePreview')?.textContent?.includes('Правило затронет 1 операцию'));
    await page.locator('#categoryRuleCategory').selectOption({ index: 1 });
    await page.locator('#categoryRuleForm').evaluate((form) => form.requestSubmit());
    await page.waitForFunction(() => document.querySelector('#categoryRuleList')?.textContent?.includes('«Кофе»'));
    assert.match(await page.locator('#categoryRuleList').textContent(), /1\s+совпадение/u);

    await page.locator('[data-view="analytics"]').click();
    await openDetails(page, '#analyticsDetails');
    await page.getByRole('button', { name: /Изменить операцию Кофе зерновой/u }).click();
    await page.locator('#operationEditor').waitFor({ state: 'visible' });
    await page.locator('#markWarranty').check();
    await page.locator('#operationWarrantyUntil').fill('2027-06-01');
    await page.locator('#operationDocumentUrl').fill('https://example.test/warranty');
    await page.locator('#operationWarrantyNote').fill('Срок проверен');
    await page.locator('#operationSave').click();
    await page.locator('#operationEditor').waitFor({ state: 'hidden' });
    await page.locator('[data-view="control"]').click();
    await openDetails(page, '#controlView details:has(#warrantyTitle)');
    await page.waitForFunction(() => document.querySelector('#warrantyList')?.textContent?.includes('Кофе зерновой'));
    assert.match(await page.locator('#warrantyList').textContent(), /действует/u);

    await openDetails(page, '#controlView details:has(#monthCloseTitle)');
    await page.locator('#closeMonth').fill('2026-06');
    await page.locator('#closeMonth').press('Tab');
    await page.locator('#monthCloseAction').click();
    await page.waitForFunction(() => document.querySelector('#monthCloseAction')?.textContent !== 'Сохранить итог');
    if (/Сохранить с замечаниями/u.test(await page.locator('#monthCloseAction').textContent())) {
      await page.locator('#monthCloseAction').click();
    }
    const monthCloseStatus = await page.locator('#monthCloseStatus').textContent();
    assert.match(monthCloseStatus || '', /Итог месяца сохранён/u, `месяц не закрылся: ${monthCloseStatus}`);

    await page.locator('[data-view="analytics"]').click();
    await openDetails(page, '#analyticsDetails');
    const rowSelectors = page.getByRole('checkbox', { name: /^Выбрать операцию /u });
    assert.ok(await rowSelectors.count() >= 2, 'для массовой правки нужны как минимум две операции');
    await rowSelectors.nth(0).check();
    await rowSelectors.nth(1).check();
    await page.locator('#bulkBar').waitFor({ state: 'visible' });
    assert.match(await page.locator('#bulkCount').textContent(), /2/u);
    await page.locator('#bulkCategory').selectOption({ index: 1 });
    await page.locator('#bulkApply').click();
    await page.locator('#bulkBar').waitFor({ state: 'hidden' });
    assert.match(await page.locator('#statusText').textContent(), /Массово изменено/u);
    await page.locator('[data-view="data"]').click();
    await openDetails(page, '#dataView details:has(#overridesTitle)');
    assert.match(await page.locator('#operationOverridesSummary').textContent(), /2\s+правки/u);

    await openDetails(page, '#dataView details:has(#historyTitle)');
    await page.waitForFunction(() => [...document.querySelectorAll('#dataHistoryList .data-list-item')]
      .some((item) => item.textContent?.includes('Добавлен профиль')));
    const profileSnapshot = page.locator('#dataHistoryList .data-list-item').filter({ hasText: 'Добавлен профиль' }).first();
    await profileSnapshot.getByRole('button', { name: /Восстановить/u }).click();
    await page.waitForFunction(() => [...(document.querySelector('#dataProfileSelect')?.options || [])]
      .some((option) => option.textContent === 'Семейный'));
    assert.equal(await page.locator('#dataProfileSelect option', { hasText: 'Семейный' }).count(), 1, 'восстановление отдельного снимка должно вернуть профиль из снимка');

    await page.evaluate(() => {
      const originalPut = IDBObjectStore.prototype.put;
      let injected = false;
      globalThis.__kuplenoRestorePut = () => {
        IDBObjectStore.prototype.put = originalPut;
        delete globalThis.__kuplenoRestorePut;
      };
      IDBObjectStore.prototype.put = function failNextSnapshotPut(...args) {
        if (!injected && this.name === 'snapshots') {
          injected = true;
          throw new DOMException('injected save failure', 'QuotaExceededError');
        }
        return originalPut.apply(this, args);
      };
    });
    await page.locator('#dataProfileName').fill('Несохранённый');
    await page.locator('#addDataProfile').click();
    await page.waitForFunction(() => document.querySelector('#statusText')?.textContent?.includes('Не удалось сохранить'));
    assert.equal(
      await page.locator('#dataProfileSelect option', { hasText: 'Несохранённый' }).count(),
      0,
      'при сбое IndexedDB интерфейс должен откатить несохранённое изменение'
    );
    await page.evaluate(() => globalThis.__kuplenoRestorePut?.());

    await page.locator('[data-view="analytics"]').click();
    await openDetails(page, '#analyticsDetails');
    await page.locator('.detail-panel').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#analyticsDetails').getAttribute('open'), '', 'нижние данные должны раскрываться одним понятным блоком');
    await page.screenshot({ path: path.join(outputDir, 'analytics-more-desktop.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(() => document.querySelector('#periodChart')?.getAttribute('viewBox') === '0 0 420 260');
    const expandedPageWidth = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
    assert.ok(expandedPageWidth.document <= expandedPageWidth.viewport, `раскрытый отчёт переполнен: ${JSON.stringify(expandedPageWidth)}`);
    await page.screenshot({ path: path.join(outputDir, 'analytics-more-mobile.png'), fullPage: true });
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.getByRole('button', { name: /Изменить операцию Кофе зерновой/u }).click();
    await page.locator('#operationEditor').waitFor({ state: 'visible' });
    await page.locator('#markRefundClaim').check();
    await page.locator('#operationSave').click();
    await page.locator('#moneyRecovery').waitFor({ state: 'visible' });
    assert.match(await page.locator('#moneyRecoveryTitle').textContent(), /490/u);
    await page.locator('[data-view="categories"]').click();
    assert.match(await page.locator('#categoryQualityKpis').textContent(), /0\s*ваших правил и решений/u, 'возврат не должен считаться ручной категорией');
    await page.locator('[data-view="analytics"]').click();

    const interruptedJobId = 'smoke-interrupted';
    await worker.evaluate(async ({ jobId }) => {
      await chrome.storage.session.set({
        [`kupleno-collect-job-v1:${jobId}`]: {
          owner: 'previous-worker',
          status: 'running',
          error: '',
          updatedAt: new Date().toISOString()
        }
      });
    }, { jobId: interruptedJobId });
    await page.evaluate(({ jobId }) => localStorage.setItem('kupleno-active-collect-job-v1', jobId), { jobId: interruptedJobId });
    await page.reload();
    await page.waitForFunction(() => document.querySelector('#statusText')?.textContent?.includes('Найден предыдущий'));
    assert.match(await page.locator('#downloadCsv').textContent(), /\(3\)/u, 'перезапуск не должен терять импорт');
    await page.locator('#collect').click();
    await page.waitForFunction(() => document.querySelector('#statusText')?.textContent?.includes('прерван перезапуском'));
    assert.match(await page.locator('#downloadCsv').textContent(), /\(3\)/u, 'прерванный сбор не должен заменять сохранённые данные');

    await page.locator('[data-view="data"]').click();
    const backupDownloadPromise = page.waitForEvent('download');
    await page.locator('#exportDataBackup').click();
    const backupDownload = await backupDownloadPromise;
    const backupPath = path.join(profileDir, 'smoke-backup.json');
    await backupDownload.saveAs(backupPath);
    assert.ok(fs.statSync(backupPath).size > 100, 'резервная копия не должна быть пустой');

    page.once('dialog', (dialog) => dialog.accept());
    await page.locator('#deleteAllData').click();
    await page.waitForFunction(() => !document.body.classList.contains('has-data'));
    await page.locator('#onboardingPanel').waitFor({ state: 'visible' });
    for (const selector of ['#sourceOzon', '#sourceWb', '#sourceYandex']) {
      assert.equal(await page.locator(selector).isChecked(), false, `${selector} должен сбрасываться вместе с данными`);
    }

    page.once('dialog', (dialog) => dialog.accept());
    await page.locator('#importDataBackupInput').setInputFiles(backupPath);
    await page.waitForFunction(() => document.body.classList.contains('has-data'));
    await page.locator('#onboardingPanel').waitFor({ state: 'hidden' });
    assert.equal(await page.locator('#onboardingPanel').isVisible(), false, 'восстановление должно возвращать пользователя к отчёту');
    assert.match(await page.locator('#downloadCsv').textContent(), /\(3\)/u);

    await page.locator('[data-view="analytics"]').click();
    const accessibility = await page.evaluate(() => {
      const duplicateIds = [...document.querySelectorAll('[id]')]
        .map((node) => node.id)
        .filter((id, index, ids) => ids.indexOf(id) !== index);
      const visible = (node) => {
        const style = getComputedStyle(node);
        return node.getClientRects().length > 0
          && style.display !== 'none'
          && style.visibility !== 'hidden'
          && !node.closest('[inert]');
      };
      const controls = [...document.querySelectorAll('button, input, select, textarea, a[href], summary')].filter(visible);
      const unnamed = controls.filter((node) => {
        if (node instanceof HTMLInputElement && node.type === 'hidden') return false;
        const label = node.getAttribute('aria-label')
          || node.getAttribute('title')
          || node.textContent?.trim()
          || node.closest('label')?.textContent?.trim()
          || (node.id && document.querySelector(`label[for="${CSS.escape(node.id)}"]`)?.textContent?.trim());
        return !label;
      }).map((node) => node.id || node.outerHTML.slice(0, 80));
      return {
        duplicateIds,
        unnamed,
        h1: document.querySelectorAll('h1').length,
        lang: document.documentElement.lang,
        hiddenFocusable: [...document.querySelectorAll('[aria-hidden="true"] button, [aria-hidden="true"] input, [aria-hidden="true"] select, [aria-hidden="true"] a[href]')]
          .filter((node) => !node.closest('[inert]')).length
      };
    });
    assert.deepEqual(accessibility.duplicateIds, []);
    assert.deepEqual(accessibility.unnamed, []);
    assert.equal(accessibility.h1, 1);
    assert.equal(accessibility.lang, 'ru');
    assert.equal(accessibility.hiddenFocusable, 0);
    await page.evaluate(() => {
      document.body.tabIndex = -1;
      document.body.focus();
    });
    await page.keyboard.press('Tab');
    assert.equal(
      await page.evaluate(() => document.activeElement?.classList.contains('skip-link')),
      true,
      `первым должен быть переход к отчёту, сейчас ${await page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName)}`
    );
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'analyticsView');
    await page.locator('[data-view="analytics"]').focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('[data-view="categories"]').getAttribute('aria-selected'), 'true');
    assert.equal(await page.locator('#analyticsView').getAttribute('inert'), '');
    assert.equal(await page.locator('#skipLink').getAttribute('href'), '#categoriesView');
    await page.keyboard.press('Home');
    assert.equal(await page.locator('[data-view="analytics"]').getAttribute('aria-selected'), 'true');

    await page.setViewportSize({ width: 390, height: 844 });
    for (const [view, panel] of [
      ['analytics', '#analyticsView'],
      ['categories', '#categoriesView'],
      ['control', '#controlView'],
      ['data', '#dataView']
    ]) {
      await page.locator(`[data-view="${view}"]`).click();
      const width = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
      assert.ok(width.document <= width.viewport, `${view}: горизонтальное переполнение ${JSON.stringify(width)}`);
      const box = await page.locator(panel).boundingBox();
      assert.ok(box && box.x >= -1 && box.x + box.width <= 391, `${panel} выходит за ширину экрана: ${JSON.stringify(box)}`);
      await page.screenshot({ path: path.join(outputDir, `${view}-mobile.png`), fullPage: true });
    }
    await page.locator('[data-view="analytics"]').click();

    const permissionPatched = await page.evaluate(() => {
      try {
        const original = chrome.permissions.request;
        Object.defineProperty(chrome.permissions, 'request', {
          configurable: true,
          value: (_request, callback) => callback(false)
        });
        globalThis.__restorePermissionRequest = () => Object.defineProperty(chrome.permissions, 'request', {
          configurable: true,
          value: original
        });
        return true;
      } catch {
        return false;
      }
    });
    assert.equal(permissionPatched, true, 'не удалось изолировать сценарий отказа в доступе');
    if (!await page.locator('#sourceOzon').isVisible()) await page.locator('#toggleRunDetails').click();
    await page.locator('#sourceOzon').check();
    await page.locator('#collect').click();
    await page.waitForFunction(() => document.querySelector('#statusText')?.textContent?.includes('Браузер не дал доступ'));
    assert.match(await page.locator('#downloadCsv').textContent(), /\(3\)/u, 'отказ в доступе не должен стирать отчёт');
    await page.evaluate(() => globalThis.__restorePermissionRequest?.());

    const bulk = performanceImport();
    const importStarted = performance.now();
    await page.locator('#uploadCsvInput').setInputFiles(bulk);
    await page.waitForFunction(() => (
      document.querySelector('#downloadCsv')?.textContent?.includes('(10003)')
      && /^(?:Загружено|Объединено):/.test(document.querySelector('#statusText')?.textContent || '')
    ), null, { timeout: 30_000 });
    const importMs = Math.round(performance.now() - importStarted);
    const reloadStarted = performance.now();
    await page.reload();
    await page.waitForFunction(() => document.querySelector('#downloadCsv')?.textContent?.includes('(10003)'), null, { timeout: 30_000 });
    const reloadMs = Math.round(performance.now() - reloadStarted);
    assert.ok(importMs < 20_000, `импорт 10 000 строк слишком медленный: ${importMs} мс`);
    assert.ok(reloadMs < 20_000, `восстановление 10 003 строк слишком медленное: ${reloadMs} мс`);
    fs.writeFileSync(path.join(root, 'dist', 'performance-browser.json'), `${JSON.stringify({ rows: 10_003, importMs, reloadMs }, null, 2)}\n`);

    assert.deepEqual(browserErrors, []);
    assert.deepEqual(
      [...new Set(externalRequests.filter((url) => url !== 'https://api.github.com/repos/malyarq/kupleno/releases/latest'))],
      [],
      'чистый запуск не должен обращаться к посторонним адресам'
    );
    console.log(`browser smoke: ok (${extensionDir})`);
  } finally {
    await context?.close();
    fs.rmSync(profileDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
