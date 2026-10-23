# Alur Git

> **Diperbarui 22 Okt 2026 (PRD D12):** konten (`content/**`) di-push langsung ke `main` tanpa PR. Perubahan kode tetap lewat `feature/*` → `staging` → `main`. Karena ruleset GitHub tidak bisa membedakan path, ruleset `main` **tidak** mewajibkan PR; aturan "kode lewat staging" dijalankan dengan disiplin, dan validasi konten dijaga oleh workflow `deploy-production`.


Dokumen ini mengatur branch, pull request, ruleset GitHub, dan format commit untuk repo `benkyou-nihongo`. Keputusannya berasal dari [PRD.md](PRD.md) §12.1. Jika ada perbedaan, PRD yang berlaku.

Istilah yang dipakai:

- **PR (pull request):** permintaan menggabungkan (*merge*) satu branch ke branch lain. **Base** adalah branch tujuan, **head** adalah branch asal.
- **Status check:** hasil pemeriksaan otomatis yang tampil di PR. Di repo ini, setiap status check adalah satu job GitHub Actions.
- **Ruleset:** kumpulan aturan GitHub yang melindungi branch, misalnya menolak push langsung.

## 1. Model branch

```
feature/* · content/*  ──PR──►  staging  ──PR──►  main
hotfix/*  ──PR──► main, lalu di-merge balik ke staging
```

| Branch | Fungsi | Dibuat dari | PR ke |
|---|---|---|---|
| `main` | Produksi. Deploy produksi dengan database baru dimulai di M6 (D9). | – | – |
| `staging` | Integrasi dan review. Semua perubahan biasa masuk ke sini dulu. | – | `main` |
| `feature/<nama>` | Perubahan kode, termasuk konfigurasi dan dokumentasi | `staging` | `staging` |
| `content/<nama>` | Perubahan materi. Hanya mengubah folder `content/` (PRD §3.2). Contoh: `content/L001-perkenalan-diri`. | `staging` | `staging` |
| `hotfix/<nama>` | Perbaikan mendesak untuk `main` | `main` | `main`, lalu `staging` |

`main` dan `staging` adalah branch permanen. Keduanya tidak pernah menerima push langsung. Semua perubahan masuk lewat PR, dan ruleset (§3) memaksakan aturan ini. Branch lain dihapus setelah PR-nya di-merge.

## 2. Status check: `ci` dan `release-gate`

Workflow `.github/workflows/ci.yml` punya dua job. Di ruleset, status check ditulis dengan **nama job**: `ci` dan `release-gate`.

| Job | Kapan berjalan | Isi saat ini (M0) |
|---|---|---|
| `ci` | Setiap PR ke `staging` atau `main`, dan setiap push ke kedua branch itu | `npm ci`, `npm run lint`, `npm run typecheck`, `npm run build` |
| `release-gate` | Hanya di PR dengan base `main` | Cek branch asal |

Isi `ci` akan bertambah: `validate:content`, `check:dictionary`, `check:ids`, dan `test` (rencana, M1); Supabase lokal, migrasi, seed, dan build dari database (rencana, M2); uji RLS dengan pgTAP (rencana, M5). Jika pemeriksaan baru dibuat sebagai job terpisah, nama job itu juga harus ditambahkan ke ruleset. Ditentukan di M1.

### 2.1 Yang diperiksa `release-gate`

- **Sekarang (M0):** job gagal jika branch asal PR ke `main` bukan `staging` atau `hotfix/*`. Contoh: PR `feature/toggle-furigana` → `main` ditolak.
- **(rencana, M1):** job juga gagal jika ada warning validasi yang belum diakui pada materi berstatus `reviewed`. Warning diakui dengan alasan tertulis di `content/acks/` (PRD §9.1). Materi `ai-draft` tidak memblokir rilis (PRD §9.4).

Batasan: gerbang ini mencegah lupa, bukan membuktikan siapa yang mereview (PRD §9.4). `release-gate` hanya membaca nama branch, jadi PR dari fork yang branch-nya bernama `staging` juga lolos. Repo ini publik (D8), jadi jangan merge PR dari fork ke `main`.

### 2.2 Job yang dilewati dihitung lulus

Di PR ke `staging`, `release-gate` tidak berjalan karena syarat `if:` di job tidak terpenuhi. GitHub mencatat job yang dilewati (*skipped*) karena syarat `if:` sebagai lulus. Akibatnya:

