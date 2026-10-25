import React from 'react';

export default function VisitorFlow() {
  return (
    <div className="deck-frame w-screen h-screen overflow-hidden relative bg-bg text-text px-[6vw] pt-[8vh]">
      <h2 className="font-display text-[4.5vw] font-bold leading-[1.1]">
        From discovery to sharing
      </h2>
      <p className="mt-[2vh]! text-[2vw] text-muted">Original visitor experience</p>
      <div className="mt-[7vh]">
        <div className="grid grid-cols-[4vw_1fr] gap-[2vw] border-b border-muted/20 py-[2.5vh]">
          <span aria-hidden="true" className="text-[2.3vw] text-primary">→</span>
          <p className="text-[2.3vw] leading-[1.3]"><strong>Get Quote!</strong> requests a quote and adds it to the saved list</p>
        </div>
        <div className="grid grid-cols-[4vw_1fr] gap-[2vw] border-b border-muted/20 py-[2.5vh]">
          <span aria-hidden="true" className="text-[2.3vw] text-primary">→</span>
          <p className="text-[2.3vw] leading-[1.3]">Select the author to explore <strong>Wikipedia</strong></p>
        </div>
        <div className="grid grid-cols-[4vw_1fr] gap-[2vw] border-b border-muted/20 py-[2.5vh]">
          <span aria-hidden="true" className="text-[2.3vw] text-primary">→</span>
          <p className="text-[2.3vw] leading-[1.3]">Use <strong>Tweet</strong> to share the quote</p>
        </div>
        <div className="grid grid-cols-[4vw_1fr] gap-[2vw] border-b border-muted/20 py-[2.5vh]">
          <span aria-hidden="true" className="text-[2.3vw] text-primary">→</span>
          <p className="text-[2.3vw] leading-[1.3]">Select the quote to open its <strong>printable page</strong></p>
        </div>
        <div className="grid grid-cols-[4vw_1fr] gap-[2vw] py-[2.5vh]">
          <span aria-hidden="true" className="text-[2.3vw] text-primary">→</span>
          <p className="text-[2.3vw] leading-[1.3]"><strong>Clear display</strong> hides the list without deleting saved history</p>
        </div>
      </div>
    </div>
  );
}
