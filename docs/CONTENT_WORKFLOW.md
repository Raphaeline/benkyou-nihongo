# Alur Kerja Konten

> **Diperbarui 22 Okt 2026 (PRD D12, §9.4):** staging hanya untuk fitur. Konten di-push langsung ke `main` tanpa PR, dan status review (`ai-draft`/`reviewed`) dihapus: semua materi di `main` terbit. Workflow `deploy-production` menjalankan validasi → migrasi → seed → redeploy Vercel. Bagian di bawah yang menyebut PR konten ke `staging`, status review, atau gerbang review digantikan oleh PRD §9.4.


| | |
|---|---|
| Status | Draf M0. Hampir seluruh isi dokumen ini adalah rencana yang dibangun di M1–M6. |
| Acuan | `docs/PRD.md` v0.2 (§8.9, §9, §11.2, §12, §15, §17), `docs/CONTENT_SPEC.md` |
| Pembaca | Pemilik (reviewer konten) dan Claude (penyusun draf) |

Dokumen ini menjelaskan cara menambah dan merilis satu materi: siapa melakukan apa, apa yang dicek otomatis di setiap langkah, dan cara menangani hasil validasi. Aturan isi materi (format token, aturan romaji, jumlah bagian) ada di `docs/CONTENT_SPEC.md`.

**Keadaan saat ini (M0):** folder `content/` belum ada. `ci.yml` baru menjalankan lint, typecheck, dan build. Job `release-gate` baru mengecek branch asal PR ke `main`. Semua perintah konten di §7 belum tersedia.

---

## 1. Prinsip "pilih, jangan karang" (rencana, M1)

Draf yang disusun AI bisa salah di bagian yang tampak benar: bacaan kanji, bentuk kata kerja, dan romaji. Karena itu draf hanya mengisi bagian yang tidak bisa dihitung. Bagian yang bisa dihitung dikerjakan kode, lalu dicek di CI (*continuous integration*: pemeriksaan otomatis oleh GitHub Actions setiap kali ada PR).

| Bagian materi | Asalnya | Dicek oleh |
|---|---|---|
| Teks Jepang dan batas token (token = satu potongan kata dalam array teks Jepang, PRD §9.2) | Ditulis di draf | `validate:content`, review pemilik |
| Bacaan (furigana) kata berkanji, field `r` | **Dipilih** dari kandidat bacaan JMdict (kamus Jepang terbuka dari EDRDG) untuk kata itu | `check:dictionary`: error jika di luar kandidat, kecuali ada override. Warning untuk kata berbacaan ganda. |
| Bentuk dasar dan jenis perubahan kata kerja (`lemma`, `lemmaR`, `form`) | Ditulis di draf | Conjugator (kode yang menghitung perubahan bentuk kata kerja). Error jika teks tidak cocok dengan hasil hitungan. |
| Entri tabel kata kerja: `lemma`, `lemmaR`, kelas JMdict, arti, `role` | Ditulis di draf | `validate:content`, `check:dictionary` |
| Semua sel bentuk di tabel kata kerja (ます, て, ました, ません) | **Dihitung** conjugator, tidak ditulis | Kebenaran conjugator dijaga `test` |
| Romaji | **Dihasilkan** kode dari bacaan, tidak ditulis | Kebenaran generator dijaga `test`; pengecualian lewat override |
| Pemisahan okurigana (kana setelah kanji) dan segmen furigana | **Dihasilkan** `build:content` | `test` |
| Terjemahan, catatan, dan penjelasan bahasa Indonesia | Ditulis di draf | Review pemilik |
| Kealamian dialog dan tingkat kesopanan | Ditulis di draf | Review pemilik (tidak bisa diotomatisasi) |

Contoh token dari PRD §9.2:

```json
[
  { "t": "毎日", "r": "まいにち" },
  { "t": "日本語", "r": "にほんご" },
  { "t": "を", "prt": true },
  { "t": "勉強して", "r": "べんきょうして", "lemma": "勉強する", "lemmaR": "べんきょうする", "form": "te" },
  { "t": "います", "lemma": "いる", "lemmaR": "いる", "form": "masu", "aux": true },
  { "t": "。" }
]
```

Akibatnya bagi penyusun draf:

- Romaji tidak ditulis di file materi. Jika hasil generator salah untuk satu kasus, tulis override beserta alasannya (§4.3).
- Bacaan harus salah satu kandidat JMdict untuk kata itu. Bacaan di luar kandidat hanya boleh lewat override beserta alasannya.
- Bentuk kata kerja yang didukung conjugator di MVP hanya `dict`, `masu`, `masen`, `mashita`, `masendeshita`, `mashou`, `te`, `ta`, `nai`, `nakatta`, dan `stem`. Bantu たい dikonjugasikan sebagai adjektiva-i. Bentuk kontraksi kasual (〜てる, 〜ちゃう) memakai field `contraction` dan wajib diakui reviewer.
- Setiap partikel ditandai `prt: true`, nama orang ditandai `name: true`, dan bentuk majemuk dipecah (住んで + います). Rinciannya ada di `docs/CONTENT_SPEC.md`.
- Data JMdict hanya dipakai untuk validasi di CI. Glos atau entri JMdict tidak dikirim ke website (PRD §9.3, aturan lisensi). Arti bahasa Indonesia selalu ditulis di draf lalu direview pemilik.

---

## 2. Alur 5 langkah

Alur dari PRD §9.4:

```
1. Draf      Claude menyusun JSON di branch content/L00X-...      status: ai-draft
2. Validasi  validate:content, check:dictionary, test lolos (lokal + CI di PR)
3. Staging   PR ke staging di-merge → migrate, seed, deploy staging otomatis
4. Review    Pemilik membaca materi di situs staging dan mengisi checklist,
             lalu PR kedua ke staging mengubah status menjadi reviewed
5. Rilis     PR staging → main. Job release-gate di CI memastikan semua warning
             pada materi berstatus reviewed sudah diakui.
             Produksi hanya memuat materi berstatus reviewed.
```

### 2.1 Ringkasan siapa melakukan apa

| Langkah | Pelaku | Branch atau PR | Dicek otomatis | Berlaku mulai |
|---|---|---|---|---|
| 1. Draf | Claude | Branch `content/L00X-<slug>` dari `staging` | Belum ada (cek lokal di langkah 2) | M3 |
| 2. Validasi | Claude (lokal), lalu CI | PR 1: `content/L00X-<slug>` → `staging` | Status check `ci` (lihat §2.3) | M1 |
| 3. Staging | Pemilik meng-merge PR 1, lalu otomatis | Push ke `staging` | `deploy-staging.yml` | M2 |
| 4. Review | Pemilik | PR 2: `content/*` → `staging`, mengubah status menjadi `reviewed` | Status check `ci` | M6 (Materi 1) |
| 5. Rilis | Pemilik | PR `staging` → `main` | `ci` dan `release-gate`, lalu `deploy-production.yml` | M6 |

Untuk Materi 1: langkah 1–3 dikerjakan di M3 (kriteria M3: status `ai-draft`, ter-seed di staging), sedangkan langkah 4–5 di M6, setelah halaman materi selesai di M4.

### 2.2 Langkah 1: Draf (Claude; rencana, M3)

- Buat branch dari `staging` dengan nama `content/L00X-<slug>`. Contoh untuk Materi 1: `content/L001-perkenalan-diri`. Nomor tiga digit sama dengan ID materi (`L001`) dan nama file.
- Tulis `content/lessons/00X-<slug>.json`, contohnya `content/lessons/001-perkenalan-diri.json`. Metadata review diisi `status: "ai-draft"`.
- Jika perlu, tambahkan override di `content/overrides/` beserta alasannya (§4.3).
- Commit memakai awalan `content:` (Conventional Commits, PRD §12.1).
- PR materi hanya mengubah folder `content/` (PRD §3.2). Jika materi butuh perubahan kode, misalnya bentuk kata kerja yang belum didukung conjugator, perubahan kode itu dibuat sebagai PR `feature/*` terpisah dan di-merge lebih dulu.

### 2.3 Langkah 2: Validasi (Claude lokal, lalu CI; rencana, M1)

Sebelum push, Claude menjalankan di lokal:

```bash
npm run validate:content
npm run check:dictionary
npm test
```

