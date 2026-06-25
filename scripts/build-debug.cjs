/**
 * build-debug.cjs — Next.js build worker native addon logger
 *
 * Preload ini mencegat SETIAP .node native addon yang di-load oleh
 * proses Node.js (termasuk child worker yang di-fork saat build).
 * Gunakan untuk mengetahui addon mana yang menyebabkan crash SIGSEGV/SIGABRT.
 *
 * Cara pakai:
 *   npm run build:debug
 *
 * Output: .build-debug.log di root project
 *   - [PID:N] LOAD  <path> → addon sedang di-load
 *   - [PID:N] DONE  <path> → berhasil
 *   - [PID:N] FAIL  <path> → gagal (error JS)
 *   - [PID:N] exit  code=N → proses exit normal
 *   - Tidak ada DONE setelah LOAD = addon itu yang crash
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const Module = require('module');

const LOG  = path.join(process.cwd(), '.build-debug.log');
const PID  = process.pid;
const T0   = Date.now();

function w(msg) {
  const elapsed = String(Date.now() - T0).padStart(6);
  const line = `[+${elapsed}ms][PID:${PID}] ${msg}\n`;
  process.stderr.write(line);
  try { fs.appendFileSync(LOG, line); } catch (_) {}
}

w(`boot  node=${process.version} NEXT_BUILD=${process.env.NEXT_BUILD || '(unset)'} PPID=${process.ppid}`);

// ── intercept every native .node load ──────────────────────────────────────
const origNode = Module._extensions['.node'];
Module._extensions['.node'] = function (mod, filename) {
  w(`LOAD  ${filename}`);
  try {
    const r = origNode(mod, filename);
    w(`DONE  ${filename}`);
    return r;
  } catch (err) {
    w(`FAIL  ${filename} → ${err.message}`);
    throw err;
  }
};

// ── lifecycle hooks ─────────────────────────────────────────────────────────
process.on('exit',              (code) => w(`exit  code=${code}`));
process.on('uncaughtException', (err)  => w(`UNCAUGHT ${err.stack || err.message}`));
process.on('unhandledRejection',(r)    => w(`UNHANDLED_REJECTION ${r}`));
