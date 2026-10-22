# PRD — Benkyō Nihongo

| | |
|---|---|
| Status | **v0.2: keputusan utama disetujui 22 Okt 2026. M0 sedang berjalan.** |
| Tanggal | 22 Oktober 2026 |
| Pemilik produk | Zulfikhar |
| Penyusun | Claude (Claude Code) |
| Dokumen terkait | `docs/CONTENT_SPEC.md`, `docs/ARCHITECTURE.md`, `docs/DESIGN_SYSTEM.md`, `docs/CONTENT_WORKFLOW.md`, `docs/DEPLOYMENT.md`, `docs/GIT_WORKFLOW.md` |

**Perubahan dari v0.1:** memuat keputusan pemilik (D1-A, review sendiri tanpa label, satu project Supabase dulu) dan hasil review PRD. Review dilakukan dari tiga sudut (spesifikasi, teknis, konsistensi), dan setiap temuan dicek ulang oleh pemeriksa kedua. Perubahan utama:

- gerbang review dipindah ke CI sebelum merge;
- romaji dan terjemahan per kalimat;
- daftar bentuk kata kerja diperluas;
- mekanisme hapus akun dan penggabungan progres didefinisikan;
- milestone disusun ulang;
- latar Materi 1 diganti agar sesuai level N5.

---

## 1. Ringkasan

Benkyō Nihongo adalah website publik untuk belajar percakapan bahasa Jepang sehari-hari (*kaiwa* / 会話) dari level JLPT N5 hingga N4, dengan bahasa penjelasan Indonesia. Setiap materi berisi satu dialog alami lengkap dengan furigana, romaji, dan terjemahan per kalimat, ditambah kosakata, tabel kata kerja, tata bahasa, ungkapan, latihan pemahaman, dan latihan berbicara.

Tampilan mengikuti nuansa membaca manga cetak: hitam, putih, dan abu-abu, dengan font bergaya lettering manga. Konten ditulis sebagai file JSON di repo, divalidasi otomatis, disimpan ke PostgreSQL (Supabase), lalu halaman dibangun statis dari database.

MVP berisi **1 materi lengkap** (Materi 1: Perkenalan Diri), login opsional dengan Google untuk menyimpan progres, dan tanpa audio.

## 2. Latar belakang dan masalah

- Materi kaiwa yang ada sering terjemahan harfiah, kaku, atau tidak membedakan bentuk sopan dan kasual.
- Pemula sulit membaca dialog asli karena kanji tanpa furigana. Sebaliknya, materi yang hanya memakai romaji tidak melatih membaca.
- Tabel konjugasi di banyak sumber tidak terhubung dengan dialog yang dipelajari.
- Spesifikasi konten awal ditulis sebagai *prompt* untuk tutor berbasis chat ("Lanjut", "Latihan", "Review"). Website tidak punya lawan bicara, jadi perintah-perintah itu dipetakan ke fitur dan alur kerja konten (§8.9).

## 3. Tujuan dan non-tujuan

### 3.1 Tujuan produk

1. Pengguna dapat membaca dan memahami satu dialog sehari-hari utuh tanpa harus sudah hafal kanji.
2. Pengguna memahami pola tata bahasa dan perubahan bentuk kata kerja yang **benar-benar muncul** di dialog.
3. Pengguna dapat berlatih berbicara (membaca keras, bermain peran, mengganti kata) tanpa audio.
4. Furigana, romaji, dan konjugasi dijamin benar oleh **kode deterministik dan validasi otomatis**, bukan oleh kepercayaan pada AI.

### 3.2 Tujuan teknis

1. Menambah materi baru cukup dengan **satu PR yang hanya mengubah folder `content/`**: file materi, ditambah *ack* atau *override* bila perlu, tanpa mengubah kode.
2. Alur `feature → staging → main` dengan CI yang menolak konten tidak valid **sebelum merge**.
3. Halaman materi statis dan cepat di ponsel. Database hanya dibaca saat build, jadi pengunjung tetap bisa membaca materi walaupun Supabase sedang di-*pause*.

### 3.3 Non-tujuan (tidak dikerjakan di MVP)

- Audio, TTS, atau pengenalan suara.
- Panel admin atau CMS di website.
- Pembuatan materi atau latihan oleh AI saat *runtime*.
- Flashcard SRS, gamifikasi, papan peringkat.
- Level N3 ke atas.
- Aplikasi mobile native.
- Bahasa penjelasan selain Indonesia.
- Monetisasi (iklan, berbayar). Ini batasan Vercel Hobby (§12.2).

## 4. Pengguna dan skenario

**Pengguna utama:** penutur bahasa Indonesia yang belajar bahasa Jepang secara mandiri, level pemula (N5) sampai pra-menengah (N4). Pemilik produk adalah pengguna pertama sekaligus reviewer konten.

**Skenario utama:**

1. *Belajar materi baru.* Buka daftar materi, pilih Materi 1, baca info dan daftar tokoh, baca dialog dengan furigana dan romaji, lalu matikan romaji untuk latihan membaca.
2. *Latihan.* Kerjakan 5 soal. Setelah semua terjawab, lihat skor dan kunci jawaban beserta penjelasannya.
3. *Latihan berbicara.* Pilih peran satu tokoh. Kalimat tokoh itu ditutup, pengguna mengucapkannya sendiri, lalu membuka jawabannya.
4. *Review.* Lihat rangkuman kosakata, kata kerja, dan tata bahasa dari materi yang sudah selesai.
5. *Lintas perangkat (opsional).* Login dengan Google, lalu progres dari browser tersinkron ke akun.

## 5. Keputusan

### 5.1 Disepakati

