# Arsitektur — Benkyō Nihongo

| | |
|---|---|
| Status | M0 (fondasi) sedang berjalan |
| Tanggal | 22 Oktober 2026 |
| Acuan | `docs/PRD.md` v0.2, terutama §5, §11, dan §12 |
| Dokumen terkait | `docs/DEPLOYMENT.md` (langkah setup), `docs/CONTENT_SPEC.md`, `docs/DESIGN_SYSTEM.md`, `docs/GIT_WORKFLOW.md` |

Dokumen ini menjabarkan detail teknis dari keputusan di PRD: alur data, cara halaman dirender, skema database, auth, struktur folder, dan versi stack. Keputusannya sendiri tetap bersumber dari PRD. Bagian yang belum dibangun ditandai **(rencana, M\<n\>)**. Hal yang belum diputuskan ditulis "Ditentukan di M\<n\>".

**Status implementasi saat ini**

| Bagian | Status |
|---|---|
| Next.js, Tailwind dan token desain, font, halaman contoh | Sudah ada (M0) |
| CI dasar: `ci.yml` dengan lint, typecheck, build, dan `release-gate` (cek branch asal) | Sudah ada (M0) |
| Dependabot | Sudah ada (M0) |
| Pipeline konten (skema, validator, conjugator, romaji, furigana) | Rencana, M1 |
| Database konten, seed, `deploy-staging.yml` | Rencana, M2 |
| Halaman materi, toggle, progres lokal | Rencana, M4 |
| Login, sinkronisasi progres, hapus akun | Rencana, M5 |
| Project produksi, `deploy-production.yml` | Rencana, M6 |

---

## 1. Ringkasan keputusan

### 1.1 D1-A: isi materi di database, halaman dibangun statis dari database

Isi materi ditulis sebagai JSON di repo (K4), di-*seed* ke tabel PostgreSQL di Supabase, lalu halaman dibangun statis dengan membaca database **saat build**. *Seed* artinya mengisi database dari file di repo.

Konsekuensi:

- Repo tetap sumber kebenaran. Database adalah salinan yang diisi `seed:content`, dan kesamaannya dengan repo dibuktikan lewat `content_hash` per materi.
- Database hanya dibaca saat build. Pengunjung menerima HTML statis dari CDN Vercel, sehingga situs yang sudah ter-deploy tetap bisa dibaca walaupun Supabase sedang di-*pause*.
- Build gagal kalau Supabase sedang di-*pause*. Pemulihannya: pulihkan project dari dashboard Supabase, lalu jalankan ulang workflow.
- Urutan *migrate → seed → deploy* harus dijamin. Karena itu deploy staging dan produksi dipicu GitHub Actions lewat Vercel Deploy Hook, bukan oleh integrasi Git Vercel (§2.4).
- Konten baru hanya tampil lewat build baru. Konten tidak dibaca dari database saat runtime.

### 1.2 D9: satu project Supabase sampai M6

M2–M5 hanya memakai project `benkyou-staging`. Project `benkyou-prod` dibuat di M6.

Konsekuensi:

- `main` belum di-deploy ke produksi dengan database sampai M6. `deploy-production.yml` dan GitHub Environment `production` baru dibuat di M6.
- Konten staging yang belum direview tidak tercampur dengan konten produksi.
- Preview untuk branch fitur membaca database staging.
- Project gratis kedua masih tersedia selama tidak ada project aktif lain milik pemilik.
- Batasan Free tier berlaku untuk kedua project: tidak ada backup, dan project bisa di-*pause* setelah 7 hari tanpa aktivitas. Tidak dibuat cron *keep-alive*.

### 1.3 D2: login dengan Google OAuth saja

Konsekuensi:

- Tidak perlu SMTP sendiri. Magic link ditunda, karena layanan email bawaan Supabase hanya mengirim 2 email per jam, hanya ke anggota tim project, dan tidak ditujukan untuk produksi.
- OAuth consent screen di Google Cloud harus berstatus **"In production"**. Dalam status "Testing", hanya pengguna uji yang bisa login.
- Scope dibatasi `openid`, `email`, dan `profile`, sehingga tidak perlu verifikasi Google.
- Layar login Google menampilkan domain `<ref>.supabase.co`, karena custom domain Supabase hanya tersedia di paket berbayar (A1).
- Satu OAuth client memuat callback setiap project Supabase.
- Login tidak didukung di URL preview PR. Login hanya berjalan di localhost, staging, dan produksi.

Keputusan lain yang memengaruhi arsitektur: K5 (login opsional, progres tanpa login disimpan di browser), K8 (nilai secret diisi sendiri oleh pemilik), D8 (repo publik), dan A1 (anggaran Rp0: Vercel Hobby, Supabase Free, GitHub Free).

---

## 2. Alur data

