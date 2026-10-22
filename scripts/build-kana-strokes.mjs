// Membuat src/lib/kana/strokes.json dari KanjiVG (versi di-pin).
// Data goresan KanjiVG © Ulrich Apel, CC BY-SA 3.0 — https://kanjivg.tagaini.net
// Pemakaian: node scripts/build-kana-strokes.mjs  (hanya perlu dijalankan saat versi KanjiVG diganti)

import { writeFileSync } from "node:fs";

const TAG = "r20260714";
const BASE = `https://raw.githubusercontent.com/KanjiVG/kanjivg/${TAG}/kanji`;

const hiragana = [];
for (let c = 0x3041; c <= 0x3093; c++) hiragana.push(c);
hiragana.push(0x3094); // ゔ
const katakana = hiragana.map((c) => c + 0x60).concat([0x30fc]); // ー

const out = { source: `KanjiVG ${TAG}`, license: "CC BY-SA 3.0", viewBox: "0 0 109 109", chars: {} };
const missing = [];

for (const code of [...hiragana, ...katakana]) {
  const hex = code.toString(16).padStart(5, "0");
  const res = await fetch(`${BASE}/${hex}.svg`);
  if (!res.ok) {
    missing.push(String.fromCharCode(code));
    continue;
  }
  const svg = await res.text();
  const paths = [...svg.matchAll(/<path[^>]*\bid="kvg:[0-9a-f]+-s(\d+)"[^>]*\bd="([^"]+)"/g)]
    .map((m) => ({ n: Number(m[1]), d: m[2] }))
    .sort((a, b) => a.n - b.n)
    .map((p) => p.d);
  const numbers = [...svg.matchAll(/<text transform="matrix\(1 0 0 1 ([\d.]+) ([\d.]+)\)">(\d+)<\/text>/g)]
    .sort((a, b) => Number(a[3]) - Number(b[3]))
    .map((m) => [Number(m[1]), Number(m[2])]);
  if (!paths.length) {
    missing.push(String.fromCharCode(code));
    continue;
  }
  out.chars[String.fromCharCode(code)] = { paths, numbers };
}

writeFileSync("src/lib/kana/strokes.json", JSON.stringify(out) + "\n");
console.log(`${Object.keys(out.chars).length} karakter ditulis; tidak ditemukan: ${missing.join(" ") || "-"}`);
