# Spesifikasi Konten — Benkyō Nihongo

| | |
|---|---|
| Status | Bagian 1 berlaku sebagai acuan resmi. Bagian 2 masih draf dan difinalkan di M1. |
| Tanggal | 22 Oktober 2026 |
| Sumber | Spesifikasi konten awal dari pemilik produk; PRD v0.2 (`docs/PRD.md`) §8 dan §9 |
| Dokumen terkait | `docs/PRD.md`, `docs/CONTENT_WORKFLOW.md`, `docs/ARCHITECTURE.md` |

Dokumen ini adalah acuan resmi untuk menulis materi (PRD §9.1). Cara aturan ditegakkan oleh CI dijelaskan di Bagian 2.13.

**Cara membaca dokumen ini**

- **Bagian 1** memuat seluruh aturan konten dari spesifikasi awal, disusun ulang tanpa ada aturan yang dihapus.
- Blok **Catatan PRD** menandai tempat PRD v0.2 sengaja mengubah, memperketat, atau menafsirkan sebuah aturan. Di titik itu, versi PRD yang berlaku.
- **Bagian 2** memuat aturan teknis: format JSON, token, furigana, romaji, ID, dan validasi. Pipeline validasi belum dibangun, jadi bagian ini berstatus *(rencana, M1)*.
- "Ditentukan di M1" (atau milestone lain) berarti hal itu belum diputuskan. Jangan menebak; tunggu keputusan di milestone tersebut.

**Istilah**

| Istilah | Arti |
|---|---|
| Giliran | Satu kesempatan bicara seorang tokoh. Satu giliran bisa berisi beberapa kalimat. |
| Token | Potongan terkecil teks Jepang yang disimpan di JSON: satu kata, satu partikel, atau satu tanda baca. |
| Partikel | Kata tugas seperti は, が, を, に, へ, で, と, も, から, か, ね. |
| Furigana | Bacaan kecil dalam kana di atas kanji. Di HTML ditulis dengan elemen `<ruby>`. |
| Okurigana | Kana yang mengikuti kanji dalam satu kata, misalnya きます pada 行きます. |
| Jukujikun | Bacaan untuk satu kata utuh yang tidak bisa dibagi per kanji, misalnya 今日 (きょう). |
| Lemma | Bentuk kamus sebuah kata, misalnya 行く untuk 行きます. |
| Teineigo | Bahasa sopan dengan bentuk です/ます. |
| Futsūkei | Bentuk biasa (kasual), misalnya だ atau kata kerja bentuk kamus. |
| Keigo | Bahasa hormat dan merendah, tingkatnya di atas teineigo. |
| Conjugator | Kode yang menghitung perubahan bentuk kata kerja (`scripts/lib/conjugate.ts`). |
| JMdict | Kamus Jepang terbuka dari EDRDG. Dipakai hanya untuk validasi di CI. |
| CI | Pengecekan otomatis di GitHub Actions pada setiap PR. |
| Override | Pengecualian tertulis atas aturan otomatis, disimpan di `content/overrides/` beserta alasannya. |
| Ack | Pengakuan tertulis atas sebuah warning, disimpan di `content/acks/` beserta alasannya. |

---

## Bagian 1. Aturan konten

### 1.1 Tujuan konten

Setiap materi adalah latihan percakapan bahasa Jepang (*kaiwa* / 会話) yang alami, praktis, dan sering dipakai dalam kehidupan sehari-hari di Jepang. Fokus utamanya membantu pelajar:

1. memahami percakapan nyata;
2. membaca hiragana, katakana, dan kanji;
3. mempelajari kosakata dan perubahan bentuk kata kerja.

**Tujuan akhir:** pelajar memahami dan bisa memakai bahasa Jepang sehari-hari, bukan hanya menghafal terjemahan.

### 1.2 Tema percakapan

1. Satu materi memakai satu tema percakapan.
2. Utamakan situasi yang sering dijumpai:
   - perkenalan diri;
   - di rumah bersama keluarga;
   - bangun tidur dan rutinitas pagi;
   - berangkat kerja atau sekolah;
   - teman kerja;
   - memesan makanan di restoran;
   - minimarket atau supermarket;
   - bertanya arah dan transportasi umum;
   - membuat janji dan mengatur waktu;
   - hobi dan akhir pekan;
   - cuaca;
   - menelepon;
   - meminta bantuan dan izin;
   - menyampaikan pendapat, perasaan, dan rencana;
   - tempat kerja, baik formal maupun informal.
3. Variasikan jumlah tokoh: dua, tiga, atau lebih.
4. Pakai nama tokoh yang konsisten dan mudah dibedakan.
5. Utamakan bahasa Jepang yang lazim dipakai penutur asli. Jangan menerjemahkan kalimat Indonesia secara harfiah ke bahasa Jepang.

> **Catatan PRD (§9.5, §8.9):** urutan tema dicatat di `content/curriculum.json`. Perintah `/lanjut` memilih tema berikutnya yang belum dipakai dan memvariasikan jumlah tokoh. CI memberi warning bila tema dipakai ulang.

### 1.3 Tingkat kesulitan

1. Mulai dari JLPT N5, lalu naik bertahap menuju N4.
2. Pakai kalimat yang umum dan mudah dipahami.
3. Tambahkan kosakata baru secara bertahap. Jangan memakai terlalu banyak kosakata sulit.
4. Pakai pola tata bahasa yang sesuai dengan tingkatnya.
5. Sertakan teineigo dan, jika relevan, futsūkei.
6. Jelaskan bila sebuah ungkapan lebih lazim dipakai dalam situasi formal atau informal.

> **Catatan PRD:**
> - Level ditulis sebagai **perkiraan**, karena JLPT tidak menerbitkan daftar kosakata atau kanji resmi sejak 2010 (§8.8). MVP hanya mencakup N5–N4 (§3.3).
> - Kanji di luar daftar N5/N4 internal memicu warning. Daftar ini tidak resmi dan dibuat di M1 (§9.1).
> - Batas jumlah kosakata baru per materi belum ada (Q2, §5.2). Batas ini diputuskan sebelum Materi 2.
> - Materi 1: dialog utama seluruhnya teineigo. Bentuk kasual hanya muncul lewat perbandingan di bagian G (§9.5).

### 1.4 Format penulisan bahasa Jepang

