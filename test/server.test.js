const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const { createApp } = require('../server');

function upstreamResponse(body, status) {
  status = status || 200;
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async function () {
      return body;
    }
  };
}

function stubFetch(responses) {
  const calls = [];
  return {
    calls,
    fetchImpl: async function (url, options) {
      calls.push({ url, options });
      const result = responses.shift();
      if (result instanceof Error) throw result;
      return result;
    }
  };
}

async function startApp(t, fetchImpl, options) {
  options = options || {};
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'quote-app-test-'));
  const app = createApp({
    databaseFile: options.databaseFile || path.join(directory, 'db.json'),
    fetchImpl,
    theySaidSoApiKey: options.theySaidSoApiKey,
    logger: options.logger || { error: function () {} }
  });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(function (resolve, reject) {
    server.once('error', reject);
    server.once('listening', resolve);
  });

  t.after(async function () {
    server.closeAllConnections();
    await new Promise(function (resolve, reject) {
      server.close(function (error) {
        if (error) return reject(error);
        resolve();
      });
    });
    fs.rmSync(directory, { recursive: true, force: true });
  });

  return 'http://127.0.0.1:' + server.address().port;
}

test('GET /generate rejects invalid inputs without contacting the quote source', async function (t) {
  const stub = stubFetch([]);
  const baseUrl = await startApp(t, stub.fetchImpl);
  const invalidPaths = [
    '/generate?rnumber=',
    '/generate?rnumber=-1',
    '/generate?rnumber=1.5',
    '/generate?rnumber=abc',
    '/generate?rnumber=1000000'
  ];

  for (const route of invalidPaths) {
    const response = await fetch(baseUrl + route);
    assert.equal(response.status, 400, route);
    assert.deepEqual(await response.json(), {
      error: 'Enter a number between 0 and 999999.'
    });
  }
  assert.equal(stub.calls.length, 0);
});

test('GET /generate without a number fetches a new random quote on each click', async function (t) {
  const stub = stubFetch([
    upstreamResponse({ id: 1, quote: 'First quote', author: 'Author One' }),
    upstreamResponse({ id: 1, quote: 'First quote', author: 'Author One' }),
    upstreamResponse({ id: 2, quote: 'Second quote', author: 'Author Two' })
  ]);
  const baseUrl = await startApp(t, stub.fetchImpl);

  const first = await (await fetch(baseUrl + '/generate')).json();
  const second = await (await fetch(baseUrl + '/generate')).json();
  assert.equal(first.id, 1);
  assert.equal(second.id, 2);
  assert.deepEqual(stub.calls.map(function (call) { return call.url; }), [
    'https://dummyjson.com/quotes/random',
    'https://dummyjson.com/quotes/random',
    'https://dummyjson.com/quotes/random'
  ]);
  const saved = await (await fetch(baseUrl + '/responses')).json();
  assert.deepEqual(saved, [second, first]);
});

test('GET /generate can fetch and save the FavQs quote of the day', async function (t) {
  const favqsResponse = upstreamResponse({
    quote: { id: 123, body: 'A FavQs quote', author: 'FavQs Author' }
  });
  const stub = stubFetch([favqsResponse, favqsResponse]);
  const baseUrl = await startApp(t, stub.fetchImpl);

  const page = await (await fetch(baseUrl + '/')).text();
  assert.match(page, /<option value="favqs">FavQs \(Quote of the Day\)<\/option>/);

  const first = await (await fetch(baseUrl + '/generate?source=favqs')).json();
  const repeated = await (await fetch(baseUrl + '/generate?source=favqs')).json();
  assert.deepEqual(first, {
    quoteText: 'A FavQs quote',
    quoteAuthor: 'FavQs Author',
    quoteLink: '/print/-123',
    id: -123,
    generatedAt: first.generatedAt
  });
  assert.deepEqual(repeated, first);
  assert.deepEqual(stub.calls.map(function (call) { return call.url; }), [
    'https://favqs.com/api/qotd',
    'https://favqs.com/api/qotd'
  ]);
  assert.deepEqual(await (await fetch(baseUrl + '/responses')).json(), [first]);
  assert.equal((await fetch(baseUrl + '/print/-123')).status, 200);
});

