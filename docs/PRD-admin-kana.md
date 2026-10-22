# PRD Fase 2 — Admin Konten, Konten Harian AI, dan Tabel Kana

| | |
|---|---|
| Status | **Draft v0.1 — menunggu persetujuan** |
| Tanggal | 22 Oktober 2026 |
| Pemilik produk | Zulfikhar |
| Penyusun | Claude (Claude Code) |
| Dokumen induk | `docs/PRD.md` (v0.2, keputusan D1–D12) |

---

## 1. Ringkasan

Fase 2 menambahkan tiga hal ke Benkyō Nihongo:

1. **Konten harian dari AI.** Agent AI terjadwal menyusun satu materi setiap hari, memvalidasinya, lalu mendorongnya ke repo sebagai **draf**. Draf ini belum tampil ke pelajar.
2. **Dashboard admin** yang dilindungi login email dan password. Dari dashboard, pemilik bisa:
   - mereview draf dengan tampilan yang sama persis dengan yang dilihat pelajar;
   - melihat hasil validasi;
   - mengedit teks;
   - menerbitkan materi sekarang atau menjadwalkannya, serta menarik materi yang sudah terbit.
3. **Tabel hiragana dan katakana** untuk publik. Isinya gojūon, dakuten, yōon, dan kombinasi katakana untuk kata serapan, lengkap dengan animasi urutan goresan.

## 2. Perubahan terhadap PRD induk

| Keputusan lama | Perubahan |
|---|---|
| **D12:** semua materi di `main` langsung terbit | **Diganti.** Konten tetap di-push langsung ke `main`, dan `main` tetap menjadi sumber kebenaran **isi** materi. Tetapi **status terbit** (draf, terjadwal, terbit, ditarik) disimpan di database dan diatur dari dashboard. Seed tidak pernah menimpa status terbit. |
| **D3:** pemilik mereview sendiri | Tetap berlaku. Dashboard menjadi tempat review utama, menggantikan `preview:draft`. |
| **K4:** repo adalah sumber kebenaran isi | Tetap berlaku. Editan dari dashboard disimpan sebagai **commit ke repo** (§7.4), bukan ditulis langsung ke database. |
| **§3.3 non-tujuan:** "panel admin" dan "pembuatan materi oleh AI saat runtime" | Panel admin kini masuk lingkup. Pembuatan materi oleh AI tetap **bukan** di runtime website: AI berjalan sebagai agent terjadwal di luar website. |

## 3. Catatan kritis (perlu Anda baca sebelum menyetujui)

1. **Volume review adalah hambatan utama.** Satu materi per hari berarti sekitar 50 kalimat, ditambah tabel dan soal, harus Anda baca setiap hari. Validator menjamin furigana, romaji, dan konjugasi, tetapi tidak menjamin kealamian bahasa dan ketepatan terjemahan (D3). Kalau Anda tidak sempat mereview, draf akan menumpuk. Mitigasinya ada di §6.4: agent berhenti membuat materi baru jika sudah ada 3 draf yang belum direview.
2. **Pembuatan otomatis harian butuh pengaman bacaan yang lebih kuat dari sekarang.** Pengecekan bacaan terhadap kamus (`check:dictionary`, PRD §9.3) belum dibangun. Saat ini bacaan kanji hanya dicek kecocokan bentuknya, belum dicek benar atau tidaknya menurut kamus. **`check:dictionary` menjadi prasyarat** sebelum agent harian dinyalakan.
3. **Edit teks di dashboard adalah bagian paling mahal dan paling berisiko.** Mengubah teks Indonesia mudah. Mengubah kalimat Jepang berarti mengubah token (bacaan, bentuk dasar kata kerja, jenis perubahan), lalu memvalidasi ulang. Kalau editor menulis langsung ke database, isi repo dan database akan berbeda. Solusinya ada di §7.4: editan disimpan sebagai commit ke repo lewat GitHub API, sehingga validasi CI dan riwayat versi tetap berlaku.
4. **Login dengan password memperluas permukaan serangan.** Satu akun admin dengan password bisa menerbitkan atau menarik konten. Rekomendasi: **MFA (TOTP) wajib** untuk admin, pendaftaran akun email dimatikan, dan akun admin dibuat manual.
5. **Status terbit di database berarti produksi tidak lagi bisa dibangun ulang 100% dari repo.** Kalau database produksi hilang (free tier tidak punya backup), status terbit ikut hilang, sementara isi materi tetap aman di repo. Mitigasi: status terbit juga dicatat di log audit (§7.5), dan pemulihan cukup dengan menerbitkan ulang.
6. **Fase 2 menyaingi pekerjaan yang belum selesai.** Halaman materi bagian D–I, login pelajar, dan progres (PRD M4–M5) belum rampung. Urutan yang saya sarankan ada di §10.

