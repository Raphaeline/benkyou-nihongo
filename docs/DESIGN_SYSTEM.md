# Design System — Benkyō Nihongo

| | |
|---|---|
| Status | M0 sedang berjalan. Bagian bertanda **(rencana, M4)** belum dibangun. |
| Tanggal | 22 Oktober 2026 |
| Acuan | `docs/PRD.md` v0.2: §10 (desain visual), §8.1–§8.5, §13 |
| Kode yang didokumentasikan | `src/app/globals.css`, `src/app/layout.tsx`, `src/app/(public)/layout.tsx`, `src/components/manga/speech-bubble.tsx`, `src/app/(public)/page.tsx` (halaman contoh M0) |

Dokumen ini untuk developer yang membuat komponen. Kalau isinya berbeda dengan PRD, yang berlaku adalah PRD. "Token" berarti nilai desain bernama (warna, font) yang dipakai ulang. "Utilitas" berarti kelas Tailwind siap pakai seperti `bg-paper`.

---

## 1. Prinsip (PRD §10.1)

1. **Kertas dan tinta:** hanya hitam, putih, dan abu-abu, tanpa warna (hue).
2. **Bahasa visual manga yang nyata:** panel (*koma*), balon dialog, screentone, dan lettering アンチゴチ. Elemen ini dipakai karena berfungsi, bukan sebagai dekorasi.
   - *Screentone*: pola titik yang di manga cetak dipakai untuk memberi arsiran abu-abu.
   - *アンチゴチ*: kana bergaya Antique (turunan Mincho dengan goresan tebal) digabung dengan kanji Gothic (tanpa kait). Ini gaya standar teks dialog manga.
3. **Keterbacaan di atas estetika:** teks tidak pernah diletakkan langsung di atas screentone.
4. **Catatan penting:** palet abu-abu, sudut siku, dan garis tipis tidak cukup untuk menghindari kesan "template AI". Kombinasi itu sendiri termasuk gaya bawaan desain buatan AI saat ini (gaya "broadsheet": garis tipis dan radius 0). Pembedanya adalah tata bahasa visual manga yang spesifik dan teks Indonesia yang konkret.

Arti praktis poin 4 untuk developer:

- Setiap elemen manga harus punya fungsi yang bisa disebutkan. Balon menunjukkan siapa yang bicara, panel membatasi satu adegan, tone memberi arsiran atau menandai tokoh, dan garis fokus menandai satu momen penting.
- Teks UI ditulis konkret dan apa adanya, misalnya "Sedang disiapkan", bukan kalimat promosi.

Keputusan terkait: **D5** tanpa dark mode (jangan menulis varian `dark:`), **D6** teks horizontal dan panel tersusun dari atas ke bawah (tidak memakai urutan kanan ke kiri atau teks vertikal).

## 2. Status implementasi

| Bagian | Status | Lokasi |
|---|---|---|
| Token warna; reset palet, radius, dan bayangan bawaan | Sudah ada | `globals.css` |
| Screentone `tone-10`, `tone-30`, `tone-60` | Sudah ada | `globals.css` |
| Empat font dan token `font-ja`, `font-display`, `font-body`, `font-ui` | Sudah ada | `layout.tsx`, `globals.css` |
| CSS furigana (ukuran rt, toggle lewat atribut, cetak) | Sudah ada (CSS saja, tombol toggle belum) | `globals.css` |
| Focus ring | Sudah ada | `globals.css` |
| `SpeechBubble` | Sudah ada | `src/components/manga/speech-bubble.tsx` |
| Kontainer halaman publik | Sudah ada | `src/app/(public)/layout.tsx` |
| Komponen panel (koma) | Rencana, M4 | §10.1 |
| Balon teriak | Rencana, M4 | §10.2 |
| Penanda tone tokoh | Rencana, M4 | §10.3 |
| Garis fokus (集中線) | Rencana, M4 | §10.4 |
| Penanda ○/× pada soal | Rencana, M4 | §10.5 |
| Tabel di ponsel | Rencana, M4 | §10.6 |
| Toggle furigana, romaji, terjemahan, dan preset | Rencana, M4 | §7.4 |

Ada tiga selisih antara kode saat ini dan aturan di dokumen ini. Lihat §12.

## 3. Warna

### 3.1 Token