Diagram dari PRD §11.2:

```
PR ke staging:
  CI  ── validate:content, check:dictionary, check:ids, test, lint, typecheck
      ── supabase start (lokal di runner) → migrasi → seed:content dari PR
      ── next build terhadap database lokal

Push ke staging (setelah merge):
  deploy-staging.yml ── supabase db push → seed:content → verifikasi content_hash
                    ── Vercel Deploy Hook → next build membaca Supabase → CDN

Push ke main (mulai M6, setelah project produksi ada):
  deploy-production.yml ── sama, ke project produksi; hanya materi reviewed dipublikasikan

Browser: progres → localStorage ──(login)──► Supabase user_progress (RLS, RPC)
```

### 2.1 CI di setiap PR (`ci.yml`)

**Sudah ada (M0).** `ci.yml` berjalan pada PR dan push ke `staging` dan `main`, dengan Node.js 24, izin token `contents: read`, dan `concurrency` per ref (run lama dibatalkan jika ada run baru di ref yang sama).

| Job | Isi saat ini |
|---|---|
| `ci` | `npm ci`, `npm run lint`, `npm run typecheck`, `npm run build` |
| `release-gate` | Hanya untuk PR dengan base `main`. Gagal jika branch asal bukan `staging` atau `hotfix/*`. |

**(rencana, M1)** Job `ci` ditambah `validate:content`, `check:dictionary`, `check:ids`, dan `test`. `release-gate` ditambah cek bahwa semua warning pada materi berstatus `reviewed` sudah diakui di `content/acks/`.

**(rencana, M2)** Job `ci` menjalankan Supabase lokal: `supabase start` menjalankan PostgreSQL, Auth, dan API Supabase di dalam Docker pada runner GitHub. Urutannya: migrasi, uji RLS dengan pgTAP, `seed:content` dari isi PR, lalu `next build` terhadap database lokal itu. Dengan cara ini, materi dari PR yang belum di-merge sudah dibangun dan diuji tanpa menyentuh database staging. CI juga tidak terpengaruh saat project Supabase di-*pause*.

### 2.2 Deploy staging (`deploy-staging.yml`) (rencana, M2)

Berjalan pada push ke `staging`, memakai secret dan variable dari GitHub Environment `staging`:

1. `supabase db push` menerapkan migrasi ke `benkyou-staging`. Supabase CLI dipasang dengan `supabase/setup-cli@v3`. Koneksi lewat *pooler*, yaitu alamat koneksi perantara Supabase yang bisa diakses lewat IPv4, karena runner GitHub tidak mendukung IPv6. Connection string pooler diverifikasi saat setup M2.
2. `seed:content` melakukan *upsert* (sisipkan atau perbarui) seluruh isi materi dengan secret key. Seed bersifat idempoten: menjalankannya dua kali tidak mengubah apa pun.
3. Verifikasi `content_hash`: hash per materi di database harus sama dengan hash dari repo.
4. Workflow memanggil `VERCEL_DEPLOY_HOOK_URL`. Vercel menjalankan `next build`, build membaca Supabase, lalu hasilnya disajikan dari CDN.

Workflow memakai `concurrency` per lingkungan, sehingga dua deploy staging tidak berjalan bersamaan.

### 2.3 Deploy produksi (`deploy-production.yml`) (rencana, M6)

Langkahnya sama dengan staging, tetapi ke project `benkyou-prod` dan GitHub Environment `production`. Hanya materi berstatus `reviewed` yang dipublikasikan. Materi `ai-draft` boleh ada di `main`, tetapi tidak tampil di produksi. Cara seed menentukan kolom `published` di produksi: Ditentukan di M6.

### 2.4 Integrasi Git Vercel

- **M0:** deploy Git otomatis Vercel masih aktif. Halaman contoh tampil di URL Vercel (kriteria selesai M0).
- **(rencana, M2)** Deploy otomatis untuk `staging` dimatikan lewat `git.deploymentEnabled` di `vercel.json`, bersamaan dengan dibuatnya Deploy Hook staging.
- **(rencana, M4)** Deploy otomatis untuk `main` juga dimatikan. Bentuk akhirnya:

  ```json
  {
    "git": {
      "deploymentEnabled": { "staging": false, "main": false }
    }
  }
  ```

