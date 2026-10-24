const crypto = require('crypto');

// Cache the provider's recommended batch response rather than spending one
// of its five-per-30-second requests on every button click.
function createZenQuotesProvider(fetchImpl, now = Date.now) {
  let quotes = [];
  let expiresAt = 0;
  let loading;
  let previousId;

  async function refresh() {
    const response = await fetchImpl('https://zenquotes.io/api/quotes', {
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) {
      const error = new Error('ZenQuotes returned ' + response.status);
      error.rateLimited = response.status === 429;
      throw error;
    }
    const payload = await response.json();
    if (!Array.isArray(payload) || !payload.length || payload.some(function (quote) {
      return !quote || typeof quote.q !== 'string' || !quote.q.trim() ||
        typeof quote.a !== 'string' || !quote.a.trim() ||
        quote.a.toLowerCase() === 'zenquotes.io';
    })) {
      throw new Error('ZenQuotes returned invalid quote data');
    }
    quotes = payload.map(function (quote) {
      return {
        id: 'zenquotes-' + crypto.createHash('sha256')
          .update(JSON.stringify([quote.q, quote.a])).digest('hex'),
        quote: quote.q,
        author: quote.a
      };
    });
    expiresAt = now() + 60 * 60 * 1000;
  }

  return async function getQuote(lastQuote) {
    if (!quotes.length || now() >= expiresAt) {
      if (!loading) {
        loading = refresh().finally(function () { loading = undefined; });
      }
      await loading;
    }
    const lastId = previousId || (lastQuote && lastQuote.id);
    const different = quotes.filter(function (quote) { return quote.id !== lastId; });
    const available = different.length ? different : quotes;
    const quote = available[crypto.randomInt(available.length)];
    previousId = quote.id;
    return quote;
  };
}

module.exports = { createZenQuotesProvider };