| Token | Hex | Contoh utilitas | Kontras di `paper` | Kontras di `white` | Dipakai untuk |
|---|---|---|---|---|---|
| `paper` | `#F6F6F3` | `bg-paper` | — | — | Latar halaman (sudah dipasang di `html`). Abu-abu netral, sengaja bukan krem. |
| `white` | `#FFFFFF` | `bg-white` | — | — | Isi balon, latar panel, *knockout* (area putih polos di atas tone, tempat teks diletakkan) |
| `ink` | `#000000` | `text-ink`, `border-ink` | 19,4:1 | 21,0:1 | Teks utama, garis panel dan balon, focus ring. Hitam murni, bukan `#111`. |
| `ink-2` | `#3D3D3D` | `text-ink-2` | 10,0:1 | 10,9:1 | Teks sekunder: terjemahan, deskripsi |
| `ink-3` | `#595959` | `text-ink-3` | 6,47:1 | 7,0:1 | Abu-abu teks paling terang yang diizinkan: status, keterangan |
| `tone-1` | `#E6E6E3` | `bg-tone-1` | 1,15:1 | 1,25:1 | Isian non-teks saja |
| `tone-2` | `#B3B3B3` | `bg-tone-2` | 1,94:1 | 2,10:1 | Isian non-teks saja |
| `tone-3` | `#808080` | `bg-tone-3` | 3,65:1 | 3,95:1 | Isian non-teks saja |

Angka `ink`, `ink-2`, dan `ink-3` di `paper` berasal dari PRD §10.2. Angka lainnya dihitung dengan rumus kontras WCAG.

### 3.2 Aturan

- **Warna teks hanya `ink`, `ink-2`, atau `ink-3`.** WCAG 1.4.3 mensyaratkan kontras 4,5:1 untuk teks normal. Abu-abu yang lebih terang dari `ink-3` tidak dipakai untuk teks. Contohnya, `#767676` hanya 4,20:1 di `paper` dan gagal.
- **`tone-1/2/3` tidak pernah dipakai sebagai warna teks.** Tone juga tidak dipakai sebagai satu-satunya batas komponen interaktif (input, tombol, kotak centang). WCAG 1.4.11 mensyaratkan 3:1 untuk batas komponen. `tone-3` memang lolos secara angka, tetapi PRD membatasi tone untuk isian. Batas komponen memakai `ink`, `ink-2`, atau `ink-3`, sesuai rekomendasi riset.
- **Teks di atas isian rata `bg-tone-*`: Ditentukan di M4.** Sampai saat itu, teks diletakkan di atas `paper` atau `white`.
- **Tidak ada token warna lain.** Warna baru berarti mengubah PRD §10.2.
- **Tulis nama kelas dan variabel secara utuh.** Tailwind hanya membuat utilitas dan variabel CSS yang namanya ditemukan di kode. `var(--color-ink)` di atribut SVG berfungsi karena namanya tertulis lengkap. Nama yang dirangkai, seperti `` `tone-${n}` `` atau `` `--color-tone-${n}` ``, tidak terdeteksi. Pakai peta string lengkap, misalnya `{ rendah: "tone-10", sedang: "tone-30" }`.

### 3.3 Reset palet, radius, dan bayangan (sudah ada)

`globals.css` mereset namespace bawaan Tailwind dengan nilai `initial`: `--color-*`, `--radius-*`, `--shadow-*`, `--inset-shadow-*`, `--drop-shadow-*`, dan `--text-shadow-*` di `@theme`, serta `--font-*` di `@theme inline`. Hasilnya sudah dicek dengan compiler Tailwind 4.3.3 di repo ini pada 22 Okt 2026:

| Kategori | Utilitas |
|---|---|
| Tidak lagi dihasilkan | `bg-red-500`, `text-black`, `font-sans`, `rounded`, `rounded-lg`, `shadow`, `shadow-md`, `drop-shadow-md`, `inset-shadow-sm`, `text-shadow-sm` |
| **Masih dihasilkan, tetapi dilarang** | Nilai arbitrer seperti `bg-[#ff0000]`, `rounded-[8px]`, `shadow-[4px_4px_0_#000]`; `rounded-full`; `ring` dan `ring-2` (Tailwind menggambar ring dengan `box-shadow`); `bg-linear-to-r` dan utilitas gradien lain; `backdrop-blur-*`, `blur-*` |
| Masih dihasilkan dan boleh | `bg-transparent`, `bg-current` |

Reset ini mencegah pemakaian yang tidak sengaja, bukan pelanggaran yang disengaja. Belum ada pemeriksaan otomatis untuk nilai arbitrer, jadi pelanggaran ditolak saat review kode.

### 3.4 Screentone (sudah ada)

| Utilitas | Kepadatan | Bentuk |
|---|---|---|
| `tone-10` | 10% | Titik hitam berjari-jari 1,07 px di grid 6 px |
| `tone-30` | 30% | Jari-jari 1,85 px di grid 6 px |
| `tone-60` | 60% | Jari-jari 2,62 px di grid 6 px |