| # | Keputusan | Sumber |
|---|---|---|
| K1 | Stack: Next.js, Tailwind CSS, Supabase (PostgreSQL), Vercel | Permintaan awal |
| K2 | GitHub dengan branch `staging` dan `main`, dokumentasi dalam `.md` | Permintaan awal |
| K3 | Gaya visual bersih, "anti AI slop", tone abu-abu dan hitam seperti manga, font bergaya manga | Permintaan awal |
| K4 | Konten ditulis sebagai JSON di repo (sumber kebenaran), direview lewat PR, lalu di-seed ke Supabase | Jawaban 22 Okt |
| K5 | Login opsional. Tanpa login, progres disimpan di browser. | Jawaban 22 Okt |
| K6 | MVP berisi 1 materi; berikutnya ditambahkan bertahap | Jawaban 22 Okt |
| K7 | Tanpa audio di MVP | Jawaban 22 Okt |
| K8 | Nilai `.env` dan secret diisi sendiri oleh pemilik, tidak di-paste di chat | Kesepakatan 22 Okt |
| **D1** | **Opsi A:** isi materi lengkap di-seed ke tabel PostgreSQL, dan halaman dibangun statis dengan **membaca database saat build**. Konsekuensinya: build gagal kalau Supabase sedang di-*pause*, dan urutan *migrate → seed → deploy* diatur GitHub Actions (§11.2). | Pemilik, 22 Okt |
| **D2** | Login dengan Google OAuth saja. Magic link email ditunda karena butuh SMTP sendiri. | Rekomendasi disetujui |
| **D3** | **Pemilik mereview sendiri, tanpa label status review di website.** Risiko yang diterima: validasi otomatis menangkap kesalahan furigana, romaji, dan konjugasi, tetapi tidak bisa menilai kealamian dan tingkat kesopanan. Pengunjung tidak diberi tahu bahwa materi belum dicek penutur asli. | Pemilik, 22 Okt |
| D4 | Font teks Indonesia: Literata. Bisa ditinjau setelah melihat halaman contoh M0. | Rekomendasi disetujui |
| D5 | Tanpa dark mode di MVP | Rekomendasi disetujui |
| D6 | Teks horizontal, panel tersusun dari atas ke bawah | Rekomendasi disetujui |
| D7 | Repo di akun GitHub pribadi, proyek non-komersial (Vercel Hobby) | Pemilik, 22 Okt |
| D8 | **Repo publik**, sehingga *branch protection* bisa dipaksakan di GitHub Free. Konsekuensinya: draf materi bisa dibaca siapa pun di GitHub sebelum direview. | Pemilik, 22 Okt |
| **D9** | **Satu project Supabase dulu** (`benkyou-staging`). Project produksi dibuat menjelang rilis (M6). Sampai saat itu `main` belum di-deploy ke produksi dengan database, agar konten staging yang belum direview tidak tercampur dengan konten produksi. | Pemilik, 22 Okt |
| D10 | Domain `*.vercel.app` dulu | Rekomendasi disetujui |
| D11 | Nama "Benkyō Nihongo" (dengan makron) di UI, `benkyou-nihongo` di repo dan URL. **Catatan:** susunan katanya sama dengan 「勉強日本語」, yang tidak alami bagi penutur Jepang. Nama ini dipertahankan sebagai nama merek. | Rekomendasi disetujui |
| A1 | **Asumsi anggaran Rp0:** Vercel Hobby, Supabase Free, GitHub Free. Konsekuensinya: tidak ada backup database, project bisa di-*pause* setelah 7 hari tidak aktif, dan layar login Google menampilkan domain `<ref>.supabase.co`. | Asumsi, mohon koreksi jika salah |

### 5.2 Belum diputuskan (tidak memblokir M0–M5)

| # | Pertanyaan | Default sampai diputuskan |
|---|---|---|
| Q1 | Lisensi repo publik: (a) kode MIT, konten CC BY-SA 4.0; (b) kode MIT, konten hak cipta dilindungi; (c) tanpa lisensi | **(c)**: tanpa file LICENSE, semua hak dilindungi |
| Q2 | Batas kosakata baru per materi (peringatan CI) | Belum ada batas. Diputuskan sebelum Materi 2. |

## 6. Ruang lingkup MVP

Prioritas: **P0** = wajib ada. **P1** = dikerjakan hanya jika semua P0 di milestone yang sama sudah selesai; P1 yang tidak sempat dikerjakan dipindah ke backlog dan dilaporkan di laporan milestone. **P2** = setelah MVP.

| Fitur | Prioritas | Milestone |
|---|---|---|
| Beranda dan daftar materi | P0 | M4 |
| Halaman materi bagian A–I | P0 | M4 |
| Toggle furigana, romaji, dan terjemahan, beserta preset | P0 | M4 |
| Mode bermain peran, drill substitusi, dialog variasi | P0 | M4 |
| 5 soal interaktif dan kunci jawaban | P0 | M4 |
| Progres lokal (browser) | P0 | M4 |
| Login Google, sinkronisasi progres, hapus akun | P0 | M5 |
| Kebijakan privasi | P0 | M5 |
| Halaman Review | P1 | M5 |
| Halaman Tentang (atribusi, disclaimer level JLPT) | P1 | M6 |
| Pipeline konten (skema, validator, conjugator, romaji, furigana) | P0 | M1 |
| Database konten, seed, dan build dari database | P0 | M2 |
| Materi 1 (Perkenalan Diri) | P0 | M3 (draf), M6 (review dan rilis) |
| Perintah Claude Code `/lanjut` untuk menyusun draf materi | P1 | M3 |
| CI/CD staging, dokumentasi `.md` | P0 | M0–M2 |
| Rilis produksi (project Supabase kedua) | P0 | M6 |
| Materi 2 dan seterusnya, set latihan tambahan ("Latihan") | P2 | Setelah MVP |
| Cek silang penganalisis morfologi (SudachiPy) | P2 | Setelah MVP |
| Audio, subset font Jepang otomatis, dark mode | P2 | Setelah MVP |
| Pencarian lintas materi, panel admin | P2 | Setelah MVP |

## 7. Status progres

Definisi ini dipakai oleh beranda, Review, dan sinkronisasi.

| Status | Kapan tercapai |
|---|---|
| Belum | Halaman materi belum pernah dibuka |
| Sedang | Halaman materi pernah dibuka |
| Selesai | Kelima soal sudah dijawab sampai akhir minimal satu kali (tanpa syarat skor), atau pengguna menekan "Tandai selesai" |

Hasil latihan disimpan per **set soal** (`L001.quiz`): skor percobaan pertama, skor terbaik (0–5), dan jumlah percobaan.

## 8. Kebutuhan fungsional

### 8.1 Beranda dan daftar materi (P0)

- Menampilkan materi yang dipublikasikan, berurutan menurut nomor. Setiap materi menampilkan nomor, judul Jepang (dengan furigana), judul Indonesia, perkiraan level, perkiraan waktu, dan status progres (§7).
- Tidak ada hero "pemasaran". Halaman langsung masuk ke daftar materi dengan satu paragraf penjelasan.
- Status progres dan tombol login dirender setelah halaman dimuat, di area berukuran tetap agar tata letak tidak bergeser.

### 8.2 Halaman materi (`/materi/[slug]`) (P0)

Halaman mengikuti struktur A–I dari spesifikasi, dengan navigasi lompat antarbagian.

| Bagian | Isi |
|---|---|
| **A. Informasi materi** | Nomor, judul JA (furigana) dan ID, perkiraan level JLPT, situasi dan tempat, jumlah tokoh, tujuan pembelajaran, perkiraan waktu latihan |
| **B. Daftar tokoh** | Nama (furigana bila berkanji), hubungan antartokoh, dan tingkat kesopanan bawaan beserta catatannya (misalnya "sopan kepada guru; kasual kepada teman sekelas"). Kartu berbasis teks tanpa ilustrasi. Setiap tokoh punya penanda pola tone yang juga dipakai di balon dialognya. |
| **C. Dialog lengkap** | Minimal 10 giliran bicara. Setiap giliran berisi nama tokoh dan satu atau lebih **kalimat**. **Setiap kalimat** punya teks Jepang (furigana), romaji, terjemahan Indonesia, dan catatan opsional bila makna sebenarnya berbeda dari terjemahan harfiah. |
| **D. Kosakata penting** | Kosakata (furigana), romaji, arti, jenis kata, dan contoh penggunaan. Hanya kata dari dialog utama. Mulai Materi 2, ada penanda "baru" atau "sudah di Materi X". |
| **E. Tabel kata kerja** | Lihat §8.2.1 |
| **F. Penjelasan tata bahasa** | 3–5 pola dari dialog. Setiap pola berisi pola, fungsi dan makna, rumus, contoh dari dialog (tautan ke kalimat aslinya), terjemahan, dan satu contoh baru |
| **G. Ungkapan penutur asli** | 3–5 ungkapan dari dialog utama. Setiap ungkapan berisi arti, konteks, tingkat kesopanan, situasi, dan **perbandingan formal vs kasual**. Jika tidak ada padanannya, alasannya ditulis. Bentuk alternatif yang sama-sama benar dijelaskan perbedaannya. |
| **H. Latihan pemahaman** | 5 soal (§8.5) dan kunci jawaban |
| **I. Latihan berbicara** | Panduan membaca keras, mode bermain peran, drill substitusi, dan dialog variasi (§8.4) |

