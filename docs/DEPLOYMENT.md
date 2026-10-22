# Deployment dan Setup Layanan

| | |
|---|---|
| Status | M0 sedang berjalan. Bagian M2, M5, dan M6 masih rencana dan akan diperbarui saat milestone itu dikerjakan. |
| Tanggal | 22 Oktober 2026 |
| Acuan | `docs/PRD.md` §5, §8.7, §11, §12, §15.1 |
| Dokumen terkait | `docs/GIT_WORKFLOW.md`, `docs/ARCHITECTURE.md`, `docs/CONTENT_WORKFLOW.md` |

Dokumen ini berisi langkah yang Anda kerjakan sendiri di GitHub, Vercel, Supabase, dan Google Cloud. Urutannya mengikuti tabel tugas pemilik di PRD §15.1. Claude akan mengabari saat setiap langkah dibutuhkan.

## Aturan umum

- **Rahasia tidak dikirim di chat (K8).** Password, secret key, access token, URL Deploy Hook, dan client secret Google Anda isi sendiri, langsung di dashboard atau di `.env.local`. Setelah itu cukup kabari Claude bahwa nilainya "sudah diisi". Yang boleh dikirim di chat hanya URL yang diminta Claude, misalnya URL repo GitHub dan URL staging.
- **Simpan rahasia di password manager** saat pertama kali dibuat. Beberapa nilai hanya ditampilkan sekali, misalnya client secret Google.
- **Nama menu.** Langkah antarmuka di bawah dicocokkan dengan dokumentasi resmi masing-masing layanan pada 22 Oktober 2026. Tampilan dashboard sering berubah, jadi nama menu bisa sedikit berbeda. Jika menu tidak ditemukan, tanyakan ke Claude sebelum memilih opsi lain.
- **Placeholder** yang dipakai di dokumen ini:
  - `<username>`: nama akun GitHub pribadi Anda.
  - `<scope-slug>`: slug akun Vercel Anda, yaitu bagian alamat dashboard `vercel.com/<scope-slug>/...`.
  - `<ref>`: *project ref* Supabase, yaitu ID unik project yang juga menjadi subdomain URL-nya (`https://<ref>.supabase.co`).

## Ringkasan tugas per milestone

| Milestone | Yang perlu Anda lakukan | Status |
|---|---|---|
| M0 | Buat repo **publik** `benkyou-nihongo` di akun GitHub pribadi (tanpa README atau .gitignore), lalu kirim URL-nya. Hubungkan repo ke Vercel. Aktifkan ruleset sesuai `docs/GIT_WORKFLOW.md`. | Sedang berjalan |
| M2 | Buat project Supabase `benkyou-staging`. Isi `.env.local`. Isi secret dan variable GitHub Environment `staging`. Buat Deploy Hook Vercel untuk branch `staging`. | Rencana |
| M5 | Buat OAuth client Google (consent screen "In production"), isi client ID dan secret di Supabase Auth, lalu atur Redirect URL. | Rencana |
| M6 | Review Materi 1 di staging. Buat project `benkyou-prod` beserta secret GitHub Environment `production`. | Rencana |

---

## M0 — Fondasi

Hasil yang dituju: repo ada di GitHub, terhubung ke Vercel, dan branch `main` serta `staging` dilindungi ruleset. Kriteria selesai M0 (PRD §15): PR dengan error lint diblokir oleh required check, push langsung ke `main` ditolak, dan halaman contoh tampil di URL Vercel.

**Urutan:** langkah 1, lalu Claude melakukan push, lalu langkah 2, lalu langkah 3. Ruleset dipasang paling akhir karena setelah aktif, push langsung ke `main` dan `staging` ditolak, termasuk push awal dari Claude.

### Langkah 1 — Buat repo GitHub

Repo (*repository*) adalah tempat kode proyek disimpan di GitHub.

1. Login ke github.com dengan **akun pribadi** Anda. Jangan memakai organisasi GitHub, karena project Vercel Hobby tidak bisa terhubung ke repo milik organisasi (D7, PRD §12.2).
2. Klik ikon **+** di kanan atas, lalu **New repository**.
3. Isi formulir:

   | Isian | Nilai |
   |---|---|
   | Owner | Akun pribadi Anda |
   | Repository name | `benkyou-nihongo` |
   | Description | Boleh kosong |
   | Visibility | **Public** (D8). Repo publik dibutuhkan agar ruleset bisa dipaksakan di GitHub Free. Konsekuensinya, draf materi bisa dibaca siapa pun sebelum direview. |
   | Template | Jangan pilih template |
   | README | Jangan ditambahkan |
   | .gitignore | Jangan ditambahkan (No .gitignore) |
   | License | Jangan ditambahkan (No license). Sesuai default Q1, repo tidak memakai file LICENSE. |

   README dan `.gitignore` sudah ada di proyek lokal. Jika GitHub juga membuatnya, repo GitHub punya riwayat commit sendiri dan push pertama dari Claude akan ditolak. Label opsi README, .gitignore, dan license di formulir GitHub bisa sedikit berbeda (misalnya berupa toggle **Add README** yang harus dibiarkan mati).
