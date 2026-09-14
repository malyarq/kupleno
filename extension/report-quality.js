(function exposeReportQuality(root, factory) {
  const exported = factory();
  if (typeof module === 'object' && module.exports) module.exports = exported;
  if (root) root.KuplenoReportQuality = exported;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  'use strict';

  const knownSources = Object.freeze(['ozon', 'wildberries', 'yandex']);

  function absoluteAmount(rows) {
    return rows.reduce((sum, row) => sum + Math.abs(Number(row?.amount) || 0), 0);
  }

  function reportSources(records, report) {
    const declared = Array.isArray(report?.sources) ? report.sources : [];
    const present = (Array.isArray(records) ? records : []).map((row) => row?.source);
    return [...new Set([...declared, ...present].filter((source) => knownSources.includes(source)))];
  }

  function sourceDates(rows) {
    const dates = rows.map((row) => String(row?.date || '').slice(0, 10)).filter((date) => /^\d{4}-\d{2}-\d{2}$/u.test(date)).sort();
    return { from: dates[0] || '', to: dates.at(-1) || '' };
  }

  function sourceAudit(source, records, stats = {}) {
    const rows = records.filter((row) => row?.source === source);
    const item = stats?.[source] && typeof stats[source] === 'object' ? stats[source] : {};
    const receipts = Math.max(0, Number(item.receipts) || 0);
    const parsed = Math.max(0, Number(item.parsedReceipts) || 0);
    const fallbackReceipts = Math.max(0, Number(item.fallbackReceipts) || 0);
    const unverifiedReceipts = Math.max(0, Number(item.unverifiedReceipts) || 0);
    const failedOrders = Math.max(0, Number(item.failedOrders) || 0);
    const noReceiptOrders = Math.max(0, Number(item.noReceiptOrders) || 0);
    const missingReceipts = Math.max(0, receipts - parsed, Number(item.failedReceipts) || 0);
    const fallbackRows = rows.filter((row) => row?.parse_quality === 'fallback');
    const unverifiedRows = rows.filter((row) => row?.parse_quality === 'unverified');
    const paginationIncomplete = item.paginationIncomplete === true || item.limitReached === true;
    const evidence = receipts > 0 || Number(item.itemRows) > 0 || Number(item.orders) > 0;
    const attention = missingReceipts > 0 || fallbackReceipts > 0 || unverifiedReceipts > 0
      || failedOrders > 0 || noReceiptOrders > 0 || paginationIncomplete || fallbackRows.length > 0 || unverifiedRows.length > 0;
    return Object.freeze({
      source,
      rows: rows.length,
      receipts,
      parsed,
      missingReceipts,
      fallbackReceipts: Math.max(fallbackReceipts, fallbackRows.length ? 1 : 0),
      unverifiedReceipts: Math.max(unverifiedReceipts, unverifiedRows.length ? 1 : 0),
      failedOrders,
      noReceiptOrders,
      paginationIncomplete,
      fallbackAmount: absoluteAmount(fallbackRows),
      unverifiedAmount: absoluteAmount(unverifiedRows),
      coverage: receipts ? Math.round(Math.min(receipts, parsed) / receipts * 100) : null,
      evidence,
      attention,
      ...sourceDates(rows)
    });
  }

  function auditCollection(records = [], report = {}) {
    const safeRecords = Array.isArray(records) ? records : [];
    const stats = report?.stats && typeof report.stats === 'object' ? report.stats : {};
    const sources = reportSources(safeRecords, report);
    const sourceAudits = sources.map((source) => sourceAudit(source, safeRecords, stats));
    const warnings = (Array.isArray(report?.warnings) ? report.warnings : []).map(String).filter(Boolean);
    const hasCollectionEvidence = sourceAudits.some((item) => item.evidence);
    const hasUnverifiedCsv = report?.hasUnverifiedCsv === true;
    const missingSourceEvidence = sourceAudits.some((item) => !item.evidence);
    const attentionSources = sourceAudits.filter((item) => item.attention);
    const fallbackAmount = sourceAudits.reduce((sum, item) => sum + item.fallbackAmount, 0);
    const unverifiedAmount = sourceAudits.reduce((sum, item) => sum + item.unverifiedAmount, 0);
    const missingReceipts = sourceAudits.reduce((sum, item) => sum + item.missingReceipts, 0);
    const receipts = sourceAudits.reduce((sum, item) => sum + item.receipts, 0);
    const parsed = sourceAudits.reduce((sum, item) => sum + Math.min(item.receipts, item.parsed), 0);
    const state = !safeRecords.length
      ? 'empty'
      : (!hasCollectionEvidence ? 'imported' : (hasUnverifiedCsv ? 'mixed' : (missingSourceEvidence || attentionSources.length || warnings.length ? 'attention' : 'complete')));
    return Object.freeze({
      state,
      hasUnverifiedCsv,
      sources: sourceAudits,
      warnings,
      receipts,
      parsed,
      missingReceipts,
      fallbackAmount,
      unverifiedAmount,
      attentionAmount: fallbackAmount + unverifiedAmount,
      coverage: receipts ? Math.round(parsed / receipts * 100) : null,
      rowCount: safeRecords.length,
      totalAmount: absoluteAmount(safeRecords)
    });
  }

  return Object.freeze({ auditCollection, sourceAudit });
});
