#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy.sh — Update aplikasi dari GitHub dan restart di cPanel
#
# Jalankan dari SSH cPanel di folder aplikasi:
#   cd ~/public_html/misipintar/misipintar-1.0
#   bash deploy.sh
#
# Yang dilakukan script ini:
#   1. Ambil perubahan terbaru dari GitHub (force reset)
#   2. Install dependencies (SKIP jika package.json tidak berubah)
#   3. Generate Prisma client (binary engine)
#   4. Jalankan migrasi database terbaru
#   5. Seed Plans & AppConfig (SKIP otomatis kalau sudah ada)
#   6. Seed akun admin pertama (SKIP otomatis kalau sudah ada)
#   7. Restart aplikasi via Phusion Passenger
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
echo "▶ [1/5] Git pull origin main ..."

git fetch origin
git reset --hard origin/main

echo "  ✓ Kode berhasil diperbarui"
echo ""

# ── 1b. Symlink standalone/node_modules → root node_modules ──────────────────
# .next/standalone/node_modules/ tidak di-commit ke git (terlalu besar ~140MB).
# Next.js standalone server.js butuh node_modules di sampingnya — symlink cukup.
if [ -d "$APP_DIR/.next/standalone" ]; then
  ln -sfn "$APP_DIR/node_modules" "$APP_DIR/.next/standalone/node_modules"
  echo "  ✓ Symlink standalone/node_modules → root node_modules"
fi
echo ""

# ── 2. Install dependencies ───────────────────────────────────────────────────
echo "▶ [2/5] Install Node.js dependencies ..."

# Batasi semua sumber thread — harus di-export sebelum node/npm apapun dijalankan
export UV_THREADPOOL_SIZE=1
export RAYON_NUM_THREADS=1
export TOKIO_WORKER_THREADS=1
export npm_config_maxsockets=1
export NODE_OPTIONS="--max-old-space-size=256"

# ── Deteksi perubahan package.json ──────────────────────────────────────────
# Root penyebab crash: node sendiri gagal buat thread saat server sedang penuh proses.
# Solusi utama: SKIP npm install sepenuhnya jika package.json tidak berubah.
# (99% deploy hanya ubah kode, bukan dependency — install tidak perlu diulang.)
PKG_HASH_FILE="$APP_DIR/.pkg_hash"
PKG_HASH=$(md5sum "$APP_DIR/package.json" | awk '{print $1}')
MODULES_OK=0

if [ -d "$APP_DIR/node_modules" ] && [ -f "$PKG_HASH_FILE" ]; then
  SAVED_HASH=$(cat "$PKG_HASH_FILE" 2>/dev/null || echo "")
  if [ "$PKG_HASH" = "$SAVED_HASH" ]; then
    echo "  → package.json tidak berubah — skip install (node_modules sudah up-to-date)"
    MODULES_OK=1
  else
    echo "  → package.json berubah — install diperlukan"
  fi
else
  echo "  → node_modules belum ada atau hash hilang — install diperlukan"
fi

if [ "$MODULES_OK" -eq 0 ]; then
  # Cari npm-cli.js langsung, hindari wrapper cPanel yang bisa crash lebih awal
  find_npm_cli() {
    # Cari di path ea-nodejs khas cPanel
    local ver
    ver=$(node --version 2>/dev/null | tr -d 'v' | cut -d. -f1)
    for v in "$ver" 22 20 18; do
      for base in \
        "/opt/cpanel/ea-nodejs${v}/root/usr/lib/node_modules/npm/bin" \
        "/opt/cpanel/ea-nodejs${v}/lib/node_modules/npm/bin" \
        "/opt/cpanel/ea-nodejs${v}/bin"; do
        if [ -f "$base/npm-cli.js" ]; then echo "$base/npm-cli.js"; return; fi
      done
    done
    echo ""
  }

  NPM_CLI=$(find_npm_cli)
  INSTALL_FLAGS="--omit=dev --ignore-scripts --no-fund --no-audit"
  MAX_TRIES=3
  SUCCESS=0

  for try in $(seq 1 $MAX_TRIES); do
    echo "  → Install percobaan $try/$MAX_TRIES ..."
    if [ -n "$NPM_CLI" ]; then
      # Jalankan npm-cli.js langsung via node — bypass wrapper cPanel
      node "$NPM_CLI" install $INSTALL_FLAGS && SUCCESS=1 && break
    else
      npm install $INSTALL_FLAGS && SUCCESS=1 && break
    fi
    echo "  ⚠️  Gagal — tunggu 15 detik agar server lowongkan proses ..."
    sleep 15
  done

  if [ "$SUCCESS" -eq 0 ]; then
    echo ""
    echo "  ✗ npm install gagal setelah $MAX_TRIES percobaan."
    echo "    Kemungkinan server sedang penuh proses (RLIMIT_NPROC)."
    echo "    Coba lagi beberapa menit kemudian, atau install manual:"
    echo "    UV_THREADPOOL_SIZE=1 npm install --omit=dev --ignore-scripts"
    exit 1
  fi

  # Simpan hash agar deploy berikutnya bisa skip install
  echo "$PKG_HASH" > "$PKG_HASH_FILE"
fi

echo "  ✓ Dependencies siap"
echo ""

# ── 3. Prisma generate ────────────────────────────────────────────────────────
echo "▶ [3/5] Prisma generate ..."

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

# ── 5. Seed Plans + AppConfig (skip kalau sudah ada) ──────────────────────────
echo "▶ [5/7] Seed plans & AppConfig ..."

if [ -f "./scripts/seed-plans.js" ]; then
  node scripts/seed-plans.js || echo "  ⚠️  seed-plans gagal — lanjut"
else
  echo "  ⚠️  scripts/seed-plans.js tidak ditemukan — skip"
fi
echo ""

# ── 6. Seed admin pertama (skip kalau sudah ada) ──────────────────────────────
echo "▶ [6/7] Seed admin ..."

if [ -f "./scripts/seed-admin.js" ]; then
  node scripts/seed-admin.js || echo "  ⚠️  seed-admin gagal — lanjut"
else
  echo "  ⚠️  scripts/seed-admin.js tidak ditemukan — skip"
fi
echo ""

# ── 7. Restart app (Phusion Passenger) ───────────────────────────────────────
echo "▶ [7/7] Restart aplikasi ..."

RESTARTED=0

# Cara 1: passenger-config restart-app (tersedia jika Passenger di PATH)
if command -v passenger-config &>/dev/null; then
  passenger-config restart-app "$APP_DIR" && RESTARTED=1 && echo "  ✓ Restart via passenger-config"
fi

# Cara 2: touch tmp/restart.txt — Passenger reload otomatis pada request berikutnya
if [ "$RESTARTED" -eq 0 ]; then
  mkdir -p "$APP_DIR/tmp"
  touch "$APP_DIR/tmp/restart.txt"
  RESTARTED=1
  echo "  ✓ Restart via tmp/restart.txt (Passenger reload saat request berikutnya)"
fi

echo ""

# ── Selesai ───────────────────────────────────────────────────────────────────
echo "════════════════════════════════════════════════════════"
echo "  ✅ Deploy selesai! Aplikasi sudah di-restart otomatis."
echo "════════════════════════════════════════════════════════"
echo ""
