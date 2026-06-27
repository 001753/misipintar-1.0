#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# diagnose-cpanel.sh — Diagnosis cepat penyebab 503 di cPanel
# Cara pakai (via SSH): bash scripts/diagnose-cpanel.sh
# ─────────────────────────────────────────────────────────────────────────────

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

sep() { printf '\n%s\n' "══════════════════════════════════════════════"; }
ok()  { printf "  ✓ %s\n" "$1"; }
err() { printf "  ✗ [ERROR] %s\n" "$1"; }
warn(){ printf "  ⚠ [WARN]  %s\n" "$1"; }
info(){ printf "  → %s\n" "$1"; }

sep; echo "  DIAGNOSIS MISI PINTAR — $(date '+%Y-%m-%d %H:%M:%S')"

# ── [A] Cek NODE & NPM ────────────────────────────────────────────────────────
sep; echo "  [A] Node.js & npm"
if command -v node &>/dev/null; then
  ok "node: $(node --version)"
else
  err "Node.js tidak ditemukan di PATH"
fi

if command -v npm &>/dev/null; then
  info "npm wrapper: $(command -v npm)"
  info "npm version: $(npm --version 2>/dev/null || echo 'gagal')"
else
  warn "npm tidak ditemukan"
fi

# ── [B] Cek .env ──────────────────────────────────────────────────────────────
sep; echo "  [B] Environment (.env)"
if [ -f "$APP_DIR/.env" ]; then
  ok ".env ditemukan"
  for key in DATABASE_URL SESSION_SECRET NEXTAUTH_URL APP_URL NODE_ENV; do
    if grep -q "^${key}=" "$APP_DIR/.env" 2>/dev/null; then
      val=$(grep "^${key}=" "$APP_DIR/.env" | head -1 | cut -d= -f2- | cut -c1-40)
      ok "$key = $val..."
    else
      err "$key TIDAK ada di .env"
    fi
  done
else
  err ".env TIDAK ditemukan — WAJIB ada sebelum deploy!"
  info "Buat: cp .env.example .env && nano .env"
fi

# ── [C] Cek Build ─────────────────────────────────────────────────────────────
sep; echo "  [C] Next.js Build (.next/standalone)"
if [ -d "$APP_DIR/.next/standalone" ]; then
  ok ".next/standalone/ ada"
else
  err ".next/standalone/ TIDAK ADA — build belum dijalankan!"
  info "Jalankan: bash deploy.sh"
fi

if [ -f "$APP_DIR/.next/standalone/server.js" ]; then
  SIZE=$(wc -c < "$APP_DIR/.next/standalone/server.js")
  ok ".next/standalone/server.js ada (${SIZE} bytes)"
  if [ "$SIZE" -lt 10240 ]; then
    err "server.js terlalu kecil — build mungkin corrupt"
  fi
else
  err ".next/standalone/server.js TIDAK ADA — 503 pasti terjadi!"
  info "Phusion Passenger tidak bisa start app tanpa file ini"
fi

if [ -d "$APP_DIR/.next/standalone/.next/static" ]; then
  ok ".next/standalone/.next/static/ ada (JS/CSS browser)"
else
  err ".next/standalone/.next/static/ TIDAK ADA — semua JS/CSS akan 404!"
  info "Jalankan: bash scripts/prepare-standalone.sh"
fi

if [ -d "$APP_DIR/.next/standalone/public" ]; then
  ok ".next/standalone/public/ ada"
else
  warn ".next/standalone/public/ tidak ada"
  info "Jalankan: bash scripts/prepare-standalone.sh"
fi

# ── [D] Cek node_modules ──────────────────────────────────────────────────────
sep; echo "  [D] node_modules"
for pkg in next "@prisma/client" ".prisma"; do
  if [ -d "$APP_DIR/node_modules/$pkg" ]; then
    ok "node_modules/$pkg ada"
  else
    err "node_modules/$pkg TIDAK ADA — jalankan install dulu"
  fi
done

# Cek prisma engine
if ls "$APP_DIR/node_modules/.prisma/client/"query_engine* &>/dev/null 2>&1; then
  ENGINE=$(ls "$APP_DIR/node_modules/.prisma/client/"query_engine* 2>/dev/null | head -1 | xargs basename 2>/dev/null)
  ok "Prisma query engine: $ENGINE"
else
  err "Prisma query engine TIDAK ADA — 'prisma generate' belum dijalankan"
  info "Jalankan: ./node_modules/.bin/prisma generate"
