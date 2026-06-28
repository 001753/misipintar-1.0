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

if [ -n "$REAL_NPM" ]; then
  echo "  → Menggunakan: $REAL_NPM"
  "$REAL_NPM" install --omit=dev --foreground-scripts=false
else
  echo "  → Menggunakan npm default (wrapper)"
  CURDIR="$(pwd)"
  npm_config_prefix="$CURDIR" NPM_CONFIG_PREFIX="$CURDIR" \
    npm install --omit=dev --foreground-scripts=false --prefix "$CURDIR"
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
echo "▶ [4/4] Prisma migrate deploy ..."

if [ -f "./node_modules/.bin/prisma" ]; then
  ./node_modules/.bin/prisma migrate deploy && echo "  ✓ Migrasi database selesai" || {
    echo "  ⚠️  Migrasi gagal atau tidak ada migrasi baru — lanjut"
  }
else
  echo "  ⚠️  Skip (prisma tidak ada)"
fi
echo ""

# ── Selesai ───────────────────────────────────────────────────────────────────
echo "════════════════════════════════════════════════════════"
echo "  ✅ Deploy selesai!"
echo ""
echo "  Langkah terakhir: RESTART app di cPanel Node.js App"
echo "  (atau gunakan tombol RESTART di panel cPanel)"
echo "════════════════════════════════════════════════════════"
echo ""
