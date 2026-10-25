import { Router, type IRouter } from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type Quote = {
  quoteText: string;
  quoteAuthor: string;
  quoteLink: string;
  id: number;
};

const router: IRouter = Router();
const databaseFile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.data/db.json");
fs.mkdirSync(path.dirname(databaseFile), { recursive: true });
if (!fs.existsSync(databaseFile)) fs.writeFileSync(databaseFile, '{"quotes":[]}');

function readQuotes(): Quote[] {
  return (JSON.parse(fs.readFileSync(databaseFile, "utf8")) as { quotes: Quote[] }).quotes;
}

function saveQuotes(quotes: Quote[]) {
  fs.writeFileSync(databaseFile, JSON.stringify({ quotes }, null, 2));
}

router.get("/responses", (_request, response) => {
  response.json(readQuotes().slice().reverse());
});

router.get("/generate", async (request, response) => {
  const seed = request.query.rnumber;
  if (seed !== undefined && (typeof seed !== "string" || !/^\d{1,6}$/.test(seed))) {
    response.status(400).json({ error: "Enter a number between 0 and 999999." });
    return;
  }

  try {
    const quotes = readQuotes();
    const lastQuote = quotes.at(-1);
    const fetchOptions = { signal: AbortSignal.timeout(10000) };
    let requestedId: number | undefined;
    if (seed !== undefined) {
      const countResponse = await fetch("https://dummyjson.com/quotes?limit=1", fetchOptions);
      if (!countResponse.ok) throw new Error("Quote source returned " + countResponse.status);
      const count = (await countResponse.json() as { total: number }).total;
      if (!Number.isInteger(count) || count < 1) throw new Error("Quote source returned invalid count");
      requestedId = Number(seed) % count + 1;
    }
    let data: { quote: string; author: string; id: number } | undefined;
    for (let attempt = 0; attempt < 5; attempt++) {
      const quoteUrl = attempt === 0 && requestedId !== undefined
        ? "https://dummyjson.com/quotes/" + requestedId
        : "https://dummyjson.com/quotes/random";
      const apiResponse = await fetch(quoteUrl, fetchOptions);
      if (!apiResponse.ok) throw new Error("Quote source returned " + apiResponse.status);
      const candidate = await apiResponse.json() as { quote: string; author: string; id: number };
      if (!candidate.quote || !candidate.author || !Number.isInteger(candidate.id)) {
        throw new Error("Quote source returned invalid data");
      }
      if (!lastQuote || candidate.id !== lastQuote.id) {
        data = candidate;
        break;
      }
    }
    if (!data) throw new Error("Quote source repeated the previous quote");
    const quote: Quote = {
      quoteText: data.quote,
      quoteAuthor: data.author,
      quoteLink: "/print/" + data.id,
      id: data.id,
    };
    // The quote service may take seconds; another request could have saved a
    // quote while this request was waiting. Merge against the latest store.
    const currentQuotes = readQuotes();
    if (!currentQuotes.some((existing) => existing.id === quote.id)) {
      currentQuotes.push(quote);
      saveQuotes(currentQuotes);
    }
    response.json(quote);
  } catch (error) {
    request.log.error({ err: error }, "Could not fetch quote");
    response.status(502).json({ error: "Could not fetch a quote right now. Please try again." });
  }
});

router.get("/print/:id", (request, response) => {
  const quote = readQuotes().find((item) => item.id === Number(request.params.id));
  if (!quote) {
    response.sendStatus(404);
    return;
  }
  const escape = (text: string) => String(text).replace(/[&<>"']/g, (char) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!
  );
  response.send('<!doctype html><html><head><meta charset="utf-8"><title>Printable quote</title>' +
    '<style>body{max-width:40rem;margin:4rem auto;padding:1rem;font:1.4rem Georgia,serif;line-height:1.5}' +
    '@media print{button{display:none}}</style></head><body><blockquote>' +
    escape(quote.quoteText) + '</blockquote><p>— ' + escape(quote.quoteAuthor) +
    '</p><button onclick="window.print()">Print</button></body></html>');
});

export default router;