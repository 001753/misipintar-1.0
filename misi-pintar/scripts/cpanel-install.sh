#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# cpanel-install.sh — Dipanggil otomatis via "prebuild" di package.json
#
# MASALAH:
#   cPanel membungkus `npm` dengan wrapper yang menambahkan --prefix $NODEVENV
#   sehingga semua `npm install` masuk ke ~/nodevenv/... bukan ./node_modules/.
#   Turbopack tidak membaca NODE_PATH, hanya bisa resolve dari node_modules/
#   yang bisa dijangkau dengan berjalan naik dari src/.
#
# SOLUSI:
#   1. Baca wrapper npm untuk dapat path npm asli (/opt/cpanel/ea-nodejsNN/bin/npm)
#   2. Gunakan npm asli → install ke ./node_modules/ lokal
#   3. Fallback: kirim --prefix $(pwd) ke wrapper (jika flag kita datang terakhir)
# ─────────────────────────────────────────────────────────────────────────────

# Jalankan dari direktori misi-pintar/ (parent scripts/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
cd "$APP_DIR" || exit 1

echo "[prebuild] Dir: $APP_DIR"

# ── Skip jika paket sudah ada ────────────────────────────────────────────────
if [ -d "node_modules/next" ] && [ -d "node_modules/lucide-react" ] && [ -d "node_modules/framer-motion" ]; then
  echo "[prebuild] Local node_modules lengkap — skip"
  exit 0
fi

echo "[prebuild] Install paket ke local node_modules..."

# ── Temukan npm asli (bukan wrapper cPanel) ──────────────────────────────────
find_real_npm() {
  # Strategi 1: baca wrapper npm, ekstrak path npm asli
  # Wrapper biasanya berisi: exec /opt/cpanel/ea-nodejsNN/bin/npm "$@"
  local wrapper
  wrapper=$(command -v npm 2>/dev/null)
  if [ -f "$wrapper" ]; then
    # Cari path /opt/.../npm atau /usr/.../npm di dalam wrapper
    local real
    real=$(grep -oE '[/]opt[/][^ "'"'"']+/npm' "$wrapper" 2>/dev/null | grep -v nodevenv | head -1)
    if [ -z "$real" ]; then
      real=$(grep -oE '[/]usr[/][^ "'"'"']+/npm' "$wrapper" 2>/dev/null | grep -v nodevenv | head -1)
    fi
    if [ -n "$real" ] && [ -x "$real" ]; then
      echo "$real"
      return
    fi

    # Cari "source /path/to/enable" lalu ekstrak bin dari sana
    local enable_script
    enable_script=$(grep -oE '(source|\.) [^ ]+' "$wrapper" 2>/dev/null | awk '{print $2}' | head -1)
    if [ -f "$enable_script" ]; then
      real=$(grep -oE 'PATH=[^:]+' "$enable_script" 2>/dev/null | head -1 | cut -d= -f2)
      if [ -x "$real/npm" ]; then
        echo "$real/npm"
        return
      fi
    fi
  fi

  # Strategi 2: path standar cPanel (glob, tidak pakai brace expansion)
  local ver
  ver=$(node --version 2>/dev/null | tr -d 'v' | cut -d. -f1)
  for v in "$ver" 22 20 18 16; do
    local p="/opt/cpanel/ea-nodejs${v}/bin/npm"
    if [ -x "$p" ]; then
      echo "$p"
      return
    fi
  done

  # Strategi 3: scan semua binary npm di /opt/cpanel/
  for p in /opt/cpanel/ea-nodejs*/bin/npm; do
    if [ -x "$p" ] && echo "$p" | grep -qv nodevenv; then
      echo "$p"
      return
    fi
  done

  # Strategi 4: npm lain di PATH yang bukan nodevenv (tanpa process substitution)
  local all_npm
  all_npm=$(command -v -a npm 2>/dev/null || which npm 2>/dev/null)
  for p in $all_npm; do
    if [ -x "$p" ] && echo "$p" | grep -qv nodevenv; then
      echo "$p"
      return
    fi
  done

  # Tidak ketemu
  echo ""
}

REAL_NPM=$(find_real_npm)

# ── Install ──────────────────────────────────────────────────────────────────
rm -rf node_modules 2>/dev/null || true

if [ -n "$REAL_NPM" ]; then
  echo "[prebuild] Menggunakan system npm: $REAL_NPM"
  "$REAL_NPM" install
else
  # Fallback A: kirim --prefix $(pwd) — jika wrapper append flag-nya,
  # flag kita datang lebih dulu; jika prepend, kita coba override lewat env
  echo "[prebuild] System npm tidak ditemukan — coba override prefix..."
  CURDIR="$(pwd)"
  npm_config_prefix="$CURDIR" NPM_CONFIG_PREFIX="$CURDIR" npm install --prefix "$CURDIR"
fi

# ── Verifikasi ───────────────────────────────────────────────────────────────
MISSING=""
for pkg in next lucide-react framer-motion "@prisma/client"; do
  test -d "node_modules/$pkg" || MISSING="$MISSING $pkg"
done

if [ -n "$MISSING" ]; then
  echo ""
  echo "[prebuild] ❌ Paket tidak terinstall lokal:$MISSING"
  echo ""
  echo "  Diagnosa — jalankan di SSH:"
  echo "    cat \$(command -v npm)          ← lihat isi wrapper"
  echo "    ls /opt/cpanel/ea-nodejs*/bin/npm  ← cari system npm"
  echo "    node --version                 ← versi node aktif"
  echo ""
  echo "  Kemudian jalankan manual dengan path npm asli:"
  echo "    /opt/cpanel/ea-nodejs22/bin/npm install   ← ganti versinya"
  echo ""
  exit 1
fi

# ── Prisma generate ──────────────────────────────────────────────────────────
if [ -f "node_modules/.bin/prisma" ]; then
  echo "[prebuild] Prisma generate..."
  ./node_modules/.bin/prisma generate 2>/dev/null || true
fi

echo "[prebuild] ✅ node_modules lokal siap — lanjut ke next build"