- Alasannya: jika Vercel dan GitHub Actions sama-sama mulai saat push, build bisa membaca database sebelum seed selesai. Dengan Deploy Hook, build selalu dimulai setelah migrasi dan seed selesai.
- Pakai `git.deploymentEnabled`, bukan properti lama `github.enabled`. Dokumentasi Vercel menyebut Deploy Hook tidak terpicu jika `github.enabled = false`.
- Dokumentasi Vercel tidak menyatakan secara eksplisit bahwa Deploy Hook tetap berjalan untuk branch yang `deploymentEnabled`-nya `false`. Ini perlu diuji saat setup M2.
- Branch fitur tetap di-deploy otomatis sebagai preview dan membaca database staging. Isi materi dari PR yang belum di-merge tidak tampil di preview; materi itu baru tampil di staging setelah merge.
- Jika kode yang membaca database saat build masuk `main` sebelum deploy otomatis `main` dimatikan, build produksi untuk commit itu gagal, karena variabel lingkungan Production di Vercel belum berisi project Supabase mana pun (D9). Deployment yang lama tetap tayang.
- Vercel Hobby hanya menjalankan satu build pada satu waktu.

### 2.5 Progres di browser

- **(rencana, M4)** Setiap perubahan progres ditulis lebih dulu ke `localStorage` dengan kunci `bn:progress:v1`.
- **(rencana, M5)** Setelah login, progres lokal digabung ke tabel `user_progress` lewat fungsi `merge_progress` yang dipanggil sebagai RPC. RPC di sini berarti memanggil fungsi database lewat API Supabase. Sinkronisasi diulang otomatis jika gagal. Setelah digabung, salinan anonim di browser dikosongkan. Saat logout, salinan progres milik akun dihapus dari browser.

### 2.6 Saat Supabase di-*pause*

| Bagian | Dampak |
|---|---|
| Situs yang sudah ter-deploy | Tetap berjalan, karena halamannya statis |
| CI di PR | Tidak terpengaruh, karena memakai Supabase lokal (mulai M2) |
| Deploy staging, deploy produksi, dan preview | Build gagal |
| Login dan sinkronisasi progres | Gagal. Area login menampilkan "Login sedang tidak tersedia. Progres tetap tersimpan di browser ini." Sinkronisasi diantrekan dan tidak ada data lokal yang dihapus. |
| Pemulihan | Pulihkan project dari dashboard Supabase, lalu jalankan ulang workflow |

### 2.7 Aturan migrasi

- Migrasi harus kompatibel dengan kode yang sedang live: tambah dulu, pakai di rilis berikutnya, hapus di rilis setelahnya.
- Free tier tidak punya backup. Setiap migrasi diuji di CI (`supabase db reset` pada Supabase lokal) dan di staging lebih dulu.
- Konten selalu bisa di-seed ulang dari repo. Yang berisiko hilang adalah progres pengguna.

---

## 3. Rendering

### 3.1 Konfigurasi yang sudah aktif (M0)

`next.config.ts`:

| Opsi | Nilai | Fungsi |
|---|---|---|
| `cacheComponents` | `true` | Mengaktifkan Cache Components. Data harus di-cache dengan `'use cache'` atau dirender per request. Route tidak boleh lagi mengekspor `dynamic`, `revalidate`, atau `fetchCache`. |
| `partialPrefetching` | `true` | Link mem-*prefetch* satu "App Shell" statis per route, bukan per link. Opsi ini membutuhkan `cacheComponents`. |
| `reactCompiler` | `true` | React Compiler (`babel-plugin-react-compiler`) menambahkan memoisasi otomatis, sehingga `useMemo` dan `useCallback` manual umumnya tidak diperlukan. |
| `turbopack.rules["*.css"]` | loader `@tailwindcss/turbopack` | Tailwind diproses oleh loader Turbopack. Repo tidak memakai `postcss.config`. |

Catatan lain:

- Turbopack adalah bundler bawaan untuk `next dev` dan `next build`. Konfigurasi webpack kustom membuat build gagal.
- `next lint` sudah dihapus dan `next build` tidak lagi menjalankan lint. `npm run lint` menjalankan `eslint` langsung.
- `npm run typecheck` menjalankan `next typegen && tsc --noEmit`. `next typegen` menghasilkan tipe global `PageProps<'/route'>` dan `LayoutProps<'/route'>`, yang sudah dipakai di `src/app/layout.tsx` dan `src/app/(public)/layout.tsx`.

### 3.2 `ensureStatic = 'navigation'` di layout `(public)` (sudah ada)

`src/app/(public)/layout.tsx` mengekspor `export const ensureStatic = "navigation"`. Folder `(public)` adalah *route group*: nama folder dalam kurung tidak menjadi bagian URL, jadi `src/app/(public)/page.tsx` disajikan di `/`.

Nilai `'navigation'` mewajibkan seluruh output server untuk route di bawah layout ini dihasilkan saat prerender (saat build). Aturan ini berlaku untuk beranda sekarang, dan nanti untuk `materi/[slug]`, `review`, dan `tentang`. Validasinya berjalan di `next dev` dan `next build`. Build gagal jika ada:

