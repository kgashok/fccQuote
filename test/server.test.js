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
    logger: { error: function () {} }
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