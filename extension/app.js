const api = globalThis.chrome;

const csvColumns = [
  { header: 'date', field: 'date' },
  { header: 'marketplace', field: 'source' },
  { header: 'title', field: 'title' },
  { header: 'amount', field: 'amount' },
  { header: 'currency', field: 'currency' },
  { header: 'category', field: 'category' },
  { header: 'type', field: 'type' },
  { header: 'marketplace_id', field: 'marketplace_id' },
  { header: 'item_index', field: 'item_index' },
  { header: 'profile', field: 'profile' },
  { header: 'note', field: 'note' },
  { header: 'excluded', field: 'excluded' }
];

const els = {
  skipLink: document.getElementById('skipLink'),
  onboardingPanel: document.getElementById('onboardingPanel'),
  onboardingDemo: document.getElementById('onboardingDemo'),
  onboardingStart: document.getElementById('onboardingStart'),
  onboardingUpload: document.getElementById('onboardingUpload'),
  demoBanner: document.getElementById('demoBanner'),
  demoStart: document.getElementById('demoStart'),
  demoUpload: document.getElementById('demoUpload'),
  demoExit: document.getElementById('demoExit'),
  sourceOzon: document.getElementById('sourceOzon'),
  sourceOzonState: document.getElementById('sourceOzonState'),
  sourceWb: document.getElementById('sourceWb'),
  sourceWbState: document.getElementById('sourceWbState'),
  sourceYandex: document.getElementById('sourceYandex'),
  sourceYandexState: document.getElementById('sourceYandexState'),
  collect: document.getElementById('collect'),
  themeToggle: document.getElementById('themeToggle'),
  runSummary: document.getElementById('runSummary'),
  runSummaryText: document.getElementById('runSummaryText'),
  runDownloadCsv: document.getElementById('runDownloadCsv'),
  toggleRunDetails: document.getElementById('toggleRunDetails'),
  runDetails: document.getElementById('runDetails'),
  uploadCsv: document.getElementById('uploadCsv'),
  uploadCsvInput: document.getElementById('uploadCsvInput'),
  downloadCsv: document.getElementById('downloadCsv'),
  copyLog: document.getElementById('copyLog'),
  clearLog: document.getElementById('clearLog'),
  warningBanner: document.getElementById('warningBanner'),
  warningTitle: document.getElementById('warningTitle'),
  warningText: document.getElementById('warningText'),
  warningDetails: document.getElementById('warningDetails'),
  updateBanner: document.getElementById('updateBanner'),
  qualitySummary: document.getElementById('qualitySummary'),
  categoryReviewBadge: document.getElementById('categoryReviewBadge'),
  controlBadge: document.getElementById('controlBadge'),
  controlView: document.getElementById('controlView'),
  statusText: document.getElementById('statusText'),
  progress: document.getElementById('progress'),
  sourceStatuses: document.getElementById('sourceStatuses'),
  collectHint: document.getElementById('collectHint'),
  periodGroup: document.getElementById('periodGroup'),
  dateFrom: document.getElementById('dateFrom'),
  dateTo: document.getElementById('dateTo'),
  resetPeriod: document.getElementById('resetPeriod'),
  quickPeriodSelect: document.getElementById('quickPeriodSelect'),
  quickPeriodButtons: [...document.querySelectorAll('.quick-period')],
  tabButtons: [...document.querySelectorAll('.tab-button')],
  viewPanels: [...document.querySelectorAll('.view-panel')],
  analyticsOzon: document.getElementById('analyticsOzon'),
  analyticsWb: document.getElementById('analyticsWb'),
  analyticsYandex: document.getElementById('analyticsYandex'),
  activeFilters: document.getElementById('activeFilters'),
  analyticsEmpty: document.querySelector('.analytics-empty'),
  analyticsEmptyText: document.getElementById('analyticsEmptyText'),
  analyticsEmptyActions: document.getElementById('analyticsEmptyActions'),
  emptyCollect: document.getElementById('emptyCollect'),
  emptyUploadCsv: document.getElementById('emptyUploadCsv'),
  emptyReset: document.getElementById('emptyReset'),
  homeGuide: document.getElementById('homeGuide'),
  homeGuideKicker: document.getElementById('homeGuideKicker'),
  homeGuideTitle: document.getElementById('homeGuideTitle'),
  homeGuideText: document.getElementById('homeGuideText'),
  homeGuidePrimary: document.getElementById('homeGuidePrimary'),
  homeGuideSecondary: document.getElementById('homeGuideSecondary'),
  homeNextSteps: document.getElementById('homeNextSteps'),
  homeNextStepList: document.getElementById('homeNextStepList'),
  analyticsTotal: document.getElementById('analyticsTotal'),
  analyticsTotalLabel: document.getElementById('analyticsTotalLabel'),
  analyticsTotalCompare: document.getElementById('analyticsTotalCompare'),
  analyticsAverage: document.getElementById('analyticsAverage'),
  analyticsAverageLabel: document.getElementById('analyticsAverageLabel'),
  analyticsPurchases: document.getElementById('analyticsPurchases'),
  analyticsPurchasesLabel: document.getElementById('analyticsPurchasesLabel'),
  analyticsRefunds: document.getElementById('analyticsRefunds'),
  toggleAnalyticsDetails: document.getElementById('toggleAnalyticsDetails'),
  reportTrust: document.getElementById('reportTrust'),
  reportTrustBadge: document.getElementById('reportTrustBadge'),
  reportTrustTitle: document.getElementById('reportTrustTitle'),
  reportTrustText: document.getElementById('reportTrustText'),
  reportTrustSources: document.getElementById('reportTrustSources'),
  openCollectionAudit: document.getElementById('openCollectionAudit'),
  openCategoryReview: document.getElementById('openCategoryReview'),
  moneyRecovery: document.getElementById('moneyRecovery'),
  moneyRecoveryTitle: document.getElementById('moneyRecoveryTitle'),
  moneyRecoveryText: document.getElementById('moneyRecoveryText'),
  openMoneyRecovery: document.getElementById('openMoneyRecovery'),
  actionSummary: document.getElementById('actionSummary'),
  actionInsightList: document.getElementById('actionInsightList'),
  chartRange: document.getElementById('chartRange'),
  periodChart: document.getElementById('periodChart'),
  periodChartMode: document.getElementById('periodChartMode'),
  activeProfileSelect: document.getElementById('activeProfileSelect'),
  sourceBreakdown: document.getElementById('sourceBreakdown'),
  categoryBreakdown: document.getElementById('categoryBreakdown'),
  categorySummary: document.getElementById('categorySummary'),
  categoryLevel: document.getElementById('categoryLevel'),
  categoryChartType: document.getElementById('categoryChartType'),
  copyReport: document.getElementById('copyReport'),
  spendReport: document.getElementById('spendReport'),
  budgetMonth: document.getElementById('budgetMonth'),
  overallBudgetAmount: document.getElementById('overallBudgetAmount'),
  saveOverallBudget: document.getElementById('saveOverallBudget'),
  budgetForecastStatus: document.getElementById('budgetForecastStatus'),
  budgetCategory: document.getElementById('budgetCategory'),
  budgetAmount: document.getElementById('budgetAmount'),
  saveBudget: document.getElementById('saveBudget'),
  copyBudgetNextMonth: document.getElementById('copyBudgetNextMonth'),
  budgetBreakdown: document.getElementById('budgetBreakdown'),
  budgetCard: document.getElementById('budgetCard'),
  refundClaims: document.getElementById('refundClaims'),
  refundCard: document.getElementById('refundCard'),
  detailTitle: document.getElementById('detailTitle'),
  detailSummary: document.getElementById('detailSummary'),
  detailSearch: document.getElementById('detailSearch'),
  detailPageSize: document.getElementById('detailPageSize'),
  detailOperationButtons: [...document.querySelectorAll('.detail-operation')],
  detailMore: document.getElementById('detailMore'),
  clearDetailFilter: document.getElementById('clearDetailFilter'),
  bulkBar: document.getElementById('bulkBar'),
  bulkCount: document.getElementById('bulkCount'),
  bulkCategory: document.getElementById('bulkCategory'),
  bulkProfile: document.getElementById('bulkProfile'),
  bulkApply: document.getElementById('bulkApply'),
  bulkExclude: document.getElementById('bulkExclude'),
  bulkInclude: document.getElementById('bulkInclude'),
  bulkClear: document.getElementById('bulkClear'),
  detailRows: document.getElementById('detailRows'),
  topItems: document.getElementById('topItems'),
  categoryQualityKpis: document.getElementById('categoryQualityKpis'),
  categoryReviewSearch: document.getElementById('categoryReviewSearch'),
  categoryReviewSummary: document.getElementById('categoryReviewSummary'),
  categoryReviewList: document.getElementById('categoryReviewList'),
  categoryReviewMore: document.getElementById('categoryReviewMore'),
  reviewAllCategories: document.getElementById('reviewAllCategories'),
  controlKpis: document.getElementById('controlKpis'),
  closeMonth: document.getElementById('closeMonth'),
  monthCloseAction: document.getElementById('monthCloseAction'),
  monthCloseStatus: document.getElementById('monthCloseStatus'),
  monthCloseChecklist: document.getElementById('monthCloseChecklist'),
  anomalySummary: document.getElementById('anomalySummary'),
  anomalyList: document.getElementById('anomalyList'),
  recurringSummary: document.getElementById('recurringSummary'),
  recurringList: document.getElementById('recurringList'),
  priceHistorySummary: document.getElementById('priceHistorySummary'),
  priceHistoryList: document.getElementById('priceHistoryList'),
  refundCenterSummary: document.getElementById('refundCenterSummary'),
  refundCenterList: document.getElementById('refundCenterList'),
  warrantySummary: document.getElementById('warrantySummary'),
  warrantyList: document.getElementById('warrantyList'),
  dataProfileSelect: document.getElementById('dataProfileSelect'),
  dataProfileName: document.getElementById('dataProfileName'),
  addDataProfile: document.getElementById('addDataProfile'),
  renameDataProfile: document.getElementById('renameDataProfile'),
  deleteDataProfile: document.getElementById('deleteDataProfile'),
  exportDataBackup: document.getElementById('exportDataBackup'),
  importDataBackup: document.getElementById('importDataBackup'),
  importDataBackupInput: document.getElementById('importDataBackupInput'),
  downloadFullCsv: document.getElementById('downloadFullCsv'),
  downloadJson: document.getElementById('downloadJson'),
  downloadAnonymousCsv: document.getElementById('downloadAnonymousCsv'),
  revokeSourcePermissions: document.getElementById('revokeSourcePermissions'),
  openDiagnostics: document.getElementById('openDiagnostics'),
  backToSettings: document.getElementById('backToSettings'),
  dataHistoryList: document.getElementById('dataHistoryList'),
  categoryRuleForm: document.getElementById('categoryRuleForm'),
  categoryRulePattern: document.getElementById('categoryRulePattern'),
  categoryRuleCategory: document.getElementById('categoryRuleCategory'),
  categoryRuleMatch: document.getElementById('categoryRuleMatch'),
  categoryRuleSource: document.getElementById('categoryRuleSource'),
  categoryRuleNegative: document.getElementById('categoryRuleNegative'),
  categoryRulePreview: document.getElementById('categoryRulePreview'),
  saveCategoryRule: document.getElementById('saveCategoryRule'),
  categoryRuleList: document.getElementById('categoryRuleList'),
  operationOverridesList: document.getElementById('operationOverridesList'),
  operationOverridesSearch: document.getElementById('operationOverridesSearch'),
  operationOverridesSummary: document.getElementById('operationOverridesSummary'),
  operationOverridesMore: document.getElementById('operationOverridesMore'),
  deleteAllData: document.getElementById('deleteAllData'),
  operationEditor: document.getElementById('operationEditor'),
  operationTitlePreview: document.getElementById('operationTitlePreview'),
  operationCategorySelect: document.getElementById('operationCategorySelect'),
  operationCategoryInput: document.getElementById('operationCategoryInput'),
  operationProfileSelect: document.getElementById('operationProfileSelect'),
  operationNote: document.getElementById('operationNote'),
  operationExcluded: document.getElementById('operationExcluded'),
  markRefundClaim: document.getElementById('markRefundClaim'),
  markWarranty: document.getElementById('markWarranty'),
  operationWarrantyFields: document.getElementById('operationWarrantyFields'),
  operationWarrantyUntil: document.getElementById('operationWarrantyUntil'),
  operationDocumentUrl: document.getElementById('operationDocumentUrl'),
  operationWarrantyNote: document.getElementById('operationWarrantyNote'),
  operationApplySimilar: document.getElementById('operationApplySimilar'),
  operationSimilarHint: document.getElementById('operationSimilarHint'),
  operationCancel: document.getElementById('operationCancel'),
  operationSave: document.getElementById('operationSave'),
  logBadge: document.getElementById('logBadge'),
  log: document.getElementById('log')
};

const cpuCount = navigator.hardwareConcurrency || 8;
const defaultCollectOptions = {
  ozonMaxPages: 1000,
  wbMaxPages: 2000,
  wbPageSize: 100,
  yandexMaxPages: 200,
  ozonParsePdf: true,
  ozonPdfConcurrency: Math.min(6, Math.max(3, Math.ceil(cpuCount / 2))),
  wbReceiptConcurrency: Math.min(8, Math.max(4, cpuCount)),
  yandexReceiptConcurrency: 2,
  ozonApiPauseMs: 0,
  wbApiPauseMs: 0,
  yandexApiPauseMs: 300,
  knownReceiptTail: 30
};
const knownReceiptLimit = 3000;
const maxCsvImportBytes = 20 * 1024 * 1024;
const maxRenderedDetailRows = 500;

const logStorageKey = 'markettrat-log-v1';
const themeStorageKey = 'markettrat-theme-v1';
const categoryLevelStorageKey = 'markettrat-category-level-v1';
const categoryChartTypeStorageKey = 'markettrat-category-chart-v1';
const periodChartModeStorageKey = 'markettrat-period-chart-mode-v1';
const lastRunStorageKey = 'markettrat-last-run-v1';
const budgetStorageKey = 'markettrat-budgets-v1';
const onboardingStorageKey = 'markettrat-onboarding-v2';
const collectSourcesStorageKey = 'markettrat-collect-sources-v1';
const activeProfileStorageKey = 'markettrat-active-profile-v1';
const dataProfileStorageKey = 'markettrat-data-profile-v1';
const activeCollectJobStorageKey = 'markettrat-active-collect-job-v1';
const featureStorage = globalThis.MarketTratStorage;
const preferences = globalThis.MarketTratPreferences;
const intelligence = globalThis.MarketTratIntelligence;
const lifecycle = globalThis.MarketTratLifecycle;
const privacy = globalThis.MarketTratPrivacy;
const analyticsCore = globalThis.MarketTratAnalyticsCore;
const analyticsUtils = globalThis.MarketTratAnalyticsUtils;
const reportQuality = globalThis.MarketTratReportQuality;
const sourceHealth = globalThis.MarketTratSourceHealth;
const {
  formatRub,
  pluralRu,
  formatCount,
  compactAmount,
  parseRowDate,
  dateInputValue,
  inputDate,
  localInputDate,
  isoWeekKey,
  periodKey,
  quickPeriodRange,
  periodBounds,
  isDateInRange,
  averageForPeriods,
  averagePeriodLabel,
  previousRange,
  compareText
} = analyticsUtils;
const dataSyncChannel = typeof BroadcastChannel === 'function'
  ? new BroadcastChannel('markettrat-data-sync-v1')
  : null;
const sourceLabels = {
  ozon: 'Ozon',
  wildberries: 'Wildberries',
  yandex: 'Яндекс Маркет'
};
const sourceColors = {
  ozon: '#005bff',
  wildberries: '#cb11ab',
  yandex: '#f2c200'
};
const sourceMarks = {
  ozon: 'O',
  wildberries: 'WB',
  yandex: 'Я'
};
const sourcePermissionOrigins = {
  ozon: ['https://www.ozon.ru/*', 'https://ozon.ru/*'],
  wildberries: [
    'https://www.wildberries.ru/*',
    'https://wildberries.ru/*',
    'https://astro.wildberries.ru/*',
    'https://receipt.wb.ru/*'
  ],
  yandex: ['https://market.yandex.ru/*', 'https://check.yandex.ru/*']
};
const collectSourceInputs = [
  ['ozon', els.sourceOzon],
  ['wildberries', els.sourceWb],
  ['yandex', els.sourceYandex]
];
const collectSourceStateElements = {
  ozon: els.sourceOzonState,
  wildberries: els.sourceWbState,
  yandex: els.sourceYandexState
};
let sourcePermissionStates = { ozon: false, wildberries: false, yandex: false };
const categoryLabels = {
  unknown: 'Без категории'
};
const categoryColors = {
  'Авто': '#ff8a00',
  'Аксессуары': '#64748b',
  'Благотворительность': '#22c55e',
  'Бытовая химия': '#7ed957',
  'Бытовая техника': '#00a6d6',
  'Дом': '#9b5de5',
  'Детям': '#ff6b9a',
  'Здоровье': '#00b894',
  'Зоотовары': '#b7791f',
  'Интимные товары': '#e11d48',
  'Канцтовары': '#94a3b8',
  'Книги': '#0ea5a5',
  'Красота и уход': '#ff4fa3',
  'Мебель': '#8b5e3c',
  'Музыка': '#7c3aed',
  'Одежда': '#9c6b3d',
  'Обувь': '#4f46e5',
  'Подписки': '#c026d3',
  'Цифровые покупки': '#c026d3',
  'Продукты': '#6cc24a',
  'Ремонт': '#f6c000',
  'Сад': '#16a34a',
  'Спорт': '#ef4444',
  'Табак и никотин': '#7c6f64',
  'Хобби и творчество': '#b832e6',
  'Украшения': '#db2777',
  'Фото и оптика': '#0891b2',
  'Электроника': '#2f80ed',
  'Игрушки': '#f59e0b',
  other: '#6b7280',
  unknown: '#a8b0bf'
};
const svgNamespace = 'http://www.w3.org/2000/svg';
let sourceRows = [];
let rows = [];
let logLines = loadStoredLog();
let legacyBudgets = loadBudgets();
let appSettings = normalizeSettings({});
legacyBudgets = {};
let hasCollected = false;
let selectedPeriodKey = '';
let categoriesExpanded = false;
let detailFilter = null;
let detailOperation = 'all';
let detailSort = { field: 'date', direction: 'desc' };
let collectStatuses = {};
let runDetailsOpen = true;
let lastRunAt = null;
let lastRunKind = '';
let lastWarningCount = 0;
let lastCollectionReport = { sources: [], stats: {}, warnings: [] };
let detailShownCount = 60;
let categoryReviewShownCount = 5;
let categoryReviewShowAll = false;
let operationOverridesShownCount = 100;
let currentReportText = '';
let selectedOperationRowId = '';
const selectedOperationRowIds = new Set();
let queuedCollectSources = null;
let demoMode = false;
let demoRestoreState = null;
let persistenceQueue = Promise.resolve();
let persistencePendingCount = 0;
let automaticPersistenceSuppressionDepth = 0;
let dataEpoch = 0;
let dataRevision = 0;
let storageConflict = false;
let collectionInProgress = false;
let databaseMutationInProgress = false;
let collectGeneration = 0;
let databaseMutationGeneration = 0;
let operationReturnFocusRowId = '';
const logLineByKey = new Map();
let logRenderScheduled = false;
let intelligenceCacheRows = null;
const intelligenceCacheByProfile = new Map();
let homeGuidePrimaryAction = null;
let homeGuideSecondaryAction = null;
let homeAnalysisScheduledRows = null;
let homeAnalysisScheduledProfile = '';

function withAutomaticPersistenceSuppressed(callback) {
  automaticPersistenceSuppressionDepth += 1;
  let result;
  try {
    result = callback();
  } catch (error) {
    automaticPersistenceSuppressionDepth -= 1;
    throw error;
  }
  if (result && typeof result.then === 'function') {
    return Promise.resolve(result).finally(() => {
      automaticPersistenceSuppressionDepth -= 1;
    });
  }
  automaticPersistenceSuppressionDepth -= 1;
  return result;
}

function automaticPersistenceAllowed() {
  return automaticPersistenceSuppressionDepth === 0;
}

function isNewerDataEpoch(value) {
  const epoch = Number(value);
  return Number.isSafeInteger(epoch) && epoch > dataEpoch;
}

function adoptLoadedDataEpoch(value) {
  const epoch = Number(value);
  if (!Number.isSafeInteger(epoch) || epoch < 0 || epoch < dataEpoch) return false;
  dataEpoch = epoch;
  return true;
}

function adoptLoadedDataRevision(value) {
  const revision = Number(value);
  if (!Number.isSafeInteger(revision) || revision < 0) return false;
  dataRevision = revision;
  storageConflict = false;
  return true;
}

function markStorageConflict(currentRevision = null) {
  storageConflict = true;
  const suffix = Number.isSafeInteger(Number(currentRevision))
    ? ` Текущая версия хранилища: ${Number(currentRevision)}.`
    : '';
  const message = `Данные изменены в другой вкладке. Эта вкладка не будет перезаписывать более новую версию.${suffix} Скачайте резервную копию несохранённых данных при необходимости и перезагрузите страницу.`;
  showWarnings([message]);
  setStatus('Обнаружён конфликт вкладок: сохранение отменено, новые данные не перезаписаны.');
  appendLog(`Предупреждение: ${message}`, 'storage-revision-conflict');
  setMutationControlsDisabled(true);
}

function currentMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function slugId(value) {
  const base = String(value || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^0-9a-zа-я]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 36);
  return base || `profile-${Date.now().toString(36)}`;
}

function normalizedDay(value) {
  const text = String(value || '').slice(0, 10);
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return '';
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return date.getUTCFullYear() === Number(match[1])
    && date.getUTCMonth() === Number(match[2]) - 1
    && date.getUTCDate() === Number(match[3])
    ? text
    : '';
}

function plainSettingsMap(value, allowedValues = null, limit = 100000) {
  const result = {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) return result;
  for (const [key, item] of Object.entries(value).slice(0, limit)) {
    const safeKey = String(key || '').trim().slice(0, 500);
    if (!safeKey || ['__proto__', 'prototype', 'constructor'].includes(safeKey)) continue;
    if (allowedValues && !allowedValues.has(item)) continue;
    result[safeKey] = allowedValues ? item : item === true;
  }
  return result;
}

function normalizeSettings(value) {
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const profiles = [];
  const seenProfiles = new Set();
  for (const candidate of Array.isArray(raw.profiles) ? raw.profiles : []) {
    const id = slugId(candidate?.id || candidate?.name);
    const name = String(candidate?.name || '').trim().slice(0, 60);
    if (!name || seenProfiles.has(id)) continue;
    seenProfiles.add(id);
    profiles.push({ id, name });
  }
  if (!profiles.length) profiles.push({ id: 'personal', name: 'Личный' });

  const overrides = {};
  if (raw.overrides && typeof raw.overrides === 'object' && !Array.isArray(raw.overrides)) {
    for (const [rowId, patch] of Object.entries(raw.overrides)) {
      if (!rowId || !patch || typeof patch !== 'object' || Array.isArray(patch)) continue;
      const normalizedPatch = {
        ...(Object.prototype.hasOwnProperty.call(patch, 'category') ? { category: String(patch.category || '').trim() } : {}),
        ...(Object.prototype.hasOwnProperty.call(patch, 'profile') ? { profile: String(patch.profile || '').trim() } : {}),
        ...(Object.prototype.hasOwnProperty.call(patch, 'note') ? { note: String(patch.note || '').trim() } : {}),
        ...(Object.prototype.hasOwnProperty.call(patch, 'excluded') ? { excluded: patch.excluded === true } : {})
      };
      if (Object.keys(normalizedPatch).length) overrides[rowId] = normalizedPatch;
    }
  }

  const customRules = (Array.isArray(raw.customRules) ? raw.customRules : [])
    .map((rule, index) => {
      const keywords = (Array.isArray(rule?.keywords) ? rule.keywords : [rule?.keyword])
        .map((keyword) => String(keyword || '').trim())
        .filter(Boolean)
        .slice(0, 20);
      const negativeKeywords = (Array.isArray(rule?.negativeKeywords) ? rule.negativeKeywords : [])
        .map((keyword) => String(keyword || '').trim())
        .filter(Boolean)
        .slice(0, 20);
      const sources = (Array.isArray(rule?.sources) ? rule.sources : (rule?.source ? [rule.source] : []))
        .map((source) => String(source || '').trim().toLowerCase())
        .map((source) => source === 'wb' ? 'wildberries' : source)
        .filter((source) => sourcePermissionOrigins[source])
        .filter((source, sourceIndex, values) => values.indexOf(source) === sourceIndex);
      const amountMin = Number(rule?.amountMin);
      const amountMax = Number(rule?.amountMax);
      return {
        id: String(rule?.id || `rule-${Date.now().toString(36)}-${index}`),
        keyword: keywords.join(', '),
        keywords,
        negativeKeywords,
        sources,
        match: rule?.match === 'all' || rule?.match === 'exact' ? rule.match : 'any',
        category: String(rule?.category || '').trim(),
        priority: Number(rule?.priority) || 100,
        enabled: rule?.enabled !== false,
        ...(Number.isFinite(amountMin) && amountMin >= 0 ? { amountMin } : {}),
        ...(Number.isFinite(amountMax) && amountMax >= 0 ? { amountMax } : {})
      };
    })
    .filter((rule) => rule.keywords.length && rule.category);

  const budgetsByMonth = {};
  if (raw.budgets && typeof raw.budgets === 'object' && !Array.isArray(raw.budgets)) {
    for (const [scopeMonth, plan] of Object.entries(raw.budgets)) {
      const month = scopeMonth.includes('\u0001') ? scopeMonth.slice(scopeMonth.indexOf('\u0001') + 1) : scopeMonth;
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || !plan || typeof plan !== 'object' || Array.isArray(plan)) continue;
      const categories = Object.fromEntries(Object.entries(plan.categories || {})
        .map(([category, amount]) => [String(category).trim(), Number(amount)])
        .filter(([category, amount]) => category && Number.isFinite(amount) && amount > 0));
      const total = Number(plan.total);
      budgetsByMonth[scopeMonth] = {
        total: Number.isFinite(total) && total > 0 ? total : null,
        categories
      };
    }
  }
  if (!Object.keys(budgetsByMonth).length && Object.keys(legacyBudgets || {}).length) {
    budgetsByMonth[currentMonthKey()] = { total: null, categories: { ...legacyBudgets } };
  }

  const profileIds = new Set(profiles.map((profile) => profile.id));
  for (const key of Object.keys(budgetsByMonth)) {
    const separator = key.indexOf('\u0001');
    if (separator >= 0 && !profileIds.has(key.slice(0, separator))) delete budgetsByMonth[key];
  }
  const activeProfile = raw.activeProfile === 'all' || profileIds.has(raw.activeProfile)
    ? raw.activeProfile
    : 'all';
  const dataProfile = profileIds.has(raw.dataProfile) ? raw.dataProfile : profiles[0].id;

  const refundClaims = [];
  const refundIds = new Set();
  for (const claim of (Array.isArray(raw.refundClaims) ? raw.refundClaims : []).slice(0, 100000)) {
    if (!claim || typeof claim !== 'object' || Array.isArray(claim) || claim.status === 'cancelled') continue;
    const rowId = String(claim.rowId || '').trim().slice(0, 200);
    const marketplaceId = String(claim.marketplace_id || '').trim().slice(0, 300);
    const expectedAmount = Number(claim.expectedAmount ?? claim.amount);
    if ((!rowId && !marketplaceId) || !Number.isFinite(expectedAmount) || expectedAmount <= 0) continue;
    const fallbackId = `refund-${rowId || marketplaceId}`.slice(0, 160);
    const id = String(claim.id || fallbackId).trim().slice(0, 160);
    if (!id || refundIds.has(id)) continue;
    const profile = profileIds.has(claim.profile) ? claim.profile : profiles[0].id;
    const purchaseDate = normalizedDay(claim.purchaseDate);
    const requestedAt = normalizedDay(claim.requestedAt || claim.createdAt) || purchaseDate || localInputDate(new Date());
    const suppliedStatus = claim.status === 'reconciled' ? 'received' : String(claim.status || 'pending');
    const status = new Set(['pending', 'partial', 'disputed', 'received', 'overdue']).has(suppliedStatus)
      ? suppliedStatus
      : 'pending';
    const draft = {
      id,
      rowId: rowId || null,
      marketplace_id: marketplaceId || null,
      source: String(claim.source || '').trim().slice(0, 64) || null,
      title: String(claim.title || 'Покупка').trim().slice(0, 500) || 'Покупка',
      expectedAmount: Math.round(expectedAmount * 100) / 100,
      requestedAt,
      purchaseDate: purchaseDate || null,
      ...(normalizedDay(claim.dueDate) ? { dueDate: normalizedDay(claim.dueDate) } : {}),
      status,
      manualMatchRowIds: [...new Set((Array.isArray(claim.manualMatchRowIds) ? claim.manualMatchRowIds : [])
        .map((item) => String(item || '').trim().slice(0, 200))
        .filter(Boolean))],
      ...(normalizedDay(claim.confirmedAt) ? { confirmedAt: normalizedDay(claim.confirmedAt) } : {}),
      note: String(claim.note || '').trim().slice(0, 4000) || null
    };
    try {
      const normalized = lifecycle?.normalizeExpectedReturn
        ? lifecycle.normalizeExpectedReturn(draft, { now: requestedAt })
        : draft;
      refundClaims.push({ ...normalized, profile });
      refundIds.add(id);
    } catch {
      // Повреждённая отдельная отметка не должна делать нечитаемой всю резервную копию.
    }
  }

  const warranties = [];
  const warrantyIds = new Set();
  for (const record of (Array.isArray(raw.warranties) ? raw.warranties : []).slice(0, 100000)) {
    if (!record || typeof record !== 'object' || Array.isArray(record)) continue;
    const profile = profileIds.has(record.profile) ? record.profile : profiles[0].id;
    const draft = {
      id: String(record.id || `archive-${record.rowId || record.marketplace_id || ''}`).trim().slice(0, 160),
      kind: record.kind === 'receipt' ? 'receipt' : 'warranty',
      rowId: String(record.rowId || '').trim().slice(0, 200) || null,
      marketplace_id: String(record.marketplace_id || '').trim().slice(0, 300) || null,
      source: String(record.source || '').trim().slice(0, 64) || null,
      title: String(record.title || 'Документ').trim().slice(0, 500) || 'Документ',
      issuedAt: normalizedDay(record.issuedAt) || null,
      expiresAt: normalizedDay(record.expiresAt) || null,
      url: String(record.url || '').trim().slice(0, 2048) || null,
      note: String(record.note || '').trim().slice(0, 4000) || null,
      addedAt: normalizedDay(record.addedAt) || normalizedDay(record.issuedAt) || localInputDate(new Date())
    };
    if (!draft.id || warrantyIds.has(draft.id) || (!draft.rowId && !draft.marketplace_id)) continue;
    try {
      const normalized = lifecycle?.normalizeArchiveRecord
        ? lifecycle.normalizeArchiveRecord(draft, { now: draft.addedAt })
        : draft;
      warranties.push({ ...normalized, profile });
      warrantyIds.add(draft.id);
    } catch {
      // Невалидная ссылка или дата отбрасывается отдельно, остальные настройки сохраняются.
    }
  }

  const monthClosures = {};
  if (raw.monthClosures && typeof raw.monthClosures === 'object' && !Array.isArray(raw.monthClosures)) {
    for (const [key, closure] of Object.entries(raw.monthClosures).slice(0, 10000)) {
      const separator = key.indexOf('\u0001');
      const profile = separator >= 0 ? key.slice(0, separator) : '';
      const month = separator >= 0 ? key.slice(separator + 1) : '';
      if ((profile !== 'all' && !profileIds.has(profile)) || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) continue;
      try {
        monthClosures[`${profile}\u0001${month}`] = lifecycle?.validateMonthClosure
          ? lifecycle.validateMonthClosure(closure)
          : closure;
      } catch {
        // Повреждённое закрытие месяца не влияет на живую историю операций.
      }
    }
  }

  return {
    version: 1,
    taxonomyVersion: 2,
    profiles,
    activeProfile,
    dataProfile,
    overrides,
    customRules,
    budgets: budgetsByMonth,
    refundClaims,
    warranties,
    monthClosures,
    recurringDecisions: plainSettingsMap(raw.recurringDecisions, new Set(['confirmed', 'ignored'])),
    anomalyDismissals: plainSettingsMap(raw.anomalyDismissals)
  };
}

