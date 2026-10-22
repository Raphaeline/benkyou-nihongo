import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JaText } from "@/components/ja/ja-text";
import { DisplayControls } from "@/components/lesson/display-controls";
import { Translation } from "@/components/lesson/translation";
import { SpeechBubble } from "@/components/manga/speech-bubble";
import { getLesson, getLessons, type LessonDetail } from "@/lib/content/queries";

export async function generateStaticParams() {
  const lessons = await getLessons();
  return lessons.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: PageProps<"/materi/[slug]">): Promise<Metadata> {
  const lesson = await getLesson((await params).slug);
  return lesson ? { title: `Materi ${lesson.seq}: ${lesson.title_ind}` } : {};
}

// Penanda tokoh: pola tone berbeda per tokoh, dipakai di daftar tokoh dan dialog.
const MARKERS = ["bg-white", "tone-10", "tone-30", "tone-60", "bg-ink"];

const REGISTER_LABEL = { teineigo: "Sopan (teineigo)", futsuu: "Kasual (futsūkei)", campuran: "Campuran" };

function Marker({ index }: { index: number }) {
  return <span aria-hidden="true" className={`inline-block h-4 w-4 shrink-0 border-2 border-ink ${MARKERS[index % MARKERS.length]}`} />;
}

function Dialogue({ lesson, kind }: { lesson: LessonDetail; kind: "main" | "variation" }) {
  const charIndex = new Map(lesson.characters.map((c, i) => [c.id, i]));
  const charById = new Map(lesson.characters.map((c) => [c.id, c]));
  const turns = lesson.turns.filter((t) => t.dialogue === kind);

  return (
    <ol className="flex flex-col gap-8">
      {turns.map((turn) => {
        const speaker = charById.get(turn.speaker_id);
        const index = charIndex.get(turn.speaker_id) ?? 0;
        // Guru di sisi kanan, murid di kiri, agar arah percakapan terbaca.
        const right = index === 0;
        const sentences = lesson.sentences.filter((s) => s.dialogue === kind && s.turn_seq === turn.seq);
        return (
          <li key={turn.seq} className="border-[3px] border-ink bg-white p-4 sm:p-5">
            <p className={`font-ui flex items-center gap-2 text-base ${right ? "justify-end" : ""}`}>
              <Marker index={index} />
              <span className="text-lg">{speaker && <JaText tokens={speaker.name.tokens} />}</span>
              <span className="text-ink-2">{speaker?.name_romaji}</span>
            </p>
            <ol className="mt-2 flex flex-col gap-4">
              {sentences.map((s) => (
                <li key={s.id} className={`flex flex-col ${right ? "items-end text-right" : "items-start"}`}>
                  <SpeechBubble flip={right} className="max-w-full sm:max-w-md">
                    <p className="text-xl sm:text-2xl">
                      <JaText tokens={s.tokens} />
                    </p>
                  </SpeechBubble>
                  <div className="max-w-xl">
                    <p className="romaji italic text-ink-2">
                      <span className="font-ui mr-2 text-sm not-italic text-ink-3">
                        {turn.seq}.{s.seq}
                      </span>
                      {s.romaji}
                    </p>
                    <Translation>{s.translation_ind}</Translation>
                    {s.note_ind && (
                      <p className="mt-1 border-l-[3px] border-ink pl-3 text-left text-base text-ink-2">
                        Catatan: {s.note_ind}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </li>
        );
      })}
    </ol>
  );
}

export default async function LessonPage({ params }: PageProps<"/materi/[slug]">) {
  const lesson = await getLesson((await params).slug);
  if (!lesson) notFound();

  return (
    <article>
      <p className="font-ui text-base">
        <Link href="/" className="underline underline-offset-4">
          Daftar materi
        </Link>
      </p>

      {/* A. Informasi materi */}
      <header className="mt-4 border-[3px] border-ink bg-white">
        <div className="tone-10 border-b-[3px] border-ink px-4 py-3">
          <span className="font-ui bg-white px-2 py-1 text-base">
            Materi {lesson.seq} · {lesson.level} · {lesson.estimated_minutes} menit
          </span>
        </div>
        <div className="p-4 sm:p-6">
          <h1 className="font-display text-4xl leading-tight">{lesson.title_ind}</h1>
          <p className="mt-2 text-2xl">
            <JaText tokens={lesson.title_ja.tokens} />
          </p>
          <p className="romaji italic text-ink-2">{lesson.title_ja.romaji}</p>
          <dl className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-[10rem_1fr]">
            <dt className="font-ui text-ink-2">Situasi</dt>
            <dd>{lesson.situation_ind}</dd>
            <dt className="font-ui text-ink-2">Tempat</dt>
            <dd>{lesson.location_ind}</dd>
            <dt className="font-ui text-ink-2">Tokoh</dt>
            <dd>
              {new Set(lesson.turns.filter((t) => t.dialogue === "main").map((t) => t.speaker_id)).size} orang di
              dialog utama
            </dd>
            <dt className="font-ui text-ink-2">Tujuan</dt>
            <dd>
              <ul className="list-disc pl-5">
                {lesson.objectives_ind.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
            </dd>
          </dl>
        </div>
      </header>

      <div className="sticky top-0 z-10 mt-8">
        <DisplayControls />
      </div>

      {/* B. Daftar tokoh */}
      <section aria-labelledby="tokoh" className="mt-10">
        <h2 id="tokoh" className="font-display text-3xl">
          Tokoh
        </h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {lesson.characters.map((c, i) => (
            <li key={c.id} className="border-2 border-ink bg-white p-4">
              <p className="flex items-center gap-2">
                <Marker index={i} />
                <span className="text-xl">
                  <JaText tokens={c.name.tokens} />
                </span>
                <span className="font-ui text-ink-2">{c.name_romaji}</span>
              </p>
              <p className="mt-2">{c.relation_ind}</p>
              <p className="font-ui mt-2 text-base text-ink-2">
                {REGISTER_LABEL[c.register_default]}
                {c.register_note_ind ? ` — ${c.register_note_ind}` : ""}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* C. Dialog */}
      <section aria-labelledby="dialog" className="mt-12">
        <h2 id="dialog" className="font-display text-3xl">
          Dialog
        </h2>
        <div className="mt-4">
          <Dialogue lesson={lesson} kind="main" />
        </div>
      </section>
    </article>
  );
}
