(function exposePrivacyHelpers(root) {
  function redactText(value) {
    return String(value || '')
      .replace(/\b(authorization|proxy-authorization|cookie|set-cookie)\s*[:=]\s*[^\r\n]*/gi, '$1: [скрыто]')
      .replace(/\bhttps?:\/\/[^\s|;]+/gi, '[ссылка скрыта]')
      .replace(/\b[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/g, '[токен скрыт]')
      .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi, '[id скрыт]')
      .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[email скрыт]')
      .replace(/\b(token|jwt|session|secret|api[-_]?key|sk)\s*[:=]\s*[^\s,;]+/gi, '$1=[скрыто]')
      .replace(/\b[A-Za-z0-9_-]{32,}={0,2}\b/g, '[токен скрыт]')
      .replace(/\b(?:[A-Za-z0-9]{4,}[-_:]){2,}[A-Za-z0-9]{4,}\b/g, '[id скрыт]')
      .replace(/\b\d{8,}\b/g, '[id скрыт]');
  }

  function redactLog(lines) {
    const values = Array.isArray(lines) ? lines : String(lines || '').split('\n');
    return values.map(redactText).join('\n');
  }

  function anonymizeSpendRows(rows) {
    return (Array.isArray(rows) ? rows : []).map((row) => ({
      date: /^\d{4}-\d{2}/.test(String(row.date || '')) ? `${String(row.date).slice(0, 7)}-01` : '',
      source: String(row.source || ''),
      title: Number(row.amount) < 0 || row.type === 'refund' ? 'Возврат' : 'Покупка',
      amount: Number(row.amount || 0).toFixed(2),
      currency: String(row.currency || 'RUB'),
      category: String(row.category || ''),
      type: String(row.type || (Number(row.amount) < 0 ? 'refund' : 'purchase')),
      marketplace_id: '',
      item_index: ''
    }));
  }

  const exported = { redactText, redactLog, anonymizeSpendRows };
  root.KuplenoPrivacy = exported;
  if (typeof module !== 'undefined') module.exports = exported;
})(typeof globalThis !== 'undefined' ? globalThis : window);
