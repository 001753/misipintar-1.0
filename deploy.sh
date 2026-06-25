#!/usr/bin/env bash
# deploy.sh — MisiPintar, diadopsi dari model SKANSAGIRI
# Penggunaan: bash deploy.sh [branch]   default: main
set -euo pipefail

BRANCH="${1:-main}"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$APP_DIR/deploy.log"
MAX_LOG_LINES=2000
PROTECTED_FILES=(".env" "app.js")

# ── Warna terminal (hanya jika TTY) ──────────────────────────────────────────
if [ -t 1 ]; then
  CR='\033[0;31m' CG='\033[0;32m' CY='\033[1;33m'
  CC='\033[0;36m' CB='\033[1m' CX='\033[0m'
else
  CR='' CG='' CY='' CC='' CB='' CX=''
fi

# ── Logging dengan dual output (stdout + file) ────────────────────────────────
_log() {
  local ts="$(date '+%Y-%m-%d %H:%M:%S')" lv="$1" col="$2" msg="$3"
  printf "${CC}[%s]${CX} ${CB}%s${CX} ${col}%s${CX}\n" "$ts" "[$lv]" "$msg"
  printf "[%s] [%s] %s\n" "$ts" "$lv" "$msg" >> "$LOG_FILE"
}
log_ok()   { _log " OK " "$CG" "$1"; }
log_info() { _log "INFO" ""   "$1"; }
log_warn() { _log "WARN" "$CY" "$1"; }
log_err()  { _log " ERR" "$CR" "$1"; }

rotate_log() {
  [ -f "$LOG_FILE" ] && [ "$(wc -l < "$LOG_FILE")" -gt "$MAX_LOG_LINES" ] && \
    tail -n "$MAX_LOG_LINES" "$LOG_FILE" > "${LOG_FILE}.tmp" && \
    mv "${LOG_FILE}.tmp" "$LOG_FILE" || true
}

# ── Variabel untuk backup (diinisialisasi di sini agar trap bisa akses) ──────
PROTECT_DIR="$APP_DIR/.deploy_protect_$$"
DIST_BACKUP="$APP_DIR/.next_backup_$$"

# ── Backup & restore file terlindungi ────────────────────────────────────────
backup_protected() {
  mkdir -p "$PROTECT_DIR"
  for item in "${PROTECTED_FILES[@]}"; do
    [ -e "$APP_DIR/$item" ] && cp -r "$APP_DIR/$item" "$PROTECT_DIR/$item" || true
  done
}

restore_protected() {
  for item in "${PROTECTED_FILES[@]}"; do
    local bak="$PROTECT_DIR/$item"
    if [ -e "$bak" ]; then
      rm -rf "$APP_DIR/$item"
      cp -r "$bak" "$APP_DIR/$item"
    fi
  done
}

# ── Backup & rollback .next/ ──────────────────────────────────────────────────
backup_dist() {
  [ -d "$APP_DIR/.next/standalone" ] && cp -r "$APP_DIR/.next" "$DIST_BACKUP" || true
}

rollback_dist() {
  if [ -d "$DIST_BACKUP" ]; then
    rm -rf "$APP_DIR/.next"
    cp -r "$DIST_BACKUP" "$APP_DIR/.next"
    log_warn "Rollback .next/ selesai — versi lama dipulihkan"
  fi
}

# ── Cleanup temp dirs ─────────────────────────────────────────────────────────
cleanup() {
  rm -rf "$PROTECT_DIR" "$DIST_BACKUP"
}

# ── Trap ERR dan EXIT ─────────────────────────────────────────────────────────
trap 'log_err "Script gagal di baris $LINENO"; rollback_dist; restore_protected; cleanup' ERR
trap 'cleanup' EXIT

# ═════════════════════════════════════════════════════════════════════════════
# [1/8] VALIDASI PRASYARAT
# ═════════════════════════════════════════════════════════════════════════════
rotate_log
cd "$APP_DIR"