4. Klik **Create repository**. GitHub lalu menampilkan halaman "Quick setup" untuk repo kosong. Itu normal.
5. Salin URL repo, misalnya `https://github.com/<username>/benkyou-nihongo`, lalu kirim ke Claude di chat. URL ini bukan rahasia.

**Yang dilakukan Claude setelah menerima URL:**

1. Menambahkan *remote* `origin` ke repo lokal. Remote adalah alamat repo GitHub yang dipakai Git di komputer Anda.
2. Menampilkan perintah push yang akan dijalankan, lalu menunggu konfirmasi Anda.
3. Setelah Anda konfirmasi, melakukan push branch `main`, lalu `staging`.

Jika Git meminta login GitHub (misalnya jendela browser dari Git Credential Manager di Windows), login sendiri di jendela itu. Claude tidak memasukkan password atau token Anda.

**Cek setelah push:**

- Di halaman repo, branch `main` dan `staging` terlihat, dan branch default adalah `main`.
- Di tab **Actions**, workflow `ci` berjalan untuk push ke `main` dan `staging` (lihat `.github/workflows/ci.yml`). Hasil ini dipakai saat memilih status check di langkah 3.

### Langkah 2 — Hubungkan repo ke Vercel (Hobby)

Vercel menjalankan build dan menayangkan website setiap kali ada push. Ada dua jenis deployment:

- *Production deployment*: dari branch produksi (`main`), tayang di domain produksi yang terbuka untuk umum.
- *Preview deployment*: dari branch lain (`staging`, `feature/*`, `content/*`), tayang di URL terpisah.

1. Login ke vercel.com. Jika belum punya akun, daftar dengan paket **Hobby** dan hubungkan akun GitHub pribadi yang sama. Hobby hanya untuk proyek pribadi non-komersial (PRD §3.3, §12.2).
2. Di dashboard, klik **New Project** (di beberapa tampilan: **Add New… → Project**).
3. Di daftar repo GitHub, cari `benkyou-nihongo`. Jika repo tidak muncul, Vercel akan meminta Anda memasang atau mengubah izin *Vercel GitHub App*. Beri akses hanya ke repo ini (pilihan **Only select repositories** di halaman izin GitHub). Persetujuan izin ini Anda lakukan sendiri.
4. Klik **Import** di samping `benkyou-nihongo`.
5. Di halaman konfigurasi project:

   | Isian | Nilai |
   |---|---|
   | Project Name | `benkyou-nihongo`. Nama ini menjadi bagian URL staging (`benkyou-nihongo-git-staging-<scope-slug>.vercel.app`), jadi jangan diubah. |
   | Framework Preset | **Next.js** (biasanya terdeteksi otomatis) |
   | Root Directory | Biarkan default (akar repo) |
   | Build and Output Settings | Jangan di-override. Vercel memakai script `build` di `package.json`, yaitu `next build`. |
   | Environment Variables | Kosongkan. Di M0 belum ada Supabase; variabel ditambahkan mulai M2. |

6. Klik **Deploy**.

   Deployment pertama sebuah project Vercel **selalu production deployment**, apa pun branch asalnya, dan dibangun dengan environment variable Production. Di sini deployment pertama berasal dari `main`. Jika berhasil, halaman contoh M0 tampil di domain produksi yang ditampilkan Vercel (biasanya `benkyou-nihongo.vercel.app`, atau variasinya jika nama itu sudah dipakai orang lain). Kirim domain ini ke Claude. Jika build gagal, kirim log build-nya ke Claude.
