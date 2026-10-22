// Skema file materi `content/lessons/*.json` (docs/CONTENT_SPEC.md, PRD §9.2).
// Struktur mengikuti bagian A–I; teks Jepang selalu berupa array token.

import { z } from "zod";
import { FORMS, VERB_CLASSES } from "./conjugate.ts";

export const Token = z
  .object({
    t: z.string().min(1),
    /** Bacaan seluruh token (hiragana). Wajib jika token mengandung kanji. */
    r: z.string().optional(),
    /** Partikel (は/へ dibaca wa/e). */
    prt: z.literal(true).optional(),
    /** Nama diri atau nama bahasa/negara: huruf kapital di romaji. */
    proper: z.literal(true).optional(),
    /** Sufiks sapaan (さん, 先生 setelah nama): disambung dengan tanda hubung. */
    suffix: z.literal(true).optional(),
    lemma: z.string().optional(),
    lemmaR: z.string().optional(),
    form: z.enum(FORMS).optional(),
    /** Kata kerja bantu (いる dalam 〜ている, ください, ございます). */
    aux: z.literal(true).optional(),
    /** Override romaji token, wajib disertai alasan di content/overrides. */
    romaji: z.string().optional(),
  })
  .strict();
export type Token = z.infer<typeof Token>;

export const Ja = z.array(Token).min(1);
export type Ja = z.infer<typeof Ja>;

const Register = z.enum(["teineigo", "futsuu", "campuran"]);
const Id = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);

export const Example = z.object({ ja: Ja, translationInd: z.string().min(1) }).strict();

export const Sentence = z
  .object({
    id: z.string().regex(/^L\d{3}\.(main|variation)\.\d{2}\.\d+$/),
    ja: Ja,
    translationInd: z.string().min(1),
    noteInd: z.string().optional(),
    register: Register.optional(),
  })
  .strict();

export const Turn = z.object({ speaker: Id, sentences: z.array(Sentence).min(1) }).strict();

const Lexeme = z.object({ id: Id, headword: z.string().min(1), reading: z.string().min(1) }).strict();

export const Question = z.discriminatedUnion("type", [
  z
    .object({
      id: z.string(),
      type: z.enum(["comprehension", "vocabulary", "completion"]),
      prompt: z.object({ ja: Ja.optional(), textInd: z.string().optional(), translationInd: z.string().optional() }).strict(),
      options: z.array(z.object({ ja: Ja.optional(), textInd: z.string().optional() }).strict()).min(2),
      answer: z.object({ index: z.number().int().min(0) }).strict(),
      explanationInd: z.string().min(1),
    })
    .strict(),
  z
    .object({
      id: z.string(),
      type: z.literal("conjugation"),
      prompt: z.object({ ja: Ja.optional(), textInd: z.string().min(1) }).strict(),
      /** Kata kerja dan bentuk yang diminta; kunci jawaban dihitung conjugator. */
      verb: z.object({ lemma: z.string(), lemmaR: z.string(), cls: z.enum(VERB_CLASSES), form: z.enum(FORMS) }).strict(),
      explanationInd: z.string().min(1),
    })
    .strict(),
]);

export const Lesson = z
  .object({
    id: z.string().regex(/^L\d{3}$/),
    seq: z.number().int().positive(),
    slug: Id,
    level: z.enum(["N5", "N4"]),
    meta: z
      .object({
        titleJa: Ja,
        titleInd: z.string().min(1),
        situationInd: z.string().min(1),
        locationInd: z.string().min(1),
        objectivesInd: z.array(z.string().min(1)).min(1),
        estimatedMinutes: z.number().int().positive(),
      })
      .strict(),
    characters: z
      .array(
        z
          .object({
            id: Id,
            name: Ja,
            relationInd: z.string().min(1),
            register: z.object({ default: Register, noteInd: z.string().optional() }).strict(),
          })
          .strict(),
      )
      .min(2),
    dialogue: z.object({ main: z.array(Turn).min(1), variation: z.array(Turn) }).strict(),
    vocabulary: z
      .array(z.object({ lexeme: Lexeme, meaningInd: z.string(), posInd: z.string(), example: Example }).strict())
      .min(1),
    verbs: z
      .array(
        z
          .object({
            lexeme: Lexeme,
            cls: z.enum(VERB_CLASSES),
            role: z.enum(["utama", "tambahan"]),
            meaningInd: z.string().min(1),
            groupNoteInd: z.string().optional(),
          })
          .strict(),
      )
      .min(1),
    grammar: z
      .array(
        z
          .object({
            id: Id,
            pattern: z.string().min(1),
            level: z.enum(["N5", "N4"]),
            functionInd: z.string().min(1),
            formula: z.string().min(1),
            examples: z.array(z.object({ sentenceId: z.string(), span: z.string().min(1) }).strict()).min(1),
            newExample: Example,
          })
          .strict(),
      ),
    expressions: z
      .array(
        z
          .object({
            id: Id,
            ja: Ja,
            meaningInd: z.string().min(1),
            contextInd: z.string().min(1),
            politenessInd: z.string().min(1),
            situationInd: z.string().min(1),
            comparison: z
              .object({
                formal: z.array(Ja),
                casual: z.array(Ja),
                noteInd: z.string().optional(),
              })
              .strict(),
            alternatives: z.array(z.object({ ja: Ja, noteInd: z.string() }).strict()).optional(),
          })
          .strict(),
      ),
    quiz: z.object({ id: z.string().regex(/^L\d{3}\.quiz$/), questions: z.array(Question) }).strict(),
    speaking: z
      .object({
        readingGuideInd: z.array(z.string().min(1)).min(1),
        roleplayInd: z.array(z.string().min(1)).min(1),
        drills: z
          .array(z.object({ patternInd: z.string().min(1), items: z.array(Example).min(2) }).strict())
          .min(1),
      })
      .strict(),
    glossary: z.array(z.object({ word: Ja, posInd: z.string().optional(), meaningInd: z.string().min(1) }).strict()),
  })
  .strict();
export type Lesson = z.infer<typeof Lesson>;