- Mewajibkan `release-gate` di `staging` tidak ada gunanya. Check itu selalu dilewati di sana, jadi selalu dianggap lulus. Karena itu `release-gate` hanya diwajibkan di ruleset `main`.
- Di `main`, `release-gate` selalu berjalan, karena setiap PR ke `main` memenuhi syarat `if:`.
- Ini berbeda dengan **workflow** yang tidak berjalan sama sekali, misalnya karena filter `paths`. Dalam kasus itu check wajib tertahan di status "Pending" dan memblokir merge. Jangan tambahkan filter `paths` ke `ci.yml` selama `ci` wajib.

## 3. Ruleset GitHub (tugas pemilik, M0)

Ruleset tersedia untuk repo publik di GitHub Free. Ini salah satu alasan repo dibuat publik (D8).

### 3.1 Konfigurasi

Buat **dua ruleset**, satu per branch. Jika beberapa ruleset menargetkan branch yang sama, GitHub menggabungkan aturannya. Karena itu, satu ruleset untuk kedua branch tidak bisa mewajibkan `release-gate` hanya di `main`. Dua ruleset terpisah adalah cara paling sederhana.

| Pengaturan | Ruleset `staging` | Ruleset `main` |
|---|---|---|
| Ruleset name | `staging` | `main` |
| Enforcement status | Active | Active |
| Bypass list | Kosong | Kosong |
| Target branches | Pola `staging` | Pola `main` |
| Restrict deletions | Ya | Ya |
| Block force pushes | Ya | Ya |
| Require a pull request before merging | Ya, Required approvals `0` | Ya, Required approvals `0` |
| Require status checks to pass | Ya: `ci` | Ya: `ci`, `release-gate` |
| Require branches to be up to date before merging | Tidak | Tidak |
| Aturan lain | Tidak dicentang | Tidak dicentang |

Alasan:

- **Approval 0:** GitHub tidak mengizinkan penulis PR meng-approve PR-nya sendiri. Dengan approval 1 atau lebih, pemilik tidak bisa merge PR miliknya.
- **Bypass list kosong:** aturan juga berlaku untuk pemilik repo. Jika peran admin dimasukkan ke bypass list, pemilik bisa melewati aturan, dan kriteria M0 "push langsung ke `main` ditolak" tidak terpenuhi.
- **Up to date tidak dicentang:** opsi ini mewajibkan branch asal memuat commit terbaru branch tujuan. Untuk PR `staging` → `main`, memperbarui `staging` dari `main` harus lewat PR tersendiri, karena push langsung ke `staging` ditolak. Opsi ini tidak termasuk konfigurasi PRD.

### 3.2 Sebelum mulai

- Branch `main` dan `staging` sudah ada di GitHub.
- Job `ci` sudah berjalan minimal sekali. Cek di tab **Actions**. Job ini berjalan otomatis setiap ada push ke `main` atau `staging`.

Dokumentasi GitHub menyebut status check yang diwajibkan harus pernah berhasil di repo dalam tujuh hari terakhir. Check yang sudah pernah berjalan biasanya muncul sebagai saran saat namanya diketik. `release-gate` baru berjalan di PR pertama ke `main`, jadi mungkin belum muncul sebagai saran. Ruleset tetap menerima nama yang diketik manual: ketik persis `release-gate`, lalu klik tombol **+**. Nama yang salah ketik membuat setiap PR menunggu check yang tidak pernah datang.

### 3.3 Membuat ruleset `staging`

1. Buka repo di GitHub, lalu klik tab **Settings**. Jika tab ini tidak terlihat, buka menu tiga titik, lalu klik **Settings**.
2. Di sidebar kiri, bagian **Code, planning, and automation**, klik **Rulesets**, lalu **Rulesets**. Tampilan lama menamai bagian ini "Code and automation" dengan menu **Rules** → **Rulesets**. Nama menu bisa sedikit berbeda.
3. Klik **New ruleset** → **New branch ruleset**.
4. **Ruleset name:** isi `staging`.
5. **Enforcement status:** bawaannya **Disabled**. Klik, lalu pilih **Active**.
6. **Bypass list:** biarkan kosong. Jangan klik **Add bypass**.
7. **Target branches:** klik **Add target** → **Include by pattern**, ketik `staging`, lalu konfirmasi dengan tombol **Add inclusion pattern**. Nama menu bisa sedikit berbeda.
8. Di bagian **Branch protections** (di sebagian tampilan: **Branch rules**):
   - **Restrict deletions:** sudah tercentang secara bawaan. Biarkan.
   - **Block force pushes:** sudah tercentang secara bawaan. Biarkan. *Force push* adalah push yang menimpa riwayat commit di server.
   - Centang **Require a pull request before merging**. Isi **Required approvals** dengan `0`. Opsi lain di bawahnya biarkan tidak dicentang.
   - Centang **Require status checks to pass** (di dokumentasi GitHub: "Require status checks to pass before merging"). Pastikan **Require branches to be up to date before merging** tidak dicentang. Di kotak status check, ketik `ci`, lalu pilih dari saran atau klik tombol **+**. Nama menu bisa sedikit berbeda.
   - Aturan lain jangan dicentang.
