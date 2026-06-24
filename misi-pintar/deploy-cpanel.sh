#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# MISI PINTAR — Deploy Script untuk cPanel / Shared Hosting
#
# Usage (dari root repo ~/public_html/misipintar):
#   chmod +x misi-pintar/deploy-cpanel.sh
#   ./misi-pintar/deploy-cpanel.sh
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
APP_DIR="$SCRIPT_DIR"   # misi-pintar/ directory

echo -e "📂 App dir : $APP_DIR"
echo ""

cd "$APP_DIR" || err "Tidak bisa masuk ke $APP_DIR"

# ── Cek .env ──────────────────────────────────────────────────────────────────
if [ ! -f ".env" ]; then
  err "File .env tidak ditemukan di $APP_DIR\n   Buat dulu: cp .env.example .env && nano .env"
fi
ok ".env ditemukan"

# ── Load .env — strip Windows CRLF (\r) sebelum source ───────────────────────
# File .env yang dibuat di Windows mengandung carriage return (\r) yang
# menyebabkan error "$'\r': command not found". Baris ini membersihkannya.
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

# ── Step 1: Install dependencies ──────────────────────────────────────────────
log "[1/6] Install production dependencies..."
npm ci --omit=dev
ok "Dependencies terinstall"

# ── Step 2: Generate Prisma Client ────────────────────────────────────────────
log "[2/6] Generate Prisma Client..."
npx prisma generate
ok "Prisma Client terbuat"

# ── Step 3: Jalankan Migrations ───────────────────────────────────────────────
log "[3/6] Jalankan database migrations..."
npx prisma migrate deploy
ok "Migrations berhasil"

# ── Step 4: Seed data awal (opsional) ─────────────────────────────────────────
if [ -n "$SEED_ADMIN_EMAIL" ] && [ -n "$SEED_ADMIN_PASSWORD" ]; then
  log "[4/6] Seed data awal (Plans + SuperAdmin)..."
  npx prisma db seed || warn "Seeding dilewati (mungkin sudah ada data)"
  ok "Seeding selesai — hapus SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD dari .env setelah ini!"
else
  warn "[4/6] SEED_ADMIN_EMAIL tidak diset — seeding dilewati"
fi

# ── Step 5: Build Next.js ─────────────────────────────────────────────────────
log "[5/6] Build Next.js (standalone)..."
npm run build
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