7. **Node.js 24.x.** Buka **Settings → Build and Deployment → Node.js Version**, pastikan pilihannya **24.x** (bawaan Vercel saat ini). `package.json` juga menetapkan `"engines": { "node": "24.x" }`, dan nilai ini mengalahkan pilihan di dashboard. Jadi pengaturan dashboard hanya untuk konsistensi.
8. **Production branch `main`.** Buka **Settings → Environments → Production → Branch Tracking**, pastikan branch-nya `main`. Vercel memilih `main` secara otomatis jika branch itu ada.
9. **URL staging.** Branch `staging` adalah preview deployment dengan URL branch otomatis:

   ```
   https://benkyou-nihongo-git-staging-<scope-slug>.vercel.app
   ```

   Vercel bisa memendekkan URL yang terlalu panjang, jadi pakai URL yang benar-benar tampil di dashboard. URL ini baru ada setelah ada deployment dari branch `staging`. Import hanya men-deploy `main`, jadi buat satu deployment staging dengan salah satu cara:
   - Buka tab **Deployments**, klik **Create Deployment**, isi nama branch `staging`, lalu **Create Deployment**; atau
   - tunggu push atau merge berikutnya ke `staging`.

   Setelah selesai, buka deployment itu dari tab **Deployments**. URL branch tercantum di daftar domain deployment. Kirim URL ini ke Claude. URL yang sama dipakai lagi untuk `NEXT_PUBLIC_SITE_URL` staging (M2) dan Redirect URL Supabase (M5).
10. **Deployment Protection.** Buka **Settings → Deployment Protection**. Di bagian **Vercel Authentication**, pastikan toggle aktif dengan cakupan **Standard Protection**, lalu **Save**.

    Standard Protection melindungi semua URL kecuali domain produksi. Artinya URL staging dan semua preview hanya bisa dibuka setelah login dengan akun Vercel Anda, sedangkan domain produksi tetap publik (PRD §12.2). Opsi ini tersedia di Hobby. Password Protection tidak tersedia di Hobby dan tidak dipakai.

    Cek: buka URL staging di jendela privat browser. Yang muncul harus halaman login Vercel, bukan website. Domain produksi harus tetap terbuka tanpa login.

**Deploy otomatis selama M0.** Untuk sementara, setiap push ke branch mana pun langsung di-deploy oleh Vercel. Claude akan mematikan deploy Git otomatis untuk `staging` dan `main` lewat `git.deploymentEnabled` di `vercel.json` (rencana, M2–M4; PRD §11.2). Setelah itu, deploy `staging` dan `main` dipicu Deploy Hook dari GitHub Actions. Anda tidak perlu mengubah pengaturan Git di dashboard Vercel.

### Langkah 3 — Aktifkan ruleset GitHub

*Ruleset* adalah aturan GitHub yang membatasi cara sebuah branch diubah, misalnya wajib lewat PR (*pull request*) dan wajib lulus *status check*. Status check adalah hasil job CI yang dilaporkan ke PR.

Kerjakan langkah ini setelah Claude mengabari bahwa `main` dan `staging` sudah di-push dan workflow `ci` sudah pernah berjalan. Langkah lengkapnya ada di `docs/GIT_WORKFLOW.md`. Ringkasan isinya (PRD §12.1):

| Aturan | `main` | `staging` |
|---|---|---|
| Wajib lewat PR | Ya | Ya |
| Status check wajib lulus | `ci` dan `release-gate` | `ci` |
| Bypass admin | Mati | Mati |
| Jumlah approval | 0 | 0 |

Jumlah approval 0 karena pemilik repo tidak bisa meng-approve PR miliknya sendiri. Setelah ruleset aktif, kriteria M0 (PR dengan error lint diblokir, push langsung ke `main` ditolak) diuji bersama Claude.

### Checklist M0

- [ ] Repo publik `benkyou-nihongo` ada di akun GitHub pribadi, tanpa README, .gitignore, atau license buatan GitHub.
- [ ] URL repo sudah dikirim ke Claude, dan `main` serta `staging` sudah di-push.
- [ ] Project Vercel `benkyou-nihongo` terhubung ke repo, dengan production branch `main` dan Node.js 24.x.
- [ ] Halaman contoh tampil di domain produksi Vercel.
- [ ] URL staging sudah dikirim ke Claude dan meminta login Vercel saat dibuka di jendela privat.
- [ ] Ruleset `main` dan `staging` aktif sesuai `docs/GIT_WORKFLOW.md`.

---

## M2 — Database dan seed (rencana, M2)

Hasil yang dituju: project Supabase `benkyou-staging` siap dipakai GitHub Actions untuk migrasi dan seed, lalu memicu build staging di Vercel (PRD §11.2). Sampai M6 hanya ada satu project Supabase (D9).

Istilah:

- *Migrasi*: file SQL di `supabase/migrations/` yang mengubah struktur database, dijalankan dengan `supabase db push`.
- *Seed*: mengisi tabel konten dari file JSON di repo (`seed:content`).
- *GitHub Environment*: kumpulan variable dan secret di GitHub yang hanya bisa dipakai oleh job workflow yang menyebut environment tersebut.

### Langkah 1 — Buat project `benkyou-staging`