#### 8.2.1 Tabel kata kerja

| Kolom | Isi |
|---|---|
| Bentuk kamus | Dengan furigana, beserta romaji |
| Arti | Bahasa Indonesia |
| Kelompok | I (*godan*), II (*ichidan*), atau III (tidak beraturan). Kolom ini wajib; ini sengaja lebih ketat dari spesifikasi ("bila bermanfaat"). |
| Bentuk ます | Furigana dan romaji |
| Bentuk て | Furigana dan romaji |
| Bentuk ました | Furigana |
| Bentuk ません | Furigana |
| Bentuk di dialog | Bentuk yang benar-benar muncul (misalnya 住んでいます, 来ました), dengan tautan ke kalimatnya. Sel kolom bentuk yang muncul di dialog diberi penanda teks. |

- Kata kerja **utama** (yang mendukung tujuan materi) ditampilkan terpisah dari kata kerja **tambahan**.
- Semua bentuk dihitung oleh conjugator, sehingga furigana setiap sel otomatis benar dan ikut toggle furigana.
- Di ponsel, tabel bisa digulir horizontal di dalam kontainernya, dan kolom bentuk kamus tetap terlihat saat tabel digulir.

### 8.3 Kontrol tampilan (P0)

- Tiga toggle: **Furigana**, **Romaji**, **Terjemahan**. Ketiganya berlaku untuk dialog, contoh, dan tabel: romaji mati menyembunyikan kolom romaji, terjemahan mati menyembunyikan kolom arti.
- Terjemahan "mati" berarti tersembunyi tetapi bisa dibuka per kalimat dengan klik.
- Furigana disembunyikan dengan `visibility: hidden`, tanpa pergeseran tata letak.
- Preset: **Pemula** (semua aktif, bawaan kunjungan pertama), **Latihan membaca** (romaji mati), **Tantangan** (furigana dan romaji mati, terjemahan tersembunyi).
- Preferensi disimpan di `localStorage` dan diterapkan sebelum halaman tampil, lewat skrip kecil dari file statis. Tidak memakai `dangerouslySetInnerHTML`.

### 8.4 Latihan berbicara (P0)

- **Mode bermain peran:** pilih satu tokoh. Kalimat tokoh itu ditutup, dan terjemahannya **selalu tampil** sebagai petunjuk apa pun pengaturan toggle. Kalimat tokoh lain tetap terlihat dalam bahasa Jepang. Pengguna mengucapkan kalimatnya, lalu menekan "Buka". Bisa diulang untuk setiap tokoh.
- **Drill substitusi:** pola dari dialog dengan slot yang bisa diganti, misalnya 「[nama]です」 dan 「[negara]から来ました」. Nilai slot ditampilkan lebih dulu, pengguna mengucapkan kalimatnya, lalu "Buka" menampilkan kalimat lengkap. Setiap kombinasi ditulis di file konten dan divalidasi, tidak dirangkai bebas saat runtime.
- **Dialog variasi:** dialog kedua dengan situasi serupa, dengan format dan validasi yang sama dengan dialog utama. Kata baru yang tidak ada di tabel D dan E diberi glosarium singkat di bagian ini.

### 8.5 Latihan pemahaman (P0)

| Tipe soal | Cara menjawab |
|---|---|
| Pemahaman isi dialog | Pilihan ganda. **Pertanyaan ditulis dalam bahasa Jepang (dengan furigana)**, dan terjemahannya bisa dibuka. Terjemahan dialog disembunyikan selama soal dikerjakan. |
| Arti kosakata | Pilihan ganda |
| Melengkapi kalimat | Pilihan ganda (partikel, kata) |
| Mengubah kata kerja ke bentuk ます atau て | Input teks. Ketikan romaji otomatis menjadi hiragana (WanaKana). Jawaban diterima dalam bentuk kana maupun kanji, termasuk bentuk alternatif yang terdaftar. Kunci jawaban dihasilkan oleh conjugator. |

- Setiap tipe soal muncul minimal sekali di antara 5 soal (dicek CI).
- Urutan pilihan diacak di setiap percobaan.
- Setelah menjawab, pengguna melihat **○ Benar** atau **× Salah**, selalu dengan teks, beserta penjelasan singkat.
- Tombol "Lihat kunci jawaban" baru aktif setelah kelima soal dijawab.
- Input teks memakai `wanakana.bind()` pada input yang tidak dikontrol React, dengan `autoCapitalize="none"`, `autoCorrect="off"`, dan `spellCheck={false}`. Nilai dibaca saat submit lalu dinormalisasi. Diuji manual di Android Chrome dengan Gboard dan di iOS Safari.

### 8.6 Review (`/review`) (P1)

- Rangkuman kosakata, kata kerja, dan pola tata bahasa dari materi berstatus **selesai**, dengan pilihan untuk menyertakan materi **sedang** atau semua materi.
- Kosakata digabung berdasarkan entri kamus dan bacaan. Tata bahasa digabung berdasarkan ID pola yang stabil (misalnya `kara-asal` dan `kara-alasan` adalah dua pola berbeda). Setiap item menautkan ke materi tempat ia pertama muncul.
- Datanya dibaca dari view database saat build, lalu disaring di browser sesuai progres.
- Dengan 1 materi, Review masih mirip bagian D–F. Fitur ini baru benar-benar berguna mulai Materi 2.

### 8.7 Akun dan progres (P0, login opsional)

**Penyimpanan:**

- Setiap perubahan progres ditulis ke `localStorage` lebih dulu (kunci `bn:progress:v1`). Kalau pengguna login, perubahan itu lalu disinkronkan ke akun, dan diulang otomatis jika gagal.
- Saat login, di browser mana pun, progres lokal digabung ke akun lewat fungsi database `merge_progress`. Penggabungan aman diulang: skor terbaik dan jumlah percobaan memakai nilai terbesar, status memakai yang terjauh, dan waktu diisi server. Setelah digabung, salinan anonim di browser dikosongkan.
- Saat logout, salinan progres milik akun dihapus dari browser, supaya progres tidak tercampur di browser yang dipakai bersama.

**Hapus akun:** di halaman `/akun`, permanen, dengan konfirmasi. Penghapusan memakai fungsi database `delete_my_account()` (`SECURITY DEFINER`) yang hanya menghapus akun pemanggil. Progres ikut terhapus (*on delete cascade*), lalu browser logout dan data lokal dihapus. Secret key tidak pernah disimpan di Vercel. Jika fungsi ini tidak diizinkan Supabase, alternatifnya Supabase Edge Function.