Kepadatan adalah luas titik dibagi luas satu sel grid (π·r² / 36).

- `tone-*` (pola titik) berbeda dengan `bg-tone-*` (warna abu-abu rata). Jangan tertukar.
- Titik digambar dengan `radial-gradient` bertepi tegas. Ini bukan gradien warna yang dilarang. Jangan menulis gradien di luar tiga utilitas ini. Teknik garis fokus Ditentukan di M4.
- Ada `print-color-adjust: exact` supaya tone ikut tercetak. Perilaku cetak di tiap browser belum diuji.
- Tone dipakai untuk arsiran atau penekanan di dalam panel, dan nanti untuk penanda tokoh (§10.3). Tone tidak dipakai sebagai latar dekoratif seluruh halaman.
- **Teks tidak pernah langsung di atas tone.** Letakkan teks di knockout putih (`bg-white` atau isi balon) dengan padding minimal 4 px (`p-1`). Alasannya, teknik uji WCAG F83 membandingkan teks dengan bagian latar yang paling gelap, dan teks hitam di atas titik hitam gagal uji itu.
- Susunan di halaman contoh: panel putih → bingkai `tone-10` → `SpeechBubble` (isi putih) → teks.

## 4. Tipografi

### 4.1 Peran

| Peran | Utilitas | Font | Ukuran | Catatan |
|---|---|---|---|---|
| Dialog dan contoh Jepang | `font-ja` | Shippori Antique 400 | 20–24 px: `text-xl` (20 px) di ponsel, `sm:text-2xl` (24 px) | Furigana 50%, jadi 10–12 px. Gaya アンチゴチ, dibuat mengikuti standar dialog manga. |
| Judul dan efek suara | `font-display` | Dela Gothic One 400 | **Minimal 28 px.** Utilitas bawaan terkecil yang memenuhi: `text-3xl` (30 px) | `text-2xl` (24 px) terlalu kecil |
| Teks Indonesia | `font-body` (bawaan `body`) | Literata, variabel, sumbu `opsz`, normal dan italic | 18 px, line-height 1,7 (bawaan `body`) | Lebar baris 60–70 karakter (riset). Halaman contoh memakai `max-w-[60ch]`. |
| Romaji | `italic` dengan `font-body` | Literata italic | Mengikuti teks | EYD: kata asing ditulis miring. Makron (ō, ū) tersedia lewat subset `latin-ext`. |
| UI (tombol, label, status) | `font-ui` | Atkinson Hyperlegible Next | Ditentukan di M4. Halaman contoh memakai ukuran bawaan `body` (18 px). | |

Semua font berlisensi SIL OFL.

### 4.2 Aturan bahasa dan kelas

- `<html lang="id">` sudah dipasang. **Setiap elemen berisi teks Jepang wajib punya `lang="ja"` dan `font-ja`** (atau `font-display` untuk judul Jepang).
  - `lang="ja"` mengaktifkan aturan line-height furigana dan memberi tahu browser serta pembaca layar bahwa teksnya bahasa Jepang.
  - Tanpa `font-ja`, teks Jepang memakai Literata. Literata tidak punya huruf Jepang, sehingga browser memakai font Jepang bawaan sistem.
- **Jangan memakai `font-bold`, `font-semibold`, atau `italic` pada `font-ja` dan `font-display`.** Kedua font hanya punya ketebalan 400. Aturan `font-synthesis: none` mencegah browser membuat tebal atau miring palsu, jadi kelas tersebut tidak berefek. Penekanan memakai ukuran, `font-display`, atau tone.
- `font-synthesis: none` dipasang pada kelas `.font-ja` dan `.font-display`. Kalau ada CSS khusus yang memakai font ini lewat `var()`, tambahkan `font-synthesis: none` sendiri.

### 4.3 Pemuatan font (sudah ada)