1. Login ke `supabase.com/dashboard` (paket Free, asumsi A1). Paket Free mengizinkan 2 project aktif, dihitung dari semua organisasi tempat Anda menjadi Owner atau Administrator. Project yang di-pause tidak dihitung. Pastikan masih ada slot jika Anda punya project lain.
2. Pilih organisasi pribadi Anda, lalu klik **New project**.
3. Isi formulir:

   | Isian | Nilai |
   |---|---|
   | Project name | `benkyou-staging` |
   | Database Password | Password kuat (pakai tombol generate jika ada). Simpan di password manager. Nilai ini menjadi secret `SUPABASE_DB_PASSWORD`. Jangan kirim di chat. |
   | Region | Saran: pilih region spesifik **Southeast Asia (Singapore)**, kode `ap-southeast-1`. Region ini ada di daftar region Supabase. Jika Anda memilih region umum "APAC", Supabase menentukan lokasi di Asia Pasifik berdasarkan kapasitas, sehingga lokasinya tidak pasti. Region tidak bisa diubah setelah project dibuat. |
   | Opsi Data API | Jika formulir menampilkan opsi Data API, biarkan Data API aktif dan biarkan **Automatically expose new tables** tidak dicentang. Akses tabel diatur lewat GRANT eksplisit di setiap migrasi (PRD §11.3). |

4. Klik **Create new project**, lalu tunggu sampai project siap.

### Langkah 2 — Kenali nilai yang dibutuhkan

| Nilai | Bentuk | Tempat | Rahasia? |
|---|---|---|---|
| Project ref (`<ref>`) | String acak | Alamat dashboard project: `supabase.com/dashboard/project/<ref>` | Tidak |
| Project URL | `https://<ref>.supabase.co` | Tombol **Connect** di dashboard project, atau **Settings → Data API** | Tidak |
| Publishable key | `sb_publishable_…` | **Settings → API Keys** (juga tampil di dialog **Connect**) | Tidak. Aman dipakai di browser karena akses data dibatasi RLS (*Row Level Security*, aturan akses per baris di PostgreSQL). |
| Secret key | `sb_secret_…` | **Settings → API Keys**, bagian secret keys. Pakai yang sudah ada atau buat yang baru. | **Ya.** Key ini melewati semua aturan RLS. Hanya disimpan di GitHub Environment. Tidak pernah di Vercel, di kode, atau di chat. |
| Access token | Personal access token Supabase | `supabase.com/dashboard/account/tokens`, lalu buat token baru | **Ya** |
| Database password | Dari langkah 1 | Password manager Anda | **Ya** |

Jangan memakai key lama `anon` dan `service_role` walaupun masih terlihat di dashboard. Proyek ini hanya memakai key baru `sb_publishable_…` dan `sb_secret_…` (PRD §11.1).

**Access token.** Supabase menyediakan token *classic* (akses penuh ke seluruh akun Anda) dan token *scoped* (terbatas pada project dan izin yang dipilih). Menurut dokumentasi Supabase, `supabase link` membutuhkan izin **Project Settings**, **API Keys**, dan **API Key Secrets** dengan akses **Read**, sedangkan `supabase db push` yang memakai `SUPABASE_DB_PASSWORD` tidak dibatasi izin token. Jenis token dan izin finalnya: ditentukan di M2, saat Claude menulis `deploy-staging.yml`.

**Koneksi dari CI.** Runner GitHub tidak mendukung IPv6, jadi migrasi berjalan lewat *pooler* Supabase, yaitu jalur koneksi perantara yang bisa diakses lewat IPv4 (PRD §12.3). Connection string pooler diverifikasi bersama Claude saat setup M2. Apakah dibutuhkan secret tambahan untuk ini: ditentukan di M2.

### Langkah 3 — Isi `.env.local`

`.env.local` adalah file variabel lingkungan untuk komputer Anda sendiri. File ini tidak ikut di-commit karena `.gitignore` mengabaikan semua `.env*` kecuali `.env.example`.

1. Di folder proyek, salin template:
   - PowerShell: `Copy-Item .env.example .env.local`
   - Git Bash: `cp .env.example .env.local`
