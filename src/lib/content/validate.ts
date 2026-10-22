// Aturan validasi materi (PRD §9.1). Error memblokir merge; warning harus diakui.

import { AlignError } from "./align.ts";
import { AUX_VERBS, conjugate, ConjugationError, type VerbClass } from "./conjugate.ts";
import { rubyOf, textOf, tokenReading } from "./derive.ts";
import { hasKanji, isHiraganaReading } from "./kana.ts";
import type { Ja, Lesson } from "./schema.ts";

export type Issue = { level: "error" | "warning"; code: string; path: string; message: string };

// Kata yang punya lebih dari satu bacaan umum: bacaannya wajib dikonfirmasi reviewer.
const MULTI_READING = ["今日", "明日", "昨日", "一日", "何", "人", "一人", "二人", "上手", "下手", "大人", "今年"];

function collectJa(lesson: Lesson): { path: string; ja: Ja }[] {
  const out: { path: string; ja: Ja }[] = [];
  const walk = (v: unknown, path: string) => {
    if (Array.isArray(v)) {
      if (v.length && typeof v[0] === "object" && v[0] && "t" in v[0]) out.push({ path, ja: v as Ja });
      else v.forEach((x, i) => walk(x, `${path}[${i}]`));
    } else if (v && typeof v === "object") {
      for (const [k, x] of Object.entries(v)) walk(x, path ? `${path}.${k}` : k);
    }
  };
  walk(lesson, "");
  return out;
}

