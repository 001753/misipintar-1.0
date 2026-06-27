#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# prepare-standalone.sh — Copy static assets ke dalam .next/standalone/
#
# Next.js standalone output TIDAK menyertakan:
#   - .next/static/   → file JS/CSS yang diminta browser (_next/static/...)
#   - public/         → asset publik (gambar, favicon, manifest, dll)
#
# Tanpa dua folder ini, semua JS/CSS di browser akan 404.
#
# Jalankan setelah `next build`:
#   bash scripts/prepare-standalone.sh
#
# Atau otomatis via: npm run build:cpanel
# ─────────────────────────────────────────────────────────────────────────────

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
cd "$APP_DIR"

STANDALONE="$APP_DIR/.next/standalone"

# ── Validasi: standalone harus sudah ada ─────────────────────────────────────
if [ ! -d "$STANDALONE" ]; then
  echo "❌ .next/standalone tidak ditemukan."
  echo "   Jalankan dulu: npm run build"
  exit 1
fi

if [ ! -f "$STANDALONE/server.js" ]; then
  echo "❌ .next/standalone/server.js tidak ditemukan."
  echo "   Build mungkin belum selesai atau output bukan standalone."
  exit 1
fi

echo "📦 Menyiapkan standalone untuk deploy..."

# ── 1. Copy .next/static/ → .next/standalone/.next/static/ ───────────────────
# Ini berisi semua file JS/CSS yang diminta browser via /_next/static/...
if [ -d "$APP_DIR/.next/static" ]; then
  echo "   → Copy .next/static/ ..."
  mkdir -p "$STANDALONE/.next/static"
  cp -r "$APP_DIR/.next/static/." "$STANDALONE/.next/static/"
  echo "   ✓ .next/static/ berhasil di-copy"
else
  echo "   ⚠️  .next/static/ tidak ditemukan — skip"
fi

# ── 2. Copy public/ → .next/standalone/public/ ───────────────────────────────
# Ini berisi favicon, manifest.json, gambar publik, sw.js, robots.txt, dll
if [ -d "$APP_DIR/public" ]; then
  echo "   → Copy public/ ..."
  mkdir -p "$STANDALONE/public"
  cp -r "$APP_DIR/public/." "$STANDALONE/public/"
  echo "   ✓ public/ berhasil di-copy"
else
  echo "   ⚠️  public/ tidak ditemukan — skip"
fi

# ── Ringkasan ukuran ──────────────────────────────────────────────────────────
echo ""
echo "✅ Standalone siap di: .next/standalone/"
echo ""
du -sh "$STANDALONE" 2>/dev/null && echo ""

echo "─────────────────────────────────────────────────────────"
echo "📤 UPLOAD KE cPANEL:"
echo ""
echo "   Upload SELURUH isi .next/standalone/ ke:"
echo "   ~/public_html/misipintar/  (atau direktori app Anda)"
echo ""
echo "   Struktur yang harus ada di server:"
echo "   public_html/misipintar/"
echo "   ├── server.js          ← entry point Node.js"
echo "   ├── package.json"
echo "   ├── node_modules/      ← sudah di-copy oleh standalone"
echo "   ├── .next/"
echo "   │   └── static/        ← JS/CSS (WAJIB ada)"
echo "   └── public/            ← asset publik (WAJIB ada)"
echo ""
echo "   Lalu set entry point di cPanel Node.js App:"
echo "   Application startup file: server.js"
echo "─────────────────────────────────────────────────────────"