**Keamanan data progres:** pengguna hanya bisa mengubah progres miliknya sendiri. Karena tidak ada papan peringkat, validasi nilai (rentang skor, format ID) hanya untuk menjaga kebersihan data, bukan untuk keamanan.

**Saat Supabase tidak terjangkau** (misalnya project di-*pause*): area login menampilkan "Login sedang tidak tersedia. Progres tetap tersimpan di browser ini." Sinkronisasi diantrekan, dan tidak ada data lokal yang dihapus.

Login tidak didukung di URL preview PR. Login hanya berjalan di localhost, staging, dan produksi.

### 8.8 Halaman Tentang dan privasi

- **Kebijakan privasi (P0):** data yang disimpan adalah email, nama, dan data profil dasar dari Google, waktu login, alamat IP dan jenis browser di log autentikasi Supabase dan log hosting Vercel, serta progres belajar. Tidak ada analitik pihak ketiga. Akun bisa dihapus kapan saja.
- **Tentang (P1):** disclaimer bahwa level JLPT bersifat **perkiraan** (JLPT tidak menerbitkan daftar kosakata atau kanji resmi sejak 2010), atribusi EDRDG/JMdict (CC BY-SA 4.0, dipakai untuk validasi), dan atribusi font (OFL).
- Sesuai D3, website **tidak** menampilkan label status review.

### 8.9 Pemetaan perintah chat ke website

| Perintah di spesifikasi | Di website (pelajar) | Di alur kerja konten (penulis) |
|---|---|---|
| "Mulai dengan Materi 1" | Materi 1 tersedia di beranda | Materi 1 ditulis di M3 |
| **"Lanjut"** | Tombol "Materi berikutnya" di akhir halaman materi. Di materi terakhir tombol ini bertuliskan "Materi berikutnya sedang disiapkan" dengan tautan ke Review. | Perintah Claude Code `/lanjut` membaca semua materi yang ada dan `content/curriculum.json`, memilih tema berikutnya yang belum dipakai, memvariasikan jumlah tokoh, lalu menyusun draf di branch `content/*`. CI memberi peringatan jika tema dipakai ulang atau ada kalimat dialog utama yang sama dengan materi sebelumnya (kecuali salam baku). |
| **"Latihan"** | Bagian "Latihan tambahan" (P2) | Set soal tambahan `L001.quiz.2` ditambahkan lewat PR (P2) |
| **"Review"** | Halaman `/review` (P1) | Tidak perlu perintah |
| "Tunggu instruksi sebelum materi berikutnya" | Tidak relevan | Materi baru hanya terbit lewat PR yang disetujui |

## 9. Spesifikasi konten

### 9.1 Aturan konten dan penegakannya

Seluruh aturan dari spesifikasi awal disalin utuh ke `docs/CONTENT_SPEC.md` sebagai acuan resmi. Tabel ini menunjukkan cara setiap aturan ditegakkan. **Error** memblokir merge. **Warning** harus diakui dengan alasan tertulis di `content/acks/` sebelum materi dipublikasikan ke produksi.

| Aturan | Penegakan |
|---|---|
| Setiap kanji punya furigana | **Error:** token berkanji atau berangka tanpa bacaan |
| Furigana sesuai bacaan kontekstual | **Error:** bacaan tidak termasuk bacaan JMdict untuk kata tersebut (kecuali ada *override*). **Warning:** kata berbacaan ganda (今日, 一日, 何, 人) wajib dikonfirmasi reviewer. |
| Jangan mengarang konjugasi | Bentuk dihitung oleh **conjugator** dari kelas kata kerja JMdict. **Error** jika bentuk di teks tidak cocok, atau jika bentuknya di luar daftar yang didukung (§9.3). |
| Romaji Hepburn konsisten, dengan makron | Romaji **dihasilkan otomatis** dari bacaan (Hepburn yang dimodifikasi, ALA-LC 2022). **Error** jika partikel は/へ tidak ditandai sebagai partikel. Pengecualian dicatat di *override* beserta alasannya. |
| Kosakata harus muncul di dialog | **Error** (dicocokkan berdasarkan bentuk dasar) |
| Tabel kata kerja = semua kata kerja unik di dialog | **Error, dua arah:** kata kerja di tabel harus ada di dialog utama, dan setiap kata kerja di dialog utama harus ada di tabel tepat satu kali |
| Pola tata bahasa benar-benar muncul | **Error:** contoh harus persis ada di kalimat dialog yang dirujuk |
| Ungkapan G berasal dari dialog | **Error:** ungkapan tidak ada di dialog utama |
| Jumlah | **Error:** kurang dari 10 giliran, pola di luar 3–5, ungkapan di luar 3–5, soal bukan 5, atau ada tipe soal yang tidak muncul. **Warning:** lebih dari 20 giliran (spesifikasi mengizinkan "atau lebih"). |
| Kana dan kanji sesuai kebiasaan | **Warning:** kata yang di JMdict ditandai "biasanya ditulis kana" ditulis dengan kanji (misalnya 下さい dalam 〜てください, 宜しく). Ditambah item checklist. |
| Lebih dari satu bentuk benar | Field `alternatives[]` (bentuk + penjelasan) di ungkapan, pola, dan soal input teks. Ditambah item checklist. |
| Kesulitan bertahap | **Warning:** kanji di luar daftar N5/N4 internal (daftar tidak resmi, dibuat di M1). Mulai Materi 2: jumlah kosakata baru dihitung dan diberi peringatan jika melewati batas (Q2). |
| Seluruh teks Jepang | Semua teks Jepang di file materi (dialog utama dan variasi, contoh kosakata dan tata bahasa, ungkapan dan padanannya, soal, drill) disimpan sebagai token dan melewati **semua** cek di atas |
| Kealamian, kesopanan, terjemahan, penjelasan | Review pemilik dengan checklist (§9.4). Tidak bisa diotomatisasi. |

### 9.2 Format data

- Satu materi = satu file: `content/lessons/001-perkenalan-diri.json`.
- Struktur dialog: giliran → kalimat. ID kalimat berbentuk `L001.main.03.2`.
- **ID yang beku setelah rilis** hanya ID yang dirujuk progres: ID materi (`L001`) dan ID set soal (`L001.quiz`). Dicek oleh `check:ids` terhadap `origin/main`. ID kalimat boleh berubah sebelum rilis, dan rujukan yang putus ditolak validator.
- Teks Jepang disimpan sebagai **array token**:

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

- `prt: true` menandai **setiap** partikel. は dan へ yang berdiri sendiri tanpa penanda ini ditolak CI.
- `name: true` menandai nama orang, agar romaji diawali huruf kapital.
- Bentuk majemuk dipecah menjadi beberapa token supaya setiap bagian bisa dicek (住んで + います, 来て + ください).
- Dari token, build menghasilkan segmen ruby. Okurigana (kana setelah kanji, misalnya きます pada 行きます) dipisahkan otomatis. Kata *jukujikun* (bacaan untuk seluruh kata, misalnya 今日, 大人) mendapat satu furigana untuk seluruh kata. Hasil render:

  <ruby>毎日<rt>まいにち</rt></ruby><ruby>日本語<rt>にほんご</rt></ruby>を<ruby>勉強<rt>べんきょう</rt></ruby>しています。 → *Mainichi Nihongo o benkyō shite imasu.*