Lalu Claude membuka PR ke `staging`. CI (`ci.yml`) menjalankan, sesuai PRD §11.2 dan §12.4:

| Cek | Isi |
|---|---|
| `lint`, `typecheck` | Pemeriksaan kode |
| `test` | Unit test conjugator, romaji, penyelarasan furigana, dan *golden test* (kalimat Materi 1 sebagai contoh jawaban baku) |
| `validate:content` | Skema dan semua aturan error di PRD §9.1 |
| `check:dictionary` | Bacaan dan kelas kata kerja dibandingkan dengan JMdict |
| `check:ids` | ID materi dan set soal di `main` tidak boleh hilang atau berubah (§6) |
| Supabase lokal di runner | Migrasi, uji RLS, lalu `seed:content` dari isi PR |
| `next build` | Halaman dibangun dari database lokal tersebut |

- **Error** membuat status check `ci` gagal. Ruleset GitHub mewajibkan `ci` lulus, jadi PR tidak bisa di-merge.
- **Warning** ditulis ke ringkasan workflow run di GitHub Actions dan **tidak** memblokir merge ke `staging`.
- Preview Vercel untuk branch PR membaca database staging, jadi materi baru belum tampil di preview. Materi baru tampil di staging setelah merge. Login juga tidak didukung di URL preview.

Langkah di GitHub bagi pemilik (nama menu bisa sedikit berbeda):

1. Buka PR: klik **Pull requests** di halaman repo, lalu pilih PR-nya. Jika membuat PR sendiri: pilih branch di menu **Branch**, klik **Compare & pull request** pada banner kuning, set **base** ke `staging` dan **compare** ke `content/L00X-<slug>`, lalu klik **Create Pull Request**.
2. Hasil cek ada di tab **Checks** pada halaman PR.
3. Untuk membaca warning: buka tab **Actions**, pilih workflow `ci` di sidebar kiri, lalu klik run yang sesuai. Ringkasan warning ada di halaman ringkasan run tersebut.

### 2.4 Langkah 3: Staging (pemilik meng-merge, lalu otomatis; rencana, M2)

- Pemilik meng-merge PR setelah `ci` lulus. Approval tidak dibutuhkan, karena ruleset memakai 0 approval (pemilik tidak bisa meng-approve PR sendiri). Tombol merge ada di bagian bawah halaman PR, misalnya **Merge pull request** lalu **Confirm merge**. Labelnya mengikuti metode merge yang diaktifkan; metode merge diatur di `docs/GIT_WORKFLOW.md`.
- Push ke `staging` memicu `deploy-staging.yml`: `supabase db push` (migrasi) → `seed:content` → verifikasi `content_hash` → Vercel Deploy Hook → `next build` membaca Supabase.
- Staging memuat materi `ai-draft` supaya bisa direview di langkah 4. Cara seed mengatur kolom `published` per lingkungan: Ditentukan di M2.
- Jika project Supabase sedang di-*pause*, build gagal. Pulihkan project dari dashboard Supabase, lalu jalankan ulang workflow (PRD §11.2).

### 2.5 Langkah 4: Review (pemilik; rencana, M6 untuk Materi 1)

1. Buka situs staging `benkyou-nihongo-git-staging-<akun>.vercel.app`. Domain ini dilindungi Vercel Authentication: jika belum login, Vercel mengarahkan ke halaman login Vercel, lalu kembali ke situs setelah login.
2. **Khusus Materi 1:** sebelum mereview isi, lakukan dulu uji hasil belajar PRD §17. Bermain peran sebagai Rina tanpa melihat teks, kerjakan soal dengan preset "Latihan membaca", lalu catat skor dan waktu percobaan pertama. Setelah review, isi materi sudah hafal sehingga uji ini tidak lagi berarti.
3. Baca materi utuh dan isi checklist (§5). Cek setiap warning di ringkasan CI. Warning yang diterima diakui dengan ack beserta alasannya (§4.2). Warning yang ternyata menunjukkan kesalahan diperbaiki di file materi.
4. Catat jumlah kesalahan furigana, romaji, atau konjugasi yang ditemukan (metrik PRD §17, target 0). Tempat pencatatan: Ditentukan di M6.
5. Jika ada perbaikan: buat PR perbaikan dari branch `content/*` ke `staging` dengan status tetap `ai-draft`, lalu ulangi langkah 2–4.
6. Jika sudah sesuai: buat PR kedua ke `staging` yang mengubah metadata review menjadi `status: "reviewed"`, mengisi `reviewedAt`, dan mengisi `checklist[]`. Sebaiknya entri ack ikut di PR ini, karena `release-gate` di langkah 5 gagal jika masih ada warning yang belum diakui pada materi `reviewed`. Isi PR ini adalah keputusan pemilik; penulisan filenya boleh dibantu Claude atas instruksi pemilik. Branch-nya berpola `content/*`; nama persisnya Ditentukan di M6.

