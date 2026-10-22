"use client";

import { useEffect, useState } from "react";

// Urutan goresan dari KanjiVG (CC BY-SA 3.0). Data dimuat saat panel dibuka
// agar tidak membebani halaman awal.
type StrokeData = { paths: string[]; numbers: [number, number][] };
type StrokeFile = { chars: Record<string, StrokeData> };

let cache: Promise<StrokeFile> | null = null;
const loadStrokes = () => (cache ??= import("@/lib/kana/strokes.json").then((m) => m.default as unknown as StrokeFile));

const STROKE_SECONDS = 0.7;

export function StrokeOrder({ char }: { char: string }) {
  const [data, setData] = useState<StrokeData | null | undefined>(undefined);
  // run berubah → animasi diulang; step null = mode animasi, angka = mode langkah demi langkah
  const [run, setRun] = useState(0);
  const [step, setStep] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    loadStrokes().then((f) => {
      if (!alive) return;
      setData(f.chars[char] ?? null);
      setStep(null);
      setRun((r) => r + 1);
    });
    return () => {
      alive = false;
    };
  }, [char]);

  if (data === undefined) return <div className="h-40 w-40 border-2 border-ink bg-white" aria-busy="true" />;
  if (data === null) return <p className="font-ui text-sm text-ink-3">Data goresan tidak tersedia.</p>;

  const total = data.paths.length;
  const visible = step ?? total;

  return (
    <div className="flex flex-col items-start gap-2">
      <svg
        key={run}
        viewBox="0 0 109 109"
        role="img"
        aria-label={`Urutan goresan ${char}, ${total} goresan`}
        className="stroke-order h-40 w-40 border-2 border-ink bg-white"
      >
        {/* garis bantu tengah */}
        <path d="M54.5 0V109M0 54.5H109" stroke="var(--color-tone-1)" strokeWidth={1} />
        {data.paths.slice(0, visible).map((d, i) => (
          <path
            key={i}
            d={d}
            pathLength={1}
            fill="none"
            stroke={step !== null && i === visible - 1 ? "var(--color-ink)" : "var(--color-ink-2)"}
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={step === null ? "stroke-draw" : undefined}
            style={step === null ? { animationDelay: `${i * STROKE_SECONDS}s` } : undefined}
          />
        ))}
        {data.numbers.slice(0, visible).map(([x, y], i) => (
          <text key={i} x={x} y={y} fontSize={9} className="font-ui" fill="var(--color-ink)">
            {i + 1}
          </text>
        ))}
      </svg>
      <div className="font-ui flex flex-wrap gap-2 text-sm">
        <button
          type="button"
          className="border-2 border-ink bg-white px-2 py-1"
          onClick={() => {
            setStep(null);
            setRun((r) => r + 1);
          }}
        >
          Ulangi
        </button>
        <button
          type="button"
          className="border-2 border-ink bg-white px-2 py-1"
          onClick={() => setStep((s) => (s === null || s >= total ? 1 : s + 1))}
        >
          Langkah {step === null ? "demi langkah" : `${Math.min(step, total)}/${total}`}
        </button>
      </div>
    </div>
  );
}