- Render memakai elemen JSX `<ruby>`, `<rt>`, dan `<rp>`, tanpa `dangerouslySetInnerHTML`. `<rp>` menyediakan format cadangan 今日（きょう）.
- **Aturan romaji** (detail di CONTENT_SPEC): spasi mengikuti batas token, kata kerja dengan ます digabung (*ikimasu*), bentuk て dan bantu dipisah (*shite imasu*), huruf kapital di awal kalimat dan pada nama, serta tanda baca 。→ . 、→ , ？→ ?.
- Entri tabel kata kerja: `lemma`, `lemmaR`, kelas JMdict, arti, dan `role` (`utama` atau `tambahan`). Semua bentuk dihitung.
- Cakupan tabel kata kerja: です/だ tidak dimasukkan; kata kerja する-majemuk ditulis sebagai 〜する (kelompok III); bantu いる dan たい ditampilkan di bawah kata kerja utamanya, bukan sebagai baris sendiri; お願いします diperlakukan sebagai ungkapan (G).
- Tingkat kesopanan: per tokoh `{ default, note }`, ditambah `register` opsional per kalimat.
- Metadata review: `{ status: "ai-draft" | "reviewed", reviewedAt, checklist[] }`.
- Skema ditulis dengan Zod dan diekspor ke JSON Schema untuk *autocomplete* editor.

### 9.3 Pipeline validasi

Prinsip: **"pilih, jangan karang".** Draf AI hanya menyediakan teks, batas token, bentuk dasar beserta jenis perubahannya, dan teks Indonesia. Bacaan dipilih dari kandidat kamus. Romaji dan konjugasi dihitung oleh kode.

**Bentuk kata kerja yang didukung conjugator di MVP:** `dict`, `masu`, `masen`, `mashita`, `masendeshita`, `mashou`, `te`, `ta`, `nai`, `nakatta`, `stem`. Bantu たい dikonjugasikan sebagai adjektiva-i (たいです, たくない). Bentuk kontraksi kasual (〜てる, 〜ちゃう) memakai field `contraction` dan wajib diakui reviewer. Bentuk di luar daftar langsung menjadi CI error dengan pesan "tambahkan bentuk ke conjugator", dan bentuk baru hanya ditambahkan bersama unit test-nya. Bentuk potensial, volitional, dan kondisional ditambahkan sebelum materi N4 pertama; ini perubahan kode yang direncanakan.

| Script | Fungsi |
|---|---|
| `validate:content` | Skema Zod dan semua aturan error di §9.1. Kode keluar 1 jika ada error. Warning ditulis ke ringkasan GitHub Actions. |
| `check:dictionary` | Mencocokkan bacaan dan kelas kata kerja dengan JMdict (rilis `jmdict-simplified` yang di-*pin*, diunduh di CI, tidak di-commit) |
| `check:ids` | ID materi dan set soal di `origin/main` tidak boleh hilang atau berubah |
| `build:content` | Menghasilkan segmen ruby, romaji, bentuk kata kerja, dan statistik kosakata ke `.generated/` (di-gitignore) |
| `seed:content` | Upsert seluruh isi materi ke Supabase (idempoten), mencatat `content_hash` per materi, lalu memverifikasi bahwa hash di database sama dengan hash repo |
| `test` | Unit test conjugator, romaji, dan penyelarasan furigana. Contoh baku: 思う *omou*, お母さん *okāsan*, お兄さん *oniisan*, 行く→行って, 帰る kelompok I, 来る→来ます/来て/来ない/来た, ませんでした. Kalimat Materi 1 juga dipakai sebagai *golden test*. |

**Aturan lisensi:** data JMdict hanya dipakai untuk validasi di CI. Tidak ada glos atau entri JMdict yang dikirim ke website (kelas kata kerja yang disimpan hanyalah label tata bahasa). Mengubah aturan ini butuh keputusan baru karena memicu kewajiban *share-alike* CC BY-SA.

### 9.4 Alur penulisan, review, dan rilis

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

- Materi `ai-draft` boleh ada di `main`, tetapi tidak dipublikasikan di produksi. Satu draf yang belum direview tidak memblokir rilis perbaikan lain.
- Gerbang ini mencegah lupa, bukan membuktikan siapa yang mereview.

**Checklist review pemilik:**

- [ ] Dialog dibaca utuh di staging; tidak ada yang terasa janggal atau kaku.
- [ ] Tingkat kesopanan setiap tokoh sesuai catatan di bagian B.
- [ ] Setiap warning kata berbacaan ganda sudah dicek di kamus (misalnya jisho.org) dan diakui.
- [ ] Terjemahan Indonesia mudah dipahami, dan pilihan kamu/Anda konsisten.
- [ ] Catatan terjemahan harfiah ada di kalimat yang membutuhkannya.
- [ ] Penjelasan tata bahasa jelas dan tidak menyebut pola yang tidak ada di dialog.
- [ ] Soal tidak punya lebih dari satu jawaban benar.
- [ ] Kana, kanji, dan katakana dipakai sesuai kebiasaan; bentuk alternatif yang umum sudah dijelaskan.

### 9.5 Rencana Materi 1

v0.1 merencanakan latar hari pertama di kantor. Rencana itu diganti karena perkenalan kepada atasan di kantor Jepang menuntut keigo (〜と申します, お世話になります) yang berada di atas N5. Kelas bahasa adalah tempat bentuk です/ます memang paling alami.

| | |
|---|---|
| Judul | 自己紹介（じこしょうかい）— Perkenalan Diri |
| Level | N5 (perkiraan) |
| Situasi | Hari pertama kelas di sebuah sekolah bahasa Jepang di Tokyo |
| Tokoh (4) | **山田先生（やまだせんせい）/ Yamada-sensei**, guru; sopan kepada murid. **リナ (Rina)**, dari Indonesia. **チェン (Chen)**, dari Taiwan. **マリア (Maria)**, dari Filipina. Ketiga murid memakai teineigo. |
| Pola (F) | 〜は〜です, 〜は〜ですか, [tempat]から来ました (から = asal), 〜ています (keadaan, misalnya 住んでいます), 〜も |
| Ungkapan (G) | はじめまして, どうぞよろしくお願いします, こちらこそ, beserta perbandingan kasualnya (よろしく, よろしくね) |
| Kata kerja | Minimal 3, misalnya 来る, 住む, 勉強する, 働く |
| Perkiraan waktu | 30–40 menit |

Dialog utama seluruhnya teineigo. Bentuk kasual diperkenalkan lewat perbandingan di bagian G, sedangkan peralihan formal ke kasual disimpan untuk materi "teman kerja". Isi lengkapnya ditulis di M3.