export function validateLesson(lesson: Lesson): Issue[] {
  const issues: Issue[] = [];
  const err = (code: string, path: string, message: string) => issues.push({ level: "error", code, path, message });
  const warn = (code: string, path: string, message: string) => issues.push({ level: "warning", code, path, message });

  const verbTable = new Map(lesson.verbs.map((v) => [v.lexeme.headword, v]));

  // --- token ---
  for (const { path, ja } of collectJa(lesson)) {
    ja.forEach((tok, i) => {
      const p = `${path}[${i}]`;
      if (hasKanji(tok.t) && !tok.r) err("furigana-missing", p, `"${tok.t}" berkanji tanpa bacaan`);
      if (tok.r && !isHiraganaReading(tok.r)) err("reading-not-kana", p, `bacaan "${tok.r}" bukan hiragana`);
      if (tok.r && !hasKanji(tok.t)) err("reading-on-kana", p, `"${tok.t}" tidak berkanji tetapi diberi bacaan`);
      if ((tok.t === "は" || tok.t === "へ") && !tok.prt) err("particle-unmarked", p, `"${tok.t}" berdiri sendiri tanpa prt`);
      if (tok.r && hasKanji(tok.t)) {
        try {
          rubyOf([tok]);
        } catch (e) {
          if (e instanceof AlignError) err("furigana-align", p, e.message);
          else throw e;
        }
      }
      if (MULTI_READING.some((w) => tok.t.includes(w)))
        warn("multi-reading", p, `"${tok.t}" (${tok.r ?? "-"}) punya lebih dari satu bacaan; konfirmasi konteksnya`);

      if (tok.lemma || tok.form) {
        if (!tok.lemma || !tok.lemmaR || !tok.form) {
          err("verb-incomplete", p, `"${tok.t}": token kata kerja butuh lemma, lemmaR, dan form`);
          return;
        }
        const entry = verbTable.get(tok.lemma);
        const aux = AUX_VERBS[tok.lemma];
        const cls: VerbClass | undefined = entry?.cls ?? aux?.cls;
        if (!cls) {
          err("verb-unknown", p, `"${tok.lemma}" tidak ada di tabel kata kerja maupun daftar kata kerja bantu`);
          return;
        }
        if (entry && entry.lexeme.reading !== tok.lemmaR)
          err("verb-reading", p, `lemmaR "${tok.lemmaR}" ≠ bacaan di tabel "${entry.lexeme.reading}"`);
        try {
          const c = conjugate(tok.lemma, tok.lemmaR, cls, tok.form);
          if (c.surface !== tok.t || c.reading !== tokenReading(tok))
            err("conjugation", p, `"${tok.t}/${tokenReading(tok)}" ≠ hasil conjugator "${c.surface}/${c.reading}" (${tok.form})`);
        } catch (e) {
          if (e instanceof ConjugationError) err("conjugation", p, e.message);
          else throw e;
        }
      }
    });
  }

  // --- dialog ---
  const speakers = new Set(lesson.characters.map((c) => c.id));
  const sentenceText = new Map<string, string>();
  const mainTexts: string[] = [];
  const mainLemmas = new Set<string>();
  for (const kind of ["main", "variation"] as const) {
    lesson.dialogue[kind].forEach((turn, ti) => {
      const tp = `dialogue.${kind}[${ti}]`;
      if (!speakers.has(turn.speaker)) err("speaker-unknown", tp, `tokoh "${turn.speaker}" tidak ada di daftar tokoh`);
      turn.sentences.forEach((s, si) => {
        const expected = `${lesson.id}.${kind}.${String(ti + 1).padStart(2, "0")}.${si + 1}`;
        if (s.id !== expected) err("sentence-id", `${tp}.sentences[${si}]`, `ID "${s.id}" seharusnya "${expected}"`);
        if (sentenceText.has(s.id)) err("sentence-id-duplicate", `${tp}.sentences[${si}]`, `ID ganda "${s.id}"`);
        const text = textOf(s.ja);
        sentenceText.set(s.id, text);
        if (kind === "main") {
          mainTexts.push(text);
          for (const tok of s.ja) if (tok.lemma && !tok.aux) mainLemmas.add(tok.lemma);
        }
      });
    });
  }
  const turns = lesson.dialogue.main.length;
  if (turns < 10) err("turn-count", "dialogue.main", `${turns} giliran; minimal 10`);
  if (turns > 20) warn("turn-count", "dialogue.main", `${turns} giliran; lebih dari 20, cek panjang materi`);
  const inMain = (s: string) => mainTexts.some((t) => t.includes(s));

  // --- tabel kata kerja: dua arah ---
  const seen = new Set<string>();
  lesson.verbs.forEach((v, i) => {
    if (seen.has(v.lexeme.headword)) err("verb-duplicate", `verbs[${i}]`, `"${v.lexeme.headword}" muncul dua kali`);
    seen.add(v.lexeme.headword);
    if (!mainLemmas.has(v.lexeme.headword)) err("verb-not-in-dialogue", `verbs[${i}]`, `"${v.lexeme.headword}" tidak dipakai di dialog utama`);
  });
  for (const l of mainLemmas)
    if (!verbTable.has(l)) err("verb-missing-from-table", "verbs", `"${l}" dipakai di dialog utama tetapi tidak ada di tabel`);

  // --- kosakata, tata bahasa, ungkapan ---
  lesson.vocabulary.forEach((v, i) => {
    if (!inMain(v.lexeme.headword) && !mainLemmas.has(v.lexeme.headword))
      err("vocab-not-in-dialogue", `vocabulary[${i}]`, `"${v.lexeme.headword}" tidak ada di dialog utama`);
  });
  if (lesson.grammar.length < 3 || lesson.grammar.length > 5) err("grammar-count", "grammar", `${lesson.grammar.length} pola; harus 3–5`);
  lesson.grammar.forEach((g, i) =>
    g.examples.forEach((ex, j) => {
      const t = sentenceText.get(ex.sentenceId);
      const p = `grammar[${i}].examples[${j}]`;
      if (!t || !ex.sentenceId.includes(".main.")) err("grammar-example-ref", p, `kalimat "${ex.sentenceId}" tidak ada di dialog utama`);
      else if (!t.includes(ex.span)) err("grammar-example-span", p, `"${ex.span}" tidak ada di ${ex.sentenceId} ("${t}")`);
    }),
  );
  if (lesson.expressions.length < 3 || lesson.expressions.length > 5)
    err("expression-count", "expressions", `${lesson.expressions.length} ungkapan; harus 3–5`);
  lesson.expressions.forEach((e, i) => {
    if (!inMain(textOf(e.ja))) err("expression-not-in-dialogue", `expressions[${i}]`, `"${textOf(e.ja)}" tidak ada di dialog utama`);
    if (!e.comparison.casual.length && !e.comparison.noteInd)
      err("expression-comparison", `expressions[${i}]`, "tidak ada padanan kasual dan tidak ada alasannya");
  });

  // --- soal ---
  if (lesson.quiz.id !== `${lesson.id}.quiz`) err("quiz-id", "quiz.id", `seharusnya "${lesson.id}.quiz"`);
  const qs = lesson.quiz.questions;
  if (qs.length !== 5) err("question-count", "quiz.questions", `${qs.length} soal; harus 5`);
  for (const type of ["comprehension", "vocabulary", "completion", "conjugation"])
    if (!qs.some((q) => q.type === type)) err("question-type-missing", "quiz.questions", `tidak ada soal tipe ${type}`);
  qs.forEach((q, i) => {
    const p = `quiz.questions[${i}]`;
    if (q.id !== `${lesson.quiz.id}.q${i + 1}`) err("question-id", p, `ID "${q.id}" seharusnya "${lesson.quiz.id}.q${i + 1}"`);
    if (q.type === "conjugation") {
      try {
        conjugate(q.verb.lemma, q.verb.lemmaR, q.verb.cls, q.verb.form);
      } catch (e) {
        err("conjugation", p, (e as Error).message);
      }
      return;
    }
    if (q.answer.index >= q.options.length) err("answer-out-of-range", p, "indeks jawaban di luar pilihan");
    const keys = q.options.map((o) => (o.ja ? textOf(o.ja) : o.textInd));
    if (new Set(keys).size !== keys.length) err("option-duplicate", p, "ada pilihan ganda yang sama");
  });

  return issues;
}
