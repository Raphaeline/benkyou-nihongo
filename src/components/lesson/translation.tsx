"use client";

import { useState } from "react";

// Terjemahan per kalimat. Saat toggle Terjemahan mati, teks disembunyikan
// tetapi bisa dibuka per kalimat (PRD §8.3).
export function Translation({ children }: { children: string }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <span className="translation block" data-revealed={revealed ? "" : undefined}>
      <span className="translation-text">{children}</span>
      <button
        type="button"
        onClick={() => setRevealed(true)}
        className="translation-reveal font-ui text-base text-ink-2 underline underline-offset-4"
      >
        Lihat terjemahan
      </button>
    </span>
  );
}
