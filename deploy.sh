#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy.sh — Update aplikasi dari GitHub dan restart di cPanel
#
# Jalankan dari SSH cPanel di folder aplikasi:
#   cd ~/public_html/misipintar/misipintar-1.0
#   bash deploy.sh
#
# Yang dilakukan script ini:
#   1. Ambil perubahan terbaru dari GitHub (force reset — hapus file lama)
#   2. Install dependencies Node.js ke local node_modules/
#   3. Generate Prisma client (binary engine)
#   4. Jalankan migrasi database terbaru
# ─────────────────────────────────────────────────────────────────────────────

set -e

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"

echo ""
echo "════════════════════════════════════════════════════════"
echo "  MisiPintar — Deploy Script"
echo "  Dir : $APP_DIR"
echo "  Date: $(date)"
echo "════════════════════════════════════════════════════════"
echo ""

# ── 1. Git: reset & pull ──────────────────────────────────────────────────────
echo "▶ [1/4] Git pull origin main ..."

# Hapus perubahan lokal di .next/ (hasil build lama di server)
# agar git pull tidak gagal dengan "would be overwritten"
git fetch origin
git reset --hard origin/main

echo "  ✓ Kode berhasil diperbarui"
echo ""

# ── 2. Install dependencies ───────────────────────────────────────────────────
echo "▶ [2/4] Install Node.js dependencies ..."

# Batasi thread agar tidak crash di cPanel shared hosting (ulimit -u rendah).
# UV_THREADPOOL_SIZE  : Node.js libuv thread pool
# RAYON_NUM_THREADS   : Rust/SWC compiler threads
# npm_config_maxsockets / --prefer-offline : kurangi koneksi & sub-proses npm
export UV_THREADPOOL_SIZE=1
export RAYON_NUM_THREADS=1
export TOKIO_WORKER_THREADS=1
export npm_config_maxsockets=1

# Cari npm asli (cPanel wrapper npm bisa redirect ke nodevenv yang salah)
find_real_npm() {
  local wrapper
  wrapper=$(command -v npm 2>/dev/null)
  if [ -f "$wrapper" ]; then
    local real
    real=$(grep -oE '[/]opt[/][^ "'"'"']+/npm' "$wrapper" 2>/dev/null | grep -v nodevenv | head -1)
    if [ -n "$real" ] && [ -x "$real" ]; then echo "$real"; return; fi
  fi
  local ver
  ver=$(node --version 2>/dev/null | tr -d 'v' | cut -d. -f1)
  for v in "$ver" 22 20 18; do
    local p="/opt/cpanel/ea-nodejs${v}/bin/npm"
    if [ -x "$p" ]; then echo "$p"; return; fi
  done
  echo ""
}

REAL_NPM=$(find_real_npm)

# --ignore-scripts: cegah lifecycle hooks (postinstall, prepare, dll) spawn proses baru.
# Prisma generate sudah ditangani eksplisit di step 3.
# --no-fund --no-audit: skip network request tambahan yg spawn child process.
INSTALL_FLAGS="--omit=dev --ignore-scripts --no-fund --no-audit"

if [ -n "$REAL_NPM" ]; then
  echo "  → Menggunakan: $REAL_NPM"
  "$REAL_NPM" install $INSTALL_FLAGS
else
  echo "  → Menggunakan npm default (wrapper)"
  CURDIR="$(pwd)"
  npm_config_prefix="$CURDIR" NPM_CONFIG_PREFIX="$CURDIR" \
    npm install $INSTALL_FLAGS --prefix "$CURDIR"
fi

echo "  ✓ Dependencies terinstall"
echo ""

# ── 3. Prisma generate ────────────────────────────────────────────────────────
echo "▶ [3/4] Prisma generate ..."

if [ -f "./node_modules/.bin/prisma" ]; then
  ./node_modules/.bin/prisma generate 2>/dev/null
  echo "  ✓ Prisma client siap"
else
  echo "  ⚠️  prisma tidak ditemukan di node_modules — skip"
fi
echo ""

# ── 4. Prisma migrate deploy ──────────────────────────────────────────────────
echo "▶ [4/5] Prisma migrate deploy ..."

if [ -f "./node_modules/.bin/prisma" ]; then
  ./node_modules/.bin/prisma migrate deploy && echo "  ✓ Migrasi database selesai" || {
    echo "  ⚠️  Migrasi gagal atau tidak ada migrasi baru — lanjut"
  }
else
  echo "  ⚠️  Skip (prisma tidak ada)"
fi
echo ""

# ── 5. Restart app (Phusion Passenger) ───────────────────────────────────────
echo "▶ [5/5] Restart aplikasi ..."

RESTARTED=0

# Cara 1: passenger-config restart-app (tersedia jika Passenger di PATH)
if command -v passenger-config &>/dev/null; then
  passenger-config restart-app "$APP_DIR" && RESTARTED=1 && echo "  ✓ Restart via passenger-config"
fi

# Cara 2: touch tmp/restart.txt — Passenger akan reload otomatis pada request berikutnya
if [ "$RESTARTED" -eq 0 ]; then
  mkdir -p "$APP_DIR/tmp"
  touch "$APP_DIR/tmp/restart.txt"
  RESTARTED=1
  echo "  ✓ Restart via tmp/restart.txt (Passenger akan reload saat request berikutnya)"
fi

echo ""

# ── Selesai ───────────────────────────────────────────────────────────────────
echo "════════════════════════════════════════════════════════"
echo "  ✅ Deploy selesai! Aplikasi sudah di-restart otomatis."
echo "════════════════════════════════════════════════════════"
echo ""
