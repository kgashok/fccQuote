const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createZenQuotesProvider } = require('../services/zenquotes');

test('ZenQuotes shares a batch between concurrent requests, avoids repeats, and refreshes after an hour', async function () {
  let time = 0;
  let calls = 0;
  const provider = createZenQuotesProvider(async function () {
    calls++;
    return { ok: true, json: async function () {
      return [{ q: 'First', a: 'One' }, { q: 'Second', a: 'Two' }];
    } };
  }, function () { return time; });
  const [first, second] = await Promise.all([provider(), provider()]);
  assert.equal(calls, 1);
  assert.notEqual(first.id, second.id);
  const third = await provider();
  assert.equal(third.id, first.id);
  time = 60 * 60 * 1000;
  await provider();
  assert.equal(calls, 2);
});

test('ZenQuotes does not serve expired data or cache a failed refresh as success', async function () {
  let time = 0;
  let calls = 0;
  const provider = createZenQuotesProvider(async function () {
    calls++;
    if (calls === 2) throw new Error('Network failure');
    return { ok: true, json: async function () { return [{ q: 'Quote', a: 'Author' }]; } };
  }, function () { return time; });
  await provider();
  time = 60 * 60 * 1000;
  await assert.rejects(provider(), /Network failure/);
  await provider();
  assert.equal(calls, 3);
});