- Font dimuat dengan `next/font/google` di `src/app/layout.tsx`. File font diunduh saat build dan di-host sendiri, jadi browser pengunjung tidak menghubungi Google.
- Setiap font menjadi variabel CSS di `<html>` (`--font-shippori-antique`, `--font-dela-gothic-one`, `--font-literata`, `--font-atkinson-hyperlegible-next`), lalu dipetakan ke token di `@theme inline`. `inline` dipakai karena nilai token merujuk variabel lain.
- Font cadangan: `font-ja` → Hiragino Sans, Yu Gothic, Noto Sans JP, sans-serif. `font-display` → Hiragino Sans, Yu Gothic, sans-serif. `font-body` → Georgia, serif. `font-ui` → system-ui, sans-serif.
- Semua keluarga memuat subset `latin` dan `latin-ext`. `latin-ext` dibutuhkan untuk makron romaji dan untuk "Benkyō".
- **Maksimal 2 keluarga font Jepang per halaman.** Kuota ini sudah terpakai oleh Shippori Antique dan Dela Gothic One. Menambah keluarga Jepang ketiga, misalnya font tulisan tangan untuk catatan, butuh perubahan PRD §10.3. Alasannya, setiap keluarga Jepang memuat sekitar 12 potongan file per halaman materi (PRD §16).
- **Potongan kana dan kanji tidak di-preload.** Google membagi setiap font Jepang menjadi sekitar 120 potongan dengan `unicode-range`, yaitu deskriptor `@font-face` yang membuat browser hanya mengunduh potongan yang hurufnya dipakai. `next/font` tidak punya subset `japanese` dan hanya mem-*preload* (mengunduh lebih awal) potongan dari subset yang dikonfigurasi, yaitu Latin. Jangan menambah `<link rel="preload">` manual untuk font Jepang dan jangan mengubah `subsets`.
- `font-display: swap` adalah bawaan `next/font`. Efek yang diketahui: potongan kana dan kanji bisa tiba terpisah, sehingga font dalam satu kalimat berganti bertahap. `adjustFontFallback` tidak membantu untuk huruf Jepang.
- Atkinson Hyperlegible Next memakai `adjustFontFallback: false` karena `next/font` belum punya metrik font cadangan untuk font ini.
- Build bergantung pada `fonts.googleapis.com`. Kalau bermasalah, pemuatan bisa dialihkan ke `next/font/local` (PRD §16). Subset font Jepang otomatis di CI adalah P2 (setelah MVP).

### 4.4 Font yang tidak dipakai (PRD §10.3)

Bangers, Comic Neue (tidak punya huruf bermakron), Anime Ace/Blambot (lisensi webfont berbayar), Inter, Roboto, Geist, dan Space Grotesk.

## 5. Spasi dan tata letak

- **Skala dasar 4 px.** `--spacing` bawaan Tailwind (0.25rem = 4 px) tidak direset, jadi `p-1` = 4 px dan `p-4` = 16 px.
- Langkah yang disarankan riset:

  | px | 4 | 8 | 12 | 16 | 24 | 32 | 48 | 64 |
  |---|---|---|---|---|---|---|---|---|
  | Utilitas | `1` | `2` | `3` | `4` | `6` | `8` | `12` | `16` |

  Kelipatan 4 px lain masih termasuk skala (halaman contoh memakai `mt-10` = 40 px), tetapi utamakan langkah di tabel. Hindari spasi piksel arbitrer seperti `p-[13px]`. Padding persen di `SpeechBubble` adalah pengecualian karena mengikuti bentuk elips.
- **Kontainer halaman publik** (`src/app/(public)/layout.tsx`): `max-w-3xl` (768 px), gutter `px-4` (16 px) di ponsel dan `sm:px-6` (24 px) mulai 640 px, serta `py-8` / `sm:py-12`.
- **Layar 360 px ke atas, tanpa scroll horizontal di level halaman** (PRD §13). Elemen lebar seperti tabel digulir di dalam kontainernya sendiri (§10.6).
- **Area status progres dan tombol login (rencana, M4 dan M5):** dirender setelah halaman dimuat, di area berukuran tetap agar tata letak tidak bergeser (PRD §8.1). Target CLS (*Cumulative Layout Shift*, ukuran pergeseran tata letak) ≤ 0,1 (PRD §13).

## 6. Bentuk: sudut, garis, bayangan

- **Radius 0 di semua elemen.** Satu-satunya bentuk lengkung adalah balon dialog, dan lengkungnya digambar dengan SVG, bukan `border-radius`.
- **Tanpa `box-shadow` dalam bentuk apa pun**: bayangan lembut, bayangan offset, maupun `ring-*`. Kedalaman berasal dari tone, tumpukan elemen, dan tebal garis.
- Tebal garis:

  | Tebal | Dipakai untuk | Kelas |
  |---|---|---|
  | 3 px | Panel | `border-[3px] border-ink` |
  | 2 px | Garis balon; bingkai dalam panel | stroke `SpeechBubble`; `border-[2px] border-ink` |
  | 1 px | Garis pemisah daftar dan tabel | `border border-ink` (atau `border-t`/`border-b`) |

  Warna border bawaan Tailwind 4 adalah `currentColor`. Tetap tulis `border-ink` agar eksplisit.

## 7. Furigana

### 7.1 Markup

