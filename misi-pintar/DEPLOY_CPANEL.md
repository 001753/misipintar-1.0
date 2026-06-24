# Panduan Deploy Misi Pintar ke cPanel / Shared Hosting

## Struktur Direktori di Server

```
/home/USER/public_html/misipintar/    ← Application Root di cPanel
├── app.js                            ← Startup file Passenger (JANGAN diganti)
├── server.js                         ← Alias dari app.js
├── package.json                      ← Workspace root
├── misi-pintar/                      ← Kode aplikasi Next.js
│   ├── deploy-cpanel.sh              ← Script deploy — JALANKAN INI untuk install & build
│   ├── .cpanel.yml                   ← Auto-deploy via cPanel Git
│   ├── .env                          ← Konfigurasi (JANGAN commit ke git!)
│   ├── .env.example                  ← Template konfigurasi lengkap
│   ├── prisma/
│   ├── src/
│   └── .next/standalone/             ← Hasil build Next.js (dibuat oleh deploy-cpanel.sh)
└── tmp/
    └── restart.txt                   ← Passenger restart trigger
```

## Prasyarat

| Kebutuhan | Minimal | Catatan |
|-----------|---------|---------|
| Node.js   | 20.x atau 22.x | Pilih versi tertinggi di cPanel |
| PostgreSQL | 14+ | Buat via cPanel → PostgreSQL Databases |
| RAM       | 512 MB | Rekomendasi 1 GB |
| Redis     | Opsional | Tidak ada di shared hosting — app tetap jalan normal |

> **Tanpa Redis:** Rate-limiting login, BullMQ workers (interest/notifikasi), dan push notification otomatis **dinonaktifkan** — aplikasi tetap berjalan normal untuk semua fitur utama.

---

## ⚠️ Peringatan Penting — cPanel npm

> **JANGAN gunakan tombol "Run NPM Install" di cPanel Node.js App Manager.**
> 
> cPanel membungkus `npm` dengan wrapper yang menginstall paket ke `~/nodevenv/` bukan ke `./node_modules/`. Next.js Turbopack tidak bisa membaca dari sana → **build selalu gagal**.
>
> Selalu gunakan `deploy-cpanel.sh` via SSH/Terminal yang mendeteksi dan menggunakan `npm` asli dari `/opt/cpanel/ea-nodejsNN/bin/npm`.

---

## Pilihan Metode Deploy

| Metode | Keunggulan | Kapan Digunakan |
|--------|-----------|-----------------|
| **A. cPanel Git Version Control** | Otomatis pull & build setiap push ke GitHub | Hosting yang support cPanel Git |
| **B. Manual via SSH** | Kontrol penuh, paling simpel | Deploy pertama, debug, atau hosting tanpa cPanel Git |

---

## Metode A — cPanel Git Version Control (Direkomendasikan)

### Langkah 1 — Setup Database PostgreSQL

Di cPanel → **PostgreSQL Databases**:
1. Buat database, misal: `user_misipintar`
2. Buat user database, misal: `user_dbuser`
3. Assign user ke database (semua privileges)
4. Catat host, port, nama database, username, password

### Langkah 2 — Setup Git Version Control di cPanel

1. Buka **cPanel → Git Version Control → Create**
2. Isi form:
   - **Clone URL:** `https://github.com/USERNAME/REPO.git`
   - **Repository Path:** `/home/USERNAME/public_html/misipintar`
3. Klik **Create** — cPanel clone repo dari GitHub

### Langkah 3 — Setup Node.js App di cPanel

1. Buka **cPanel → Node.js App → Create Application**
2. Isi form:

   | Field | Nilai |
   |-------|-------|
   | Node.js version | `22.x` (pilih tertinggi yang tersedia) |
   | Application mode | `Production` |
   | Application root | `public_html/misipintar` |
   | Application URL | `yourdomain.com` atau subdomain |
   | Application startup file | `app.js` |

3. Klik **Create**

> ⚠️ **JANGAN klik "Run NPM Install"** — lihat peringatan di atas.

### Langkah 4 — Buat File .env di Server

Via **cPanel → Terminal** atau SSH:
```bash
cd ~/public_html/misipintar/misi-pintar
cp .env.example .env
nano .env
```

**Wajib diisi minimal sebelum build pertama:**
```env
DATABASE_URL="postgresql://user_dbuser:password@localhost:5432/user_misipintar"
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_URL_INTERNAL="http://localhost:3000"
SESSION_SECRET="random_string_32_karakter_atau_lebih"
NODE_ENV="production"
APP_URL="https://yourdomain.com"
TRUST_PROXY="1"
SEED_ADMIN_EMAIL="admin@yourdomain.com"
SEED_ADMIN_PASSWORD="PasswordAdmin@Aman123"
```

> **Catatan Firebase NEXT_PUBLIC_\*:** Jika mengaktifkan push notification web, isi juga `NEXT_PUBLIC_FIREBASE_*` sebelum build — nilai ini di-embed ke client JavaScript saat `next build` dan tidak bisa diubah tanpa rebuild.

### Langkah 5 — Deploy Pertama via SSH

```bash
cd ~/public_html/misipintar
chmod +x misi-pintar/deploy-cpanel.sh
bash misi-pintar/deploy-cpanel.sh
```