## 4. Tujuan dan non-tujuan

### 4.1 Tujuan

1. Materi baru tersedia setiap hari tanpa Anda harus meminta secara manual.
2. Dari dashboard, Anda bisa mereview, memperbaiki, dan menerbitkan satu materi dalam waktu kurang dari 20 menit.
3. Tidak ada materi yang terbit tanpa keputusan eksplisit Anda.
4. Pelajar bisa mempelajari dan merujuk seluruh huruf kana dengan romaji dan urutan goresannya.

### 4.2 Non-tujuan

- Banyak admin, peran berjenjang, atau alur persetujuan berlapis. Admin hanya satu orang, yaitu Anda.
- Editor bebas seperti CMS. Editor hanya mengubah field materi yang sudah ada, tidak bisa menambah bagian baru.
- AI yang berjalan di website. AI hanya berjalan di agent terjadwal.
- Kuis tebak huruf kana. Tidak dipilih, dan bisa dipertimbangkan nanti.
- Audio pelafalan kana.

## 5. Pengguna dan skenario

| Pengguna | Skenario |
|---|---|
| **Agent AI (terjadwal)** | Setiap hari pukul 05:00 WIB: membaca kurikulum dan materi yang sudah ada, menyusun materi berikutnya, menjalankan validator sampai bersih, lalu push ke `main`. Workflow `deploy-production` kemudian men-seed materi itu sebagai **draf**. |
| **Admin (Anda)** | Login ke `/admin`, melihat draf baru, membuka pratinjau, membaca warning, mengedit kalimat yang janggal, lalu menekan **Terbitkan** atau **Jadwalkan**. |
| **Pelajar** | Melihat materi yang sudah terbit. Membuka `/kana` untuk melihat tabel huruf dan urutan goresannya. |

## 6. Konten harian oleh AI

### 6.1 Mesin pembuat (keputusan **G1**)

| Opsi | Cara kerja | Biaya | Rekomendasi |
|---|---|---|---|
| **A. Claude Code terjadwal (routine)** | Agent Claude Code berjalan di cloud sesuai jadwal. Agent membaca repo, menulis JSON materi, menjalankan `npm run validate:content`, memperbaiki sampai lolos, lalu push. | Memakai kuota paket Claude Anda; tanpa API key terpisah | **Ya.** Agent bisa menjalankan validator dan memperbaiki sendiri, sama seperti saat Materi 1 dibuat. |
| B. GitHub Actions + Claude API | Workflow cron memanggil Claude API (Agent SDK) di runner GitHub. | Bayar per token API (kira-kira beberapa ribu rupiah per materi, perlu diukur) dan butuh API key di GitHub Secrets | Hanya jika Opsi A tidak tersedia di paket Anda |

### 6.2 Alur harian

```
05:00 WIB  Agent mulai
  1. Cek backlog: ada ≥ 3 draf belum direview? → berhenti, catat alasan
  2. Baca content/curriculum.json → tema berikutnya yang belum dipakai
  3. Baca semua materi yang ada → hindari dialog dan kalimat yang berulang
  4. Susun content/lessons/0NN-<slug>.json mengikuti docs/CONTENT_SPEC.md
  5. npm test, validate:content, check:dictionary → perbaiki sampai 0 error
  6. Commit "content: add Materi N (<tema>)" lalu push ke main
  7. deploy-production: validasi → migrasi → seed (status draf) → selesai
```

### 6.3 Aturan agent

- Agent hanya boleh mengubah `content/lessons/*.json` dan `content/curriculum.json`. Perubahan di luar itu ditolak oleh pemeriksaan path di workflow.
- Agent tidak boleh menerbitkan. Ia tidak punya akses ke dashboard maupun database produksi.
- Prompt agent disimpan di repo (`.claude/agents/daily-lesson.md`), sehingga perubahannya bisa direview.
- Jika validasi tetap gagal setelah 3 kali percobaan, agent tidak push. Ia mencatat kegagalannya, dan kegagalan itu tampil di dashboard.

### 6.4 Pengendalian backlog

- **Batas draf:** maksimal 3 draf belum direview (bisa diubah dari dashboard).
- Dashboard menampilkan jumlah draf, umur draf tertua, dan riwayat jalannya agent (sukses, berhenti karena backlog, atau gagal validasi).

