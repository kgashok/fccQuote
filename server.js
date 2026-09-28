const express = require('express');
const fs = require('fs');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const app = express();
fs.mkdirSync('.data', { recursive: true });
const db = low(new FileSync('.data/db.json'));
db.defaults({ quotes: [] }).write();

app.use(express.static('public'));

app.get('/', function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

app.get('/responses', function (request, response) {
  response.json(db.get('quotes').value().slice().reverse());
});

app.get('/generate', async function (request, response) {
  const seed = request.query.rnumber;
  if (!/^\d{1,6}$/.test(seed || '')) {
    return response.status(400).json({ error: 'Enter a number between 0 and 999999.' });
  }

  try {
    const options = { signal: AbortSignal.timeout(10000) };
    const countResponse = await fetch('https://dummyjson.com/quotes?limit=1', options);
    if (!countResponse.ok) throw new Error('Quote source returned ' + countResponse.status);
    const count = (await countResponse.json()).total;
    if (!Number.isInteger(count) || count < 1) throw new Error('Quote source returned invalid count');
    const id = Number(seed) % count + 1;
    const apiResponse = await fetch('https://dummyjson.com/quotes/' + id, options);
    if (!apiResponse.ok) throw new Error('Quote source returned ' + apiResponse.status);
    const data = await apiResponse.json();
    if (!data.quote || !data.author || !Number.isInteger(data.id)) {
      throw new Error('Quote source returned invalid data');
    }
    const quote = {
      quoteText: data.quote,
      quoteAuthor: data.author,
      quoteLink: '/print/' + data.id,
      id: data.id
    };
    db.get('quotes').push(quote).write();
    response.json(quote);
  } catch (error) {
    console.error('Could not fetch quote:', error);
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

const listener = app.listen(process.env.PORT || 5000, '0.0.0.0', function () {
  console.log('Your app is listening on port ' + listener.address().port);
});