- data yang tidak di-cache, misalnya query database atau `fetch` tanpa `'use cache'`, atau pemanggilan `connection()`;
- `cookies()`, `headers()`, atau `searchParams` di sisi server;
- `'use cache'` dengan `cacheLife` yang `expire`-nya di bawah 5 menit, `stale`-nya di bawah 30 detik, atau `revalidate`-nya 0;
- promise berisi data per request yang dikirim ke Client Component.

Aturan yang sama berlaku untuk `generateMetadata` dan `generateViewport`. Untuk melihat detail error, jalankan `next build --debug-prerender`.

Konsekuensi untuk milestone berikutnya:

- **(rencana, M4)** `materi/[slug]` wajib mengekspor `generateStaticParams()` yang mengembalikan minimal satu set parameter lengkap.
- **(rencana, M5)** Route yang membaca cookie (`/akun`, `/auth/callback`) harus berada di luar `(public)`, sesuai struktur folder §6.

### 3.3 Membaca database saat build (rencana, M2 dan M4)

- Halaman publik membaca Supabase lewat klien `@supabase/supabase-js` **tanpa cookie dan tanpa sesi**, dengan `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Pembacaan dilakukan di dalam fungsi bertanda `'use cache'`. Fungsi `'use cache'` tidak boleh memanggil `cookies()` atau `headers()`, termasuk lewat fungsi bantu yang dipanggilnya (error `next-request-in-use-cache`). Karena itu klien server `@supabase/ssr` yang memakai cookie tidak boleh dipakai di sini.
- *Publishable key* tunduk pada RLS, sehingga build hanya bisa membaca materi yang `published`.
- Entri `'use cache'` memakai build ID sebagai bagian kunci cache, sehingga tidak terbawa ke deployment berikutnya. Konten baru datang dari build baru, sesuai §1.1.
- Variabel `NEXT_PUBLIC_*` ditanam ke bundle JavaScript saat `next build`. Setiap lingkungan Vercel (Production dan Preview untuk `staging`) membutuhkan nilainya sendiri saat build.
- Lokasi kode: `src/lib/supabase` dan `src/lib/content`. Nama file: Ditentukan di M2.

### 3.4 State yang hanya ada di browser (rencana, M4 dan M5)

- Status progres per materi, area login, dan status tombol toggle bergantung pada data di browser. Data ini tidak ikut dirender saat build.
- Hasil prerender berisi placeholder berukuran tetap di posisi elemen tersebut. Isinya diisi setelah komponen terpasang di browser (*after mount*). Dengan begitu halaman tetap statis dan tata letak tidak bergeser (target CLS ≤ 0,1, PRD §13).
- `localStorage` tidak pernah dibaca saat render di server.
- Mekanisme teknis pengisian setelah mount: Ditentukan di M4.

### 3.5 Preferensi toggle sebelum halaman tampil (rencana, M4)

- Preferensi Furigana, Romaji, Terjemahan, dan preset disimpan di `localStorage`.
- Sebuah skrip kecil dari **file statis** dijalankan sebelum halaman pertama kali digambar. Skrip membaca `localStorage`, lalu memasang atribut `data-*` pada elemen akar. CSS menyembunyikan elemen berdasarkan atribut itu. Skrip tidak disisipkan sebagai string inline, dan tidak memakai `dangerouslySetInnerHTML`.
- Aturan CSS untuk furigana sudah ada di `src/app/globals.css`: `[data-furigana="off"] rt { visibility: hidden; }`. `visibility: hidden` tetap menyisakan ruang furigana, sehingga tidak ada pergeseran tata letak. Saat dicetak, furigana selalu ditampilkan.
- Jika `localStorage` tidak bisa dibaca, berlaku preset bawaan Pemula.
- Lokasi dan nama file skrip, nama atribut untuk romaji dan terjemahan, cara memuat skrip, serta cara menghindari peringatan *hydration mismatch* dari React karena atribut dipasang sebelum React berjalan: Ditentukan di M4.

### 3.6 Furigana dan font

- Furigana dirender sebagai elemen JSX `<ruby>`, `<rt>`, dan `<rp>` dari segmen yang sudah dihitung `build:content` (M1). Furigana tidak dihitung saat runtime.
- Font dimuat dengan `next/font/google` di `src/app/layout.tsx`: Shippori Antique, Dela Gothic One, Literata, dan Atkinson Hyperlegible Next. Hanya subset Latin (`latin`, `latin-ext`) yang di-*preload*. Potongan kana dan kanji di-host sendiri dan dimuat sesuai `unicode-range`.
- `next/font/google` mengunduh font dari Google saat build, jadi build bergantung pada `fonts.googleapis.com` (PRD §16). Detail tipografi ada di `docs/DESIGN_SYSTEM.md`.

---

## 4. Database (diterapkan ke `benkyou-staging` pada 22 Okt 2026)

Semua tabel dibuat lewat migrasi di `supabase/migrations`:

- `20261022000001_content_schema.sql`: tabel konten, view Review, RLS, dan GRANT.
- `20261022000002_user_progress.sql`: `user_progress`, `merge_progress`, dan `delete_my_account`.

Migrasi diuji dengan `npm run test:db` (§4.6).

### 4.1 Tabel konten

| Tabel | Isi |
|---|---|
| `lessons` | Materi: ID `L001`, slug, level, judul (token), situasi, tujuan, panduan membaca, `review_status`, `published`, `content_hash` |
| `characters` | Tokoh per materi, dengan tingkat kesopanan bawaan (`teineigo` / `futsuu` / `campuran`) dan catatannya |
| `turns` | Giliran bicara (`main` atau `variation`) |
| `sentences` | Kalimat (ID `L001.main.03.2`): token, segmen ruby, teks polos, romaji, terjemahan, catatan |
| `lexemes` | Entri kosakata lintas materi (unik per kata dan bacaan) |
| `lesson_vocabulary` | Kosakata per materi, dengan kalimat pertama kemunculannya dan contoh |
| `verbs`, `lesson_verbs` | Kata kerja (kelas JMdict, kelompok 1–3, bentuk hasil conjugator) dan pemakaiannya per materi (`utama` / `tambahan`, bentuk di dialog) |
| `grammar_points`, `lesson_grammar` | Pola (ID stabil, misalnya `kara-asal`) dan pemakaiannya per materi, dengan kalimat contoh dari dialog |
| `expressions`, `lesson_expressions` | Ungkapan beserta perbandingan formal/kasual dan bentuk alternatif |
| `quizzes`, `questions` | Set soal (`L001.quiz`) dan soal (`comprehension`, `vocabulary`, `completion`, `conjugation`) |
| `drills`, `glossary` | Drill substitusi dan glosarium dialog variasi |

- Tabel konten hanya ditulis oleh `seed:content` dengan secret key (`service_role`).
- View `review_vocabulary`, `review_verbs`, dan `review_grammar` dibuat dengan `security_invoker = true`, sehingga RLS pemanggil tetap berlaku dan view hanya menggabungkan materi `published`.
- Penanganan baris yang dihapus dari repo saat seed: ditentukan saat `seed:content` ditulis. ID yang dirujuk progres (`L001`, `L001.quiz`) beku setelah rilis dan dijaga `check:ids`.

### 4.2 `user_progress`

| Kolom | Isi |
|---|---|
| `user_id` | ID pengguna Supabase Auth, *on delete cascade* |
| `item_type` | `lesson` atau `quiz` |
| `item_id` | `L001` untuk materi, `L001.quiz` (atau `L001.quiz.2`) untuk set soal. Formatnya dicek dengan CHECK. |
| `status` | `started` (Sedang) atau `completed` (Selesai). Status "Belum" berarti barisnya tidak ada. |
| `first_score`, `best_score` | 0–5 |
| `attempts` | ≥ 0 |
| `updated_at` | Diisi server |

Primary key `(user_id, item_type, item_id)`.

### 4.3 Fungsi database

**`merge_progress(items jsonb)`** (`security invoker`, `search_path` kosong)

- Menolak pemanggil yang belum login, dan menolak input yang bukan array atau berisi lebih dari 500 item.
- Aturan penggabungan: `completed` menang; `first_score` mempertahankan nilai pertama yang tersimpan; `best_score` dan `attempts` memakai nilai terbesar; `updated_at = now()`. Aman diulang.
- Validasi nilai hanya untuk kebersihan data (tidak ada papan peringkat).

**`delete_my_account()`** (`security definer`, `search_path` kosong)

- Hanya menghapus `auth.users` milik `auth.uid()`, tanpa parameter. Progres ikut terhapus lewat *cascade*. Setelah itu browser logout dan data lokal dihapus.
- Jika Supabase tidak mengizinkannya, alternatifnya Supabase Edge Function.

Hak `execute` kedua fungsi dicabut dari `public` dan `anon`, dan hanya diberikan ke `authenticated`.

### 4.4 RLS

RLS (*Row Level Security*) aktif di semua tabel.

| Tabel | Operasi | Role | Syarat |
|---|---|---|---|
| `lessons` | `select` | `anon`, `authenticated` | `published` |
| Tabel turunan materi (`characters`, `turns`, `sentences`, `lesson_*`, `quizzes`, `drills`, `glossary`) | `select` | `anon`, `authenticated` | Materi induknya `published` |
| `questions` | `select` | `anon`, `authenticated` | Materi dari set soalnya `published` |
| Tabel bersama (`lexemes`, `verbs`, `grammar_points`, `expressions`) | `select` | `anon`, `authenticated` | Selalu (tidak memuat konten khusus materi draf; pemakaian per materi tetap disaring tabel `lesson_*`) |
| Semua tabel konten | tulis | Tidak ada policy | Hanya `service_role` |
| `user_progress` | `select`, `insert`, `update`, `delete` | `authenticated` | `(select auth.uid()) = user_id` |

### 4.5 GRANT eksplisit

Sejak perubahan Data API Supabase, tabel tanpa GRANT tidak bisa diakses, dan BYPASSRLS tidak melewati GRANT.

- Tabel konten dan view: `select` untuk `anon` dan `authenticated`; `select`, `insert`, `update`, dan `delete` untuk `service_role`.
- `user_progress`: `select`, `insert`, `update`, dan `delete` untuk `authenticated` dan `service_role`; tidak ada GRANT untuk `anon`.

### 4.6 Uji database

- `npm run test:db` menjalankan semua migrasi di PGlite (Postgres di Node, tanpa Docker), dengan stub role `anon`, `authenticated`, `service_role` dan skema `auth`. Ada 15 cek: visibilitas materi draf, tulis oleh `anon`, isolasi progres antarpengguna, aturan merge, validasi skor dan ID, hapus akun, dan view Review.
- Keterbatasannya: skema `auth` di PGlite hanya stub. Perilaku khusus Supabase (misalnya hak `delete` pada `auth.users`) sudah diverifikasi langsung di project staging lewat API (13 cek: RLS konten, RPC, merge, hapus akun dengan pengguna uji sementara).
- pgTAP (`supabase test db`) bisa ditambahkan di CI nanti, karena runner GitHub punya Docker.

---

## 5. Auth (rencana, M5)

### 5.1 Paket dan klien

- Pola resmi `@supabase/ssr` 0.12 bersama `@supabase/supabase-js` 2.118. Hanya key baru yang dipakai: `sb_publishable_…` dan `sb_secret_…`. Key lama `anon` dan `service_role` (JWT) dijadwalkan dihentikan Supabase pada akhir 2026.
- Klien Supabase per tempat:

| Tempat | Klien |
|---|---|
| Build halaman publik | `@supabase/supabase-js` tanpa cookie, dengan publishable key (§3.3) |
| Browser (login, sinkronisasi progres) | Klien browser `@supabase/ssr`. Token diperbarui oleh klien itu sendiri. |
| Server (`proxy.ts`, `/akun`, `/auth/callback`) | Klien server `@supabase/ssr` dengan cookie. Dibuat per request, tidak disimpan sebagai variabel global. |

- Nama file klien di `src/lib/supabase`: Ditentukan di M5.

### 5.2 `proxy.ts`

- Next.js 16 mengganti `middleware.ts` dengan `proxy.ts` yang mengekspor fungsi bernama `proxy`. Proxy berjalan di runtime Node.js. Karena repo memakai folder `src`, file-nya berada di `src/proxy.ts`, sejajar dengan `src/app`.
- `matcher` hanya untuk `/akun/:path*` dan `/auth/:path*`. Tanpa `matcher`, proxy berjalan di setiap request, termasuk halaman materi yang statis, sehingga menambah kerja server dan latensi.
- Sesi diperbarui dengan `supabase.auth.getClaims()` tepat setelah klien server dibuat. Tidak boleh ada kode di antara pembuatan klien dan `getClaims()`, dan objek response dari Supabase harus dikembalikan apa adanya. Jika tidak, pengguna bisa ter-logout.
- Gunakan `getClaims()`, bukan `getSession()`. `getSession()` tidak divalidasi ulang ke server Auth, jadi tidak boleh dipakai untuk otorisasi di kode server. Tutorial lama yang memakai `middleware.ts`, key `anon`, atau `getSession()` ditolak saat review kode.
- Proxy bukan satu-satunya pemeriksaan. Kode server untuk `/akun` memverifikasi sesi sendiri, dan pemeriksaan akhir ada di database: RLS dan `delete_my_account()` memakai `auth.uid()` dari token pemanggil.

### 5.3 Callback OAuth

- `/auth/callback` adalah Route Handler (`src/app/auth/callback`). Route ini menerima kode dari Supabase setelah login Google, menukarnya menjadi sesi yang disimpan di cookie, lalu mengarahkan pengguna ke parameter `next`.
- `next` hanya boleh berupa **path relatif**, yaitu diawali satu `/`. Nilai seperti URL lengkap (`https://…`) atau `//host` tidak dipakai untuk redirect. Tujuannya mencegah *open redirect*, yaitu tautan login yang mengarahkan pengguna ke situs lain setelah login.
- Daftar Redirect URL di Supabase hanya memuat localhost, staging, dan produksi.

