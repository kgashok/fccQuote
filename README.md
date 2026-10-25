# Quote Generator

1. Hover over and click on the Twitter button to post to Twitter
2. Click on the author to know more about him on Wikipedia
3. Click on the actual quote itself to generate a Printable version

## Running

Install dependencies with `npm install` and start with `npm start`. The server listens on port 5000 by default (or `PORT` when provided). Choose a source before generating a quote: DummyJSON and ZenQuotes supply random quotes, while FavQs and They Said So supply their Quote of the Day. ZenQuotes replaces Quotable and does not offer the old tag/length filters. ZenQuotes batches are cached in memory for one hour to respect its free rate limit (5 requests per 30 seconds). Inspirational quotes are provided by [ZenQuotes API](https://zenquotes.io/). They Said So requires an API key in the `THEYSAIDSO_API_KEY` environment variable. Quotes are saved locally in `.data/db.json`; DummyJSON, FavQs, and ZenQuotes do not require API keys.
  
  
## Updates on Express framework
  - http://j.mp/postExpress 
  - [Analogy with ordering](http://j.mp/eatingExpress)
  - [Promises and Express](http://j.mp/promiseExpress)
  
## Using Unirest 
  - http://unirest.io/nodejs.html
  
## Progressive Web App

The app is installable and its shell works offline.

- `public/manifest.webmanifest` and `public/icons/` describe the app; they are linked from `views/index.html`.
- `public/sw.js` precaches the shell (`/`, CSS, JS, icons, jQuery CDN) and serves it network-first with cache fallback. Quote generation (`/generate`) is never cached. Old `fccquote-*` caches are deleted on activate; bump `CACHE_VERSION` in `sw.js` to release changes.
- `client.js` registers the worker, shows an offline banner, and shows a friendly message if a quote fetch fails offline.

Testing: run `npm start`, open http://localhost:5000 (localhost counts as a secure context), check DevTools > Application > Manifest / Service Workers, tick "Offline" and reload, and try "Get Quote!" to see the message. Use the browser's Install action to install.

Known limitations: new quotes cannot be generated offline; previously loaded saved quotes are shown from cache. Production needs HTTPS.