2. Isi dengan nilai dari `benkyou-staging`:

   ```
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

3. `.env.example` juga memuat `SUPABASE_SECRET_KEY`, yang hanya dipakai jika seed dijalankan dari komputer sendiri. Seed staging berjalan dari GitHub Actions, jadi isian ini boleh dibiarkan kosong.
4. Kabari Claude bahwa `.env.local` sudah diisi. Jangan kirim isinya.

### Langkah 4 — GitHub Environment `staging`

1. Di repo GitHub, buka **Settings → Environments → New environment**.
2. Isi nama `staging`, lalu klik **Configure environment**.
3. Di bagian **Environment variables**, klik **Add Variable** untuk setiap baris:

   | Name | Value |
   |---|---|
   | `SUPABASE_URL` | Project URL |
   | `SUPABASE_PROJECT_ID` | Project ref |

4. Di bagian **Environment secrets**, klik **Add Secret** untuk setiap baris:

   | Name | Value |
   |---|---|
   | `SUPABASE_SECRET_KEY` | `sb_secret_…` |
   | `SUPABASE_ACCESS_TOKEN` | Access token |
   | `SUPABASE_DB_PASSWORD` | Database password |
   | `VERCEL_DEPLOY_HOOK_URL` | URL Deploy Hook dari langkah 6 |

Nilai secret tidak bisa dilihat lagi setelah disimpan, hanya bisa diganti. Di GitHub Free, environment tersedia untuk repo publik. Pembatasan branch yang boleh memakai environment ini (*deployment branches*): ditentukan di M2.

### Langkah 5 — Environment variable Vercel untuk staging

Sesuai PRD §12.5, tiga variabel `NEXT_PUBLIC_*` juga diisi di Vercel per lingkungan. Variabel `NEXT_PUBLIC_*` dimasukkan ke kode JavaScript saat build, jadi nilainya bukan rahasia dan harus sudah tersedia sebelum build.

1. Di Vercel, buka project `benkyou-nihongo` → **Settings → Environment Variables**.
2. Tambahkan variabel berikut dengan tipe **Config** (bukan Secret, karena nilainya publik):

   | Variabel | Environment | Branch | Nilai |
   |---|---|---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Preview | Semua branch preview | Project URL `benkyou-staging` |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Preview | Semua branch preview | Publishable key `benkyou-staging` |
   | `NEXT_PUBLIC_SITE_URL` | Preview | Khusus branch `staging` | URL staging dari M0 |

   Semua preview, termasuk preview branch fitur, membaca database staging (PRD §11.2). Nilai `NEXT_PUBLIC_SITE_URL` untuk preview selain `staging`: ditentukan di M5.
3. Jangan mengisi environment **Production** dulu. Sampai project produksi dibuat di M6, `main` tidak di-deploy dengan database (D9).
4. Jangan pernah menambahkan `SUPABASE_SECRET_KEY` ke Vercel (PRD §8.7).

Perubahan environment variable hanya berlaku untuk deployment baru, bukan deployment yang sudah ada.

### Langkah 6 — Deploy Hook Vercel untuk `staging`

*Deploy Hook* adalah URL rahasia yang memicu build sebuah branch saat menerima request POST. `deploy-staging.yml` memanggilnya setelah migrasi, seed, dan verifikasi `content_hash` selesai, sehingga build tidak pernah membaca data lama (PRD §11.2).

1. Di Vercel, buka **Settings → Git**, lalu bagian **Deploy Hooks**.
2. Isi nama hook (bebas, misalnya `staging`) dan branch `staging`, lalu buat hook-nya (tombol **Create Hook**; nama tombol bisa sedikit berbeda).
3. Salin URL yang muncul dan simpan sebagai secret `VERCEL_DEPLOY_HOOK_URL` di environment `staging` (langkah 4). Perlakukan URL ini seperti password: siapa pun yang memegangnya bisa memicu deploy.

Batas Hobby: 5 Deploy Hook per project, dan semua hook dalam satu project hanya bisa dipicu 60 kali per jam.

### Yang dikerjakan Claude di M2

- Menulis migrasi tabel konten, RLS, GRANT, `seed:content`, verifikasi hash, dan `deploy-staging.yml`.
- Menambahkan `git.deploymentEnabled` di `vercel.json` agar `staging` dan `main` tidak lagi di-deploy otomatis oleh Git (rencana, M2–M4). Claude tidak memakai opsi `github.enabled: false`, karena menurut dokumentasi Vercel opsi itu juga membuat Deploy Hook tidak berjalan.

### Checklist M2

- [ ] Project `benkyou-staging` aktif.
- [ ] `.env.local` terisi tiga variabel `NEXT_PUBLIC_*`.
- [ ] GitHub Environment `staging` berisi 2 variable dan 4 secret.
- [ ] Vercel Preview berisi tiga variabel `NEXT_PUBLIC_*` (satu di antaranya khusus branch `staging`).
- [ ] Deploy Hook untuk branch `staging` sudah dibuat dan URL-nya tersimpan sebagai secret.

---

## M5 — Akun dan progres (rencana, M5)

Login hanya memakai Google (D2). Supabase menjadi perantara: Google mengembalikan pengguna ke URL *callback* Supabase, lalu Supabase mengarahkan pengguna ke `/auth/callback` di website (PRD §11.4).

Istilah:

- *OAuth client*: identitas aplikasi di Google, terdiri dari Client ID (publik) dan Client Secret (rahasia).
- *Consent screen*: layar persetujuan Google yang muncul saat pengguna login.
- *Scope*: jenis data yang diminta dari akun Google pengguna.

### Langkah 1 — Siapkan Google Auth Platform

1. Buka `console.cloud.google.com` dan buat project baru (nama bebas, misalnya `benkyou-nihongo`).
2. Buka **Google Auth Platform** (bisa lewat **APIs & Services → OAuth consent screen**). Jika diminta konfigurasi awal, isi nama aplikasi `Benkyō Nihongo`, email dukungan, jenis pengguna **External**, dan email kontak. Persetujuan kebijakan Google Anda lakukan sendiri. Nama menu bisa sedikit berbeda.
3. **Data Access**: tambahkan hanya scope `openid`, `.../auth/userinfo.email`, dan `.../auth/userinfo.profile`. Jangan menambah scope lain. Dengan scope dasar ini, aplikasi tidak perlu verifikasi scope dari Google (PRD §11.4).
4. **Branding**: opsional. Jika Anda mengunggah logo, Google bisa meminta verifikasi brand, yang menurut dokumentasi Supabase bisa memakan waktu beberapa hari kerja.
5. **Audience**: ubah *publishing status* dari **Testing** menjadi **In production** dengan tombol **Publish app**. Dalam mode Testing, hanya pengguna uji yang terdaftar yang bisa login (PRD §11.4).

### Langkah 2 — Buat OAuth client

1. Buka **Clients**, lalu buat client baru.
2. Application type: **Web application**. Nama bebas.
3. **Authorized JavaScript origins**: `http://localhost:3000` dan URL staging (`https://benkyou-nihongo-git-staging-<scope-slug>.vercel.app`).
4. **Authorized redirect URIs**: `https://<ref>.supabase.co/auth/v1/callback`, dengan `<ref>` milik `benkyou-staging`. Salin persis dari halaman provider Google di Supabase (langkah 3) agar tidak salah ketik.
5. Simpan, lalu salin Client ID dan Client Secret. **Client Secret hanya ditampilkan sekali saat dibuat.** Jika hilang, buat secret baru lewat fitur rotasi secret di halaman client. Simpan di password manager dan jangan kirim di chat.