Aturan A, B, dan C berlaku untuk **setiap kalimat** percakapan.

**A. Teks Jepang asli**

1. Tulis dengan hiragana, katakana, dan kanji sebagaimana lazimnya.
2. Beri furigana di atas kanji dengan format `<ruby>漢字<rt>かんじ</rt></ruby>`.
3. Jika ruby tidak bisa tampil, format cadangannya adalah bacaan dalam kurung: 今日（きょう）は会社（かいしゃ）に行（い）きます。
4. Jangan menulis kanji tanpa bacaan.
5. Furigana harus sesuai dengan bacaan kata itu dalam konteks kalimat.

> **Catatan PRD (§9.1, §9.2):** penulis tidak menulis HTML ruby atau format kurung. Teks Jepang disimpan sebagai array token, dan bacaan ditulis per token di field `r`. Build membuat segmen ruby lalu merendernya sebagai elemen `<ruby>`, `<rt>`, dan `<rp>`. Elemen `<rp>` menghasilkan format cadangan berkurung. Aturan ini berlaku untuk **semua** teks Jepang di file materi: dialog utama dan variasi, contoh kosakata dan tata bahasa, ungkapan beserta padanannya, soal, dan drill. Lihat Bagian 2.3–2.5.

**B. Romaji**

1. Pakai romanisasi Hepburn secara konsisten.
2. Tulis vokal panjang dengan makron, misalnya ō dan ū.
3. Jangan menghilangkan partikel.
4. Jangan mengubah susunan kata.

> **Catatan PRD (§9.1, §9.2):** romaji tidak ditulis tangan. Romaji dihasilkan otomatis dari bacaan token dengan Hepburn yang dimodifikasi versi ALA-LC 2022, sehingga partikel dan susunan kata selalu mengikuti teks Jepang. Pengecualian dicatat di override beserta alasannya. Aturan lengkapnya ada di Bagian 2.6.

**C. Terjemahan Indonesia**

1. Terjemahan harus alami dalam bahasa Indonesia.
2. Jika makna harfiah berbeda dari makna sebenarnya, beri penjelasan singkat.

> **Catatan PRD (§8.2 C, §9.4):** penjelasan ini disimpan sebagai catatan opsional per kalimat. Checklist review memeriksa bahwa pilihan "kamu" atau "Anda" konsisten, dan bahwa catatan makna harfiah ada di kalimat yang membutuhkannya.

### 1.5 Struktur setiap materi

Setiap materi memuat bagian A sampai I dengan urutan berikut.

#### A. Informasi materi

- nomor materi;
- judul dalam bahasa Jepang dan bahasa Indonesia;
- level JLPT;
- situasi dan tempat;
- jumlah tokoh;
- tujuan pembelajaran;
- perkiraan waktu latihan.

> **Catatan PRD (§8.2 A):** judul Jepang diberi furigana, dan level ditampilkan sebagai perkiraan.

#### B. Daftar tokoh

- nama;
- hubungan antartokoh;
- tingkat kesopanan bahasa yang dipakai.

> **Catatan PRD (§8.2 B, §9.2):** nama diberi furigana bila berkanji. Tingkat kesopanan ditulis per tokoh sebagai nilai bawaan beserta catatan (misalnya "sopan kepada guru; kasual kepada teman sekelas"), dan bisa ditambah per kalimat. Lihat Bagian 2.8.

#### C. Dialog lengkap

1. Dialog terdiri dari 10–20 giliran, atau lebih.
2. Setiap giliran memuat nama tokoh, lalu:
   1. teks bahasa Jepang dengan furigana;
   2. romaji;
   3. terjemahan Indonesia.
3. Setiap kalimat punya romaji dan terjemahan sendiri.

> **Catatan PRD (§8.2 C, §9.1, §9.2):**
> - Kurang dari 10 giliran = **error**. Lebih dari 20 giliran = **warning** yang harus diakui, karena spesifikasi mengizinkan "atau lebih".
> - Data disusun bertingkat: giliran → kalimat. Setiap kalimat punya ID sendiri (misalnya `L001.main.03.2`) dan catatan opsional bila makna sebenarnya berbeda dari terjemahan harfiah.

#### D. Kosakata penting

Tabel dengan kolom berikut:

| Kosakata Jepang (dengan furigana) | Romaji | Arti | Jenis kata | Contoh penggunaan |
|---|---|---|---|---|

Hanya kosakata yang muncul di dialog yang dimasukkan.

> **Catatan PRD (§8.2 D, §9.1):** "dialog" di sini berarti dialog utama. Kosakata dicocokkan dengan dialog berdasarkan bentuk dasar; kosakata yang tidak muncul = **error**. Mulai Materi 2, setiap kosakata diberi penanda "baru" atau "sudah di Materi X". Contoh penggunaan juga ditulis sebagai token.

#### E. Tabel kata kerja

Kolom menurut spesifikasi awal:

| Bentuk kamus | Furigana | Romaji | Arti | Bentuk ます | Bentuk て | Bentuk lampau ました | Bentuk negatif ません |
|---|---|---|---|---|---|---|---|

Aturan:

1. Tabel memuat semua kata kerja unik yang muncul di dialog.
2. Kata kerja utama ditulis lebih dulu. Kata kerja tambahan ditandai dan dipisahkan.
3. Setiap bentuk yang berkanji diberi furigana.
4. Romaji wajib untuk bentuk kamus, bentuk ます, dan bentuk て.
5. Kelompok kata kerja (I, II, III) harus benar.
6. Jangan membentuk bentuk て dengan menghapus ます lalu menambahkan て. Cara ini salah untuk banyak kata kerja: 行きます → 行って (bukan 行きて), 読みます → 読んで (bukan 読みて).
7. Tunjukkan hubungan antara bentuk yang muncul di dialog dan bentuk kamusnya.
8. Tidak ada kata kerja yang ditulis dua kali.
9. Tambahkan kolom kelompok kata kerja bila bermanfaat.