printf "${CB}"
printf "══════════════════════════════════════════════════════\n"
printf "   MISI PINTAR — Deploy Script (model SKANSAGIRI)\n"
printf "   Branch : %s\n" "$BRANCH"
printf "   Dir    : %s\n" "$APP_DIR"
printf "══════════════════════════════════════════════════════\n"
printf "${CX}"
printf "[%s] [INFO] Deploy dimulai — branch=%s\n" "$(date '+%Y-%m-%d %H:%M:%S')" "$BRANCH" >> "$LOG_FILE"

log_info "[1/8] Validasi prasyarat..."

if [ ! -f "$APP_DIR/.env" ]; then
  log_err "File .env tidak ditemukan di $APP_DIR"
  log_err "Buat dulu: cp .env.example .env && nano .env"
  exit 1
fi
log_ok ".env ditemukan"

# Load .env — strip Windows CRLF (\r) sebelum source
TMP_ENV=$(mktemp /tmp/misipintar-env.XXXXXX)
sed 's/\r//' "$APP_DIR/.env" > "$TMP_ENV"
set -a
# shellcheck source=/dev/null
source "$TMP_ENV"
set +a
rm -f "$TMP_ENV"

if [ -z "${DATABASE_URL:-}" ]; then
  log_err "DATABASE_URL belum diisi di .env"
  exit 1
fi
log_ok "DATABASE_URL tersedia"

if ! command -v git &>/dev/null; then
  log_err "git tidak ditemukan — install dulu atau cek PATH"
  exit 1
fi
log_ok "git tersedia: $(git --version)"

COMMIT_BEFORE=$(git rev-parse HEAD 2>/dev/null | head -c 8 || echo "unknown")
log_info "Commit sekarang: $COMMIT_BEFORE"

# ═════════════════════════════════════════════════════════════════════════════
# [2/8] BACKUP FILE TERLINDUNGI
# ═════════════════════════════════════════════════════════════════════════════
log_info "[2/8] Backup file terlindungi (.env, app.js)..."
backup_protected
log_ok "Backup selesai → $PROTECT_DIR"

# ═════════════════════════════════════════════════════════════════════════════
# [3/8] GIT PULL BERSIH
# ═════════════════════════════════════════════════════════════════════════════
log_info "[3/8] Git pull bersih dari origin/$BRANCH..."

git fetch origin "$BRANCH" 2>&1 | sed 's/^/  [git] /' | tee -a "$LOG_FILE"
git checkout "$BRANCH" 2>&1 | sed 's/^/  [git] /' | tee -a "$LOG_FILE"
git reset --hard "origin/$BRANCH" 2>&1 | sed 's/^/  [git] /' | tee -a "$LOG_FILE"

# Restore segera setelah git reset agar .env & app.js tidak tertimpa
restore_protected
rm -rf "$PROTECT_DIR"

COMMIT_AFTER=$(git rev-parse HEAD 2>/dev/null | head -c 8 || echo "unknown")
log_ok "Pull selesai: $COMMIT_BEFORE → $COMMIT_AFTER"

# ═════════════════════════════════════════════════════════════════════════════
# [4/8] DETEKSI NPM SISTEM cPANEL
# ═════════════════════════════════════════════════════════════════════════════
log_info "[4/8] Deteksi npm sistem cPanel..."

detect_system_npm() {
  NODE_MAJOR=$(node --version 2>/dev/null | grep -oP '^\d+' || echo "22")
  SYSTEM_NPM="/opt/cpanel/ea-nodejs${NODE_MAJOR}/bin/npm"
  if [ -f "$SYSTEM_NPM" ]; then echo "$SYSTEM_NPM"; return; fi
  FOUND=$(ls /opt/cpanel/ea-nodejs*/bin/npm 2>/dev/null | sort -t's' -k2 -rn | head -1)
  if [ -n "$FOUND" ]; then echo "$FOUND"; return; fi
  echo "env -u npm_config_prefix -u NPM_CONFIG_PREFIX npm"
}

NPM_BIN=$(detect_system_npm)
log_ok "npm: $NPM_BIN  |  Node: $(node --version)"

# ═════════════════════════════════════════════════════════════════════════════
# [5/8] INSTALL DEPENDENCIES
# ═════════════════════════════════════════════════════════════════════════════
log_info "[5/8] Install dependencies ke ./node_modules lokal..."