PR kedua melewati CI yang sama dengan langkah 2.

### 2.6 Langkah 5: Rilis (pemilik; rencana, M6)

- Buat PR dengan **base** `main` dan **compare** `staging`.
- Status check `ci` dan `release-gate` wajib lulus. `release-gate` gagal jika:
  - branch asal bukan `staging` atau `hotfix/*` (sudah berjalan sejak M0);
  - ada warning yang belum diakui pada materi berstatus `reviewed` (ditambahkan di M1).
- Setelah merge, `deploy-production.yml` (aktif mulai M6) menjalankan alur yang sama ke project `benkyou-prod`. Produksi hanya memuat materi berstatus `reviewed`.
- Materi `ai-draft` boleh ikut ter-merge ke `main`, tetapi tidak dipublikasikan di produksi. `release-gate` hanya mengecek warning pada materi `reviewed`, sehingga satu draf yang belum direview tidak memblokir rilis perbaikan lain.
- Sebelum M6 (keputusan D9), `main` belum di-deploy ke produksi dengan database.

Gerbang ini mencegah lupa, bukan membuktikan siapa yang mereview (PRD §9.4). Sesuai D3, website tidak menampilkan label status review.

---

## 3. Perintah Claude Code `/lanjut` (rencana, M3)

`/lanjut` adalah alat untuk penulis materi. Bagi pelajar, "Lanjut" adalah tombol "Materi berikutnya" di akhir halaman materi (PRD §8.9).

- Prioritas P1 (PRD §6): dikerjakan di M3 hanya jika semua P0 M3 sudah selesai. Jika tidak sempat, perintah ini dipindah ke backlog dan dilaporkan di laporan milestone.
- Lokasi dan isi file perintahnya: Ditentukan di M3.

### 3.1 Yang dibaca

| File | Kegunaan |
|---|---|
| Semua `content/lessons/*.json` | Tema yang sudah dipakai, jumlah tokoh, kalimat dialog utama, serta kosakata dan pola yang sudah ada |
| `content/curriculum.json` | Urutan tema |
| `docs/CONTENT_SPEC.md` | Aturan isi materi |

Format `content/curriculum.json`: Ditentukan di M3.

### 3.2 Cara menyusun draf berikutnya

- **Tema:** tema pertama dalam urutan kurikulum yang belum dipakai materi mana pun. Urutan dari PRD §9.5, setelah Materi 1 (perkenalan diri):
  1. di rumah bersama keluarga
  2. bangun tidur dan rutinitas pagi
  3. berangkat kerja/sekolah
  4. teman kerja
  5. restoran
  6. minimarket/supermarket
  7. bertanya arah dan transportasi
  8. membuat janji
  9. hobi dan akhir pekan
  10. cuaca
  11. menelepon
  12. meminta bantuan dan izin
  13. menyampaikan pendapat dan rencana
  14. tempat kerja formal/informal
- **Jumlah tokoh:** divariasikan (dua, tiga, atau lebih, sesuai spesifikasi awal) dengan melihat jumlah tokoh di materi sebelumnya. Materi 1 memakai 4 tokoh. Aturan persisnya: Ditentukan di M3.
- **Tidak mengulang dialog:** kalimat dialog utama tidak boleh sama dengan materi sebelumnya, kecuali salam baku. CI memberi warning jika tema dipakai ulang atau ada kalimat dialog utama yang sama. Daftar salam baku yang dikecualikan: Ditentukan di M3.
- **Tingkat kesulitan:** dari N5 bertahap ke N4. Draf hanya memakai bentuk kata kerja yang didukung conjugator (§1). Bentuk potensial, volitional, dan kondisional ditambahkan ke conjugator sebelum materi N4 pertama, sebagai perubahan kode terpisah. Batas kosakata baru per materi belum diputuskan (Q2) dan diputuskan sebelum Materi 2.

