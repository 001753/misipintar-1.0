# Misi Pintar — Master Agent Briefing

> **BACA INI SEPENUHNYA SEBELUM MELAKUKAN PERUBAHAN APAPUN.**
> Dokumen ini adalah sumber kebenaran tunggal tentang arsitektur proyek.
> Melanggar aturan di sini = merusak server produksi di cPanel.

---

## 1. Gambaran Proyek

**Misi Pintar** adalah aplikasi manajemen keuangan keluarga berbasis Next.js.
- Platform produksi: **cPanel shared hosting** dengan **Phusion Passenger** (bukan Vercel, bukan Docker)
- Repositori: GitHub → di-pull ke cPanel via `bash deploy.sh`
- Development: Replit (edit kode di sini → push ke GitHub → deploy ke cPanel)

**URL Produksi:** `https://mp.jobenapp.cloud`
**Panel Admin:** `https://mp.jobenapp.cloud/adm-panel`

---

## 2. Stack Teknologi

| Lapisan | Teknologi |
|---|---|
| Framework | Next.js 16, App Router, TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL (Replit dev), PostgreSQL cPanel (prod) |
| ORM | Prisma |
| Auth | NextAuth v5 (credentials — phone + password) |
| Payment | Midtrans |
| Email | Nodemailer + SMTP |
| Job Queue | BullMQ + Redis (opsional) |
| Notifikasi | Firebase FCM + Fonnte (WhatsApp OTP) |
| Output | `next build --webpack` → **standalone** output |

---

## 3. Arsitektur Deployment (KRITIS — Jangan Diubah)

### Pipeline
```
Edit kode di Replit → npm run build di Replit → commit & push ke GitHub → bash deploy.sh di cPanel SSH
```

> ⚠️ **WAJIB**: Setiap perubahan kode HARUS melalui `npm run build` di Replit sebelum push ke GitHub.
> `deploy.sh` di cPanel TIDAK melakukan build — ia hanya git pull + restart.
> Kalau lupa build, produksi akan menampilkan versi lama meskipun git pull sudah berhasil.

### Build HARUS di Replit (bukan cPanel)
cPanel tidak bisa build Next.js (batas thread). Build dilakukan di Replit:
```bash
# Langkah 1 — Build Next.js
npm run build
# (otomatis menjalankan postbuild: prepare-standalone.sh + patch-standalone.js)
```

### Struktur File Kritis di cPanel
```
~/public_html/misipintar/misipintar-1.0/
├── app.js                          ← Passenger startup file (JANGAN DIHAPUS/DIPINDAH)
├── .next/
│   └── standalone/
│       ├── server.js               ← DIPATCH oleh scripts/patch-standalone.js
│       ├── node_modules/           ← SYMLINK ke root node_modules (bukan folder asli)
│       └── .next/
│           ├── static/             ← CSS/JS bundle (di-copy oleh prepare-standalone.sh)
│           └── server/
├── public/                         ← Static assets (di-copy oleh prepare-standalone.sh)
├── node_modules/                   ← Install di server via deploy.sh
├── .env                            ← Secret prod — TIDAK di git
├── .pkg_hash                       ← Hash package.json untuk skip npm install
└── deploy.sh                       ← Script deploy utama
```

### Phusion Passenger
- **Startup file:** `app.js` (project root)
- `app.js` memuat `.env`, set `NODE_ENV=production`, lalu `require('.next/standalone/server.js')`
- **Restart:** `touch tmp/restart.txt` ATAU `passenger-config restart-app`
- **JANGAN** ubah nama `app.js` atau pindahkan

---

## 4. File-File Yang TIDAK BOLEH Diubah Strukturnya

| File | Alasan |
|---|---|
| `app.js` | Passenger startup — diset di cPanel UI, tidak bisa diganti nama |
| `.next/standalone/server.js` | Di-patch oleh `patch-standalone.js` — jangan edit manual |
| `scripts/patch-standalone.js` | Menginjeksi static file server ke standalone output |
| `scripts/prepare-standalone.sh` | Meng-copy `static/` dan `public/` ke dalam standalone |
| `deploy.sh` | Script deploy cPanel — hanya tambah step, jangan hapus step yang ada |
| `prisma/migrations/` | JANGAN hapus atau edit migration yang sudah ada |
| `.gitignore` | Entry `.next/standalone/node_modules/` WAJIB ada (140MB, tidak di-commit) |

---

## 5. Cara Build Yang Benar

### Di Replit (untuk update kode)
```bash
npm run build
```
Ini menjalankan secara berurutan:
1. `next build --webpack` (Next.js compile)
2. `bash scripts/prepare-standalone.sh` (copy static + public ke standalone)
3. `node scripts/patch-standalone.js` (patch server.js untuk static files)

> ⚠️ Bash timeout Replit = 120 detik. Kalau timeout, jalankan manual:
> ```bash
> # Step 1
> NODE_ENV=production NEXT_BUILD=1 NEXT_TELEMETRY_DISABLED=1 RAYON_NUM_THREADS=1 UV_THREADPOOL_SIZE=1 npx next build --webpack
> # Step 2
> bash scripts/prepare-standalone.sh && node scripts/patch-standalone.js
> ```

### Di cPanel (deploy ke produksi)
```bash
cd ~/public_html/misipintar/misipintar-1.0
bash deploy.sh
```
`deploy.sh` melakukan langkah-langkah berikut:
1. `git fetch && git reset --hard origin/main`
2. Symlink `standalone/node_modules` → root `node_modules`
3. **Cek sinkronisasi build** — bandingkan HEAD commit dengan `.next/standalone/.build_commit` (lihat §11)
4. `npm install` (SKIP jika `package.json` tidak berubah via `.pkg_hash`)
5. `prisma generate` + `prisma migrate deploy`
6. `node scripts/seed-plans.js` (seed Plans + AppConfig — skip jika sudah ada)
6. `node scripts/seed-admin.js` (seed admin — skip jika sudah ada)
7. Restart Passenger

