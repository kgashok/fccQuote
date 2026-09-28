# Quote Generator

1. Hover over and click on the Twitter button to post to Twitter
2. Click on the author to know more about him on Wikipedia
3. Click on the actual quote itself to generate a Printable version

## Running

Install dependencies with `npm install` and start with `npm start`. The server listens on port 5000 by default (or `PORT` when provided). Each click fetches a random quote from the public [DummyJSON quotes API](https://dummyjson.com/docs/quotes), skipping the last quote if the source returns it again. Quotes are saved locally in `.data/db.json`. No API key is required.
  
  
## Updates on Express framework
  - http://j.mp/postExpress 
  - [Analogy with ordering](http://j.mp/eatingExpress)
  - [Promises and Express](http://j.mp/promiseExpress)
  
## Using Unirest 
  - http://unirest.io/nodejs.html
  