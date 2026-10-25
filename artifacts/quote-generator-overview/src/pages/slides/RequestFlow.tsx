import React from 'react';

export default function RequestFlow() {
  return (
    <div className="deck-frame w-screen h-screen overflow-hidden relative bg-bg text-text px-[6vw] pt-[8vh]">
      <h2 className="font-display text-[4.5vw] font-bold leading-[1.1]">
        One request, a saved quote
      </h2>
      <p className="mt-[6vh]! text-[2.8vw] font-bold text-text">
        Browser → GET /generate → Express → DummyJSON
      </p>
      <div className="mt-[6vh] grid grid-cols-[1.05fr_1fr] gap-[6vw] text-[2vw] leading-[1.4]">
        <div>
          <p>Quote text, author, ID, and print link are saved in a local JSON file</p>
          <p className="mt-[4vh]! font-bold">Duplicate IDs are not saved again</p>
        </div>
        <div>
          <p>GET /responses returns saved quotes newest first</p>
          <p className="mt-[4vh]!">GET /print/:id renders a printable quote</p>
        </div>
      </div>
      <div className="absolute left-0 bottom-0 w-screen bg-accent px-[6vw] pt-[4vh] pb-[6vh]">
        <p className="max-w-[86vw] text-[2vw] leading-[1.35]">
          Quote storage remains file-based; the PostgreSQL workspace scaffold is not the quote store
        </p>
      </div>
    </div>
  );
}
