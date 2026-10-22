// npm run seed:content — kirim semua materi valid ke Supabase lewat RPC seed_lesson.
// Butuh NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SECRET_KEY (.env.local atau GitHub Environments).
// PUBLISH=all (bawaan, untuk staging) mempublikasikan semua materi;
// PUBLISH=reviewed (produksi) hanya materi berstatus reviewed.

import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { conjugate, verbGroup, type Form } from "../src/lib/content/conjugate.ts";
import { derive, romajiOf, rubyOf } from "../src/lib/content/derive.ts";
import { romanizeWord } from "../src/lib/content/kana.ts";
import { Lesson, type Ja } from "../src/lib/content/schema.ts";
import { validateLesson } from "../src/lib/content/validate.ts";

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SECRET_KEY;
const PUBLISH = process.env.PUBLISH ?? "all";
const DRY = process.argv.includes("--dry-run");
if (!DRY && (!URL_ || !KEY)) {
  console.error("NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SECRET_KEY wajib diisi (lihat .env.example).");
  process.exit(1);
}

const TABLE_FORMS: Form[] = ["dict", "masu", "te", "mashita", "masen"];
const ex = (e: { ja: Ja; translationInd: string }) => ({ ...derive(e.ja), tokens: e.ja, translation_ind: e.translationInd });