> **Catatan PRD (§8.2.1, §9.1, §9.2):**
> - **Kolom kelompok wajib.** Ini sengaja lebih ketat dari aturan 9. Nilainya I (*godan*), II (*ichidan*), atau III (tidak beraturan).
> - Kolom Furigana dan Romaji digabung ke sel bentuk kamus: bentuk kamus ditampilkan dengan furigana dan romaji. Bentuk ます dan て diberi furigana dan romaji; bentuk ました dan ません diberi furigana.
> - Ada kolom tambahan **Bentuk di dialog**: bentuk yang benar-benar muncul (misalnya 住んでいます, 来ました), dengan tautan ke kalimatnya. Kolom ini memenuhi aturan 7.
> - Semua bentuk dihitung oleh conjugator, bukan ditulis tangan. Dengan begitu aturan 3, 5, dan 6 dipenuhi oleh kode.
> - **Error dua arah:** kata kerja di tabel harus ada di dialog utama, dan setiap kata kerja di dialog utama harus ada di tabel tepat satu kali. Ini menegakkan aturan 1 dan 8.
> - Kata kerja **utama** adalah kata kerja yang mendukung tujuan materi. Selain itu, kata kerja berstatus **tambahan** (field `role`).
> - Cakupan tabel (です/だ, する-majemuk, いる, たい, お願いします) ada di Bagian 2.7.

#### F. Penjelasan tata bahasa

1. Jelaskan 3–5 pola yang benar-benar muncul di dialog.
2. Setiap pola memuat:
   - pola;
   - fungsi dan makna;
   - rumus;
   - contoh dari dialog;
   - terjemahan contoh;
   - satu contoh baru.
3. Utamakan pola berikut bila muncul di dialog: ～ます, ～ません, ～ました, ～てください, ～てもいいですか, ～たいです, ～から, ～けど.
4. Jangan menjelaskan pola yang tidak muncul seolah-olah dipakai tokoh.

> **Catatan PRD (§8.2 F, §8.6, §9.1):** jumlah pola di luar 3–5 = **error**. Contoh dari dialog harus persis ada di kalimat yang dirujuk (**error** bila tidak) dan ditautkan ke kalimat itu. Setiap pola punya ID yang stabil, misalnya `kara-asal` dan `kara-alasan` untuk dua fungsi から yang berbeda. Bentuk lain yang sama-sama benar dicatat di `alternatives[]`.

#### G. Ungkapan penutur asli

1. Pilih 3–5 ungkapan dari dialog.
2. Setiap ungkapan memuat:
   - arti;
   - konteks;
   - tingkat kesopanan;
   - situasi pemakaian.
3. Bandingkan bentuk kasual dan formalnya.

> **Catatan PRD (§8.2 G, §9.1):** ungkapan harus ada di dialog utama (**error** bila tidak), dan jumlah di luar 3–5 = **error**. Bila tidak ada padanan formal atau kasualnya, tulis alasannya. Bentuk alternatif yang sama-sama benar dicatat di `alternatives[]` beserta penjelasan perbedaannya.

#### H. Latihan pemahaman

1. Buat 5 soal campuran dari empat tipe:
   - pemahaman isi dialog;
   - memilih arti kosakata;
   - melengkapi kalimat;
   - mengubah kata kerja ke bentuk ます atau て.
2. Letakkan kunci jawaban setelah soal, dengan penjelasan singkat.

> **Catatan PRD (§8.5, §9.1, §9.2, §9.4):** cara menjawab per tipe soal:
>
> | Tipe soal | Cara menjawab |
> |---|---|
> | Pemahaman isi dialog | Pilihan ganda. Pertanyaan ditulis dalam bahasa Jepang (dengan furigana), dan terjemahannya bisa dibuka. |
> | Arti kosakata | Pilihan ganda |
> | Melengkapi kalimat | Pilihan ganda (partikel, kata) |
> | Mengubah kata kerja ke bentuk ます atau て | Input teks. Kunci jawaban dihitung oleh conjugator. Jawaban diterima dalam kana maupun kanji, termasuk bentuk alternatif yang terdaftar. |
>
> - Jumlah soal bukan 5, atau ada tipe soal yang tidak muncul = **error**.
> - Set soal punya ID yang beku setelah rilis, misalnya `L001.quiz`.
> - Checklist review: tidak ada soal yang punya lebih dari satu jawaban benar.

#### I. Latihan berbicara

1. Membaca dialog dengan suara keras.
2. Mengulang peran setiap tokoh.
3. Mengganti beberapa kata untuk membuat percakapan baru.
4. Satu contoh percakapan variasi dengan situasi serupa.

> **Catatan PRD (§8.4):** keempat aturan dipetakan ke fitur halaman (rencana, M4):
> - Aturan 1 → panduan membaca keras.
> - Aturan 2 → mode bermain peran. Mode ini memakai dialog utama: kalimat tokoh yang dipilih ditutup, lalu pelajar mengucapkannya sendiri.
> - Aturan 3 → drill substitusi: pola dari dialog dengan slot yang bisa diganti, misalnya 「[nama]です」 dan 「[negara]から来ました」. Setiap kombinasi ditulis di file materi dan divalidasi, tidak dirangkai saat runtime.
> - Aturan 4 → dialog variasi, dengan format dan validasi yang sama dengan dialog utama. Kata baru yang tidak ada di tabel D dan E diberi glosarium singkat di bagian ini.

### 1.6 Aturan kualitas

| # | Aturan | Penegakan (PRD §9.1, §9.4) |
|---|---|---|
| 1 | Jangan mengarang arti kanji, furigana, atau konjugasi. | Furigana: bacaan harus ada di JMdict (error). Konjugasi: dihitung conjugator (error bila berbeda). Arti dalam bahasa Indonesia: review pemilik. |
| 2 | Tata bahasa dan kosakata harus sesuai konteks. | Pola dan kosakata harus muncul di dialog (error). Ketepatan konteks: review pemilik. |
| 3 | Romaji bukan pengganti teks Jepang. | Romaji selalu dihasilkan dari teks Jepang, dan teks Jepang selalu ada. |
| 4 | Hiragana untuk unsur gramatikal, katakana untuk kata serapan, kanji untuk kata yang lazim ditulis dengan kanji. | Warning bila kata yang di JMdict ditandai "biasanya ditulis kana" ditulis dengan kanji (misalnya 下さい dalam 〜てください, 宜しく). Ditambah item checklist. |
| 5 | Setiap kata berkanji diberi furigana. | Error: token berkanji atau berangka tanpa bacaan. |
| 6 | Bedakan bahasa formal dan kasual. | Tingkat kesopanan per tokoh dan per kalimat (Bagian 2.8). Item checklist. |
| 7 | Hindari kalimat yang kaku. | Review pemilik dengan checklist. |
| 8 | Tabel kata kerja konsisten dengan dialog. | Error dua arah; semua bentuk dihitung conjugator. |
| 9 | Jika lebih dari satu bentuk benar, jelaskan perbedaannya. | Field `alternatives[]` (Bagian 2.9). Item checklist. |
| 10 | Bahasa penjelasan adalah bahasa Indonesia. | Review pemilik. |

