#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# MISI PINTAR — Deploy Script untuk cPanel / Shared Hosting
#
# Usage (dari root repo ~/public_html/misipintar):
#   chmod +x deploy-cpanel.sh
#   ./deploy-cpanel.sh
# ─────────────────────────────────────────────────────────────────────────────

# Warna output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"; }
ok()  { echo -e "${GREEN}[OK]${NC} $1"; }
warn(){ echo -e "${YELLOW}[WARN]${NC} $1"; }
err() { echo -e "${RED}[ERR]${NC} $1"; exit 1; }

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   MISI PINTAR — Deploy Script${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ── Deteksi direktori (bisa dipanggil dari mana saja) ────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$SCRIPT_DIR"   # root repo directory (~/public_html/misipintar)

echo -e "📂 App dir : $APP_DIR"
echo ""

cd "$APP_DIR" || err "Tidak bisa masuk ke $APP_DIR"

# ── Cek .env ──────────────────────────────────────────────────────────────────
if [ ! -f ".env" ]; then
  err "File .env tidak ditemukan di $APP_DIR\n   Buat dulu: cp .env.example .env && nano .env"
fi
ok ".env ditemukan"

# ── Load .env — strip Windows CRLF (\r) sebelum source ───────────────────────
TMP_ENV=$(mktemp /tmp/misipintar-env.XXXXXX)
sed 's/\r//' .env > "$TMP_ENV"
set -a
# shellcheck source=/dev/null
source "$TMP_ENV"
set +a
rm -f "$TMP_ENV"

if [ -z "$DATABASE_URL" ]; then
  err "DATABASE_URL belum diisi di .env"
fi
ok "DATABASE_URL tersedia"

# Ab ini pakai set -e agar script berhenti jika ada error
set -e

# ── Deteksi npm yang tepat ─────────────────────────────────────────────────────
# cPanel membungkus `npm` dengan virtual env wrapper yang menginstall paket ke
# ~/nodevenv/ bukan ke ./node_modules/. Turbopack butuh paket di ./node_modules/
# lokal (directory traversal — tidak bisa pakai NODE_PATH).
#
# Solusi: gunakan npm sistem cPanel yang asli (bukan wrapper-nya).
# Path: /opt/cpanel/ea-nodejsNN/bin/npm  (NN = versi node, misal 22)
detect_system_npm() {
  # Cari npm sistem cPanel berdasarkan versi Node yang aktif
  NODE_MAJOR=$(node --version 2>/dev/null | grep -oP '^\d+' || echo "22")
  SYSTEM_NPM="/opt/cpanel/ea-nodejs${NODE_MAJOR}/bin/npm"
  if [ -f "$SYSTEM_NPM" ]; then
    echo "$SYSTEM_NPM"
    return
  fi
  # Fallback: cari semua versi dan ambil yang terbaru
  FOUND=$(ls /opt/cpanel/ea-nodejs*/bin/npm 2>/dev/null | sort -t's' -k2 -rn | head -1)
  if [ -n "$FOUND" ]; then
    echo "$FOUND"
    return
  fi
  # Last resort: coba unset prefix lalu pakai npm biasa
  echo "env -u npm_config_prefix -u NPM_CONFIG_PREFIX npm"
}

NPM_BIN=$(detect_system_npm)
echo -e "📦 npm    : $NPM_BIN"
echo ""

# ── Step 1: Install dependencies ke local node_modules ──────────────────────
log "[1/6] Install dependencies ke local node_modules..."

# Hapus node_modules lama supaya tidak ada sisa symlink cPanel yang salah
if [ -d "node_modules" ]; then
  warn "Hapus node_modules lama..."
  rm -rf node_modules
fi

# Instal menggunakan npm sistem (bukan wrapper cPanel)
# Ini memastikan paket masuk ke ./node_modules lokal bukan ke nodevenv
eval "$NPM_BIN install" || err "npm install gagal"

# Verifikasi — pastikan paket penting ada di lokal
if [ ! -d "node_modules/next" ]; then
  err "GAGAL: node_modules/next tidak ditemukan setelah install.\n   Coba jalankan manual: $NPM_BIN install"
fi
if [ ! -d "node_modules/lucide-react" ]; then
  warn "lucide-react tidak ditemukan di node_modules — mungkin ada masalah install"
fi
ok "Dependencies terinstall di ./node_modules"

# ── Step 2: Generate Prisma Client ────────────────────────────────────────────
log "[2/6] Generate Prisma Client..."
./node_modules/.bin/prisma generate
ok "Prisma Client terbuat"

# ── Step 3: Jalankan Migrations ───────────────────────────────────────────────
log "[3/6] Jalankan database migrations..."
./node_modules/.bin/prisma migrate deploy
ok "Migrations berhasil"

# ── Step 4: Seed data awal (opsional) ─────────────────────────────────────────
if [ -n "$SEED_ADMIN_EMAIL" ] && [ -n "$SEED_ADMIN_PASSWORD" ]; then
  log "[4/6] Seed data awal (Plans + SuperAdmin)..."
  ./node_modules/.bin/prisma db seed || warn "Seeding dilewati (mungkin sudah ada data)"
  ok "Seeding selesai — hapus SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD dari .env setelah ini!"
else
  warn "[4/6] SEED_ADMIN_EMAIL tidak diset — seeding dilewati"
fi

# ── Step 5: Build Next.js ─────────────────────────────────────────────────────
log "[5/6] Build Next.js (standalone, Turbopack)..."
#
# RAYON_NUM_THREADS=1 membatasi thread Rust/SWC agar tidak memicu EAGAIN
# di shared hosting yang punya ulimit -u rendah.
# Tidak perlu .babelrc atau --webpack — SWC/Turbopack bawaan Next.js 16 sudah
# handle semua paket via serverExternalPackages di next.config.ts.
#
export RAYON_NUM_THREADS=1
export NODE_OPTIONS="${NODE_OPTIONS:+$NODE_OPTIONS }--max-old-space-size=1024"
./node_modules/.bin/next build
BUILD_RC=$?
[ $BUILD_RC -ne 0 ] && err "Build gagal (exit $BUILD_RC)"
ok "Build berhasil"

# ── Step 6: Copy static assets ────────────────────────────────────────────────
log "[6/6] Copy static assets ke standalone output..."

STANDALONE=".next/standalone"

if [ ! -d "$STANDALONE" ]; then
  err "Folder .next/standalone tidak ditemukan. Build gagal?"
fi

if [ -d "public" ]; then
  cp -rf public "$STANDALONE/public"
  ok "public/ -> .next/standalone/public/"
fi

if [ -d ".next/static" ]; then
  mkdir -p "$STANDALONE/.next/static"
  cp -rf .next/static "$STANDALONE/.next/static"
  ok ".next/static/ -> .next/standalone/.next/static/"
fi

# ── Selesai ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   BUILD SELESAI!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "   1. cPanel -> Node.js App -> Restart Application"
echo "   2. Pastikan startup file: app.js"
echo "   3. Buka domain Anda"
echo ""
if [ -n "$SEED_ADMIN_EMAIL" ]; then
  echo -e "   ${RED}PENTING: Hapus SEED_ADMIN_EMAIL & SEED_ADMIN_PASSWORD dari .env!${NC}"
  echo ""
fi