function callChrome(fn, ...args) {
  return new Promise((resolve, reject) => {
    if (typeof fn !== 'function') {
      reject(new Error('Откройте страницу из иконки установленного расширения.'));
      return;
    }

    fn(...args, (result) => {
      const err = api?.runtime?.lastError;
      if (err) reject(new Error(err.message));
      else resolve(result);
    });
  });
}

async function clearBackgroundCollectJobs() {
  if (!api?.runtime?.sendMessage) return true;
  const response = await callChrome(api.runtime.sendMessage, {
    type: 'SPEND_CLEAR_COLLECT_JOBS'
  });
  if (!response?.ok) {
    throw new Error(response?.error || 'Не удалось очистить временные данные сбора.');
  }
  forgetStoredCollectJob();
  return true;
}

function storedCollectJobId() {
  try {
    const jobId = String(localStorage.getItem(activeCollectJobStorageKey) || '');
    if (/^[a-z0-9-]{1,200}$/i.test(jobId)) return jobId;
    if (jobId) localStorage.removeItem(activeCollectJobStorageKey);
  } catch {
    // Recovery remains available while this page stays open.
  }
  return '';
}

function rememberCollectJob(jobId) {
  try {
    localStorage.setItem(activeCollectJobStorageKey, String(jobId));
  } catch {
    // The current page can still finish this collection.
  }
}

function forgetStoredCollectJob() {
  try {
    localStorage.removeItem(activeCollectJobStorageKey);
  } catch {
    // Best effort only.
  }
}

async function acknowledgeCollectJob(jobId) {
  if (!jobId || !api?.runtime?.sendMessage) return;
  const response = await callChrome(api.runtime.sendMessage, {
    type: 'SPEND_COLLECT_ACK',
    jobId
  });
  if (!response?.ok) throw new Error(response?.error || 'Не удалось подтвердить сохранение результата сбора.');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForCollectJob(jobId) {
  while (true) {
    await sleep(1000);
    const response = await callChrome(api.runtime.sendMessage, {
      type: 'SPEND_COLLECT_STATUS',
      jobId
    });
    if (!response?.ok) {
      const error = new Error(response?.error || 'Не удалось получить статус сбора.');
      error.collectJobTerminal = true;
      throw error;
    }
    if (response.status === 'done') return response;
    if (response.status === 'error') {
      const error = new Error(response.error || 'Не удалось собрать данные.');
      error.collectJobTerminal = true;
      throw error;
    }
  }
}

function loadStoredLog() {
  try {
    const parsed = JSON.parse(localStorage.getItem(logStorageKey) || '[]');
    return Array.isArray(parsed) ? parsed.slice(-500).map(String) : [];
  } catch {
    return [];
  }
}

function storeLog() {
  try {
    localStorage.setItem(logStorageKey, JSON.stringify(logLines.slice(-500)));
  } catch {
    // Log persistence is best effort; collection must not depend on it.
  }
}

function loadBudgets() {
  try {
    const parsed = JSON.parse(localStorage.getItem(budgetStorageKey) || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed)
      .map(([category, amount]) => [category, Number(amount)])
      .filter(([category, amount]) => category && Number.isFinite(amount) && amount > 0));
  } catch {
    return {};
  }
}

function storeBudgets() {
  localStorage.removeItem(budgetStorageKey);
}

function cleanupLegacyStorageAfterCommit() {
  try {
    localStorage.removeItem(lastRunStorageKey);
    storeBudgets();
    return true;
  } catch (error) {
    try {
      appendLog(`Предупреждение: снимок сохранён, но старые локальные ключи не очищены: ${error.message}`);
    } catch {
      // Cleanup and its diagnostics are best effort after a committed snapshot.
    }
    return false;
  }
}

function storeLastRun() {
  if (!sourceRows.length || !lastRunAt) return Promise.resolve(null);
  return persistSnapshot(lastRunKind || 'Обновление');
}

function legacyCategoryRequiresRefresh(row, category) {
  const collectorManaged = ['ozon', 'wildberries', 'yandex'].includes(String(row?.source || ''))
    && Boolean(row?.receipt_url || row?.raw_title || row?.parse_quality);
  if (category && collectorManaged && !['manual', 'rule'].includes(row?.category_origin)) return true;
  if (Object.prototype.hasOwnProperty.call(row || {}, 'base_category') || row?.category_origin) return false;
  const title = normalizeKeyText(`${row?.title || ''} ${row?.raw_title || ''}`);
  if (!title) return false;
  if (category === 'Продукты') {
    return /(?:^|\s)(?:pod|вейп\p{L}*|vaporesso|xros|сигарет\p{L}*|табак\p{L}*)(?:\s|$)/u.test(title)
      || /(скотч|клейкая лента|упаковочная бумага|подарочная бумага)/u.test(title);
  }
  if (category === 'Красота и уход') {
    return /(крем сливочн|сливочный крем|крем для торта|кондитерский крем)/u.test(title);
  }
  if (category === 'Книги') {
    return /(чехол|обложка).*(электронн.*книг|ридер)/u.test(title);
  }
  if (category === 'Электроника') {
    return /(ключ активации|электронный ключ|windows 11|steam)/u.test(title);
  }
  return false;
}

function prepareSourceRow(row) {
  let baseCategory = Object.prototype.hasOwnProperty.call(row || {}, 'base_category')
    ? String(row.base_category || '').trim()
    : String(row?.category || '').trim();
  if (legacyCategoryRequiresRefresh(row, baseCategory)) baseCategory = '';
  const normalized = withCategory(withOperation({ ...row, category: baseCategory }));
  const preservedOrigin = baseCategory && ['manual', 'rule'].includes(row?.category_origin)
    ? row.category_origin
    : '';
  return {
    ...normalized,
    base_category: baseCategory,
    ...(preservedOrigin ? {
      category_origin: preservedOrigin,
      category_reason: String(row.category_reason || (preservedOrigin === 'manual' ? 'Подтверждено вручную' : 'Правило категории')),
      category_needs_review: false,
      category_rule_id: String(row.category_rule_id || '')
    } : {})
  };
}

function applyAppPreferences() {
  const fallbackProfile = appSettings.profiles[0]?.id || 'personal';
  const profileIds = new Set(appSettings.profiles.map((profile) => profile.id));
  rows = preferences.applyPreferences(sourceRows, {
    rules: appSettings.customRules,
    overrides: appSettings.overrides
  }).map((row) => ({
    ...row,
    profile: profileIds.has(row.profile) ? row.profile : fallbackProfile,
    excluded: row.excluded === true,
    note: String(row.note || '')
  }));
}

function sparseOperationOverride(baseRow, desired) {
  const patch = {};
  const category = String(desired?.category || '').trim();
  const profile = String(desired?.profile || '').trim();
  const note = String(desired?.note || '').trim();
  const excluded = desired?.excluded === true;
  if (category !== String(baseRow?.category || '').trim()) patch.category = category;
  if (profile !== String(baseRow?.profile || '').trim()) patch.profile = profile;
  if (note !== String(baseRow?.note || '').trim()) patch.note = note;
  if (excluded !== (baseRow?.excluded === true)) patch.excluded = excluded;
  return patch;
}

function rowBeforeManualOverride(sourceRow) {
  const ruled = preferences.applyKeywordRules(sourceRow, appSettings.customRules);
  const fallbackProfile = appSettings.profiles[0]?.id || 'personal';
  const profileIds = new Set(appSettings.profiles.map((profile) => profile.id));
  return {
    ...ruled,
    profile: profileIds.has(ruled.profile) ? ruled.profile : fallbackProfile,
    excluded: ruled.excluded === true,
    note: String(ruled.note || '')
  };
}

function pruneNoopOperationOverrides() {
  if (!Object.keys(appSettings.overrides).length || !sourceRows.length) return 0;
  const byId = new Map(sourceRows.map((row) => [row.rowId, rowBeforeManualOverride(row)]));
  let removed = 0;
  for (const [rowId, desired] of Object.entries(appSettings.overrides)) {
    const baseRow = byId.get(rowId);
    if (!baseRow) continue;
    const patch = sparseOperationOverride(baseRow, { ...baseRow, ...desired });
    if (Object.keys(patch).length) appSettings.overrides[rowId] = patch;
    else {
      delete appSettings.overrides[rowId];
      removed += 1;
    }
  }
  return removed;
}

function applyStoredProfileSelections() {
  const profileIds = new Set(appSettings.profiles.map((profile) => profile.id));
  const active = localStorage.getItem(activeProfileStorageKey);
  const data = localStorage.getItem(dataProfileStorageKey);
  if (active === 'all' || profileIds.has(active)) appSettings.activeProfile = active;
  if (profileIds.has(data)) appSettings.dataProfile = data;
}

function rowMatchesActiveProfile(row) {
  return appSettings.activeProfile === 'all' || row.profile === appSettings.activeProfile;
}

function visibleRow(row) {
  return row?.excluded !== true && rowMatchesActiveProfile(row);
}

function snapshotMetadata(reason = '') {
  return {
    reason: String(reason || 'Обновление'),
    lastRunAt: lastRunAt ? lastRunAt.toISOString() : null,
    lastRunKind: String(lastRunKind || ''),
    warningCount: Number(lastWarningCount) || 0,
    hasCollected: Boolean(hasCollected),
    collection: JSON.parse(JSON.stringify(lastCollectionReport))
  };
}

function persistSnapshot(reason = '') {
  if (!featureStorage || demoMode) return Promise.resolve(null);
  if (storageConflict) {
    markStorageConflict();
    return Promise.resolve(null);
  }
  const payload = {
    rows: sourceRows,
    settings: appSettings,
    metadata: snapshotMetadata(reason)
  };
  persistencePendingCount += 1;
  setMutationControlsDisabled(true);
  setStatus(`Сохраняю локально: ${reason || 'обновление'}...`);
  let committed = false;
  persistenceQueue = persistenceQueue
    .catch(() => null)
    .then(() => featureStorage.save(payload, {
      expectedEpoch: dataEpoch,
      expectedRevision: dataRevision
    }))
    .then((snapshot) => {
      committed = true;
      adoptLoadedDataRevision(snapshot.revision);
      dataSyncChannel?.postMessage({
        type: 'data-saved',
        epoch: dataEpoch,
        revision: dataRevision
      });
      cleanupLegacyStorageAfterCommit();
      renderHistory().catch((error) => {
        appendLog(`Предупреждение: не удалось обновить историю: ${error.message}`);
      });
      return snapshot;
    })
    .catch((error) => {
      if (error?.code === 'STALE_DATA_EPOCH') {
        const currentEpoch = Number(error.currentEpoch);
        if (isNewerDataEpoch(currentEpoch)) {
          resetLocalDataAfterClear(currentEpoch, true);
        }
        appendLog('Устаревшее сохранение отменено: данные удалены в другой вкладке.');
        return null;
      }
      if (error?.code === 'STALE_SNAPSHOT_REVISION') {
        markStorageConflict(error.currentRevision);
        return null;
      }
      appendLog(`Предупреждение: не удалось сохранить локальные данные: ${error.message}`);
      return null;
    })
    .finally(() => {
      persistencePendingCount = Math.max(0, persistencePendingCount - 1);
      if (persistencePendingCount === 0) {
        setMutationControlsDisabled(false);
        if (committed) setStatus(`Сохранено локально: ${reason || 'обновление'}.`);
        else if (!storageConflict) setStatus('Не удалось сохранить локальные данные. Подробности — в журнале.');
      }
    });
  return persistenceQueue;
}

function captureAppState() {
  return JSON.parse(JSON.stringify({
    rows: sourceRows,
    settings: appSettings,
    metadata: snapshotMetadata('Откат'),
    demoMode,
    runDetailsOpen
  }));
}

function restoreCapturedState(state) {
  return withAutomaticPersistenceSuppressed(() => {
    appSettings = normalizeSettings(state.settings || {});
    const metadata = state.metadata || {};
    hasCollected = Boolean(metadata.hasCollected);
    lastRunAt = metadata.lastRunAt ? new Date(metadata.lastRunAt) : null;
    lastRunKind = metadata.lastRunKind || '';
    lastCollectionReport = normalizeCollectionReport(metadata.collection);
    lastWarningCount = warningCountAfterNormalization(metadata.warningCount, metadata.collection, lastCollectionReport);
    demoMode = Boolean(state.demoMode);
    runDetailsOpen = Boolean(state.runDetailsOpen);
    updateResult(state.rows || [], {});
    renderQualitySummary(rows, lastCollectionReport.stats, {}, lastCollectionReport.warnings);
    showWarnings(lastCollectionReport.warnings);
    restoreSourceStatusesFromReport();
    renderRunSummary();
  });
}

function restoreSnapshot(snapshot, statusPrefix = 'Открыт сохранённый отчёт') {
  if (!snapshot) return false;
  return withAutomaticPersistenceSuppressed(() => {
    appSettings = normalizeSettings(snapshot.settings || {});
    applyStoredProfileSelections();
    const metadata = snapshot.metadata || {};
    hasCollected = metadata.hasCollected !== false && snapshot.rows.length > 0;
    lastRunAt = metadata.lastRunAt ? new Date(metadata.lastRunAt) : new Date(snapshot.createdAt || Date.now());
    if (!Number.isFinite(lastRunAt.getTime())) lastRunAt = new Date();
    lastRunKind = metadata.lastRunKind || 'Последний отчёт';
    lastCollectionReport = normalizeCollectionReport(metadata.collection);
    lastWarningCount = warningCountAfterNormalization(metadata.warningCount, metadata.collection, lastCollectionReport);
    runDetailsOpen = false;
    updateResult(snapshot.rows || [], {});
    renderQualitySummary(rows, lastCollectionReport.stats, {}, lastCollectionReport.warnings);
    showWarnings(lastCollectionReport.warnings);
    restoreSourceStatusesFromReport();
    renderRunSummary();
    setStatus(rows.length
      ? `${statusPrefix}: ${formatCount(rows.length, ['операция', 'операции', 'операций'])}.`
      : 'Настройки восстановлены. Данных пока нет.', rows.length ? 1 : 0, 1);
    return true;
  });
}

function restoreLastRun() {
  return withAutomaticPersistenceSuppressed(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(lastRunStorageKey) || 'null');
      if (!saved?.rows?.length) return false;
      hasCollected = true;
      lastRunAt = saved.at ? new Date(saved.at) : new Date();
      lastRunKind = saved.kind || 'Последний отчёт';
      lastWarningCount = Number(saved.warningCount) || 0;
      runDetailsOpen = false;
      const cleaningStats = updateResult(saved.rows, {});
      renderQualitySummary(rows, {}, cleaningStats, []);
      renderRunSummary();
      setStatus(`Открыт сохранённый отчёт: ${formatCount(rows.length, ['операция', 'операции', 'операций'])}.`, 1, 1);
      appendLog(`Открыт сохранённый отчёт: строк ${rows.length}.`);
      return true;
    } catch {
      localStorage.removeItem(lastRunStorageKey);
      return false;
    }
  });
}

function resetLocalDataAfterClear(epoch, remote = false) {
  const nextEpoch = Number(epoch);
  if (Number.isSafeInteger(nextEpoch) && nextEpoch >= dataEpoch) dataEpoch = nextEpoch;
  storageConflict = false;
  collectGeneration += 1;
  databaseMutationGeneration += 1;
  collectionInProgress = false;
  databaseMutationInProgress = false;
  sourceRows = [];
  rows = [];
  appSettings = normalizeSettings({});
  hasCollected = false;
  demoMode = false;
  demoRestoreState = null;
  setDemoUi(false);
  lastRunAt = null;
  lastRunKind = '';
  lastWarningCount = 0;
  lastCollectionReport = { sources: [], stats: {}, warnings: [] };
  selectedPeriodKey = '';
  detailFilter = null;
  detailOperation = 'all';
  collectStatuses = {};
  logLines = [];
  logLineByKey.clear();
  forgetStoredCollectJob();
  applyTheme('light', false);
  withAutomaticPersistenceSuppressed(() => updateResult([], {}));
  renderLog();
  renderRunSummary();
  renderSourceStatuses();
  els.onboardingPanel.hidden = false;
  document.body.classList.add('first-run');
  for (const [, input] of collectSourceInputs) input.checked = false;
  updateProgressFill();
  renderSourceConnectionStates();
  els.collect.disabled = false;
  els.uploadCsv.disabled = false;
  setMutationControlsDisabled(false);
  setStatus(remote ? 'Локальные данные удалены в другой вкладке.' : 'Локальные данные удалены.', 0, 1);
  if (remote) {
    clearBackgroundCollectJobs().catch((error) => {
      appendLog(`Предупреждение: временные данные сбора не очищены: ${error.message}`);
    });
  }
  renderHistory().catch((error) => {
    appendLog(`Предупреждение: не удалось обновить историю: ${error.message}`);
  });
}

function renderLog() {
  logRenderScheduled = false;
  els.log.textContent = logLines.join('\n');
  els.log.scrollTop = els.log.scrollHeight;
  updateLogBadge();
  storeLog();
}

function scheduleRenderLog() {
  if (logRenderScheduled) return;
  logRenderScheduled = true;
  requestAnimationFrame(renderLog);
}

function loadTheme() {
  const saved = localStorage.getItem(themeStorageKey);
  return saved === 'dark' ? 'dark' : 'light';
}

function applyTheme(theme, persist = true) {
  document.documentElement.dataset.theme = theme;
  const label = theme === 'dark' ? 'Светлая тема' : 'Тёмная тема';
  els.themeToggle.setAttribute('aria-label', label);
  els.themeToggle.title = label;
  if (persist) localStorage.setItem(themeStorageKey, theme);
  updateAnalytics();
}

function setActiveView(view) {
  if (demoMode && view !== 'analytics') view = 'analytics';
  const hasMatchingTab = els.tabButtons.some((button) => button.dataset.view === view);
  for (const button of els.tabButtons) {
    const active = button.dataset.view === view;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active || (!hasMatchingTab && button.dataset.view === 'data') ? 0 : -1;
  }
  for (const panel of els.viewPanels) {
    const active = panel.id === `${view}View`;
    panel.classList.toggle('active', active);
    panel.setAttribute('aria-hidden', String(!active));
    panel.toggleAttribute('inert', !active);
  }
  if (document.getElementById(`${view}View`)) els.skipLink.href = `#${view}View`;
  if (view === 'control') renderControl();
}

function updateLogBadge() {
  const count = logLines.filter((line) => /Ошибка|Предупреждение/.test(line)).length;
  els.logBadge.hidden = count === 0;
  els.logBadge.textContent = String(count);
}

function createSourceBadge(source) {
  const badge = document.createElement('span');
  badge.className = `source-badge ${source}`;
  badge.style.background = sourceColors[source] || '#005bff';
  badge.textContent = sourceMarks[source] || String(source || '').slice(0, 2).toUpperCase();
  return badge;
}

function makeClickable(node, activate) {
  node.classList.add('clickable');
  node.tabIndex = 0;
  node.setAttribute('role', 'button');
  node.addEventListener('click', activate);
  node.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activate();
    }
  });
}

function sourceFromProgress(text) {
  const value = String(text || '');
  if (value.startsWith('Ozon:')) return 'ozon';
  if (value.startsWith('Wildberries:')) return 'wildberries';
  if (value.startsWith('Яндекс Маркет:')) return 'yandex';
  return '';
}

function collectStatusFromProgress(text) {
  const value = String(text || '');
  if (/^[^:]+: готово(?:[,. ]|$)/.test(value)) return { state: 'done', label: 'готово' };
  if (/^[^:]+: ошибка(?:[,. ]|$)/.test(value)) return { state: 'error', label: 'ошибка' };
  return { state: 'running', label: 'собирается' };
}

function renderSourceStatuses() {
  clearNode(els.sourceStatuses);
  const entries = Object.entries(collectStatuses);
  els.sourceStatuses.hidden = entries.length === 0;

  for (const [source, status] of entries) {
    const item = document.createElement('div');
    item.className = `source-status ${status.state || 'waiting'}`;
    if (status.title) item.title = status.title;
    const copy = document.createElement('span');
    copy.className = 'source-status-copy';
    const label = document.createElement('strong');
    label.textContent = `${sourceLabels[source] || source}: ${status.label || 'ожидает'}`;
    copy.appendChild(label);
    if (status.title && (status.state === 'error' || status.state === 'warning')) {
      const detail = document.createElement('small');
      detail.textContent = friendlyWarningText(status.title);
      copy.appendChild(detail);
    }
    item.append(createSourceBadge(source), copy);
    if ((status.state === 'error' || status.state === 'warning') && !collectionInProgress) {
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.className = 'source-retry';
      retry.textContent = 'Повторить';
      retry.setAttribute('aria-label', `Повторить сбор: ${sourceLabels[source] || source}`);
      retry.addEventListener('click', () => {
        queuedCollectSources = [source];
        collect().catch((error) => appendLog(`Ошибка повторного сбора: ${error.message}`));
      });
      item.appendChild(retry);
    }
    els.sourceStatuses.appendChild(item);
  }
  renderSourceConnectionStates();
}

function renderSourceConnectionStates() {
  for (const [source, input] of collectSourceInputs) {
    const view = sourceHealth.connectionState({
      selected: input.checked,
      permissionGranted: sourcePermissionStates[source] === true,
      status: collectStatuses[source] || null
    });
    const state = collectSourceStateElements[source];
    const choice = input.closest('.source-choice');
    if (state) state.textContent = view.label;
    if (choice) choice.dataset.state = view.state;
  }
}

async function refreshSourcePermissionStates() {
  if (!api?.permissions?.contains) {
    renderSourceConnectionStates();
    return;
  }
  const next = {};
  for (const [source] of collectSourceInputs) {
    const request = {
      origins: sourcePermissionOrigins[source] || [],
      ...(source === 'wildberries' ? { permissions: ['cookies'] } : {})
    };
    try {
      next[source] = await callChrome(api.permissions.contains, request) === true;
    } catch {
      next[source] = false;
    }
  }
  sourcePermissionStates = next;
  renderSourceConnectionStates();
}

function setCollectStatuses(sources, state, label) {
  collectStatuses = Object.fromEntries(sources.map((source) => [source, { state, label }]));
  renderSourceStatuses();
}

function setCollectStatus(source, state, label, title = '') {
  if (!source || !collectStatuses[source]) return;
  collectStatuses[source] = { state, label, title };
  renderSourceStatuses();
}

function updateCsvButton() {
  const records = csvExportRows();
  const text = `Скачать таблицу (${records.length})`;
  els.downloadCsv.disabled = records.length === 0;
  els.downloadCsv.textContent = text;
  els.runDownloadCsv.disabled = records.length === 0;
  els.runDownloadCsv.textContent = text;
}

function formatRunTime(date) {
  return date
    ? date.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    : '';
}

function renderRunSummary() {
  const show = Boolean(lastRunAt);
  els.runSummary.hidden = !show;
  els.runDetails.classList.toggle('collapsed', show && !runDetailsOpen);
  els.runDownloadCsv.hidden = show && runDetailsOpen;
  els.toggleRunDetails.textContent = runDetailsOpen ? 'Скрыть детали' : 'Подробнее';
  if (!show) return;

  const total = rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  const warnings = lastWarningCount ? ` · предупреждений: ${lastWarningCount}` : '';
  els.runSummaryText.textContent = `${lastRunKind}: ${formatCount(rows.length, ['операция', 'операции', 'операций'])} · ${formatRub(total)}${warnings} · ${formatRunTime(lastRunAt)}`;
}

function finishRun(kind, warningCount = 0) {
  lastRunAt = new Date();
  lastRunKind = kind;
  lastWarningCount = warningCount;
  runDetailsOpen = false;
  renderRunSummary();
  renderHomeGuide();
  return storeLastRun();
}

function appendLog(text, key = '') {
  const stamp = new Date().toLocaleTimeString('ru-RU', { hour12: false });
  const line = `[${stamp}] ${text}`;
  if (key && logLineByKey.has(key)) {
    const index = logLineByKey.get(key);
    if (index >= 0 && index < logLines.length) {
      logLines[index] = line;
      scheduleRenderLog();
      return;
    }
  }

  logLines.push(line);
  if (key) logLineByKey.set(key, logLines.length - 1);

  const trimmedCount = Math.max(0, logLines.length - 500);
  if (trimmedCount) logLines = logLines.slice(trimmedCount);
  if (logLineByKey.size) {
    for (const [savedKey, index] of logLineByKey) {
      const shiftedIndex = index - trimmedCount;
      if (shiftedIndex >= 0 && shiftedIndex < logLines.length) logLineByKey.set(savedKey, shiftedIndex);
      else logLineByKey.delete(savedKey);
    }
  }
  scheduleRenderLog();
}

function progressLogKey(text) {
  const value = String(text || '');
  if (/^Ozon: найдено \d+, API-страница/.test(value)) return 'ozon-api';
  if (/^Ozon: PDF \d+\/\d+/.test(value)) return 'ozon-pdf';
  if (/^Wildberries: найдено чеков \d+, API-страница/.test(value)) return 'wb-api';
  if (/^Wildberries: чеки \d+\/\d+/.test(value)) return 'wb-html';
  if (/^Яндекс Маркет: найдено заказов/.test(value)) return 'yandex-orders';
  if (/^Яндекс Маркет: чеки \d+\/\d+.*ссылок/.test(value)) return 'yandex-links';
  if (/^Яндекс Маркет: чеки \d+\/\d+/.test(value)) return 'yandex-html';
  if (/^Яндекс Маркет: 429/.test(value)) return 'yandex-429';
  if (/^Яндекс Маркет: batch /.test(value)) return 'yandex-batch';
  return '';
}

function selectedCollectSources() {
  return collectSourceInputs
    .filter(([, input]) => input.checked)
    .map(([source]) => source);
}

function setMutationControlsDisabled(disabled) {
  const effectiveDisabled = Boolean(disabled || storageConflict || persistencePendingCount > 0);
  const controls = [
    els.overallBudgetAmount,
    els.saveOverallBudget,
    els.budgetCategory,
    els.budgetAmount,
    els.saveBudget,
    els.copyBudgetNextMonth,
    els.closeMonth,
    els.monthCloseAction,
    els.activeProfileSelect,
    els.dataProfileSelect,
    els.addDataProfile,
    els.renameDataProfile,
    els.deleteDataProfile,
    els.dataProfileName,
    els.importDataBackup,
    els.categoryRulePattern,
    els.categoryRuleCategory,
    els.saveCategoryRule,
    els.deleteAllData,
    els.operationCategorySelect,
    els.operationCategoryInput,
    els.operationProfileSelect,
    els.operationNote,
    els.operationExcluded,
    els.markRefundClaim,
    els.markWarranty,
    els.operationWarrantyUntil,
    els.operationDocumentUrl,
    els.operationWarrantyNote,
    els.operationApplySimilar,
    els.operationSave,
    els.bulkCategory,
    els.bulkProfile,
    els.bulkApply,
    els.bulkExclude,
    els.bulkInclude,
    els.bulkClear
  ];
  for (const control of controls) {
    if (control) control.disabled = effectiveDisabled || demoMode;
  }
  if (els.homeGuidePrimary) els.homeGuidePrimary.disabled = effectiveDisabled;
  if (els.homeGuideSecondary) els.homeGuideSecondary.disabled = effectiveDisabled;
  if (els.onboardingStart) {
    els.onboardingStart.disabled = effectiveDisabled || selectedCollectSources().length === 0;
  }
  for (const control of document.querySelectorAll(
    '#detailRows .detail-edit, #detailRows .category-pill, #budgetBreakdown button, #refundClaims button, #dataHistoryList button, #categoryRuleList button, #operationOverridesList button, #controlView button, #controlView select'
  )) {
    control.disabled = effectiveDisabled || demoMode;
  }
  if (!effectiveDisabled) renderProfiles();
}

function beginDatabaseMutation(message = 'Дождитесь завершения текущей операции.') {
  if (collectionInProgress || databaseMutationInProgress) {
    setStatus(message);
    return false;
  }
  databaseMutationInProgress = true;
  els.collect.disabled = true;
  els.uploadCsv.disabled = true;
  setMutationControlsDisabled(true);
  databaseMutationGeneration += 1;
  return databaseMutationGeneration;
}

function endDatabaseMutation(generation = databaseMutationGeneration) {
  if (generation !== databaseMutationGeneration) return;
  databaseMutationInProgress = false;
  if (collectionInProgress) return;
  els.collect.disabled = false;
  els.uploadCsv.disabled = false;
  setMutationControlsDisabled(false);
}

async function ensureSourcePermissions(sources) {
  if (!api?.permissions?.request) return;
  const request = {
    origins: [...new Set(sources.flatMap((source) => sourcePermissionOrigins[source] || []))],
    ...(sources.includes('wildberries') ? { permissions: ['cookies'] } : {})
  };
  if (!request.origins.length) return;
  const granted = await callChrome(api.permissions.request, request);
  if (!granted) {
    throw new Error('не предоставлен доступ к выбранным маркетплейсам. Повторите сбор и разрешите доступ в диалоге браузера');
  }
  await refreshSourcePermissionStates();
}

async function revokeSourcePermissions() {
  if (!api?.permissions?.remove) return;
  const removed = await callChrome(api.permissions.remove, {
    permissions: ['cookies'],
    origins: [...new Set(Object.values(sourcePermissionOrigins).flat())]
  });
  if (!removed) throw new Error('браузер не подтвердил отзыв доступов');
  await refreshSourcePermissionStates();
  setStatus('Доступ к маркетплейсам отозван. При следующем сборе браузер запросит его снова.');
  appendLog('Опциональные доступы к маркетплейсам отозваны.');
}