### 3.3 Hasil dan batasannya

- Satu pemanggilan `/lanjut` menghasilkan satu draf materi, lalu berhenti dan menunggu instruksi. Hasilnya adalah langkah 1–2 di §2: branch `content/L00X-<slug>`, file materi berstatus `ai-draft`, validasi lokal, dan PR ke `staging`.
- `/lanjut` tidak meng-merge PR, tidak mengubah status menjadi `reviewed`, tidak menulis ack atas nama pemilik, dan tidak mempublikasikan apa pun. Materi baru hanya terbit lewat PR yang disetujui pemilik.

### 3.4 Set latihan tambahan "Latihan" (rencana, setelah MVP / P2)

- Perintah "Latihan" di spesifikasi awal dipetakan ke set soal tambahan, misalnya `L001.quiz.2`, yang ditambahkan lewat PR. Di website, set ini tampil di bagian "Latihan tambahan".
- Set tambahan melewati alur 5 langkah yang sama. ID-nya adalah ID set soal, jadi ikut beku setelah rilis (§6).
- Perintah Claude Code dan format filenya: Ditentukan setelah MVP.
- "Review" tidak butuh perintah, karena halaman `/review` dibangun dari materi yang ada.

---

## 4. Menangani error dan warning (rencana, M1)

### 4.1 Error

Error menandai pelanggaran yang pasti salah. `validate:content` keluar dengan kode 1, status check `ci` gagal, dan PR **tidak bisa di-merge**. Sesuai kriteria M1, setiap pesan error memuat kode aturan, nama file, dan path JSON (lokasi field di dalam file).

Error dari PRD §9.1 dan §9.2:

- skema tidak valid;
- token berkanji atau berangka tanpa bacaan;
- bacaan di luar bacaan JMdict untuk kata itu (kecuali ada override);
- bentuk kata kerja di teks tidak cocok dengan conjugator, atau di luar daftar bentuk yang didukung;
- partikel は/へ tanpa penanda `prt: true`;
- kosakata yang tidak muncul di dialog (dicocokkan berdasarkan bentuk dasar);
- tabel kata kerja tidak sama dengan kata kerja di dialog utama (dicek dua arah);
- contoh pola tata bahasa tidak persis ada di kalimat dialog yang dirujuk;
- ungkapan bagian G tidak ada di dialog utama;
- jumlah di luar aturan: kurang dari 10 giliran, pola di luar 3–5, ungkapan di luar 3–5, soal bukan 5, atau ada tipe soal yang tidak muncul;
- rujukan ID yang putus;
- ID materi atau set soal di `main` hilang atau berubah (`check:ids`).

Cara menangani:

- Perbaiki file materinya. Error tidak bisa di-ack.
- Dua jenis error punya jalur pengecualian lewat override (§4.3): bacaan di luar kandidat JMdict dan pengecualian aturan romaji.
- Bentuk kata kerja di luar daftar memunculkan pesan "tambahkan bentuk ke conjugator". Ini bukan kasus override. Bentuk baru ditambahkan ke conjugator bersama unit test-nya, lewat PR `feature/*` terpisah.

### 4.2 Warning dan ack

Warning menandai hal yang mungkin benar tetapi perlu dicek manusia. Warning tidak memblokir merge ke `staging`, tetapi harus diakui dengan alasan tertulis sebelum materi dipublikasikan ke produksi. Pengakuan ini disebut *ack* (*acknowledgement*), dan `release-gate` mengeceknya pada materi berstatus `reviewed`.

| Warning | Sumber |
|---|---|
| Kata berbacaan ganda (今日, 一日, 何, 人) wajib dikonfirmasi reviewer | PRD §9.1 |
| Dialog lebih dari 20 giliran | PRD §9.1 |
| Kata yang di JMdict ditandai "biasanya ditulis kana" ditulis dengan kanji (misalnya 下さい dalam 〜てください, 宜しく) | PRD §9.1 |
| Kanji di luar daftar N5/N4 internal (daftar tidak resmi, dibuat di M1) | PRD §9.1 |
| Jumlah kosakata baru melewati batas (mulai Materi 2; batasnya Q2) | PRD §9.1 |
| Tema dipakai ulang, atau kalimat dialog utama sama dengan materi sebelumnya (kecuali salam baku) | PRD §8.9 |
| Bentuk kontraksi kasual dengan field `contraction` wajib diakui reviewer | PRD §9.3 |