test('GET /generate can fetch and save the authenticated They Said So quote of the day', async function (t) {
  const response = upstreamResponse({
    contents: {
      quotes: [{ id: 'quote-123', quote: 'A They Said So quote', author: 'TSS Author' }]
    }
  });
  const stub = stubFetch([response, response]);
  const baseUrl = await startApp(t, stub.fetchImpl, { theySaidSoApiKey: 'test-api-key' });

  const page = await (await fetch(baseUrl + '/')).text();
  assert.match(page, /<option value="they-said-so">They Said So \(Quote of the Day\)<\/option>/);

  const first = await (await fetch(baseUrl + '/generate?source=they-said-so')).json();
  const repeated = await (await fetch(baseUrl + '/generate?source=they-said-so')).json();
  assert.deepEqual(first, {
    quoteText: 'A They Said So quote',
    quoteAuthor: 'TSS Author',
    quoteLink: '/print/' + first.id,
    id: first.id,
    generatedAt: first.generatedAt
  });
  assert.match(first.id, /^they-said-so-[a-f0-9]{64}$/);
  assert.deepEqual(repeated, first);
  assert.deepEqual(stub.calls.map(function (call) { return call.url; }), [
    'https://quotes.rest/qod?language=en',
    'https://quotes.rest/qod?language=en'
  ]);
  assert.ok(stub.calls.every(function (call) {
    return call.options.headers.Authorization === 'Bearer test-api-key' &&
      call.options.signal instanceof AbortSignal;
  }));
  assert.deepEqual(await (await fetch(baseUrl + '/responses')).json(), [first]);
  assert.equal((await fetch(baseUrl + first.quoteLink)).status, 200);
});

test('GET /generate saves and prints ZenQuotes with original times and caches the batch', async function (t) {
  const stub = stubFetch([upstreamResponse([{
    q: 'A ZenQuotes quote',
    a: 'ZenQuotes Author'
  }])]);
  const baseUrl = await startApp(t, stub.fetchImpl);

  const page = await (await fetch(baseUrl + '/')).text();
  assert.match(page, /<option value="zenquotes">ZenQuotes \(random quotes\)<\/option>/);
  assert.doesNotMatch(page, /value="quotable"|quotableOptions|quoteTags/);
  assert.match(page, /href="https:\/\/zenquotes.io\/"/);

  const route = '/generate?source=zenquotes';
  const first = await (await fetch(baseUrl + route)).json();
  const repeated = await (await fetch(baseUrl + route)).json();
  assert.deepEqual(first, {
    quoteText: 'A ZenQuotes quote',
    quoteAuthor: 'ZenQuotes Author',
    quoteLink: '/print/' + first.id,
    id: first.id,
    generatedAt: first.generatedAt
  });
  assert.deepEqual(repeated, first);
  assert.match(first.id, /^zenquotes-[a-f0-9]{64}$/);
  assert.ok(Number.isFinite(Date.parse(first.generatedAt)));
  assert.equal(stub.calls.length, 1);
  assert.equal(stub.calls[0].url, 'https://zenquotes.io/api/quotes');
  assert.ok(stub.calls.every(function (call) {
    return call.options.signal instanceof AbortSignal;
  }));
  assert.deepEqual(await (await fetch(baseUrl + '/responses')).json(), [first]);
  const printed = await fetch(baseUrl + first.quoteLink);
  assert.equal(printed.status, 200);
  const printHtml = await printed.text();
  assert.ok(printHtml.includes(first.generatedAt));
  assert.match(printHtml, /href="https:\/\/zenquotes.io\/"/);
});

test('GET /generate rejects the retired source and unsupported filters without contacting a provider', async function (t) {
  const stub = stubFetch([]);
  const baseUrl = await startApp(t, stub.fetchImpl);

  for (const route of [
    '/generate?source=quotable',
    '/generate?source=zenquotes&minLength=20',
    '/generate?source=zenquotes&maxLength=10',
    '/generate?source=zenquotes&tags=history'
  ]) {
    assert.equal((await fetch(baseUrl + route)).status, 400, route);
  }
  assert.equal(stub.calls.length, 0);
});