### 5.4 Konfigurasi pihak ketiga

Langkah rinci ada di `docs/DEPLOYMENT.md`. Ringkasnya (nama menu bisa sedikit berbeda):

- **Google Cloud, Google Auth Platform:** di halaman Audience, aplikasi dipublikasikan ("Publish app") sehingga statusnya "In production". Di Data Access, scope dibatasi `openid`, `email`, dan `profile`. Di Clients, dibuat satu OAuth client bertipe Web application. Authorized redirect URIs berisi callback setiap project Supabase, yang disalin dari dashboard Supabase.
- **Supabase:** client ID dan client secret diisi di Authentication > Providers > Google.

### 5.5 Halaman akun

- `/akun` berisi hapus akun permanen dengan konfirmasi, memakai `delete_my_account()` (§4.3).
- Perilaku saat Supabase tidak terjangkau dijelaskan di §2.6.

---

## 6. Struktur folder

### 6.1 Saat ini (M0)

```
.github/
  dependabot.yml            update npm dan GitHub Actions mingguan, target branch staging
  workflows/ci.yml          job ci dan release-gate
docs/                       PRD.md dan dokumen di PRD §14
public/                     kosong
src/
  app/
    layout.tsx              root layout: font, metadata, lang="id"
    globals.css             token Tailwind (@theme), furigana, screentone
    favicon.ico
    (public)/
      layout.tsx            ensureStatic = "navigation"
      page.tsx              beranda dan halaman contoh M0
  components/
    manga/
      speech-bubble.tsx     balon dialog SVG (elips dan ekor dalam satu path)
.env.example                daftar variabel lingkungan tanpa nilai
AGENTS.md                   catatan untuk agen AI (dibuat oleh next dev)
eslint.config.mjs
next.config.ts
package.json, package-lock.json
tsconfig.json               alias @/* → ./src/*
README.md
```

