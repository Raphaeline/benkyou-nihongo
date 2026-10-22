"use client";

import { useEffect, useState } from "react";

// Toggle furigana/romaji/terjemahan (PRD §8.3). Nilainya dipasang sebagai atribut
// data-* di <html>, jadi konten statis disaring oleh CSS tanpa render ulang.
type Settings = { furigana: boolean; romaji: boolean; translation: boolean };

const PRESETS: { id: string; label: string; settings: Settings }[] = [
  { id: "pemula", label: "Pemula", settings: { furigana: true, romaji: true, translation: true } },
  { id: "membaca", label: "Latihan membaca", settings: { furigana: true, romaji: false, translation: true } },
  { id: "tantangan", label: "Tantangan", settings: { furigana: false, romaji: false, translation: false } },
];

const STORAGE_KEY = "bn:display:v1";
const DEFAULT = PRESETS[0].settings;

function apply(s: Settings) {
  const el = document.documentElement;
  el.dataset.furigana = s.furigana ? "on" : "off";
  el.dataset.romaji = s.romaji ? "on" : "off";
  el.dataset.translation = s.translation ? "on" : "off";
}

function load(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

export function DisplayControls() {
  const [settings, setSettings] = useState<Settings>(DEFAULT);

  useEffect(() => {
    const stored = load();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sinkron sekali dari localStorage setelah mount
    setSettings(stored);
    apply(stored);
  }, []);

  const update = (next: Settings) => {
    setSettings(next);
    apply(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // penyimpanan tidak tersedia (mode privat); pengaturan tetap berlaku di halaman ini
    }
  };

  const toggles: { key: keyof Settings; label: string }[] = [
    { key: "furigana", label: "Furigana" },
    { key: "romaji", label: "Romaji" },
    { key: "translation", label: "Terjemahan" },
  ];

  return (
    <div className="font-ui flex flex-wrap items-center gap-x-6 gap-y-3 border-y-[3px] border-ink bg-paper py-3 text-base">
      <fieldset className="flex flex-wrap gap-x-4 gap-y-2">
        <legend className="sr-only">Tampilkan</legend>
        {toggles.map((t) => (
          <label key={t.key} className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              className="h-5 w-5 accent-ink"
              checked={settings[t.key]}
              onChange={(e) => update({ ...settings, [t.key]: e.target.checked })}
            />
            {t.label}
          </label>
        ))}
      </fieldset>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Preset">
        {PRESETS.map((p) => {
          const active = (Object.keys(p.settings) as (keyof Settings)[]).every((k) => p.settings[k] === settings[k]);
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={active}
              onClick={() => update(p.settings)}
              className={`border-2 border-ink px-3 py-1 ${active ? "bg-ink text-paper" : "bg-white"}`}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