> **Catatan PRD (D3 di §5.1, §8.8):** pemilik mereview sendiri tanpa penutur asli, dan website **tidak** menampilkan label status review. Validasi otomatis menangkap kesalahan furigana, romaji, dan konjugasi, tetapi tidak bisa menilai kealamian dan tingkat kesopanan. Risiko ini diterima pemilik.

### 1.7 Cara memulai dan melanjutkan

Spesifikasi awal ditulis untuk tutor berbasis chat:

1. Mulai langsung dengan Materi 1 bertema perkenalan diri atau rutinitas pagi.
2. Setelah satu materi selesai, tunggu instruksi.
3. "Lanjut": buat materi berikutnya dengan tema baru, dan jangan mengulang dialog.
4. "Latihan": buat latihan tambahan dari materi terakhir.
5. "Review": buat rangkuman kosakata, kata kerja, dan tata bahasa dari materi yang sudah dipelajari.

> **Catatan PRD (§8.9, §9.5):** website tidak punya lawan bicara, jadi setiap perintah dipetakan ke fitur dan alur kerja konten:
>
> | Perintah di spesifikasi | Di website (pelajar) | Di alur kerja konten (penulis) |
> |---|---|---|
> | "Mulai dengan Materi 1" | Materi 1 tersedia di beranda | Materi 1 ditulis di M3 |
> | "Lanjut" | Tombol "Materi berikutnya" di akhir halaman materi (rencana, M4). Di materi terakhir tombol ini bertuliskan "Materi berikutnya sedang disiapkan" dengan tautan ke Review. | Perintah Claude Code `/lanjut` (rencana, M3) membaca semua materi yang ada dan `content/curriculum.json`, memilih tema berikutnya yang belum dipakai, memvariasikan jumlah tokoh, lalu menyusun draf di branch `content/*`. CI memberi warning jika tema dipakai ulang atau ada kalimat dialog utama yang sama dengan materi sebelumnya (kecuali salam baku). |
> | "Latihan" | Bagian "Latihan tambahan" (P2, setelah MVP) | Set soal tambahan `L001.quiz.2` ditambahkan lewat PR (P2) |
> | "Review" | Halaman `/review` (P1, rencana, M5) | Tidak perlu perintah |
> | "Tunggu instruksi sebelum materi berikutnya" | Tidak relevan | Materi baru hanya terbit lewat PR yang disetujui |
>
> Materi 1 adalah **Perkenalan Diri** (自己紹介), dengan latar hari pertama kelas di sebuah sekolah bahasa Jepang di Tokyo dan 4 tokoh. Latar kantor dari PRD v0.1 diganti karena perkenalan kepada atasan menuntut keigo (〜と申します, お世話になります) yang berada di atas N5.

---

## Bagian 2. Aturan teknis penulisan (draf, difinalkan di M1)

**Status: (rencana, M1).** Skema, validator, conjugator, generator romaji, dan penyelarasan furigana belum dibangun. Aturan di bawah mengikuti PRD v0.2 §9.2–§9.3. Nama field dan detail yang belum disebut PRD ditandai "Ditentukan di M1". Daftar lengkap hal yang belum diputuskan ada di Bagian 2.15.

### 2.1 Prinsip: pilih, jangan karang

PRD §9.3 menetapkan pembagian kerja berikut.

| Ditulis oleh penulis (draf Claude) | Dihitung oleh kode |
|---|---|
| Teks Jepang dan batas token | Romaji |
| Bacaan (`r`), **dipilih** dari kandidat bacaan JMdict, bukan dikarang | Semua bentuk kata kerja di tabel E dan kunci soal ubah bentuk |
| Bentuk dasar (`lemma`, `lemmaR`) dan jenis perubahan bentuk (`form`) | Segmen ruby (pembagian furigana per bagian kata) |
| Semua teks Indonesia: terjemahan, arti, penjelasan | Statistik kosakata |

**Lisensi JMdict (§9.3):** data JMdict hanya dipakai untuk validasi di CI. Tidak ada glos (arti kamus) atau entri JMdict yang dikirim ke website, jadi glos JMdict tidak boleh disalin ke file materi. Kelas kata kerja yang disimpan hanyalah label tata bahasa. Mengubah aturan ini butuh keputusan baru karena memicu kewajiban *share-alike* lisensi CC BY-SA.

### 2.2 File dan folder

| Path | Isi |
|---|---|
| `content/lessons/001-perkenalan-diri.json` | Satu file untuk satu materi |
| `content/curriculum.json` | Urutan tema |
| `content/overrides/` | Pengecualian bacaan atau romaji, beserta alasannya |
| `content/acks/` | Pengakuan warning, beserta alasannya |
| `content/schema/` | Skema materi. Ditulis dengan Zod dan diekspor ke JSON Schema agar editor bisa memberi *autocomplete*. Pembagian filenya Ditentukan di M1. |
| `content/shared/` | Isinya Ditentukan di M1 |
| `.generated/` | Hasil `build:content`: segmen ruby, romaji, bentuk kata kerja, dan statistik kosakata. Di-gitignore dan tidak diedit tangan. |

Menambah materi baru cukup dengan satu PR yang hanya mengubah folder `content/`: file materi, ditambah ack atau override bila perlu (§3.2).

### 2.3 Format token

Semua teks Jepang di file materi disimpan sebagai array token. Contoh dari PRD §9.2:

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