9. Klik **Create**.

### 3.4 Membuat ruleset `main`

Ulangi langkah 1–9 dengan tiga perbedaan:

- **Ruleset name:** `main`.
- **Target branches:** pola `main`.
- **Require status checks to pass:** tambahkan `ci` dan `release-gate`.

### 3.5 Verifikasi (kriteria M0)

**A. Push langsung ke `main` ditolak.** Uji ini memakai commit kosong, supaya `main` tidak berubah apa pun jika ruleset ternyata belum aktif.

```bash
git switch main
git pull
git switch -c feature/uji-push
git commit --allow-empty -m "chore: uji ruleset"
git push origin HEAD:main
```

Hasil yang benar: GitHub menolak push dengan pesan bahwa push melanggar aturan repo dan perubahan harus lewat pull request. Teks pesannya bisa sedikit berbeda. Pesan "non-fast-forward" berarti uji tidak valid; ulangi dari `git pull`. Setelah selesai, hapus branch uji:

```bash
git switch main
git branch -D feature/uji-push
```

**B. PR dengan error lint diblokir.**

```bash
git switch staging
git pull
git switch -c feature/uji-lint
```

Buat file `src/uji-lint.ts` berisi `export const uji: any = 1;`. Baris ini melanggar aturan `@typescript-eslint/no-explicit-any`, yang berlevel error. Commit, lalu push:

```bash
git add src/uji-lint.ts
git commit -m "chore: uji ruleset dengan error lint"
git push -u origin feature/uji-lint
```

Buka PR dengan base `staging`. Hasil yang benar: `ci` gagal, dan tombol merge tidak bisa dipakai. Tutup PR tanpa merge, klik **Delete branch** di halaman PR, lalu hapus branch lokal dengan `git switch staging` dan `git branch -D feature/uji-lint`.

**C. Check `main` lengkap.** Saat PR pertama `staging` → `main` dibuka, pastikan `ci` dan `release-gate` tampil dengan label **Required**.

## 4. Alur PR perubahan kode

1. Mulai dari `staging` terbaru:

   ```bash
   git switch staging
   git pull
   git switch -c feature/<nama-singkat>
   ```

2. Kerjakan perubahan. Tulis commit dengan format di §9.
3. Sebelum push, jalankan pemeriksaan yang sama dengan `ci`:

   ```bash
   npm run lint
   npm run typecheck
   npm run build
   ```

   Perintah konten (`validate:content`, `check:dictionary`, `test`) ditambahkan di M1 (rencana, M1).
4. Push, lalu buka PR dengan **base `staging`**:

   ```bash
   git push -u origin feature/<nama-singkat>
   ```

   Periksa base di halaman PR. Jika base-nya `main`, `release-gate` akan gagal.
5. Tunggu `ci` lulus. Vercel membuat URL preview untuk branch ini (detail di [DEPLOYMENT.md](DEPLOYMENT.md)).
6. Merge PR, lalu klik **Delete branch**.
7. Saat ini (M0), merge ke `staging` hanya menjalankan `ci`. Migrasi, seed, dan deploy staging otomatis lewat `deploy-staging.yml` (rencana, M2).

## 5. Alur PR perubahan konten

Detail draf, validasi, review, dan checklist ada di [CONTENT_WORKFLOW.md](CONTENT_WORKFLOW.md). Dari sisi Git, alurnya (PRD §9.4):

