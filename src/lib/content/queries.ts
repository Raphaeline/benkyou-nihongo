// Query konten untuk halaman statis. Dibaca saat build lewat 'use cache'
// dan tidak pernah memakai cookie (lihat docs/ARCHITECTURE.md §3.3).

import { cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { Ja } from "./schema";

export type Derived = { tokens: Ja; text: string; romaji: string };

export type LessonSummary = {
  id: string;
  seq: number;
  slug: string;
  level: "N5" | "N4";
  title_ja: Derived;
  title_ind: string;
  estimated_minutes: number;
};

export type LessonDetail = LessonSummary & {
  situation_ind: string;
  location_ind: string;
  objectives_ind: string[];
  characters: {
    id: string;
    seq: number;
    name: Derived;
    name_romaji: string;
    relation_ind: string;
    register_default: "teineigo" | "futsuu" | "campuran";
    register_note_ind: string | null;
  }[];
  turns: { dialogue: "main" | "variation"; seq: number; speaker_id: string }[];
  sentences: {
    id: string;
    dialogue: "main" | "variation";
    turn_seq: number;
    seq: number;
    tokens: Ja;
    romaji: string;
    translation_ind: string;
    note_ind: string | null;
  }[];
};

const SUMMARY = "id, seq, slug, level, title_ja, title_ind, estimated_minutes";

export async function getLessons(): Promise<LessonSummary[]> {
  "use cache";
  cacheTag("lessons");
  const { data, error } = await createPublicClient().from("lessons").select(SUMMARY).order("seq");
  if (error) throw new Error(`Gagal membaca daftar materi: ${error.message}`);
  return data as LessonSummary[];
}

export async function getLesson(slug: string): Promise<LessonDetail | null> {
  "use cache";
  cacheTag("lessons");
  const db = createPublicClient();
  const { data, error } = await db
    .from("lessons")
    .select(
      `${SUMMARY}, situation_ind, location_ind, objectives_ind,
       characters(id, seq, name, name_romaji, relation_ind, register_default, register_note_ind),
       turns(dialogue, seq, speaker_id)`,
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`Gagal membaca materi ${slug}: ${error.message}`);
  if (!data) return null;
  // sentences berelasi ke turns (FK komposit), bukan langsung ke lessons
  const sentences = await db
    .from("sentences")
    .select("id, dialogue, turn_seq, seq, tokens, romaji, translation_ind, note_ind")
    .eq("lesson_id", data.id);
  if (sentences.error) throw new Error(`Gagal membaca kalimat ${slug}: ${sentences.error.message}`);
  const lesson = { ...data, sentences: sentences.data } as LessonDetail;
  lesson.characters.sort((a, b) => a.seq - b.seq);
  lesson.turns.sort((a, b) => a.seq - b.seq);
  lesson.sentences.sort((a, b) => a.turn_seq - b.turn_seq || a.seq - b.seq);
  return lesson;
}