| Field | Kapan diisi | Isi |
|---|---|---|
| `t` | Selalu | Teks persis seperti tertulis, termasuk tanda baca. |
| `r` | Wajib bila `t` mengandung kanji atau angka | Bacaan **seluruh token** dalam hiragana. Pada contoh PRD, token yang seluruhnya kana tidak memakai `r`. |
| `prt` | Wajib pada **setiap** partikel | `true`. は dan へ yang berdiri sendiri tanpa penanda ini ditolak CI. |
| `name` | Pada nama orang | `true`, agar romaji diawali huruf kapital. |
| `lemma` | Pada kata kerja yang berubah bentuk | Bentuk kamus, misalnya 行く untuk 行きます. Dipakai juga untuk mencocokkan kosakata dan tabel kata kerja dengan dialog. |
| `lemmaR` | Bersama `lemma` | Bacaan bentuk kamus. Di contoh PRD, field ini tetap diisi walaupun lemma-nya kana (いる). |
| `form` | Bersama `lemma` | Satu nilai dari daftar di bawah. |
| `aux` | Pada kata kerja bantu | `true`, misalnya います pada 住んでいます. |
| `contraction` | Pada bentuk kontraksi kasual (〜てる, 〜ちゃう) | Wajib diakui reviewer. Format nilainya Ditentukan di M1. |

**Nilai `form` yang didukung conjugator di MVP (§9.3).** Contoh memakai 行く, kelompok I dengan pengecualian bentuk て dan た:

| `form` | Bentuk | Contoh |
|---|---|---|
| `dict` | Bentuk kamus | 行く |
| `masu` | Sopan | 行きます |
| `masen` | Sopan, negatif | 行きません |
| `mashita` | Sopan, lampau | 行きました |
| `masendeshita` | Sopan, lampau negatif | 行きませんでした |
| `mashou` | Sopan, ajakan | 行きましょう |
| `te` | Bentuk て | 行って |
| `ta` | Biasa, lampau | 行った |
| `nai` | Biasa, negatif | 行かない |
| `nakatta` | Biasa, lampau negatif | 行かなかった |
| `stem` | Pangkal kata kerja (bentuk ます tanpa ます) | 行き |

- Bentuk di luar daftar langsung menjadi CI error dengan pesan "tambahkan bentuk ke conjugator". Bentuk baru hanya ditambahkan bersama unit test-nya.
- Bentuk potensial, volitional, dan kondisional ditambahkan sebelum materi N4 pertama. Ini perubahan kode yang sudah direncanakan.
- Kata bantu たい dikonjugasikan sebagai adjektiva-i (たいです, たくない). Cara menandai tokennya Ditentukan di M1.

### 2.4 Pemecahan token

1. Bentuk majemuk dipecah menjadi beberapa token supaya setiap bagian bisa dicek:
   - 住んでいます → 住んで (`form: "te"`, lemma 住む) + います (`form: "masu"`, lemma いる, `aux: true`);
   - 来てください → 来て (`form: "te"`, lemma 来る) + ください. Cara menandai ください Ditentukan di M1.
2. Kata kerja yang bentuknya ada di daftar `form` tetap satu token, misalnya 行きます dan 行きませんでした.
3. Kata kerja する-majemuk ditulis sebagai satu token dengan lemma 〜する, misalnya 勉強して dengan lemma 勉強する (contoh PRD).
4. Setiap partikel adalah token sendiri dengan `prt: true`.
5. Setiap tanda baca adalah token sendiri, misalnya `{ "t": "。" }`.

### 2.5 Furigana: okurigana dan jukujikun

1. Tulis `r` untuk seluruh token. Jangan memecah furigana sendiri.
2. Build (`build:content`, dengan `scripts/lib/align.ts`) memisahkan okurigana secara otomatis. Contoh: 行きます dengan `r` いきます → furigana い hanya di atas 行.
3. Kata yang mencampur kana dan kanji di depan atau di belakang juga dipisah otomatis. Contoh: お母さん dengan `r` おかあさん → furigana かあ di atas 母.
4. Pada contoh PRD, rangkaian kanji yang berurutan mendapat satu furigana untuk seluruh rangkaian: 毎日 (まいにち), 日本語 (にほんご), 勉強 (べんきょう).
5. Kata jukujikun (今日 きょう, 大人 おとな) selalu mendapat satu furigana untuk seluruh kata, karena bacaannya tidak bisa dibagi per kanji.
6. Token yang mengandung angka juga wajib punya `r`, misalnya 3時 dengan `r` さんじ.
7. Kata berbacaan ganda (今日, 一日, 何, 人) memicu warning dan wajib dikonfirmasi reviewer. Kata bilangan dan perubahan bunyi (一人 ひとり, 三本 さんぼん) termasuk bagian yang paling rawan salah (§16).
8. Penanganan bila penyelarasan furigana gagal atau ambigu Ditentukan di M1.

### 2.6 Aturan romaji

Romaji dihasilkan oleh `scripts/lib/romaji.ts` dari `r` setiap token, atau dari `t` bila token seluruhnya kana. Sistemnya Hepburn yang dimodifikasi menurut tabel romanisasi ALA-LC 2022 dari Library of Congress (loc.gov/catdir/cpso/romanization/japanese.pdf). Kolom "ALA-LC" di bawah menunjuk nomor bagian dokumen itu.

**Konversi bunyi**

| Aturan | Contoh | ALA-LC |
|---|---|---|
| Vokal panjang a, e, o, u di dalam satu morfem (satuan bermakna terkecil) ditulis dengan makron: ā, ē, ō, ū. おう dan おお menjadi ō; うう menjadi ū. | お母さん *okāsan*, お姉さん *onēsan*, 勉強 *benkyō*, 大きい *ōkii*, 空気 *kūki* | §2.5.2, §2.5.3 |
| Vokal panjang i selalu ditulis ii. | お兄さん *oniisan*, いいえ *iie* | §2.5.4 |
| e + i tetap ditulis ei, tanpa makron. | 先生 *sensei*, 映画 *eiga* | contoh di §6.2.1 (*kokusei*) |
| ー ditulis sebagai makron pada vokal sebelumnya, termasuk i (ī). | コーヒー *kōhī*, ラーメン *rāmen* | §2.5.1 |
| Vokal yang bertemu di batas dua morfem tidak digabung. Akhiran う pada bentuk kamus kata kerja termasuk di sini. | 思う *omou*, 子牛 *koushi* | §2.5.5 |
| は dan へ sebagai partikel ditulis wa dan e. | これは *kore wa*, 学校へ *gakkō e* | §2.3.1 |
| を selalu ditulis o. | 本を *hon o* | Tabel A, catatan 4 |
| ん selalu ditulis n, termasuk sebelum b, m, dan p. | 新聞 *shinbun*, 散歩 *sanpo* | Tabel A, catatan 5 |
| ん sebelum vokal atau y diberi apostrof: n'. Karena antar-token sudah dipisah spasi, aturan ini hanya berlaku di dalam satu token. | 金曜日 *kin'yōbi*, 千円 *sen'en* | §5.2 |
| っ menggandakan konsonan berikutnya. Sebelum ch, っ ditulis t (tch). | 切手 *kitte*, 学校 *gakkō*, 一緒 *issho*, 抹茶 *matcha* | Tabel A, catatan ii |
| Ejaan dasar: し shi, ち chi, つ tsu, ふ fu, じ ji, ぢ ji, づ zu, しゃ sha, ちゃ cha, じゃ ja. Gabungan katakana untuk kata serapan memakai Tabel B, misalnya チェ che, ティ ti, ファ fa. | チェン *Chen* | Tabel A dan B |