Satu OAuth client ini dipakai untuk semua project Supabase. Di M6, callback `benkyou-prod` ditambahkan ke client yang sama (PRD §11.4).

Layar login Google akan menampilkan domain `<ref>.supabase.co`, bukan domain website, karena custom domain Supabase hanya tersedia di paket berbayar (A1).

### Langkah 3 — Aktifkan provider Google di Supabase

1. Di project `benkyou-staging`, buka **Authentication → Sign In / Providers → Google**. Tautan langsung: `https://supabase.com/dashboard/project/_/auth/providers?provider=Google`, lalu pilih project.
2. Aktifkan provider, tempel **Client ID** dan **Client Secret**, lalu simpan.
3. Salin Callback URL yang ditampilkan di halaman ini ke **Authorized redirect URIs** di Google (langkah 2 nomor 4).

### Langkah 4 — Site URL dan Redirect URLs

1. Buka **Authentication → URL Configuration**.
2. **Site URL**: URL staging, `https://benkyou-nihongo-git-staging-<scope-slug>.vercel.app`.
3. **Redirect URLs**, tambahkan:
   - `http://localhost:3000/**`
   - `https://benkyou-nihongo-git-staging-<scope-slug>.vercel.app/**`

   `**` berarti path apa pun di bawah domain itu, termasuk `/auth/callback`.
4. Jangan menambahkan pola wildcard untuk semua URL preview Vercel. Login tidak didukung di URL preview PR; login hanya berjalan di localhost, staging, dan produksi (PRD §8.7).

Daftar ini dicek ulang bersama Claude saat M5. Karena staging dilindungi Vercel Authentication, uji login di staging memakai browser yang sudah login ke akun Vercel Anda.

---

## M6 — Review dan rilis (rencana, M6)

