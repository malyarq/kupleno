const assert = require('node:assert/strict');
const { redactText, redactLog, anonymizeSpendRows } = require('./privacy.js');

{
  const safe = redactText('Чек https://receipt.example/123?token=secret заказ 123456789 user@example.com');
  assert.equal(safe.includes('receipt.example'), false);
  assert.equal(safe.includes('123456789'), false);
  assert.equal(safe.includes('user@example.com'), false);
}

{
  const safe = redactLog(['Обычная строка: 12 чеков', 'JWT aaaabbbbccccddddeeeeffff.gggghhhhiiiijjjjkkkkllll.mmmmnnnnooooppppqqqqrrrr']);
  assert.match(safe, /Обычная строка: 12 чеков/);
  assert.match(safe, /\[токен скрыт\]/);
}

{
  const safe = redactLog([
    'Authorization: Basic dXNlcjpwYXNzd29yZA==',
    'Cookie: sid=session-secret; refresh=refresh-secret',
    'Set-Cookie=auth=secret; HttpOnly; Secure',
    'opaque abcdefghijklmnopqrstuvwxyz0123456789AB'
  ]);
  for (const secret of ['dXNlcjpwYXNzd29yZA', 'session-secret', 'refresh-secret', 'auth=secret', 'abcdefghijklmnopqrstuvwxyz0123456789AB']) {
    assert.equal(safe.includes(secret), false, `${secret} должен быть скрыт`);
  }
  assert.match(safe, /Authorization: \[скрыто\]/);
  assert.match(safe, /Cookie: \[скрыто\]/);
  assert.match(safe, /Set-Cookie: \[скрыто\]/);
}

assert.equal(redactText('Обычная строка: 12 чеков'), 'Обычная строка: 12 чеков');

{
  const [row] = anonymizeSpendRows([{
    date: '2026-07-15',
    source: 'ozon',
    title: 'Очень личная покупка',
    amount: '-1490',
    currency: 'RUB',
    category: 'Дом',
    type: 'refund',
    marketplace_id: 'order-42',
    item_index: '2'
  }]);
  assert.deepEqual(row, {
    date: '2026-07-01',
    source: 'ozon',
    title: 'Возврат',
    amount: '-1490.00',
    currency: 'RUB',
    category: 'Дом',
    type: 'refund',
    marketplace_id: '',
    item_index: ''
  });
}