```tsx
<p lang="ja" className="font-ja text-xl sm:text-2xl">
  <ruby>日本語<rp>（</rp><rt>にほんご</rt><rp>）</rp></ruby>を
  <ruby>勉強<rp>（</rp><rt>べんきょう</rt><rp>）</rp></ruby>しています。
</p>
```

- Pakai elemen JSX `<ruby>`, `<rt>`, dan `<rp>` saja. Jangan memakai `<rb>` atau `<rtc>` (sudah usang di HTML) dan jangan memakai `dangerouslySetInnerHTML` (PRD §9.2).
- `<rp>` berisi kurung lebar penuh （ ）, sehingga browser tanpa dukungan ruby menampilkan 日本語（にほんご）.
- Okurigana (kana setelah kanji) berada di luar ruby: 勉強 di dalam ruby, しています di luar.
- Di M0, ruby ditulis manual di halaman contoh. Mulai M4, segmen ruby dihasilkan `build:content` dari token (PRD §9.2) lalu dirender oleh komponen. Nama dan lokasi komponen itu Ditentukan di M4. Furigana tidak pernah dihitung di browser.

### 7.2 Aturan CSS (sudah ada di `globals.css`)

| Aturan | Nilai | Alasan |
|---|---|---|
| Tinggi baris teks Jepang | `:lang(ja) { line-height: 2.2 }` | Ruby tidak ikut menambah tinggi baris (spesifikasi CSS Ruby), jadi ruangnya dicadangkan lewat line-height. Lihat selisih di §12. |
| Ukuran rt | `font-size: 0.5em` | Teks 20–24 px menghasilkan furigana 10–12 px |
| Tinggi baris rt | `line-height: 1` | Chromium memakai `normal` dan Gecko memakai `1`, jadi nilainya diseragamkan. Lihat §12. |
| Posisi | `ruby-position: over` | Furigana di atas teks horizontal |
| Seleksi | `user-select: none` | Supaya furigana tidak ikut tersalin. Belum diverifikasi lintas browser. |
| Toggle | `[data-furigana="off"] rt { visibility: hidden }` | Kotak rt tetap ada, jadi tidak ada pergeseran tata letak |
| Cetak | `@media print { rt { visibility: visible !important } }` | Furigana selalu tercetak walaupun toggle mati |

### 7.3 Aturan pemakaian

- **Jangan menyembunyikan furigana dengan `display: none`, kelas `hidden`, atau menghapus elemen.** Tata letak akan bergeser, dan lebar kata berubah kalau rt lebih lebar dari kanjinya.
- Teks Jepang berfurigana minimal 20 px (`text-xl`). Ukuran teks Jepang di dalam tabel: Ditentukan di M4.
- Atribut `data-furigana` bekerja di elemen leluhur mana pun. Elemen yang membawa atribut itu Ditentukan di M4.

### 7.4 Toggle dan preset (rencana, M4)

Dari PRD §8.3:

- Tiga toggle: **Furigana**, **Romaji**, **Terjemahan**. Berlaku untuk dialog, contoh, dan tabel. Romaji mati menyembunyikan kolom romaji; terjemahan mati menyembunyikan kolom arti.
- Terjemahan mati berarti tersembunyi, tetapi bisa dibuka per kalimat dengan klik.
- Preset: **Pemula** (semua aktif, bawaan kunjungan pertama), **Latihan membaca** (romaji mati), **Tantangan** (furigana dan romaji mati, terjemahan tersembunyi).
- Preferensi disimpan di `localStorage` dan diterapkan sebelum halaman tampil, lewat skrip kecil dari file statis, tanpa `dangerouslySetInnerHTML`.

### 7.5 Pembaca layar (catatan riset)

- Sebuah uji tahun 2026 (tingkat keyakinan sedang) menemukan dua perilaku. VoiceOver dengan Safari atau Chrome di macOS, NVDA dengan Chrome atau Edge, dan Narrator hanya membaca furigana. Semua kombinasi dengan Firefox, JAWS dengan Chrome, VoiceOver iOS, dan TalkBack membaca kanji dan furigana dua kali.
- `visibility: hidden` mengeluarkan rt dari pohon aksesibilitas. Saat furigana mati, pembaca layar hanya membaca teks dasarnya, jadi hasil suara saat toggle hidup dan mati berbeda.
- Uji pembaca layar NVDA + Chrome termasuk audit aksesibilitas M6 (PRD §13, §15).

## 8. Aksesibilitas

Target **WCAG 2.2 AA** (PRD §13). Pengujian: axe-core tanpa pelanggaran di 5 halaman utama, checklist keyboard manual, dan satu uji pembaca layar NVDA + Chrome. Audit dilakukan di M6.

