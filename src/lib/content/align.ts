// Penyelarasan furigana: memecah token (tulisan + bacaan kata utuh) menjadi segmen ruby.
// Kana di tulisan (okurigana) dicocokkan harfiah; setiap deret kanji mendapat bacaannya.
// Contoh: 行きます/いきます → [行|い][きます]; 今日/きょう → [今日|きょう].

import { isKanjiChar, toHiragana } from "./kana.ts";

export type RubySegment = { b: string; r?: string };

export class AlignError extends Error {}

export function align(text: string, reading: string): RubySegment[] {
  const runs: { s: string; kanji: boolean }[] = [];
  for (const c of text) {
    const k = isKanjiChar(c);
    const last = runs[runs.length - 1];
    if (last && last.kanji === k) last.s += c;
    else runs.push({ s: c, kanji: k });
  }
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = (lazy: boolean) =>
    new RegExp("^" + runs.map((r) => (r.kanji ? (lazy ? "(.+?)" : "(.+)") : escape(toHiragana(r.s)))).join("") + "$", "u");

  const greedy = pattern(false).exec(reading);
  const lazy = pattern(true).exec(reading);
  if (!greedy || !lazy) throw new AlignError(`furigana tidak cocok: ${text} / ${reading}`);
  if (greedy.slice(1).join("|") !== lazy.slice(1).join("|"))
    throw new AlignError(`furigana ambigu: ${text} / ${reading} (perlu override segmen)`);

  let g = 1;
  return runs.map((r) => (r.kanji ? { b: r.s, r: greedy[g++] } : { b: r.s }));
}