## 7. Dashboard admin

### 7.1 Login (keputusan **A1**)

- **Supabase Auth dengan email dan password.** Akun admin dibuat manual di dashboard Supabase. Pendaftaran akun email untuk publik dimatikan, sementara login Google untuk pelajar (D2) tetap terpisah.
- **Peran admin** disimpan di `auth.users.app_metadata.role = 'admin'`. Nilai ini hanya bisa diubah lewat secret key, jadi pengguna tidak bisa menjadikan dirinya admin.
- **MFA TOTP wajib** (rekomendasi): setelah memasukkan password, admin memasukkan kode dari aplikasi authenticator. Fitur ini tersedia di free tier Supabase.
- **Reset password** memakai email bawaan Supabase. Batas 2 email per jam dan hanya ke anggota tim project sudah cukup, karena admin adalah pemilik project.
- Halaman `/admin/*` dirender per request, dengan sesi diverifikasi oleh `proxy.ts` dan `getClaims()`. Halaman publik tetap statis.

### 7.2 Halaman dashboard

| Halaman | Isi |
|---|---|
| `/admin` | Ringkasan: jumlah draf, terjadwal, dan terbit; umur draf tertua; jalannya agent terakhir; materi yang terbit hari ini |
| `/admin/materi` | Daftar semua materi beserta status, tanggal dibuat, tanggal terbit, dan jumlah warning. Bisa difilter per status. |
| `/admin/materi/[id]` | **Pratinjau** persis seperti halaman pelajar, dengan toggle furigana, romaji, dan terjemahan. Di sampingnya ada **panel validasi** berisi warning per kalimat dan tautan ke lokasinya, serta tombol **Edit**, **Terbitkan sekarang**, **Jadwalkan**, dan **Tarik** |
| `/admin/materi/[id]/edit` | Editor (§7.4) |
| `/admin/pengaturan` | Batas backlog draf, jam terbit terjadwal, dan status agent |

### 7.3 Status terbit

Status terbit disimpan di tabel baru `lesson_publication`, terpisah dari tabel konten, sehingga seed tidak pernah menimpanya.

| Status | Arti | Tampil ke pelajar |
|---|---|---|
| `draft` | Baru di-seed, belum direview | Tidak |
| `scheduled` | Dijadwalkan terbit pada `publish_at` | Mulai `publish_at` |
| `published` | Terbit | Ya |
| `withdrawn` | Ditarik setelah terbit | Tidak (progres pelajar tetap tersimpan) |

- Materi baru yang di-seed **selalu** berstatus `draft`.
- Jika materi yang sudah terbit diubah lewat repo atau editor, materi itu tetap terbit dengan isi baru. Dashboard menandainya "diubah setelah terbit".
- **Penerbitan terjadwal:** Vercel Cron memanggil endpoint revalidasi sekali sehari (misalnya pukul 07:00 WIB) untuk menampilkan materi yang `publish_at`-nya sudah lewat. Paket Hobby hanya mengizinkan cron harian, dan waktunya bisa meleset dalam rentang satu jam.
- **Terbitkan sekarang** memanggil `revalidateTag('lessons')` dari server action, sehingga materi tampil dalam hitungan detik tanpa redeploy.
- **Spike teknis:** dengan Cache Components, halaman untuk slug baru yang tidak dihasilkan saat build harus dipastikan bisa dirender saat diminta. Ini diuji di awal fase (§10, langkah A0).

### 7.4 Editor teks (keputusan **E1**)

**Cara menyimpan (rekomendasi):** editor mengubah JSON materi, menjalankan validator di browser (validator ditulis dalam TypeScript murni, jadi bisa jalan di browser), lalu menyimpan sebagai **commit ke `main` lewat GitHub API**. Workflow `deploy-production` lalu men-seed ulang. Hasilnya: repo tetap menjadi sumber kebenaran, semua editan punya riwayat dan bisa dikembalikan, dan validasi CI tetap berjalan. Waktu dari klik **Simpan** sampai perubahan terlihat sekitar 2–4 menit.

**Alternatif (tidak disarankan):** editor menulis langsung ke database. Perubahan langsung terlihat, tetapi isi repo dan database menjadi berbeda, dan seed berikutnya akan menimpa editan.

**Yang bisa diedit:**