---

## 6. Database

### Schema Utama (Prisma models)
`FamilySpace`, `User`, `OtpCode`, `Child`, `Task`, `TransactionLedger`, `Plan`, `Subscription`, `Invoice`, `PaymentLog`, `Notification`, `FcmToken`, `LoginAttempt`, `AdminAuditLog`, `AppConfig`, `CronLock`, `FileUpload`

### Migrations (prisma/migrations/)
| Migration | Isi |
|---|---|
| `0001_init` | Semua tabel awal |
| `0002_cron_lock_and_file_upload` | Tambah CronLock + FileUpload |
| `0003_add_user_phone` | Tambah kolom `phone` ke User (terlewat di 0001) |

### Aturan Migration
- **SELALU** buat migration baru dengan `npx prisma migrate dev --name <nama>`
- **JANGAN** edit migration yang sudah ada
- Gunakan `IF NOT EXISTS` di SQL custom jika migration perlu idempoten
- Replit DB di-baseline (sudah ditandai applied) — `prisma migrate deploy` aman dijalankan

### Data Awal Yang Wajib Ada di DB Produksi
Sudah di-seed otomatis oleh `deploy.sh`:
- 4 Plan: `STARTER` (gratis), `PRO` (Rp29.000/bln), `EDUCATOR` (Rp99.000/bln), `SCHOOL`
- 1 AppConfig: `id=global-config`, `phaseMode=FULL_FREE`
- 1 Admin: `admin@misi-pintar.id` (SUPER_ADMIN)

---

## 7. Environment Variables & Secrets

### Di Replit (development)
Set via Replit Secrets UI — **JANGAN** hardcode ke kode atau `.env`:
- `DATABASE_URL` — Replit PostgreSQL (auto-provisioned)
- `MIDTRANS_CLIENT_KEY`
- `MIDTRANS_SERVER_KEY`
- `SMTP_PASS`

### Di cPanel (production)
File `.env` di root project (tidak di-commit ke git).
Lihat `.env.example` untuk template lengkap. Variabel kritis:
```
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://mp.jobenapp.cloud
SESSION_SECRET=<min 32 karakter>
APP_URL=https://mp.jobenapp.cloud
NODE_ENV=production
MIDTRANS_SERVER_KEY=...
MIDTRANS_CLIENT_KEY=...
SMTP_PASS=...
```

---

## 8. Halaman & Route Utama

| Route | Keterangan |
|---|---|
| `/` | Landing page |
| `/register` | Daftar (otomatis dapat plan STARTER/FREE) |
| `/login` | Login parent via phone + password |
| `/dashboard` | Dashboard keluarga |
| `/dashboard/billing` | Kelola langganan |
| `/adm-panel` | Login superadmin |
| `/superadmin` | Panel superadmin |
| `/superadmin/plans` | Kelola plan & mode monetisasi |
| `/superadmin/families` | Kelola semua keluarga |
| `/superadmin/analytics` | Statistik |

---

## 9. Aturan Pengembangan

### Yang BOLEH dilakukan
- Edit kode di `src/`
- Tambah migration baru
- Tambah script baru di `scripts/`
- Tambah step baru di `deploy.sh` (di akhir, sebelum restart)
- Install package baru via `npm install <pkg>`

### Yang TIDAK BOLEH dilakukan
- ❌ Menghapus atau rename `app.js`
- ❌ Mengedit `.next/standalone/server.js` secara manual
- ❌ Mengubah `output` di `next.config.ts` dari `"standalone"`
- ❌ Menggunakan `prisma db push` di production (selalu pakai `migrate deploy`)
- ❌ Menghapus migration yang sudah ada
- ❌ Menambah `node_modules/` ke git
- ❌ Menambah `.next/standalone/node_modules/` ke git (sudah di `.gitignore`)
- ❌ Mengubah nama/path Passenger startup file

### Setelah edit kode
1. Jalankan `npm run build` di Replit (atau 2 step manual jika timeout)
2. Commit otomatis via Replit checkpoint
3. Push ke GitHub
4. Di cPanel: `bash deploy.sh`

---

## 10. Troubleshooting Cepat

| Gejala | Penyebab | Solusi |
|---|---|---|
| 503 Service Unavailable | Passenger crash | Cek `logs/app.log` di server |
| 404 di `/_next/static/` | `prepare-standalone.sh` belum jalan | `npm run prepare:standalone` lalu deploy |
| `npm install` crash di cPanel | RLIMIT_NPROC (batas thread) | Coba lagi beberapa menit atau tunggu server lowong |
| Error "Record to update not found" | Data seed belum ada di DB | Jalankan `bash deploy.sh` (akan auto-seed) |
| Error "Konfigurasi plan belum siap" | Plan belum di-seed | `node scripts/seed-plans.js` di server |
| `patch-standalone: not valid JSON` | Duplikat deklarasi variabel | Sudah diperbaiki — pastikan pakai versi terbaru |
| Build timeout > 120s di Replit | Build terlalu lama | Jalankan 2 step manual (lihat §5) |

---

## User Preferences

- Bahasa komentar kode: **Bahasa Indonesia**
- Bahasa komunikasi: **Bahasa Indonesia**
- Jangan commit `.env`, `node_modules/`, `.next/cache/`, `.next/standalone/node_modules/`
- Script seeding harus **idempoten** (aman dijalankan berulang — pakai check + skip)
- Selalu gunakan `upsert` bukan `update` untuk data konfigurasi global
- `deploy.sh` ditambah step baru, bukan ditulis ulang