- **Kontras teks minimal 4,5:1**, jadi warna teks hanya `ink`, `ink-2`, atau `ink-3` (§3).
- **Batas komponen interaktif minimal 3:1** (WCAG 1.4.11), memakai `ink`, `ink-2`, atau `ink-3`.
- **Teks tidak pernah langsung di atas screentone** atau pola lain. Teks selalu berada di knockout putih (§3.4).
- **Status tidak pernah ditunjukkan hanya lewat bentuk, pola, atau tone.** Selalu ada teks:
  - Benar atau salah: "○ Benar" / "× Salah" (PRD §8.5). ○ adalah tanda benar dalam konvensi Jepang, sedangkan pelajar Indonesia terbiasa dengan ✓. Tanpa teks, ○ bisa membingungkan.
  - Progres: "Belum", "Sedang", "Selesai" (PRD §7).
  - Sel tabel kata kerja untuk bentuk yang muncul di dialog: penanda teks (PRD §8.2.1).
  - Tokoh: nama selalu ditulis. Penanda tone hanya pelengkap.
- **Focus ring** (sudah ada): `:focus-visible` dengan `outline: 3px solid` warna `ink` dan `outline-offset: 2px`. Jangan memakai `outline-none` atau `outline-hidden` tanpa pengganti yang setara, dan jangan menggantinya dengan `ring-*`.
- **Bahasa:** `lang="ja"` di setiap teks Jepang (§4.2).
- **SVG dekoratif** diberi `aria-hidden="true"`. Teks selalu berupa HTML, bukan `<text>` SVG atau gambar.
- Teks yang hanya untuk pembaca layar memakai `sr-only`, misalnya judul "Contoh dialog" di halaman contoh.
- **Gerak:** tidak ada animasi saat scroll. Garis fokus statis.
- **Responsif:** 360 px ke atas, tanpa scroll horizontal di level halaman.

## 9. Komponen yang sudah ada

### 9.1 `SpeechBubble`

File: `src/components/manga/speech-bubble.tsx`

```tsx
type SpeechBubbleProps = { children: ReactNode; className?: string };
```

Cara kerja:

- Elips dan ekor digambar dalam **satu path SVG**, supaya garis tepinya menyambung tanpa celah di pangkal ekor (PRD §10.4).
- `viewBox="0 0 100 60"` dengan `preserveAspectRatio="none"`, jadi bentuknya diregangkan mengikuti ukuran isi.
- `vectorEffect="non-scaling-stroke"` menjaga garis tetap 2 px walaupun bentuk diregangkan.
- `fill="var(--color-white)"`, `stroke="var(--color-ink)"`, `strokeLinejoin="round"`.
- SVG memakai `aria-hidden="true"`. Isi balon adalah `children` HTML biasa yang diletakkan di atas SVG.
- Padding `px-[14%] pt-[6%] pb-[14%]` menjaga isi tetap di dalam elips dan di atas ekor. Padding persen dihitung dari **lebar** kontainer, termasuk padding atas dan bawah (aturan CSS).
- Ekor selalu di kiri bawah. Belum ada prop untuk arah atau posisi ekor. Variasinya, misalnya untuk tokoh di sisi kanan, Ditentukan di M4.

Pemakaian:

```tsx
<SpeechBubble className="max-w-md">
  <p lang="ja" className="font-ja text-xl sm:text-2xl">…</p>
</SpeechBubble>
```

Aturan:

- Atur lebar lewat `className` (`max-w-*`). Jangan menambah border, latar, `rounded-*`, atau bayangan pada balon.
- Isi balon adalah teks Jepang dengan `font-ja`. Di halaman contoh, romaji dan terjemahan berada di luar balon. Susunan finalnya Ditentukan di M4.
- Balon boleh diletakkan di atas tone karena isinya putih dan berfungsi sebagai knockout.
- Uji di 360 px dengan kalimat terpanjang. Bentuk ikut memanjang mengikuti isi, jadi pastikan teks tidak menyentuh garis. Sebagai acuan, di 360 px kalimat contoh terbungkus menjadi 2 baris dan balonnya berukuran sekitar 254 × 144 px (diukur di Chromium, 22 Okt 2026).

### 9.2 Pola panel di halaman contoh (belum berupa komponen)

```tsx
<div className="border-[3px] border-ink bg-white p-4 sm:p-6">
  <div className="tone-10 border-[2px] border-ink p-4 sm:p-8">
    <SpeechBubble className="max-w-md">…</SpeechBubble>
  </div>
  <p className="mt-4 italic">Nihongo o benkyō shite imasu.</p>
  <p className="text-ink-2">Saya sedang belajar bahasa Jepang.</p>
</div>
```