**Urutan tema berikutnya** (mengikuti spesifikasi): di rumah bersama keluarga → bangun tidur dan rutinitas pagi → berangkat kerja/sekolah → teman kerja → restoran → minimarket/supermarket → bertanya arah dan transportasi → membuat janji → hobi dan akhir pekan → cuaca → menelepon → meminta bantuan dan izin → menyampaikan pendapat dan rencana → tempat kerja formal/informal. Urutan ini dicatat di `content/curriculum.json`.

## 10. Desain visual

Detail token dan komponen ada di `docs/DESIGN_SYSTEM.md`. Ringkasan yang perlu disetujui:

### 10.1 Prinsip

1. **Kertas dan tinta:** hanya hitam, putih, dan abu-abu, tanpa warna (hue).
2. **Bahasa visual manga yang nyata:** panel (koma), balon dialog, screentone, dan lettering アンチゴチ, dipakai karena berfungsi, bukan sebagai dekorasi.
3. **Keterbacaan di atas estetika:** teks tidak pernah diletakkan langsung di atas screentone.
4. **Catatan:** palet abu-abu, sudut siku, dan garis tipis sendiri tidak cukup untuk menghindari kesan "template AI". Pembedanya adalah tata bahasa visual manga yang spesifik dan teks Indonesia yang konkret.

### 10.2 Warna

`paper #F6F6F3` (latar) · `white #FFFFFF` (isi balon) · `ink #000000` (teks utama, 19,4:1) · `ink-2 #3D3D3D` (teks sekunder, 10,0:1) · `ink-3 #595959` (abu-abu teks paling terang yang diizinkan, 6,47:1) · `tone-1/2/3 #E6E6E3 / #B3B3B3 / #808080` (hanya untuk isian non-teks). Palet, radius, dan bayangan bawaan Tailwind dinonaktifkan, sehingga warna lain dan bayangan tidak bisa dipakai secara tidak sengaja.

### 10.3 Tipografi (semua berlisensi SIL OFL)

| Peran | Font |
|---|---|
| Dialog dan contoh Jepang | **Shippori Antique**: gaya アンチゴチ (kana Antique, kanji Gothic), dibuat mengikuti standar dialog manga. 20–24 px agar furigana minimal 10–12 px. |
| Judul dan efek suara | **Dela Gothic One**: hanya untuk ukuran ≥ 28 px |
| Teks Indonesia | **Literata**: 18 px, line-height 1,7. Romaji inline ditulis miring sesuai EYD untuk kata asing. |
| UI (tombol, label) | **Atkinson Hyperlegible Next** |

Maksimal 2 keluarga font Jepang per halaman. Potongan kana dan kanji dimuat sesuai kebutuhan dan tidak di-preload.

**Tidak dipakai:** Bangers, Comic Neue, Anime Ace/Blambot (lisensi webfont berbayar), Inter, Roboto, Geist, dan Space Grotesk.

### 10.4 Komponen dan larangan

- **Panel:** garis 3 px, radius 0, tanpa bayangan.
- **Balon dialog:** SVG elips dengan ekor dalam satu path.
- **Screentone:** titik dengan 3 kepadatan tetap.
- **Garis fokus (集中線):** statis, maksimal satu kali per materi.
- **Benar/salah:** ○ / × selalu disertai teks.

**Dilarang:** gradien dan warna apa pun, glassmorphism, emoji atau ikon ✨, hero dengan blob, hero dengan tiga kartu ikon, kartu membulat dengan bayangan lembut, bayangan offset, label huruf kapital di atas judul, animasi *fade-up* saat scroll, pola grid dekoratif, serta kata pemasaran ("unlock", "journey", "seamless", "tingkatkan potensimu").

## 11. Arsitektur teknis

Detail skema dan keputusan teknis ada di `docs/ARCHITECTURE.md`.

### 11.1 Stack (dicek 22 Okt 2026)

Node.js 24 · Next.js 16.4.2 (App Router, Turbopack, React Compiler, `cacheComponents` + `partialPrefetching`) · React 19.3.1 · TypeScript 5.9 (bukan 7.x sampai typescript-eslint mendukungnya) · Tailwind CSS 4.3 · `@supabase/ssr` 0.12 + `@supabase/supabase-js` 2.118 dengan key baru `sb_publishable_…` dan `sb_secret_…` · Supabase CLI 2.121 (devDependency) · Zod 4.6 · WanaKana 5.3 (hanya untuk input dan deteksi kana) · ESLint dijalankan langsung (`next lint` sudah dihapus).

Dependabot aktif karena Next.js 16 sering merilis patch keamanan.

### 11.2 Alur data (D1-A)

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

- Deploy Git otomatis Vercel dimatikan untuk `staging` dan `main` (`git.deploymentEnabled`). Deploy dipicu Deploy Hook setelah migrasi dan seed selesai, sehingga build tidak pernah membaca data lama dan tidak terjadi balapan.
- Build membaca database lewat klien tanpa cookie dengan *publishable key* di dalam fungsi `'use cache'`. Halaman materi memakai `ensureStatic = 'navigation'`, sehingga build gagal kalau ada render per-request yang masuk.
- Jika project Supabase sedang di-*pause*, situs yang sudah ter-deploy tetap berjalan, tetapi build berikutnya dan login gagal. Pulihkan project dari dashboard, lalu jalankan ulang workflow.
- Preview untuk branch fitur tetap aktif dan membaca database staging. Isi materi dari PR yang belum di-merge tidak tampil di preview; materi itu baru tampil di staging setelah merge.
- Migrasi harus kompatibel dengan kode yang sedang live: tambah dulu, pakai di rilis berikutnya, hapus di rilis setelahnya.

### 11.3 Database

- **Tabel konten**, hanya ditulis oleh seed lewat secret key di GitHub Actions: `lessons`, `characters`, `turns`, `sentences`, `lexemes`, `lesson_vocabulary`, `verbs`, `lesson_verbs`, `grammar_points`, `lesson_grammar`, `expressions`, `lesson_expressions`, `quizzes`, `questions`, `drills`. Plus view `review_vocabulary`, `review_verbs`, dan `review_grammar` untuk halaman Review. Setiap materi punya `content_hash` dan `published`.
- **`user_progress`** `(user_id, item_type, item_id, status, first_score, best_score, attempts, updated_at)`, dengan CHECK pada skor 0–5, `attempts ≥ 0`, dan format `item_id`.
- **Fungsi:** `merge_progress(items jsonb)` (security invoker, dipanggil lewat RPC) dan `delete_my_account()` (security definer). `execute` dicabut dari `public` dan `anon`, dan hanya diberikan ke `authenticated`.
- **RLS aktif di semua tabel.** Tabel konten: `select` untuk `anon, authenticated` dengan syarat `published`. `user_progress`: select, insert, update, dan delete hanya untuk `authenticated` dengan syarat `(select auth.uid()) = user_id`.
- **GRANT eksplisit di setiap migrasi**, termasuk `service_role` untuk seed. Sejak perubahan Data API Supabase (default untuk project baru sejak 30 Mei 2026), tabel tanpa GRANT tidak bisa diakses, dan BYPASSRLS tidak melewati GRANT.
- **Uji RLS** dengan pgTAP (`supabase test db`) di CI: dua pengguna, dan pengguna A tidak bisa membaca progres pengguna B.