Ack ditulis di `content/acks/<materi>.json`, satu file per materi, saat review (langkah 4). Setiap entri wajib memuat alasan. Ack menerima warning tanpa mengubah hasil validasi. Jika warning ternyata menunjukkan kesalahan, perbaiki file materinya, jangan di-ack.

Contoh format **draf**. Nama field, kode aturan, dan nama file difinalkan di M1:

```json
{
  "lesson": "L001",
  "acks": [
    {
      "rule": "<kode warning dari validator>",
      "at": "L001.main.03.2",
      "reason": "今日 di kalimat ini berarti 'hari ini', jadi dibaca きょう. Dicek di jisho.org.",
      "date": "<YYYY-MM-DD>"
    }
  ]
}
```

Isi contoh di atas hanya ilustrasi format, bukan isi Materi 1.

### 4.3 Override

Override mengganti hasil hitungan kode untuk kasus yang tidak bisa dihitung dengan benar. Setiap override wajib disertai alasan. Override disimpan di `content/overrides/`. PRD menyebut dua kegunaannya:

- bacaan yang tidak termasuk kandidat JMdict untuk kata itu;
- pengecualian aturan romaji.

Perbedaannya dengan ack: ack menerima warning tanpa mengubah hasil, sedangkan override mengubah hasil hitungan. Override ikut di PR materi, dan pemilik membaca alasan setiap override saat review.

Contoh format **draf** (difinalkan di M1). Kasusnya diambil dari aturan ALA-LC 2022: pada 子牛 (こうし), vokal di batas dua morfem (子 + 牛) ditulis terpisah, *koushi*. Generator yang hanya membaca kana akan menghasilkan *kōshi*.

```json
{
  "overrides": [
    {
      "type": "romaji",
      "at": "<ID kalimat>",
      "token": 0,
      "value": "koushi",
      "reason": "子牛 = 子 + 牛. Vokal di batas morfem ditulis terpisah (ALA-LC 2022)."
    }
  ]
}
```

Contoh ini hanya ilustrasi format, bukan isi Materi 1. Nama file di dalam `content/overrides/` (per materi atau per jenis): Ditentukan di M1.

---

## 5. Checklist review pemilik

Disalin dari PRD §9.4:

- [ ] Dialog dibaca utuh di staging; tidak ada yang terasa janggal atau kaku.
- [ ] Tingkat kesopanan setiap tokoh sesuai catatan di bagian B.
- [ ] Setiap warning kata berbacaan ganda sudah dicek di kamus (misalnya jisho.org) dan diakui.
- [ ] Terjemahan Indonesia mudah dipahami, dan pilihan kamu/Anda konsisten.
- [ ] Catatan terjemahan harfiah ada di kalimat yang membutuhkannya.
- [ ] Penjelasan tata bahasa jelas dan tidak menyebut pola yang tidak ada di dialog.
- [ ] Soal tidak punya lebih dari satu jawaban benar.
- [ ] Kana, kanji, dan katakana dipakai sesuai kebiasaan; bentuk alternatif yang umum sudah dijelaskan.

Hasil checklist disimpan di metadata review file materi (`status`, `reviewedAt`, `checklist[]`). Format item `checklist[]`: Ditentukan di M1.

---

## 6. ID yang tidak boleh diubah (rencana, M1)

Progres pelajar disimpan dengan merujuk ID, baik di browser (`localStorage`, kunci `bn:progress:v1`) maupun di tabel `user_progress`. Jika ID berubah, progres yang merujuknya hilang (PRD §16).

