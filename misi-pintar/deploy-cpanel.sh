#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# MISI PINTAR — Deploy Script untuk cPanel / Shared Hosting
# Jalankan di server via SSH setelah git pull
#
# Usage:
#   chmod +x deploy-cpanel.sh
#   ./deploy-cpanel.sh
#
# Prasyarat:
#   - File .env sudah diisi (cp .env.example .env && nano .env)
#   - Node.js >= 20 tersedia di PATH
#   - PostgreSQL database sudah dibuat dan DATABASE_URL diisi di .env
# ─────────────────────────────────────────────────────────────────────────────

set -e

# Warna output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"; }
ok()  { echo -e "${GREEN}✅${NC} $1"; }
warn(){ echo -e "${YELLOW}⚠️ ${NC} $1"; }
err() { echo -e "${RED}❌${NC} $1"; exit 1; }

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   MISI PINTAR — Deploy Script${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ── Cek .env ──────────────────────────────────────────────────────────────────
if [ ! -f ".env" ]; then
  err "File .env tidak ditemukan!\n   Buat dulu: cp .env.example .env && nano .env"
fi
ok ".env ditemukan"

# ── Load .env untuk cek DATABASE_URL ──────────────────────────────────────────
set -a; source .env; set +a

if [ -z "$DATABASE_URL" ]; then
  err "DATABASE_URL belum diisi di .env"
fi
ok "DATABASE_URL tersedia"

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
  cp -r public "$STANDALONE/public"
  ok "public/ → .next/standalone/public/"
fi

if [ -d ".next/static" ]; then
  mkdir -p "$STANDALONE/.next/static"
  cp -r .next/static "$STANDALONE/.next/static"
  ok ".next/static/ → .next/standalone/.next/static/"
fi

# ── Selesai ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   ✅  Build selesai!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "📋 ${YELLOW}Langkah selanjutnya:${NC}"
echo "   1. Buka cPanel → Node.js App → Restart Application"
echo "   2. Pastikan startup file di cPanel diset ke: app.js"
echo "   3. Akses aplikasi di domain Anda"
echo ""
if [ -n "$SEED_ADMIN_EMAIL" ]; then
  echo -e "   ${RED}⚠️  PENTING: Hapus SEED_ADMIN_EMAIL & SEED_ADMIN_PASSWORD dari .env!${NC}"
  echo ""
fi