Batas morfem di dalam satu token tidak terlihat oleh kode. Kasus seperti 子牛 *koushi* dicatat di override beserta alasannya. Cara generator mengenali akhiran う bentuk kamus (思う *omou*) Ditentukan di M1; hasilnya sudah ditetapkan sebagai unit test (§9.3).

**Spasi, tanda baca, dan huruf kapital (PRD §9.2)**

| Aturan | Contoh | Sesuai ALA-LC |
|---|---|---|
| Spasi mengikuti batas token: satu token menjadi satu kata romaji. | 本 + を → *hon o* | §6.1.1 |
| Kata kerja dengan ます digabung, karena satu token. | 行きます *ikimasu* | §6.8.1.1 |
| Bentuk て dan kata kerja bantu dipisah, karena dua token. | 住んで + います → *sunde imasu* | §6.8.1.2 |
| Partikel ditulis terpisah dari kata lain. | です + か → *desu ka* | §6.8.4 |
| Tanda baca menempel pada kata sebelumnya: 。→ . 、→ , ？→ ? | *... imasu.* | §4.2 |
| Huruf kapital pada huruf pertama kalimat dan pada token `name: true`. | *Rina wa ...* | §3.1 untuk nama orang |

**Perbedaan dengan ALA-LC yang belum diputuskan (Ditentukan di M1)**

1. **Kata kerja する-majemuk.** Contoh PRD §9.2 menulis 勉強しています sebagai *benkyō shite imasu*, dengan kata benda dan する terpisah. ALA-LC §6.8.1.1 menggabungnya: 支配する *shihaisuru*, ドライブする *doraibusuru*. Contoh PRD itu juga tidak sesuai aturan "satu token menjadi satu kata", karena 勉強して adalah satu token. Hal yang sama berlaku untuk お願いします.
2. **Sapaan setelah nama.** PRD §9.5 menulis *Yamada-sensei*. ALA-LC §6.9.2.3.1 menulis gelar majemuk terpisah dan berhuruf kapital (竹沢先生 *Takezawa Sensei*), dan hanya memakai tanda hubung untuk sufiks satu kanji atau kana (井上さん *Inoue-san* di §3.2; 中村君 *Nakamura-kun* di §6.9.2.3.2). Cara memecah token dan menulis romaji さん atau 先生 setelah nama belum diputuskan.
3. **Nama selain nama orang.** ALA-LC mengapitalkan nama geografis dan turunannya (§3.3, §3.9.1: 横浜 *Yokohama*, 日本語 *Nihongo*). Contoh PRD §9.2 juga menulis *Nihongo* dengan huruf kapital, padahal token 日本語 tidak bertanda `name`, dan `name: true` hanya untuk nama orang. Ini langsung memengaruhi Materi 1 (インドネシア, 台湾, フィリピン). Penanda untuk nama tempat, negara, dan bahasa belum diputuskan.
4. **Salam yang memuat は.** Jika こんにちは atau こんばんは ditulis sebagai satu token, generator menghasilkan *konnichiha*. Cara penulisannya belum diputuskan.
5. **Tanda baca lain.** ALA-LC §4.2 memetakan ！→ !, 「」→ "...", dan 〜 → - (untuk angka dan tanggal). PRD baru menetapkan 。、？. Penerapan tanda baca lain belum diputuskan.

### 2.7 Tabel kata kerja: entri, cakupan, dan bentuk

**Entri (§9.2):** `lemma`, `lemmaR`, kelas kata kerja JMdict, arti, dan `role` (`utama` atau `tambahan`). Nama field untuk kelas dan arti Ditentukan di M1. Semua bentuk dihitung oleh conjugator.

**Kolom yang ditampilkan (§8.2.1):**

| Kolom | Isi |
|---|---|
| Bentuk kamus | Dengan furigana, beserta romaji |
| Arti | Bahasa Indonesia |
| Kelompok | I (*godan*), II (*ichidan*), atau III (tidak beraturan). Wajib. |
| Bentuk ます | Furigana dan romaji |
| Bentuk て | Furigana dan romaji |
| Bentuk ました | Furigana |
| Bentuk ません | Furigana |
| Bentuk di dialog | Bentuk yang benar-benar muncul, dengan tautan ke kalimatnya |

**Cakupan (§9.2):**

- です dan だ tidak dimasukkan ke tabel.
- Kata kerja する-majemuk ditulis sebagai 〜する (kelompok III), misalnya 勉強する.
- Kata bantu いる (pada 〜ている) dan たい ditampilkan di bawah kata kerja utamanya, bukan sebagai baris sendiri.
- お願いします diperlakukan sebagai ungkapan (bagian G), bukan sebagai kata kerja di tabel.

**Mengapa kelompok diambil dari kelas JMdict.** Akhiran kana tidak cukup untuk menentukan kelompok. Contoh: 帰る (かえる) dan 知る (しる) berakhiran -eru/-iru seperti kelompok II, tetapi termasuk kelompok I. Karena itu conjugator memakai kelas kata kerja dari JMdict. Kanji yang sama juga bisa dibaca berbeda di setiap bentuk: 来る (くる) → 来ます (きます), 来て (きて), 来ない (こない), 来た (きた). Furigana setiap sel ikut dihitung.

