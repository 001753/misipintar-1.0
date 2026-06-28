#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# prepare-standalone.sh — Siapkan .next/standalone/ untuk deploy ke cPanel
#
# Next.js standalone output TIDAK menyertakan:
#   - .next/static/   → file JS/CSS yang diminta browser (_next/static/...)
#   - public/         → asset publik (gambar, favicon, manifest, dll)
#   - app.js          → entry point Phusion Passenger (load .env + error handling)
#
# Tanpa ketiga ini, JS/CSS 404 dan app tidak bisa start di cPanel.
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

# ── 3. Generate app.js di dalam standalone/ ───────────────────────────────────
# Phusion Passenger (cPanel) perlu entry point yang:
#   - Load .env sebelum apapun
#   - Capture uncaughtException agar app tidak diam-diam crash
#   - Load server.js (Next.js generated) yang ada di folder yang sama
echo "   → Generate app.js ..."
cat > "$STANDALONE/app.js" << 'APPJS'
"use strict";

/**
 * Entry point untuk cPanel Node.js App (Phusion Passenger)
 *
 * Setup di cPanel:
 *   Application root        : /home/user/public_html/misipintar
 *   Application startup file: app.js
 *   Node.js version         : 20.x / 22.x
 */

const path = require("path");
const fs   = require("fs");

// ── Logger dengan rotation ─────────────────────────────────────────────────
const LOG_DIR  = path.join(__dirname, "logs");
const LOG_FILE = path.join(LOG_DIR, "app.log");
const LOG_OLD  = path.join(LOG_DIR, "app.log.1");
const MAX_BYTES = 512 * 1024;

function writeLog(level, message) {
  const line = `${new Date().toISOString()} [${level}] ${message}\n`;
  (level === "ERROR" ? process.stderr : process.stdout).write(line);
  try {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
    if (fs.existsSync(LOG_FILE) && fs.statSync(LOG_FILE).size > MAX_BYTES) {
      if (fs.existsSync(LOG_OLD)) {
        try { fs.renameSync(LOG_OLD, path.join(LOG_DIR, "app.log.2")); } catch (_) {}
      }
      fs.renameSync(LOG_FILE, LOG_OLD);
    }
    fs.appendFileSync(LOG_FILE, line, "utf-8");
  } catch (e) {
    process.stderr.write(`[LOG-WRITE-FAIL] ${e.message}\n`);
  }
}

// ── Error capture dini ─────────────────────────────────────────────────────
process.on("uncaughtException", (err) => {
  writeLog("ERROR", `Uncaught exception: ${err.stack || err.message}`);
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  writeLog("ERROR", `Unhandled rejection: ${reason instanceof Error ? reason.stack : String(reason)}`);
  process.exit(1);
});

// ── Load .env ──────────────────────────────────────────────────────────────
require("dotenv").config({ path: path.join(__dirname, ".env") });

writeLog("INFO", `Starting — NODE_ENV=${process.env.NODE_ENV || "production"}  Node=${process.version}  PID=${process.pid}`);

// ── Load Next.js standalone server ────────────────────────────────────────
// server.js ada di folder yang SAMA dengan app.js (keduanya di dalam standalone/)
const standaloneServer = path.join(__dirname, "server.js");

if (!fs.existsSync(standaloneServer)) {
  writeLog("ERROR", "server.js tidak ditemukan. Build ulang dengan: npm run build:cpanel");
  writeLog("ERROR", `Path: ${standaloneServer}`);
  process.exit(1);
}

try {
  require(standaloneServer);
  writeLog("INFO", "server.js loaded — Next.js server starting");
} catch (err) {
  writeLog("ERROR", `Gagal load server.js:\n${err.stack || err.message}`);
  process.exit(1);
}
APPJS
echo "   ✓ app.js berhasil di-generate"

# ── 4. Tulis commit hash untuk verifikasi sinkronisasi di deploy.sh ──────────
# deploy.sh membaca file ini untuk mendeteksi kalau ada commit yang belum di-build.
COMMIT_HASH=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
echo "$COMMIT_HASH" > "$STANDALONE/.build_commit"
echo "   ✓ .build_commit: ${COMMIT_HASH:0:12} (dipakai deploy.sh untuk cek sinkronisasi)"

# ── Ringkasan ukuran ──────────────────────────────────────────────────────────
echo ""
echo "✅ Standalone siap di: .next/standalone/"
echo ""
du -sh "$STANDALONE" 2>/dev/null && echo ""

echo "─────────────────────────────────────────────────────────"
echo "📤 UPLOAD KE cPANEL:"
echo ""
echo "   Upload SELURUH isi .next/standalone/ ke:"
echo "   ~/public_html/misipintar/misipintar-1.0/"
echo ""
echo "   Struktur yang harus ada di server:"
echo "   public_html/misipintar/misipintar-1.0/"
echo "   ├── app.js             ← startup file (WAJIB — entry point Passenger)"
echo "   ├── server.js          ← Next.js generated server"
echo "   ├── package.json"
echo "   ├── node_modules/      ← sudah di-copy oleh standalone"
echo "   ├── .next/"
echo "   │   ├── server/        ← server-side code"
echo "   │   └── static/        ← JS/CSS (WAJIB ada)"
echo "   └── public/            ← asset publik (WAJIB ada)"
echo ""
echo "   cPanel Node.js App settings:"
echo "   Node.js version         : 22.x"
echo "   Application mode        : Production"
echo "   Application root        : public_html/misipintar/misipintar-1.0"
echo "   Application startup file: app.js"
echo ""
echo "   Jangan lupa upload/buat file .env di:"
echo "   ~/public_html/misipintar/misipintar-1.0/.env"
echo "─────────────────────────────────────────────────────────"