async function checkStorageHealth() {
  if (!navigator.storage) return;
  try {
    await navigator.storage.persist?.();
    const estimate = await navigator.storage.estimate?.();
    const usage = Number(estimate?.usage);
    const quota = Number(estimate?.quota);
    if (Number.isFinite(usage) && Number.isFinite(quota) && quota > 0) {
      const ratio = usage / quota;
      appendLog(`Локальное хранилище: занято ${Math.round(usage / 1024 / 1024)} МБ из ${Math.round(quota / 1024 / 1024)} МБ.`);
      if (ratio >= 0.85) {
        showWarnings([
          ...lastCollectionReport.warnings,
          'Локальное хранилище браузера заполнено более чем на 85%. Скачайте резервную копию перед следующим сбором.'
        ]);
      }
    }
  } catch (error) {
    appendLog(`Предупреждение: не удалось проверить свободное место: ${error.message}`);
  }
}

function updateProgressFill() {
  const colors = selectedCollectSources().map((source) => sourceColors[source]);
  els.progress.style.setProperty(
    '--progress-fill',
    colors.length > 1 ? `linear-gradient(90deg, ${colors.join(', ')})` : (colors[0] || 'var(--primary)')
  );
}

function setStatus(text, progressValue = null, progressMax = null) {
  els.statusText.textContent = text;
  const unknownApiPages = progressMax !== null
    && progressMax >= 1000
    && /API-страница/.test(text);

  if (unknownApiPages) {
    els.progress.removeAttribute('value');
    els.progress.max = 1;
    return;
  }

  if (progressMax !== null) els.progress.max = progressMax;
  if (progressValue !== null) els.progress.value = progressValue;
  else if (!els.progress.hasAttribute('value')) els.progress.value = 0;
}

function friendlyWarningText(value) {
  const text = String(value || '').trim().replace(/\s+/g, ' ');
  if (!text) return '';
  if (/не предоставлен доступ|permission|доступ.*не (?:выдан|предоставлен)/i.test(text)) {
    return 'Браузер не дал доступ к выбранным магазинам. Запустите сбор ещё раз и нажмите «Разрешить» в его окне.';
  }
  if (/авторизац|войдите|входа|login|unauthorized|401\b/i.test(text)) {
    return 'Один из магазинов не увидел вход в аккаунт. Откройте его сайт, войдите и повторите сбор только для этого магазина.';
  }
  if (/достигнут лимит страниц|список .*непол/i.test(text)) {
    return 'Загрузилась не вся старая история. Уже найденные покупки сохранены; проблемный магазин можно повторить отдельно.';
  }
  if (/состав не распознан|без состава|не разобрано чеков/i.test(text)) {
    return 'Некоторые чеки найдены, но список товаров в них прочитать не удалось. Их итоговые суммы сохранены.';
  }
  if (/без сверки итога|не распознан итог|полнота состава не подтверждена/i.test(text)) {
    return 'Покупки сохранены, но для части чеков не удалось сравнить их с итоговой суммой.';
  }
  if (/Failed to fetch|network|сеть|429\b|временно/i.test(text)) {
    return 'Магазин временно не ответил. Подождите немного и повторите сбор для него.';
  }
  return text.length > 280 ? `${text.slice(0, 277)}…` : text;
}

function isCollectionCompletenessWarning(value) {
  return /состав не распознан|без состава|не разобрано чеков|без сверки итога|не распознан итог|полнота состава не подтверждена/i
    .test(String(value || ''));
}

function showWarnings(warnings = []) {
  const visibleWarnings = warnings.filter(Boolean).map(String);
  els.warningBanner.hidden = visibleWarnings.length === 0;
  if (!visibleWarnings.length) {
    els.warningTitle.textContent = '';
    els.warningText.textContent = '';
    return;
  }
  const accessDenied = visibleWarnings.some((warning) => /не предоставлен доступ|permission/i.test(warning));
  const completenessOnly = visibleWarnings.every(isCollectionCompletenessWarning);
  els.warningTitle.textContent = accessDenied
    ? 'Нужен доступ браузера'
    : completenessOnly ? 'Данные собраны с ограничениями' : 'Не всё получилось';
  els.warningText.textContent = [...new Set(visibleWarnings.map(friendlyWarningText))].join(' ');
}

function showUpdateBanner(version) {
  clearNode(els.updateBanner);
  const text = document.createElement('span');
  text.textContent = `Доступна версия ${version}.`;
  const link = document.createElement('a');
  link.href = globalThis.MarketTratUpdate.latestReleaseUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = 'Скачать обновление';
  const help = document.createElement('a');
  help.href = globalThis.MarketTratUpdate.updateHelpUrl;
  help.target = '_blank';
  help.rel = 'noopener noreferrer';
  help.textContent = 'Как обновиться';
  els.updateBanner.append(text, link, help);
  els.updateBanner.hidden = false;
}

async function checkForUpdate() {
  const update = globalThis.MarketTratUpdate;
  const current = api?.runtime?.getManifest?.().version || '';
  if (!update || !current) return;

  try {
    const response = await fetch(update.releaseApiUrl, {
      cache: 'no-store',
      headers: { accept: 'application/vnd.github+json' }
    });
    if (!response.ok) return;

    const release = await response.json();
    const latest = update.normalizeVersion(release.tag_name || release.name);
    if (latest && update.isNewerVersion(latest, current)) showUpdateBanner(latest);
  } catch {
    // Update checks are best effort; the extension works offline.
  }
}

async function loadCategoryRulePack() {
  const setRules = globalThis.setSpendCategoryRules;
  if (typeof setRules !== 'function') return;

  let payload = null;
  try {
    const localUrl = api?.runtime?.getURL?.('category-rules.json');
    if (localUrl) {
      const response = await fetch(localUrl, { cache: 'no-store' });
      if (response.ok) payload = await response.json();
    }
  } catch {
    // Missing local pack is fine; the built-in classifier still works.
  }

  const count = payload ? setRules(payload) : 0;
  if (!count || !sourceRows.length) return;

  sourceRows = sourceRows.map((row) => prepareSourceRow({
    ...row,
    category: Object.prototype.hasOwnProperty.call(row, 'base_category') ? row.base_category : row.category
  }));
  applyAppPreferences();
  updateCsvButton();
  updateAnalytics();
  renderRunSummary();
}

function unreadReceiptCount(stats = {}) {
  return ['ozon', 'wildberries', 'yandex'].reduce((sum, source) => {
    const item = stats[source] || {};
    const receipts = Number(item.receipts) || 0;
    const parsed = Number(item.parsedReceipts) || 0;
    return sum + Math.max(0, receipts - parsed);
  }, 0);
}

function normalizeCollectionReport(value) {
  const report = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const sources = [...new Set((Array.isArray(report.sources) ? report.sources : [])
    .filter((source) => sourcePermissionOrigins[source]))];
  const stats = report.stats && typeof report.stats === 'object' && !Array.isArray(report.stats)
    ? report.stats
    : {};
  const warnings = (Array.isArray(report.warnings) ? report.warnings : [])
    .map(String)
    .filter(Boolean)
    .filter((warning) => !/агрегатная предоплата сверена с полным расч[её]том/i.test(warning))
    .slice(0, 20);
  return { sources, stats, warnings };
}

function warningCountAfterNormalization(storedCount, rawCollection, normalizedCollection) {
  const count = Math.max(0, Number(storedCount) || 0);
  const rawWarnings = Array.isArray(rawCollection?.warnings) ? rawCollection.warnings.filter(Boolean).length : 0;
  const normalizedWarnings = Array.isArray(normalizedCollection?.warnings) ? normalizedCollection.warnings.length : rawWarnings;
  return Math.max(0, count - Math.max(0, rawWarnings - normalizedWarnings));
}

function restoreSourceStatusesFromReport() {
  const report = normalizeCollectionReport(lastCollectionReport);
  collectStatuses = {};
  for (const source of report.sources) {
    const sourceWarnings = report.warnings.filter((item) => sourceFromProgress(item) === source);
    const warning = sourceWarnings.find((item) => !isCollectionCompletenessWarning(item));
    const incomplete = sourceWarnings.find(isCollectionCompletenessWarning);
    const diagnostic = sourceDiagnostic(source, report.stats);
    if (warning) collectStatuses[source] = { state: 'error', label: 'ошибка', title: warning };
    else if (incomplete) collectStatuses[source] = { state: 'warning', label: 'есть пропуски', title: incomplete };
    else if (diagnostic) collectStatuses[source] = {
      state: diagnostic.warning ? 'warning' : 'done',
      label: diagnostic.label,
      title: diagnostic.title
    };
    else collectStatuses[source] = { state: 'done', label: 'готово' };
  }
  renderSourceStatuses();
}

function sourceDiagnostic(source, stats = {}) {
  return sourceHealth.diagnostic(source, stats, sourceLabels);
}

function renderQualitySummary(rawRecords = [], stats = {}, cleaningStats = {}, warnings = []) {
  clearNode(els.qualitySummary);
  const hasAnything = rawRecords.length || rows.length || warnings.length;
  els.qualitySummary.hidden = !hasAnything;
  if (!hasAnything) return;

  const addCard = (title, lines, kind = '') => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `quality-card ${kind}`.trim();
    const strong = document.createElement('strong');
    strong.textContent = title;
    const text = document.createElement('span');
    text.textContent = lines.filter(Boolean).join(' · ');
    card.append(strong, text);
    card.addEventListener('click', () => setActiveView('log'));
    els.qualitySummary.appendChild(card);
  };

  addCard('Результат', [
    formatCount(rows.length, ['операция', 'операции', 'операций']),
    rawRecords.length ? `получено ${rawRecords.length}` : '',
    cleaningStats.duplicateRowsDropped ? `повторов убрано ${cleaningStats.duplicateRowsDropped}` : ''
  ]);

  for (const source of ['ozon', 'wildberries', 'yandex']) {
    const item = stats[source] || {};
    const receipts = Number(item.receipts) || 0;
    const parsed = Number(item.parsedReceipts) || 0;
    const unread = Math.max(0, receipts - parsed);
    if (!receipts && !item.itemRows && !item.orders) continue;
    addCard(sourceLabels[source] || source, [
      receipts ? `чеков ${parsed}/${receipts}` : '',
      item.itemRows ? `строк ${item.itemRows}` : '',
      item.fallbackReceipts ? `без состава ${item.fallbackReceipts}` : '',
      item.unverifiedReceipts ? `без сверки итога ${item.unverifiedReceipts}` : '',
      item.noReceiptOrders ? `без чеков ${item.noReceiptOrders}` : '',
      item.failedOrders ? `ошибок заказов ${item.failedOrders}` : '',
      item.limitReached ? 'достигнут лимит страниц' : '',
      item.paginationIncomplete ? 'список загружен не полностью' : '',
      unread ? `не прочитано ${unread}` : ''
    ], unread || item.failedOrders || item.fallbackReceipts || item.unverifiedReceipts || item.limitReached || item.paginationIncomplete ? 'warning' : '');
  }

  if (cleaningStats.refundRows || cleaningStats.serviceRowsPreserved) {
    addCard('Очистка', [
      cleaningStats.refundRows ? `возвраты ${formatRub(cleaningStats.refundAmount)}` : '',
      cleaningStats.serviceRowsPreserved ? `доставка и сборы ${cleaningStats.serviceRowsPreserved}` : ''
    ]);
  }

  if (warnings.length) {
    addCard('Предупреждения', [`${warnings.length}`, warnings[0]], 'warning');
  }
}

