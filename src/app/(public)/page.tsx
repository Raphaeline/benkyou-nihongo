import { SpeechBubble } from "@/components/manga/speech-bubble";

export default function HomePage() {
  return (
    <>
      <header className="border-b-[3px] border-ink pb-6">
        <h1 className="font-display text-4xl leading-tight sm:text-5xl">
          Benkyō Nihongo
        </h1>
        <p className="mt-3 max-w-[60ch] text-ink-2">
          Latihan percakapan bahasa Jepang sehari-hari untuk level N5 sampai N4.
          Setiap dialog dilengkapi furigana, romaji, terjemahan, dan latihan.
        </p>
      </header>

      <section aria-labelledby="contoh-dialog" className="mt-10">
        <h2 id="contoh-dialog" className="sr-only">
          Contoh dialog
        </h2>
        <div className="border-[3px] border-ink bg-white p-4 sm:p-6">
          <div className="tone-10 border-[2px] border-ink p-4 sm:p-8">
            <SpeechBubble className="max-w-md">
              <p lang="ja" className="font-ja text-xl sm:text-2xl">
                <ruby>
                  日本語<rp>（</rp>
                  <rt>にほんご</rt>
                  <rp>）</rp>
                </ruby>
                を
                <wbr />
                <ruby>
                  勉強<rp>（</rp>
                  <rt>べんきょう</rt>
                  <rp>）</rp>
                </ruby>
                しています。
              </p>
            </SpeechBubble>
          </div>
          <p className="mt-4 italic">Nihongo o benkyō shite imasu.</p>
          <p className="text-ink-2">Saya sedang belajar bahasa Jepang.</p>
        </div>
      </section>

      <section aria-labelledby="daftar-materi" className="mt-12">
        <h2 id="daftar-materi" className="font-display text-2xl">
          Daftar materi
        </h2>
        <ol className="mt-4 border-t border-ink">
          <li className="flex flex-col gap-1 border-b border-ink py-4 sm:flex-row sm:items-baseline sm:gap-6">
            <span className="font-ui text-ink-2">Materi 1</span>
            <span lang="ja" className="font-ja text-xl">
              <ruby>
                自己紹介<rp>（</rp>
                <rt>じこしょうかい</rt>
                <rp>）</rp>
              </ruby>
            </span>
            <span>Perkenalan Diri</span>
            <span className="font-ui text-ink-3 sm:ml-auto">Sedang disiapkan</span>
          </li>
        </ol>
      </section>
    </>
  );
}