Script otomatis:
1. ✅ Deteksi npm asli (bukan wrapper cPanel)
2. 📦 Install 876 dependencies ke `./misi-pintar/node_modules/` lokal
3. ⚙️  Generate Prisma Client
4. 🗄️  Jalankan database migrations
5. 🌱  Seed data awal (jika `SEED_ADMIN_EMAIL` diset di .env)
6. 🏗️  Build Next.js (output: standalone) — **tanpa prebuild hook**
7. 📁  Copy `public/` dan `.next/static/` ke standalone output

### Langkah 6 — Restart & Verifikasi

1. **cPanel → Node.js App → Restart Application**
2. Buka `https://yourdomain.com` — harus muncul halaman Misi Pintar
3. Login sebagai SuperAdmin dengan kredensial yang diset di SEED_ADMIN_*
4. **Segera hapus `SEED_ADMIN_EMAIL` dan `SEED_ADMIN_PASSWORD` dari `.env`!**

### Langkah 7 — Auto-Deploy Berikutnya

Setelah setup awal, setiap push ke branch `main`:
- cPanel otomatis `git pull`
- File `.cpanel.yml` dijalankan: memanggil `deploy-cpanel.sh`
- Restart Node.js App manual di cPanel

---

## Metode B — Manual via SSH

Gunakan cara ini untuk update biasa atau jika tidak menggunakan cPanel Git:

```bash
cd ~/public_html/misipintar
git pull origin main
bash misi-pintar/deploy-cpanel.sh
# Lalu: cPanel → Node.js App → Restart
```

---

## Checklist Lengkap Env Variables

Lihat `misi-pintar/.env.example` untuk daftar lengkap semua variabel.

| Variabel | Status | Catatan |
|----------|--------|---------|
| `DATABASE_URL` | **Wajib** | PostgreSQL connection string |
| `NEXTAUTH_URL` | **Wajib** | URL publik (https://...) |
| `SESSION_SECRET` | **Wajib** | Min 32 karakter random |
| `APP_URL` | **Wajib** | Sama dengan NEXTAUTH_URL |
| `MIDTRANS_SERVER_KEY` | Wajib untuk payment | Dari dashboard.midtrans.com |
| `MIDTRANS_CLIENT_KEY` | Wajib untuk payment | Dari dashboard.midtrans.com |
| `NEXT_PUBLIC_FIREBASE_*` | Wajib untuk push notif | **Harus diisi SEBELUM build** |
| `FIREBASE_PROJECT_ID` | Wajib untuk push notif | Dari Firebase service account |
| `FIREBASE_CLIENT_EMAIL` | Wajib untuk push notif | Dari Firebase service account |
| `FIREBASE_PRIVATE_KEY` | Wajib untuk push notif | Dari Firebase service account |
| `R2_ACCOUNT_ID` | Wajib untuk upload foto | Dari Cloudflare R2 |
| `R2_ACCESS_KEY_ID` | Wajib untuk upload foto | Dari Cloudflare R2 |
| `R2_SECRET_ACCESS_KEY` | Wajib untuk upload foto | Dari Cloudflare R2 |
| `R2_BUCKET_NAME` | Wajib untuk upload foto | Nama bucket R2 |
| `REDIS_URL` | Opsional | Tidak tersedia di shared cPanel |
| `SMTP_*` | Opsional | Untuk notifikasi email |
| `FONNTE_TOKEN` | Opsional | Untuk OTP via WhatsApp |
| `SUPERADMIN_ALLOWED_IPS` | Opsional | Whitelist IP superadmin |

---

## Troubleshooting

### ❌ `npm run build` gagal di cPanel App Manager

**Penyebab:** cPanel npm wrapper menginstall paket ke `~/nodevenv/` bukan `./node_modules/`.

**Solusi:** Jangan gunakan tombol di App Manager. Gunakan SSH:
```bash
cd ~/public_html/misipintar
bash misi-pintar/deploy-cpanel.sh
```

### ❌ `Turbopack panic: Symlink is invalid, points out of root`

**Penyebab:** Turbopack tidak bisa follow symlink `node_modules` yang menuju `~/nodevenv/`.

**Solusi:** `deploy-cpanel.sh` mendeteksi npm asli dan menginstall ke `./node_modules/` lokal. Jalankan script tersebut.

### ❌ Aplikasi tidak bisa start: `server.js not found`

```bash
# Pastikan build sudah ada
ls ~/public_html/misipintar/misi-pintar/.next/standalone/server.js

# Jika tidak ada, rebuild:
cd ~/public_html/misipintar
bash misi-pintar/deploy-cpanel.sh
```

### ❌ Push notification tidak berfungsi di production

**Penyebab:** `NEXT_PUBLIC_FIREBASE_*` tidak diisi sebelum `next build`.

**Solusi:** Isi semua `NEXT_PUBLIC_FIREBASE_*` di `.env`, lalu **rebuild**:
```bash
cd ~/public_html/misipintar
bash misi-pintar/deploy-cpanel.sh
# Restart di cPanel
```

### ❌ Error: `EADDRINUSE` atau port conflict

**Penyebab:** cPanel Passenger menggunakan random port atau Unix socket.

**Solusi:** Sudah ditangani di `app.js` — startup file membaca `PORT` dari Passenger environment secara otomatis.

### ❌ Database connection error

```bash
# Test koneksi
cd ~/public_html/misipintar/misi-pintar
./node_modules/.bin/prisma db pull

# Verifikasi .env
cat .env | grep DATABASE_URL
```

### ❌ Migrations failed

```bash
cd ~/public_html/misipintar/misi-pintar
# Lihat status
./node_modules/.bin/prisma migrate status

# Apply migrations pending (aman — tidak hapus data)
./node_modules/.bin/prisma migrate deploy
```
