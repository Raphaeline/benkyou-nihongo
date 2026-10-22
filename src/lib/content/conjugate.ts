// Conjugator deterministik berdasarkan kelas kata kerja JMdict (PRD §9.3).
// Mengembalikan pasangan {surface, reading} sehingga furigana setiap bentuk benar.

export const FORMS = [
  "dict", "masu", "masen", "mashita", "masendeshita", "mashou",
  "te", "ta", "nai", "nakatta", "stem", "request",
] as const;
export type Form = (typeof FORMS)[number];

export const VERB_CLASSES = [
  "v1", "v5u", "v5k", "v5k-s", "v5g", "v5s", "v5t", "v5n", "v5b", "v5m", "v5r", "v5r-i", "v5aru", "vk", "vs-i",
] as const;
export type VerbClass = (typeof VERB_CLASSES)[number];

export const verbGroup = (c: VerbClass): 1 | 2 | 3 =>
  c === "v1" ? 2 : c === "vk" || c === "vs-i" ? 3 : 1;

export type Conjugated = { surface: string; reading: string };

// Baris -i dan -a untuk akhiran godan.
const I_ROW: Record<string, string> = { う: "い", く: "き", ぐ: "ぎ", す: "し", つ: "ち", ぬ: "に", ぶ: "び", む: "み", る: "り" };
const A_ROW: Record<string, string> = { う: "わ", く: "か", ぐ: "が", す: "さ", つ: "た", ぬ: "な", ぶ: "ば", む: "ま", る: "ら" };
const TE: Record<string, [string, string]> = {
  う: ["って", "った"], つ: ["って", "った"], る: ["って", "った"],
  む: ["んで", "んだ"], ぶ: ["んで", "んだ"], ぬ: ["んで", "んだ"],
  く: ["いて", "いた"], ぐ: ["いで", "いだ"], す: ["して", "した"],
};

const MASU_SUFFIX: Partial<Record<Form, string>> = {
  masu: "ます", masen: "ません", mashita: "ました", masendeshita: "ませんでした", mashou: "ましょう", stem: "",
};

export class ConjugationError extends Error {}

/**
 * Konjugasi `lemma` (tulisan, mis. 来る / 勉強する) dengan bacaan `lemmaR` (くる / べんきょうする).
 * Kanji di depan dipertahankan; hanya bagian kana di akhir yang berubah.
 */
export function conjugate(lemma: string, lemmaR: string, cls: VerbClass, form: Form): Conjugated {
  if (form === "dict") return { surface: lemma, reading: lemmaR };

  // する dan 〜する: prefix + bentuk する
  if (cls === "vs-i") {
    if (!lemma.endsWith("する") || !lemmaR.endsWith("する")) throw new ConjugationError(`${lemma}: kelas vs-i harus berakhiran する`);
    const s = suru(form);
    return { surface: lemma.slice(0, -2) + s, reading: lemmaR.slice(0, -2) + s };
  }

  // 来る: kanji 来 tetap, bacaannya berubah く/き/こ
  if (cls === "vk") {
    const k = kuru(form);
    if (lemma === "来る") return { surface: "来" + k.slice(1), reading: k };
    if (lemma === "くる") return { surface: k, reading: k };
    throw new ConjugationError(`${lemma}: kelas vk hanya untuk 来る/くる`);
  }

  const end = lemma.slice(-1);
  if (end !== lemmaR.slice(-1)) throw new ConjugationError(`${lemma}/${lemmaR}: akhiran kana tidak sama`);
  const sBase = lemma.slice(0, -1);
  const rBase = lemmaR.slice(0, -1);
  const both = (suffix: string): Conjugated => ({ surface: sBase + suffix, reading: rBase + suffix });

  if (cls === "v1") {
    if (end !== "る") throw new ConjugationError(`${lemma}: ichidan harus berakhiran る`);
    if (form in MASU_SUFFIX) return both(MASU_SUFFIX[form]!);
    if (form === "te") return both("て");
    if (form === "ta") return both("た");
    if (form === "nai") return both("ない");
    if (form === "nakatta") return both("なかった");
    throw new ConjugationError(`${lemma}: bentuk ${form} tidak didukung untuk v1`);
  }

  // godan
  if (!(end in I_ROW)) throw new ConjugationError(`${lemma}: akhiran godan tidak dikenal`);
  const iStem = cls === "v5aru" ? "い" : I_ROW[end];
  if (form in MASU_SUFFIX) return both(iStem + MASU_SUFFIX[form]!);
  if (form === "request") {
    if (cls !== "v5aru") throw new ConjugationError(`${lemma}: bentuk request hanya untuk v5aru (mis. くださる→ください)`);
    return both("い");
  }
  if (form === "te" || form === "ta") {
    const pair = cls === "v5k-s" ? TE["つ"] : TE[end];
    return both(form === "te" ? pair[0] : pair[1]);
  }
  if (form === "nai" || form === "nakatta") {
    const neg = form === "nai" ? "ない" : "なかった";
    if (cls === "v5r-i") return { surface: neg, reading: neg }; // ある → ない
    return both(A_ROW[end] + neg);
  }
  throw new ConjugationError(`${lemma}: bentuk ${form} tidak didukung`);
}

function suru(form: Form): string {
  switch (form) {
    case "te": return "して";
    case "ta": return "した";
    case "nai": return "しない";
    case "nakatta": return "しなかった";
    case "request": throw new ConjugationError("する: bentuk request tidak didukung");
    default: return "し" + (MASU_SUFFIX[form] ?? "");
  }
}

function kuru(form: Form): string {
  switch (form) {
    case "te": return "きて";
    case "ta": return "きた";
    case "nai": return "こない";
    case "nakatta": return "こなかった";
    case "request": throw new ConjugationError("来る: bentuk request tidak didukung");
    default: return "き" + (MASU_SUFFIX[form] ?? "");
  }
}

/** Kata kerja bantu yang tidak masuk tabel kata kerja materi (PRD §9.2). */
export const AUX_VERBS: Record<string, { lemmaR: string; cls: VerbClass }> = {
  いる: { lemmaR: "いる", cls: "v1" },
  くださる: { lemmaR: "くださる", cls: "v5aru" },
  ござる: { lemmaR: "ござる", cls: "v5aru" },
  する: { lemmaR: "する", cls: "vs-i" },
  いたす: { lemmaR: "いたす", cls: "v5s" },
};
