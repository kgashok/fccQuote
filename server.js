const express = require('express');
const fs = require('fs');
const path = require('path');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

function createApp(options) {
  options = options || {};
  const databaseFile = options.databaseFile || path.join(__dirname, '.data', 'db.json');
  const fetchQuote = options.fetchImpl || global.fetch;
  const logger = options.logger || console;

  fs.mkdirSync(path.dirname(databaseFile), { recursive: true });
  const db = low(new FileSync(databaseFile));
  db.defaults({ quotes: [] }).write();

  const app = express();
  app.use(express.static(path.join(__dirname, 'public')));

  app.get('/', function (request, response) {
    response.sendFile(path.join(__dirname, 'views', 'index.html'));
  });

  app.get('/responses', function (request, response) {
    response.json(db.get('quotes').value().slice().reverse());
  });

  app.get('/generate', async function (request, response) {
    const seed = request.query.rnumber;
    if (seed !== undefined && !/^\d{1,6}$/.test(seed || '')) {
      return response.status(400).json({ error: 'Enter a number between 0 and 999999.' });
    }

    try {
      const lastQuote = db.get('quotes').last().value();
      const fetchOptions = { signal: AbortSignal.timeout(10000) };
      let requestedId;
      if (seed !== undefined) {
        const countResponse = await fetchQuote('https://dummyjson.com/quotes?limit=1', fetchOptions);
        if (!countResponse.ok) throw new Error('Quote source returned ' + countResponse.status);
        const count = (await countResponse.json()).total;
        if (!Number.isInteger(count) || count < 1) throw new Error('Quote source returned invalid count');
        requestedId = Number(seed) % count + 1;
      }
      let data;
      for (let attempt = 0; attempt < 5; attempt++) {
        const quoteUrl = attempt === 0 && requestedId !== undefined
          ? 'https://dummyjson.com/quotes/' + requestedId
          : 'https://dummyjson.com/quotes/random';
        const apiResponse = await fetchQuote(quoteUrl, fetchOptions);
        if (!apiResponse.ok) throw new Error('Quote source returned ' + apiResponse.status);
        const candidate = await apiResponse.json();
        if (!candidate.quote || !candidate.author || !Number.isInteger(candidate.id)) {
          throw new Error('Quote source returned invalid data');
        }
        if (!lastQuote || candidate.id !== lastQuote.id) {
          data = candidate;
          break;
        }
      }
      if (!data) throw new Error('Quote source repeated the previous quote');
      const quote = {
        quoteText: data.quote,
        quoteAuthor: data.author,
        quoteLink: '/print/' + data.id,
        id: data.id
      };
      if (!db.get('quotes').some({ id: quote.id }).value()) {
        db.get('quotes').push(quote).write();
      }
      response.json(quote);
    } catch (error) {
      logger.error('Could not fetch quote:', error);
      response.status(502).json({ error: 'Could not fetch a quote right now. Please try again.' });
    }
  });

  app.get('/print/:id', function (request, response) {
    const quote = db.get('quotes').find({ id: Number(request.params.id) }).value();
    if (!quote) return response.sendStatus(404);
    const escape = function (text) {
      return String(text).replace(/[&<>"']/g, function (char) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
      });
    };
    response.send('<!doctype html><html><head><meta charset="utf-8"><title>Printable quote</title>' +
      '<style>body{max-width:40rem;margin:4rem auto;padding:1rem;font:1.4rem Georgia,serif;line-height:1.5}' +
      '@media print{button{display:none}}</style></head><body><blockquote>' +
      escape(quote.quoteText) + '</blockquote><p>— ' + escape(quote.quoteAuthor) +
      '</p><button onclick="window.print()">Print</button></body></html>');
  });

  return app;
}

if (require.main === module) {
  const app = createApp();
  const listener = app.listen(process.env.PORT || 5000, '0.0.0.0', function () {
    console.log('Your app is listening on port ' + listener.address().port);
  });
}

module.exports = { createApp };