if [ -d "node_modules" ]; then
  log_warn "Hapus node_modules lama..."
  rm -rf node_modules
fi

# --prefix memaksa npm menginstall ke ./node_modules lokal, bukan ke nodevenv cPanel
eval "$NPM_BIN install --prefix '$APP_DIR'" 2>&1 | sed 's/^/  [npm] /' | tee -a "$LOG_FILE"

# Verifikasi paket kritis
if [ ! -d "node_modules/next" ]; then
  log_err "node_modules/next tidak ditemukan setelah install"
  log_err "Coba jalankan manual: $NPM_BIN install --prefix '$APP_DIR'"
  exit 1
fi
if [ ! -d "node_modules/.prisma" ]; then
  log_err "node_modules/.prisma tidak ditemukan setelah install"
  exit 1
fi

log_ok "Dependencies terinstall di ./node_modules"

# ═════════════════════════════════════════════════════════════════════════════
# [6/8] PRISMA GENERATE + MIGRATE DEPLOY
# ═════════════════════════════════════════════════════════════════════════════
log_info "[6/8] Prisma generate + migrate deploy..."

./node_modules/.bin/prisma generate 2>&1 | sed 's/^/  [prisma] /' | tee -a "$LOG_FILE"
log_ok "Prisma Client terbuat"

./node_modules/.bin/prisma migrate deploy 2>&1 | sed 's/^/  [prisma] /' | tee -a "$LOG_FILE"
log_ok "Migrations berhasil"

# Seed opsional — hanya jika SEED_ADMIN_EMAIL dan SEED_ADMIN_PASSWORD diset
if [ -n "${SEED_ADMIN_EMAIL:-}" ] && [ -n "${SEED_ADMIN_PASSWORD:-}" ]; then
  log_info "Menjalankan seed (Plans + SuperAdmin)..."
  ./node_modules/.bin/prisma db seed 2>&1 | sed 's/^/  [seed] /' | tee -a "$LOG_FILE" || \
    log_warn "Seeding dilewati (mungkin sudah ada data)"
  log_ok "Seeding selesai"
  log_warn "══════════════════════════════════════════════════════"
  log_warn "HAPUS SEED_ADMIN_EMAIL dan SEED_ADMIN_PASSWORD dari .env"
  log_warn "setelah deploy ini selesai!"
  log_warn "══════════════════════════════════════════════════════"
else
  log_warn "SEED_ADMIN_EMAIL tidak diset — seeding dilewati"
fi

# ═════════════════════════════════════════════════════════════════════════════
# [7/8] BUILD NEXT.JS + VERIFIKASI + COPY STATIC
# ═════════════════════════════════════════════════════════════════════════════
log_info "[7/8] Build Next.js + verifikasi + copy static..."

backup_dist

# Export env vars wajib untuk cPanel shared hosting
export RAYON_NUM_THREADS=1
export TOKIO_WORKER_THREADS=1
export UV_THREADPOOL_SIZE=1
export NEXT_TELEMETRY_DISABLED=1
# 768MB heap — webpack compilation butuh ~600-700MB untuk app ini.
# SIGSEGV yang dulu terjadi di static generation worker sudah diatasi via
# lazy PrismaClient (Proxy pattern di src/lib/prisma.ts), bukan via limit memori.
# Jadi limit bisa dinaikkan ke 768MB agar webpack tidak OOM.
# --max-semi-space-size=32 tetap dibatasi agar young gen tidak rakus.
export NODE_OPTIONS="${NODE_OPTIONS:+$NODE_OPTIONS }--max-old-space-size=768 --max-semi-space-size=32"

BUILD_START="$(date +%s)"
NODE_ENV=production ./node_modules/.bin/next build --webpack 2>&1 | \
  sed 's/^/  [build] /' | tee -a "$LOG_FILE"
BUILD_SECS="$(( $(date +%s) - BUILD_START ))"

# ── Verifikasi post-build ────────────────────────────────────────────────────
log_info "Verifikasi output build..."

VERIFY_FAIL=0

if [ ! -d ".next/standalone" ]; then
  log_err "Folder .next/standalone tidak ditemukan"
  VERIFY_FAIL=1
fi

