import type { Metadata } from "next";
import {
  Atkinson_Hyperlegible_Next,
  Dela_Gothic_One,
  Literata,
  Shippori_Antique,
} from "next/font/google";
import "./globals.css";

// Subset Jepang tidak tersedia di next/font: potongan kana/kanji di-host sendiri
// dan dimuat sesuai unicode-range, hanya subset Latin yang di-preload.
const shipporiAntique = Shippori_Antique({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  variable: "--font-shippori-antique",
});

const delaGothicOne = Dela_Gothic_One({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  variable: "--font-dela-gothic-one",
});

const literata = Literata({
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-literata",
});

// next/font belum punya metrik fallback untuk font ini.
const atkinsonHyperlegibleNext = Atkinson_Hyperlegible_Next({
  subsets: ["latin", "latin-ext"],
  adjustFontFallback: false,
  variable: "--font-atkinson-hyperlegible-next",
});

export const metadata: Metadata = {
  title: {
    default: "Benkyō Nihongo",
    template: "%s — Benkyō Nihongo",
  },
  description:
    "Latihan percakapan bahasa Jepang sehari-hari untuk level N5–N4, dengan furigana, romaji, dan terjemahan bahasa Indonesia.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${shipporiAntique.variable} ${delaGothicOne.variable} ${literata.variable} ${atkinsonHyperlegibleNext.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
