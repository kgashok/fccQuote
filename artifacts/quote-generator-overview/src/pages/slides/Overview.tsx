import React from 'react';

export default function Overview() {
  return (
    <div className="deck-frame w-screen h-screen overflow-hidden relative bg-bg text-text">
      <div aria-hidden="true" className="absolute top-0 right-0 h-screen w-[35vw] bg-accent" />
      <div aria-hidden="true" className="absolute top-[8vh] left-[6vw] h-[1vh] w-[10vw] bg-primary" />
      <div className="absolute left-[6vw] top-[24vh] w-[49vw]">
        <h1 className="font-display text-[6.2vw] font-bold leading-[1.02] text-text">
          Random Quote Generator
        </h1>
        <p className="mt-[5vh]! max-w-[44vw] text-[2.2vw] leading-[1.4]">
          A lightweight app for discovering, saving, sharing, and printing quotes
        </p>
      </div>
      <div className="absolute left-[62vw] top-[23vh] w-[32vw] bg-ivory px-[3vw] py-[5vh]">
        <span aria-hidden="true" className="quote-face block text-[10vw] leading-[0.75] text-primary">“</span>
        <p className="quote-face mt-[2vh]! text-[4.2vw] leading-[1.15]">
          Find a quote. Keep it. Share it.
        </p>
      </div>
      <p className="absolute left-[6vw] bottom-[9vh] w-[53vw] text-[2vw] text-muted">
        Original visual identity: beige, wheat, dark orange, and ivory
      </p>
    </div>
  );
}