### 11.4 Auth

- Pola resmi `@supabase/ssr`. `proxy.ts` hanya aktif di `/akun/*` dan `/auth/*`, dan sesi diverifikasi dengan `getClaims()`.
- Callback OAuth di `/auth/callback`. Parameter `next` hanya boleh berupa path relatif.
- **Google Cloud:** OAuth consent screen diset ke **"In production"**, karena dalam mode "Testing" hanya pengguna uji yang bisa login. Scope dibatasi `openid`, `email`, dan `profile`, jadi tidak perlu verifikasi Google. Satu OAuth client memuat callback setiap project Supabase.

### 11.5 Struktur folder

```
src/app/(public)/              beranda, materi/[slug], review, tentang (statis)
src/app/akun, src/app/auth/callback
src/components/{manga,lesson,quiz,ui}
src/lib/{supabase,progress,content}
content/{lessons,shared,overrides,acks,schema}  content/curriculum.json
scripts/lib/{conjugate,romaji,align,jmdict}.ts
scripts/{validate-content,build-content,seed-content,check-ids}.ts
supabase/{config.toml,migrations,tests}
tests/  docs/  .github/workflows/{ci,deploy-staging,deploy-production}.yml
```

## 12. Lingkungan, Git, dan deployment

Langkah setup lengkap ada di `docs/DEPLOYMENT.md`.

### 12.1 Branch dan aturan merge

```
feature/* · content/*  ──PR──►  staging  ──PR──►  main
hotfix/*  ──PR──► main, lalu di-merge balik ke staging
```

- **Ruleset GitHub** untuk `main` dan `staging`: wajib PR; status check `ci` wajib lulus, ditambah `release-gate` untuk `main`; bypass admin dimatikan; jumlah approval 0, karena pemilik tidak bisa meng-approve PR sendiri.
- Job `release-gate` (berjalan di PR dengan base `main`) gagal jika branch asal bukan `staging` atau `hotfix/*`, atau jika ada warning yang belum diakui pada materi berstatus `reviewed`.
- Format commit: Conventional Commits (`feat:`, `fix:`, `content:`, `docs:`, `chore:`).

### 12.2 Vercel (Hobby)

- `main` → Production. `staging` → Preview dengan URL branch otomatis (`benkyou-nihongo-git-staging-<akun>.vercel.app`) dan *environment variable* khusus branch.
- Domain staging dilindungi Vercel Authentication, sehingga hanya akun Vercel pemilik yang bisa membukanya. Ini cukup karena reviewer-nya pemilik sendiri (D3).
- **Batasan Hobby:** non-komersial, satu build berjalan bersamaan, dan repo harus di akun pribadi.

### 12.3 Supabase

- **M2–M5:** satu project, `benkyou-staging` (D9). **M6:** project `benkyou-prod` dibuat. Project gratis kedua masih tersedia selama tidak ada project aktif lain milik pemilik.
- Migrasi dengan Supabase CLI dari GitHub Actions (`supabase/setup-cli@v3`), lewat *pooler* (runner GitHub tidak mendukung IPv6). Connection string pooler diverifikasi saat setup M2.
- **Kedua project bisa di-*pause*** setelah 7 hari tanpa aktivitas. Tidak dibuat cron *keep-alive*.
- **Free tier tidak punya backup.** Setiap migrasi diuji di CI (`supabase db reset`) dan di staging lebih dulu.

### 12.4 CI/CD

| Workflow | Pemicu | Isi |
|---|---|---|
| `ci.yml` | Setiap PR | Lint, typecheck, test, validasi konten, `check:ids`, Supabase lokal (migrasi, uji RLS, seed), `next build`. Job `release-gate` untuk base `main`. |
| `deploy-staging.yml` | Push ke `staging` | Migrasi, seed, verifikasi hash, Deploy Hook staging |
| `deploy-production.yml` | Push ke `main` (aktif mulai M6) | Sama, ke project produksi, hanya untuk materi reviewed |

Kedua workflow deploy memakai `concurrency` per lingkungan.

### 12.5 Variabel lingkungan