**Contoh baku untuk unit test (§9.3):** 思う *omou*, お母さん *okāsan*, お兄さん *oniisan*, 行く → 行って, 帰る kelompok I, 来る → 来ます/来て/来ない/来た, ませんでした. Kalimat Materi 1 juga dipakai sebagai *golden test* (contoh yang hasilnya dikunci).

### 2.8 Tingkat kesopanan

- **Per tokoh:** objek `{ default, note }`. `default` adalah tingkat kesopanan bawaan tokoh; `note` adalah catatannya, misalnya "sopan kepada guru; kasual kepada teman sekelas".
- **Per kalimat:** field `register` yang opsional, untuk kalimat yang tingkat kesopanannya perlu dicatat sendiri.
- Daftar nilai yang diizinkan Ditentukan di M1.
- Checklist review memeriksa bahwa tingkat kesopanan setiap tokoh sesuai catatan di bagian B.

### 2.9 Bentuk alternatif (`alternatives[]`)

- Dipakai di ungkapan (G), pola tata bahasa (F), dan soal input teks (H).
- Setiap item berisi bentuk alternatif dan penjelasan perbedaannya.
- Pada soal input teks, jawaban diterima dalam kana maupun kanji, termasuk bentuk di `alternatives[]` (§8.5).
- Nama field di dalam setiap item Ditentukan di M1.

### 2.10 ID

| ID | Contoh | Beku setelah rilis? | Pengecekan |
|---|---|---|---|
| Materi | `L001` | Ya | `check:ids` membandingkan dengan `origin/main`; ID tidak boleh hilang atau berubah. |
| Set soal | `L001.quiz` (set tambahan: `L001.quiz.2`, P2) | Ya | `check:ids` |
| Kalimat | `L001.main.03.2` (materi L001, dialog utama, giliran 03, kalimat 2) | Tidak. Boleh berubah sebelum rilis. | Validator menolak rujukan ke ID yang tidak ada. |
| Pola tata bahasa | `kara-asal`, `kara-alasan` | Tidak dicek `check:ids`, tetapi harus stabil antarmateri agar halaman Review bisa menggabungkan pola yang sama (§8.6). | Ditentukan di M1 |

- Hanya ID yang dirujuk progres pengguna yang dibekukan: ID materi dan ID set soal (§9.2).
- Format ID untuk dialog variasi, drill, dan soal per butir Ditentukan di M1.

### 2.11 Metadata review

Setiap materi menyimpan objek `{ status: "ai-draft" | "reviewed", reviewedAt, checklist[] }` (§9.2). Format `reviewedAt` dan isi item `checklist[]` Ditentukan di M1.

Alur penulisan sampai rilis (§9.4):

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

- Materi `ai-draft` boleh ada di `main`, tetapi tidak dipublikasikan di produksi.
- Status review tidak ditampilkan di website (D3).
- Gerbang ini mencegah lupa, bukan membuktikan siapa yang mereview.

**Checklist review pemilik (§9.4):**

- [ ] Dialog dibaca utuh di staging; tidak ada yang terasa janggal atau kaku.
- [ ] Tingkat kesopanan setiap tokoh sesuai catatan di bagian B.
- [ ] Setiap warning kata berbacaan ganda sudah dicek di kamus (misalnya jisho.org) dan diakui.
- [ ] Terjemahan Indonesia mudah dipahami, dan pilihan kamu/Anda konsisten.
- [ ] Catatan terjemahan harfiah ada di kalimat yang membutuhkannya.
- [ ] Penjelasan tata bahasa jelas dan tidak menyebut pola yang tidak ada di dialog.
- [ ] Soal tidak punya lebih dari satu jawaban benar.
- [ ] Kana, kanji, dan katakana dipakai sesuai kebiasaan; bentuk alternatif yang umum sudah dijelaskan.

### 2.12 Override dan ack

| | Override | Ack |
|---|---|---|
| Lokasi | `content/overrides/` | `content/acks/` |
| Fungsi | Mengecualikan satu kasus dari aturan otomatis | Mengakui sebuah warning |
| Dipakai untuk | Bacaan di luar kandidat JMdict; pengecualian romaji (§9.1) | Setiap warning di §9.1, termasuk kata berbacaan ganda dan dialog lebih dari 20 giliran |
| Wajib ada | Alasan tertulis | Alasan tertulis |
| Kapan diperiksa | Setiap PR, oleh validator | Sebelum rilis ke produksi, oleh job `release-gate` pada materi `reviewed` (§9.4, §12.1) |
| Format file | Ditentukan di M1 | Ditentukan di M1 |

### 2.13 Error dan warning

**Error** memblokir merge. **Warning** harus diakui dengan alasan tertulis di `content/acks/` sebelum materi dipublikasikan ke produksi. Tabel berikut disalin dari PRD §9.1:

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

**Pengecekan lain yang disebut di bagian lain PRD:**

| Kondisi | Akibat | Sumber |
|---|---|---|
| ID materi atau ID set soal hilang atau berubah dibanding `origin/main` | `check:ids` gagal | §9.2, §9.3 |
| Rujukan ke ID kalimat yang tidak ada | Ditolak validator | §9.2 |
| Tema dipakai ulang, atau ada kalimat dialog utama yang sama dengan materi sebelumnya (kecuali salam baku) | Warning | §8.9 |
| Bentuk kontraksi kasual (`contraction`) | Wajib diakui reviewer | §9.3 |
| Ada warning yang belum diakui pada materi `reviewed` saat PR ke `main` | Job `release-gate` gagal | §9.4, §12.1 |

Kriteria selesai M1: untuk setiap aturan error di atas ada satu fixture (file contoh) rusak, dan masing-masing gagal dengan kode aturan, nama file, dan path JSON (§15). Daftar kode aturan Ditentukan di M1.

**Script (rencana):**

| Script | Fungsi (§9.3) |
|---|---|
| `validate:content` | Skema Zod dan semua aturan error di atas. Kode keluar 1 jika ada error. Warning ditulis ke ringkasan GitHub Actions. |
| `check:dictionary` | Mencocokkan bacaan dan kelas kata kerja dengan JMdict (rilis `jmdict-simplified` yang di-*pin*, diunduh di CI, tidak di-commit) |
| `check:ids` | ID materi dan set soal di `origin/main` tidak boleh hilang atau berubah |
| `build:content` | Menghasilkan segmen ruby, romaji, bentuk kata kerja, dan statistik kosakata ke `.generated/` |
| `seed:content` | Upsert seluruh isi materi ke Supabase (idempoten), mencatat `content_hash` per materi, lalu memverifikasi hash di database sama dengan hash repo |
| `test` | Unit test conjugator, romaji, dan penyelarasan furigana (Bagian 2.7) |