### 6.2 Rencana

Mengikuti PRD §11.5. Milestone di kolom kanan adalah milestone saat folder atau file itu pertama kali dibuat.

```
src/app/(public)/materi/[slug]/       halaman materi                          M4
src/app/(public)/review/              halaman Review (P1)                     M5
src/app/(public)/tentang/             halaman Tentang (P1)                    M6
src/app/akun/                         akun dan hapus akun                     M5
src/app/auth/callback/                callback OAuth                          M5
src/proxy.ts                          refresh sesi untuk /akun dan /auth      M5
src/components/{lesson,quiz,ui}/      komponen materi, soal, dan UI           M4
src/lib/supabase/                     klien Supabase                          M2, M5
src/lib/content/                      pembacaan konten saat build             M2, M4
src/lib/progress/                     progres lokal dan sinkronisasi          M4, M5
content/{lessons,shared,overrides,acks,schema}/                               M1
content/curriculum.json               urutan tema materi                      M1
scripts/lib/{conjugate,romaji,align,jmdict}.ts                                M1
scripts/{validate-content,build-content,check-ids}.ts                         M1
scripts/seed-content.ts                                                       M2
supabase/{config.toml,migrations,tests}/                                      M2
tests/                                unit test dan golden test               M1
.github/workflows/deploy-staging.yml                                          M2
.github/workflows/deploy-production.yml                                       M6
vercel.json                           git.deploymentEnabled (§2.4)            M2
.generated/                           output build:content (di-gitignore)     M1
```

