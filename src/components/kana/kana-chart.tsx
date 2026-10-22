"use client";

import { useState } from "react";
import { StrokeOrder } from "./stroke-order";
import { DAKUON, GOJUON, VOWELS, YOON, YOON_COLUMNS, type KanaCell, type KanaRow, type Script } from "@/lib/kana/data";

const SCRIPT_LABEL: Record<Script, string> = { hiragana: "Hiragana", katakana: "Katakana" };

type Selected = { cell: NonNullable<KanaCell> } | null;

function Grid({
  title,
  rows,
  columns,
  script,
  onSelect,
  selected,
}: {
  title: string;
  rows: KanaRow[];
  columns: string[];
  script: Script;
  onSelect: (c: NonNullable<KanaCell>) => void;
  selected: Selected;
}) {
  return (
    <section className="mt-10" aria-label={`${title} ${SCRIPT_LABEL[script]}`}>
      <h2 className="font-display text-3xl">{title}</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[20rem] border-collapse border-[3px] border-ink bg-white">
          <thead>
            <tr>
              <th className="w-12 border border-ink" aria-label="Baris" />
              {columns.map((c) => (
                <th key={c} scope="col" className="font-ui border border-ink py-1 text-base text-ink-2">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <th scope="row" className="font-ui border border-ink px-1 text-base text-ink-2">
                  {r.label}
                </th>
                {r.cells.map((c, i) =>
                  c ? (
                    <td key={i} className="border border-ink p-0">
                      <button
                        type="button"
                        onClick={() => onSelect(c)}
                        aria-pressed={selected?.cell.hiragana === c.hiragana}
                        aria-label={`${SCRIPT_LABEL[script]} ${c[script]}, romaji ${c.romaji}`}
                        className={`flex w-full flex-col items-center py-2 hover:bg-tone-1 ${
                          selected?.cell.hiragana === c.hiragana ? "bg-ink text-paper hover:bg-ink" : ""
                        }`}
                      >
                        <span lang="ja" className="font-ja text-3xl leading-tight">
                          {c[script]}
                        </span>
                        <span className="font-ui text-sm">{c.romaji}</span>
                      </button>
                    </td>
                  ) : (
                    <td key={i} className="tone-10 border border-ink" aria-hidden="true" />
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function KanaChart() {
  const [script, setScript] = useState<Script>("hiragana");
  const [selected, setSelected] = useState<Selected>(null);
  const onSelect = (cell: NonNullable<KanaCell>) => setSelected({ cell });

  return (
    <div>
      <div role="tablist" aria-label="Jenis huruf" className="font-ui flex gap-2">
        {(["hiragana", "katakana"] as Script[]).map((s) => (
          <button
            key={s}
            role="tab"
            type="button"
            aria-selected={script === s}
            onClick={() => setScript(s)}
            className={`border-2 border-ink px-4 py-2 ${script === s ? "bg-ink text-paper" : "bg-white"}`}
          >
            {SCRIPT_LABEL[s]}
          </button>
        ))}
      </div>

      {selected && (
        <div className="sticky top-0 z-10 mt-6 flex flex-wrap items-start gap-6 border-[3px] border-ink bg-white p-4" aria-live="polite">
          <div className="flex gap-2">
            {[...selected.cell[script]].map((ch, i) => (
              <StrokeOrder key={`${ch}-${i}`} char={ch} />
            ))}
          </div>
          <div>
            <p lang="ja" className="font-ja text-5xl leading-none">
              {selected.cell[script]}
            </p>
            <p className="font-ui mt-2 text-2xl">{selected.cell.romaji}</p>
            <p className="text-base text-ink-2">
              {SCRIPT_LABEL[script === "hiragana" ? "katakana" : "hiragana"]}:{" "}
              <span lang="ja" className="font-ja">
                {selected.cell[script === "hiragana" ? "katakana" : "hiragana"]}
              </span>
            </p>
          </div>
          <button type="button" onClick={() => setSelected(null)} className="font-ui ml-auto underline underline-offset-4">
            Tutup
          </button>
        </div>
      )}

      <Grid title="Gojūon" rows={GOJUON} columns={VOWELS} script={script} onSelect={onSelect} selected={selected} />
      <Grid title="Dakuten dan handakuten" rows={DAKUON} columns={VOWELS} script={script} onSelect={onSelect} selected={selected} />
      <Grid title="Yōon" rows={YOON} columns={YOON_COLUMNS} script={script} onSelect={onSelect} selected={selected} />
    </div>
  );
}
