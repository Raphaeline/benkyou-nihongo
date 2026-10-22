// Turunan deterministik dari array token: segmen ruby, teks polos, dan romaji.
// Romaji tidak pernah ditulis manual (PRD §9.1); aturan spasi di docs/CONTENT_SPEC.md.

import { align, type RubySegment } from "./align.ts";
import { hasKanji, PUNCT, romanizeWord, toHiragana } from "./kana.ts";
import type { Ja, Token } from "./schema.ts";

const PARTICLE_ROMAJI: Record<string, string> = { は: "wa", へ: "e", を: "o" };

export const isPunct = (t: string) => [...t].every((c) => c in PUNCT);

export function tokenReading(tok: Token): string {
  return tok.r ?? toHiragana(tok.t);
}

export function rubyOf(ja: Ja): RubySegment[] {
  const out: RubySegment[] = [];
  for (const tok of ja) {
    const segs = tok.r && hasKanji(tok.t) ? align(tok.t, tok.r) : [{ b: tok.t }];
    for (const s of segs) {
      const last = out[out.length - 1];
      if (!s.r && last && !last.r) last.b += s.b;
      else out.push({ ...s });
    }
  }
  return out;
}

export const textOf = (ja: Ja) => ja.map((t) => t.t).join("");

function tokenRomaji(tok: Token): string {
  if (tok.romaji) return tok.romaji;
  if (tok.prt && tok.t in PARTICLE_ROMAJI) return PARTICLE_ROMAJI[tok.t];
  const reading = tokenReading(tok);
  // 〜する majemuk ditulis terpisah: 勉強して → benkyō shite
  if (tok.lemma && tok.lemmaR && tok.lemma.endsWith("する") && tok.lemma.length > 2 && hasKanji(tok.lemma)) {
    const prefix = tok.lemmaR.slice(0, -2);
    if (reading.startsWith(prefix) && reading.length > prefix.length) {
      return romanizeWord(prefix) + " " + romanizeWord(reading.slice(prefix.length));
    }
  }
  const keepFinalU = tok.form === "dict" && /う$/.test(tok.lemma ?? "");
  const r = romanizeWord(reading, { keepFinalU });
  return tok.proper ? r.charAt(0).toUpperCase() + r.slice(1) : r;
}

export function romajiOf(ja: Ja): string {
  let out = "";
  let atStart = true;
  for (const tok of ja) {
    if (isPunct(tok.t)) {
      const p = [...tok.t].map((c) => PUNCT[c]).join("");
      const opening = p === "“" || p === "(";
      out = (opening ? out : out.trimEnd()) + p + (opening ? "" : " ");
      if (/[.?!]$/.test(p)) atStart = true;
      continue;
    }
    let w = tokenRomaji(tok);
    if (atStart) {
      w = w.charAt(0).toUpperCase() + w.slice(1);
      atStart = false;
    }
    if (tok.suffix) out = out.trimEnd() + "-" + w + " ";
    else out += w + " ";
  }
  return out.trim().replace(/\s+/g, " ").replace(/“\s/g, "“");
}

export function derive(ja: Ja) {
  return { ruby: rubyOf(ja), text: textOf(ja), romaji: romajiOf(ja) };
}
