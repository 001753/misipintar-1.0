#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# cpanel-install.sh — Dipanggil otomatis via "prebuild" di package.json
#
# MASALAH:
#   cPanel Application Root = public_html/misipintar (workspace root).
#   npm install di sana hanya install 3 paket (next/react/react-dom) ke nodevenv.
#   Turbopack berjalan dari misi-pintar/src/ ke atas, menemukan
#   public_html/misipintar/node_modules/ yang TIDAK punya lucide-react dll.
#   → Module not found untuk semua paket di misi-pintar/package.json.
#
# SOLUSI:
#   Gunakan npm sistem cPanel yang asli (bukan wrapper virtual env) untuk
#   install SEMUA 50+ paket misi-pintar/ ke ./node_modules/ lokal.
#   Turbopack menemukan paket di misi-pintar/node_modules/ ✅
# ─────────────────────────────────────────────────────────────────────────────

# Script ini selalu dijalankan dari direktori misi-pintar/ (karena berada di
# package.json misi-pintar/). Pastikan kita memang di direktori yang benar.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"   # parent dari scripts/ = misi-pintar/
cd "$APP_DIR" || exit 1

echo "[prebuild] Direktori: $APP_DIR"

# ── Cek apakah local node_modules sudah lengkap ─────────────────────────────
# Jika paket utama sudah ada (Replit/dev env atau sudah pernah install) → skip
if [ -d "node_modules/next" ] && [ -d "node_modules/lucide-react" ] && [ -d "node_modules/framer-motion" ]; then
  echo "[prebuild] Local node_modules lengkap — skip install"
  exit 0
fi

echo "[prebuild] Local node_modules tidak lengkap — cari system npm..."

# ── Temukan npm sistem (bukan wrapper cPanel virtual env) ───────────────────
# Strategi 1: cari npm yang TIDAK berada di path nodevenv
find_system_npm() {
  # `which -a npm` menampilkan semua npm di PATH
  while IFS= read -r npm_path; do
    if [[ "$npm_path" != *"nodevenv"* ]] && [ -x "$npm_path" ]; then
      echo "$npm_path"
      return
    fi
  done < <(which -a npm 2>/dev/null)

  # Strategi 2: path cPanel standar berdasarkan versi node aktif
  local node_major
  node_major=$(node --version 2>/dev/null | sed 's/v//' | cut -d. -f1)
  for ver in "$node_major" 22 20 18 16; do
    local p="/opt/cpanel/ea-nodejs${ver}/bin/npm"
    if [ -x "$p" ]; then
      echo "$p"
      return
    fi
  done

  # Strategi 3: cari npm di semua /opt/cpanel/
  local found
  found=$(ls /opt/cpanel/ea-nodejs*/bin/npm 2>/dev/null | sort -t'.' -k2 -rn | head -1)
  if [ -n "$found" ] && [ -x "$found" ]; then
    echo "$found"
    return
  fi

  # Fallback: npm biasa tapi dengan prefix unset
  echo "env -u npm_config_prefix -u NPM_CONFIG_PREFIX $(which npm)"
}

SYSTEM_NPM=$(find_system_npm)
echo "[prebuild] Menggunakan npm: $SYSTEM_NPM"

# ── Install semua paket ke ./node_modules lokal ──────────────────────────────
rm -rf node_modules   # bersihkan sisa symlink/install cPanel yang salah
eval "$SYSTEM_NPM install" || {
  echo "[prebuild] Install gagal — coba fallback..."
  env -u npm_config_prefix -u NPM_CONFIG_PREFIX npm install
}

# ── Verifikasi ───────────────────────────────────────────────────────────────
MISSING=()
for pkg in next lucide-react framer-motion "@prisma/client"; do
  [ -d "node_modules/$pkg" ] || MISSING+=("$pkg")
done

if [ ${#MISSING[@]} -gt 0 ]; then
  echo "[prebuild] ⚠️  Paket berikut belum ada: ${MISSING[*]}" >&2
  echo "[prebuild] Coba jalankan manual:" >&2
  echo "   $SYSTEM_NPM install" >&2
  exit 1
fi

# ── Prisma generate ──────────────────────────────────────────────────────────
echo "[prebuild] Prisma generate..."
./node_modules/.bin/prisma generate 2>/dev/null || true

echo "[prebuild] ✅ Siap untuk next build"