export function buildPayload(lesson: Lesson, publish: boolean) {
  const content_hash = createHash("sha256").update(JSON.stringify(lesson)).digest("hex");
  const sentences: Record<string, unknown>[] = [];
  const turns: Record<string, unknown>[] = [];
  for (const dialogue of ["main", "variation"] as const) {
    lesson.dialogue[dialogue].forEach((turn, ti) => {
      turns.push({ lesson_id: lesson.id, dialogue, seq: ti + 1, speaker_id: turn.speaker });
      turn.sentences.forEach((s, si) => {
        const d = derive(s.ja);
        sentences.push({
          id: s.id, lesson_id: lesson.id, dialogue, turn_seq: ti + 1, seq: si + 1, tokens: s.ja,
          ruby: d.ruby, text_ja: d.text, romaji: d.romaji, translation_ind: s.translationInd,
          note_ind: s.noteInd ?? null, register: s.register ?? null,
        });
      });
    });
  }
  const mainSentences = sentences.filter((s) => s.dialogue === "main");
  const firstSentence = (word: string) =>
    (mainSentences.find((s) => (s.text_ja as string).includes(word) || (s.tokens as Ja).some((t) => t.lemma === word))?.id as string) ?? null;

  const lexemeById = new Map([...lesson.vocabulary, ...lesson.verbs].map((v) => [v.lexeme.id, v.lexeme]));
  const lexemes = [...lexemeById.values()].map((x) => ({
    id: x.id, headword: x.headword, reading: x.reading, romaji: romanizeWord(x.reading), jmdict_seq: null,
  }));

  const verbs = lesson.verbs.map((v) => {
    const forms: Record<string, unknown> = {};
    for (const f of TABLE_FORMS) {
      const c = conjugate(v.lexeme.headword, v.lexeme.reading, v.cls, f);
      const tok = [{ t: c.surface, r: c.surface === c.reading ? undefined : c.reading, lemma: v.lexeme.headword, lemmaR: v.lexeme.reading, form: f }];
      forms[f] = { surface: c.surface, reading: c.reading, ruby: rubyOf(tok), romaji: romajiOf(tok).toLowerCase() };
    }
    return { lexeme_id: v.lexeme.id, jmdict_class: v.cls, verb_group: verbGroup(v.cls), forms };
  });

  const lesson_verbs = lesson.verbs.map((v, i) => {
    const uses = new Map<string, { form: string; surface: string; sentence_ids: string[] }>();
    for (const s of mainSentences)
      for (const t of s.tokens as Ja)
        if (t.lemma === v.lexeme.headword) {
          const key = t.form + t.t;
          const u = uses.get(key) ?? { form: t.form!, surface: t.t, sentence_ids: [] };
          u.sentence_ids.push(s.id as string);
          uses.set(key, u);
        }
    return {
      lesson_id: lesson.id, lexeme_id: v.lexeme.id, seq: i + 1, role: v.role, meaning_ind: v.meaningInd,
      group_note_ind: v.groupNoteInd ?? null, dialogue_forms: [...uses.values()],
    };
  });

  return {
    lesson: {
      id: lesson.id, seq: lesson.seq, slug: lesson.slug, level: lesson.level,
      title_ja: { tokens: lesson.meta.titleJa, ...derive(lesson.meta.titleJa) }, title_ind: lesson.meta.titleInd,
      situation_ind: lesson.meta.situationInd, location_ind: lesson.meta.locationInd,
      objectives_ind: lesson.meta.objectivesInd, estimated_minutes: lesson.meta.estimatedMinutes,
      reading_guide: lesson.speaking.readingGuideInd, roleplay_guide_ind: lesson.speaking.roleplayInd.join("\n"),
      review_status: lesson.review.status, published: publish, content_hash, updated_at: new Date().toISOString(),
    },
    characters: lesson.characters.map((c, i) => ({
      lesson_id: lesson.id, id: c.id, seq: i + 1, name: { tokens: c.name, ...derive(c.name) }, name_romaji: romajiOf(c.name),
      relation_ind: c.relationInd, register_default: c.register.default, register_note_ind: c.register.noteInd ?? null,
    })),
    turns,
    sentences,
    lexemes,
    lesson_vocabulary: lesson.vocabulary.map((v, i) => ({
      lesson_id: lesson.id, lexeme_id: v.lexeme.id, seq: i + 1, meaning_ind: v.meaningInd, pos_ind: v.posInd,
      first_sentence_id: firstSentence(v.lexeme.headword), example: ex(v.example),
    })),
    verbs,
    lesson_verbs,
    grammar_points: lesson.grammar.map((g) => ({ id: g.id, pattern: g.pattern, level: g.level })),
    lesson_grammar: lesson.grammar.map((g, i) => ({
      lesson_id: lesson.id, grammar_id: g.id, seq: i + 1, function_ind: g.functionInd, formula: g.formula,
      example_sentence_id: g.examples[0].sentenceId,
      example_translation_ind: (mainSentences.find((s) => s.id === g.examples[0].sentenceId)?.translation_ind as string) ?? "",
      new_example: { ...ex(g.newExample), examples: g.examples },
    })),
    expressions: lesson.expressions.map((e) => ({ id: e.id, tokens: e.ja, ruby: rubyOf(e.ja), romaji: romajiOf(e.ja) })),
    lesson_expressions: lesson.expressions.map((e, i) => ({
      lesson_id: lesson.id, expression_id: e.id, seq: i + 1, meaning_ind: e.meaningInd, context_ind: e.contextInd,
      politeness_ind: e.politenessInd, situation_ind: e.situationInd,
      comparison: {
        formal: e.comparison.formal.map((j) => ({ tokens: j, ...derive(j) })),
        casual: e.comparison.casual.map((j) => ({ tokens: j, ...derive(j) })),
        note_ind: e.comparison.noteInd ?? null,
      },
      alternatives: (e.alternatives ?? []).map((a) => ({ tokens: a.ja, ...derive(a.ja), note_ind: a.noteInd })),
    })),
    quizzes: [{ id: lesson.quiz.id, lesson_id: lesson.id, seq: 1 }],
    questions: lesson.quiz.questions.map((q, i) => {
      const prompt = { ...q.prompt, ...(q.prompt.ja ? derive(q.prompt.ja) : {}) };
      if (q.type === "conjugation") {
        const c = conjugate(q.verb.lemma, q.verb.lemmaR, q.verb.cls, q.verb.form);
        return {
          id: q.id, quiz_id: lesson.quiz.id, seq: i + 1, type: q.type, prompt: { ...prompt, verb: q.verb }, options: null,
          answer: { accepted: [...new Set([c.reading, c.surface])] }, explanation_ind: q.explanationInd,
        };
      }
      return {
        id: q.id, quiz_id: lesson.quiz.id, seq: i + 1, type: q.type, prompt,
        options: q.options.map((o) => ({ ...o, ...(o.ja ? derive(o.ja) : {}) })), answer: q.answer, explanation_ind: q.explanationInd,
      };
    }),
    drills: lesson.speaking.drills.map((d, i) => ({
      lesson_id: lesson.id, seq: i + 1, pattern: { text_ind: d.patternInd }, items: d.items.map(ex),
    })),
    glossary: lesson.glossary.map((g, i) => ({
      lesson_id: lesson.id, seq: i + 1, word: { tokens: g.word, ...derive(g.word), pos_ind: g.posInd ?? null },
      romaji: romajiOf(g.word), meaning_ind: g.meaningInd,
    })),
  };
}

async function main() {
  const dir = "content/lessons";
  const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  for (const f of files) {
    const lesson = Lesson.parse(JSON.parse(readFileSync(join(dir, f), "utf8")));
    const errors = validateLesson(lesson).filter((i) => i.level === "error");
    if (errors.length) throw new Error(`${f}: ${errors.length} error validasi; jalankan npm run validate:content`);
    const publish = PUBLISH === "all" || lesson.review.status === "reviewed";
    const payload = buildPayload(lesson, publish);
    if (DRY) {
      console.log(`${f}: payload ${JSON.stringify(payload).length} byte, ${payload.sentences.length} kalimat (dry run)`);
      continue;
    }
    const res = await fetch(`${URL_}/rest/v1/rpc/seed_lesson`, {
      method: "POST",
      headers: { apikey: KEY!, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ payload }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(`${f}: HTTP ${res.status} ${JSON.stringify(body)}`);
    if (body !== payload.lesson.content_hash) throw new Error(`${f}: content_hash di database tidak sama dengan repo`);
    console.log(`${f}: ${lesson.id} ter-seed (published=${publish}, hash ${body.slice(0, 12)}…)`);
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
