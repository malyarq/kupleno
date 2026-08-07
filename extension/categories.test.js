const assert = require('node:assert/strict');
const { classifySpendCategory, guessSpendCategory, setSpendCategoryRules } = require('./categories.js');

for (const [title, category] of [
  ['Смартфон Apple iPhone 15 128GB', 'Электроника'],
  ['Корм для кошек сухой с курицей', 'Зоотовары'],
  ['Подгузники-трусики Pampers 5', 'Детям'],
  ['Стиральный порошок автомат 3 кг', 'Бытовая химия'],
  ['Кроссовки мужские беговые', 'Обувь'],
  ['Моторное масло 5W-30', 'Авто'],
  ['Wildberries пакет майка ПНД 40*65,20 мкр', 'Продукты'],
  ['Электронный сертификат помощи фонду', 'Благотворительность'],
  ['Визитка Тайлера Дердена', 'Хобби и творчество'],
  ['Wet n Wild База-основа под тени Photofocus', 'Красота и уход'],
  ['INICIO Брюки палаццо лапша широкие', 'Одежда'],
  ['Xiaomi Весы напольные электронные с приложением для дома 180 кг', 'Бытовая техника'],
  ['LYC Ресницы пучковые для наращивания', 'Красота и уход'],
  ['LUXVISAGE Жидкие тени для век Metal hype', 'Красота и уход'],
  ['Скотч прозрачный Альянс, клейкая лента 180м', 'Дом'],
  ['Подарочный набор для девочек KUROMI фиолетовый блокнот 18*13 см на замке', 'Канцтовары'],
  ['Канцелярский нож Attache строительный, ширина лезвия 18 мм', 'Ремонт'],
  ['Гирлянда ИКЕА нить ЛЕДЛЬЮС, 7.5 м, 24 лампы', 'Дом'],
  ['Гель-смазка System JO H2o Cherry Burst', 'Интимные товары'],
  ['Солнцезащитные очки Ray-Ban, черный', 'Аксессуары'],
  ['Материнская плата Gigabyte B650 EAGLE AX SocketAM5', 'Электроника'],
  ['Комиссия сервиса', 'unknown'],
  ['Услуга доставки', 'unknown'],
  ['Набор для валяния игрушек из шерсти, для творчества', 'Хобби и творчество'],
  ['Симулякры и симуляции | Бодрийар Жан', 'Книги'],
  ['Капсулы для стирки Персил Power Caps Color 4в1', 'Бытовая химия'],
  ['Кисточки для детейлинга AutoForce, набор 3шт.', 'Авто'],
  ['Процессор AMD Ryzen 5 7500F AM5, OEM', 'Электроника'],
  ['Блок питания 1STPLAYER NGDP, 750W, ATX3.1', 'Электроника'],
  ['Фен для волос с BLDC-мотором и диффузором', 'Бытовая техника'],
  ['Ключ активации для подключения к приватной сети, на 6 месяцев', 'Цифровые покупки'],
  ['Благотворительный сертификат фонда "Онкологика"', 'Благотворительность'],
  ['POD система Vaporesso XROS 3 MINI', 'Табак и никотин'],
  ['BIODERMA Sensibio Очищающий гель для умывания', 'Красота и уход'],
  ['Конструктор Mercedes-AMG F1 W14 E Performance, набор деталей', 'Игрушки'],
  ['Многофункциональная овощерезка Oursson 8 в 1', 'Дом'],
  ['Мультитул тактический', 'Ремонт'],
  ['Мариам Петросян. Дом, в котором...', 'Книги'],
  ['Носки-тапочки женские MINAKU "Зайка"', 'Обувь'],
  ['Шкант 10х45 мм мебельный деревянный отборный', 'Ремонт'],
  ['Ключ для сервиса защищенной и ускоренной сети, 1 месяц', 'Цифровые покупки'],
  ['Корректор осанки. Корсет для спины Right Route', 'Здоровье'],
  ['Новогодний подарочный набор чая', 'Продукты'],
  ['Кигуруми размер M для взрослых', 'Одежда'],
  ['Мойка высокого давления ЗУБР 240 Атм', 'Бытовая техника'],
  ['Адаптер для щеток стеклоочистителя Side Lock', 'Авто'],
  ['Япона Мама Tuning shop Спортивный руль дрифт OMP Corsica кожа', 'Авто'],
  ['Лента адресная SPI WS2812B 60 Leds', 'Электроника'],
  ['REAL MIG 200 Сварог Полуавтомат сварочный инверторный', 'Ремонт'],
  ['Набор для творчества. Валяние из шерсти. Брелок своими руками', 'Хобби и творчество'],
  ['WONK Расческа-гребень для волос, бороды и усов', 'Красота и уход'],
  ['Подарок маме, подарочный набор "Лучшей маме"', 'Хобби и творчество'],
  ['Подарок мужчине на день рождения / Подарок на новый год', 'unknown'],
  ['Ozon PDF не разобран: чек', 'unknown'],
  ['Подарочный набор', 'unknown']
]) {
  const result = classifySpendCategory(title);
  assert.ok(
    result.category === category
      || (result.category === 'unknown' && result.suggestedCategory === category && result.needsReview),
    `${title}: ожидалась категория ${category}, получено ${result.category}, подсказка ${result.suggestedCategory}`
  );
}

