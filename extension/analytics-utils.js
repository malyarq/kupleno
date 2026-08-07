(function exposeAnalyticsUtils(root, factory) {
  const exported = factory();
  if (typeof module === 'object' && module.exports) module.exports = exported;
  if (root) root.MarketTratAnalyticsUtils = exported;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  'use strict';

  const amountFormatter = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  function formatRub(value) {
    return `${amountFormatter.format(value || 0)} ₽`;
  }

  function pluralRu(count, forms) {
    const value = Math.abs(Number(count) || 0);
    const mod100 = value % 100;
    const mod10 = value % 10;
    if (mod100 >= 11 && mod100 <= 14) return forms[2];
    if (mod10 === 1) return forms[0];
    if (mod10 >= 2 && mod10 <= 4) return forms[1];
    return forms[2];
  }

  function formatCount(count, forms) {
    return `${count} ${pluralRu(count, forms)}`;
  }

  function compactAmount(value) {
    const abs = Math.abs(value || 0);
    if (abs >= 1_000_000) return `${amountFormatter.format(value / 1_000_000)}M`;
    if (abs >= 1_000) return `${amountFormatter.format(value / 1_000)}K`;
    return amountFormatter.format(value);
  }

  function dateParts(value) {
    const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/u);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
    return { date, exact: match[0] };
  }

  function parseRowDate(value) {
    return dateParts(value)?.date || null;
  }

  function dateInputValue(value) {
    const parts = dateParts(value);
    return parts && parts.exact === String(value) ? parts.date.getTime() : null;
  }

  function inputDate(date) {
    return [
      date.getUTCFullYear(),
      String(date.getUTCMonth() + 1).padStart(2, '0'),
      String(date.getUTCDate()).padStart(2, '0')
    ].join('-');
  }

  function localInputDate(date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0')
    ].join('-');
  }

  function isoWeekKey(date) {
    const shifted = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const day = shifted.getUTCDay() || 7;
    shifted.setUTCDate(shifted.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(shifted.getUTCFullYear(), 0, 1));
    const week = Math.ceil((((shifted - yearStart) / 86_400_000) + 1) / 7);
    return `${shifted.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
  }

  function periodKey(date, group) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    if (group === 'day') return `${year}-${month}-${day}`;
    if (group === 'week') return isoWeekKey(date);
    if (group === 'year') return String(year);
    return `${year}-${month}`;
  }

  function quickPeriodRange(period, today = new Date()) {
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();
    const rollingDays = { 'last-7-days': 7, 'last-30-days': 30, 'last-90-days': 90 }[period];
    if (rollingDays) {
      return {
        from: localInputDate(new Date(year, month, day - rollingDays + 1)),
        to: localInputDate(new Date(year, month, day))
      };
    }
    if (period === 'this-month') {
      return { from: localInputDate(new Date(year, month, 1)), to: localInputDate(new Date(year, month + 1, 0)) };
    }
    if (period === 'prev-month') {
      return { from: localInputDate(new Date(year, month - 1, 1)), to: localInputDate(new Date(year, month, 0)) };
    }
    if (period === 'this-quarter' || period === 'prev-quarter') {
      const quarterStart = Math.floor(month / 3) * 3;
      const startMonth = period === 'this-quarter' ? quarterStart : quarterStart - 3;
      return {
        from: localInputDate(new Date(year, startMonth, 1)),
        to: localInputDate(new Date(year, startMonth + 3, 0))
      };
    }
    if (period === 'this-year') return { from: `${year}-01-01`, to: `${year}-12-31` };
    if (period === 'prev-year') return { from: `${year - 1}-01-01`, to: `${year - 1}-12-31` };
    return { from: '', to: '' };
  }

  function periodBounds(key, group) {
    if (group === 'day') return dateInputValue(key) === null ? null : { from: key, to: key };
    if (group === 'month') {
      const match = String(key).match(/^(\d{4})-(\d{2})$/u);
      if (!match) return null;
      const year = Number(match[1]);
      const month = Number(match[2]) - 1;
      if (month < 0 || month > 11) return null;
      return {
        from: inputDate(new Date(Date.UTC(year, month, 1))),
        to: inputDate(new Date(Date.UTC(year, month + 1, 0)))
      };
    }
    if (group === 'year') return /^\d{4}$/u.test(String(key)) ? { from: `${key}-01-01`, to: `${key}-12-31` } : null;
    if (group === 'week') {
      const match = String(key).match(/^(\d{4})-W(\d{2})$/u);
      if (!match) return null;
      const year = Number(match[1]);
      const week = Number(match[2]);
      if (week < 1 || week > 53) return null;
      const jan4 = new Date(Date.UTC(year, 0, 4));
      const jan4Day = jan4.getUTCDay() || 7;
      const monday = new Date(jan4);
      monday.setUTCDate(jan4.getUTCDate() - jan4Day + 1 + (week - 1) * 7);
      const sunday = new Date(monday);
      sunday.setUTCDate(monday.getUTCDate() + 6);
      return { from: inputDate(monday), to: inputDate(sunday) };
    }
    return null;
  }

  function isDateInRange(date, range) {
    const time = date.getTime();
    return (range.from === null || time >= range.from) && (range.to === null || time <= range.to);
  }

  function averageForPeriods(total, periods) {
    return periods.length ? total / periods.length : 0;
  }

  function averagePeriodLabel(group) {
    return ({ day: 'в среднем за день', week: 'в среднем за неделю', month: 'в среднем за месяц', year: 'в среднем за год' })[group]
      || 'в среднем';
  }

  function previousRange(range) {
    if (range.from === null || range.to === null) return null;
    const dayMs = 86_400_000;
    const days = Math.max(1, Math.round((range.to - range.from) / dayMs) + 1);
    const to = range.from - dayMs;
    return { from: to - ((days - 1) * dayMs), to };
  }

  function compareText(current, previous) {
    if (!previous && !current) return '';
    if (!previous) return current ? 'новые траты' : '';
    const percent = Math.round(((current - previous) / Math.abs(previous)) * 100);
    if (!percent) return 'как в прошлом периоде';
    return `${percent > 0 ? '+' : ''}${percent}% к прошлому периоду`;
  }

  return Object.freeze({
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
  });
});
