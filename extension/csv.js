(function exposeCsv(root) {
  const MAX_CSV_CHARS = 20 * 1024 * 1024;
  const MAX_CSV_ROWS = 100000;
  const MAX_CSV_COLUMNS = 50;
  const MAX_CSV_CELL_CHARS = 20000;

  const aliases = {
    date: 'date',
    marketplace: 'source',
    source: 'source',
    title: 'title',
    amount: 'amount',
    currency: 'currency',
    category: 'category',
    type: 'type',
    is_return: 'type',
    marketplace_id: 'marketplace_id',
    item_index: 'item_index',
    profile: 'profile',
    note: 'note',
    excluded: 'excluded'
  };

  function parseCsvTable(text) {
    const rows = [];
    let row = [];
    let cell = '';
    let quoted = false;
    const value = String(text || '').replace(/^\uFEFF/, '');
    if (value.length > MAX_CSV_CHARS) throw new Error('CSV больше 20 МБ');

    function finishCell() {
      if (cell.length > MAX_CSV_CELL_CHARS) throw new Error('слишком длинное поле в CSV');
      row.push(cell);
      if (row.length > MAX_CSV_COLUMNS) throw new Error(`в CSV больше ${MAX_CSV_COLUMNS} колонок`);
      cell = '';
    }

    function finishRow() {
      finishCell();
      rows.push(row);
      if (rows.length > MAX_CSV_ROWS + 1) throw new Error(`в CSV больше ${MAX_CSV_ROWS} строк данных`);
      row = [];
    }

    for (let index = 0; index < value.length; index += 1) {
      const char = value[index];
      const next = value[index + 1];

      if (quoted) {
        if (char === '"' && next === '"') {
          cell += '"';
          index += 1;
        } else if (char === '"') {
          quoted = false;
        } else {
          cell += char;
          if (cell.length > MAX_CSV_CELL_CHARS) throw new Error('слишком длинное поле в CSV');
        }
      } else if (char === '"') {
        quoted = true;
      } else if (char === ',') {
        finishCell();
      } else if (char === '\n') {
        finishRow();
      } else if (char !== '\r') {
        cell += char;
        if (cell.length > MAX_CSV_CELL_CHARS) throw new Error('слишком длинное поле в CSV');
      }
    }

    if (quoted) throw new Error('незакрытая кавычка в CSV');
    if (cell || row.length) finishRow();
    return rows;
  }

  function normalizeSource(value) {
    const source = String(value || '').trim().toLowerCase();
    if (source === 'wb' || source === 'wildberries') return 'wildberries';
    if (source === 'ozon') return 'ozon';
    if (source === 'yandex' || source === 'яндекс' || source === 'яндекс маркет') return 'yandex';
    return source;
  }

  function normalizeType(value, amount) {
    const type = String(value || '').trim().toLowerCase();
    if (type === 'refund' || type === 'return' || type === 'возврат' || type === '1') return 'refund';
    if (type === 'purchase' || type === 'покупка' || type === '0') return 'purchase';
    return amount < 0 ? 'refund' : 'purchase';
  }

  function normalizeBoolean(value) {
    const normalized = String(value ?? '').trim().toLowerCase();
    if (!normalized) return false;
    if (['1', 'true', 'yes', 'да'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'нет'].includes(normalized)) return false;
    throw new Error(`некорректное логическое значение: ${String(value)}`);
  }

  function isValidSpendDate(value) {
    const match = String(value || '').trim().match(
      /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(?:(Z)|([+-])(\d{2}):?(\d{2}))?)?$/
    );
    if (!match) return false;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (year < 1900 || month < 1 || month > 12 || day < 1) return false;
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    if (day > daysInMonth) return false;
    if (match[4] === undefined) return true;
    if (Number(match[4]) > 23 || Number(match[5]) > 59 || Number(match[6] || 0) > 59) return false;
    if (match[9] !== undefined) {
      const offsetHours = Number(match[9]);
      const offsetMinutes = Number(match[10]);
      if (offsetHours > 14 || offsetMinutes > 59 || (offsetHours === 14 && offsetMinutes !== 0)) return false;
    }
    return true;
  }

  function parseSpendCsv(text) {
    const table = parseCsvTable(text).filter((row) => row.some((cell) => String(cell).trim()));
    if (!table.length) return [];

    const headers = table[0].map((header) => aliases[String(header).trim().toLowerCase()] || '');
    const indexByHeader = Object.fromEntries(headers.map((header, index) => [header, index]).filter(([header]) => header));
    const missing = ['date', 'source', 'title', 'amount'].filter((header) => indexByHeader[header] === undefined);
    if (missing.length) {
      const labels = missing.map((header) => (header === 'source' ? 'marketplace' : header));
      throw new Error(`нет колонок: ${labels.join(', ')}`);
    }

    const parsed = table.slice(1)
      .filter((row) => row.some((cell) => String(cell).trim()))
      .flatMap((row, index) => {
        const rawAmount = String(row[indexByHeader.amount] || '').replace(/\s+/g, '').replace(',', '.');
        const amount = Number(rawAmount);
        if (!Number.isFinite(amount)) throw new Error(`некорректная сумма в строке ${index + 2}`);
        const date = String(row[indexByHeader.date] || '').trim();
        const source = normalizeSource(row[indexByHeader.source]);
        const title = String(row[indexByHeader.title] || '').trim();
        if (!date && source && title.startsWith('Ozon PDF не разобран') && amount === 0) return [];
        if (!date || !source || !title) throw new Error(`пустые обязательные поля в строке ${index + 2}`);
        if (!isValidSpendDate(date)) throw new Error(`некорректная дата в строке ${index + 2}`);
        if (source !== 'ozon' && source !== 'wildberries' && source !== 'yandex') {
          throw new Error(`неизвестный marketplace в строке ${index + 2}`);
        }

        const result = {
          date,
          source,
          title,
          amount: amount.toFixed(2),
          currency: String(row[indexByHeader.currency] || 'RUB').trim() || 'RUB',
          category: String(row[indexByHeader.category] || '').trim(),
          type: normalizeType(row[indexByHeader.type], amount)
        };
        if (indexByHeader.marketplace_id !== undefined) {
          result.marketplace_id = String(row[indexByHeader.marketplace_id] || '').trim();
        }
        if (indexByHeader.item_index !== undefined) {
          result.item_index = String(row[indexByHeader.item_index] || '').trim();
        }
        if (indexByHeader.profile !== undefined) {
          result.profile = String(row[indexByHeader.profile] || '').trim();
        }
        if (indexByHeader.note !== undefined) {
          result.note = String(row[indexByHeader.note] || '').trim();
        }
        if (indexByHeader.excluded !== undefined) {
          try {
            result.excluded = normalizeBoolean(row[indexByHeader.excluded]);
          } catch {
            throw new Error(`некорректное поле excluded в строке ${index + 2}`);
          }
        }
        return [result];
      });

    const legacyOccurrences = new Map();
    return parsed.map((row) => {
      if (String(row.item_index || '').trim() || !normalizedReceiptKey(row)) return row;
      const key = compatibleSpendRowKey(row);
      const occurrence = (legacyOccurrences.get(key) || 0) + 1;
      legacyOccurrences.set(key, occurrence);
      return { ...row, item_index: `legacy-csv-${occurrence}` };
    });
  }

  function normalizeTitle(title) {
    return String(title || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  function normalizedReceiptKey(row) {
    const receiptKey = String(row.marketplace_id || row.receipt_url || '').trim();
    return receiptKey;
  }

  function rowSignature(row) {
    return [
      normalizeTitle(row.title),
      Number(row.amount).toFixed(2),
      row.currency || 'RUB',
      row.type || ''
    ].join('\u0001');
  }

  function compatibleSpendRowKey(row) {
    const receiptKey = normalizedReceiptKey(row);
    if (!receiptKey) return '';
    return [row.source, receiptKey, rowSignature(row)].join('\u0001');
  }

  function hasItemIndex(row) {
    const itemIndex = String(row.item_index || '').trim();
    return itemIndex !== '' && !/^legacy-csv-\d+$/.test(itemIndex);
  }

  function spendRowKey(row) {
    const receiptKey = normalizedReceiptKey(row);
    if (!receiptKey) return '';
    const itemKey = String(row.item_index || '').trim();
    return [
      row.source,
      receiptKey,
      itemKey || normalizeTitle(row.title),
      rowSignature(row)
    ].join('\u0001');
  }

  function mergeSpendRows(rows) {
    const list = rows || [];
    const indexedRows = new Set(list
      .filter(hasItemIndex)
      .map(compatibleSpendRowKey)
      .filter(Boolean));
    const seen = new Set();
    const merged = [];
    let duplicates = 0;
    for (const row of list) {
      if (!hasItemIndex(row) && indexedRows.has(compatibleSpendRowKey(row))) {
        duplicates += 1;
        continue;
      }
      const key = spendRowKey(row);
      if (key && seen.has(key)) {
        duplicates += 1;
      } else {
        if (key) seen.add(key);
        merged.push(row);
      }
    }
    return { rows: merged, duplicates };
  }

  root.parseSpendCsv = parseSpendCsv;
  root.mergeSpendRows = mergeSpendRows;
  root.isValidSpendDate = isValidSpendDate;
  if (typeof module !== 'undefined') module.exports = {
    MAX_CSV_CHARS,
    MAX_CSV_ROWS,
    MAX_CSV_COLUMNS,
    MAX_CSV_CELL_CHARS,
    isValidSpendDate,
    normalizeBoolean,
    parseSpendCsv,
    mergeSpendRows
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