| Bagian | Cara edit |
|---|---|
| Terjemahan, catatan, penjelasan tata bahasa dan ungkapan, teks soal | Kolom teks biasa |
| Kalimat Jepang | **Editor token**: setiap kata tampil sebagai kotak berisi tulisan, bacaan, dan penanda (partikel, nama, sufiks). Untuk kata kerja juga ada bentuk dasar dan jenis perubahannya. Romaji dan furigana dihitung ulang langsung, dan error validasi muncul di kotak yang bermasalah. |
| Tambah atau hapus kalimat, kosakata, soal | Tombol tambah/hapus per daftar. Jumlah minimal dan maksimal tetap dijaga validator. |

**Keamanan penyimpanan:** commit ke GitHub memakai **fine-grained token** yang hanya punya izin `contents: write` untuk repo `benkyou-nihongo`. Token disimpan sebagai variabel server-only di Vercel (`GITHUB_CONTENT_TOKEN`) dan hanya dipakai oleh server action yang sudah memeriksa peran admin. Ini satu-satunya secret di Vercel, dan itu perubahan dari aturan PRD §11.4.

**Konflik edit:** jika file berubah di repo sejak editor dibuka (misalnya agent push di saat yang sama), penyimpanan ditolak dan editor meminta Anda memuat ulang. Pengecekannya memakai SHA file dari GitHub API.

### 7.5 Data dan keamanan

```sql
lesson_publication (
  lesson_id     text primary key references lessons on delete cascade,
  status        text not null check (status in ('draft','scheduled','published','withdrawn')),
  publish_at    timestamptz,
  published_at  timestamptz,
  updated_by    uuid references auth.users,
  updated_at    timestamptz not null default now()
)
admin_audit_log (id, at, admin_id, action, lesson_id, detail jsonb)
generation_runs (id, started_at, finished_at, result, lesson_id, message)
```

- **RLS konten publik:** syaratnya berubah dari `lessons.published` menjadi "status `published`, atau status `scheduled` dan `publish_at ≤ now()`" di `lesson_publication`.
- **RLS admin:** `lesson_publication` dan `admin_audit_log` hanya bisa diubah oleh pengguna yang `auth.jwt()->'app_metadata'->>'role' = 'admin'`. Selain itu, admin bisa **membaca draf** lewat policy tambahan di setiap tabel konten.
- **Setiap aksi admin** (terbitkan, jadwalkan, tarik, simpan editan) dicatat di `admin_audit_log`.
- Seed (`seed_lesson`) membuat baris `lesson_publication` berstatus `draft` hanya untuk materi baru, dan tidak menyentuh baris yang sudah ada.

## 8. Tabel hiragana dan katakana

### 8.1 Isi

| Bagian | Hiragana | Katakana |
|---|---|---|
| Gojūon (46 huruf dasar) | ✓ | ✓ |
| Dakuten dan handakuten (が, ぱ, …) | ✓ | ✓ |
| Yōon (きゃ, しゅ, …) | ✓ | ✓ |
| Kombinasi kata serapan (ファ, ティ, ウィ, ヴ, …) | — | ✓, dengan 1 contoh kata per kombinasi |
| Tanda khusus (っ/ッ, ー, ん) | Penjelasan singkat dengan contoh | Penjelasan singkat dengan contoh |

- **Halaman:** `/kana`, statis, dengan tab Hiragana dan Katakana. Tautan dari beranda dan header.
- **Tampilan:** grid seperti tabel kana tradisional (baris あ–わ, kolom a-i-u-e-o), dengan kotak bergaris tinta, huruf dalam font Shippori Antique, dan romaji di bawahnya. Sel kosong (yi, ye, wu) diberi tone, bukan dihilangkan, agar bentuk grid tetap utuh.
- **Romaji** dihasilkan oleh generator yang sama dengan materi (`romanizeWord`), sehingga konsisten (shi, chi, tsu, fu, ji, zu).
- **Contoh kata** untuk kombinasi katakana (misalnya ファン *fan*, パーティー *pātī*) memakai format token yang sama dan divalidasi oleh validator.
- **Data** disimpan di `content/kana.json` di repo, bukan di database, karena isinya tetap dan tidak perlu diterbitkan.

### 8.2 Urutan goresan