test('ZenQuotes reports rate limits, bad data, and network errors without saving error messages as quotes', async function (t) {
  const cases = [
    { value: upstreamResponse({}, 429), status: 429, message: /rate limited/ },
    { value: upstreamResponse({}, 503), status: 502, message: /unavailable/ },
    { value: upstreamResponse([]), status: 502, message: /unavailable/ },
    { value: upstreamResponse([{ q: 'Too many requests', a: 'zenquotes.io' }]), status: 502, message: /unavailable/ },
    { value: upstreamResponse([{ q: 'Missing author' }]), status: 502, message: /unavailable/ },
    { value: new Error('Network failure'), status: 502, message: /unavailable/ }
  ];
  for (const example of cases) {
    const stub = stubFetch([example.value]);
    const baseUrl = await startApp(t, stub.fetchImpl);
    const response = await fetch(baseUrl + '/generate?source=zenquotes');
    assert.equal(response.status, example.status);
    assert.match((await response.json()).error, example.message);
    if (example.status === 429) assert.equal(response.headers.get('retry-after'), '30');
    assert.deepEqual(await (await fetch(baseUrl + '/responses')).json(), []);
  }
});

test('GET /generate requires a They Said So API key without contacting the provider', async function (t) {
  const stub = stubFetch([]);
  const baseUrl = await startApp(t, stub.fetchImpl, { theySaidSoApiKey: '' });

  const response = await fetch(baseUrl + '/generate?source=they-said-so');
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    error: 'They Said So API key is not configured.'
  });
  assert.equal(stub.calls.length, 0);
});

test('GET /generate handles empty or malformed They Said So responses without saving a quote', async function (t) {
  const errors = [];
  const stub = stubFetch([
    upstreamResponse(null),
    upstreamResponse({ contents: { quotes: [] } })
  ]);
  const baseUrl = await startApp(t, stub.fetchImpl, {
    theySaidSoApiKey: 'test-api-key',
    logger: { error: function (_message, error) { errors.push(error); } }
  });

  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await fetch(baseUrl + '/generate?source=they-said-so');
    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), {
      error: 'Could not fetch a quote right now. Please try again.'
    });
  }

  assert.equal(stub.calls.length, 2);
  assert.ok(errors.every(function (error) {
    return error.message === 'Quote source returned invalid data';
  }));
  assert.deepEqual(await (await fetch(baseUrl + '/responses')).json(), []);
});

