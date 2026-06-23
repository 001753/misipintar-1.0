# Panduan Deploy Misi Pintar ke cPanel / Shared Hosting

## Prasyarat

| Kebutuhan | Minimal |
|-----------|---------|
| Node.js | 20.x |
| PostgreSQL | 14+ |
| RAM | 512 MB |
| Redis | Opsional (rate-limit & notifikasi) |

> **Catatan:** Banyak shared hosting **tidak menyediakan Redis**. Tanpa Redis, fitur rate-limiting login dan push notification (SSE) akan dinonaktifkan secara otomatis — aplikasi tetap berjalan normal.

---

## Langkah 1 — Persiapkan Database PostgreSQL

Di cPanel, buka **PostgreSQL Databases** (atau MySQL jika hanya tersedia MySQL — *tapi Prisma schema ini hanya untuk PostgreSQL*):

1. Buat database baru, misal: `user_misipintar`
2. Buat user database, misal: `user_dbuser`
3. Assign user ke database dengan semua privileges
4. Catat: `host`, `port`, `database name`, `username`, `password`

---

## Langkah 2 — Upload Source Code

Upload seluruh folder `misi-pintar/` ke server. Bisa via:
- **Git:** `git clone` di terminal SSH
- **File Manager:** Upload zip lalu ekstrak
- **FTP/SFTP:** Upload manual

---

## Langkah 3 — Konfigurasi .env

```bash
cp .env.example .env
nano .env   # atau edit via File Manager cPanel
```

Wajib diisi minimal:
```env
DATABASE_URL="postgresql://user_dbuser:password@localhost:5432/user_misipintar"
NEXTAUTH_URL="https://yourdomain.com"
SESSION_SECRET="random_string_32_karakter_atau_lebih"
NODE_ENV="production"
TRUST_PROXY="true"
SEED_ADMIN_EMAIL="admin@yourdomain.com"
SEED_ADMIN_PASSWORD="PasswordAdmin@Aman123"
```

---

## Langkah 4 — Setup Node.js App di cPanel

1. Buka **cPanel → Node.js App → Create Application**
2. Isi form:
   - **Node.js version:** 20.x (pilih tertinggi yang tersedia)
   - **Application mode:** Production
   - **Application root:** `/home/username/misi-pintar` (sesuaikan)
   - **Application URL:** `yourdomain.com` atau subdomain
   - **Application startup file:** `server.js`
3. Klik **Create**

---

## Langkah 5 — Jalankan Deploy Script

Di **Terminal SSH** (atau via cPanel Terminal):

```bash
cd ~/misi-pintar
chmod +x deploy-cpanel.sh
./deploy-cpanel.sh
```

Script ini otomatis:
- Install dependencies
- Generate Prisma client
- Jalankan migrations database
- Seed data awal (Plans + SuperAdmin)
- Build Next.js (mode standalone)
- Copy static files

---

## Langkah 6 — Restart & Verifikasi

1. Di cPanel **Node.js App → Restart**
2. Buka `https://yourdomain.com` — harus muncul halaman Misi Pintar
3. Login sebagai SuperAdmin dengan email/password dari `.env`

---

## Langkah 7 — Hapus Credentials Seeding

Setelah berhasil login, **hapus** dari `.env`:
```env
# Hapus atau kosongkan kedua baris ini:
SEED_ADMIN_EMAIL=
SEED_ADMIN_PASSWORD=
```
Lalu restart aplikasi.

---

## Troubleshooting

### Aplikasi tidak bisa start
```bash
# Cek apakah build berhasil
ls .next/standalone/

# Cek log Node.js di cPanel → Node.js App → Logs
```

### Error: Cannot find module '.next/standalone/...'
```bash
# Rebuild ulang
npm run build
cp -r public .next/standalone/misi-pintar/public
cp -r .next/static .next/standalone/misi-pintar/.next/static
```

### Database connection error
```bash
# Test koneksi database
npx prisma db pull
```

### Migrations failed
```bash
# Lihat status migrations
npx prisma migrate status

# Jika perlu reset (HAPUS SEMUA DATA):
npx prisma migrate reset
```

---

## Update Aplikasi (Kedepannya)

```bash
git pull origin main          # atau upload file terbaru
npm ci --omit=dev
npx prisma generate
npx prisma migrate deploy     # apply migration baru jika ada
npm run build
cp -r public .next/standalone/misi-pintar/public
cp -r .next/static .next/standalone/misi-pintar/.next/static
# Restart di cPanel Node.js App
```

---

## Struktur File Setelah Build

```
misi-pintar/
├── .env                    ← konfigurasi (JANGAN di-commit ke git)
├── .env.example            ← template konfigurasi
├── server.js               ← entry point cPanel
├── deploy-cpanel.sh        ← script deploy
├── prisma/
│   ├── schema.prisma
│   ├── migrations/         ← history migrations database
│   └── seed.ts
└── .next/
    └── standalone/         ← hasil build (self-contained server)
        └── misi-pintar/
            ├── server.js   ← Next.js standalone server
            ├── public/
            └── .next/static/
```
