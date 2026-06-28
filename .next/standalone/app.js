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