| Variabel | Lokasi | Rahasia? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL` | `.env.local`, Vercel (per lingkungan) | Tidak |
| `SUPABASE_URL`, `SUPABASE_PROJECT_ID` | GitHub Environments (variable) | Tidak |
| `SUPABASE_SECRET_KEY`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `VERCEL_DEPLOY_HOOK_URL` | GitHub Environments (secret) | **Ya** |

## 13. Kebutuhan non-fungsional

| Aspek | Target dan cara uji |
|---|---|
| Performa | Lighthouse mobile pada halaman materi: Performance ≥ 90, LCP ≤ 2,5 detik, CLS ≤ 0,1. Diukur dengan median 3 kali jalan dari Chrome DevTools di staging (sambil login Vercel) atau dengan `next start` lokal. |
| Aksesibilitas | WCAG 2.2 AA. Pengujian: axe-core tanpa pelanggaran di 5 halaman utama, checklist keyboard manual, dan satu uji pembaca layar (NVDA + Chrome). |
| Responsif | Layar 360 px ke atas, gutter 16 px, tanpa scroll horizontal di level halaman |
| Browser | Chrome dan Edge 111+, **Firefox 128+** (batas Tailwind 4), Safari 16.4+ |
| SEO | Halaman statis, metadata per materi, gambar Open Graph monokrom, `sitemap.xml` |
| Privasi | Sesuai §8.8, tanpa analitik pihak ketiga |

## 14. Dokumentasi

| File | Isi |
|---|---|
| `README.md` | Ringkasan, cara menjalankan lokal, dan daftar perintah |
| `docs/PRD.md` | Dokumen ini |
| `docs/CONTENT_SPEC.md` | Aturan konten lengkap dari spesifikasi awal, beserta aturan token dan romaji |
| `docs/CONTENT_WORKFLOW.md` | Alur draf, validasi, review, dan rilis; perintah `/lanjut` |
| `docs/ARCHITECTURE.md` | Alur data, skema database, dan keputusan teknis |
| `docs/DESIGN_SYSTEM.md` | Token, tipografi, komponen, dan larangan |
| `docs/DEPLOYMENT.md` | Setup GitHub, Vercel, Supabase, dan Google OAuth; secret; pemulihan |
| `docs/GIT_WORKFLOW.md` | Branch, PR, ruleset, dan format commit |

## 15. Milestone dan kriteria penerimaan

Saya mengerjakan satu milestone pada satu waktu dan melapor setelah setiap milestone.

| Milestone | Isi | Selesai jika |
|---|---|---|
| **M0 — Fondasi** | Next.js, Tailwind dan token desain, font, halaman contoh, CI dasar, kerangka dokumentasi, git dengan `main` dan `staging`, koneksi GitHub dan Vercel | PR dengan error lint diblokir oleh required check; push langsung ke `main` ditolak; halaman contoh tampil di URL Vercel |
| **M1 — Pipeline konten** | Skema Zod, conjugator, romaji, penyelarasan furigana, validator, `check:dictionary`, `check:ids`, daftar kanji N5/N4, unit test | Semua test lolos; ada satu fixture rusak untuk setiap aturan error §9.1, dan masing-masing gagal dengan kode aturan, nama file, dan path JSON |
| **M2 — Database dan seed** | Project `benkyou-staging`, migrasi tabel konten, RLS, GRANT, `seed:content`, verifikasi hash, Supabase lokal di CI, Deploy Hook staging | Seed fixture ke staging berhasil dan idempoten (seed dua kali tidak mengubah apa pun); CI membangun halaman dari database lokal |
| **M3 — Materi 1 (draf)** | Perintah `/lanjut` (P1), draf Materi 1, validasi | `validate:content` dan `check:dictionary` tanpa error; status `ai-draft`; ter-seed di staging |
| **M4 — Halaman materi** | Beranda, bagian A–I, toggle dan preset, mode bermain peran, drill, soal interaktif, progres lokal | Checklist: semua bagian A–I tampil; 3 toggle dan 3 preset bekerja; mode bermain peran untuk setiap tokoh; 5 soal dinilai; tanpa scroll horizontal di 360 px; input kana diuji di Android dan iOS; target Lighthouse tercapai; **fixture materi kedua tampil tanpa perubahan kode** |
| **M5 — Akun dan progres** | Login Google, `merge_progress`, `delete_my_account`, kebijakan privasi, Review (P1), uji RLS | Progres anonim tergabung saat login dan aman diulang; uji pgTAP membuktikan A tidak bisa membaca progres B; hapus akun lalu login ulang dengan akun Google yang sama tidak mengembalikan progres; Review menggabungkan item ganda |
| **M6 — Review dan rilis** | Pemilik mereview Materi 1 di staging; project `benkyou-prod`; `deploy-production.yml`; halaman Tentang; audit aksesibilitas | Materi 1 berstatus `reviewed`; semua target §13 tercapai; produksi aktif |

Selama menunggu review pemilik (M6), pekerjaan M5 bisa tetap berjalan.

### 15.1 Tugas pemilik per milestone

| Milestone | Yang perlu Anda lakukan |
|---|---|
| M0 | Buat repo **publik** `benkyou-nihongo` di akun GitHub pribadi (tanpa README atau .gitignore), lalu kirim URL-nya. Hubungkan repo ke Vercel. Aktifkan ruleset sesuai `docs/GIT_WORKFLOW.md`. |
| M2 | Buat project Supabase `benkyou-staging`. Isi `.env.local`. Isi secret dan variable GitHub Environment `staging`. Buat Deploy Hook Vercel untuk branch `staging`. |
| M5 | Buat OAuth client Google (consent screen "In production"), isi client ID dan secret di Supabase Auth, lalu atur Redirect URL. |
| M6 | Review Materi 1 di staging. Buat project `benkyou-prod` beserta secret GitHub Environment `production`. |

Setiap langkah dijelaskan rinci di `docs/DEPLOYMENT.md`, dan saya akan mengabari saat langkah itu dibutuhkan.

## 16. Risiko dan mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Kalimat benar secara tata bahasa tetapi tidak alami, atau tingkat kesopanannya kurang pas (tidak ada review penutur asli, D3) | Tinggi | Risiko diterima pemilik. Latar Materi 1 dipilih agar です/ます alami; checklist review; pemilik bisa menambah reviewer kapan saja. |
| Bacaan valid tetapi salah konteks, kata bilangan, *rendaku* | Tinggi | Bacaan harus dari kandidat JMdict, warning untuk kata berbacaan ganda wajib diakui, conjugator dan romaji deterministik |
| Build gagal saat Supabase di-*pause* (D1-A) | Sedang | Situs yang sudah ter-deploy tetap berjalan; pulihkan project lalu jalankan ulang workflow |
| Free tier tanpa backup | Sedang | Konten selalu bisa di-seed ulang dari repo; progres pengguna yang berisiko hilang. Migrasi diuji di CI dan staging. |
| Font Jepang berat (sekitar 12 potongan file per keluarga per halaman) | Sedang | Maksimal 2 keluarga font Jepang; subset font di CI (P2) |
| Build bergantung pada `fonts.googleapis.com` | Rendah | Bisa dialihkan ke `next/font/local` |
| ID materi atau set soal berubah sehingga progres hilang | Sedang | `check:ids` di CI |
| Tutorial lama (`middleware.ts`, key anon, `getSession`) ikut tersalin | Sedang | Pola sudah ditetapkan di §11; ditolak saat review kode |
| Draf materi terbaca publik di GitHub (D8) | Rendah | Diterima; produksi hanya memuat materi `reviewed` |
| Tampilan abu-abu dan siku tetap terasa seperti template | Sedang | Bahasa visual manga yang spesifik (§10.1); review desain di M4 |

## 17. Metrik keberhasilan MVP

1. **Kualitas pipeline:** jumlah kesalahan furigana, romaji, atau konjugasi yang ditemukan pemilik saat review dicatat. Target: 0. Tidak ada kesalahan jenis ini yang dilaporkan dalam 30 hari setelah rilis.
2. **Hasil belajar:** setelah Materi 1, pemilik bisa memperkenalkan diri dengan pola materi tanpa melihat teks (mode bermain peran sebagai Rina), dan mendapat skor ≥ 4/5 pada percobaan pertama dengan preset "Latihan membaca". Percobaan ini dilakukan sebelum pemilik mereview isi materi, karena setelah review pemilik sudah hafal isinya.
3. **Waktu:** waktu percobaan pertama dicatat dan dibandingkan dengan perkiraan di bagian A.
4. **Perluasan:** fixture materi kedua tampil tanpa perubahan kode (kriteria M4).

---

## Lampiran — Sumber riset utama

- Next.js 16.4 dan panduan upgrade: nextjs.org/blog/next-16-4, nextjs.org/docs/app/guides/upgrading/version-16
- Tailwind CSS v4: tailwindcss.com/docs/installation/framework-guides/nextjs, tailwindcss.com/docs/compatibility
- Supabase SSR, auth, API keys, GRANT Data API, free tier, SMTP: supabase.com/docs, supabase.com/changelog (45329), supabase.com/pricing
- Vercel environments, limits, fair use, deployment protection: vercel.com/docs
- GitHub protected branches dan rulesets: docs.github.com
- Shippori Antique: github.com/google/fonts/tree/main/ofl/shipporiantique; アンチック体: ja.wikipedia.org/wiki/アンチック体
- CSS Ruby: w3.org/TR/css-ruby-1; W3C JLReq: w3.org/TR/jlreq
- Romanisasi ALA-LC 2022: loc.gov/catdir/cpso/romanization/japanese.pdf
- Konjugasi: guidetojapanese.org (Tae Kim); kelas kata kerja JMdict: edrdg.org/jmdict/jmdict_dtd_h.html
- Lisensi EDRDG: edrdg.org/edrdg/licence.html; jmdict-simplified: github.com/scriptin/jmdict-simplified
- WanaKana dan React: github.com/WaniKani/WanaKana (issue #108)
- FAQ JLPT: jlpt.jp/e/faq; kontras WCAG: w3.org/WAI/WCAG22/Understanding/contrast-minimum