- `.generated/` belum tercantum di `.gitignore`. Entri itu ditambahkan bersama `build:content` di M1.
- Lokasi file skrip toggle (§3.5): Ditentukan di M4.

---

## 7. Versi stack

Kolom "PRD" mengikuti PRD §11.1 (dicek 22 Okt 2026). Kolom "Repo" diambil dari `package.json`; versi yang benar-benar terpasang tercatat di `package-lock.json`.

| Komponen | PRD | Repo (`package.json`) | Terpasang | Status |
|---|---|---|---|---|
| Node.js | 24 | `engines.node`: `24.x`; CI memakai `node-version: 24` | — | Sudah ada |
| Next.js | 16.4.2 | `next`: `16.4.2` | 16.4.2 | Sudah ada |
| React, React DOM | 19.3.1 | `19.3.1` | 19.3.1 | Sudah ada |
| TypeScript | 5.9 (bukan 7.x sampai typescript-eslint mendukungnya) | `^5` | 5.9.3 | Sudah ada |
| Tailwind CSS | 4.3 | `tailwindcss`: `^4`, `@tailwindcss/turbopack`: `^4` | 4.3.3 | Sudah ada |
| React Compiler | Aktif | `babel-plugin-react-compiler`: `1.0.0` | 1.0.0 | Sudah ada |
| ESLint | Dijalankan langsung | `eslint`: `^9`, `eslint-config-next`: `16.4.2` | 9.39.5 | Sudah ada |
| Tipe | — | `@types/node`: `24.19.2`, `@types/react` dan `@types/react-dom`: `^19` | 24.19.2, 19.3.0 | Sudah ada |
| `@supabase/supabase-js` | 2.118 | Belum ada | — | Rencana, M2 |
| `@supabase/ssr` | 0.12 | Belum ada | — | Rencana, M5 |
| Supabase CLI (devDependency) | 2.121 | `supabase`: `2.121.0` | 2.121.0 | Sudah ada |
| PGlite (uji database) | — | `@electric-sql/pglite`: `0.3.x` | 0.3 | Sudah ada |
| Zod | 4.6 | Belum ada | — | Rencana, M1 |
| WanaKana (hanya input dan deteksi kana) | 5.3 | Belum ada | — | Rencana, M4 |

