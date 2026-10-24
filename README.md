# Quote Generator

1. Hover over and click on the Twitter button to post to Twitter
2. Click on the author to know more about him on Wikipedia
3. Click on the actual quote itself to generate a Printable version

## Running

Install dependencies with `npm install` and start with `npm start`. The server listens on port 5000 by default (or `PORT` when provided). Choose a source before generating a quote: DummyJSON and Quotable supply random quotes, while FavQs and They Said So supply their Quote of the Day. Quotable supports optional tag filters (comma for AND, `|` for OR) and minimum/maximum quote lengths. They Said So requires an API key in the `THEYSAIDSO_API_KEY` environment variable. Quotes are saved locally in `.data/db.json`; DummyJSON, FavQs, and Quotable do not require API keys.
  
  
## Updates on Express framework
  - http://j.mp/postExpress 
  - [Analogy with ordering](http://j.mp/eatingExpress)
  - [Promises and Express](http://j.mp/promiseExpress)
  
## Using Unirest 
  - http://unirest.io/nodejs.html
  