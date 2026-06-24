#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# cpanel-install.sh
#
# Dipanggil otomatis saat "npm run build" via prebuild script.
#
# Masalah: cPanel membungkus binary `npm` dengan virtual env wrapper yang
# menginstall paket ke ~/nodevenv/ bukan ke ./node_modules/ lokal.
# Turbopack (bundler Next.js 16) resolves modul dengan berjalan naik dari
# direktori sumber — ia TIDAK bisa membaca NODE_PATH seperti Node.js runtime.
# Akibatnya, paket seperti lucide-react, framer-motion dll. tidak ditemukan.
#
# Fix: gunakan npm sistem cPanel yang asli (/opt/cpanel/ea-nodejsNN/bin/npm)
# yang menginstall ke ./node_modules/ lokal seperti npm biasa.
# ─────────────────────────────────────────────────────────────────────────────

# Jika node_modules/next sudah ada secara lokal → skip install (Replit/dev env)
if [ -d "node_modules/next" ] && [ -d "node_modules/lucide-react" ]; then
  echo "[prebuild] Local node_modules OK — skip install"
  exit 0
fi

echo "[prebuild] Local node_modules tidak lengkap — install dengan system npm..."

# Deteksi Node.js major version
NODE_MAJOR=$(node --version 2>/dev/null | sed 's/v//' | cut -d. -f1)
NODE_MAJOR="${NODE_MAJOR:-22}"

# Cari npm sistem cPanel (bukan wrapper virtual env)
SYSTEM_NPM=""
for TRY_PATH in \
  "/opt/cpanel/ea-nodejs${NODE_MAJOR}/bin/npm" \
  "/opt/cpanel/ea-nodejs22/bin/npm" \
  "/opt/cpanel/ea-nodejs20/bin/npm" \
  "/opt/cpanel/ea-nodejs18/bin/npm"
do
  if [ -x "$TRY_PATH" ]; then
    SYSTEM_NPM="$TRY_PATH"
    break
  fi
done

if [ -n "$SYSTEM_NPM" ]; then
  echo "[prebuild] Menggunakan: $SYSTEM_NPM"
  "$SYSTEM_NPM" install
else
  echo "[prebuild] System npm tidak ditemukan, coba unset prefix..."
  # Unset env var yang mungkin di-set oleh cPanel virtual env wrapper
  unset npm_config_prefix
  unset NPM_CONFIG_PREFIX
  npm install
fi

# Verifikasi
if [ -d "node_modules/next" ] && [ -d "node_modules/lucide-react" ]; then
  echo "[prebuild] Install OK — node_modules lokal siap"
else
  echo "[prebuild] WARNING: node_modules mungkin tidak lengkap" >&2
fi