GitHub Actions di `ci.yml`: `actions/checkout@v7` dan `actions/setup-node@v7`. Workflow deploy akan memakai `supabase/setup-cli@v3` (M2).

Dependabot aktif karena Next.js 16 sering merilis patch keamanan. Update npm dan GitHub Actions dicek mingguan dan diarahkan ke branch `staging`. Paket `next`, `eslint-config-next`, `react`, `react-dom`, `@types/react`, dan `@types/react-dom` dikelompokkan dalam satu PR (grup `next-react`).

---

## 8. Catatan keamanan

### 8.1 Secret dan variabel lingkungan

| Variabel | Lokasi | Rahasia? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL` | `.env.local`, Vercel (per lingkungan) | Tidak |
| `SUPABASE_URL`, `SUPABASE_PROJECT_ID` | GitHub Environments (variable) | Tidak |
| `SUPABASE_SECRET_KEY`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `VERCEL_DEPLOY_HOOK_URL` | GitHub Environments (secret) | **Ya** |

- **Secret key (`sb_secret_…`) hanya disimpan di GitHub Environments**, tidak pernah di Vercel dan tidak pernah diberi awalan `NEXT_PUBLIC_`. Key ini melewati semua RLS. Supabase menolak secret key yang dipakai dari browser (HTTP 401 berdasarkan User-Agent), tetapi itu hanya pengaman tambahan, bukan batas keamanan. Jika bocor, hapus key itu segera di dashboard Supabase (Settings > API Keys; nama menu bisa sedikit berbeda).
- `.env.example` saat ini memuat `SUPABASE_SECRET_KEY` untuk script seed lokal, sedangkan PRD §12.5 hanya mencantumkan GitHub Environments. Apakah seed lokal memakai key project staging atau hanya Supabase lokal: Ditentukan di M2.
- `VERCEL_DEPLOY_HOOK_URL` diperlakukan seperti password: siapa pun yang memegang URL itu bisa memicu deploy. Jika bocor, cabut hook-nya dan buat yang baru di Vercel.
- *Publishable key* aman berada di browser karena aksesnya dibatasi RLS dan GRANT.
- Nilai secret diisi sendiri oleh pemilik dan tidak di-paste di chat (K8).
- `.gitignore` mengabaikan semua file `.env*` kecuali `.env.example`. Karena repo publik (D8), tidak ada nilai secret yang boleh masuk commit.

### 8.2 Render konten

- Konten tidak pernah dirender dengan `dangerouslySetInnerHTML`. Teks Jepang dirender sebagai elemen JSX `<ruby>`, `<rt>`, dan `<rp>` dengan teks biasa sebagai isinya. Teks lain dirender sebagai teks, sehingga React meng-*escape* karakter HTML.
- Skrip toggle dimuat dari file statis, bukan string inline (§3.5).

### 8.3 Batas lisensi JMdict

- Data JMdict (lisensi CC BY-SA 4.0 dari EDRDG) hanya dipakai untuk validasi di CI. Rilis `jmdict-simplified` di-*pin*, diunduh di CI, dan tidak di-commit.
- Tidak ada glos atau entri JMdict yang dikirim ke website. Kelas kata kerja yang disimpan hanyalah label tata bahasa.
- Mengubah batas ini butuh keputusan baru, karena memicu kewajiban *share-alike* CC BY-SA.
- Atribusi EDRDG/JMdict ditampilkan di halaman Tentang (P1, M6).

### 8.4 Lainnya

- RLS aktif di semua tabel dan GRANT ditulis eksplisit. `anon` tidak punya akses tulis ke tabel apa pun (§4.4, §4.5).
- `execute` untuk `merge_progress` dan `delete_my_account` hanya untuk `authenticated` (§4.3).
- Parameter `next` di callback OAuth hanya menerima path relatif (§5.3).
- Proxy dibatasi ke `/akun` dan `/auth`, dan otorisasi memakai `getClaims()` (§5.2).
- Token GitHub Actions di `ci.yml` hanya punya izin `contents: read`.
- Domain staging dilindungi Vercel Authentication, sehingga hanya akun Vercel pemilik yang bisa membukanya.
- Tidak ada analitik pihak ketiga (PRD §8.8).