assert.equal(guessSpendCategory('Очень редкий qwertycustom товар'), 'unknown');
assert.equal(setSpendCategoryRules({
  rules: [{ category: 'Хобби и творчество', weight: 9, tokens: ['qwertycustom'] }]
}), 1);
assert.equal(guessSpendCategory('Очень редкий qwertycustom товар'), 'Хобби и творчество');
setSpendCategoryRules({ rules: [{ category: 'Цифровые покупки', weight: 9, tokens: ['steam'] }] });
assert.equal(guessSpendCategory('Iron Sky электронный ключ PC Steam'), 'Цифровые покупки');
setSpendCategoryRules({ rules: [] });

// v2 must make a decision auditable. These deliberately overlap: the old
// keyword-only behaviour is where false positives are most expensive.
const adversarialCases = [
  ['крем для обуви бесцветный', 'Бытовая химия'],
  ['кофейный столик для гостиной', 'Мебель'],
  ['мозаика для ванной комнаты', 'Ремонт'],
  ['мясо для шашлыка охлажденное', 'Продукты'],
  ['горшок для цветов керамический', 'Сад'],
  ['масло для волос аргановое', 'Красота и уход'],
  ['пластилин для лепки мягкий', 'Хобби и творчество'],
  ['чай зелёный листовой', 'Продукты'],
  ['крем для лица увлажняющий', 'Красота и уход'],
  ['крем для рук питательный', 'Красота и уход'],
  ['мозаика алмазная для творчества', 'Хобби и творчество'],
  ['горшок детский дорожный', 'Детям'],
  ['масло моторное 5W-30', 'Авто'],
  ['масло для бороды', 'Красота и уход'],
  ['чайник электрический стальной', 'Бытовая техника'],
  ['чайный столик на колесиках', 'Мебель'],
  ['игрушка пластилин набор', 'Игрушки'],
  ['подарочный набор чая', 'Продукты'],
  ['расческа для волос', 'Красота и уход'],
  ['шампур для шашлыка', 'Дом'],
  ['карандаш для губ', 'Красота и уход'],
  ['карандаш канцелярский', 'Канцтовары'],
  ['свеча зажигания автомобильная', 'Авто'],
  ['свеча ароматическая', 'Дом'],
  ['соль для посудомойки', 'Бытовая химия'],
  ['мыло для лепки', 'Хобби и творчество'],
  ['корм для рыб', 'Зоотовары'],
  ['набор для валяния шерсти', 'Хобби и творчество'],
  ['зарядный кабель usb', 'Электроника'],
  ['вилка Smartbuy', 'Ремонт'],
  ['крем обувной', 'Бытовая химия'],
  ['зелёный чай матча', 'Продукты'],
  ['крем сливочный 20%', 'Продукты'],
  ['крем для торта ванильный', 'Продукты'],
  ['чехол для электронной книги', 'Аксессуары']
];