1. **Review Materi 1** di staging dengan checklist PRD §9.4. Alur lengkapnya ada di `docs/CONTENT_WORKFLOW.md`.
2. **Project `benkyou-prod`.** Ulangi M2 langkah 1 dan 2 dengan nama `benkyou-prod`. Saran: pakai region yang sama dengan staging. Pastikan slot project aktif di paket Free masih cukup.
3. **GitHub Environment `production`.** Ulangi M2 langkah 4 dengan nama environment `production` dan nilai dari `benkyou-prod`. Untuk `VERCEL_DEPLOY_HOOK_URL`, buat Deploy Hook baru untuk branch `main` (Vercel **Settings → Git → Deploy Hooks**).
4. **Vercel Production.** Isi tiga variabel `NEXT_PUBLIC_*` untuk environment **Production** dengan nilai `benkyou-prod`. `NEXT_PUBLIC_SITE_URL` diisi domain produksi.
5. **Google dan Supabase Auth untuk produksi.** Tambahkan callback `https://<ref>.supabase.co/auth/v1/callback` milik `benkyou-prod` ke OAuth client yang sama, aktifkan provider Google di `benkyou-prod` dengan Client ID dan Client Secret yang sama, lalu atur Site URL dan Redirect URLs ke domain produksi. Apakah `localhost` juga diizinkan di project produksi: ditentukan di M6.
6. **`deploy-production.yml`.** Claude menyiapkan workflow ini (aktif mulai M6, PRD §12.4). Rilis berjalan lewat PR `staging → main` yang lulus `ci` dan `release-gate`, dan produksi hanya memuat materi berstatus `reviewed`. Langkah aktivasi dari sisi Anda, jika ada: ditentukan di M6.

---

## Variabel lingkungan (rencana, M2)

Tabel dari PRD §12.5:

| Variabel | Lokasi | Rahasia? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL` | `.env.local`, Vercel (per lingkungan) | Tidak |
| `SUPABASE_URL`, `SUPABASE_PROJECT_ID` | GitHub Environments (variable) | Tidak |
| `SUPABASE_SECRET_KEY`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `VERCEL_DEPLOY_HOOK_URL` | GitHub Environments (secret) | **Ya** |

Sumber nilai setiap variabel:

| Variabel | Nilai | Diambil dari | Diisi di |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` | Supabase: **Connect** atau **Settings → Data API** | M2 (lokal, Preview), M6 (Production) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` | Supabase: **Settings → API Keys** | M2 (lokal, Preview), M6 (Production) |
| `NEXT_PUBLIC_SITE_URL` | Lokal `http://localhost:3000`; staging = URL branch staging; produksi = domain produksi | Vercel dashboard | M2 (lokal, staging), M6 (Production) |
| `SUPABASE_URL` | Sama dengan Project URL | Supabase | M2 (`staging`), M6 (`production`) |
| `SUPABASE_PROJECT_ID` | Project ref | Alamat dashboard project Supabase | M2, M6 |
| `SUPABASE_SECRET_KEY` | `sb_secret_…` | Supabase: **Settings → API Keys** | M2, M6 |
| `SUPABASE_ACCESS_TOKEN` | Personal access token | `supabase.com/dashboard/account/tokens` | M2, M6 |
| `SUPABASE_DB_PASSWORD` | Password database | Dibuat saat membuat project | M2, M6 |
| `VERCEL_DEPLOY_HOOK_URL` | URL Deploy Hook | Vercel: **Settings → Git → Deploy Hooks** | M2 (branch `staging`), M6 (branch `main`) |

Client Secret Google (M5) tidak termasuk tabel ini karena hanya disimpan di pengaturan provider Google di Supabase.

---

## Pemulihan (rencana, M2)

Prosedur ini berlaku setelah workflow deploy dan database ada (mulai M2). Untuk setiap masalah, kirim pesan error ke Claude tanpa nilai rahasia. GitHub menyamarkan secret di log sebagai `***`, tetapi tetap periksa log sebelum dikirim.

### Project Supabase di-pause

Project Free di-pause setelah 7 hari tanpa aktivitas database yang cukup. Supabase mengirim email peringatan sekitar satu minggu sebelumnya. Proyek ini sengaja tidak memakai cron *keep-alive* (PRD §12.3).

**Gejala:**

- `deploy-staging` (atau `deploy-production` mulai M6) gagal di langkah migrasi atau seed.
- Build Vercel gagal karena tidak bisa membaca database (D1).
- Mulai M5, area login menampilkan "Login sedang tidak tersedia. Progres tetap tersimpan di browser ini."
- Situs yang sudah ter-deploy tetap bisa dibuka, karena halaman materi statis.

**Langkah:**

1. Buka dashboard Supabase, pilih organisasi, lalu project yang di-pause.
2. Klik **Resume project** dan konfirmasi. Tunggu sampai project aktif kembali. Data dan konfigurasi kembali seperti sebelum pause.
3. Di GitHub, buka **Actions**, pilih workflow yang gagal, buka run-nya, lalu **Re-run jobs → Re-run all jobs**. Ini menjalankan ulang migrasi, seed, verifikasi, dan Deploy Hook.
4. Re-run hanya bisa dilakukan sampai 30 hari setelah run pertama. Jika sudah lewat, minta Claude memicu ulang workflow. Cara pemicu manual: ditentukan di M2.

