# Panduan Deploy Misi Pintar ke cPanel / Shared Hosting via GitHub

## Prasyarat

| Kebutuhan | Minimal |
|-----------|---------|
| Node.js | 20.x atau 22.x |
| PostgreSQL | 14+ |
| RAM | 512 MB |
| Redis | Opsional (rate-limit & notifikasi) |

> **Catatan:** Tanpa Redis, fitur rate-limiting login dan push notification akan dinonaktifkan secara otomatis — aplikasi tetap berjalan normal.

---

## Pilihan Metode Deploy

Ada **2 cara** untuk deploy via GitHub:

| Metode | Keunggulan | Kapan Digunakan |
|--------|-----------|-----------------|
| **A. cPanel Git Version Control** | Otomatis pull setiap push ke GitHub | Hosting yang support cPanel Git |
| **B. GitHub Actions + SSH** | Lebih kontrol, CI terintegrasi | Hosting dengan akses SSH |

---

## Metode A — cPanel Git Version Control (Direkomendasikan)

### Langkah 1 — Setup Database PostgreSQL

Di cPanel, buka **PostgreSQL Databases**:
1. Buat database: `user_misipintar`
2. Buat user: `user_dbuser`
3. Assign user ke database (semua privileges)
4. Catat host, port, nama database, username, password

### Langkah 2 — Setup Git Version Control di cPanel

1. Buka **cPanel → Git Version Control → Create**
2. Isi form:
   - **Clone URL:** `https://github.com/USERNAME/REPO.git`
   - **Repository Path:** `/home/USERNAME/public_html/misipintar`
3. Klik **Create** — cPanel akan clone repo dari GitHub

### Langkah 3 — Setup Node.js App di cPanel

1. Buka **cPanel → Node.js App → Create Application**
2. Isi form:
   - **Node.js version:** 22.x (pilih tertinggi yang tersedia)
   - **Application mode:** Production
   - **Application root:** `public_html/misipintar`
   - **Application URL:** `yourdomain.com` atau subdomain
   - **Application startup file:** `app.js`
3. Klik **Create**

### Langkah 4 — Buat File .env di Server

Via **cPanel Terminal** atau SSH:
```bash
cd ~/public_html/misipintar
cp .env.example .env
nano .env
```

Wajib diisi minimal:
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

### Langkah 5 — Deploy Pertama (Manual)

```bash
cd ~/public_html/misipintar
chmod +x deploy-cpanel.sh
./deploy-cpanel.sh
```

### Langkah 6 — Restart & Verifikasi

1. **cPanel → Node.js App → Restart Application**
2. Buka `https://yourdomain.com` — harus muncul halaman Misi Pintar
3. Login sebagai SuperAdmin

### Langkah 7 — Auto-Deploy Berikutnya

Setelah setup awal, setiap kali push ke branch `main` di GitHub:
- cPanel otomatis pull kode terbaru
- File `.cpanel.yml` dijalankan otomatis (install, generate, migrate, build)
- Restart Node.js App di cPanel

---

## Metode B — GitHub Actions + SSH

Metode ini menggunakan GitHub Actions untuk otomatis deploy via SSH setiap push ke branch `main`.

### Langkah 1 — Setup SSH di cPanel

Aktifkan SSH access di cPanel dan catat:
- Host server (IP atau domain)
- Username cPanel
- Password cPanel
- Port SSH (biasanya 22)

### Langkah 2 — Tambah GitHub Secrets

Di repository GitHub → **Settings → Secrets and variables → Actions**:

| Secret | Nilai |
|--------|-------|
| `CPANEL_SSH_HOST` | IP atau hostname server (misal: `server123.hosting.com`) |
| `CPANEL_SSH_USER` | Username cPanel (misal: `tirton`) |
| `CPANEL_SSH_PASSWORD` | Password cPanel |
| `CPANEL_SSH_PORT` | Port SSH (default: `22`) |

### Langkah 3 — Setup Server (Sekali)

SSH ke server, lalu:
```bash
cd ~/public_html/misipintar
cp .env.example .env
nano .env   # isi semua nilai yang dibutuhkan
```

### Langkah 4 — Push ke GitHub

Setiap push ke branch `main` akan otomatis:
1. ✅ Typecheck & lint kode
2. 🚀 SSH ke server, git pull, jalankan `deploy-cpanel.sh`
3. 🔁 Restart aplikasi

Lihat progress di: **GitHub → Actions tab**

---

## Update Aplikasi (Setelah Setup)

### Metode A (cPanel Git):
```bash
# Di GitHub — push ke main, cPanel otomatis pull & deploy
git push origin main
# Lalu: cPanel → Node.js App → Restart
```

### Metode B (GitHub Actions):
```bash
# Cukup push ke main — GitHub Actions deploy otomatis
git push origin main
```

### Manual via SSH:
```bash
cd ~/public_html/misipintar
git pull origin main
./deploy-cpanel.sh
# Restart di cPanel → Node.js App → Restart
```

---

## Troubleshooting

### Aplikasi tidak bisa start
```bash
# Pastikan build sudah ada
ls .next/standalone/server.js

# Cek startup file di cPanel diset ke: app.js
# Cek log: cPanel → Node.js App → klik nama app → lihat error log
```

### Error: Cannot find module '.next/standalone/server.js'
```bash
# Rebuild ulang
cd ~/public_html/misipintar
npm run build
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static
# Restart di cPanel
```

### Database connection error
```bash
# Test koneksi
npx prisma db pull

# Cek DATABASE_URL di .env sudah benar
cat .env | grep DATABASE_URL
```

### Migrations failed
```bash
# Lihat status
npx prisma migrate status

# Apply saja migration yang pending (aman untuk production)
npx prisma migrate deploy
```

### GitHub Actions gagal

Periksa di **GitHub → Actions tab**:
- Job `ci` gagal → ada error TypeScript/lint di kode
- Job `deploy` gagal → cek GitHub Secrets SSH sudah benar
- SSH timeout → cek firewall hosting, port SSH

---

## Struktur File Penting

```
misipintar/                     ← Application root di cPanel
├── app.js                      ← Startup file cPanel (gunakan ini)
├── server.js                   ← Alias startup (sama seperti app.js)
├── deploy-cpanel.sh            ← Script deploy manual via SSH
├── .cpanel.yml                 ← Auto-deploy via cPanel Git Version Control
├── .env                        ← Konfigurasi (JANGAN di-commit ke git!)
├── .env.example                ← Template konfigurasi (aman di-commit)
├── .github/
│   └── workflows/
│       └── deploy.yml          ← GitHub Actions CI/CD
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
└── .next/
    └── standalone/             ← Hasil build Next.js
        ├── server.js           ← Server Next.js (dijalankan oleh app.js)
        ├── public/             ← Static assets (di-copy saat deploy)
        └── .next/
            └── static/         ← CSS/JS chunks (di-copy saat deploy)
```
