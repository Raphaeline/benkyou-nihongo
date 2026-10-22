import type { Metadata } from "next";
import Link from "next/link";
import { KanaChart } from "@/components/kana/kana-chart";
import { romanizeWord } from "@/lib/content/kana";
import { EXTENDED_KATAKANA, SPECIAL_MARKS } from "@/lib/kana/data";

export const metadata: Metadata = { title: "Hiragana dan Katakana" };

export default function KanaPage() {
  return (
    <article>
      <p className="font-ui text-base">
        <Link href="/" className="underline underline-offset-4">
          Beranda
        </Link>
      </p>
      <header className="mt-4 border-b-[3px] border-ink pb-6">
        <h1 className="font-display text-4xl leading-tight">Hiragana dan Katakana</h1>
        <p className="mt-3 max-w-[60ch] text-ink-2">
          Tabel lengkap huruf kana dengan romaji Hepburn. Pilih sebuah huruf untuk melihatnya lebih besar. Hiragana dipakai
          untuk kata asli Jepang dan unsur tata bahasa; katakana untuk kata serapan dan nama asing.
        </p>
        <p className="mt-2 max-w-[60ch] text-base text-ink-2">
          Catatan: を dibaca <em>o</em> dan ditulis <em>o</em> dalam romaji Hepburn (beberapa buku menulisnya <em>wo</em>). ぢ
          dan づ dibaca sama dengan じ dan ず.
        </p>
      </header>

      <div className="mt-8">
        <KanaChart />
      </div>

      <section aria-labelledby="serapan" className="mt-12">
        <h2 id="serapan" className="font-display text-3xl">
          Kombinasi katakana untuk kata serapan
        </h2>
        <p className="mt-2 max-w-[60ch] text-ink-2">
          Kombinasi ini dipakai untuk bunyi yang tidak ada di bahasa Jepang asli, terutama pada kata serapan.
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {EXTENDED_KATAKANA.map((k) => (
            <li key={k.kana} className="flex items-center gap-4 border-2 border-ink bg-white p-3">
              <span lang="ja" className="font-ja w-16 text-center text-3xl leading-tight">
                {k.kana}
              </span>
              <span className="font-ui w-10 text-ink-2">{k.romaji}</span>
              <span>
                <span lang="ja" className="font-ja text-lg">
                  {k.example[0].t}
                </span>{" "}
                <em className="text-ink-2">{romanizeWord(k.example[0].t)}</em>
                <span className="block text-base text-ink-2">{k.meaningInd}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="tanda" className="mt-12">
        <h2 id="tanda" className="font-display text-3xl">
          Tanda khusus
        </h2>
        <ul className="mt-4 flex flex-col gap-4">
          {SPECIAL_MARKS.map((m) => (
            <li key={m.mark} className="border-2 border-ink bg-white p-4">
              <p className="flex items-baseline gap-3">
                <span lang="ja" className="font-ja text-3xl">
                  {m.mark}
                </span>
                <span className="font-ui">{m.nameInd}</span>
              </p>
              <p className="mt-1">{m.explanationInd}</p>
              <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-base">
                {m.examples.map((e) => (
                  <li key={e.word}>
                    <span lang="ja" className="font-ja text-lg">
                      {e.word}
                    </span>{" "}
                    <em className="text-ink-2">{romanizeWord(e.word)}</em> — {e.meaningInd}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