`validate:content`, `check:dictionary`, `check:ids`, dan unit test dibuat di M1. `seed:content` dibuat di M2 (§15).

### 2.14 Contoh JSON

Ketiga contoh hanya berisi array token, yaitu bagian format yang sudah ditetapkan PRD. Struktur file materi selengkapnya Ditentukan di M1. Pada contoh 3, です ditulis sebagai token biasa karena cara menandai kopula belum diputuskan.

**Contoh 1: nama, partikel は dan を, ー, kata kerja bentuk ます**

```json
[
  { "t": "リナ", "name": true },
  { "t": "は", "prt": true },
  { "t": "毎朝", "r": "まいあさ" },
  { "t": "コーヒー" },
  { "t": "を", "prt": true },
  { "t": "飲みます", "r": "のみます", "lemma": "飲む", "lemmaR": "のむ", "form": "masu" },
  { "t": "。" }
]
```

- Furigana: `リナは<ruby>毎朝<rt>まいあさ</rt></ruby>コーヒーを<ruby>飲<rt>の</rt></ruby>みます。`
- Romaji: *Rina wa maiasa kōhī o nomimasu.*
- Terjemahan: Rina minum kopi setiap pagi.
- Yang ditunjukkan: リナ dan コーヒー seluruhnya katakana, jadi tanpa `r`. `name: true` membuat *Rina* berhuruf kapital. は → *wa*, を → *o*. コーヒー → *kōhī* (ー memberi makron, termasuk pada i). Okurigana みます dipisah otomatis, jadi furigana の hanya di atas 飲. 飲む masuk tabel E dengan bentuk di dialog 飲みます.

**Contoh 2: bentuk て + kata kerja bantu, ei, tanda koma**

```json
[
  { "t": "先生", "r": "せんせい" },
  { "t": "は", "prt": true },
  { "t": "今", "r": "いま" },
  { "t": "、" },
  { "t": "本", "r": "ほん" },
  { "t": "を", "prt": true },
  { "t": "読んで", "r": "よんで", "lemma": "読む", "lemmaR": "よむ", "form": "te" },
  { "t": "います", "lemma": "いる", "lemmaR": "いる", "form": "masu", "aux": true },
  { "t": "。" }
]
```

- Furigana: `<ruby>先生<rt>せんせい</rt></ruby>は<ruby>今<rt>いま</rt></ruby>、<ruby>本<rt>ほん</rt></ruby>を<ruby>読<rt>よ</rt></ruby>んでいます。`
- Romaji: *Sensei wa ima, hon o yonde imasu.*
- Terjemahan: Sekarang guru sedang membaca buku.
- Yang ditunjukkan: せんせい → *sensei* (ei tetap). Huruf kapital di awal kalimat. 、 → *,* menempel pada kata sebelumnya. 読んで dan います adalah dua token, jadi romaji-nya terpisah: *yonde imasu*. Di tabel E, 読む menjadi satu baris dengan bentuk di dialog 読んでいます; いる tidak menjadi baris sendiri.

**Contoh 3: jukujikun, apostrof n', partikel akhir kalimat**

```json
[
  { "t": "今日", "r": "きょう" },
  { "t": "は", "prt": true },
  { "t": "金曜日", "r": "きんようび" },
  { "t": "です" },
  { "t": "ね", "prt": true },
  { "t": "。" }
]
```

- Furigana: `<ruby>今日<rt>きょう</rt></ruby>は<ruby>金曜日<rt>きんようび</rt></ruby>ですね。`
- Romaji: *Kyō wa kin'yōbi desu ne.*
- Terjemahan: Hari ini hari Jumat, ya.
- Yang ditunjukkan: 今日 adalah jukujikun, jadi satu furigana untuk seluruh kata. 今日 juga kata berbacaan ganda, jadi memicu warning yang harus dikonfirmasi reviewer dan diakui di `content/acks/`. きょう → *kyō*. きんようび → *kin'yōbi* (ん sebelum y diberi apostrof, よう → *yō*). ね adalah partikel, jadi diberi `prt: true` dan ditulis terpisah: *desu ne*. Kalimat ini tidak punya kata kerja, dan です tidak masuk tabel E.

### 2.15 Hal yang belum diputuskan

| # | Hal | Ditentukan di |
|---|---|---|
| 1 | Skema file materi selengkapnya: nama field untuk informasi materi, tokoh, giliran, kosakata, pola, ungkapan, soal, drill, dan dialog variasi | M1 |
| 2 | Romaji kata kerja する-majemuk dan お願いします (Bagian 2.6, butir 1) | M1 |
| 3 | Token dan romaji sapaan setelah nama, seperti さん dan 先生 (Bagian 2.6, butir 2) | M1 |
| 4 | Penanda huruf kapital untuk nama tempat, negara, dan bahasa (Bagian 2.6, butir 3) | M1 |
| 5 | Penulisan salam yang memuat は, seperti こんにちは (Bagian 2.6, butir 4) | M1 |
| 6 | Tanda baca selain 。、？ (Bagian 2.6, butir 5) | M1 |
| 7 | Penandaan token untuk です/だ, ください, 〜たい, dan adjektiva yang berubah bentuk | M1 |
| 8 | Cara generator romaji mengenali batas morfem (思う *omou*) | M1 |
| 9 | Apakah `r` pada token yang seluruhnya kana dianggap error | M1 |
| 10 | Penanganan penyelarasan furigana yang gagal atau ambigu | M1 |
| 11 | Format `contraction`, nilai `register`, field item `alternatives[]`, format `reviewedAt` dan `checklist[]` | M1 |
| 12 | Format file override dan ack, serta daftar kode aturan | M1 |
| 13 | Format ID dialog variasi, drill, dan soal per butir | M1 |
| 14 | Isi `content/shared/` | M1 |
| 15 | Batas jumlah kosakata baru per materi (Q2) | Sebelum Materi 2 (PRD §5.2) |
