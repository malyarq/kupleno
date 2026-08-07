(function exposeAnalyticsCore(root, factory) {
  const exported = factory();
  if (typeof module === 'object' && module.exports) module.exports = exported;
  if (root) root.MarketTratAnalyticsCore = exported;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  'use strict';

  const macroGroups = Object.freeze([
    { key: 'macro:food', label: 'Еда', color: '#55a630', categories: ['Продукты'] },
    { key: 'macro:home', label: 'Дом и быт', color: '#8b5cf6', categories: ['Дом', 'Мебель', 'Бытовая химия', 'Бытовая техника', 'Ремонт', 'Сад', 'Доставка'] },
    { key: 'macro:style', label: 'Одежда и стиль', color: '#4f46e5', categories: ['Одежда', 'Обувь', 'Аксессуары', 'Украшения'] },
    { key: 'macro:tech', label: 'Техника', color: '#2563eb', categories: ['Электроника', 'Фото и оптика'] },
    { key: 'macro:care', label: 'Здоровье и уход', color: '#0f9f76', categories: ['Здоровье', 'Красота и уход', 'Интимные товары', 'Табак и никотин'] },
    { key: 'macro:family', label: 'Семья и питомцы', color: '#d97706', categories: ['Детям', 'Зоотовары', 'Игрушки'] },
    { key: 'macro:leisure', label: 'Хобби и отдых', color: '#c026d3', categories: ['Хобби и творчество', 'Музыка', 'Книги', 'Спорт', 'Канцтовары'] },
    { key: 'macro:transport', label: 'Транспорт', color: '#f97316', categories: ['Авто'] },
    { key: 'macro:digital', label: 'Цифровое', color: '#9333ea', categories: ['Цифровые покупки', 'Подписки'] },
    { key: 'macro:help', label: 'Помощь', color: '#16a34a', categories: ['Благотворительность'] },
    { key: 'macro:other', label: 'Другое', color: '#94a3b8', categories: ['unknown'] }
  ].map((group) => Object.freeze({ ...group, categories: Object.freeze(group.categories) })));

  const groupByCategory = new Map(macroGroups.flatMap((group) => group.categories.map((category) => [category, group])));
  const groupByKey = new Map(macroGroups.map((group) => [group.key, group]));

  function macroGroup(category) {
    return groupByCategory.get(String(category || 'unknown')) || groupByKey.get('macro:other');
  }

  function macroColor(key) {
    return groupByKey.get(String(key || ''))?.color || groupByKey.get('macro:other').color;
  }

  function buildCategoryBreakdown(records, previousRecords = [], level = 'detail') {
    const macro = level === 'macro';
    const totals = new Map();
    const previousTotals = new Map();

    const bucket = (row) => {
      const category = String(row?.category || 'unknown');
      if (!macro) return { key: category, category, label: '', color: '', categories: [category] };
      const group = macroGroup(category);
      return { key: group.key, category: group.key, label: group.label, color: group.color, categories: [category] };
    };

    for (const row of Array.isArray(records) ? records : []) {
      const amount = Number(row?.amount) || 0;
      if (!amount) continue;
      const item = bucket(row);
      const current = totals.get(item.key) || { ...item, amount: 0, count: 0, categorySet: new Set() };
      current.amount += amount;
      if (amount > 0) current.count += 1;
      current.categorySet.add(String(row?.category || 'unknown'));
      totals.set(item.key, current);
    }

    for (const row of Array.isArray(previousRecords) ? previousRecords : []) {
      const amount = Number(row?.amount) || 0;
      if (!amount) continue;
      const item = bucket(row);
      previousTotals.set(item.key, (previousTotals.get(item.key) || 0) + amount);
    }

    const entries = [...totals.values()]
      .filter((item) => item.amount > 0)
      .map(({ categorySet, ...item }) => ({
        ...item,
        categories: [...categorySet],
        previousAmount: Math.max(0, previousTotals.get(item.key) || 0)
      }))
      .sort((left, right) => right.amount - left.amount || left.label.localeCompare(right.label, 'ru'));

    return {
      level: macro ? 'macro' : 'detail',
      total: entries.reduce((sum, item) => sum + item.amount, 0),
      entries
    };
  }

  return Object.freeze({ macroGroups, macroGroup, macroColor, buildCategoryBreakdown });
});