if [ ! -f ".next/standalone/server.js" ]; then
  log_err "File .next/standalone/server.js tidak ditemukan"
  VERIFY_FAIL=1
fi

if [ ! -d ".next/static" ]; then
  log_err "Folder .next/static tidak ditemukan"
  VERIFY_FAIL=1
fi

# Cek ukuran server.js > 10KB
if [ -f ".next/standalone/server.js" ]; then
  SERVER_SIZE=$(wc -c < ".next/standalone/server.js")
  if [ "$SERVER_SIZE" -lt 10240 ]; then
    log_err "server.js terlalu kecil (${SERVER_SIZE} bytes < 10KB) — build mungkin corrupt"
    VERIFY_FAIL=1
  fi
fi

if [ "$VERIFY_FAIL" -ne 0 ]; then
  log_err "Verifikasi build GAGAL — rollback ke versi sebelumnya"
  rollback_dist
  exit 1
fi

log_ok "Verifikasi build sukses — server.js: ${SERVER_SIZE} bytes, build: ${BUILD_SECS}s"

# ── Copy static assets ke standalone ────────────────────────────────────────
cp -rf public/ .next/standalone/public/
mkdir -p .next/standalone/.next/static/
cp -rf .next/static/ .next/standalone/.next/static/
log_ok "Static assets disalin ke standalone"

# Cleanup backup dist karena build sukses
rm -rf "$DIST_BACKUP"

# ═════════════════════════════════════════════════════════════════════════════
# [8/8] RESTART PASSENGER
# ═════════════════════════════════════════════════════════════════════════════
log_info "[8/8] Restart Passenger via tmp/restart.txt..."

mkdir -p "$APP_DIR/tmp"
touch "$APP_DIR/tmp/restart.txt"
log_ok "tmp/restart.txt diperbarui — Passenger akan restart"

# ── Health check otomatis (tunggu Passenger siap, max 60 detik) ───────────────
HEALTH_URL="${APP_URL:-}/api/health"
HEALTH_OK=false

if [ -n "${APP_URL:-}" ]; then
  log_info "Menunggu Passenger siap — health check ke $HEALTH_URL ..."
  for i in $(seq 1 12); do
    sleep 5
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$HEALTH_URL" 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
      HEALTH_OK=true
      log_ok "Health check OK (HTTP $HTTP_CODE) setelah $((i * 5))s"
      break
    fi
    log_info "  ... percobaan $i/12 — HTTP $HTTP_CODE"
  done
  if [ "$HEALTH_OK" = "false" ]; then
    log_warn "Health check belum OK setelah 60s — cek manual di cPanel → Node.js App → Restart"
  fi
else
  log_warn "APP_URL tidak diset di .env — health check dilewati"
fi

# ═════════════════════════════════════════════════════════════════════════════
# BANNER PENUTUP
# ═════════════════════════════════════════════════════════════════════════════
printf "${CG}"
printf "══════════════════════════════\n"
printf "DEPLOY BERHASIL ✓\n"
printf "Commit  : %s → %s\n" "$COMMIT_BEFORE" "$COMMIT_AFTER"
printf "Branch  : %s\n" "$BRANCH"
printf "Build   : %ss\n" "$BUILD_SECS"
printf ".env    : TIDAK DIUBAH\n"
printf "app.js  : TIDAK DIUBAH (dari cPanel)\n"
printf "Log     : %s\n" "$LOG_FILE"
if [ "$HEALTH_OK" = "true" ]; then
  printf "Health  : ✓ %s/api/health\n" "${APP_URL:-}"
else
  printf "Health  : ⚠ cek manual — %s/api/health\n" "${APP_URL:-[set APP_URL di .env]}"
fi
printf "══════════════════════════════\n"
printf "${CY}Jika site belum merespons:\n"
printf "  cPanel → Node.js App → klik RESTART manual.\n"
printf "══════════════════════════════\n"
printf "${CX}"

printf "[%s] [ OK ] Deploy selesai: %s → %s (build %ss, health=%s)\n" \
  "$(date '+%Y-%m-%d %H:%M:%S')" "$COMMIT_BEFORE" "$COMMIT_AFTER" "$BUILD_SECS" "$HEALTH_OK" >> "$LOG_FILE"
