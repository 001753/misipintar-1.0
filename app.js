"use strict";

/**
 * app.js — Phusion Passenger entry point (cPanel Node.js Selector)
 *
 * cPanel Setup:
 *   Application root        : /home/user/public_html/misipintar/misipintar-1.0
 *   Application startup file: app.js
 *   Node.js version         : 20.x / 22.x
 *   Application mode        : Production
 *
 * This file:
 *   1. Enforces NODE_ENV=production immediately
 *   2. Fixes process.chdir() to project root so relative paths resolve correctly
 *   3. Loads .env from project root (for DATABASE_URL, NEXTAUTH_*, MIDTRANS_*, etc.)
 *   4. Captures uncaughtException / unhandledRejection for early crash logging
 *   5. Requires .next/standalone/server.js (patched by scripts/patch-standalone.js)
 *      which starts an http.createServer serving static assets + Next.js pages
 */

const path = require("path");
const fs   = require("fs");

// ── 1. Enforce production mode immediately — before any require ───────────────
process.env.NODE_ENV = "production";

// ── 2. Set CWD to project root ────────────────────────────────────────────────
// Passenger may start the process from a different directory.
process.chdir(__dirname);

// ── 3. Logger with rotation ───────────────────────────────────────────────────
const LOG_DIR  = path.join(__dirname, "logs");
const LOG_FILE = path.join(LOG_DIR, "app.log");
const MAX_BYTES = 512 * 1024; // rotate at 512 KB

function writeLog(level, message) {
  const line = `${new Date().toISOString()} [${level}] ${message}\n`;
  (level === "ERROR" ? process.stderr : process.stdout).write(line);
  try {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
    if (fs.existsSync(LOG_FILE) && fs.statSync(LOG_FILE).size > MAX_BYTES) {
      try { fs.renameSync(LOG_FILE, LOG_FILE + ".1"); } catch (_) {}
    }
    fs.appendFileSync(LOG_FILE, line, "utf-8");
  } catch (e) {
    process.stderr.write(`[LOG-WRITE-FAIL] ${e.message}\n`);
  }
}

// ── 4. Early crash capture ────────────────────────────────────────────────────
process.on("uncaughtException", (err) => {
  writeLog("ERROR", `Uncaught exception: ${err.stack || err.message}`);
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  writeLog("ERROR", `Unhandled rejection: ${
    reason instanceof Error ? reason.stack : String(reason)
  }`);
  process.exit(1);
});

// ── 5. Load .env from project root ───────────────────────────────────────────
// DATABASE_URL, NEXTAUTH_*, MIDTRANS_*, SMTP_*, FONNTE_TOKEN, etc.
require("dotenv").config({ path: path.join(__dirname, ".env") });

writeLog("INFO",
  `Starting — NODE_ENV=${process.env.NODE_ENV}  Node=${process.version}  PID=${process.pid}`
);

// ── 6. Require patched standalone server ──────────────────────────────────────
// .next/standalone/server.js is patched by scripts/patch-standalone.js during
// `npm run build`. It serves /_next/static/ and public/ via fs streams and
// delegates all other requests to Next.js getRequestHandler().
const standaloneServer = path.join(__dirname, ".next", "standalone", "server.js");

if (!fs.existsSync(standaloneServer)) {
  writeLog("ERROR", "Build output not found. Run: npm run build");
  writeLog("ERROR", `Expected: ${standaloneServer}`);
  process.exit(1);
}

try {
  require(standaloneServer);
  writeLog("INFO", "standalone/server.js loaded — Next.js server starting on PORT=" + (process.env.PORT || 3000));
} catch (err) {
  writeLog("ERROR", `Failed to load standalone server:\n${err.stack || err.message}`);
  process.exit(1);
}
