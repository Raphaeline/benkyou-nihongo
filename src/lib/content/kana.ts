// Utilitas kana dan romanisasi Hepburn yang dimodifikasi (ALA-LC 2022).
// Lihat docs/CONTENT_SPEC.md bagian romaji.

const KANJI = /[㐀-䶿一-鿿豈-﫿々〆ヶ]/u;
const HIRAGANA_READING = /^[ぁ-ゖー]+$/u;
const KANA_OR_MARK = /^[ぁ-ゖゝゞァ-ヺーヽヾ]+$/u;

export const hasKanji = (s: string) => KANJI.test(s);
export const isKanjiChar = (c: string) => KANJI.test(c);
export const isHiraganaReading = (s: string) => HIRAGANA_READING.test(s);
export const isKana = (s: string) => KANA_OR_MARK.test(s);

/** Katakana → hiragana (ー dipertahankan). */
export function toHiragana(s: string): string {
  return s.replace(/[ァ-ヶ]/gu, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
}

const DIGRAPHS: Record<string, string> = {
  きゃ: "kya", きゅ: "kyu", きょ: "kyo", しゃ: "sha", しゅ: "shu", しょ: "sho", しぇ: "she",
  ちゃ: "cha", ちゅ: "chu", ちょ: "cho", ちぇ: "che", にゃ: "nya", にゅ: "nyu", にょ: "nyo",
  ひゃ: "hya", ひゅ: "hyu", ひょ: "hyo", みゃ: "mya", みゅ: "myu", みょ: "myo",
  りゃ: "rya", りゅ: "ryu", りょ: "ryo", ぎゃ: "gya", ぎゅ: "gyu", ぎょ: "gyo",
  じゃ: "ja", じゅ: "ju", じょ: "jo", じぇ: "je", ぢゃ: "ja", ぢゅ: "ju", ぢょ: "jo",
  びゃ: "bya", びゅ: "byu", びょ: "byo", ぴゃ: "pya", ぴゅ: "pyu", ぴょ: "pyo",
  // kombinasi untuk kata serapan
  ふぁ: "fa", ふぃ: "fi", ふぇ: "fe", ふぉ: "fo", てぃ: "ti", でぃ: "di", とぅ: "tu", どぅ: "du",
  うぃ: "wi", うぇ: "we", うぉ: "wo", ゔぁ: "va", ゔぃ: "vi", ゔぇ: "ve", ゔぉ: "vo",
  つぁ: "tsa", つぃ: "tsi", つぇ: "tse", つぉ: "tso", いぇ: "ye",
};

const MONO: Record<string, string> = {
  あ: "a", い: "i", う: "u", え: "e", お: "o", か: "ka", き: "ki", く: "ku", け: "ke", こ: "ko",
  さ: "sa", し: "shi", す: "su", せ: "se", そ: "so", た: "ta", ち: "chi", つ: "tsu", て: "te", と: "to",
  な: "na", に: "ni", ぬ: "nu", ね: "ne", の: "no", は: "ha", ひ: "hi", ふ: "fu", へ: "he", ほ: "ho",
  ま: "ma", み: "mi", む: "mu", め: "me", も: "mo", や: "ya", ゆ: "yu", よ: "yo",
  ら: "ra", り: "ri", る: "ru", れ: "re", ろ: "ro", わ: "wa", ゐ: "i", ゑ: "e", を: "o",
  が: "ga", ぎ: "gi", ぐ: "gu", げ: "ge", ご: "go", ざ: "za", じ: "ji", ず: "zu", ぜ: "ze", ぞ: "zo",
  だ: "da", ぢ: "ji", づ: "zu", で: "de", ど: "do", ば: "ba", び: "bi", ぶ: "bu", べ: "be", ぼ: "bo",
  ぱ: "pa", ぴ: "pi", ぷ: "pu", ぺ: "pe", ぽ: "po", ゔ: "vu",
  ぁ: "a", ぃ: "i", ぅ: "u", ぇ: "e", ぉ: "o", ゃ: "ya", ゅ: "yu", ょ: "yo", ゎ: "wa",
};

const MACRON: Record<string, string> = { a: "ā", i: "ī", u: "ū", e: "ē", o: "ō" };

type Syllable = { roma: string; kana: string };

function syllables(hira: string): Syllable[] {
  const out: Syllable[] = [];
  for (let i = 0; i < hira.length; i++) {
    const two = hira.slice(i, i + 2);
    if (DIGRAPHS[two]) {
      out.push({ roma: DIGRAPHS[two], kana: two });
      i++;
    } else {
      out.push({ roma: MONO[hira[i]] ?? hira[i], kana: hira[i] });
    }
  }
  return out;
}

const lastVowel = (r: string) => (/[aiueo]$/.test(r) ? r.slice(-1) : "");

export type RomanizeOptions = {
  /** Jangan gabungkan う terakhir menjadi vokal panjang (bentuk kamus verba, mis. 思う omou). */
  keepFinalU?: boolean;
};

/**
 * Romanisasi satu kata (kana). Vokal panjang di dalam kata digabung menjadi makron:
 * aa/oo/ou/uu/ee → ā/ō/ō/ū/ē; ii dan ei dipertahankan; ー → makron.
 */
export function romanizeWord(kana: string, opts: RomanizeOptions = {}): string {
  const syl = syllables(toHiragana(kana));
  const parts: string[] = [];
  let pendingSokuon = false;
  for (let i = 0; i < syl.length; i++) {
    const { roma, kana: k } = syl[i];
    if (k === "っ") {
      pendingSokuon = true;
      continue;
    }
    if (k === "ー") {
      const prev = parts.pop() ?? "";
      const v = lastVowel(prev);
      parts.push(v ? prev.slice(0, -1) + MACRON[v] : prev);
      continue;
    }
    if (k === "ん") {
      const next = syl[i + 1]?.roma ?? "";
      parts.push(/^[aiueoy]/.test(next) ? "n'" : "n");
      continue;
    }
    let r = roma;
    if (pendingSokuon) {
      r = r.startsWith("ch") ? "t" + r : r[0] + r;
      pendingSokuon = false;
    }
    // vokal panjang: vokal tunggal setelah suku kata berakhiran vokal yang sesuai
    const prev = parts[parts.length - 1] ?? "";
    const pv = lastVowel(prev);
    const isLast = i === syl.length - 1;
    const merge =
      pv &&
      r.length === 1 &&
      ((pv === "a" && r === "a") ||
        (pv === "o" && (r === "o" || (r === "u" && !(isLast && opts.keepFinalU)))) ||
        (pv === "u" && r === "u" && !(isLast && opts.keepFinalU)) ||
        (pv === "e" && r === "e"));
    if (merge) {
      parts[parts.length - 1] = prev.slice(0, -1) + MACRON[pv];
      continue;
    }
    parts.push(r);
  }
  if (pendingSokuon) parts.push("");
  return parts.join("");
}

export const PUNCT: Record<string, string> = {
  "。": ".", "、": ",", "？": "?", "！": "!", "「": "“", "」": "”", "…": "…", "・": " ", "〜": "~", "（": "(", "）": ")",
};