Dokumentasi Supabase menyebut batas waktu restore yang berbeda (1 tahun di isi halaman, 90 hari di judul bagian). Jangan biarkan project dalam keadaan pause terlalu lama.

### Migrasi gagal

Paket Free tidak punya backup database (A1, PRD §12.3).

**Pencegahan yang sudah direncanakan:** setiap migrasi diuji di CI dengan `supabase db reset` dan dijalankan di staging sebelum produksi. Migrasi dibuat kompatibel dengan kode yang sedang live: tambah dulu, pakai di rilis berikutnya, hapus di rilis setelahnya (PRD §11.2).

**Jika `deploy-staging` gagal di langkah migrasi:**

1. Seed dan Deploy Hook berjalan setelah migrasi, jadi keduanya tidak ikut berjalan. Situs staging yang sedang tayang tidak berubah.
2. Jangan memperbaiki database secara manual lewat SQL Editor atau Table Editor sebelum berdiskusi dengan Claude. Perubahan manual membuat isi database tidak lagi sesuai dengan riwayat migrasi di repo.
3. Kirim pesan error dari log GitHub Actions ke Claude. Claude membuat migrasi perbaikan lewat PR biasa ke `staging`.

**Dampak ke data:**

- **Tabel konten:** aman. Isinya selalu bisa di-seed ulang dari repo, karena `seed:content` idempoten (hasilnya sama walaupun dijalankan berkali-kali).
- **`user_progress` (mulai M5):** berisiko. Tanpa backup, progres yang terhapus atau rusak di database tidak bisa dikembalikan. Prosedur cadangan manual sebelum migrasi yang menyentuh tabel ini: ditentukan di M5.

### Secret bocor: rotasi

Secret dianggap bocor jika nilainya pernah muncul di chat, commit, log, screenshot, atau tempat lain yang bisa dibaca orang lain. Karena repo publik (D8), secret yang pernah ter-commit tetap harus dianggap bocor walaupun commit-nya dihapus, karena repo bisa sudah di-clone atau di-cache.

Urutan umum: buat nilai baru, ganti di semua tempat yang memakainya, cabut nilai lama, lalu jalankan ulang workflow untuk memastikan semuanya berjalan.

| Secret | Cara rotasi | Tempat yang diperbarui |
|---|---|---|
| `SUPABASE_SECRET_KEY` | Supabase **Settings → API Keys**: buat secret key baru, lalu hapus key lama | GitHub Environment (`staging` atau `production`); `.env.local` jika diisi |
| `SUPABASE_ACCESS_TOKEN` | `supabase.com/dashboard/account/tokens`: cabut token lama, buat token baru | GitHub Environment |
| `SUPABASE_DB_PASSWORD` | Supabase **Settings → Database**: reset password database (nama menu bisa sedikit berbeda) | GitHub Environment |
| `VERCEL_DEPLOY_HOOK_URL` | Vercel **Settings → Git → Deploy Hooks**: hapus hook lama, buat hook baru untuk branch yang sama | GitHub Environment |
| Client Secret Google (mulai M5) | Google Auth Platform **Clients**: rotasi secret di halaman client | Supabase **Authentication → Sign In / Providers → Google** |

**Langkah rinci untuk secret key Supabase (`sb_secret_…`).** Key ini paling berbahaya karena melewati semua aturan RLS.

1. Di **Settings → API Keys**, buat secret key baru.
2. Ganti secret `SUPABASE_SECRET_KEY` di GitHub Environment dengan key baru. Perbarui juga `.env.local` jika Anda mengisinya.
3. Hapus key lama di Supabase. Penghapusan tidak bisa dibatalkan, jadi pastikan langkah 2 sudah selesai. Jangan menunda langkah ini, karena selama key lama masih ada, pemegangnya bisa membaca dan mengubah semua tabel.
4. Jalankan ulang `deploy-staging` untuk memastikan seed berjalan dengan key baru.
5. Periksa data. Isi konten bisa di-seed ulang dari repo. Jika ada perubahan mencurigakan di `user_progress` (mulai M5), laporkan ke Claude. Log paket Free hanya disimpan 1 hari, jadi periksa secepatnya.
6. Jika secret sempat ter-commit, beri tahu Claude agar commit itu ditangani setelah rotasi selesai.

Publishable key dan variabel `NEXT_PUBLIC_*` lainnya bukan rahasia, jadi tidak perlu dirotasi jika terlihat orang lain. Akses data lewat key itu tetap dibatasi RLS.