Ini hanya contoh M0. Komponen panel dibuat di M4 (§10.1).

## 10. Komponen rencana

### 10.1 Panel / koma (rencana, M4)

- Garis 3 px, radius 0, tanpa bayangan (PRD §10.4).
- Panel tersusun dari atas ke bawah (D6).
- Lokasi: `src/components/manga` (PRD §11.5).
- Jarak antarpanel: Ditentukan di M4.

### 10.2 Balon teriak (rencana, M4)

- Untuk ucapan yang diteriakkan. Riset menyarankan bentuk semburan SVG dengan Dela Gothic One. Bentuk dan font Ditentukan di M4.
- Kalau memakai `font-display`, batas minimal 28 px berlaku. Teks berkanji tetap butuh furigana, jadi ukuran ini juga harus muat di layar 360 px.
- Aturan yang sama dengan `SpeechBubble`: SVG `aria-hidden`, isi berupa teks HTML, latar putih.

### 10.3 Penanda tone tokoh (rencana, M4)

- PRD §8.2 B: setiap tokoh punya penanda pola tone yang dipakai di kartu tokoh dan di balon dialognya.
- Penanda memakai `tone-10`, `tone-30`, atau `tone-60`, dan tidak diletakkan di bawah teks.
- **Materi 1 punya 4 tokoh, sedangkan screentone hanya punya 3 kepadatan.** Cara membedakan tokoh keempat Ditentukan di M4.
- Nama tokoh selalu tampil sebagai teks di setiap giliran (PRD §8.2 C). Penanda tone tidak boleh menjadi satu-satunya pembeda.
- Pemetaan tokoh ke tone ditulis sebagai string kelas utuh, misalnya `"tone-30"`, bukan dirangkai (§3.2). Sumber pemetaan (file konten atau kode) Ditentukan di M4.

### 10.4 Garis fokus / 集中線 (rencana, M4)

- Garis-garis yang memusat ke satu titik untuk menandai momen penting. Statis dan maksimal satu kali per materi (PRD §10.4).
- Teknik pembuatannya Ditentukan di M4. Riset menyebut dua pilihan: beberapa lapis `repeating-conic-gradient` dengan bagian tengah dipotong `mask-image`, atau SVG.
- Tidak dianimasikan. Teks tidak diletakkan langsung di atasnya, dengan alasan kontras yang sama seperti tone.

### 10.5 Penanda ○/× pada soal (rencana, M4)

- Setelah menjawab, pengguna melihat "○ Benar" atau "× Salah", selalu dengan teks, beserta penjelasan singkat (PRD §8.5).
- Tidak memakai warna (tidak ada hijau atau merah). Pembedanya adalah simbol dan teks.
- Lokasi: `src/components/quiz` (PRD §11.5).

### 10.6 Tabel di ponsel (rencana, M4)

- PRD §8.2.1: tabel bisa digulir horizontal di dalam kontainernya, dan kolom bentuk kamus tetap terlihat saat tabel digulir. Halaman tetap tanpa scroll horizontal.
- Toggle romaji mati menyembunyikan kolom romaji, dan toggle terjemahan mati menyembunyikan kolom arti (PRD §8.3).
- Sel bentuk yang muncul di dialog diberi penanda teks, bukan hanya tone atau ketebalan. Bunyi penandanya Ditentukan di M4.
- Garis tabel 1 px `ink` (§6). Ukuran teks Jepang dan furigana di sel Ditentukan di M4.

## 11. Larangan

### 11.1 Dari PRD

- Gradien dan warna apa pun, termasuk teks bergradien dan utilitas `bg-linear-*`, `bg-radial-*`, `bg-conic-*` di luar screentone.
- Glassmorphism (panel tembus pandang dengan blur), termasuk `backdrop-blur-*`.
- Emoji atau ikon *sparkle* (bintang berkilau).
- Hero dengan blob.
- Hero dengan tiga kartu ikon.
- Hero pemasaran di beranda. Beranda langsung masuk ke daftar materi dengan satu paragraf penjelasan (PRD §8.1).
- Kartu membulat dengan bayangan lembut.
- Bayangan offset (bayangan keras yang digeser).
- Label huruf kapital di atas judul.
- Animasi *fade-up* saat scroll.
- Pola grid dekoratif.
- Kata pemasaran: "unlock", "journey", "seamless", "tingkatkan potensimu".
- Font: Bangers, Comic Neue, Anime Ace/Blambot, Inter, Roboto, Geist, Space Grotesk.
- Dark mode dan varian `dark:` (D5).
- Radius selain pada balon, dan `box-shadow` dalam bentuk apa pun, termasuk `ring-*` (§6).
- Teks langsung di atas screentone (PRD §10.1).
- Status yang hanya ditunjukkan lewat bentuk, pola, atau tone (§8).
- Lebih dari 2 keluarga font Jepang per halaman, atau preload potongan font Jepang (PRD §10.3).
- `font-display` di bawah 28 px (PRD §10.3).
- `dangerouslySetInnerHTML` untuk ruby atau skrip preferensi (PRD §8.3, §9.2).
- Garis fokus lebih dari satu kali per materi, atau yang beranimasi (PRD §10.4).

