import Link from "next/link";
import { JaText } from "@/components/ja/ja-text";
import { getLessons } from "@/lib/content/queries";

export default async function HomePage() {
  const lessons = await getLessons();

  return (
    <>
      <header className="border-b-[3px] border-ink pb-6">
        <h1 className="font-display text-4xl leading-tight sm:text-5xl">Benkyō Nihongo</h1>
        <p className="mt-3 max-w-[60ch] text-ink-2">
          Latihan percakapan bahasa Jepang sehari-hari untuk level N5 sampai N4. Setiap dialog dilengkapi
          furigana, romaji, terjemahan, dan latihan.
        </p>
      </header>

      <section aria-labelledby="daftar-materi" className="mt-10">
        <h2 id="daftar-materi" className="font-display text-3xl">
          Daftar materi
        </h2>
        <ol className="mt-4 border-t border-ink">
          {lessons.map((l) => (
            <li key={l.id} className="border-b border-ink">
              <Link
                href={`/materi/${l.slug}`}
                className="flex flex-col gap-1 py-4 hover:bg-tone-1 sm:flex-row sm:items-baseline sm:gap-6"
              >
                <span className="font-ui text-ink-2">Materi {l.seq}</span>
                <span className="text-xl">
                  <JaText tokens={l.title_ja.tokens} />
                </span>
                <span>{l.title_ind}</span>
                <span className="font-ui text-ink-3 sm:ml-auto">
                  {l.level} · {l.estimated_minutes} menit
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
