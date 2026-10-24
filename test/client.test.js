const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

function renderTimestamp(quote) {
  const times = [];
  function $(input) {
    const node = {
      attr: function (name, value) { this[name] = value; return this; },
      text: function (value) { this.label = value; return this; },
      appendTo: function () { return this; },
      append: function () { return this; }
    };
    if (typeof input === 'string' && input.startsWith('<time')) times.push(node);
    return node;
  }
  const context = vm.createContext({ $, Date, Number });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../public/client.js'), 'utf8'), context);
  context.addQuoteToDisplay(quote);
  return { times, context };
}

test('quote display uses the saved generation time, including on a fresh render', function () {
  const quote = { id: 1, quoteText: 'Test', quoteAuthor: 'Author', quoteLink: '/print/1',
    generatedAt: '2020-01-02T03:04:05.000Z' };
  const first = renderTimestamp(quote);
  const second = renderTimestamp(quote);
  assert.equal(first.times.length, 1);
  assert.equal(first.times[0].datetime, quote.generatedAt);
  assert.equal(first.times[0].label,
    'Generated ' + first.context.formatTimestamp(new Date(quote.generatedAt)));
  assert.equal(second.times[0].label, first.times[0].label);
});

test('quotes without a valid saved time do not get an invented timestamp', function () {
  for (const generatedAt of [undefined, null, '', 'not-a-date']) {
    assert.equal(renderTimestamp({ id: 1, generatedAt }).times.length, 0);
  }
});