1. Buat branch `content/L00X-<tema>` dari `staging`, misalnya `content/L001-perkenalan-diri`. Materi berstatus `ai-draft`.
2. PR hanya mengubah folder `content/`: file materi, ditambah *ack* atau *override* bila perlu.
3. `validate:content`, `check:dictionary`, dan `test` lolos di lokal dan di CI (rencana, M1).
4. Merge ke `staging`. Materi di-seed dan tampil di situs staging (rencana, M2). Isi materi dari PR yang belum di-merge tidak tampil di preview Vercel.
5. Pemilik membaca materi di situs staging dan mengisi checklist, lalu membuat **PR kedua** ke `staging` dari branch `content/*` baru untuk mengubah status menjadi `reviewed`.
6. Materi dirilis lewat PR `staging` → `main` (§6). Produksi hanya memuat materi `reviewed` (rencana, M6).

## 6. Rilis: `staging` → `main`

1. Buka PR dengan base `main` dan head `staging`.
2. Tunggu `ci` dan `release-gate` lulus.
3. Merge. Jangan hapus `staging`. Ruleset juga menolak penghapusan itu.
4. Sebelum M6, `main` belum di-deploy ke produksi dengan database (D9). Mulai M6, push ke `main` menjalankan `deploy-production.yml` (rencana, M6).

## 7. Hotfix

Hotfix dipakai untuk perbaikan mendesak di `main` yang tidak bisa menunggu isi `staging` siap dirilis.

1. Mulai dari `main`:

   ```bash
   git switch main
   git pull
   git switch -c hotfix/<nama-singkat>
   ```

2. Perbaiki, commit (`fix: ...`), push, lalu buka PR ke `main`. `ci` dan `release-gate` harus lulus.
3. Merge ke `main`. **Jangan hapus branch hotfix dulu.**
4. Merge balik: buka PR kedua dari `hotfix/<nama-singkat>` ke `staging`. Tanpa langkah ini, `staging` tidak memuat perbaikan tersebut, dan PR rilis berikutnya bisa berkonflik.
5. Setelah PR kedua di-merge, hapus branch hotfix.

## 8. Dependabot

Dependabot adalah layanan GitHub yang membuat PR kenaikan versi dependensi. `.github/dependabot.yml` memeriksa dependensi npm dan GitHub Actions setiap minggu.

- PR *version update* diarahkan ke `staging` (`target-branch: staging`), dengan pesan commit berawalan `chore`.
- `next`, `react`, dan paket terkaitnya digabung dalam satu PR (grup `next-react`).
- Perlakukan PR ini seperti PR fitur: tunggu `ci`, merge ke `staging`, lalu ikut rilis berikutnya ke `main`.

Catatan: `target-branch` tidak berlaku untuk *security update* Dependabot. Jika security update diaktifkan, PR-nya selalu dibuat ke branch default repo. Jika branch default adalah `main`, PR itu ditolak `release-gate` karena branch asalnya bukan `staging` atau `hotfix/*`. Cara menanganinya: Ditentukan di M0 (lihat §10).

## 9. Format commit

Pesan commit memakai Conventional Commits, yaitu format `<tipe>: <deskripsi singkat>`. Tipe yang dipakai (PRD §12.1):

| Tipe | Untuk | Contoh |
|---|---|---|
| `feat` | Fitur baru | `feat: tambah toggle furigana, romaji, dan terjemahan` |
| `fix` | Perbaikan bug | `fix: perbaiki tabel kata kerja yang terpotong di layar 360 px` |
| `content` | Perubahan di folder `content/` | `content: tambah draf Materi 1 (L001)` |
| `docs` | Dokumentasi | `docs: lengkapi langkah ruleset di GIT_WORKFLOW.md` |
| `chore` | Dependensi, konfigurasi, CI, dan pemeliharaan lain | `chore: perbarui dependensi next dan react` |

Contoh lain untuk PR review materi: `content: ubah status L001 menjadi reviewed`.

Format ini belum dicek otomatis oleh CI.

## 10. Belum diputuskan

| Hal | Status | Catatan |
|---|---|---|
| Metode merge PR (merge commit, squash, atau rebase) | Ditentukan di M0 | Squash merge pada PR `staging` → `main` membuat commit di `main` berbeda dari commit di `staging`. PR rilis berikutnya lalu menampilkan ulang commit lama dan bisa berkonflik. Aturan "Require a pull request before merging" punya opsi untuk membatasi metode merge yang diizinkan. |
| Branch default repo di GitHub | Ditentukan di M0 | Branch default menjadi base bawaan saat membuka PR, dan menjadi tujuan PR security update Dependabot (§8). |
