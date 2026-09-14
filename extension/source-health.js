(function exposeSourceHealth(root, factory) {
  const exported = factory();
  if (typeof module === 'object' && module.exports) module.exports = exported;
  if (root) root.KuplenoSourceHealth = exported;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  'use strict';

  function diagnostic(source, stats = {}, labels = {}) {
    const item = stats[source] || {};
    const receipts = Number(item.receipts) || 0;
    const parsed = Number(item.parsedReceipts) || 0;
    const itemRows = Number(item.itemRows) || 0;
    const failedReceipts = Number(item.failedReceipts) || Math.max(0, receipts - parsed);
    const dropped = ['duplicateRowsDropped', 'prepaymentRowsDropped', 'operationalRowsDropped', 'adjustmentRowsDropped']
      .reduce((sum, key) => sum + (Number(item[key]) || 0), 0);
    const fallbackReceipts = Number(item.fallbackReceipts) || 0;
    const unverifiedReceipts = Number(item.unverifiedReceipts) || 0;
    const limitReached = item.limitReached === true;
    const paginationIncomplete = item.paginationIncomplete === true;

    if (source === 'yandex') {
      const orders = Number(item.orders) || 0;
      const skipped = failedReceipts + (Number(item.noReceiptOrders) || 0) + (Number(item.failedOrders) || 0);
      if (!orders && !receipts && !itemRows && !skipped) return null;
      return {
        label: receipts ? `${parsed}/${receipts} чеков` : `${orders} заказов`,
        title: `Яндекс Маркет: найдено заказов ${orders}, чеков ${receipts}, распознано ${parsed}, без сверки итога ${unverifiedReceipts}, пропущено ${skipped}, строк ${itemRows}${limitReached ? ', достигнут лимит страниц' : ''}${paginationIncomplete ? ', список заказов неполный' : ''}.`,
        warning: skipped > 0 || unverifiedReceipts > 0 || limitReached || paginationIncomplete
      };
    }

    if (source === 'wildberries') {
      if (!receipts && !itemRows) return null;
      return {
        label: `${parsed}/${receipts} чеков, ${itemRows} строк`,
        title: `Wildberries: найдено чеков ${receipts}, распознано ${parsed}, без состава ${fallbackReceipts}, без сверки итога ${unverifiedReceipts}, пропущено ${failedReceipts}, строк ${itemRows}${limitReached ? ", достигнут лимит страниц" : ""}${paginationIncomplete ? ", список чеков неполный" : ""}.`,
        warning: failedReceipts > 0 || fallbackReceipts > 0 || unverifiedReceipts > 0 || limitReached || paginationIncomplete
      };
    }

    if (!receipts && !itemRows && !failedReceipts && !fallbackReceipts && !unverifiedReceipts && !dropped) return null;
    const sourceName = labels[source] || source;
    return {
      label: receipts ? `${parsed}/${receipts} чеков` : `${itemRows} строк`,
      title: `${sourceName}: найдено чеков ${receipts}, распознано ${parsed}, без состава ${fallbackReceipts}, без сверки итога ${unverifiedReceipts}, пропущено ${failedReceipts}, строк ${itemRows}${dropped ? `, отброшено строк ${dropped}` : ''}${limitReached ? ', достигнут лимит страниц' : ''}${paginationIncomplete ? ', список чеков неполный' : ''}.`,
      warning: failedReceipts > 0 || fallbackReceipts > 0 || unverifiedReceipts > 0 || limitReached || paginationIncomplete
    };
  }

  function connectionState({ selected = false, permissionGranted = false, status = null } = {}) {
    if (status?.state === 'running') return { state: 'running', label: 'Собирается сейчас' };
    if (status?.state === 'error') return { state: 'error', label: 'Нужно повторить' };
    if (status?.state === 'warning') return { state: 'warning', label: 'Собрано не полностью' };
    if (status?.state === 'done') return { state: 'done', label: status.label || 'Покупки собраны' };
    if (!selected) return { state: 'idle', label: permissionGranted ? 'Доступ сохранён' : 'Не выбран' };
    if (permissionGranted) return { state: 'ready', label: 'Готов к сбору' };
    return { state: 'selected', label: 'Доступ запросится при сборе' };
  }

  return Object.freeze({ diagnostic, connectionState });
});
