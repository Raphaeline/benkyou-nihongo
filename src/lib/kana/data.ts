// Data tabel kana (PRD fase 2 §8.1). Katakana diturunkan dari hiragana,
// romaji dihasilkan oleh generator yang sama dengan materi (ALA-LC).

import { romanizeWord } from "@/lib/content/kana";
import type { Ja } from "@/lib/content/schema";

export type Script = "hiragana" | "katakana";
export type KanaCell = { hiragana: string; katakana: string; romaji: string } | null;
export type KanaRow = { label: string; cells: KanaCell[] };

const toKatakana = (s: string) => s.replace(/[ぁ-ゖ]/gu, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60));

const cell = (h: string | null): KanaCell => (h ? { hiragana: h, katakana: toKatakana(h), romaji: romanizeWord(h) } : null);
const row = (label: string, chars: (string | null)[]): KanaRow => ({ label, cells: chars.map(cell) });

export const VOWELS = ["a", "i", "u", "e", "o"];

/** Gojūon: baris あ–わ ditambah ん. Sel null = tidak ada huruf di posisi itu. */
export const GOJUON: KanaRow[] = [
  row("a", ["あ", "い", "う", "え", "お"]),
  row("ka", ["か", "き", "く", "け", "こ"]),
  row("sa", ["さ", "し", "す", "せ", "そ"]),
  row("ta", ["た", "ち", "つ", "て", "と"]),
  row("na", ["な", "に", "ぬ", "ね", "の"]),
  row("ha", ["は", "ひ", "ふ", "へ", "ほ"]),
  row("ma", ["ま", "み", "む", "め", "も"]),
  row("ya", ["や", null, "ゆ", null, "よ"]),
  row("ra", ["ら", "り", "る", "れ", "ろ"]),
  row("wa", ["わ", null, null, null, "を"]),
  row("n", ["ん", null, null, null, null]),
];

/** Dakuten (゛) dan handakuten (゜). */
export const DAKUON: KanaRow[] = [
  row("ga", ["が", "ぎ", "ぐ", "げ", "ご"]),
  row("za", ["ざ", "じ", "ず", "ぜ", "ぞ"]),
  row("da", ["だ", "ぢ", "づ", "で", "ど"]),
  row("ba", ["ば", "び", "ぶ", "べ", "ぼ"]),
  row("pa", ["ぱ", "ぴ", "ぷ", "ぺ", "ぽ"]),
];

export const YOON_COLUMNS = ["ya", "yu", "yo"];

/** Yōon: huruf baris -i + ゃ/ゅ/ょ kecil. */
export const YOON: KanaRow[] = ["き", "し", "ち", "に", "ひ", "み", "り", "ぎ", "じ", "び", "ぴ"].map((base) =>
  row(romanizeWord(base + "ゃ").slice(0, -1), [base + "ゃ", base + "ゅ", base + "ょ"]),
);

export type ExtendedKatakana = { kana: string; romaji: string; example: Ja; meaningInd: string };

const ext = (kana: string, example: string, meaningInd: string): ExtendedKatakana => ({
  kana,
  romaji: romanizeWord(kana),
  example: [{ t: example }],
  meaningInd,
});

/** Kombinasi katakana untuk kata serapan, masing-masing dengan satu contoh kata. */
export const EXTENDED_KATAKANA: ExtendedKatakana[] = [
  ext("ファ", "ファン", "penggemar"),
  ext("フィ", "フィルム", "film (rol film)"),
  ext("フェ", "カフェ", "kafe"),
  ext("フォ", "フォーク", "garpu"),
  ext("ティ", "パーティー", "pesta"),
  ext("ディ", "ディナー", "makan malam"),
  ext("トゥ", "タトゥー", "tato"),
  ext("ウィ", "ウィスキー", "wiski"),
  ext("ウェ", "ウェブ", "web"),
  ext("ウォ", "ウォッカ", "vodka"),
  ext("シェ", "シェフ", "koki kepala"),
  ext("チェ", "チェック", "pemeriksaan, cek"),
  ext("ジェ", "ジェット", "jet"),
  ext("ヴァ", "ヴァイオリン", "biola"),
  ext("ヴィ", "ヴィーナス", "Venus"),
  ext("ヴ", "ラヴ", "cinta (love)"),
  ext("ヴェ", "ヴェール", "kerudung, cadar"),
  ext("ヴォ", "ヴォーカル", "vokal (penyanyi)"),
];

export type SpecialMark = { mark: string; nameInd: string; explanationInd: string; examples: { word: string; meaningInd: string }[] };

export const SPECIAL_MARKS: SpecialMark[] = [
  {
    mark: "っ / ッ",
    nameInd: "Tsu kecil (sokuon)",
    explanationInd: "Menggandakan konsonan berikutnya; diucapkan sebagai jeda singkat.",
    examples: [
      { word: "がっこう", meaningInd: "sekolah" },
      { word: "チェック", meaningInd: "cek" },
    ],
  },
  {
    mark: "ー",
    nameInd: "Tanda vokal panjang",
    explanationInd: "Memanjangkan vokal sebelumnya. Umumnya dipakai di katakana; di romaji ditulis dengan makron.",
    examples: [
      { word: "コーヒー", meaningInd: "kopi" },
      { word: "ケーキ", meaningInd: "kue" },
    ],
  },
  {
    mark: "ん / ン",
    nameInd: "N",
    explanationInd: "Satu-satunya huruf konsonan tunggal. Sebelum vokal atau y, romaji ditulis n' agar tidak terbaca sebagai na/ni/nu.",
    examples: [
      { word: "きんようび", meaningInd: "hari Jumat" },
      { word: "パン", meaningInd: "roti" },
    ],
  },
];