| ID | Contoh | Dirujuk oleh | Aturan |
|---|---|---|---|
| ID materi | `L001` | Progres materi | Beku setelah rilis |
| ID set soal | `L001.quiz` (set tambahan P2, misalnya `L001.quiz.2`) | Skor latihan (skor pertama, skor terbaik, jumlah percobaan) | Beku setelah rilis |
| ID kalimat | `L001.main.03.2` | Rujukan di dalam materi (pola, kosakata, tabel kata kerja) | Boleh berubah sebelum rilis; rujukan yang putus ditolak validator |

`check:ids` membandingkan ID di PR dengan ID di `origin/main`, yaitu branch `main` di GitHub. ID materi atau set soal yang sudah ada di sana tidak boleh hilang atau berubah. Dalam praktiknya, ID dianggap beku sejak masuk ke `main`, termasuk ID materi yang masih `ai-draft`. Karena itu, periksa ID sebelum PR `staging` → `main`.

PRD tidak menyediakan jalur untuk mengganti ID yang sudah ada di `main`. PRD juga tidak mengatur perubahan ID kalimat setelah rilis; yang dijaga `check:ids` hanya ID materi dan ID set soal.

---

## 7. Daftar perintah npm untuk konten (rencana, M1/M2)

Perintah ini belum ada di `package.json`. Saat M0, menjalankannya memunculkan error `Missing script` dari npm. Perintah yang sudah tersedia saat ini: `dev`, `build`, `start`, `lint`, dan `typecheck` (lihat `README.md`).

| Perintah | Fungsi (PRD §9.3) | Dijalankan di | Milestone |
|---|---|---|---|
| `npm run validate:content` | Skema Zod dan semua aturan error PRD §9.1. Keluar dengan kode 1 jika ada error. Warning ditulis ke ringkasan GitHub Actions. | Lokal dan CI | M1 |
| `npm run check:dictionary` | Mencocokkan bacaan dan kelas kata kerja dengan JMdict (rilis `jmdict-simplified` yang di-*pin*, diunduh di CI, tidak di-commit) | CI; cara pakai di lokal Ditentukan di M1 | M1 |
| `npm run check:ids` | ID materi dan set soal di `origin/main` tidak boleh hilang atau berubah | CI | M1 |
| `npm run build:content` | Menghasilkan segmen ruby, romaji, bentuk kata kerja, dan statistik kosakata ke `.generated/` (tidak di-commit) | Lokal dan CI | M1 |
| `npm run seed:content` | Upsert seluruh isi materi ke Supabase. Idempoten: dijalankan dua kali hasilnya sama. Mencatat `content_hash` per materi, lalu memverifikasi bahwa hash di database sama dengan hash repo. | CI (Supabase lokal di runner), `deploy-staging.yml`, `deploy-production.yml` (M6) | M2 |
| `npm test` | Unit test conjugator, romaji, dan penyelarasan furigana, ditambah kalimat Materi 1 sebagai *golden test* | Lokal dan CI | M1 |

Catatan:

- Urutan cek lokal sebelum membuka PR materi: `validate:content`, `check:dictionary`, lalu `test` (PRD §9.4 langkah 2).
- `seed:content` memakai secret key Supabase. Di CI, key ini disimpan di GitHub Environments. Di lokal, slot `SUPABASE_SECRET_KEY` di `.env.local` diisi sendiri oleh pemilik (K8). Target database dan aturan menjalankan seed dari laptop: Ditentukan di M2.

---

## Lampiran: hal yang belum ditentukan

| Hal | Kapan |
|---|---|
| Cara seed mengatur kolom `published` per lingkungan | M2 |
| Format ack dan override (nama field, kode aturan, nama file) | M1 |
| Apakah ack gugur saat kalimat yang di-ack berubah | M1 |
| Apakah mengubah materi berstatus `reviewed` mengembalikan statusnya ke `ai-draft` | M1 |
| Format item `checklist[]` | M1 |
| Cara menjalankan `check:dictionary` dan `seed:content` di lokal | M1 / M2 |
| Lokasi file perintah `/lanjut`, format `content/curriculum.json`, aturan variasi jumlah tokoh, daftar salam baku | M3 |
| Nama branch untuk PR kedua (perubahan status ke `reviewed`) dan tempat mencatat kesalahan yang ditemukan saat review | M6 |
| Batas kosakata baru per materi (Q2) | Sebelum Materi 2 |
| Perintah dan format set latihan tambahan | Setelah MVP |