test('GET /generate saves a quote that appears in /responses and /print/:id', async function (t) {
  const stub = stubFetch([
    upstreamResponse({ total: 100 }),
    upstreamResponse({
      id: 43,
      quote: '<script>alert("x")</script> & keep going',
      author: "A & B's"
    })
  ]);
  const baseUrl = await startApp(t, stub.fetchImpl);

  const generateResponse = await fetch(baseUrl + '/generate?rnumber=42');
  assert.equal(generateResponse.status, 200);
  const quote = await generateResponse.json();
  assert.deepEqual(quote, {
    quoteText: '<script>alert("x")</script> & keep going',
    quoteAuthor: "A & B's",
    quoteLink: '/print/43',
    id: 43,
    generatedAt: quote.generatedAt
  });
  assert.ok(Number.isFinite(Date.parse(quote.generatedAt)));
  assert.deepEqual(stub.calls.map(function (call) {
    return call.url;
  }), [
    'https://dummyjson.com/quotes?limit=1',
    'https://dummyjson.com/quotes/43'
  ]);
  assert.ok(stub.calls.every(function (call) {
    return call.options.signal instanceof AbortSignal;
  }));

  const responsesResponse = await fetch(baseUrl + '/responses');
  assert.equal(responsesResponse.status, 200);
  assert.deepEqual(await responsesResponse.json(), [quote]);

  const printResponse = await fetch(baseUrl + '/print/43');
  assert.equal(printResponse.status, 200);
  const printHtml = await printResponse.text();
  assert.match(printHtml, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt; &amp; keep going/);
  assert.match(printHtml, /A &amp; B&#39;s/);
  assert.doesNotMatch(printHtml, /<script>/);
  assert.match(printHtml, /window\.print\(\)/);

  const missingPrintResponse = await fetch(baseUrl + '/print/999');
  assert.equal(missingPrintResponse.status, 404);
});

test('generation times persist across restarts; repeats and legacy records keep their original metadata', async function (t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'quote-time-test-'));
  t.after(function () { fs.rmSync(directory, { recursive: true, force: true }); });
  const databaseFile = path.join(directory, 'db.json');
  const original = {
    id: 1, quoteText: 'Original', quoteAuthor: 'Author', quoteLink: '/print/1',
    generatedAt: '2020-01-02T03:04:05.000Z'
  };
  const legacy = { id: 2, quoteText: 'Legacy', quoteAuthor: 'Author', quoteLink: '/print/2' };
  fs.writeFileSync(databaseFile, JSON.stringify({ quotes: [original, legacy] }));
  const stub = stubFetch([
    upstreamResponse({ id: 3, quote: 'New', author: 'Author' }),
    upstreamResponse({ id: 1, quote: 'Original', author: 'Author' }),
    upstreamResponse({ id: 2, quote: 'Legacy', author: 'Author' })
  ]);
  const baseUrl = await startApp(t, stub.fetchImpl, { databaseFile });
  const before = Date.now();
  const newQuote = await (await fetch(baseUrl + '/generate')).json();
  assert.ok(Date.parse(newQuote.generatedAt) >= before);
  assert.ok(Date.parse(newQuote.generatedAt) <= Date.now());
  assert.deepEqual(await (await fetch(baseUrl + '/generate')).json(), original);
  assert.deepEqual(await (await fetch(baseUrl + '/generate')).json(), legacy);
  const expected = [newQuote, legacy, original];
  assert.deepEqual(await (await fetch(baseUrl + '/responses')).json(), expected);
  assert.deepEqual(JSON.parse(fs.readFileSync(databaseFile, 'utf8')).quotes,
    [original, legacy, newQuote]);

  // A fresh app instance reads the original times back from disk.
  const restartedUrl = await startApp(t, stubFetch([]).fetchImpl, { databaseFile });
  assert.deepEqual(await (await fetch(restartedUrl + '/responses')).json(), expected);
  const printed = await (await fetch(restartedUrl + '/print/1')).text();
  assert.ok(printed.includes(original.generatedAt));
  const legacyPrint = await (await fetch(restartedUrl + '/print/2')).text();
  assert.ok(!legacyPrint.includes('<time'));
});

test('GET /generate reports upstream failures and does not save a quote', async function (t) {
  const stub = stubFetch([
    upstreamResponse({}, 503),
    upstreamResponse({ total: 100 }),
    upstreamResponse({}, 502)
  ]);
  const baseUrl = await startApp(t, stub.fetchImpl);

  for (const route of ['/generate?rnumber=7', '/generate?rnumber=8']) {
    const response = await fetch(baseUrl + route);
    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), {
      error: 'Could not fetch a quote right now. Please try again.'
    });
  }

  assert.equal(stub.calls.length, 3);
  const responsesResponse = await fetch(baseUrl + '/responses');
  assert.deepEqual(await responsesResponse.json(), []);
});

test('GET /generate reports network and malformed-provider failures without saving', async function (t) {
  const invalidQuoteResponse = {
    ok: true,
    status: 200,
    json: async function () {
      return { id: 5, quote: 'Missing author' };
    }
  };
  const stub = stubFetch([
    new Error('network unavailable'),
    upstreamResponse({ total: 10 }),
    invalidQuoteResponse
  ]);
  const baseUrl = await startApp(t, stub.fetchImpl);

  for (const route of ['/generate?rnumber=1', '/generate?rnumber=2']) {
    const response = await fetch(baseUrl + route);
    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), {
      error: 'Could not fetch a quote right now. Please try again.'
    });
  }

  assert.equal(stub.calls.length, 3);
  const responsesResponse = await fetch(baseUrl + '/responses');
  assert.deepEqual(await responsesResponse.json(), []);
});