function csvCell(value, neutralizeFormula = true) {
  if (value === null || value === undefined) return '';
  let text = String(value);
  if (neutralizeFormula && /^[\t\r\n ]*[=+@-]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function makeCsv(records) {
  const lines = [csvColumns.map((column) => column.header).join(',')];
  for (const record of records) {
    lines.push(csvColumns.map((column) => csvCell(record[column.field], column.field !== 'amount')).join(','));
  }
  return `${lines.join('\n')}\n`;
}

function dedupeRows(records) {
  return globalThis.mergeSpendRows
    ? globalThis.mergeSpendRows(records)
    : { rows: records, duplicates: 0 };
}

function ozonOrderIdFromRow(row) {
  return String(row?.raw_title || '').match(/Заказ\s*№\s*(\S+)/iu)?.[1] || '';
}

function legacyOzonSettlementDuplicateCount(records) {
  const signatures = new Map();
  for (const row of records || []) {
    if (row?.source !== 'ozon' || row?.ozon_settlement_kind || rowAmount(row) <= 0 || isFallbackCollectedRow(row)) continue;
    const orderId = ozonOrderIdFromRow(row);
    const receipt = String(row.receipt_url || row.marketplace_id || '').trim();
    const title = normalizeKeyText(row.title);
    const amount = Math.round(Math.abs(rowAmount(row)) * 100);
    if (!orderId || !receipt || !title || !amount) continue;
    const signature = `${orderId}\u0001${title}\u0001${amount}`;
    const receipts = signatures.get(signature) || new Set();
    receipts.add(receipt);
    signatures.set(signature, receipts);
  }
  return [...signatures.values()].filter((receipts) => receipts.size > 1).length;
}

function needsOzonSettlementRepair(records) {
  return legacyOzonSettlementDuplicateCount(records) > 0;
}

function collectKnownReceipts(records) {
  const result = {
    ozon: [],
    wildberries: [],
    yandexOrders: []
  };
  const seen = Object.fromEntries(Object.keys(result).map((key) => [key, new Set()]));

  function add(bucket, value) {
    const key = String(value || '').trim();
    if (!key || !result[bucket] || seen[bucket].has(key) || result[bucket].length >= knownReceiptLimit) return;
    seen[bucket].add(key);
    result[bucket].push(key);
  }

  const forceFullOzonScan = needsOzonSettlementRepair(records);
  const newestFirst = [...records].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  for (const row of newestFirst) {
    const source = row.source;
    if (source === 'ozon' || source === 'wildberries') {
      if (source === 'ozon' && forceFullOzonScan) continue;
      add(source, row.marketplace_id);
      add(source, row.receipt_url);
    } else if (source === 'yandex') {
      add('yandexOrders', String(row.marketplace_id || '').split(':')[0]);
    }
  }

  return result;
}

function hasKnownReceipts(knownReceipts) {
  return Object.values(knownReceipts || {}).some((items) => items?.length);
}

function collectedReceiptKey(row) {
  const source = String(row?.source || '').trim();
  const receipt = String(row?.receipt_url || row?.marketplace_id || '').trim();
  return source && receipt ? `${source}\u0001${receipt}` : '';
}

function isFallbackCollectedRow(row) {
  return row?.parse_quality === 'fallback'
    || /(?:не разобран|состав не распознан)/i.test(`${row?.title || ''} ${row?.raw_title || ''}`);
}

function receiptGroupQuality(rows) {
  return {
    fallback: rows.length > 0 && rows.every(isFallbackCollectedRow),
    explicitlyComplete: rows.length > 0 && rows.every((row) => row?.parse_quality === 'complete'),
    count: rows.length,
    absoluteTotal: rows.reduce((sum, row) => sum + Math.abs(Number(row?.amount) || 0), 0)
  };
}

function mergeCollectedRows(existingRows, collectedRows, supersededReceiptKeys = []) {
  if (!existingRows.length) return collectedRows;
  const explicitReplacementKeys = new Set(Array.isArray(supersededReceiptKeys) ? supersededReceiptKeys : []);
  const collectedGroups = new Map();
  for (const row of collectedRows) {
    const key = collectedReceiptKey(row);
    if (!key) continue;
    if (!collectedGroups.has(key)) collectedGroups.set(key, []);
    collectedGroups.get(key).push(row);
  }
  const existingGroups = new Map();
  for (const row of existingRows) {
    const key = collectedReceiptKey(row);
    if (!key) continue;
    if (!existingGroups.has(key)) existingGroups.set(key, []);
    existingGroups.get(key).push(row);
  }

  const preserveExistingKeys = new Set();
  for (const [key, oldRows] of existingGroups) {
    if (explicitReplacementKeys.has(key)) continue;
    const newRows = collectedGroups.get(key);
    if (!newRows) {
      preserveExistingKeys.add(key);
      continue;
    }
    const oldQuality = receiptGroupQuality(oldRows);
    const newQuality = receiptGroupQuality(newRows);
    if ((!oldQuality.fallback && newQuality.fallback)
      || (oldQuality.explicitlyComplete && !newQuality.explicitlyComplete)
      || (!newQuality.explicitlyComplete && !oldQuality.fallback && !newQuality.fallback
        && (newQuality.count < oldQuality.count
          || newQuality.absoluteTotal + 0.005 < oldQuality.absoluteTotal))) {
      preserveExistingKeys.add(key);
    }
  }

  const preservedRows = existingRows.filter((row) => {
    const key = collectedReceiptKey(row);
    return !key || preserveExistingKeys.has(key) || (!collectedGroups.has(key) && !explicitReplacementKeys.has(key));
  });
  const acceptedCollectedRows = collectedRows.filter((row) => {
    const key = collectedReceiptKey(row);
    return !key || !preserveExistingKeys.has(key);
  });
  return [...preservedRows, ...acceptedCollectedRows];
}

function rowAmount(row) {
  return Number(row.amount) || 0;
}

function isRefundRow(row) {
  return String(row.type || '').toLowerCase() === 'refund'
    || String(row.is_return || '') === '1'
    || rowAmount(row) < 0;
}

function withOperation(row) {
  const type = isRefundRow(row) ? 'refund' : 'purchase';
  const amount = Math.abs(rowAmount(row));
  return {
    ...row,
    amount: (type === 'refund' ? -amount : amount).toFixed(2),
    type,
    is_return: type === 'refund' ? '1' : '0'
  };
}

function withCategory(row) {
  const category = String(row.category || '').trim();
  const normalized = category === 'Пакеты и упаковка'
    ? 'Дом'
    : (category === 'Подписки' ? 'Цифровые покупки' : category);
  if (normalized && normalized.toLowerCase() !== 'unknown') {
    return {
      ...row,
      category: normalized,
      category_confidence: 1,
      category_origin: 'provided',
      category_reason: 'Категория уже была в исходных данных',
      category_evidence: [],
      category_candidates: [],
      category_needs_review: false
    };
  }
  const result = typeof globalThis.classifySpendCategory === 'function'
    ? globalThis.classifySpendCategory(row)
    : {
        category: globalThis.guessSpendCategory?.(row.title) || 'unknown',
        suggestedCategory: 'unknown',
        confidence: 0,
        evidence: [],
        candidates: [],
        needsReview: true,
        method: 'legacy'
      };
  const evidence = (Array.isArray(result.evidence) ? result.evidence : [])
    .map((item) => String(item?.token || item || '').trim())
    .filter(Boolean)
    .slice(0, 5);
  return {
    ...row,
    category: result.category || 'unknown',
    category_confidence: Number(result.confidence) || 0,
    category_origin: result.method || 'classifier',
    category_reason: evidence.length ? `Совпало: ${evidence.join(', ')}` : 'Уверенного совпадения нет',
    category_evidence: evidence,
    category_candidates: (Array.isArray(result.candidates) ? result.candidates : [])
      .slice(0, 3)
      .map((item) => ({ category: String(item.category || ''), score: Number(item.score) || 0 })),
    category_suggestion: result.suggestedCategory || 'unknown',
    category_needs_review: result.needsReview !== false
  };
}

function categoryName(category) {
  return categoryLabels[category] || category || categoryLabels.unknown;
}

function categoryColor(category) {
  if (String(category || '').startsWith('macro:')) return analyticsCore.macroColor(category);
  return categoryColors[category] || categoryColors.unknown;
}

function loadCategoryLevel() {
  return localStorage.getItem(categoryLevelStorageKey) === 'detail' ? 'detail' : 'macro';
}

function loadCategoryChartType() {
  const saved = localStorage.getItem(categoryChartTypeStorageKey);
  return saved === 'donut' || saved === 'tiles' ? saved : 'bars';
}

function loadPeriodChartMode() {
  return localStorage.getItem(periodChartModeStorageKey) === 'category' ? 'category' : 'source';
}

function normalizeKeyText(text) {
  return String(text || '')
    .replace(/\u00a0|\u202f/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function isServiceRow(row) {
  const title = String(row.title || '').trim();
  if (String(row.category || '').trim() === 'Доставка') return true;
  if (/^(доставк.*|компенсация доставки)$/i.test(title)) return true;
  if (row.source === 'wildberries') return /^(услуга доставки|комиссия сервиса)$/i.test(title);
  if (row.source === 'yandex') return /^(доставк.*|сервисный сбор|работа сервиса)$/i.test(title);
  return false;
}

function logParserStats(stats = {}) {
  for (const source of ['ozon', 'wildberries', 'yandex']) {
    const diagnostic = sourceDiagnostic(source, stats);
    if (diagnostic) appendLog(`Итог ${diagnostic.title}`, `diagnostic-${source}`);
  }

  const ozon = stats.ozon || {};
  const wb = stats.wildberries || {};
  const yandex = stats.yandex || {};
  const dropped = (ozon.duplicateRowsDropped || 0)
    + (ozon.prepaymentRowsDropped || 0)
    + (ozon.operationalRowsDropped || 0)
    + (ozon.adjustmentRowsDropped || 0);
  const ozonParts = [`${ozon.parsedReceipts || 0} / ${ozon.receipts || 0}`];
  if (ozon.itemRows) ozonParts.push(`строк ${ozon.itemRows}`);
  if (dropped) ozonParts.push(`отброшено ${dropped}`);
  if (ozon.deliveryRowsFolded) ozonParts.push(`доставка распределена ${ozon.deliveryRowsFolded}`);
  if (ozon.deliveryRowsDropped) ozonParts.push(`доставка удалена ${ozon.deliveryRowsDropped}`);
  if (ozon.receipts || ozon.itemRows || dropped || ozon.deliveryRowsFolded || ozon.deliveryRowsDropped) {
    appendLog(`Debug Ozon: PDF ${ozonParts.join(', ')}.`, 'debug-ozon-stats');
  }
  if (wb.receipts) {
    appendLog(`Debug Wildberries: чеков ${wb.receipts}.`, 'debug-wb-stats');
  }
  if (yandex.receipts || yandex.itemRows) {
    const parts = [`чеков ${yandex.parsedReceipts || 0} / ${yandex.receipts || 0}`];
    if (yandex.orders) parts.push(`заказов ${yandex.orders}`);
    if (yandex.archivedOrders) parts.push(`архивных ${yandex.archivedOrders}`);
    if (yandex.noReceiptOrders) parts.push(`без чеков ${yandex.noReceiptOrders}`);
    if (yandex.failedOrders) parts.push(`ошибок заказов ${yandex.failedOrders}`);
    if (yandex.itemRows) parts.push(`строк ${yandex.itemRows}`);
    if (yandex.prepaymentRowsDropped) parts.push(`предоплат отброшено ${yandex.prepaymentRowsDropped}`);
    appendLog(`Debug Яндекс Маркет: ${parts.join(', ')}.`, 'debug-yandex-stats');
  }
  if (stats.cleaning?.serviceRowsPreserved) {
    appendLog(`Debug: строк доставки и сборов сохранено ${stats.cleaning.serviceRowsPreserved}.`, 'debug-cleaning-stats');
  }
}

function selectedAnalyticsSources() {
  const sources = new Set();
  if (els.analyticsOzon.checked) sources.add('ozon');
  if (els.analyticsWb.checked) sources.add('wildberries');
  if (els.analyticsYandex.checked) sources.add('yandex');
  return sources;
}

function selectedAnalyticsSourceNames(sources = selectedAnalyticsSources()) {
  return [...sources].map((source) => sourceLabels[source] || source);
}

function resetAnalyticsFilters() {
  appSettings.activeProfile = 'all';
  localStorage.setItem(activeProfileStorageKey, appSettings.activeProfile);
  els.periodGroup.value = 'month';
  els.dateFrom.value = '';
  els.dateTo.value = '';
  els.quickPeriodSelect.value = 'all';
  els.detailSearch.value = '';
  els.analyticsOzon.checked = true;
  els.analyticsWb.checked = true;
  els.analyticsYandex.checked = true;
  selectedPeriodKey = '';
  detailFilter = null;
  detailOperation = 'all';
  selectedOperationRowIds.clear();
  resetDetailPaging();
  renderProfiles();
  syncDateInputs();
  updateAnalytics();
}

function detailFilterName() {
  if (!detailFilter) return '';
  if (detailFilter.type === 'period') return `детали: ${detailFilter.key}`;
  if (detailFilter.type === 'source') return `детали: ${sourceLabels[detailFilter.source] || detailFilter.source}`;
  if (detailFilter.type === 'category' || detailFilter.type === 'categories') {
    return `детали: ${detailFilter.label || categoryName(detailFilter.category)}`;
  }
  if (detailFilter.type === 'item') return `детали: ${detailFilter.label || detailFilter.title}`;
  return '';
}

function analyticsScopeName() {
  if (!detailFilter || detailFilter.type === 'period') return '';
  if (detailFilter.type === 'source') return sourceLabels[detailFilter.source] || detailFilter.source;
  if (detailFilter.type === 'category' || detailFilter.type === 'categories') {
    return detailFilter.label || categoryName(detailFilter.category);
  }
  if (detailFilter.type === 'item') return detailFilter.label || detailFilter.title;
  return '';
}

function renderActiveFilters(sources) {
  clearNode(els.activeFilters);
  const period = els.dateFrom.value || els.dateTo.value
    ? `${els.dateFrom.value || 'начало'} - ${els.dateTo.value || 'сегодня'}`
    : 'весь период';
  const sourceNames = selectedAnalyticsSourceNames(sources);
  const addChip = (text, clear) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'filter-token filter-token-action';
    chip.append(document.createTextNode(text));
    const close = document.createElement('span');
    close.className = 'filter-token-x';
    close.textContent = '×';
    chip.appendChild(close);
    chip.addEventListener('click', clear);
    els.activeFilters.appendChild(chip);
  };

  if (period !== 'весь период') addChip(`Период: ${period}`, () => applyQuickPeriod('all'));
  const profileName = appSettings.activeProfile === 'all'
    ? 'все'
    : (appSettings.profiles.find((profile) => profile.id === appSettings.activeProfile)?.name || appSettings.activeProfile);
  if (appSettings.activeProfile !== 'all') {
    addChip(`Покупки: ${profileName}`, () => {
      appSettings.activeProfile = 'all';
      renderProfiles();
      updateDateInputBounds();
      updateAnalytics();
    });
  }
  if (sourceNames.length !== 3) {
    addChip(`Магазины: ${sourceNames.length ? sourceNames.join(', ') : 'нет'}`, () => {
      els.analyticsOzon.checked = true;
      els.analyticsWb.checked = true;
      els.analyticsYandex.checked = true;
      updateAnalytics();
    });
  }
  if (els.periodGroup.value !== 'month') {
    addChip(`Показывать по: ${els.periodGroup.options[els.periodGroup.selectedIndex]?.textContent || els.periodGroup.value}`, () => {
      els.periodGroup.value = 'month';
      updateAnalytics();
    });
  }
  const detail = detailFilterName();
  if (detail) {
    addChip(detail, () => {
      detailFilter = null;
      resetDetailPaging();
      updateAnalytics();
    });
  }
  if (detailOperation !== 'all') addChip(`тип: ${operationLabel(detailOperation).toLowerCase()}`, () => setDetailOperation('all'));
  const search = els.detailSearch.value.trim();
  if (search) {
    addChip(`поиск: ${search}`, () => {
      els.detailSearch.value = '';
      resetDetailPaging();
      updateDetailsOnly();
    });
  }

  const hasFilters = period !== 'весь период'
    || sourceNames.length !== 3
    || appSettings.activeProfile !== 'all'
    || els.periodGroup.value !== 'month'
    || detailFilter
    || detailOperation !== 'all'
    || search;
  if (hasFilters) {
    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'filter-token filter-token-reset';
    reset.textContent = 'Сбросить всё';
    reset.addEventListener('click', resetAnalyticsFilters);
    els.activeFilters.appendChild(reset);
  }
  els.activeFilters.hidden = els.activeFilters.childElementCount === 0;
}

function setDateRange(from, to) {
  selectedOperationRowIds.clear();
  els.dateFrom.value = from || '';
  els.dateTo.value = to || '';
  syncDateInputs();
  updateAnalytics();
}

function applyQuickPeriod(period) {
  selectedPeriodKey = '';
  resetDetailPaging();
  if (els.quickPeriodSelect.value !== period) els.quickPeriodSelect.value = period || 'all';
  const range = quickPeriodRange(period);
  setDateRange(range.from, range.to);
}

function selectChartPeriod(key) {
  const range = periodBounds(key, els.periodGroup.value);
  if (!range) return;
  selectedPeriodKey = key;
  setDateRange(range.from, range.to);
}

function selectedDateRange() {
  return {
    from: dateInputValue(els.dateFrom.value),
    to: dateInputValue(els.dateTo.value)
  };
}

function csvExportIsFiltered() {
  const range = selectedDateRange();
  return range.from !== null
    || range.to !== null
    || selectedAnalyticsSources().size !== collectSourceInputs.length
    || appSettings.activeProfile !== 'all'
    || rows.some((row) => row.excluded === true);
}

function csvExportRows() {
  const sources = selectedAnalyticsSources();
  const range = selectedDateRange();
  const hasDateFilter = range.from !== null || range.to !== null;
  return rows.filter((row) => {
    if (!visibleRow(row)) return false;
    if (!sources.has(row.source)) return false;
    if (!hasDateFilter) return true;
    const date = parseRowDate(row.date);
    return date && isDateInRange(date, range);
  });
}

function dataExportRows() {
  return rows.slice();
}

function csvExportSuffix() {
  const range = selectedDateRange();
  const from = els.dateFrom.value || 'start';
  const to = els.dateTo.value || 'today';
  return range.from !== null || range.to !== null ? `${from}_${to}` : localInputDate(new Date());
}

function syncDateInputs() {
  if (els.dateFrom.value && els.dateTo.value && els.dateFrom.value > els.dateTo.value) {
    els.dateTo.value = els.dateFrom.value;
  }
  els.dateFrom.max = els.dateTo.value || els.dateFrom.dataset.max || '';
  els.dateTo.min = els.dateFrom.value || els.dateTo.dataset.min || '';
}

function updateDateInputBounds() {
  const dates = rows
    .filter(visibleRow)
    .map((row) => parseRowDate(row.date))
    .filter(Boolean)
    .map((date) => date.toISOString().slice(0, 10))
    .sort();
  const min = dates[0] || '';
  const max = dates[dates.length - 1] || '';

  for (const input of [els.dateFrom, els.dateTo]) {
    input.dataset.min = min;
    input.dataset.max = max;
    input.min = min;
    input.max = max;
    if (input.value && ((min && input.value < min) || (max && input.value > max))) input.value = '';
  }
  syncDateInputs();
}

function totalForRange(sources, range, group) {
  return rows.reduce((sum, row) => {
    if (!visibleRow(row)) return sum;
    if (!sources.has(row.source)) return sum;
    const date = parseRowDate(row.date);
    if (!date || !isDateInRange(date, range)) return sum;
    if (!matchesAnalyticsFilter(row, group)) return sum;
    return sum + (Number(row.amount) || 0);
  }, 0);
}

function recordsForRange(sources, range, group, ignoreCategoryFilter = false) {
  return rows.filter((row) => {
    if (!visibleRow(row)) return false;
    if (!sources.has(row.source)) return false;
    const date = parseRowDate(row.date);
    return date
      && isDateInRange(date, range)
      && matchesAnalyticsFilter(row, group, ignoreCategoryFilter);
  });
}

function buildAnalyticsData(sources, group, ignoreCategoryFilter = false) {
  const range = selectedDateRange();
  const records = [];
  const periods = new Map();

  let total = 0;
  for (const row of rows) {
    if (!visibleRow(row)) continue;
    if (!sources.has(row.source)) continue;
    const date = parseRowDate(row.date);
    if (!date) continue;
    if (!isDateInRange(date, range)) continue;
    if (!matchesAnalyticsFilter(row, group, ignoreCategoryFilter)) continue;

    const key = periodKey(date, group);
    if (!periods.has(key)) {
      periods.set(key, {
        key,
        total: 0,
        expenses: 0,
        refunds: 0,
        rows: 0,
        bySource: {},
        byCategory: {}
      });
    }
    const item = periods.get(key);
    const amount = rowAmount(row);
    records.push(row);
    total += amount;
    item.total += amount;
    item.bySource[row.source] = (item.bySource[row.source] || 0) + amount;
    item.byCategory[row.category || 'unknown'] = (item.byCategory[row.category || 'unknown'] || 0) + amount;
    if (amount >= 0) item.expenses += amount;
    else item.refunds += Math.abs(amount);
    item.rows += 1;
  }
  return {
    records,
    range,
    total,
    periods: [...periods.values()].sort((a, b) => a.key.localeCompare(b.key))
  };
}

function clearNode(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

function svgEl(name, attrs = {}, text = '') {
  const node = document.createElementNS(svgNamespace, name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  if (text) node.textContent = text;
  return node;
}

function cssVar(name, fallback) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function periodChartSegments(item, categoryOrder = new Map()) {
  const mode = els.periodChartMode.value;
  const values = mode === 'category' ? item.byCategory : item.bySource;
  const sourceOrder = new Map(collectSourceInputs.map(([source], index) => [source, index]));
  return Object.entries(values || {})
    .filter(([, amount]) => amount > 0)
    .sort((a, b) => {
      if (mode !== 'category') return (sourceOrder.get(a[0]) ?? 99) - (sourceOrder.get(b[0]) ?? 99);
      const left = categoryOrder.get(a[0]) ?? Number.MAX_SAFE_INTEGER;
      const right = categoryOrder.get(b[0]) ?? Number.MAX_SAFE_INTEGER;
      return left - right || b[1] - a[1];
    })
    .map(([key, amount]) => ({
      key,
      amount,
      label: mode === 'category' ? categoryName(key) : (sourceLabels[key] || key),
      color: mode === 'category' ? categoryColor(key) : (sourceColors[key] || '#2563eb')
    }));
}

function periodChartSegmentTitle(item, segment) {
  const share = item.total ? Math.round((segment.amount / item.total) * 100) : 0;
  return `${item.key}: ${formatRub(item.total)}\n${segment.label}: ${share}% (${formatRub(segment.amount)})`;
}

function renderPeriodChart(periods, categoryOrder = new Map()) {
  const svg = els.periodChart;
  clearNode(svg);

  const width = 960;
  const height = 300;
  const margin = { top: 18, right: 22, bottom: 44, left: 62 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const mutedColor = cssVar('--muted', '#6b7280');
  const borderColor = cssVar('--border', '#e5e7eb');
  const borderStrongColor = cssVar('--border-strong', '#9ca3af');
  const dangerColor = cssVar('--danger', '#dc2626');

  if (!periods.length) {
    svg.appendChild(svgEl('text', {
      x: width / 2,
      y: height / 2,
      'text-anchor': 'middle',
      fill: mutedColor,
      'font-size': 14
    }, 'Нет данных для выбранной выборки'));
    return;
  }

  const values = periods.map((item) => item.total);
  let maxValue = Math.max(0, ...values);
  let minValue = Math.min(0, ...values);
  if (maxValue === minValue) {
    maxValue += 1;
    minValue -= 1;
  }

  const yFor = (value) => margin.top + ((maxValue - value) / (maxValue - minValue)) * plotHeight;
  const baseline = yFor(0);

  for (let index = 0; index <= 4; index += 1) {
    const value = minValue + ((maxValue - minValue) * index) / 4;
    const y = yFor(value);
    svg.appendChild(svgEl('line', {
      x1: margin.left,
      x2: width - margin.right,
      y1: y,
      y2: y,
      stroke: value === 0 ? borderStrongColor : borderColor,
      'stroke-width': value === 0 ? 1.4 : 1
    }));
    svg.appendChild(svgEl('text', {
      x: margin.left - 10,
      y: y + 4,
      'text-anchor': 'end',
      fill: mutedColor,
      'font-size': 11
    }, compactAmount(value)));
  }

  const slot = plotWidth / periods.length;
  const barWidth = Math.max(3, Math.min(42, slot * 0.68));
  const labelStep = Math.max(1, Math.ceil(periods.length / 9));

  periods.forEach((item, index) => {
    const center = margin.left + slot * index + slot / 2;
    const barX = center - barWidth / 2;
    const barAttrs = {
      class: 'chart-bar',
      role: 'button',
      tabindex: 0,
      'aria-label': `${item.key}: ${formatRub(item.total)}`
    };
    const activate = () => {
      detailFilter = { type: 'period', key: item.key };
      selectChartPeriod(item.key);
      scrollDetailsIntoView();
    };
    const onKeydown = (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        activate();
      }
    };
    const segments = periodChartSegments(item, categoryOrder);
    const tooltipParts = segments.map((segment) => periodChartSegmentTitle(item, segment).split('\n')[1]);
    const title = `${item.key}: ${formatRub(item.total)}${tooltipParts.length ? `\n${tooltipParts.join('\n')}` : ''}`;

    if (item.total <= 0 || !segments.length) {
      const y = yFor(item.total);
      const rect = svgEl('rect', {
        ...barAttrs,
        x: barX,
        y: item.total >= 0 ? y : baseline,
        width: barWidth,
        height: Math.max(1, Math.abs(baseline - y)),
        fill: dangerColor,
        stroke: selectedPeriodKey === item.key ? borderStrongColor : 'none',
        'stroke-width': selectedPeriodKey === item.key ? 2 : 0
      });
      rect.addEventListener('click', activate);
      rect.addEventListener('keydown', onKeydown);
      rect.appendChild(svgEl('title', {}, title));
      svg.appendChild(rect);
    } else {
      let stacked = 0;
      for (const segment of segments) {
        const { amount } = segment;
        const yTop = yFor(stacked + amount);
        const yBottom = yFor(stacked);
        const rect = svgEl('rect', {
          ...barAttrs,
          x: barX,
          y: yTop,
          width: barWidth,
          height: Math.max(1, yBottom - yTop),
          fill: segment.color,
          stroke: selectedPeriodKey === item.key ? borderStrongColor : 'none',
          'stroke-width': selectedPeriodKey === item.key ? 2 : 0
        });
        rect.addEventListener('click', activate);
        rect.addEventListener('keydown', onKeydown);
        rect.appendChild(svgEl('title', {}, periodChartSegmentTitle(item, segment)));
        svg.appendChild(rect);
        stacked += amount;
      }
    }

    if (index % labelStep === 0 || index === periods.length - 1) {
      svg.appendChild(svgEl('text', {
        x: center,
        y: height - 18,
        'text-anchor': 'middle',
        fill: mutedColor,
        'font-size': 11
      }, item.key));
    }
  });
}

function renderSourceBreakdown(records) {
  clearNode(els.sourceBreakdown);
  const totals = new Map();
  for (const row of records) {
    totals.set(row.source, (totals.get(row.source) || 0) + (Number(row.amount) || 0));
  }

  const entries = [...totals.entries()]
    .filter(([, total]) => total !== 0)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  if (!entries.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'Нет данных';
    els.sourceBreakdown.appendChild(empty);
    return;
  }

  const max = Math.max(...entries.map(([, total]) => Math.abs(total)), 1);
  for (const [source, total] of entries) {
    const row = document.createElement('div');
    row.className = 'breakdown-row';

    const label = document.createElement('div');
    label.className = 'breakdown-label';
    const name = document.createElement('span');
    name.className = 'source-label';
    name.append(createSourceBadge(source), document.createTextNode(sourceLabels[source] || source));
    const amount = document.createElement('strong');
    amount.textContent = formatRub(total);
    label.append(name, amount);

    const bar = document.createElement('div');
    bar.className = 'breakdown-bar';
    const fill = document.createElement('div');
    fill.className = 'breakdown-fill';
    fill.style.width = `${Math.max(3, Math.abs(total) / max * 100)}%`;
    fill.style.background = total >= 0 ? (sourceColors[source] || '#2563eb') : '#dc2626';
    bar.appendChild(fill);

    row.append(label, bar);
    makeClickable(row, () => setDetailFilter({ type: 'source', source }, true));
    els.sourceBreakdown.appendChild(row);
  }
}

function buildCategoryBreakdown(records, previousRecords = [], level = 'detail') {
  return analyticsCore.buildCategoryBreakdown(records, previousRecords, level);
}

function categoryCompareText(item) {
  if (!item.previousAmount) return item.amount ? 'новые траты' : '';
  const percent = Math.round(((item.amount - item.previousAmount) / Math.abs(item.previousAmount)) * 100);
  if (!percent) return 'как раньше';
  return `${percent > 0 ? '+' : ''}${percent}% к прошлому периоду`;
}

function categoryMetaText(item, total) {
  const percent = total ? Math.round((item.amount / total) * 100) : 0;
  const compare = categoryCompareText(item);
  return `${formatRub(item.amount)} · ${percent}% · ${formatCount(item.count, ['покупка', 'покупки', 'покупок'])}${compare ? ` · ${compare}` : ''}`;
}

function scrollDetailsIntoView() {
  setAnalyticsDetailsExpanded(true);
  requestAnimationFrame(() => {
    els.detailTitle.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function setAnalyticsDetailsExpanded(expanded) {
  const value = Boolean(expanded);
  document.body.classList.toggle('show-analytics-details', value);
  els.toggleAnalyticsDetails.setAttribute('aria-expanded', String(value));
  els.toggleAnalyticsDetails.textContent = value ? 'Скрыть подробный отчёт' : 'Показать подробный отчёт';
}

function setDetailFilter(filter, scroll = false) {
  selectedOperationRowIds.clear();
  detailFilter = filter;
  resetDetailPaging();
  updateAnalytics();
  if (scroll) scrollDetailsIntoView();
}

function setDetailOperation(operation, scroll = false) {
  selectedOperationRowIds.clear();
  detailOperation = operation || 'all';
  resetDetailPaging();
  updateDetailsOnly();
  if (scroll) scrollDetailsIntoView();
}

function showKpiDetails(operation) {
  detailFilter = null;
  els.detailSearch.value = '';
  setDetailOperation(operation, true);
}

function categoryDrillFilter(item) {
  return item.categories?.length
    ? { type: 'categories', categories: item.categories, label: item.label }
    : { type: 'category', category: item.category, label: item.label || categoryName(item.category) };
}

function categoryFilterCategories(filter = detailFilter) {
  if (filter?.type === 'category') return [filter.category];
  if (filter?.type === 'categories') return filter.categories || [];
  return [];
}

function categoryListLabel(categories) {
  const labels = categories.map(categoryName);
  return labels.length <= 3 ? labels.join(', ') : `${labels.slice(0, 3).join(', ')} +${labels.length - 3}`;
}

function categoryFilterFrom(categories) {
  if (!categories.length) return null;
  if (categories.length === 1) {
    return { type: 'category', category: categories[0], label: categoryName(categories[0]) };
  }
  return { type: 'categories', categories, label: categoryListLabel(categories) };
}

function toggleCategoryFilter(item) {
  const nextCategories = categoryFilterCategories(categoryDrillFilter(item));
  const currentCategories = categoryFilterCategories();
  if (!currentCategories.length) return categoryDrillFilter(item);

  const selected = new Set(currentCategories);
  for (const category of nextCategories) {
    if (selected.has(category)) selected.delete(category);
    else selected.add(category);
  }
  return categoryFilterFrom([...selected]);
}

function categoryIsSelected(item) {
  const selected = new Set(categoryFilterCategories());
  const categories = item.categories?.length ? item.categories : [item.category];
  return categories.some((category) => selected.has(category));
}

function createCategoryRow(item, total, max, showBar) {
  const row = document.createElement('div');
  row.className = categoryIsSelected(item) ? 'category-row selected' : 'category-row';
  row.style.setProperty('--category-color', categoryColor(item.category));

  const head = document.createElement('div');
  head.className = 'category-head';

  const title = document.createElement('span');
  title.className = 'category-title';
  const swatch = document.createElement('span');
  swatch.className = 'category-swatch';
  const name = document.createElement('span');
  name.className = 'category-name';
  name.textContent = item.label || categoryName(item.category);
  title.append(swatch, name);

  const meta = document.createElement('span');
  meta.className = 'category-meta';
  meta.textContent = categoryMetaText(item, total);
  head.append(title, meta);
  row.appendChild(head);

  if (showBar) {
    const bar = document.createElement('div');
    bar.className = 'category-bar';
    const fill = document.createElement('div');
    fill.className = 'category-fill';
    fill.style.width = `${Math.max(3, (item.amount / max) * 100)}%`;
    bar.appendChild(fill);
    row.appendChild(bar);
  }

  makeClickable(row, () => setDetailFilter(toggleCategoryFilter(item), true));
  return row;
}

function renderCategoryBars(entries, total) {
  const strip = document.createElement('div');
  strip.className = 'category-strip';
  for (const item of entries) {
    const percent = total ? (item.amount / total) * 100 : 0;
    const segment = document.createElement('span');
    segment.className = categoryIsSelected(item) ? 'category-strip-segment selected' : 'category-strip-segment';
    segment.style.width = `${Math.max(2, percent)}%`;
    segment.style.background = categoryColor(item.category);
    segment.title = `${item.label || categoryName(item.category)}: ${Math.round(percent)}%`;
    segment.setAttribute('aria-label', `Показать покупки: ${item.label || categoryName(item.category)}`);
    makeClickable(segment, () => setDetailFilter(toggleCategoryFilter(item), true));
    strip.appendChild(segment);
  }
  els.categoryBreakdown.appendChild(strip);

  const max = Math.max(...entries.map((item) => item.amount), 1);
  for (const item of entries) {
    els.categoryBreakdown.appendChild(createCategoryRow(item, total, max, true));
  }
}

function renderCategoryDonut(entries, total) {
  const wrap = document.createElement('div');
  wrap.className = 'category-donut-layout';
  const chart = svgEl('svg', {
    class: 'category-donut',
    viewBox: '0 0 160 160',
    role: 'img',
    'aria-label': 'Доли расходов по категориям'
  });
  chart.appendChild(svgEl('circle', {
    cx: 80,
    cy: 80,
    r: 54,
    fill: 'none',
    stroke: 'var(--border)',
    'stroke-width': 24
  }));

  const circumference = 2 * Math.PI * 54;
  let offset = 0;
  for (const item of entries) {
    const length = total ? (item.amount / total) * circumference : 0;
    const circle = svgEl('circle', {
      cx: 80,
      cy: 80,
      r: 54,
      fill: 'none',
      stroke: categoryColor(item.category),
      'stroke-width': 24,
      'stroke-dasharray': `${length} ${circumference - length}`,
      'stroke-dashoffset': -offset,
      transform: 'rotate(-90 80 80)'
    });
    circle.appendChild(svgEl('title', {}, `${item.label || categoryName(item.category)}: ${categoryMetaText(item, total)}`));
    chart.appendChild(circle);
    offset += length;
  }
  chart.appendChild(svgEl('text', {
    x: 80,
    y: 75,
    'text-anchor': 'middle',
    fill: 'currentColor',
    'font-size': 12,
    'font-weight': 700
  }, 'Всего'));
  chart.appendChild(svgEl('text', {
    x: 80,
    y: 94,
    'text-anchor': 'middle',
    fill: 'currentColor',
    'font-size': 14,
    'font-weight': 800
  }, compactAmount(total)));

  const legend = document.createElement('div');
  legend.className = 'category-donut-legend';
  const max = Math.max(...entries.map((item) => item.amount), 1);
  for (const item of entries) legend.appendChild(createCategoryRow(item, total, max, false));
  wrap.append(chart, legend);
  els.categoryBreakdown.appendChild(wrap);
}

function renderCategoryTiles(entries, total) {
  const grid = document.createElement('div');
  grid.className = 'category-tiles';
  for (const item of entries) {
    const tile = document.createElement('div');
    tile.className = categoryIsSelected(item) ? 'category-tile selected' : 'category-tile';
    tile.style.setProperty('--category-color', categoryColor(item.category));
    const name = document.createElement('strong');
    name.textContent = item.label || categoryName(item.category);
    const amount = document.createElement('span');
    amount.textContent = formatRub(item.amount);
    const meta = document.createElement('small');
    meta.textContent = `${total ? Math.round((item.amount / total) * 100) : 0}% · ${formatCount(item.count, ['покупка', 'покупки', 'покупок'])}`;
    tile.append(name, amount, meta);
    makeClickable(tile, () => setDetailFilter(toggleCategoryFilter(item), true));
    grid.appendChild(tile);
  }
  els.categoryBreakdown.appendChild(grid);
}

function renderCategoryBreakdown(records, previousRecords = []) {
  clearNode(els.categoryBreakdown);
  const { entries, total } = buildCategoryBreakdown(records, previousRecords, els.categoryLevel.value);

  els.categorySummary.textContent = entries.length ? formatCount(entries.length, ['категория', 'категории', 'категорий']) : '';

  if (!entries.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'Нет покупок в выборке';
    els.categoryBreakdown.appendChild(empty);
    return;
  }

  const tail = entries.slice(7);
  const visible = categoriesExpanded ? [...entries] : entries.slice(0, 7);
  if (tail.length && !categoriesExpanded) {
    visible.push({
      category: 'other',
      label: 'Остальное',
      categories: tail.map((item) => item.category),
      amount: tail.reduce((sum, item) => sum + item.amount, 0),
      count: tail.reduce((sum, item) => sum + item.count, 0),
      previousAmount: tail.reduce((sum, item) => sum + (item.previousAmount || 0), 0)
    });
  }

  const chartType = els.categoryChartType.value;
  if (chartType === 'donut') renderCategoryDonut(visible, total);
  else if (chartType === 'tiles') renderCategoryTiles(visible, total);
  else renderCategoryBars(visible, total);

  if (tail.length) {
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'secondary category-toggle';
    toggle.textContent = categoriesExpanded
      ? 'Свернуть категории'
      : `Показать остальные ${formatCount(tail.length, ['категорию', 'категории', 'категорий'])}`;
    toggle.addEventListener('click', () => {
      categoriesExpanded = !categoriesExpanded;
      updateAnalytics();
    });
    els.categoryBreakdown.appendChild(toggle);
  }
}

function categoryOptions(records = rows) {
  const names = new Set(Object.keys(categoryColors).filter((category) => !['other', 'Подписки'].includes(category)));
  // Keep old user data readable, but do not offer the obsolete automatic
  // label in a fresh profile. New digital purchases use “Цифровые покупки”.
  for (const row of records) names.add(row.category || 'unknown');
  return [...names].sort((a, b) => categoryName(a).localeCompare(categoryName(b), 'ru'));
}

function renderBudgetCategoryOptions(records) {
  const current = els.budgetCategory.value;
  clearNode(els.budgetCategory);
  for (const category of categoryOptions(records)) {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = categoryName(category);
    els.budgetCategory.appendChild(option);
  }
  if (current && [...els.budgetCategory.options].some((option) => option.value === current)) {
    els.budgetCategory.value = current;
  }
}

function categorySpend(records) {
  const totals = new Map();
  for (const row of records) {
    const amount = rowAmount(row);
    if (!amount) continue;
    const category = row.category || 'unknown';
    totals.set(category, (totals.get(category) || 0) + amount);
  }
  return totals;
}

// Kept as a small pure adapter for the existing netting regression test.
function budgetEntries(records) {
  const spent = categorySpend(records);
  const configured = typeof budgets !== 'undefined' ? budgets : budgetPlan().categories;
  return Object.entries(configured)
    .map(([category, limit]) => ({
      category,
      limit: Number(limit),
      spent: Math.max(0, spent.get(category) || 0)
    }))
    .filter((item) => Number.isFinite(item.limit) && item.limit > 0)
    .sort((left, right) => (right.spent / right.limit) - (left.spent / left.limit));
}

function budgetPlanKey(month) {
  return appSettings.activeProfile === 'all' ? month : `${appSettings.activeProfile}\u0001${month}`;
}

function budgetPlan(month = els.budgetMonth.value || currentMonthKey(), create = false) {
  const key = budgetPlanKey(month);
  if (!appSettings.budgets[key] && create) {
    appSettings.budgets[key] = { total: null, categories: {} };
  }
  return appSettings.budgets[key] || { total: null, categories: {} };
}

function budgetDateForMonth(month) {
  const match = String(month || '').match(/^(\d{4})-(\d{2})$/);
  if (!match) return new Date();
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const selected = year * 12 + monthIndex;
  const today = new Date();
  const current = today.getFullYear() * 12 + today.getMonth();
  if (selected < current) return new Date(year, monthIndex + 1, 0);
  if (selected > current) return new Date(year, monthIndex, 1);
  return today;
}

function budgetSummary(month = els.budgetMonth.value || currentMonthKey()) {
  return preferences.buildBudgetSummary(
    rows.filter((row) => rowMatchesActiveProfile(row)),
    budgetPlan(month),
    budgetDateForMonth(month)
  );
}

function budgetAlertLines(
  records = rows.filter(visibleRow),
  month = els.budgetMonth.value || currentMonthKey()
) {
  return preferences.buildBudgetSummary(records, budgetPlan(month), budgetDateForMonth(month)).categories
    .filter((item) => item.limit > 0 && item.percent >= 90)
    .slice(0, 3)
    .map((item) => {
      const diff = item.spent - item.limit;
      return diff > 0
        ? `${categoryName(item.category)}: выше бюджета на ${formatRub(diff)}`
        : `${categoryName(item.category)}: осталось ${formatRub(-diff)}`;
    });
}

function closureScopeKey(month, profile = appSettings.activeProfile) {
  return `${profile}\u0001${month}`;
}

function monthClosuresForActiveProfile() {
  const prefix = `${appSettings.activeProfile}\u0001`;
  return Object.entries(appSettings.monthClosures || {})
    .filter(([key]) => key.startsWith(prefix))
    .map(([, closure]) => closure);
}

function historicalBudgetTemplate(month) {
  return lifecycle.buildNextMonthBudgetTemplate(monthClosuresForActiveProfile(), { month });
}

function renderBudgets() {
  const month = els.budgetMonth.value || currentMonthKey();
  if (!els.budgetMonth.value) els.budgetMonth.value = month;
  const plan = budgetPlan(month);
  const summary = budgetSummary(month);
  const history = historicalBudgetTemplate(month);
  renderBudgetCategoryOptions(rows.filter(visibleRow));
  els.overallBudgetAmount.value = plan.total || '';
  if (summary.limit) {
    const prefix = summary.status === 'over'
      ? `Лимит превышен на ${formatRub(Math.abs(summary.remaining))}.`
      : `Осталось ${formatRub(summary.remaining)}.`;
    const baseline = history.sufficientHistory
      ? ` Среднее по закрытым месяцам: ${formatRub(history.estimate.total)} (${history.sourceMonths.join(', ')}).`
      : ` Исторической оценки пока нет: ${history.reason}`;
    els.budgetForecastStatus.textContent = `Потрачено ${formatRub(summary.spent)} из ${formatRub(summary.limit)}. ${prefix}${baseline}`;
  } else {
    els.budgetForecastStatus.textContent = history.sufficientHistory
      ? `За месяц учтено ${formatRub(summary.spent)}. Среднее по ${history.sourceMonths.length} закрытым месяцам — ${formatRub(history.estimate.total)}. Это ориентир, а не прогноз.`
      : `За месяц учтено ${formatRub(summary.spent)}. ${history.reason} MarketTrat не строит прогноз по нескольким дням текущего месяца.`;
  }

  clearNode(els.budgetBreakdown);
  const entries = summary.categories.filter((item) => item.limit !== null);
  if (!entries.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'Добавьте лимит по категории';
    els.budgetBreakdown.appendChild(empty);
    return;
  }

  for (const item of entries) {
    const row = document.createElement('div');
    row.className = item.overBudget ? 'budget-row over' : 'budget-row';
    row.style.setProperty('--category-color', categoryColor(item.category));

    const head = document.createElement('div');
    head.className = 'budget-head';
    const title = document.createElement('strong');
    title.textContent = categoryName(item.category);
    const amount = document.createElement('span');
    amount.textContent = `${formatRub(item.spent)} / ${formatRub(item.limit)}`;
    head.append(title, amount);

    const bar = document.createElement('div');
    bar.className = 'budget-bar';
    const fill = document.createElement('div');
    fill.className = 'budget-fill';
    fill.style.width = `${Math.min(100, Math.max(2, (item.spent / item.limit) * 100))}%`;
    bar.appendChild(fill);

    const actions = document.createElement('div');
    actions.className = 'budget-actions';
    const status = document.createElement('span');
    status.textContent = item.overBudget
      ? `перерасход ${formatRub(item.spent - item.limit)}`
      : `осталось ${formatRub(item.limit - item.spent)}`;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'secondary';
    remove.textContent = 'Удалить';
    remove.disabled = collectionInProgress || databaseMutationInProgress;
    remove.setAttribute('aria-label', `Удалить бюджет категории ${categoryName(item.category)}`);
    remove.addEventListener('click', () => {
      delete budgetPlan(month, true).categories[item.category];
      persistSnapshot('Изменён бюджет');
      updateAnalytics();
    });
    actions.append(status, remove);
    row.append(head, bar, actions);
    els.budgetBreakdown.appendChild(row);
  }
}

function saveBudget() {
  if (collectionInProgress) return;
  const month = els.budgetMonth.value || currentMonthKey();
  const category = els.budgetCategory.value;
  if (!els.budgetAmount.value.trim()) {
    els.budgetAmount.focus();
    return;
  }
  const amount = Number(els.budgetAmount.value);
  if (!category) return;
  const plan = budgetPlan(month, true);
  if (Number.isFinite(amount) && amount > 0) plan.categories[category] = amount;
  else delete plan.categories[category];
  els.budgetAmount.value = '';
  persistSnapshot('Изменён бюджет');
  updateAnalytics();
}

function saveOverallBudget() {
  if (collectionInProgress) return;
  const month = els.budgetMonth.value || currentMonthKey();
  const amount = Number(els.overallBudgetAmount.value);
  const plan = budgetPlan(month, true);
  plan.total = Number.isFinite(amount) && amount > 0 ? amount : null;
  persistSnapshot('Изменён общий бюджет');
  updateAnalytics();
}

function nextMonthKey(month) {
  const [year, number] = String(month || currentMonthKey()).split('-').map(Number);
  return `${number === 12 ? year + 1 : year}-${String(number === 12 ? 1 : number + 1).padStart(2, '0')}`;
}

function prepareNextMonthBudget() {
  if (collectionInProgress || databaseMutationInProgress) return;
  const sourceMonth = els.budgetMonth.value || currentMonthKey();
  const targetMonth = nextMonthKey(sourceMonth);
  const source = budgetPlan(sourceMonth);
  const hasSourcePlan = Boolean(source.total || Object.keys(source.categories).length);
  let nextPlan;
  let reason;
  if (hasSourcePlan) {
    nextPlan = { total: source.total, categories: { ...source.categories } };
    reason = `Лимиты ${sourceMonth} скопированы`;
  } else {
    const history = historicalBudgetTemplate(targetMonth);
    if (!history.sufficientHistory) {
      setStatus(`Лимиты не подготовлены. ${history.reason}`);
      setActiveView('control');
      return;
    }
    nextPlan = { total: history.template.total, categories: { ...history.template.categories } };
    reason = `Лимиты рассчитаны по закрытым месяцам ${history.sourceMonths.join(', ')}`;
  }
  const existing = budgetPlan(targetMonth);
  if ((existing.total || Object.keys(existing.categories).length)
    && !globalThis.confirm(`Заменить уже сохранённые лимиты на ${targetMonth}?`)) return;
  appSettings.budgets[budgetPlanKey(targetMonth)] = nextPlan;
  els.budgetMonth.value = targetMonth;
  applySettingsChange(`${reason}: ${targetMonth}`);
  setStatus(`${reason}. Откройте ${targetMonth} и скорректируйте суммы под планы.`);
}

function replaceSelectOptions(select, options, leading = []) {
  if (!select) return;
  const current = select.value;
  clearNode(select);
  for (const item of [...leading, ...options]) {
    const option = document.createElement('option');
    option.value = item.value;
    option.textContent = item.label;
    select.appendChild(option);
  }
  if ([...select.options].some((option) => option.value === current)) select.value = current;
}

function renderProfiles() {
  const options = appSettings.profiles.map((profile) => ({ value: profile.id, label: profile.name }));
  replaceSelectOptions(els.activeProfileSelect, options, [{ value: 'all', label: 'Все профили' }]);
  replaceSelectOptions(els.dataProfileSelect, options);
  replaceSelectOptions(els.operationProfileSelect, options);
  replaceSelectOptions(els.bulkProfile, options, [{ value: '', label: 'Профиль…' }]);
  els.activeProfileSelect.value = appSettings.activeProfile;
  els.dataProfileSelect.value = appSettings.dataProfile;
  els.dataProfileName.value = appSettings.profiles.find((profile) => profile.id === appSettings.dataProfile)?.name || '';
  els.deleteDataProfile.disabled = appSettings.profiles.length <= 1
    || collectionInProgress
    || databaseMutationInProgress;
}

function renderCategorySelectors() {
  const options = categoryOptions(rows).map((category) => ({
    value: category,
    label: categoryName(category)
  }));
  replaceSelectOptions(els.categoryRuleCategory, options, [{ value: '', label: 'Выберите категорию' }]);
  replaceSelectOptions(els.operationCategorySelect, options, [{ value: '', label: 'Выберите категорию' }]);
  replaceSelectOptions(els.bulkCategory, options, [{ value: '', label: 'Категория…' }]);
}

function splitRuleTerms(value) {
  return String(value || '')
    .split(',')
    .map((term) => term.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function categoryRuleDraft() {
  const keywords = splitRuleTerms(els.categoryRulePattern.value);
  const negativeKeywords = splitRuleTerms(els.categoryRuleNegative.value);
  const source = els.categoryRuleSource.value;
  return {
    keywords,
    keyword: keywords.join(', '),
    negativeKeywords,
    sources: source ? [source] : [],
    match: els.categoryRuleMatch.value || 'all',
    category: els.categoryRuleCategory.value,
    priority: 100,
    enabled: true
  };
}

function matchingCategoryRuleRows(rule) {
  if (!rule?.keywords?.length && !rule?.keyword) return [];
  return sourceRows.filter((row) => preferences.ruleMatchesRow(row, rule));
}

function renderCategoryRulePreview() {
  const rule = categoryRuleDraft();
  if (!rule.keywords.length) {
    els.categoryRulePreview.textContent = 'Введите фразу — здесь появится число затронутых операций.';
    return;
  }
  const affected = matchingCategoryRuleRows(rule);
  const amount = affected.reduce((sum, row) => sum + Math.abs(rowAmount(row)), 0);
  const manual = affected.filter((row) => appSettings.overrides[row.rowId]?.category).length;
  const categories = [...new Set(affected.map((row) => categoryName(row.category)))].slice(0, 3);
  els.categoryRulePreview.textContent = affected.length
    ? `Правило затронет ${formatCount(affected.length, ['операцию', 'операции', 'операций'])} на ${formatRub(amount)}${categories.length ? ` · сейчас: ${categories.join(', ')}` : ''}${manual ? ` · ручные правки сохранят приоритет: ${manual}` : ''}.`
    : 'Совпадений в текущей базе нет. Правило применится и к будущим операциям.';
}

function dataListItem(titleText, detailText, actions = []) {
  const item = document.createElement('div');
  item.className = 'data-list-item';
  const copy = document.createElement('div');
  copy.className = 'data-list-copy';
  const title = document.createElement('strong');
  title.textContent = titleText;
  const detail = document.createElement('span');
  detail.textContent = detailText;
  copy.append(title, detail);
  const controls = document.createElement('div');
  controls.className = 'data-list-actions';
  for (const action of actions) controls.appendChild(action);
  item.append(copy, controls);
  return item;
}

function smallButton(label, onClick, className = 'secondary', accessibleLabel = '') {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  button.disabled = collectionInProgress || databaseMutationInProgress;
  if (accessibleLabel) button.setAttribute('aria-label', accessibleLabel);
  button.addEventListener('click', onClick);
  return button;
}

function renderCategoryRules() {
  renderCategorySelectors();
  renderCategoryRulePreview();
  clearNode(els.categoryRuleList);
  if (!appSettings.customRules.length) {
    const empty = document.createElement('div');
    empty.className = 'data-empty';
    empty.textContent = 'Добавленные правила появятся здесь.';
    els.categoryRuleList.appendChild(empty);
    return;
  }
  for (const rule of appSettings.customRules) {
    const toggle = smallButton(rule.enabled === false ? 'Включить' : 'Отключить', () => {
      rule.enabled = rule.enabled === false;
      applySettingsChange(rule.enabled ? 'Включено правило категории' : 'Отключено правило категории');
    }, 'secondary', `${rule.enabled === false ? 'Включить' : 'Отключить'} правило «${rule.keyword}»`);
    const remove = smallButton('Удалить', () => {
      appSettings.customRules = appSettings.customRules.filter((item) => item.id !== rule.id);
      applySettingsChange('Удалено правило категории');
    }, 'secondary', `Удалить правило «${rule.keyword}»`);
    const sourceText = rule.sources?.length
      ? rule.sources.map((source) => sourceLabels[source] || source).join(', ')
      : 'все маркетплейсы';
    const matchText = rule.match === 'exact' ? 'точное название' : (rule.match === 'all' ? 'все условия' : 'любое условие');
    const negativeText = rule.negativeKeywords?.length ? ` · кроме: ${rule.negativeKeywords.join(', ')}` : '';
    els.categoryRuleList.appendChild(dataListItem(
      `${rule.enabled === false ? 'Пауза · ' : ''}«${rule.keywords.join(', ')}» → ${categoryName(rule.category)}`,
      `${formatCount(matchingCategoryRuleRows(rule).length, ['совпадение', 'совпадения', 'совпадений'])} · ${sourceText} · ${matchText}${negativeText}`,
      [toggle, remove]
    ));
  }
}

function categoryQuality(records = rows) {
  const relevant = records.filter((row) => row.excluded !== true && !isServiceRow(row));
  const reviewRows = relevant.filter((row) => row.category_needs_review === true || !row.category || row.category === 'unknown');
  const confirmedRows = relevant.filter((row) => ['manual', 'rule'].includes(row.category_origin));
  const confirmedDecisions = new Set(confirmedRows.map((row) => row.category_origin === 'rule'
    ? `rule\u0001${row.category_rule_id || row.category_reason || row.category}`
    : `manual\u0001${row.source}\u0001${normalizeKeyText(row.title)}\u0001${row.category}`));
  const reviewSet = new Set(reviewRows);
  const confirmedSet = new Set(confirmedRows);
  const confidentRows = relevant.filter((row) => !reviewSet.has(row) && !confirmedSet.has(row));
  const amount = (items) => items.reduce((sum, row) => sum + Math.abs(rowAmount(row)), 0);
  return {
    total: relevant.length,
    reviewRows,
    reviewAmount: amount(reviewRows),
    confirmed: confirmedDecisions.size,
    confident: confidentRows.length,
    coverage: relevant.length ? Math.round((relevant.length - reviewRows.length) / relevant.length * 100) : 0
  };
}

function categoryReviewGroupCount(records = rows) {
  const quality = categoryQuality(records);
  return new Set(quality.reviewRows.map((row) => `${row.source}\u0001${normalizeKeyText(row.title)}`)).size;
}

function confidenceWords(value) {
  const confidence = Number(value) || 0;
  if (confidence >= 0.85) return 'похоже, всё верно';
  if (confidence >= 0.65) return 'при желании можно уточнить';
  return 'категория приблизительная';
}

function categoryReviewEntries() {
  const query = normalizeKeyText(els.categoryReviewSearch.value);
  const grouped = new Map();
  for (const row of rows) {
    if (row.excluded === true || isServiceRow(row)) continue;
    const needsReview = row.category_needs_review === true || !row.category || row.category === 'unknown';
    if (!categoryReviewShowAll && !needsReview) continue;
    if (query && !normalizeKeyText(`${row.title} ${row.category} ${row.category_suggestion}`).includes(query)) continue;
    const key = `${row.source}\u0001${normalizeKeyText(row.title)}`;
    const entry = grouped.get(key) || {
      key,
      source: row.source,
      title: row.title,
      category: row.category || 'unknown',
      suggestion: row.category_suggestion || row.category || 'unknown',
      confidence: Number(row.category_confidence) || 0,
      reason: row.category_reason || '',
      rowIds: [],
      amount: 0,
      needsReview: false,
      firstRow: row
    };
    entry.rowIds.push(row.rowId);
    entry.amount += Math.abs(rowAmount(row));
    entry.confidence = Math.min(entry.confidence || 1, Number(row.category_confidence) || 0);
    entry.needsReview ||= needsReview;
    grouped.set(key, entry);
  }
  return [...grouped.values()].sort((left, right) => (
    Number(right.needsReview) - Number(left.needsReview)
      || right.amount - left.amount
      || left.title.localeCompare(right.title, 'ru')
  ));
}

function applyCategoryReview(entry, category, remember) {
  if (!category || collectionInProgress || databaseMutationInProgress) return;
  for (const rowId of entry.rowIds) {
    const current = appSettings.overrides[rowId] || {};
    appSettings.overrides[rowId] = { ...current, category };
  }
  if (remember) upsertCategoryRule(preferences.deriveCategoryRule(entry.firstRow, category));
  applySettingsChange(`Подтверждена категория: ${entry.title}`);
  setStatus(`${categoryName(category)}: обновлено ${formatCount(entry.rowIds.length, ['операция', 'операции', 'операций'])}.`);
}

function renderCategoryReview() {
  const quality = categoryQuality(rows);
  const pendingGroupCount = categoryReviewGroupCount(rows);
  const suggestedGroupCount = Math.min(5, pendingGroupCount);
  clearNode(els.categoryQualityKpis);
  for (const [value, label, kind] of [
    [`${quality.coverage}%`, 'определено автоматически', 'ok'],
    [String(suggestedGroupCount), 'важных групп предложено', ''],
    [formatRub(quality.reviewAmount), 'уже учтено в отчёте', ''],
    [String(quality.confirmed), 'ваших правил и решений', '']
  ]) {
    const card = document.createElement('div');
    card.className = `category-quality-card ${kind}`.trim();
    const strong = document.createElement('strong');
    strong.textContent = value;
    const span = document.createElement('span');
    span.textContent = label;
    card.append(strong, span);
    els.categoryQualityKpis.appendChild(card);
  }

  els.categoryReviewBadge.hidden = true;
  els.categoryReviewBadge.textContent = '';
  els.reviewAllCategories.textContent = categoryReviewShowAll ? 'Только категории для уточнения' : 'Посмотреть все категории';

  const entries = categoryReviewEntries();
  const shown = entries.slice(0, categoryReviewShownCount);
  els.categoryReviewSummary.textContent = entries.length
    ? (entries.length > shown.length
        ? `Показаны ${shown.length} самых заметных групп. Остальное можно не разбирать.`
        : `${formatCount(entries.length, ['группа', 'группы', 'групп'])} — исправлять необязательно.`)
    : '';
  els.categoryReviewMore.hidden = entries.length <= shown.length;
  clearNode(els.categoryReviewList);
  if (!shown.length) {
    const empty = document.createElement('div');
    empty.className = 'data-empty';
    empty.textContent = quality.total
      ? (categoryReviewShowAll ? 'Поиск ничего не нашёл.' : 'Все категории разобраны. Сомнительных операций нет.')
      : 'Сначала соберите данные или загрузите CSV.';
    els.categoryReviewList.appendChild(empty);
    return;
  }

  const categories = categoryOptions(rows).filter((category) => category !== 'unknown');
  for (const entry of shown) {
    const item = document.createElement('article');
    item.className = `category-review-item ${entry.needsReview ? 'needs-review' : ''}`.trim();
    const copy = document.createElement('div');
    copy.className = 'category-review-copy';
    const title = document.createElement('strong');
    title.append(createSourceBadge(entry.source), document.createTextNode(entry.title));
    const meta = document.createElement('span');
    const confidence = confidenceWords(entry.confidence);
    meta.textContent = `${formatCount(entry.rowIds.length, ['операция', 'операции', 'операций'])} · ${formatRub(entry.amount)} · ${confidence}`;
    const reason = document.createElement('small');
    reason.textContent = entry.reason || 'Можно выбрать точнее';
    copy.append(title, meta, reason);

    const controls = document.createElement('div');
    controls.className = 'category-review-controls';
    const selectWrap = document.createElement('span');
    selectWrap.className = 'select-control';
    const select = document.createElement('select');
    select.setAttribute('aria-label', `Категория для ${entry.title}`);
    const initial = entry.suggestion !== 'unknown' ? entry.suggestion : entry.category;
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Выберите категорию';
    select.appendChild(placeholder);
    for (const category of categories) {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = categoryName(category);
      select.appendChild(option);
    }
    select.value = categories.includes(initial) ? initial : '';
    selectWrap.appendChild(select);
    const rememberLabel = document.createElement('label');
    rememberLabel.className = 'check compact-check';
    const remember = document.createElement('input');
    remember.type = 'checkbox';
    remember.checked = true;
    rememberLabel.append(remember, document.createTextNode('Запомнить для похожих'));
    const apply = document.createElement('button');
    apply.type = 'button';
    apply.textContent = 'Исправить';
    apply.disabled = !select.value;
    select.addEventListener('change', () => {
      apply.disabled = !select.value;
    });
    apply.addEventListener('click', () => applyCategoryReview(entry, select.value, remember.checked));
    controls.append(selectWrap, rememberLabel, apply);
    item.append(copy, controls);
    els.categoryReviewList.appendChild(item);
  }
}

function renderReportTrust(records = rows) {
  const quality = categoryQuality(records);
  if (!quality.total) {
    els.reportTrust.hidden = true;
    return;
  }
  const audit = reportQuality.auditCollection(records, lastCollectionReport);
  const needsAttention = audit.state === 'attention' || lastWarningCount > 0;
  els.reportTrust.hidden = false;
  if (demoMode) {
    els.reportTrust.hidden = true;
    return;
  }
  els.reportTrust.classList.toggle('warning', needsAttention);
  els.reportTrust.classList.toggle('neutral', audit.state === 'imported');
  els.reportTrustBadge.textContent = audit.state === 'imported'
    ? 'Загруженный файл'
    : (needsAttention ? 'Нужно проверить' : 'Сбор проверен');
  if (audit.state === 'imported') {
    els.reportTrustTitle.textContent = 'Полноту загруженной таблицы проверить нельзя';
  } else if (audit.state === 'attention') {
    els.reportTrustTitle.textContent = 'Часть чеков собрана не полностью';
  } else if (quality.reviewRows.length) {
    els.reportTrustTitle.textContent = 'Чеки сверены, категории рассчитаны автоматически';
  } else {
    els.reportTrustTitle.textContent = 'Все найденные чеки прочитаны и сверены';
  }

  const collectionFacts = audit.state === 'imported'
    ? [`в таблице ${formatCount(audit.rowCount, ['строка', 'строки', 'строк'])}`]
    : [
        audit.receipts ? `сверено чеков ${audit.parsed} из ${audit.receipts}` : '',
        audit.missingReceipts ? `не прочитано чеков ${audit.missingReceipts}` : '',
        audit.fallbackAmount ? `${formatRub(audit.fallbackAmount)} учтено только общей суммой` : '',
        audit.unverifiedAmount ? `${formatRub(audit.unverifiedAmount)} без сверки итога` : ''
      ];
  els.reportTrustText.textContent = [
    ...collectionFacts,
    `категории определены у ${quality.coverage}% покупок`,
    quality.reviewAmount ? `категория примерная у ${formatRub(quality.reviewAmount)}` : '',
    lastRunAt ? `обновлено ${formatRunTime(lastRunAt)}` : ''
  ].filter(Boolean).join(' · ');

  clearNode(els.reportTrustSources);
  for (const source of audit.sources) {
    const chip = document.createElement('span');
    chip.className = `report-source ${source.attention ? 'warning' : (source.evidence ? 'done' : 'neutral')}`;
    const range = source.from && source.to
      ? `${shortDate(source.from)}–${shortDate(source.to)}`
      : '';
    const state = source.evidence
      ? (source.attention ? 'есть пропуски' : 'чеки сверены')
      : 'из файла';
    chip.textContent = [sourceLabels[source.source] || source.source, state, range].filter(Boolean).join(' · ');
    els.reportTrustSources.appendChild(chip);
  }
  els.openCollectionAudit.hidden = audit.state === 'imported' || !audit.sources.length;
  els.openCategoryReview.hidden = quality.reviewRows.length === 0;
}

function openCollectionDetails() {
  runDetailsOpen = true;
  renderRunSummary();
  els.runDetails.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function collectOnly(source) {
  if (source) queuedCollectSources = [source];
  els.collect.click();
}

function openControlSection(element) {
  setActiveView('control');
  const card = element?.closest?.('details');
  if (card) card.open = true;
  requestAnimationFrame(() => element?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }));
}

function homeGuideTasks(refundResult = null) {
  const tasks = [];
  const warnings = (lastCollectionReport.warnings || []).filter(Boolean);
  const ozonDuplicateGroups = legacyOzonSettlementDuplicateCount(sourceRows);
  if (ozonDuplicateGroups > 0) {
    tasks.push({
      priority: 110,
      kind: 'danger',
      title: 'Пересобрать Ozon без двойного счёта',
      detail: `В старых данных найдены повторные расчёты по ${formatCount(ozonDuplicateGroups, ['позиции', 'позициям', 'позициям'])}. Полный пересбор сверит предоплату с финальными чеками и заменит только данные Ozon.`,
      button: 'Пересобрать Ozon',
      action: () => collectOnly('ozon')
    });
  }

  const retryWarning = warnings.find((warning) => !isCollectionCompletenessWarning(warning));
  if (retryWarning) {
    const source = sourceFromProgress(retryWarning);
    tasks.push({
      priority: 100,
      kind: 'danger',
      title: source ? `Повторить ${sourceLabels[source] || source}` : 'Проверить последний сбор',
      detail: friendlyWarningText(retryWarning),
      button: source ? 'Повторить магазин' : 'Посмотреть причину',
      action: () => (source ? collectOnly(source) : openCollectionDetails())
    });
  }

  const completenessWarning = warnings.find(isCollectionCompletenessWarning);
  if (completenessWarning) {
    const source = sourceFromProgress(completenessWarning);
    tasks.push({
      priority: 60,
      kind: '',
      title: source ? `Проверить полноту ${sourceLabels[source] || source}` : 'Проверить полноту данных',
      detail: friendlyWarningText(completenessWarning),
      button: 'Посмотреть детали',
      action: openCollectionDetails
    });
  }

  const refunds = refundResult || refundCenterResult();
  const refundAttention = (refunds.summary?.overdue || 0) + (refunds.summary?.disputed || 0) + (refunds.summary?.partial || 0);
  if (refundAttention) {
    tasks.push({
      priority: refunds.summary.overdue ? 85 : 75,
      kind: refunds.summary.overdue ? 'danger' : 'warning',
      title: refunds.summary.overdue
        ? `Просрочено возвратов: ${refunds.summary.overdue}`
        : `Проверить возвраты: ${refundAttention}`,
      detail: `Ещё не получено ${formatRub(refunds.summary.outstandingAmount || 0)}.`,
      button: 'Открыть возвраты',
      action: () => openControlSection(els.refundCenterList)
    });
  }

  const budgetAlert = budgetAlertLines().at(0);
  if (budgetAlert) {
    tasks.push({
      priority: 70,
      kind: 'warning',
      title: 'Проверить бюджет',
      detail: budgetAlert,
      button: 'Открыть бюджет',
      action: () => {
        els.budgetCard.open = true;
        els.budgetCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  const cached = intelligenceCacheRows === rows ? intelligenceCacheByProfile.get(appSettings.activeProfile) : null;
  if (cached) {
    const anomalies = cached.report.anomalies.filter((item) => !appSettings.anomalyDismissals[anomalyDecisionKey(item, cached.input)]);
    if (anomalies.length) {
      tasks.push({
        priority: 65,
        kind: 'warning',
        title: `Необычных операций: ${anomalies.length}`,
        detail: 'Возможные дубли, резкий рост цены или возвраты без найденной покупки.',
        button: 'Посмотреть операции',
        action: () => openControlSection(els.anomalyList)
      });
    }
    const recurringPending = cached.report.recurring.filter((item) => !appSettings.recurringDecisions[recurringDecisionKey(item)]).length;
    if (recurringPending) {
      tasks.push({
        priority: 45,
        kind: '',
        title: `Похожи на регулярные: ${recurringPending}`,
        detail: 'Подтвердите только те покупки, которые действительно повторяются.',
        button: 'Посмотреть повторы',
        action: () => openControlSection(els.recurringList)
      });
    }
  }

  try {
    const archive = lifecycle.buildArchive(
      appSettings.warranties.filter(warrantyMatchesActiveProfile).map(strippedArchiveRecord),
      { now: localInputDate(new Date()), expiringDays: 30 }
    );
    const warrantyAttention = archive.summary.expiring + archive.summary.expired;
    if (warrantyAttention) {
      tasks.push({
        priority: 55,
        kind: 'warning',
        title: `Проверить гарантии: ${warrantyAttention}`,
        detail: 'Некоторые гарантии скоро закончатся или уже закончились.',
        button: 'Открыть гарантии',
        action: () => openControlSection(els.warrantyList)
      });
    }
  } catch {
    // A damaged optional warranty entry must not block the main screen.
  }

  return tasks.sort((left, right) => right.priority - left.priority);
}

function scheduleHomeAnalysis() {
  const profile = appSettings.activeProfile;
  const cached = intelligenceCacheRows === rows && intelligenceCacheByProfile.has(profile);
  const scheduled = homeAnalysisScheduledRows === rows && homeAnalysisScheduledProfile === profile;
  if (!rows.length || rows.length > 20000 || cached || scheduled) return;
  const scheduledRows = rows;
  homeAnalysisScheduledRows = scheduledRows;
  homeAnalysisScheduledProfile = profile;
  const run = () => {
    if (rows !== scheduledRows || appSettings.activeProfile !== profile) return;
    try {
      controlAnalysis();
      renderHomeGuide();
    } catch (error) {
      appendLog(`Предупреждение: советы на главном экране не рассчитаны: ${error.message}`, 'home-intelligence-error');
    }
  };
  if (typeof requestIdleCallback === 'function') requestIdleCallback(run, { timeout: 1200 });
  else setTimeout(run, 50);
}

function renderHomeGuide(refundResult = null) {
  els.homeGuide.hidden = rows.length === 0;
  if (!rows.length) return;
  if (demoMode) {
    els.homeGuide.hidden = true;
    clearNode(els.homeNextStepList);
    els.homeNextSteps.hidden = true;
    return;
  }
  const tasks = homeGuideTasks(refundResult);
  const main = tasks[0];
  els.homeGuide.classList.toggle('warning', Boolean(main));
  els.homeGuide.classList.toggle('danger', main?.kind === 'danger');
  els.homeGuideKicker.textContent = main ? 'Что сделать сейчас' : 'На сегодня всё';
  els.homeGuideTitle.textContent = main?.title || 'Срочных действий нет';
  els.homeGuideText.textContent = main?.detail || 'По доступным проверкам всё спокойно. Можно посмотреть расходы или обновить покупки позже.';
  els.homeGuidePrimary.textContent = main?.button || 'Обновить покупки';
  homeGuidePrimaryAction = main?.action || (() => collectOnly(''));
  els.homeGuideSecondary.textContent = main ? 'Обновить покупки' : 'Скачать таблицу';
  homeGuideSecondaryAction = main ? (() => collectOnly('')) : downloadCsv;

  clearNode(els.homeNextStepList);
  const next = tasks.slice(1, 2);
  els.homeNextSteps.hidden = next.length === 0;
  next.forEach((task, index) => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'home-next-step';
    const number = document.createElement('span');
    number.className = 'home-next-step-number';
    number.textContent = String(index + 2);
    const copy = document.createElement('span');
    const title = document.createElement('strong');
    title.textContent = task.title;
    const detail = document.createElement('small');
    detail.textContent = task.detail;
    copy.append(title, detail);
    button.append(number, copy);
    button.addEventListener('click', task.action);
    item.appendChild(button);
    els.homeNextStepList.appendChild(item);
  });
  scheduleHomeAnalysis();
}

function renderActionInsights(records, previousRecords) {
  clearNode(els.actionInsightList);
  if (!records.length) {
    els.actionSummary.hidden = true;
    return;
  }
  const insights = [];

  let insightRecords = records;
  let comparisonRecords = previousRecords;
  let automaticMonth = '';
  if (!Array.isArray(comparisonRecords)) {
    const monthKeys = [...new Set(records.map((row) => String(row.date || '').slice(0, 7)).filter((key) => /^\d{4}-\d{2}$/.test(key)))]
      .sort();
    if (monthKeys.length >= 2) {
      automaticMonth = monthKeys[monthKeys.length - 1];
      const previousMonth = monthKeys[monthKeys.length - 2];
      insightRecords = records.filter((row) => String(row.date || '').startsWith(automaticMonth));
      comparisonRecords = records.filter((row) => String(row.date || '').startsWith(previousMonth));
    }
  }
  const openInsight = (filter) => {
    if (automaticMonth) {
      const bounds = periodBounds(automaticMonth, 'month');
      if (bounds) {
        els.dateFrom.value = bounds.from;
        els.dateTo.value = bounds.to;
        els.quickPeriodSelect.value = 'custom';
      }
    }
    setDetailFilter(filter, true);
  };

  if (Array.isArray(comparisonRecords)) {
    const growth = buildCategoryBreakdown(insightRecords, comparisonRecords).entries
      .map((entry) => ({ ...entry, delta: entry.amount - (entry.previousAmount || 0) }))
      .filter((entry) => entry.delta > 0)
      .sort((left, right) => right.delta - left.delta)[0];
    if (growth) {
      insights.push({
        title: `${automaticMonth ? `${automaticMonth} · ` : ''}${categoryName(growth.category)}: рост на ${formatRub(growth.delta)}`,
        detail: growth.previousAmount ? `Было ${formatRub(growth.previousAmount)}, стало ${formatRub(growth.amount)}.` : 'В прошлом сопоставимом периоде таких трат не было.',
        action: () => openInsight({ type: 'category', category: growth.category, label: categoryName(growth.category) })
      });
    }

    const previousTitles = new Set(comparisonRecords.map((row) => `${row.source}\u0001${normalizeKeyText(row.title)}`));
    const newLarge = insightRecords
      .filter((row) => !isRefundRow(row) && rowAmount(row) > 0)
      .filter((row) => !previousTitles.has(`${row.source}\u0001${normalizeKeyText(row.title)}`))
      .sort((left, right) => rowAmount(right) - rowAmount(left))[0];
    if (newLarge) {
      insights.push({
        title: `${automaticMonth ? `${automaticMonth} · ` : ''}Новая крупная трата: ${newLarge.title}`,
        detail: `${sourceLabels[newLarge.source] || newLarge.source} · ${formatRub(rowAmount(newLarge))}.`,
        action: () => openInsight({ type: 'item', source: newLarge.source, title: newLarge.title, label: newLarge.title })
      });
    }
  }

  for (const text of budgetAlertLines().slice(0, 1)) {
    insights.push({ title: `Бюджет: ${text}`, detail: 'Основа расчёта показана в карточке бюджета.' });
  }

  els.actionSummary.hidden = insights.length === 0;
  for (const insight of insights.slice(0, 4)) {
    const node = document.createElement(insight.action ? 'button' : 'div');
    if (insight.action) node.type = 'button';
    node.className = `action-insight ${insight.action ? 'clickable' : ''}`.trim();
    const title = document.createElement('strong');
    title.textContent = insight.title;
    const detail = document.createElement('span');
    detail.textContent = insight.detail;
    node.append(title, detail);
    if (insight.action) node.addEventListener('click', insight.action);
    els.actionInsightList.appendChild(node);
  }
}

function renderBulkBar() {
  const existingIds = new Set(rows.map((row) => row.rowId));
  for (const rowId of selectedOperationRowIds) {
    if (!existingIds.has(rowId)) selectedOperationRowIds.delete(rowId);
  }
  const count = selectedOperationRowIds.size;
  els.bulkBar.hidden = count === 0;
  els.bulkCount.textContent = `Выбрано: ${count}`;
  for (const control of [els.bulkApply, els.bulkExclude, els.bulkInclude, els.bulkClear]) {
    control.disabled = count === 0 || collectionInProgress || databaseMutationInProgress;
  }
}

function applyBulkOperation(patch, reason) {
  if (!selectedOperationRowIds.size || collectionInProgress || databaseMutationInProgress) return;
  let changed = 0;
  const rowById = new Map(rows.map((row) => [row.rowId, row]));
  const sourceById = new Map(sourceRows.map((row) => [row.rowId, row]));
  for (const rowId of selectedOperationRowIds) {
    const row = rowById.get(rowId);
    const sourceRow = sourceById.get(rowId);
    if (!row || !sourceRow) continue;
    const current = appSettings.overrides[rowId] || {};
    const override = sparseOperationOverride(rowBeforeManualOverride(sourceRow), {
      category: Object.prototype.hasOwnProperty.call(patch, 'category') ? patch.category : (current.category || row.category),
      profile: Object.prototype.hasOwnProperty.call(patch, 'profile') ? patch.profile : (current.profile || row.profile),
      note: Object.prototype.hasOwnProperty.call(patch, 'note') ? patch.note : (current.note || row.note || ''),
      excluded: Object.prototype.hasOwnProperty.call(patch, 'excluded') ? patch.excluded : (current.excluded ?? row.excluded === true)
    });
    if (Object.keys(override).length) appSettings.overrides[rowId] = override;
    else delete appSettings.overrides[rowId];
    changed += 1;
  }
  selectedOperationRowIds.clear();
  els.bulkCategory.value = '';
  els.bulkProfile.value = '';
  applySettingsChange(`${reason}: ${changed}`);
  setStatus(`${reason}: ${formatCount(changed, ['операция', 'операции', 'операций'])}.`);
}

function renderOperationOverrides() {
  clearNode(els.operationOverridesList);
  const query = normalizeKeyText(els.operationOverridesSearch.value);
  const rowById = new Map();
  for (const row of sourceRows) rowById.set(row.rowId, row);
  for (const row of rows) rowById.set(row.rowId, row);
  const allEntries = Object.entries(appSettings.overrides);
  const entries = allEntries.filter(([rowId, override]) => {
    if (!query) return true;
    const row = rowById.get(rowId);
    return normalizeKeyText(`${row?.title || ''} ${row?.date || ''} ${override.category || ''} ${override.note || ''}`).includes(query);
  });
  const shown = entries.slice(0, operationOverridesShownCount);
  els.operationOverridesSummary.textContent = allEntries.length
    ? `${formatCount(allEntries.length, ['правка', 'правки', 'правок'])}${entries.length !== allEntries.length ? ` · найдено ${entries.length}` : ''}${entries.length > shown.length ? ` · показано ${shown.length}` : ''}`
    : '';
  els.operationOverridesMore.hidden = entries.length <= shown.length;
  if (!entries.length) {
    const empty = document.createElement('div');
    empty.className = 'data-empty';
    empty.textContent = allEntries.length ? 'Поиск ничего не нашёл.' : 'Ручные изменения операций появятся здесь.';
    els.operationOverridesList.appendChild(empty);
    return;
  }
  for (const [rowId, override] of shown) {
    const row = rowById.get(rowId);
    const flags = [
      override.category ? categoryName(override.category) : '',
      override.profile ? appSettings.profiles.find((profile) => profile.id === override.profile)?.name : '',
      override.excluded ? 'исключена из аналитики' : '',
      override.note ? 'есть заметка' : ''
    ].filter(Boolean).join(' · ');
    const actions = [];
    if (row) actions.push(smallButton(
      'Изменить',
      () => openOperationEditor(rowId),
      'secondary',
      `Изменить ручную правку операции ${row.title}`
    ));
    actions.push(smallButton('Сбросить', () => {
      delete appSettings.overrides[rowId];
      applySettingsChange('Сброшена ручная правка');
    }, 'secondary', `Сбросить ручную правку операции ${row?.title || rowId}`));
    els.operationOverridesList.appendChild(dataListItem(
      row?.title || 'Операция больше не найдена',
      `${row?.date || ''}${flags ? ` · ${flags}` : ''}`,
      actions
    ));
  }
}

function applySettingsChange(reason) {
  appSettings = normalizeSettings(appSettings);
  applyAppPreferences();
  updateDateInputBounds();
  renderProfiles();
  renderCategoryRules();
  renderOperationOverrides();
  updateAnalytics();
  renderRunSummary();
  persistSnapshot(reason);
}

function categoryRuleSignature(value) {
  const input = value && typeof value === 'object' ? value : {};
  const normalizedTerms = (items) => (Array.isArray(items) ? items : [])
    .map(normalizeKeyText)
    .filter(Boolean)
    .sort();
  const normalizedSources = (Array.isArray(input.sources) ? input.sources : [])
    .map((source) => String(source || '').trim().toLowerCase())
    .map((source) => source === 'wb' ? 'wildberries' : source)
    .filter(Boolean)
    .sort();
  const amountMin = Number(input.amountMin);
  const amountMax = Number(input.amountMax);
  return JSON.stringify({
    keywords: normalizedTerms(input.keywords),
    negativeKeywords: normalizedTerms(input.negativeKeywords),
    sources: normalizedSources,
    match: input.match || 'any',
    amountMin: Number.isFinite(amountMin) && amountMin >= 0 ? amountMin : null,
    amountMax: Number.isFinite(amountMax) && amountMax >= 0 ? amountMax : null
  });
}

function upsertCategoryRule(value, category) {
  const input = value && typeof value === 'object'
    ? { ...value }
    : { keywords: [String(value || '').trim()], keyword: String(value || '').trim(), category };
  const keywords = (Array.isArray(input.keywords) ? input.keywords : [input.keyword]).map(String).map((item) => item.trim()).filter(Boolean);
  const signature = categoryRuleSignature({ ...input, keywords });
  if (!keywords.length || !input.category) return;
  const existing = appSettings.customRules.find((rule) => categoryRuleSignature(rule) === signature);
  appSettings.customRules = appSettings.customRules.filter(
    (rule) => rule !== existing
  );
  appSettings.customRules.push({
    id: existing?.id || globalThis.crypto?.randomUUID?.() || `rule-${Date.now().toString(36)}`,
    ...input,
    keyword: keywords.join(', '),
    keywords,
    category: input.category,
    priority: Number(input.priority) || 100,
    enabled: input.enabled !== false
  });
}

function addProfile() {
  if (collectionInProgress) return;
  const name = els.dataProfileName.value.trim();
  if (!name) {
    els.dataProfileName.focus();
    return;
  }
  const duplicate = appSettings.profiles.find(
    (profile) => normalizeKeyText(profile.name) === normalizeKeyText(name)
  );
  if (duplicate) {
    appSettings.dataProfile = duplicate.id;
    renderProfiles();
    setStatus(`Профиль «${duplicate.name}» уже существует.`);
    els.dataProfileName.focus();
    els.dataProfileName.select();
    return;
  }
  const baseId = slugId(name);
  let id = baseId;
  let suffix = 2;
  while (appSettings.profiles.some((profile) => profile.id === id)) id = `${baseId}-${suffix++}`;
  appSettings.profiles.push({ id, name: name.trim().slice(0, 60) });
  appSettings.dataProfile = id;
  localStorage.setItem(dataProfileStorageKey, id);
  applySettingsChange('Добавлен профиль');
}

function renameProfile() {
  if (collectionInProgress) return;
  const profile = appSettings.profiles.find((item) => item.id === appSettings.dataProfile);
  if (!profile) return;
  const name = els.dataProfileName.value.trim();
  if (!name) {
    els.dataProfileName.focus();
    return;
  }
  const duplicate = appSettings.profiles.find((item) => (
    item.id !== profile.id && normalizeKeyText(item.name) === normalizeKeyText(name)
  ));
  if (duplicate) {
    setStatus(`Профиль «${duplicate.name}» уже существует.`);
    els.dataProfileName.focus();
    els.dataProfileName.select();
    return;
  }
  profile.name = name.trim().slice(0, 60);
  applySettingsChange('Переименован профиль');
}

function deleteProfile() {
  if (collectionInProgress) return;
  if (appSettings.profiles.length <= 1) return;
  const profile = appSettings.profiles.find((item) => item.id === appSettings.dataProfile);
  if (!profile) return;
  const fallback = appSettings.profiles.find((item) => item.id !== profile.id);
  if (!fallback || !globalThis.confirm([
    `Удалить профиль «${profile.name}»?`,
    '',
    `Покупки, ожидаемые возвраты и гарантии будут перенесены в «${fallback.name}».`,
    'Бюджеты, сохранённые итоги месяцев и скрытые советы этого профиля будут удалены.',
    '',
    'Нажмите «ОК», чтобы удалить профиль, или «Отмена», чтобы ничего не менять.'
  ].join('\n'))) return;
  appSettings.profiles = appSettings.profiles.filter((item) => item.id !== profile.id);
  for (const override of Object.values(appSettings.overrides)) {
    if (override.profile === profile.id) override.profile = fallback.id;
  }
  for (const claim of appSettings.refundClaims) {
    if (claim.profile === profile.id) claim.profile = fallback.id;
  }
  for (const record of appSettings.warranties) {
    if (record.profile === profile.id) record.profile = fallback.id;
  }
  for (const collection of ['monthClosures', 'recurringDecisions', 'anomalyDismissals']) {
    for (const key of Object.keys(appSettings[collection] || {})) {
      if (key.startsWith(`${profile.id}\u0001`)) delete appSettings[collection][key];
    }
  }
  for (const key of Object.keys(appSettings.budgets)) {
    if (key.startsWith(`${profile.id}\u0001`)) delete appSettings.budgets[key];
  }
  appSettings.dataProfile = fallback.id;
  if (appSettings.activeProfile === profile.id) appSettings.activeProfile = 'all';
  localStorage.setItem(dataProfileStorageKey, appSettings.dataProfile);
  localStorage.setItem(activeProfileStorageKey, appSettings.activeProfile);
  applySettingsChange('Удалён профиль');
}

function activeClaimForRow(rowId) {
  return appSettings.refundClaims.find((claim) => claim.rowId === rowId);
}

function archiveRecordForRow(rowId) {
  return appSettings.warranties.find((record) => record.rowId === rowId);
}

function updateOperationSimilarHint() {
  const row = rows.find((item) => item.rowId === selectedOperationRowId);
  if (!row) {
    els.operationSimilarHint.textContent = 'Перед сохранением покажем, сколько покупок изменится.';
    return;
  }
  const category = String(els.operationCategoryInput.value || els.operationCategorySelect.value || row.category || '').trim();
  const rule = category ? preferences.deriveCategoryRule(row, category) : null;
  const count = rule?.keywords?.length ? matchingCategoryRuleRows(rule).length : 0;
  els.operationSimilarHint.textContent = count > 1
    ? `Категория применится к ${formatCount(count, ['покупке', 'покупкам', 'покупкам'])}, включая эту.`
    : 'Категория изменится только у этой покупки; подходящих похожих названий пока нет.';
}

function openOperationEditor(rowId) {
  if (collectionInProgress) return;
  const row = rows.find((item) => item.rowId === rowId) || sourceRows.find((item) => item.rowId === rowId);
  if (!row) return;
  selectedOperationRowId = rowId;
  operationReturnFocusRowId = rowId;
  renderProfiles();
  renderCategorySelectors();
  els.operationTitlePreview.textContent = `${row.title} · ${shortDate(row.date)} · ${formatRub(rowAmount(row))}`;
  if ([...els.operationCategorySelect.options].some((option) => option.value === row.category)) {
    els.operationCategorySelect.value = row.category;
    els.operationCategoryInput.value = '';
  } else {
    els.operationCategorySelect.value = '';
    els.operationCategoryInput.value = row.category || '';
  }
  els.operationProfileSelect.value = row.profile || appSettings.profiles[0].id;
  els.operationNote.value = row.note || '';
  els.operationExcluded.checked = row.excluded === true;
  els.markRefundClaim.checked = Boolean(activeClaimForRow(rowId));
  els.markRefundClaim.disabled = isRefundRow(row);
  const archiveRecord = archiveRecordForRow(rowId);
  els.markWarranty.checked = Boolean(archiveRecord);
  els.operationWarrantyFields.hidden = !archiveRecord;
  els.operationWarrantyUntil.value = archiveRecord?.expiresAt || '';
  els.operationDocumentUrl.value = archiveRecord?.url || row.receipt_url || '';
  els.operationWarrantyNote.value = archiveRecord?.note || '';
  els.operationDocumentUrl.setCustomValidity('');
  els.operationApplySimilar.checked = false;
  updateOperationSimilarHint();
  els.operationEditor.showModal();
}

function saveOperationEdit() {
  if (collectionInProgress) return;
  const row = rows.find((item) => item.rowId === selectedOperationRowId);
  const sourceRow = sourceRows.find((item) => item.rowId === selectedOperationRowId);
  if (!row || !sourceRow) return;
  const documentUrl = els.operationDocumentUrl.value.trim();
  if (els.markWarranty.checked && documentUrl && !/^https?:\/\/[^\s]+$/i.test(documentUrl)) {
    els.operationDocumentUrl.setCustomValidity('Укажите ссылку, начинающуюся с http:// или https://');
    els.operationDocumentUrl.reportValidity();
    return;
  }
  els.operationDocumentUrl.setCustomValidity('');
  const category = String(els.operationCategoryInput.value || els.operationCategorySelect.value || row.category || '').trim();
  const override = sparseOperationOverride(rowBeforeManualOverride(sourceRow), {
    category,
    profile: els.operationProfileSelect.value || appSettings.profiles[0].id,
    note: els.operationNote.value.trim(),
    excluded: els.operationExcluded.checked
  });
  if (Object.keys(override).length) appSettings.overrides[row.rowId] = override;
  else delete appSettings.overrides[row.rowId];

  const existingClaim = activeClaimForRow(row.rowId);
  if (els.markRefundClaim.checked && !existingClaim && !isRefundRow(row)) {
    appSettings.refundClaims.push({
      id: `refund-${row.rowId}`.slice(0, 160),
      rowId: row.rowId,
      source: row.source,
      marketplace_id: row.marketplace_id || null,
      title: row.title,
      expectedAmount: Math.abs(rowAmount(row)),
      profile: els.operationProfileSelect.value || row.profile,
      purchaseDate: shortDate(row.date),
      requestedAt: localInputDate(new Date()),
      status: 'pending'
    });
  } else if (els.markRefundClaim.checked && existingClaim) {
    existingClaim.profile = els.operationProfileSelect.value || row.profile;
    existingClaim.purchaseDate ||= shortDate(row.date);
  } else if (!els.markRefundClaim.checked && existingClaim) {
    appSettings.refundClaims = appSettings.refundClaims.filter((claim) => claim !== existingClaim);
  }

  const existingArchive = archiveRecordForRow(row.rowId);
  if (els.markWarranty.checked) {
    const draft = {
      id: existingArchive?.id || `archive-${row.rowId}`.slice(0, 160),
      kind: els.operationWarrantyUntil.value ? 'warranty' : 'receipt',
      rowId: row.rowId,
      marketplace_id: row.marketplace_id || null,
      source: row.source || null,
      title: row.title || 'Документ',
      issuedAt: normalizedDay(row.date) || null,
      expiresAt: normalizedDay(els.operationWarrantyUntil.value) || null,
      url: documentUrl || null,
      note: els.operationWarrantyNote.value.trim() || null,
      addedAt: existingArchive?.addedAt || localInputDate(new Date())
    };
    let normalizedArchive;
    try {
      normalizedArchive = lifecycle.normalizeArchiveRecord(draft);
    } catch (error) {
      setStatus(`Не удалось сохранить документ: ${error.message}`);
      return;
    }
    const nextArchive = { ...normalizedArchive, profile: els.operationProfileSelect.value || row.profile };
    if (existingArchive) Object.assign(existingArchive, nextArchive);
    else appSettings.warranties.push(nextArchive);
  } else if (existingArchive) {
    appSettings.warranties = appSettings.warranties.filter((record) => record !== existingArchive);
  }

  if (els.operationApplySimilar.checked && category) {
    const rule = preferences.deriveCategoryRule(row, category);
    if (rule.keywords.length) upsertCategoryRule(rule);
  }

  els.operationEditor.close();
  selectedOperationRowId = '';
  applySettingsChange('Изменена операция');
  focusOperationReturn();
}

function focusOperationReturn() {
  const rowId = operationReturnFocusRowId;
  requestAnimationFrame(() => {
    const target = [...document.querySelectorAll('.detail-edit')]
      .find((button) => button.dataset.rowId === rowId);
    if (target) target.focus();
    else {
      els.detailTitle.tabIndex = -1;
      els.detailTitle.focus();
    }
  });
}

function claimMatchesActiveProfile(claim) {
  if (appSettings.activeProfile === 'all') return true;
  if (claim?.profile) return claim.profile === appSettings.activeProfile;
  const row = rows.find((item) => item.rowId === claim?.rowId);
  return row?.profile === appSettings.activeProfile;
}

function refundLifecycleClaim(claim) {
  return {
    id: claim.id,
    rowId: claim.rowId,
    marketplace_id: claim.marketplace_id,
    source: claim.source,
    title: claim.title,
    expectedAmount: claim.expectedAmount,
    requestedAt: claim.requestedAt,
    purchaseDate: claim.purchaseDate,
    dueDate: claim.dueDate,
    status: claim.status,
    manualMatchRowIds: claim.manualMatchRowIds || [],
    confirmedAt: claim.confirmedAt,
    note: claim.note
  };
}

function refundCenterResult() {
  const scopedRows = rows.filter(rowMatchesActiveProfile);
  const scopedClaims = appSettings.refundClaims.filter(claimMatchesActiveProfile);
  try {
    return {
      ...lifecycle.reconcileExpectedReturns(scopedClaims.map(refundLifecycleClaim), scopedRows, { now: localInputDate(new Date()) }),
      rows: scopedRows
    };
  } catch (error) {
    appendLog(`Предупреждение: центр возвратов не обновлён: ${error.message}`, 'refund-center-error');
    return {
      returns: [],
      unmatchedRefunds: [],
      summary: { total: 0, pending: 0, partial: 0, disputed: 0, received: 0, overdue: 0, expectedAmount: 0, outstandingAmount: 0 },
      rows: scopedRows,
      error: error.message
    };
  }
}

function adoptRefundLifecycle(result) {
  const derived = new Map(result.returns.map((claim) => [claim.id, claim]));
  let changed = false;
  appSettings.refundClaims = appSettings.refundClaims.map((claim) => {
    const item = derived.get(claim.id);
    if (!item) return claim;
    const next = {
      ...claim,
      status: item.status,
      dueDate: item.dueDate,
      manualMatchRowIds: item.manualMatchRowIds,
      confirmedAt: item.confirmedAt
    };
    if (JSON.stringify(next) !== JSON.stringify(claim)) changed = true;
    return next;
  });
  return changed;
}

function renderRefundClaims() {
  clearNode(els.refundClaims);
  const result = refundCenterResult();
  if (adoptRefundLifecycle(result)) {
    if (automaticPersistenceAllowed()) persistSnapshot('Обновлены статусы возвратов');
  }
  if (!result.returns.length) {
    const empty = document.createElement('div');
    empty.className = 'data-empty';
    empty.textContent = result.error || 'Откройте покупку и отметьте, что ожидаете возврат.';
    els.refundClaims.appendChild(empty);
    return result;
  }

  const summary = document.createElement('div');
  summary.className = 'refund-summary';
  summary.textContent = `Не получено ${formatRub(result.summary.outstandingAmount)} · просрочены: ${result.summary.overdue} · получены: ${result.summary.received}`;
  els.refundClaims.appendChild(summary);
  const statusLabels = { pending: 'ожидается', partial: 'получен частично', disputed: 'нужно сопоставить', overdue: 'просрочен', received: 'получен' };
  for (const claim of result.returns.slice(0, 50)) {
    const row = result.rows.find((item) => item.rowId === claim.rowId);
    const remove = smallButton('Убрать', () => {
      appSettings.refundClaims = appSettings.refundClaims.filter((item) => item.id !== claim.id && item !== claim);
      applySettingsChange('Убрана отметка возврата');
    }, 'secondary', `Убрать отметку возврата для ${row?.title || claim.title || 'операции'}`);
    const item = dataListItem(
      row?.title || claim.title || 'Возврат',
      `${formatRub(claim.expectedAmount)} · ${statusLabels[claim.status] || claim.status}${claim.outstandingAmount ? ` · осталось ${formatRub(claim.outstandingAmount)}` : ''}${claim.dueDate && claim.status !== 'received' ? ` · срок ${shortDate(claim.dueDate)}` : ''}`,
      [remove]
    );
    item.classList.add('refund-claim-item', `status-${claim.status}`);
    els.refundClaims.appendChild(item);
  }
  return result;
}

function renderMoneyRecovery(result) {
  const outstanding = Number(result?.summary?.outstandingAmount) || 0;
  if (!result || result.error || outstanding <= 0) {
    els.moneyRecovery.hidden = true;
    return;
  }
  const openReturns = result.returns.filter((claim) => claim.status !== 'received' && Number(claim.outstandingAmount) > 0);
  const nearestDueDate = openReturns.map((claim) => claim.dueDate).filter(Boolean).sort()[0] || '';
  const facts = [
    `${formatCount(openReturns.length, ['возврат', 'возврата', 'возвратов'])} ещё не получено`,
    result.summary.overdue ? `просрочено ${result.summary.overdue}` : '',
    result.summary.partial ? `частично пришло ${result.summary.partial}` : '',
    result.summary.disputed ? `нужно сопоставить ${result.summary.disputed}` : '',
    nearestDueDate ? `ближайший срок ${shortDate(nearestDueDate)}` : ''
  ].filter(Boolean);
  els.moneyRecovery.hidden = false;
  els.moneyRecovery.classList.toggle('warning', result.summary.overdue > 0 || result.summary.disputed > 0);
  els.moneyRecoveryTitle.textContent = `Ожидается ещё ${formatRub(outstanding)}`;
  els.moneyRecoveryText.textContent = facts.join(' · ');
}

function applyControlSettingsChange(reason) {
  appSettings = normalizeSettings(appSettings);
  withAutomaticPersistenceSuppressed(() => {
    renderBudgets();
    const refunds = renderRefundClaims();
    renderControl(refunds);
  });
  persistSnapshot(reason);
}

function controlAnalysis() {
  if (intelligenceCacheRows !== rows) {
    intelligenceCacheRows = rows;
    intelligenceCacheByProfile.clear();
  }
  const key = appSettings.activeProfile;
  if (!intelligenceCacheByProfile.has(key)) {
    const input = rows.filter(rowMatchesActiveProfile);
    intelligenceCacheByProfile.set(key, { input, report: intelligence.analyze(input) });
    while (intelligenceCacheByProfile.size > 4) {
      intelligenceCacheByProfile.delete(intelligenceCacheByProfile.keys().next().value);
    }
  }
  return intelligenceCacheByProfile.get(key);
}

function controlEmpty(container, text) {
  clearNode(container);
  const empty = document.createElement('div');
  empty.className = 'data-empty';
  empty.textContent = text;
  container.appendChild(empty);
}

function controlItem(titleText, detailText, actions = [], kind = '', noteText = '') {
  const item = document.createElement('div');
  item.className = `control-item ${kind}`.trim();
  const copy = document.createElement('div');
  copy.className = 'control-item-copy';
  const title = document.createElement('strong');
  title.textContent = titleText;
  const detail = document.createElement('span');
  detail.textContent = detailText;
  copy.append(title, detail);
  if (noteText) {
    const note = document.createElement('small');
    note.textContent = noteText;
    copy.appendChild(note);
  }
  const controls = document.createElement('div');
  controls.className = 'control-item-actions';
  for (const action of actions) controls.appendChild(action);
  item.append(copy, controls);
  return item;
}

function renderControlKpis(values) {
  clearNode(els.controlKpis);
  for (const [value, label, kind] of values) {
    const card = document.createElement('div');
    card.className = `category-quality-card ${kind}`.trim();
    const strong = document.createElement('strong');
    strong.textContent = String(value);
    const span = document.createElement('span');
    span.textContent = label;
    card.append(strong, span);
    els.controlKpis.appendChild(card);
  }
}

function anomalyDecisionKey(anomaly, input) {
  const ids = anomaly.rowIndexes
    .map((index) => input[index]?.rowId || `${input[index]?.date || ''}:${input[index]?.title || index}`)
    .sort();
  return `${appSettings.activeProfile}\u0001${anomaly.type}\u0001${ids.join('|')}`.slice(0, 500);
}

function renderAnomalies(analysis) {
  const labels = {
    possible_duplicate: 'Возможный дубль',
    price_increase: 'Цена заметно выросла',
    large_new_expense: 'Новая крупная трата',
    refund_without_purchase: 'Возврат без найденной покупки'
  };
  const visible = analysis.report.anomalies.filter((item) => !appSettings.anomalyDismissals[anomalyDecisionKey(item, analysis.input)]);
  els.anomalySummary.textContent = visible.length ? String(visible.length) : 'всё проверено';
  if (!visible.length) {
    controlEmpty(els.anomalyList, analysis.report.meta.processedRows ? 'Новых аномалий не найдено.' : 'Добавьте историю покупок.');
    return visible;
  }
  clearNode(els.anomalyList);
  for (const anomaly of visible.slice(0, 30)) {
    const key = anomalyDecisionKey(anomaly, analysis.input);
    const firstRow = analysis.input[anomaly.rowIndexes[0]];
    const details = [
      anomaly.amount ? formatRub(anomaly.amount) : '',
      anomaly.changePercent ? `${Math.round(anomaly.changePercent * 100)}% к прошлой покупке` : '',
      confidenceWords(anomaly.confidence)
    ].filter(Boolean).join(' · ');
    const actions = [];
    if (firstRow) actions.push(smallButton('Проверить', () => openOperationEditor(firstRow.rowId), 'secondary'));
    actions.push(smallButton('Не проблема', () => {
      appSettings.anomalyDismissals[key] = true;
      applyControlSettingsChange('Проверена аномалия');
    }, 'secondary'));
    els.anomalyList.appendChild(controlItem(
      labels[anomaly.type] || 'Нужно проверить',
      `${anomaly.name}${details ? ` · ${details}` : ''}`,
      actions,
      anomaly.type === 'refund_without_purchase' ? 'danger' : 'warning',
      anomaly.reason
    ));
  }
  return visible;
}

function recurringDecisionKey(item) {
  return `${appSettings.activeProfile}\u0001${item.key}`.slice(0, 500);
}

function renderRecurring(analysis) {
  const decisions = appSettings.recurringDecisions;
  const ignored = analysis.report.recurring.filter((item) => decisions[recurringDecisionKey(item)] === 'ignored');
  const visible = analysis.report.recurring.filter((item) => decisions[recurringDecisionKey(item)] !== 'ignored');
  const confirmed = visible.filter((item) => decisions[recurringDecisionKey(item)] === 'confirmed');
  const pending = visible.filter((item) => decisions[recurringDecisionKey(item)] !== 'confirmed');
  els.recurringSummary.textContent = `${confirmed.length} подтверждено · ${pending.length} на проверке${ignored.length ? ` · ${ignored.length} скрыто` : ''}`;
  if (!visible.length) {
    controlEmpty(els.recurringList, analysis.report.meta.processedRows ? 'Устойчивых повторов пока не найдено.' : 'Добавьте историю покупок.');
    return { confirmed, pending, ignored };
  }
  clearNode(els.recurringList);
  for (const item of [...confirmed, ...pending].slice(0, 30)) {
    const key = recurringDecisionKey(item);
    const isConfirmed = decisions[key] === 'confirmed';
    const group = analysis.report.groups.find((candidate) => candidate.id === item.groupId);
    const firstRow = group ? analysis.input[group.rowIndexes.at(-1)] : null;
    const actions = [];
    if (firstRow) actions.push(smallButton('Покупки', () => openOperationEditor(firstRow.rowId), 'secondary'));
    if (isConfirmed) {
      actions.push(smallButton('Снять', () => {
        delete appSettings.recurringDecisions[key];
        applyControlSettingsChange('Снято подтверждение повтора');
      }, 'secondary'));
    } else {
      actions.push(smallButton('Подтвердить', () => {
        appSettings.recurringDecisions[key] = 'confirmed';
        applyControlSettingsChange('Подтверждён повторяющийся расход');
      }));
      actions.push(smallButton('Скрыть', () => {
        appSettings.recurringDecisions[key] = 'ignored';
        applyControlSettingsChange('Скрыт неподходящий повтор');
      }, 'secondary'));
    }
    els.recurringList.appendChild(controlItem(
      item.name,
      `${formatCount(item.occurrenceCount, ['покупка', 'покупки', 'покупок'])} · примерно раз в ${formatCount(Math.round(item.intervalDays), ['день', 'дня', 'дней'])} · ${formatRub(item.estimatedAnnualAmount)} в год`,
      actions,
      isConfirmed ? '' : 'warning',
      `${isConfirmed ? 'Подтверждено вами' : 'Требует подтверждения'} · ${confidenceWords(item.confidence)}`
    ));
  }
  return { confirmed, pending, ignored };
}

function renderPriceHistory(analysis) {
  const histories = analysis.report.priceHistory
    .filter((item) => item.observations.length >= 2)
    .sort((left, right) => Math.abs(right.changePercent || 0) - Math.abs(left.changePercent || 0)
      || String(right.observations.at(-1)?.date || '').localeCompare(String(left.observations.at(-1)?.date || '')));
  els.priceHistorySummary.textContent = histories.length ? formatCount(histories.length, ['товар', 'товара', 'товаров']) : '';
  if (!histories.length) {
    controlEmpty(els.priceHistoryList, analysis.report.meta.processedRows ? 'Для сравнения нужны хотя бы две похожие покупки.' : 'Добавьте историю покупок.');
    return histories;
  }
  clearNode(els.priceHistoryList);
  const units = { item: 'шт.', g: 'г', ml: 'мл' };
  for (const item of histories.slice(0, 30)) {
    const current = item.observations.at(-1);
    const previous = item.observations.at(-2);
    const row = analysis.input[current.rowIndex];
    const change = item.changePercent === null ? '' : `${item.changePercent >= 0 ? '+' : ''}${Math.round(item.changePercent * 100)}%`;
    const actions = row ? [smallButton('Открыть', () => openOperationEditor(row.rowId), 'secondary')] : [];
    els.priceHistoryList.appendChild(controlItem(
      item.name,
      `${formatRub(item.latestUnitPrice)} за ${units[item.unit] || item.unit} · было ${formatRub(item.previousUnitPrice)} · ${change}`,
      actions,
      item.changePercent >= 0.35 ? 'warning' : '',
      `${shortDate(previous.date)} → ${shortDate(current.date)} · ${confidenceWords(item.confidence)}${item.needsReview ? ' · сравнение приблизительное' : ''}`
    ));
  }
  return histories;
}

function strippedArchiveRecord(record) {
  const { profile: _profile, status: _status, ...archive } = record;
  return archive;
}

function warrantyMatchesActiveProfile(record) {
  return appSettings.activeProfile === 'all' || record.profile === appSettings.activeProfile;
}

function archiveLink(url) {
  const link = document.createElement('a');
  link.className = 'secondary control-link';
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = 'Документ';
  return link;
}

function renderWarranties() {
  const stored = appSettings.warranties.filter(warrantyMatchesActiveProfile);
  let archive;
  try {
    archive = lifecycle.buildArchive(stored.map(strippedArchiveRecord), { now: localInputDate(new Date()), expiringDays: 30 });
  } catch (error) {
    els.warrantySummary.textContent = 'ошибка';
    controlEmpty(els.warrantyList, error.message);
    return { entries: [], summary: { active: 0, expiring: 0, expired: 0 } };
  }
  els.warrantySummary.textContent = `${archive.entries.length} · скоро истекут ${archive.summary.expiring}`;
  if (!archive.entries.length) {
    controlEmpty(els.warrantyList, 'Откройте покупку и сохраните срок гарантии или ссылку на чек.');
    return archive;
  }
  clearNode(els.warrantyList);
  const statusLabels = { active: 'действует', expiring: 'скоро истекает', expired: 'истекла' };
  for (const entry of archive.entries.slice(0, 50)) {
    const storedEntry = stored.find((record) => record.id === entry.id);
    const actions = [];
    if (entry.url) actions.push(archiveLink(entry.url));
    if (entry.rowId && rows.some((row) => row.rowId === entry.rowId)) {
      actions.push(smallButton('Изменить', () => openOperationEditor(entry.rowId), 'secondary'));
    }
    actions.push(smallButton('Удалить', () => {
      appSettings.warranties = appSettings.warranties.filter((record) => record.id !== entry.id);
      applyControlSettingsChange('Удалён документ или гарантия');
    }, 'secondary'));
    els.warrantyList.appendChild(controlItem(
      entry.title,
      entry.expiresAt ? `${statusLabels[entry.status]} · до ${shortDate(entry.expiresAt)}` : 'чек без срока гарантии',
      actions,
      entry.status === 'expired' ? 'danger' : entry.status === 'expiring' ? 'warning' : '',
      [sourceLabels[entry.source] || entry.source, storedEntry?.note].filter(Boolean).join(' · ')
    ));
  }
  return archive;
}

function renderRefundCenter(result = refundCenterResult()) {
  const labels = { pending: 'Ожидается', partial: 'Получен частично', disputed: 'Нужно сопоставить', received: 'Получен', overdue: 'Просрочен' };
  els.refundCenterSummary.textContent = `${formatRub(result.summary.outstandingAmount)} не получено · ${result.unmatchedRefunds.length} без ожидания`;
  if (!result.returns.length && !result.unmatchedRefunds.length) {
    controlEmpty(els.refundCenterList, result.error || 'Отметьте покупку, по которой ожидаете возврат.');
    return result;
  }
  clearNode(els.refundCenterList);
  for (const item of result.returns.slice(0, 50)) {
    const stored = appSettings.refundClaims.find((claim) => claim.id === item.id);
    const actions = [];
    if (stored?.rowId && rows.some((row) => row.rowId === stored.rowId)) {
      actions.push(smallButton('Покупка', () => openOperationEditor(stored.rowId), 'secondary'));
    }
    if (item.status === 'disputed' && item.candidateRowIds.length && stored) {
      actions.push(smallButton('Это возврат', () => {
        try {
          const confirmed = lifecycle.confirmDisputedReturn(
            refundLifecycleClaim(stored),
            result.rows,
            [item.candidateRowIds[0]],
            { now: localInputDate(new Date()) }
          );
          Object.assign(stored, confirmed, { profile: stored.profile });
          applyControlSettingsChange('Подтверждено совпадение возврата');
        } catch (error) {
          setStatus(`Не удалось сопоставить возврат: ${error.message}`);
        }
      }));
    }
    actions.push(smallButton('Убрать', () => {
      appSettings.refundClaims = appSettings.refundClaims.filter((claim) => claim.id !== item.id);
      applyControlSettingsChange('Убрана отметка возврата');
    }, 'secondary'));
    els.refundCenterList.appendChild(controlItem(
      item.title,
      `${labels[item.status] || item.status} · ожидается ${formatRub(item.expectedAmount)}${item.receivedAmount ? ` · получено ${formatRub(item.receivedAmount)}` : ''}${item.outstandingAmount ? ` · осталось ${formatRub(item.outstandingAmount)}` : ''}`,
      actions,
      item.status === 'overdue' ? 'danger' : ['partial', 'disputed'].includes(item.status) ? 'warning' : '',
      item.status === 'received' ? `Получено полностью${item.confirmedAt ? ` · подтверждено ${shortDate(item.confirmedAt)}` : ''}` : `срок ${shortDate(item.dueDate)}`
    ));
  }
  for (const refund of result.unmatchedRefunds.slice(0, 10)) {
    const actions = rows.some((row) => row.rowId === refund.rowId)
      ? [smallButton('Открыть', () => openOperationEditor(refund.rowId), 'secondary')]
      : [];
    els.refundCenterList.appendChild(controlItem(
      refund.title,
      `Получен возврат ${formatRub(refund.amount)}, но ожидание для него не найдено`,
      actions,
      'warning',
      `${sourceLabels[refund.source] || refund.source} · ${shortDate(refund.date)}`
    ));
  }
  return result;
}

function currentClosureRecord(month = els.closeMonth.value || currentMonthKey()) {
  return appSettings.monthClosures[closureScopeKey(month)] || lifecycle.createMonthClosure(month);
}

function liveMonthClosure(month) {
  return lifecycle.closeMonth(
    lifecycle.createMonthClosure(month),
    rows.filter(rowMatchesActiveProfile),
    { now: localInputDate(new Date()), confirmReview: true }
  );
}

function renderMonthClosure(refunds) {
  const month = els.closeMonth.value || currentMonthKey();
  if (!els.closeMonth.value) els.closeMonth.value = month;
  const closure = currentClosureRecord(month);
  let live;
  try {
    live = liveMonthClosure(month);
  } catch (error) {
    els.monthCloseStatus.textContent = error.message;
    els.monthCloseAction.disabled = true;
    controlEmpty(els.monthCloseChecklist, 'Исправьте повреждённые даты или суммы в исходных данных.');
    return { closure, live: null, changed: false };
  }
  const changed = closure.status === 'closed' && JSON.stringify(closure.totals) !== JSON.stringify(live.totals);
  const labels = { open: 'Итог ещё не сохранён', 'needs-review': 'Перед сохранением есть замечания', closed: 'Итог месяца сохранён' };
  els.monthCloseStatus.textContent = `${labels[closure.status]} · текущий итог ${formatRub(live.totals.netSpend)} · ${formatCount(live.totals.rowCount, ['операция', 'операции', 'операций'])}${changed ? ' · после закрытия данные изменились' : ''}`;
  els.monthCloseAction.disabled = collectionInProgress || databaseMutationInProgress;
  els.monthCloseAction.textContent = closure.status === 'closed'
    ? 'Пересчитать итог'
    : closure.status === 'needs-review'
      ? 'Сохранить с замечаниями'
      : 'Сохранить итог';
  clearNode(els.monthCloseChecklist);
  const outstanding = refunds.returns.filter((item) => item.purchaseDate?.startsWith(month) && item.status !== 'received');
  const checks = [
    [live.review.issues.length === 0, live.review.issues.length ? `Категории или качество разбора: ${live.review.issues.length} замечаний` : 'Категории и качество разбора проверены'],
    [outstanding.length === 0, outstanding.length ? `Ожидаются возвраты: ${outstanding.length}` : 'Ожидаемых возвратов за месяц нет'],
    [!changed, changed ? 'После фиксации появились новые или изменённые операции' : 'Зафиксированный итог совпадает с текущими данными']
  ];
  for (const [ok, text] of checks) {
    const line = document.createElement('div');
    line.className = `control-check ${ok ? '' : 'warning'}`.trim();
    line.textContent = text;
    els.monthCloseChecklist.appendChild(line);
  }
  return { closure, live, changed };
}

function toggleMonthClosure() {
  if (collectionInProgress || databaseMutationInProgress) return;
  const month = els.closeMonth.value || currentMonthKey();
  const current = currentClosureRecord(month);
  try {
    appSettings.monthClosures[closureScopeKey(month)] = current.status === 'closed'
      ? lifecycle.reopenMonth(current, { now: localInputDate(new Date()) })
      : lifecycle.closeMonth(current, rows.filter(rowMatchesActiveProfile), {
        now: localInputDate(new Date()),
        confirmReview: current.status === 'needs-review'
      });
    const status = appSettings.monthClosures[closureScopeKey(month)].status;
    applyControlSettingsChange(status === 'closed' ? `Закрыт месяц ${month}` : status === 'open' ? `Повторно открыт месяц ${month}` : `Проверяется месяц ${month}`);
  } catch (error) {
    setStatus(`Не удалось изменить статус месяца: ${error.message}`);
  }
}

function renderControl(refundResult = null) {
  let analysis;
  try {
    analysis = controlAnalysis();
  } catch (error) {
    appendLog(`Предупреждение: локальный анализ не выполнен: ${error.message}`, 'intelligence-error');
    const emptyAnalysis = { input: [], report: { anomalies: [], recurring: [], priceHistory: [], groups: [], meta: { processedRows: 0 } } };
    analysis = emptyAnalysis;
  }
  const refunds = refundResult || refundCenterResult();
  const anomalies = renderAnomalies(analysis);
  const recurring = renderRecurring(analysis);
  renderPriceHistory(analysis);
  renderRefundCenter(refunds);
  const archive = renderWarranties();
  const month = renderMonthClosure(refunds);
  const refundAttention = refunds.summary.overdue + refunds.summary.disputed + refunds.summary.partial;
  const warrantyAttention = archive.summary.expiring + archive.summary.expired;
  const monthAttention = month.changed || month.closure.status === 'needs-review' ? 1 : 0;
  const actionable = anomalies.length + recurring.pending.length + refundAttention + warrantyAttention + monthAttention;
  renderControlKpis([
    [anomalies.length, 'необычных операций', anomalies.length ? 'warning' : 'ok'],
    [recurring.confirmed.length, 'регулярных покупок подтверждено', ''],
    [formatRub(refunds.summary.outstandingAmount), 'денег по возвратам ещё не пришло', refunds.summary.overdue ? 'warning' : ''],
    [warrantyAttention, 'гарантий скоро закончатся или уже закончились', warrantyAttention ? 'warning' : 'ok']
  ]);
  els.controlBadge.hidden = actionable === 0;
  els.controlBadge.textContent = actionable > 99 ? '99+' : String(actionable);
  renderHomeGuide(refunds);
}

function downloadBlob(contents, type, filename) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportBackup() {
  const text = featureStorage.serializeBackup({
    rows: sourceRows,
    settings: appSettings,
    metadata: snapshotMetadata('Резервная копия')
  });
  downloadBlob(text, 'application/json;charset=utf-8', `markettrat-backup-${localInputDate(new Date())}.json`);
  appendLog(`Резервная копия экспортирована: строк ${sourceRows.length}.`);
}

async function importBackup() {
  const file = els.importDataBackupInput.files?.[0];
  if (!file) return;
  const mutationGeneration = beginDatabaseMutation('Дождитесь завершения сбора перед восстановлением из копии.');
  if (!mutationGeneration) {
    els.importDataBackupInput.value = '';
    return;
  }
  const previousState = captureAppState();
  try {
    if (Number(file.size) > (featureStorage.MAX_BACKUP_BYTES || 64 * 1024 * 1024)) {
      throw new Error('резервная копия слишком велика');
    }
    const backup = featureStorage.parseBackup(await file.text());
    if (mutationGeneration !== databaseMutationGeneration) throw new Error('импорт отменён: локальные данные изменились в другой вкладке');
    const exportedAt = new Date(backup.exportedAt);
    const exportedLabel = Number.isFinite(exportedAt.getTime())
      ? exportedAt.toLocaleString('ru-RU')
      : backup.exportedAt;
    const profileCount = Array.isArray(backup.settings?.profiles) ? backup.settings.profiles.length : 0;
    const confirmed = globalThis.confirm([
      'Заменить текущую историю покупок данными из файла?',
      '',
      `Сейчас: ${formatCount(sourceRows.length, ['операция', 'операции', 'операций'])}.`,
      `В файле: ${formatCount(backup.rows.length, ['операция', 'операции', 'операций'])}, разделов покупок: ${profileCount || 1}.`,
      `Копия создана: ${exportedLabel}.`,
      '',
      'Перед заменой MarketTrat сохранит текущую версию, чтобы её можно было вернуть.',
      'Нажмите «ОК», чтобы заменить историю, или «Отмена», чтобы ничего не менять.'
    ].join('\n'));
    if (!confirmed) {
      appendLog('Восстановление из копии отменено после предпросмотра.');
      return;
    }
    demoMode = false;
    restoreSnapshot(backup, 'Импортирована резервная копия');
    lastRunAt = new Date();
    lastRunKind = 'Восстановление из копии';
    hasCollected = sourceRows.length > 0;
    renderRunSummary();
    const saved = await persistSnapshot('Восстановление из копии');
    if (!saved) {
      if (mutationGeneration === databaseMutationGeneration) restoreCapturedState(previousState);
      throw new Error('не удалось сохранить импорт; прежние данные восстановлены');
    }
    if (mutationGeneration !== databaseMutationGeneration) throw new Error('импорт отменён: локальные данные изменились в другой вкладке');
    if (sourceRows.length) completeOnboarding();
    appendLog(`Резервная копия восстановлена: строк ${sourceRows.length}.`);
  } catch (error) {
    showWarnings([error.message]);
    appendLog(`Ошибка восстановления из копии: ${error.message}`);
  } finally {
    els.importDataBackupInput.value = '';
    endDatabaseMutation(mutationGeneration);
  }
}

async function renderHistory() {
  if (!featureStorage) return;
  let history;
  try {
    history = await featureStorage.list();
  } catch (error) {
    appendLog(`Предупреждение: не удалось прочитать историю: ${error.message}`);
    return;
  }
  clearNode(els.dataHistoryList);
  if (!history.length) {
    const empty = document.createElement('div');
    empty.className = 'data-empty';
    empty.textContent = 'История появится после первого сохранения.';
    els.dataHistoryList.appendChild(empty);
    return;
  }
  for (const entry of history) {
    const restore = smallButton('Восстановить', async () => {
      const mutationGeneration = beginDatabaseMutation('Дождитесь завершения текущей операции перед восстановлением.');
      if (!mutationGeneration) return;
      restore.disabled = true;
      try {
        await persistenceQueue.catch(() => null);
        const snapshot = await featureStorage.restore(entry.id, {
          expectedEpoch: dataEpoch,
          expectedRevision: dataRevision
        });
        if (mutationGeneration !== databaseMutationGeneration) return;
        adoptLoadedDataRevision(snapshot.revision);
        dataSyncChannel?.postMessage({
          type: 'data-saved',
          epoch: dataEpoch,
          revision: dataRevision
        });
        demoMode = false;
        restoreSnapshot(snapshot, 'Восстановлена версия');
        await renderHistory();
        appendLog(`Восстановлен снимок от ${formatRunTime(new Date(entry.createdAt))}.`);
      } catch (error) {
        if (error?.code === 'STALE_SNAPSHOT_REVISION') markStorageConflict(error.currentRevision);
        appendLog(`Ошибка восстановления: ${error.message}`);
      } finally {
        restore.disabled = false;
        endDatabaseMutation(mutationGeneration);
      }
    }, 'secondary', `Восстановить снимок от ${formatRunTime(new Date(entry.createdAt))}`);
    els.dataHistoryList.appendChild(dataListItem(
      entry.metadata?.reason || entry.metadata?.lastRunKind || 'Сохранение',
      `${formatRunTime(new Date(entry.createdAt))} · ${entry.rowCount} строк`,
      [restore]
    ));
  }
}

async function deleteAllData() {
  if (!globalThis.confirm('Удалить все локальные данные MarketTrat? Это действие нельзя отменить.')) return;
  const mutationGeneration = beginDatabaseMutation('Дождитесь завершения сбора перед удалением данных.');
  if (!mutationGeneration) return;
  let collectJobCleanupError = null;
  try {
    await persistenceQueue.catch(() => null);
    try {
      await clearBackgroundCollectJobs();
    } catch (error) {
      collectJobCleanupError = error;
    }
    const nextEpoch = await featureStorage.clear();
    const clearedState = await featureStorage.loadWithEpoch();
    adoptLoadedDataRevision(clearedState.revision);
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index);
      if (key?.startsWith('markettrat-')) localStorage.removeItem(key);
    }
    resetLocalDataAfterClear(nextEpoch, false);
    dataSyncChannel?.postMessage({
      type: 'data-cleared',
      epoch: dataEpoch,
      revision: dataRevision
    });
    await renderHistory();
    if (collectJobCleanupError) {
      const message = `Основные данные удалены, но временные данные сбора очистить не удалось: ${collectJobCleanupError.message}`;
      showWarnings([message]);
      appendLog(`Предупреждение: ${message}`);
      setStatus('Основные данные удалены. Временное состояние сбора очистить не удалось.');
    }
  } finally {
    endDatabaseMutation(mutationGeneration);
  }
}

function demoRows() {
  const catalog = [
    ['ozon', 'Корм для кошки', 1890, 'Зоотовары'],
    ['wildberries', 'Кроссовки', 4790, 'Обувь'],
    ['yandex', 'Наушники', 6290, 'Электроника']
  ];
  const result = [];
  const today = new Date();
  for (let offset = 5; offset >= 0; offset -= 1) {
    catalog.forEach(([source, title, amount, category], index) => {
      const plannedDay = 4 + index * 7;
      const day = offset === 0 ? Math.min(plannedDay, today.getDate()) : plannedDay;
      const date = new Date(today.getFullYear(), today.getMonth() - offset, day);
      const dateText = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      result.push({
        date: dateText,
        source,
        title: `${title}${offset % 2 ? '' : ' — пример'}`,
        amount: (amount + (5 - offset) * 130).toFixed(2),
        currency: 'RUB',
        category,
        type: 'purchase',
        marketplace_id: `demo-${source}-${offset}`,
        item_index: String(index)
      });
    });
  }
  const refund = { ...result[result.length - 5] };
  refund.date = result[result.length - 1].date;
  refund.amount = (-Math.abs(Number(refund.amount))).toFixed(2);
  refund.type = 'refund';
  refund.marketplace_id = `${refund.marketplace_id}-refund`;
  result.push(refund);
  return result;
}

function showDemo() {
  if (demoMode) return;
  demoRestoreState = captureAppState();
  demoMode = true;
  hasCollected = true;
  setActiveView('analytics');
  updateResult(demoRows(), {});
  renderQualitySummary(rows, {}, {}, []);
  finishRun('Пример', 0);
  setDemoUi(true);
  setStatus('Открыт пример. Это вымышленные покупки, они не сохранятся после закрытия страницы.', 1, 1);
  hideOnboardingForSession();
  els.demoBanner.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function setDemoUi(active) {
  const enabled = Boolean(active);
  document.body.classList.toggle('demo-mode', enabled);
  els.demoBanner.hidden = !enabled;
  els.collect.disabled = enabled || collectionInProgress || databaseMutationInProgress;
  els.uploadCsv.disabled = enabled || collectionInProgress || databaseMutationInProgress;
  if (enabled) {
    els.downloadCsv.disabled = true;
    els.runDownloadCsv.disabled = true;
  } else {
    updateCsvButton();
  }
  setMutationControlsDisabled(false);
}

function exitDemo(next = '') {
  if (!demoMode) return;
  const restoreState = demoRestoreState;
  demoRestoreState = null;
  demoMode = false;
  if (restoreState) restoreCapturedState(restoreState);
  else {
    hasCollected = false;
    lastRunAt = null;
    lastRunKind = '';
    lastWarningCount = 0;
    lastCollectionReport = { sources: [], stats: {}, warnings: [] };
    updateResult([], {});
  }
  setDemoUi(false);
  setActiveView('analytics');
  if (!sourceRows.length) {
    runDetailsOpen = true;
    renderRunSummary();
    els.onboardingPanel.hidden = false;
    document.body.classList.add('first-run');
  }
  setStatus('Пример закрыт. Ваши данные не менялись.', 0, 1);
  if (next === 'upload') {
    els.uploadCsv.click();
    return;
  }
  if (next === 'start') {
    els.onboardingPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    requestAnimationFrame(() => els.onboardingStart.focus());
  }
}

function hideOnboardingForSession() {
  if (els.onboardingPanel.contains(document.activeElement)) document.activeElement?.blur?.();
  els.onboardingPanel.hidden = true;
  document.body.classList.remove('first-run');
}

function completeOnboarding() {
  hideOnboardingForSession();
  localStorage.setItem(onboardingStorageKey, '1');
}

function renderSpendReport(records, periods, sources, range, previousTotal, refunds) {
  const purchases = records.filter((row) => rowAmount(row) > 0 && !isRefundRow(row));
  if (!records.length) {
    currentReportText = 'Нет операций для выбранной выборки.';
    els.spendReport.textContent = currentReportText;
    els.copyReport.disabled = true;
    return;
  }

  const total = records.reduce((sum, row) => sum + rowAmount(row), 0);
  const categories = buildCategoryBreakdown(records).entries;
  const topCategory = categories[0];
  const topItem = buildTopItems(records)[0];
  const sourceTotals = [...sources]
    .map((source) => ({
      source,
      total: records
        .filter((row) => row.source === source)
        .reduce((sum, row) => sum + rowAmount(row), 0)
    }))
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total);

  const lines = [
    `Итого: ${formatRub(total)} за ${formatCount(records.length, ['операцию', 'операции', 'операций'])}.`
  ];
  const comparison = previousTotal !== null && previousTotal !== undefined ? compareText(total, previousTotal) : '';
  if (comparison) lines.push(`К прошлому периоду: ${comparison}.`);
  if (topCategory) lines.push(`Главная категория: ${categoryName(topCategory.category)} — ${formatRub(topCategory.amount)}.`);
  if (sourceTotals[0]) lines.push(`Главный источник: ${sourceLabels[sourceTotals[0].source]} — ${formatRub(sourceTotals[0].total)}.`);
  if (topItem) lines.push(`Крупнейшая трата: ${topItem.title} — ${formatRub(topItem.amount)}.`);
  if (refunds) lines.push(`Возвраты уменьшили расходы на ${formatRub(refunds)}.`);
  for (const alert of budgetAlertLines()) lines.push(`Бюджет: ${alert}.`);
  if (!purchases.length) lines.push('В выборке только возвраты или корректировки.');

  currentReportText = lines.join('\n');
  els.spendReport.textContent = currentReportText;
  els.copyReport.disabled = false;
}

function buildTopItems(records) {
  const totals = new Map();
  for (const row of records) {
    const amount = Number(row.amount) || 0;
    const title = String(row.title || '').trim();
    if (!amount || !title) continue;
    const key = `${row.source}\u0001${normalizeKeyText(title)}`;
    const current = totals.get(key) || {
      title,
      source: row.source,
      category: row.category || 'unknown',
      amount: 0,
      count: 0,
      refunds: 0,
      firstDate: row.date,
      lastDate: row.date
    };
    current.amount += amount;
    if (amount > 0) current.count += 1;
    else current.refunds += 1;
    if (String(row.date).localeCompare(String(current.firstDate)) < 0) current.firstDate = row.date;
    if (String(row.date).localeCompare(String(current.lastDate)) > 0) current.lastDate = row.date;
    totals.set(key, current);
  }

  return [...totals.values()]
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);
}

function shortDate(value) {
  return String(value || '').slice(0, 10);
}

function topItemMeta(item) {
  const dates = shortDate(item.firstDate) === shortDate(item.lastDate)
    ? shortDate(item.firstDate)
    : `${shortDate(item.firstDate)} - ${shortDate(item.lastDate)}`;
  const parts = [];
  if (item.count > 1) parts.push(formatCount(item.count, ['покупка', 'покупки', 'покупок']));
  if (item.refunds) parts.push(formatCount(item.refunds, ['возврат', 'возврата', 'возвратов']));
  return `${sourceLabels[item.source] || item.source}, ${dates}${parts.length ? `, ${parts.join(', ')}` : ''}`;
}

function renderTopItems(records) {
  clearNode(els.topItems);
  const items = buildTopItems(records);
  if (!items.length) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = 'Нет покупок в выборке';
    els.topItems.appendChild(empty);
    return;
  }

  for (const item of items) {
    const li = document.createElement('li');
    li.className = 'top-item';
    const text = document.createElement('span');
    text.className = 'top-item-text';
    const title = document.createElement('span');
    title.className = 'source-label top-item-title';
    const titleText = document.createElement('span');
    titleText.className = 'top-item-name';
    titleText.textContent = item.title;
    title.append(createSourceBadge(item.source), titleText);
    title.title = `${sourceLabels[item.source] || item.source}: ${item.title}`;
    const meta = document.createElement('span');
    meta.className = 'top-item-meta';
    meta.textContent = topItemMeta(item);
    const category = document.createElement('span');
    category.className = 'category-pill';
    category.style.setProperty('--category-color', categoryColor(item.category));
    category.textContent = categoryName(item.category);
    text.append(title, meta, category);
    const amount = document.createElement('strong');
    amount.className = 'top-item-amount';
    amount.textContent = formatRub(item.amount);
    li.append(text, amount);
    makeClickable(li, () => setDetailFilter({
      type: 'item',
      source: item.source,
      title: item.title,
      label: item.title
    }, true));
    els.topItems.appendChild(li);
  }
}

function matchesDetailFilter(row, group) {
  if (!detailFilter) return true;
  if (detailFilter.type === 'source') return row.source === detailFilter.source;
  if (detailFilter.type === 'category') return (row.category || 'unknown') === detailFilter.category;
  if (detailFilter.type === 'categories') return detailFilter.categories.includes(row.category || 'unknown');
  if (detailFilter.type === 'item') {
    return row.source === detailFilter.source
      && normalizeKeyText(row.title) === normalizeKeyText(detailFilter.title);
  }
  if (detailFilter.type === 'period') {
    const date = parseRowDate(row.date);
    return date && periodKey(date, group) === detailFilter.key;
  }
  return true;
}

function matchesAnalyticsFilter(row, group, ignoreCategoryFilter = false) {
  if (!detailFilter || detailFilter.type === 'period') return true;
  if (ignoreCategoryFilter && (detailFilter.type === 'category' || detailFilter.type === 'categories')) return true;
  return matchesDetailFilter(row, group);
}

function matchesOperation(row) {
  if (detailOperation === 'refund') return isRefundRow(row);
  if (detailOperation === 'purchase') return !isRefundRow(row);
  return true;
}

function operationLabel(operation) {
  if (operation === 'refund') return 'Возвраты';
  if (operation === 'purchase') return 'Покупки';
  return 'Все';
}

function detailCountForms() {
  if (detailOperation === 'refund') return ['возврат', 'возврата', 'возвратов'];
  if (detailOperation === 'purchase') return ['покупка', 'покупки', 'покупок'];
  return ['операция', 'операции', 'операций'];
}

function detailTitleText() {
  const base = detailOperation === 'refund'
    ? 'Детали возвратов'
    : (detailOperation === 'purchase' ? 'Детали покупок' : 'Детали операций');
  const detail = detailFilterName().replace(/^детали: /, '');
  return detail ? `${base}: ${detail}` : base;
}

function syncDetailOperationButtons() {
  for (const button of els.detailOperationButtons) {
    const active = button.dataset.operation === detailOperation;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  }
}

function detailPageSize() {
  return Math.min(maxRenderedDetailRows, Number(els.detailPageSize.value) || 60);
}

function resetDetailPaging() {
  detailShownCount = detailPageSize();
}

function detailSortValue(row, field) {
  if (field === 'amount') return rowAmount(row);
  if (field === 'source') return sourceLabels[row.source] || row.source || '';
  if (field === 'type') return isRefundRow(row) ? 'Возврат' : 'Покупка';
  if (field === 'category') return categoryName(row.category);
  if (field === 'title') return row.title || '';
  return row.date || '';
}

function compareDetailRows(a, b) {
  const left = detailSortValue(a, detailSort.field);
  const right = detailSortValue(b, detailSort.field);
  const direction = detailSort.direction === 'asc' ? 1 : -1;
  if (typeof left === 'number' || typeof right === 'number') {
    return ((Number(left) || 0) - (Number(right) || 0)) * direction;
  }
  return String(left).localeCompare(String(right), 'ru') * direction;
}

function setDetailSort(field) {
  detailSort = {
    field,
    direction: detailSort.field === field && detailSort.direction === 'desc' ? 'asc' : 'desc'
  };
  resetDetailPaging();
  updateDetailsOnly();
}

function renderDetails(records, group) {
  clearNode(els.detailRows);
  const query = normalizeKeyText(els.detailSearch.value);
  syncDetailOperationButtons();
  const filtered = records
    .filter(matchesOperation)
    .filter((row) => matchesDetailFilter(row, group))
    .filter((row) => !query || normalizeKeyText(row.title).includes(query))
    .sort(compareDetailRows);
  const limit = Math.min(detailShownCount, filtered.length, maxRenderedDetailRows);
  const shown = filtered.slice(0, limit);
  const shownIds = new Set(shown.map((row) => row.rowId));

  els.detailTitle.textContent = detailTitleText();
  els.detailSummary.textContent = filtered.length
    ? `${formatCount(filtered.length, detailCountForms())}${filtered.length > shown.length ? ` · показано ${shown.length}` : ''}`
    : '';
  els.clearDetailFilter.hidden = !detailFilter && !query && detailOperation === 'all';
  els.detailMore.hidden = filtered.length <= shown.length || shown.length >= maxRenderedDetailRows;
  els.detailMore.textContent = `Показать ещё ${Math.min(detailPageSize(), filtered.length - shown.length)}`;
  if (filtered.length > maxRenderedDetailRows && shown.length >= maxRenderedDetailRows) {
    els.detailSummary.textContent += ` · в интерфейсе максимум ${maxRenderedDetailRows}, полный список доступен в CSV`;
  }

  if (!filtered.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = records.length ? 'Нет операций для выбранной детализации' : 'Нет операций в выборке';
    els.detailRows.appendChild(empty);
    renderBulkBar();
    return;
  }

  const header = document.createElement('div');
  header.className = 'detail-row header';
  for (const [field, text] of [
    ['date', 'Дата'],
    ['source', 'Источник'],
    ['type', 'Тип'],
    ['title', 'Товар'],
    ['category', 'Категория'],
    ['amount', 'Сумма']
  ]) {
    const cell = document.createElement('span');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = detailSort.field === field ? 'detail-sort active' : 'detail-sort';
    button.textContent = `${text}${detailSort.field === field ? (detailSort.direction === 'asc' ? ' ↑' : ' ↓') : ''}`;
    button.addEventListener('click', () => setDetailSort(field));
    cell.appendChild(button);
    header.appendChild(cell);
  }
  const selectHeader = document.createElement('span');
  selectHeader.className = 'detail-select-cell';
  const selectVisible = document.createElement('input');
  selectVisible.type = 'checkbox';
  selectVisible.checked = shown.length > 0 && shown.every((row) => selectedOperationRowIds.has(row.rowId));
  selectVisible.indeterminate = shown.some((row) => selectedOperationRowIds.has(row.rowId)) && !selectVisible.checked;
  selectVisible.setAttribute('aria-label', 'Выбрать показанные операции');
  selectVisible.addEventListener('change', () => {
    for (const rowId of shownIds) {
      if (selectVisible.checked) selectedOperationRowIds.add(rowId);
      else selectedOperationRowIds.delete(rowId);
    }
    updateDetailsOnly();
  });
  selectHeader.appendChild(selectVisible);
  header.appendChild(selectHeader);
  els.detailRows.appendChild(header);

  for (const row of shown) {
    const item = document.createElement('div');
    item.className = 'detail-row';

    const date = document.createElement('span');
    const fullDate = shortDate(row.date);
    const dateMatch = fullDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    date.textContent = dateMatch ? `${dateMatch[3]}.${dateMatch[2]}.${dateMatch[1].slice(2)}` : fullDate;

    const source = document.createElement('span');
    source.className = 'source-label';
    source.title = sourceLabels[row.source] || row.source;
    source.setAttribute('aria-label', source.title);
    source.append(createSourceBadge(row.source));

    const operation = document.createElement('span');
    operation.className = `operation-pill ${isRefundRow(row) ? 'refund' : 'purchase'}`;
    operation.textContent = isRefundRow(row) ? 'Возврат' : 'Покупка';

    const title = document.createElement('span');
    title.className = 'detail-title';
    title.title = row.title || '';
    const titleText = document.createElement('span');
    titleText.textContent = row.title || '';
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'detail-edit';
    edit.textContent = 'Править';
    edit.dataset.rowId = row.rowId;
    edit.setAttribute('aria-label', `Изменить операцию ${row.title || ''}`);
    edit.addEventListener('click', () => openOperationEditor(row.rowId));
    title.append(titleText, edit);

    const category = document.createElement('button');
    category.type = 'button';
    category.className = 'category-pill';
    category.style.setProperty('--category-color', categoryColor(row.category));
    category.textContent = categoryName(row.category);
    category.title = 'Изменить категорию или профиль';
    category.addEventListener('click', () => openOperationEditor(row.rowId));

    const amount = document.createElement('span');
    amount.className = `detail-amount ${isRefundRow(row) ? 'refund' : ''}`;
    amount.textContent = formatRub(rowAmount(row));

    const selectCell = document.createElement('span');
    selectCell.className = 'detail-select-cell';
    const select = document.createElement('input');
    select.type = 'checkbox';
    select.checked = selectedOperationRowIds.has(row.rowId);
    select.setAttribute('aria-label', `Выбрать операцию ${row.title || ''}`);
    select.addEventListener('change', () => {
      if (select.checked) selectedOperationRowIds.add(row.rowId);
      else selectedOperationRowIds.delete(row.rowId);
      renderBulkBar();
    });
    selectCell.appendChild(select);

    item.append(date, source, operation, title, category, amount, selectCell);
    els.detailRows.appendChild(item);
  }
  renderBulkBar();
}

function updateDetailsOnly() {
  syncDateInputs();
  const sources = selectedAnalyticsSources();
  const group = els.periodGroup.value;
  const { records } = buildAnalyticsData(sources, group);
  renderActiveFilters(sources);
  renderDetails(records, group);
}

function updateAnalytics() {
  syncDateInputs();
  const sources = selectedAnalyticsSources();
  const group = els.periodGroup.value;
  const baseAnalytics = buildAnalyticsData(sources, group, true);
  const { records, periods, total, range } = buildAnalyticsData(sources, group);
  const refunds = records.filter(isRefundRow).reduce((sum, refund) => sum + Math.abs(rowAmount(refund)), 0);
  const prevRange = previousRange(range);
  const prevTotal = prevRange ? totalForRange(sources, prevRange, group) : 0;
  const previousRecords = prevRange ? recordsForRange(sources, prevRange, group, true) : [];

  document.body.classList.toggle('has-visible-data', records.length > 0);

  renderActiveFilters(sources);
  els.analyticsEmptyText.textContent = hasCollected
    ? (sources.size
        ? (appSettings.activeProfile === 'all' ? 'За выбранный период покупок нет. Сбросьте фильтры или обновите историю.' : 'Для выбранного человека и периода покупок нет. Сбросьте фильтры или выберите другой профиль.')
        : 'Сейчас выключены все магазины. Сбросьте фильтры, чтобы снова увидеть покупки.')
    : 'Оставьте нужные магазины отмеченными сверху и нажмите «Добавить покупки». В этом браузере нужно заранее войти в выбранные магазины.';
  els.analyticsEmptyActions.hidden = false;
  els.emptyCollect.textContent = hasCollected ? 'Обновить покупки' : 'Добавить покупки';
  els.emptyReset.hidden = !hasCollected;

  els.analyticsTotal.textContent = formatRub(total);
  const scope = analyticsScopeName();
  els.analyticsTotalLabel.textContent = scope ? `итого: ${scope}` : 'итого, ₽';
  const comparison = prevRange ? compareText(total, prevTotal) : '';
  els.analyticsTotalCompare.textContent = comparison;
  els.analyticsTotalCompare.className = comparison.startsWith('+')
    ? 'up'
    : (comparison.startsWith('-') ? 'down' : '');
  els.analyticsAverage.textContent = formatRub(averageForPeriods(total, periods));
  els.analyticsAverageLabel.textContent = `${averagePeriodLabel(group)}${scope ? `: ${scope}` : ''}`;
  els.analyticsPurchases.textContent = String(records.length);
  els.analyticsPurchasesLabel.textContent = pluralRu(records.length, ['операция', 'операции', 'операций']);
  els.analyticsRefunds.textContent = formatRub(refunds);
  els.chartRange.textContent = periods.length ? `${periods[0].key} - ${periods[periods.length - 1].key}` : '';

  const categoryOrder = new Map(buildCategoryBreakdown(records).entries.map((item, index) => [item.category, index]));
  renderPeriodChart(periods, categoryOrder);
  renderSourceBreakdown(records);
  renderCategoryBreakdown(baseAnalytics.records, previousRecords);
  renderSpendReport(records, periods, sources, range, prevRange ? prevTotal : null, refunds);
  renderReportTrust(baseAnalytics.records);
  renderActionInsights(records, prevRange ? previousRecords : null);
  renderBudgets();
  const refundResult = renderRefundClaims();
  renderMoneyRecovery(refundResult);
  renderTopItems(records);
  renderDetails(records, group);
  renderCategoryReview();
  renderHomeGuide(refundResult);
  if (els.controlView.classList.contains('active')) renderControl(refundResult);
  updateCsvButton();
}

function updateResult(records, stats = {}) {
  const serviceRowsPreserved = records.filter(isServiceRow).length;
  const preparedRows = records.map(prepareSourceRow);
  const deduped = dedupeRows(preparedRows);
  const refundRows = deduped.rows.filter(isRefundRow);
  const cleaningStats = {
    refundRows: refundRows.length,
    refundAmount: refundRows.reduce((sum, row) => sum + Math.abs(rowAmount(row)), 0),
    serviceRowsPreserved,
    duplicateRowsDropped: deduped.duplicates
  };
  sourceRows = preferences.withStableRowIds(deduped.rows)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  pruneNoopOperationOverrides();
  if (!sourceRows.length) setAnalyticsDetailsExpanded(false);
  applyAppPreferences();
  document.body.classList.toggle('has-data', sourceRows.length > 0);
  els.collect.textContent = sourceRows.length ? 'Обновить покупки' : 'Добавить покупки';
  els.controlBadge.hidden = true;
  updateCsvButton();
  updateDateInputBounds();
  logParserStats({ ...stats, cleaning: cleaningStats });
  renderProfiles();
  renderCategoryRules();
  renderOperationOverrides();
  updateAnalytics();
  renderRunSummary();
  return cleaningStats;
}

function downloadCsv() {
  const records = csvExportRows();
  if (!records.length) return;
  const exportText = makeCsv(records);
  const url = URL.createObjectURL(new Blob([exportText], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `markettrat-${csvExportSuffix()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  appendLog(`CSV экспорт: строк ${records.length}${csvExportIsFiltered() ? ', применён фильтр отчёта' : ''}.`);
}

async function copyLog() {
  await navigator.clipboard.writeText(privacy.redactLog(logLines));
  const oldText = els.copyLog.textContent;
  els.copyLog.textContent = 'Скопировано';
  setTimeout(() => {
    els.copyLog.textContent = oldText;
  }, 1200);
}

async function uploadCsv() {
  const files = [...(els.uploadCsvInput.files || [])];
  if (!files.length) return;
  const totalBytes = files.reduce((sum, file) => sum + (Number(file.size) || 0), 0);
  if (totalBytes > maxCsvImportBytes) {
    setStatus('Ошибка загрузки CSV: общий размер файлов больше 20 МБ.');
    showWarnings(['Общий размер выбранных CSV больше 20 МБ.']);
    els.uploadCsvInput.value = '';
    return;
  }
  const mutationGeneration = beginDatabaseMutation('Дождитесь завершения сбора перед загрузкой CSV.');
  if (!mutationGeneration) {
    els.uploadCsvInput.value = '';
    return;
  }
  const existingRows = demoMode ? [] : sourceRows.slice();
  const previousState = captureAppState();
  let stateChanged = false;

  showWarnings();

  try {
    const importedRows = [];
    for (const file of files) {
      if (Number(file.size) > maxCsvImportBytes) {
        throw new Error(`${file.name || 'CSV'}: файл больше 20 МБ`);
      }
      const parsed = globalThis.parseSpendCsv(await file.text());
      if (mutationGeneration !== databaseMutationGeneration) throw new Error('импорт CSV отменён: локальные данные изменились в другой вкладке');
      importedRows.push(...parsed);
      if (existingRows.length + importedRows.length > (featureStorage.MAX_ROWS || 100000)) {
        throw new Error('в объединённой базе больше 100 000 строк');
      }
    }
    if (!importedRows.length) throw new Error('в CSV нет строк');

    demoMode = false;
    hasCollected = true;
    selectedPeriodKey = '';
    detailFilter = null;
    detailOperation = 'all';
    resetDetailPaging();
    lastRunAt = null;
    lastRunKind = '';
    lastWarningCount = 0;
    lastCollectionReport = { sources: [], stats: {}, warnings: [] };
    runDetailsOpen = true;
    collectStatuses = {};
    renderSourceStatuses();
    const combinedRows = [...existingRows, ...importedRows];
    stateChanged = true;
    let cleaningStats;
    let warnings;
    let kind;
    const saved = await withAutomaticPersistenceSuppressed(async () => {
      cleaningStats = updateResult(combinedRows, {});
      warnings = cleaningStats.duplicateRowsDropped ? [`Удалено дублей при объединении: ${cleaningStats.duplicateRowsDropped}`] : [];
      renderQualitySummary(combinedRows, {}, {
        ...cleaningStats
      }, warnings);
      kind = existingRows.length || files.length > 1 ? 'Объединено' : 'Загружено';
      return finishRun(kind, warnings.length);
    });
    if (!saved) throw new Error('не удалось сохранить CSV; прежние данные восстановлены');
    if (mutationGeneration !== databaseMutationGeneration) throw new Error('импорт CSV отменён: локальные данные изменились в другой вкладке');
    completeOnboarding();
    setStatus(`${kind}: ${formatCount(rows.length, ['операция', 'операции', 'операций'])}. Файлов: ${files.length}. Ниже показан следующий шаг.`, 1, 1);
    appendLog(`CSV импорт: файлов ${files.length}, строк ${rows.length}, дублей ${cleaningStats.duplicateRowsDropped}.`);
    for (const warning of warnings) appendLog(`Предупреждение: ${warning}`);
  } catch (error) {
    if (stateChanged && mutationGeneration === databaseMutationGeneration) restoreCapturedState(previousState);
    setStatus(`Ошибка загрузки CSV: ${error.message}`);
    showWarnings([error.message]);
    appendLog(`Ошибка загрузки CSV: ${error.message}`);
  } finally {
    els.uploadCsvInput.value = '';
    endDatabaseMutation(mutationGeneration);
  }
}

async function collect() {
  const sourceOverride = queuedCollectSources;
  queuedCollectSources = null;
  let activeJobId = storedCollectJobId();
  const sources = Array.isArray(sourceOverride)
    ? sourceOverride.filter((source) => sourcePermissionOrigins[source])
    : selectedCollectSources();
  const baseRows = demoMode ? [] : sourceRows.slice();
  const previousState = captureAppState();
  const knownReceipts = collectKnownReceipts(baseRows);
  const isUpdateRun = baseRows.length > 0;

  if (sources.length === 0 && !activeJobId) {
    setStatus('Выберите хотя бы один источник.');
    appendLog('Источник не выбран.');
    return;
  }

  if (!api?.runtime?.sendMessage) {
    setStatus('Откройте страницу из иконки установленного расширения.');
    appendLog('Сбор доступен только внутри установленного расширения.');
    return;
  }

  if (collectionInProgress || databaseMutationInProgress) {
    setStatus('Дождитесь завершения текущей операции.');
    return;
  }

  const generation = ++collectGeneration;
  collectionInProgress = true;
  els.collect.disabled = true;
  els.uploadCsv.disabled = true;
  els.collectHint.hidden = false;
  setMutationControlsDisabled(true);
  let stateChanged = false;
  let terminalResultReceived = false;

  if (!activeJobId) {
    try {
      await ensureSourcePermissions(sources);
    } catch (error) {
      setStatus(`Сбор не начался. ${friendlyWarningText(error.message)}`);
      showWarnings([error.message]);
      appendLog(`Сбор не запущен: ${error.message}`);
      if (generation === collectGeneration) {
        collectionInProgress = false;
        els.collect.disabled = false;
        els.uploadCsv.disabled = false;
        els.collectHint.hidden = true;
        setMutationControlsDisabled(false);
      }
      return;
    }
  }

  try {
    if (!collectionInProgress || generation !== collectGeneration) return;
    showWarnings();
    setCollectStatuses(sources, 'waiting', 'ожидает');
    logLineByKey.clear();
    if (activeJobId) {
      setStatus('Восстанавливаю завершение предыдущего сбора...', 0, Math.max(1, sources.length));
      appendLog('Найден предыдущий сбор: восстанавливаю его результат.');
    } else {
      setStatus('Начинаю сбор...', 0, sources.length);
      appendLog(`${isUpdateRun ? 'Обновление' : 'Старт'}: ${sources.join(', ')}.`);
      const started = await callChrome(api.runtime.sendMessage, {
        type: 'SPEND_COLLECT_START',
        sources,
        options: {
          ...defaultCollectOptions,
          knownReceipts
        }
      });
      if (!started?.ok || !started.jobId) throw new Error(started?.error || 'Не удалось запустить сбор.');
      activeJobId = started.jobId;
      rememberCollectJob(activeJobId);
    }

    const response = await waitForCollectJob(activeJobId);
    terminalResultReceived = true;
    if (!response?.ok) throw new Error(response?.error || 'Не удалось собрать данные.');
    if (generation !== collectGeneration) {
      appendLog('Результат завершённого сбора пропущен: локальная база уже изменилась.');
      return;
    }

    demoMode = false;
    hasCollected = true;
    selectedPeriodKey = '';
    detailFilter = null;
    detailOperation = 'all';
    resetDetailPaging();
    const warnings = Array.isArray(response.warnings) ? response.warnings.map(String) : [];
    if (!Array.isArray(response.rows)) throw new Error('сбор вернул повреждённый список операций');
    const completedSources = Array.isArray(response.sources)
      ? [...new Set(response.sources.filter((source) => sourcePermissionOrigins[source]))]
      : sources;
    const collectedRows = response.rows;
    let resultRows = mergeCollectedRows(baseRows, collectedRows, response.supersededReceiptKeys);
    const maxRows = featureStorage?.MAX_ROWS || 100000;
    if (resultRows.length > maxRows) {
      const unique = dedupeRows(resultRows);
      if (unique.rows.length > maxRows) {
        throw new Error(`сбор вернул больше ${maxRows.toLocaleString('ru-RU')} уникальных операций; прежняя база не изменена`);
      }
      resultRows = unique.rows;
    }
    lastCollectionReport = normalizeCollectionReport({
      sources: completedSources,
      stats: response.stats || {},
      warnings
    });
    stateChanged = true;
    const saved = await withAutomaticPersistenceSuppressed(async () => {
      const cleaningStats = updateResult(resultRows, response.stats || {});
      renderQualitySummary(resultRows, response.stats || {}, cleaningStats, warnings);
      showWarnings(warnings);
      for (const warning of warnings) appendLog(`Предупреждение: ${warning}`);
      for (const source of completedSources) {
        if (collectStatuses[source]?.state === 'error') continue;
        const sourceWarnings = warnings.filter((warning) => sourceFromProgress(warning) === source);
        const failed = sourceWarnings.find((warning) => !isCollectionCompletenessWarning(warning));
        const incomplete = sourceWarnings.find(isCollectionCompletenessWarning);
        const diagnostic = sourceDiagnostic(source, response.stats || {});
        if (failed) setCollectStatus(source, 'error', 'ошибка', failed);
        else if (incomplete) setCollectStatus(source, 'warning', 'есть пропуски', incomplete);
        else if (diagnostic) setCollectStatus(source, diagnostic.warning ? 'warning' : 'done', diagnostic.label, diagnostic.title);
        else setCollectStatus(source, 'done', 'готово');
      }
      return finishRun(isUpdateRun ? 'Обновлено' : 'Собрано', warnings.length);
    });
    if (generation !== collectGeneration) return;
    if (!saved) {
      warnings.push('Не удалось сохранить результат локально. Экспортируйте CSV или резервную копию до закрытия страницы.');
      showWarnings(warnings);
      appendLog(`Предупреждение: ${warnings.at(-1)}`);
    } else {
      forgetStoredCollectJob();
      try {
        await acknowledgeCollectJob(activeJobId);
      } catch (error) {
        appendLog(`Предупреждение: сохранённый результат подтверждён только локально: ${error.message}`);
      }
    }
    const downloadStatus = rows.length ? 'CSV готов к скачиванию' : 'строк для CSV нет';
    if (saved) completeOnboarding();
    setStatus(`Готово: ${formatCount(rows.length, ['операция', 'операции', 'операций'])}. Ниже показано, что лучше сделать дальше.`, 1, 1);
    appendLog(`Готово: ${rows.length} строк, получено строк ${collectedRows.length}, ${downloadStatus}.`);
    requestAnimationFrame(() => els.homeGuide.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  } catch (error) {
    if (stateChanged) restoreCapturedState(previousState);
    if (activeJobId && (error.collectJobTerminal || (terminalResultReceived && !stateChanged))) {
      forgetStoredCollectJob();
      try {
        await acknowledgeCollectJob(activeJobId);
      } catch (ackError) {
        appendLog(`Предупреждение: временный результат сбора не очищен: ${ackError.message}`);
      }
    }
    setStatus(`Сбор не завершён. ${friendlyWarningText(error.message)}`);
    showWarnings([error.message]);
    for (const source of Object.keys(collectStatuses)) {
      if (collectStatuses[source].state !== 'done') setCollectStatus(source, 'error', 'ошибка', error.message);
    }
    appendLog(`Ошибка: ${error.message}`);
  } finally {
    if (generation === collectGeneration) {
      collectionInProgress = false;
      els.collect.disabled = false;
      els.uploadCsv.disabled = false;
      els.collectHint.hidden = true;
      setMutationControlsDisabled(false);
    }
  }
}

api?.runtime?.onMessage?.addListener?.((message) => {
  if (message?.type === 'SPEND_PROGRESS' && collectionInProgress) {
    const text = message.message || 'Сбор...';
    setStatus(text, message.value ?? null, message.max ?? null);
    const source = sourceFromProgress(text);
    if (source) {
      const status = collectStatusFromProgress(text);
      setCollectStatus(source, status.state, status.label, text);
    }
    appendLog(text, progressLogKey(text));
  }
});

globalThis.addEventListener?.('beforeunload', (event) => {
  if (persistencePendingCount === 0) return;
  event.preventDefault();
  event.returnValue = '';
});

els.collect.addEventListener('click', collect);
els.emptyCollect.addEventListener('click', () => els.collect.click());
els.uploadCsv.addEventListener('click', () => els.uploadCsvInput.click());
els.onboardingUpload.addEventListener('click', () => els.uploadCsv.click());
els.emptyUploadCsv.addEventListener('click', () => els.uploadCsv.click());
els.emptyReset.addEventListener('click', resetAnalyticsFilters);
els.homeGuidePrimary.addEventListener('click', () => homeGuidePrimaryAction?.());
els.homeGuideSecondary.addEventListener('click', () => homeGuideSecondaryAction?.());
els.uploadCsvInput.addEventListener('change', () => {
  uploadCsv().catch((error) => appendLog(`Ошибка загрузки CSV: ${error.message}`));
});
els.downloadCsv.addEventListener('click', downloadCsv);
els.runDownloadCsv.addEventListener('click', downloadCsv);
els.analyticsTotal.parentElement.title = 'Показать все операции';
makeClickable(els.analyticsTotal.parentElement, () => showKpiDetails('all'));
els.analyticsAverage.parentElement.title = 'Показать операции в расчёте среднего';
makeClickable(els.analyticsAverage.parentElement, () => showKpiDetails('all'));
els.analyticsRefunds.parentElement.title = 'Показать возвраты';
makeClickable(els.analyticsRefunds.parentElement, () => showKpiDetails('refund'));
els.analyticsPurchases.parentElement.title = 'Показать все операции';
makeClickable(els.analyticsPurchases.parentElement, () => showKpiDetails('all'));
els.toggleAnalyticsDetails.addEventListener('click', () => {
  setAnalyticsDetailsExpanded(!document.body.classList.contains('show-analytics-details'));
});
els.toggleRunDetails.addEventListener('click', () => {
  runDetailsOpen = !runDetailsOpen;
  renderRunSummary();
});
els.warningDetails.addEventListener('click', () => {
  setActiveView('log');
  requestAnimationFrame(() => {
    els.log.scrollIntoView({ behavior: 'smooth', block: 'start' });
    els.log.focus();
  });
});
els.openDiagnostics.addEventListener('click', () => setActiveView('log'));
els.backToSettings.addEventListener('click', () => setActiveView('data'));
els.copyLog.addEventListener('click', () => {
  copyLog().catch((error) => appendLog(`Ошибка копирования лога: ${error.message}`));
});
els.copyReport.addEventListener('click', () => {
  navigator.clipboard.writeText(currentReportText)
    .then(() => {
      const oldText = els.copyReport.textContent;
      els.copyReport.textContent = 'Скопировано';
      setTimeout(() => {
        els.copyReport.textContent = oldText;
      }, 1200);
    })
    .catch((error) => appendLog(`Ошибка копирования отчёта: ${error.message}`));
});
els.themeToggle.addEventListener('click', () => {
  applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
});
for (const button of els.tabButtons) {
  button.addEventListener('click', () => setActiveView(button.dataset.view));
  button.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const current = els.tabButtons.indexOf(button);
    const next = event.key === 'Home'
      ? 0
      : (event.key === 'End'
          ? els.tabButtons.length - 1
          : (current + (event.key === 'ArrowRight' ? 1 : -1) + els.tabButtons.length) % els.tabButtons.length);
    const target = els.tabButtons[next];
    setActiveView(target.dataset.view);
    target.focus();
  });
}
els.openCategoryReview.addEventListener('click', () => setActiveView('categories'));
els.openCollectionAudit.addEventListener('click', openCollectionDetails);
els.openMoneyRecovery.addEventListener('click', () => openControlSection(els.refundCenterList));
els.categoryReviewSearch.addEventListener('input', () => {
  categoryReviewShownCount = 5;
  renderCategoryReview();
});
els.reviewAllCategories.addEventListener('click', () => {
  categoryReviewShowAll = !categoryReviewShowAll;
  categoryReviewShownCount = 5;
  renderCategoryReview();
});
els.categoryReviewMore.addEventListener('click', () => {
  categoryReviewShownCount += 5;
  renderCategoryReview();
});
els.operationOverridesSearch.addEventListener('input', () => {
  operationOverridesShownCount = 100;
  renderOperationOverrides();
});
els.operationOverridesMore.addEventListener('click', () => {
  operationOverridesShownCount += 100;
  renderOperationOverrides();
});
for (const button of els.quickPeriodButtons) {
  button.addEventListener('click', () => applyQuickPeriod(button.dataset.period));
}
els.quickPeriodSelect.addEventListener('change', () => {
  const period = els.quickPeriodSelect.value;
  if (period === 'custom') {
    els.dateFrom.focus();
    return;
  }
  applyQuickPeriod(period);
});
els.periodGroup.addEventListener('change', () => {
  selectedOperationRowIds.clear();
  selectedPeriodKey = '';
  if (detailFilter?.type === 'period') detailFilter = null;
  resetDetailPaging();
  updateAnalytics();
});
els.dateFrom.addEventListener('change', () => {
  selectedOperationRowIds.clear();
  selectedPeriodKey = '';
  els.quickPeriodSelect.value = 'custom';
  resetDetailPaging();
  updateAnalytics();
});
els.dateTo.addEventListener('change', () => {
  selectedOperationRowIds.clear();
  selectedPeriodKey = '';
  els.quickPeriodSelect.value = 'custom';
  resetDetailPaging();
  updateAnalytics();
});
els.resetPeriod.addEventListener('click', () => applyQuickPeriod('all'));
for (const input of [els.analyticsOzon, els.analyticsWb, els.analyticsYandex]) {
  input.addEventListener('change', () => {
    selectedOperationRowIds.clear();
    resetDetailPaging();
    updateAnalytics();
  });
}
for (const [, input] of collectSourceInputs) {
  input.addEventListener('change', () => {
    updateProgressFill();
    renderSourceConnectionStates();
    if (els.onboardingStart) els.onboardingStart.disabled = selectedCollectSources().length === 0;
    try {
      localStorage.setItem(collectSourcesStorageKey, JSON.stringify(selectedCollectSources()));
    } catch {
      // The source preset is a convenience; collection still works without it.
    }
  });
}
els.categoryLevel.addEventListener('change', () => {
  localStorage.setItem(categoryLevelStorageKey, els.categoryLevel.value);
  categoriesExpanded = false;
  updateAnalytics();
});
els.categoryChartType.addEventListener('change', () => {
  localStorage.setItem(categoryChartTypeStorageKey, els.categoryChartType.value);
  updateAnalytics();
});
els.periodChartMode.addEventListener('change', () => {
  localStorage.setItem(periodChartModeStorageKey, els.periodChartMode.value);
  updateAnalytics();
});
els.clearDetailFilter.addEventListener('click', () => {
  selectedOperationRowIds.clear();
  detailFilter = null;
  detailOperation = 'all';
  els.detailSearch.value = '';
  resetDetailPaging();
  updateAnalytics();
});
for (const button of els.detailOperationButtons) {
  button.addEventListener('click', () => setDetailOperation(button.dataset.operation || 'all'));
}
els.detailSearch.addEventListener('input', () => {
  selectedOperationRowIds.clear();
  resetDetailPaging();
  updateDetailsOnly();
});
els.detailPageSize.addEventListener('change', () => {
  resetDetailPaging();
  updateDetailsOnly();
});
els.detailMore.addEventListener('click', () => {
  detailShownCount += detailPageSize();
  updateDetailsOnly();
});
els.bulkApply.addEventListener('click', () => {
  const patch = {};
  if (els.bulkCategory.value) patch.category = els.bulkCategory.value;
  if (els.bulkProfile.value) patch.profile = els.bulkProfile.value;
  if (!Object.keys(patch).length) {
    setStatus('Выберите категорию или профиль для массового изменения.');
    return;
  }
  applyBulkOperation(patch, 'Массово изменено');
});
els.bulkExclude.addEventListener('click', () => applyBulkOperation({ excluded: true }, 'Исключено'));
els.bulkInclude.addEventListener('click', () => applyBulkOperation({ excluded: false }, 'Возвращено в отчёт'));
els.bulkClear.addEventListener('click', () => {
  selectedOperationRowIds.clear();
  updateDetailsOnly();
});
els.saveBudget.addEventListener('click', saveBudget);
els.budgetAmount.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') saveBudget();
});
els.saveOverallBudget.addEventListener('click', saveOverallBudget);
els.overallBudgetAmount.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') saveOverallBudget();
});
els.copyBudgetNextMonth.addEventListener('click', prepareNextMonthBudget);
els.budgetMonth.addEventListener('change', updateAnalytics);
els.closeMonth.addEventListener('change', () => renderControl());
els.monthCloseAction.addEventListener('click', toggleMonthClosure);
els.activeProfileSelect.addEventListener('change', () => {
  selectedOperationRowIds.clear();
  appSettings.activeProfile = els.activeProfileSelect.value;
  localStorage.setItem(activeProfileStorageKey, appSettings.activeProfile);
  selectedPeriodKey = '';
  detailFilter = null;
  resetDetailPaging();
  updateDateInputBounds();
  updateAnalytics();
});
els.dataProfileSelect.addEventListener('change', () => {
  appSettings.dataProfile = els.dataProfileSelect.value;
  localStorage.setItem(dataProfileStorageKey, appSettings.dataProfile);
  renderProfiles();
});
els.addDataProfile.addEventListener('click', addProfile);
els.renameDataProfile.addEventListener('click', renameProfile);
els.deleteDataProfile.addEventListener('click', deleteProfile);
els.categoryRuleForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const rule = categoryRuleDraft();
  if (!rule.keywords.length || !rule.category) return;
  upsertCategoryRule(rule);
  els.categoryRulePattern.value = '';
  els.categoryRuleNegative.value = '';
  applySettingsChange('Добавлено правило категории');
});
for (const control of [
  els.categoryRulePattern,
  els.categoryRuleNegative,
  els.categoryRuleMatch,
  els.categoryRuleSource,
  els.categoryRuleCategory
]) {
  control.addEventListener('input', renderCategoryRulePreview);
  control.addEventListener('change', renderCategoryRulePreview);
}
els.operationSave.addEventListener('click', saveOperationEdit);
els.operationCategorySelect.addEventListener('change', () => {
  if (els.operationCategorySelect.value) els.operationCategoryInput.value = '';
  updateOperationSimilarHint();
});
els.operationCategoryInput.addEventListener('input', () => {
  if (els.operationCategoryInput.value.trim()) els.operationCategorySelect.value = '';
  updateOperationSimilarHint();
});
els.markWarranty.addEventListener('change', () => {
  els.operationWarrantyFields.hidden = !els.markWarranty.checked;
  if (els.markWarranty.checked) els.operationWarrantyUntil.focus();
});
els.operationDocumentUrl.addEventListener('input', () => els.operationDocumentUrl.setCustomValidity(''));
els.operationEditor.addEventListener('close', () => {
  selectedOperationRowId = '';
  focusOperationReturn();
});
els.exportDataBackup.addEventListener('click', () => {
  try {
    exportBackup();
  } catch (error) {
    appendLog(`Ошибка экспорта резервной копии: ${error.message}`);
  }
});
els.importDataBackup.addEventListener('click', () => els.importDataBackupInput.click());
els.importDataBackupInput.addEventListener('change', () => {
  importBackup().catch((error) => appendLog(`Ошибка восстановления из копии: ${error.message}`));
});
els.downloadFullCsv.addEventListener('click', () => {
  const records = dataExportRows();
  downloadBlob(makeCsv(records), 'text/csv;charset=utf-8', `markettrat-full-${localInputDate(new Date())}.csv`);
  appendLog(`Полный CSV экспортирован: строк ${records.length}, включая исключённые операции.`);
});
els.downloadJson.addEventListener('click', () => {
  const records = dataExportRows();
  downloadBlob(`${JSON.stringify(records, null, 2)}\n`, 'application/json;charset=utf-8', `markettrat-full-${localInputDate(new Date())}.json`);
  appendLog(`JSON экспорт: строк ${records.length}.`);
});
els.downloadAnonymousCsv.addEventListener('click', () => {
  const records = privacy.anonymizeSpendRows(dataExportRows());
  downloadBlob(makeCsv(records), 'text/csv;charset=utf-8', `markettrat-without-titles-full-${localInputDate(new Date())}.csv`);
  appendLog(`CSV без названий товаров экспортирован: строк ${records.length}.`);
});
els.revokeSourcePermissions.addEventListener('click', () => {
  revokeSourcePermissions().catch((error) => {
    setStatus(`Не удалось отозвать доступ: ${error.message}`);
    appendLog(`Ошибка отзыва доступов: ${error.message}`);
  });
});
els.deleteAllData.addEventListener('click', () => {
  deleteAllData().catch((error) => appendLog(`Ошибка удаления данных: ${error.message}`));
});
els.onboardingDemo.addEventListener('click', showDemo);
els.demoStart.addEventListener('click', () => exitDemo('start'));
els.demoUpload.addEventListener('click', () => exitDemo('upload'));
els.demoExit.addEventListener('click', () => exitDemo());
els.onboardingStart.addEventListener('click', () => {
  els.collect.click();
  requestAnimationFrame(() => els.runDetails.scrollIntoView({ behavior: 'smooth', block: 'start' }));
});
els.clearLog.addEventListener('click', () => {
  logLines = [];
  logLineByKey.clear();
  renderLog();
});

dataSyncChannel?.addEventListener('message', (event) => {
  const epoch = Number(event?.data?.epoch);
  const revision = Number(event?.data?.revision);
  if (event?.data?.type === 'data-cleared' && isNewerDataEpoch(epoch)) {
    if (Number.isSafeInteger(revision) && revision >= 0) dataRevision = revision;
    resetLocalDataAfterClear(epoch, true);
    return;
  }
  if (event?.data?.type === 'data-saved'
    && epoch === dataEpoch
    && Number.isSafeInteger(revision)
    && revision > dataRevision) {
    markStorageConflict(revision);
  }
});

async function initializeApp() {
  els.collect.disabled = true;
  els.uploadCsv.disabled = true;
  els.categoryLevel.value = loadCategoryLevel();
  els.categoryChartType.value = loadCategoryChartType();
  els.periodChartMode.value = loadPeriodChartMode();
  els.budgetMonth.value = currentMonthKey();
  els.closeMonth.value = currentMonthKey();
  try {
    const savedSources = JSON.parse(localStorage.getItem(collectSourcesStorageKey) || 'null');
    if (Array.isArray(savedSources)) {
      const selected = new Set(savedSources.filter((source) => sourcePermissionOrigins[source]));
      for (const [source, input] of collectSourceInputs) input.checked = selected.has(source);
    }
  } catch {
    localStorage.removeItem(collectSourcesStorageKey);
  }
  renderProfiles();
  renderCategoryRules();
  await loadCategoryRulePack();
  applyTheme(loadTheme());
  updateProgressFill();
  renderLog();

  let restored = false;
  try {
    const loaded = await featureStorage.loadWithEpoch();
    const loadedIsCurrent = adoptLoadedDataEpoch(loaded.epoch);
    adoptLoadedDataRevision(loaded.revision);
    if (loadedIsCurrent && loaded.snapshot) {
      restored = restoreSnapshot(loaded.snapshot);
      appendLog(`Открыта локальная база: строк ${sourceRows.length}.`);
    }
  } catch (error) {
    appendLog(`Предупреждение: локальная база недоступна: ${error.message}`);
  }

  if (!restored) applyStoredProfileSelections();
  if (!restored && dataEpoch === 0 && restoreLastRun()) {
    restored = true;
    await persistSnapshot('Миграция старого отчёта');
  }
  if (!restored) updateResult([], {});

  els.onboardingPanel.hidden = Boolean(localStorage.getItem(onboardingStorageKey) || sourceRows.length);
  document.body.classList.toggle('first-run', !els.onboardingPanel.hidden);
  if (!els.onboardingPanel.hidden && !localStorage.getItem(collectSourcesStorageKey)) {
    for (const [, input] of collectSourceInputs) input.checked = false;
    updateProgressFill();
  }
  await refreshSourcePermissionStates();
  els.onboardingStart.disabled = selectedCollectSources().length === 0;
  await renderHistory();
  await checkStorageHealth();
  checkForUpdate();
  if (storedCollectJobId()) {
    const message = 'Найден предыдущий незавершённый сбор. Нажмите «Добавить покупки»: MarketTrat сначала попробует получить уже готовый результат и не станет заново обращаться к магазинам.';
    setStatus(message);
    appendLog(message, 'collect-job-recovery');
  }
  els.collect.disabled = false;
  els.uploadCsv.disabled = false;
}

initializeApp().catch((error) => {
  els.collect.disabled = false;
  els.uploadCsv.disabled = false;
  appendLog(`Ошибка запуска: ${error.message}`);
  setStatus(`Ошибка запуска: ${error.message}`);
  updateAnalytics();
});
