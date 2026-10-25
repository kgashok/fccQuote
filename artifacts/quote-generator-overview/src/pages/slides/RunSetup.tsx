import React from 'react';

export default function RunSetup() {
  return (
    <div className="deck-frame w-screen h-screen overflow-hidden relative bg-bg text-text px-[6vw] pt-[7vh]">
      <h2 className="font-display text-[3.8vw] font-bold leading-[1.1]">
        Run the frontend and API together
      </h2>
      <div className="mt-[5vh] space-y-[2vh] text-[2vw] leading-[1.35]">
        <p><strong>Install dependencies:</strong> <code className="font-mono">pnpm install --frozen-lockfile</code></p>
        <p><strong>Frontend:</strong> <code className="font-mono">pnpm --filter @workspace/quote-generator run dev</code></p>
        <p><strong>API:</strong> <code className="font-mono">pnpm --filter @workspace/api-server run dev</code></p>
      </div>
      <p className="mt-[5vh]! text-[2vw] leading-[1.35]">
        The frontend can be static, but quote generation and saving require a running Express API
      </p>
      <p className="mt-[4vh]! text-[2vw] leading-[1.35] font-bold">
        Migration checkpoint: the frontend placeholder, route wiring, and recent provider/timestamp features still need restoration
      </p>
      <p className="mt-[4vh]! text-[2vw] leading-[1.35] text-muted">
        This deck does not publish the app or change deployment settings
      </p>
      <div aria-hidden="true" className="absolute bottom-[5vh] left-[6vw] w-[88vw] h-[0.7vh] bg-primary" />
    </div>
  );
}