fi

# ── [E] Cek app.js ───────────────────────────────────────────────────────────
sep; echo "  [E] app.js (Passenger entry point)"
if [ -f "$APP_DIR/app.js" ]; then
  ok "app.js ada"
  info "Pastikan di cPanel Node.js App Manager:"
  info "  Application startup file = app.js"
  info "  Application root         = $APP_DIR"
else
  err "app.js TIDAK ADA — Passenger tidak bisa start!"
fi

# ── [F] Cek logs ─────────────────────────────────────────────────────────────
sep; echo "  [F] Log terakhir (logs/app.log)"
if [ -f "$APP_DIR/logs/app.log" ]; then
  ok "logs/app.log ada — 20 baris terakhir:"
  echo ""
  tail -20 "$APP_DIR/logs/app.log"
else
  warn "logs/app.log belum ada (app belum pernah start, atau dir logs belum dibuat)"
fi

# ── [G] Cek deploy.log ───────────────────────────────────────────────────────
sep; echo "  [G] Log deploy terakhir (deploy.log)"
if [ -f "$APP_DIR/deploy.log" ]; then
  ok "deploy.log ada — 30 baris terakhir:"
  echo ""
  tail -30 "$APP_DIR/deploy.log"
else
  warn "deploy.log belum ada — bash deploy.sh belum pernah dijalankan"
fi

# ── [H] Cek git ──────────────────────────────────────────────────────────────
sep; echo "  [H] Git"
if command -v git &>/dev/null; then
  REMOTE=$(git remote get-url origin 2>/dev/null || echo "tidak ada")
  BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
  COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
  ok "git ada"
  info "remote : $REMOTE"
  info "branch : $BRANCH"
  info "commit : $COMMIT"
  if git ls-remote origin HEAD &>/dev/null 2>&1; then
    ok "git bisa konek ke remote"
  else
    err "git TIDAK BISA konek ke remote — deploy.sh step [3/8] akan gagal!"
    info "Setup git credentials: ssh-keygen + tambahkan ke GitHub deploy keys"
  fi
else
  warn "git tidak ditemukan — deploy.sh tidak bisa git pull"
fi

# ── [I] Test koneksi DB ───────────────────────────────────────────────────────
sep; echo "  [I] Koneksi Database"
if [ -f "$APP_DIR/.env" ]; then
  DB_URL=$(grep "^DATABASE_URL=" "$APP_DIR/.env" 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"'"'" )
  if [ -n "$DB_URL" ]; then
    if command -v psql &>/dev/null; then
      if psql "$DB_URL" -c "SELECT 1" &>/dev/null 2>&1; then
        ok "Koneksi PostgreSQL berhasil"
      else
        err "Koneksi PostgreSQL GAGAL — cek DATABASE_URL di .env"
      fi
    else
      warn "psql tidak tersedia — tidak bisa test koneksi langsung"
      info "DB URL dimulai dengan: $(echo "$DB_URL" | cut -c1-30)..."
    fi
  else
    err "DATABASE_URL kosong di .env"
  fi
fi

# ── RINGKASAN ─────────────────────────────────────────────────────────────────
sep
echo "  RINGKASAN SOLUSI"
sep
echo ""
echo "  Urutan perbaikan jika 503:"
echo ""
echo "  1. Pastikan .env ada dan DATABASE_URL terisi"
echo "     cp .env.example .env && nano .env"
echo ""
echo "  2. Jika deploy.sh bisa git pull:"
echo "     bash deploy.sh"
echo ""
echo "  3. Jika git pull gagal, build manual:"
echo "     bash scripts/cpanel-install.sh"
echo "     NODE_ENV=production NEXT_BUILD=1 NEXT_TELEMETRY_DISABLED=1 \\"
echo "       RAYON_NUM_THREADS=1 TOKIO_WORKER_THREADS=1 UV_THREADPOOL_SIZE=1 \\"
echo "       NODE_OPTIONS='--max-old-space-size=512 --max-semi-space-size=32' \\"
echo "       ./node_modules/.bin/next build --webpack"
echo "     bash scripts/prepare-standalone.sh"
echo "     ./node_modules/.bin/prisma db seed"
echo ""
echo "  4. Setelah build: cPanel → Node.js App → Restart"
echo "     Startup file: app.js"
echo ""
echo "  5. Cek: curl -I https://mp.jobenapp.cloud/api/health"
sep
echo ""
