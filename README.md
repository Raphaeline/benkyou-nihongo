# Benkyō Nihongo

Website latihan percakapan bahasa Jepang sehari-hari (*kaiwa* / 会話) untuk level JLPT N5–N4, dengan furigana, romaji, dan terjemahan bahasa Indonesia. Tampilan bergaya manga cetak: hitam, putih, dan abu-abu.

Status: **M0 — Fondasi**. Rencana lengkap ada di [docs/PRD.md](docs/PRD.md).

## Stack

Next.js 16 (App Router), React 19, Tailwind CSS 4, Supabase (PostgreSQL + Auth), Vercel. Node.js 24.

## Menjalankan lokal

```bash
npm install
cp .env.example .env.local   # isi nilainya sendiri; belum dibutuhkan di M0
npm run dev
```

Buka http://localhost:3000.

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Server development |
| `npm run build` | Build produksi |
| `npm run start` | Menjalankan hasil build |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate tipe route, lalu `tsc --noEmit` |

Perintah konten (`validate:content`, `seed:content`, dan lain-lain) ditambahkan di M1–M2.

## Dokumentasi

| File | Isi |
|---|---|
| [docs/PRD.md](docs/PRD.md) | Kebutuhan produk, keputusan, dan milestone |
| [docs/CONTENT_SPEC.md](docs/CONTENT_SPEC.md) | Aturan penulisan materi |
| [docs/CONTENT_WORKFLOW.md](docs/CONTENT_WORKFLOW.md) | Alur draf, validasi, review, dan rilis materi |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Alur data dan keputusan teknis |
| [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | Token, tipografi, dan komponen manga |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Setup GitHub, Vercel, dan Supabase |
| [docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md) | Branch, PR, dan format commit |