for (const [title, category] of adversarialCases) {
  const result = classifySpendCategory(title);
  assert.ok(
    result.category === category
      || (result.category === 'unknown' && result.suggestedCategory === category && result.needsReview),
    `${title}: ожидалась категория ${category}, получено ${result.category}, подсказка ${result.suggestedCategory}`
  );
  assert.equal(result.suggestedCategory, category, `${title}: suggestion`);
  assert.ok(result.confidence > 0 && result.confidence <= 1, `${title}: confidence`);
  assert.ok(Array.isArray(result.evidence) && result.evidence.length, `${title}: evidence`);
  assert.ok(Array.isArray(result.candidates) && result.candidates[0]?.category === category, `${title}: candidates`);
  assert.equal(result.method, 'lexicon-v2', `${title}: method`);
}

for (const title of [
  'крем для обуви', 'кофейный столик', 'мозаика для ванной', 'мясо для шашлыка',
  'горшок для цветов', 'масло для волос', 'пластилин для лепки', 'чай зелёный'
]) {
  const result = classifySpendCategory(title);
  assert.ok(result.evidence.some((item) => item.kind === 'phrase' && item.source === 'context'), `${title}: contextual phrase`);
  assert.equal(result.needsReview, false, `${title}: resolved context`);
}

const stemResult = classifySpendCategory('игрушка пластилин');
assert.ok(stemResult.evidence.some((item) => item.kind === 'stem' && item.token === 'игрушк'));
const exactResult = classifySpendCategory('чай матча');
assert.ok(exactResult.evidence.some((item) => item.kind === 'exact' && item.token === 'чай'));

const conflicting = classifySpendCategory('сумка для ноутбука');
assert.equal(conflicting.category, 'unknown');
assert.equal(conflicting.suggestedCategory, 'Аксессуары');
assert.equal(conflicting.needsReview, true);
assert.equal(conflicting.candidates.length, 2);
assert.equal(conflicting.candidates[0].score, conflicting.candidates[1].score);
assert.ok(conflicting.confidence < 0.5);

const weak = classifySpendCategory('шампур');
assert.equal(weak.category, 'unknown');
assert.equal(weak.suggestedCategory, 'Дом');
assert.equal(weak.needsReview, true);
assert.ok(weak.confidence < 0.64);

for (const [title, suggestion] of [
  ['Игрушка для кошки', 'Игрушки'],
  ['Кольцо для ключей', 'Украшения']
]) {
  const result = classifySpendCategory(title);
  assert.equal(result.category, 'unknown', title);
  assert.equal(result.suggestedCategory, suggestion, title);
  assert.equal(result.needsReview, true, `${title}: общий одиночный признак требует проверки`);
}

assert.deepEqual(classifySpendCategory('Подарочный набор'), {
  category: 'unknown', suggestedCategory: 'unknown', confidence: 0,
  evidence: [], candidates: [], needsReview: true, method: 'lexicon-v2'
});
assert.equal(classifySpendCategory({ raw_title: 'чай зелёный' }).category, 'Продукты');

// A local pack may replace an embedded token, but must not score it twice.
setSpendCategoryRules({ rules: [{ category: 'Цифровые покупки', weight: 9, tokens: ['steam'] }] });
const localDuplicate = classifySpendCategory('Steam');
assert.equal(localDuplicate.category, 'Цифровые покупки');
assert.equal(localDuplicate.candidates[0].score, 10);
assert.deepEqual(localDuplicate.evidence, [{ token: 'steam', kind: 'exact', source: 'local', score: 10 }]);
setSpendCategoryRules({ rules: [{ category: 'Локальная категория', weight: 10, tokens: ['privateitem'] }] });
const localOnly = classifySpendCategory('privateitem');
assert.equal(localOnly.category, 'Локальная категория');
assert.equal(localOnly.evidence[0].source, 'local');
setSpendCategoryRules({ rules: [] });