### 11.2 Disarankan riset, belum diputuskan

Riset desain menandai pola berikut sebagai ciri desain buatan AI. PRD belum melarangnya secara eksplisit. Keputusannya: **Ditentukan di M4**, saat review desain (PRD §16).

- Garis tepi samping yang tebal atau berwarna sebagai aksen.
- Penomoran dekoratif "01 / 02 / 03" selain untuk langkah materi yang nyata.
- Tanda "→" pada tautan, dan deretan keterangan meta yang dipisah "·".
- Easing memantul (*bounce*).
- Glyph Unicode sebagai ikon. ○ dan × untuk penilaian tidak termasuk, karena keduanya tanda penilaian dan selalu disertai teks.
- Font monospace untuk romaji.
- Font lain yang dinilai terlalu umum atau berkesan gimik: Plus Jakarta Sans, Fraunces, Kalam, Patrick Hand, Rampart One.
- Kata pemasaran lain seperti "supercharge".

## 12. Selisih implementasi saat ini

Dicek pada 22 Okt 2026 dengan `getComputedStyle` di Chromium (server dev lokal) dan dengan membaca kode. Belum diperbaiki saat dokumen ini ditulis.

1. **Line-height teks Jepang tertimpa utilitas ukuran.** Utilitas `text-xl` dan `text-2xl` juga menetapkan line-height, dan layer `utilities` menang atas `@layer base`. Akibatnya `<p lang="ja" class="font-ja text-xl">` mendapat line-height 28 px, bukan 44 px (2,2 × 20 px). Di Chromium, baris yang berisi ruby tetap setinggi 44 px karena browser menambah ruang untuk rt (lihat poin 2), tetapi baris tanpa ruby hanya 28 px. Jarak baris dialog bisa jadi tidak rata. Firefox dan Safari belum diuji. Salah satu cara memperbaikinya adalah menambah `leading-[2.2]` pada elemen Jepang.
2. **Line-height rt tertimpa `:lang(ja)`.** Selektor `:lang(ja)` (spesifisitas setara kelas) mengalahkan selektor `rt` (spesifisitas elemen) di layer yang sama. Akibatnya rt di dalam elemen `lang="ja"` mendapat line-height 22 px (2,2 × 10 px), bukan 10 px. Salah satu cara memperbaikinya adalah memakai selektor `:lang(ja) rt`. Poin 1 dan 2 saling terkait, jadi perbaiki bersamaan lalu uji ulang di Chromium dan Firefox.
3. **Judul `font-display` di bawah 28 px.** `<h2 id="daftar-materi" className="font-display text-2xl">` di `src/app/(public)/page.tsx` berukuran 24 px, sedangkan batas PRD §10.3 adalah minimal 28 px. Pilihannya: naikkan ke `text-3xl` (30 px), atau pakai font lain untuk subjudul.

## 13. Checklist komponen baru

- [ ] Hanya memakai token: `bg-paper`, `bg-white`, `text-ink`, `text-ink-2`, `text-ink-3`, `border-ink`, `bg-tone-*`, `tone-10/30/60`. Tidak ada warna arbitrer.
- [ ] Tidak ada `rounded-*`, `shadow-*`, `ring-*`, gradien, atau blur.
- [ ] Teks Jepang memakai `lang="ja"` dan `font-ja`, minimal 20 px, dengan furigana lewat `<ruby>`.
- [ ] `font-display` hanya dipakai di ukuran 28 px ke atas.
- [ ] Tidak ada teks langsung di atas tone atau garis fokus.
- [ ] Setiap status punya teks.
- [ ] Bisa dipakai dengan keyboard, dan focus ring terlihat.
- [ ] Spasi memakai kelipatan 4 px.
- [ ] Dicek di 360 px tanpa scroll horizontal di level halaman.
- [ ] Nama kelas dan variabel CSS ditulis utuh, tidak dirangkai.
- [ ] SVG dekoratif memakai `aria-hidden="true"`.