- Klik sebuah huruf untuk membuka panel berisi huruf besar, **animasi urutan goresan** (goresan digambar satu per satu dan diberi nomor), tombol **Ulangi**, serta **Langkah demi langkah** untuk maju satu goresan setiap klik.
- **Data goresan** diambil dari **KanjiVG** (SVG per karakter, termasuk kana), dengan versi di-*pin*. Data diproses saat build menjadi path per goresan. Animasi memakai CSS `stroke-dashoffset`, tanpa library tambahan. Jika `prefers-reduced-motion` aktif, goresan ditampilkan bernomor tanpa animasi.
- **Lisensi:** KanjiVG berlisensi **CC BY-SA 3.0**. Kewajibannya adalah atribusi di halaman `/kana` dan `/tentang`, serta *share-alike* untuk data goresan turunan. Kode situs tidak terkena kewajiban ini. Status lisensi perlu dicek ulang saat implementasi.
- Kombinasi yōon dan kata serapan tidak punya animasi sendiri. Panelnya menampilkan huruf-huruf penyusunnya, yang masing-masing bisa diklik.

## 9. Kebutuhan non-fungsional

| Aspek | Target |
|---|---|
| Keamanan admin | MFA wajib; sesi admin kedaluwarsa setelah 8 jam tidak aktif; semua aksi tercatat di log audit; `/admin` tidak terindeks mesin pencari (`noindex`) |
| Kinerja publik | Halaman materi dan `/kana` tetap statis. Target Lighthouse sama dengan PRD §13. |
| Kinerja admin | Pratinjau dan validasi di editor terasa instan (< 200 ms per perubahan token) |
| Aksesibilitas | Tabel kana bisa dinavigasi dengan keyboard (tombol panah). Setiap sel punya label teks, misalnya "Hiragana ka, romaji ka". |
| Keandalan | Agent gagal → tidak ada push, kegagalan tampil di dashboard. Database tidak terjangkau → dashboard menampilkan pesan, halaman publik tetap tampil. |

## 10. Urutan pengerjaan yang disarankan

Pekerjaan PRD induk yang belum selesai (bagian D–I dan login pelajar) saya sisipkan di urutan ini, karena dashboard memakai ulang komponen halaman materi.

| Langkah | Isi | Prasyarat |
|---|---|---|
| **K1** | Tabel kana (gojūon, dakuten, yōon, kombinasi katakana) | Tidak ada; bisa dikerjakan segera |
| **K2** | Urutan goresan (KanjiVG) | K1 |
| **U1** | Halaman materi bagian D–I (sisa PRD M4) | Persetujuan gaya balon dialog |
| **A0** | Spike: render slug baru saat diminta dengan Cache Components; revalidasi dari server action | — |
| **A1** | Login admin (email + password + MFA), peran admin, `lesson_publication`, RLS baru, perubahan seed | A0 |
| **A2** | Dashboard: daftar, pratinjau (memakai komponen U1), panel validasi, terbitkan/jadwalkan/tarik, log audit, Vercel Cron | A1, U1 |
| **A3** | `check:dictionary` (JMdict) dan `content/curriculum.json` | — |
| **A4** | Agent harian terjadwal dan pencatatan `generation_runs` | A2, A3 |
| **A5** | Editor teks (kolom teks, lalu editor token) dan commit lewat GitHub API | A2 |

Login dan progres pelajar (PRD M5) bisa dikerjakan setelah A2, karena keduanya memakai fondasi Supabase Auth yang sama.

## 11. Keputusan yang butuh persetujuan Anda

Jawab **"setuju semua rekomendasi"** atau sebutkan nomornya.

| # | Pertanyaan | Rekomendasi | Alternatif |
|---|---|---|---|
| **G1** | Mesin agent harian | Claude Code terjadwal (routine) | GitHub Actions + Claude API (berbayar per token) |
| **G2** | Jam agent dan jam terbit terjadwal | Agent 05:00 WIB, terbit terjadwal 07:00 WIB | Jam lain |
| **G3** | Batas draf yang belum direview | 3 | Angka lain, atau tanpa batas |
| **E1** | Editan dashboard disimpan ke mana | Commit ke repo lewat GitHub API | Langsung ke database (repo dan database bisa berbeda) |
| **A1** | MFA untuk admin | Wajib (TOTP) | Tanpa MFA |
| **R1** | Urutan pengerjaan | Seperti §10: kana dulu, lalu D–I, baru admin | Admin dulu |

## 12. Metrik keberhasilan

1. Dalam 2 minggu setelah A4 aktif, rata-rata waktu review dan terbit per materi kurang dari 20 menit, diukur dari log audit (draf dibuka sampai diterbitkan).
2. Tidak ada materi yang terbit tanpa aksi admin, dibuktikan dengan log audit.
3. Agent gagal validasi lebih jarang dari 1 kali per minggu.
4. Seluruh 46 huruf gojūon hiragana dan katakana punya animasi urutan goresan yang tampil benar.
