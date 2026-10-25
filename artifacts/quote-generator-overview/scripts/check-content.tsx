import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Overview from '../src/pages/slides/Overview';
import VisitorFlow from '../src/pages/slides/VisitorFlow';
import RequestFlow from '../src/pages/slides/RequestFlow';
import RunSetup from '../src/pages/slides/RunSetup';

const slides = [
  {
    Component: Overview,
    copy: [
      'Random Quote Generator',
      'Find a quote. Keep it. Share it.',
      'A lightweight app for discovering, saving, sharing, and printing quotes',
      'Original visual identity: beige, wheat, dark orange, and ivory',
    ],
  },
  {
    Component: VisitorFlow,
    copy: [
      'From discovery to sharing',
      'Original visitor experience',
      'Get Quote! requests a quote and adds it to the saved list',
      'Select the author to explore Wikipedia',
      'Use Tweet to share the quote',
      'Select the quote to open its printable page',
      'Clear display hides the list without deleting saved history',
    ],
  },
  {
    Component: RequestFlow,
    copy: [
      'One request, a saved quote',
      'Browser → GET /generate → Express → DummyJSON',
      'Quote text, author, ID, and print link are saved in a local JSON file',
      'Duplicate IDs are not saved again',
      'GET /responses returns saved quotes newest first',
      'GET /print/:id renders a printable quote',
      'Quote storage remains file-based; the PostgreSQL workspace scaffold is not the quote store',
    ],
  },
  {
    Component: RunSetup,
    copy: [
      'Run the frontend and API together',
      'Install dependencies: pnpm install --frozen-lockfile',
      'Frontend: pnpm --filter @workspace/quote-generator run dev',
      'API: pnpm --filter @workspace/api-server run dev',
      'The frontend can be static, but quote generation and saving require a running Express API',
      'Migration checkpoint: the frontend placeholder, route wiring, and recent provider/timestamp features still need restoration',
      'This deck does not publish the app or change deployment settings',
    ],
  },
];

for (const { Component, copy } of slides) {
  const html = renderToStaticMarkup(<Component />);
  const plain = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  for (const line of copy) assert.ok(plain.includes(line), `Missing approved copy: ${line}`);
  for (const className of ['w-screen', 'h-screen', 'overflow-hidden', 'relative']) {
    assert.ok(html.includes(className), `Missing root class: ${className}`);
  }
  console.log(`Rendered and checked: ${copy[0]}`);
}
