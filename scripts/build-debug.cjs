/**
 * build-debug.cjs — Next.js build crash detector (dua lapis)
 *
 * LAPIS 1 — Native addon tracker (.node):
 *   Intercept setiap .node binary yang di-load.
 *   Jika ada LOAD tanpa DONE berikutnya → addon itu yang menyebabkan crash.
 *
 * LAPIS 2 — Page tracker ("Collecting page data"):
 *   Intercept setiap module yang di-require() oleh worker build.
 *   File .build-crash-page.txt akan berisi halaman TERAKHIR yang sedang
 *   diproses saat crash terjadi. Jika build selesai normal, file dihapus.
 *
 * Cara pakai:
 *   npm run build:debug
 *
 * Output:
 *   .build-debug.log     → log lengkap semua event (native + page)
 *   .build-crash-page.txt → halaman terakhir saat crash (dihapus jika OK)
 *
 * Format log:
 *   [+NNNms][PID:N] LOAD   <path> → native addon mulai di-load
 *   [+NNNms][PID:N] DONE   <path> → berhasil
 *   [+NNNms][PID:N] FAIL   <path> → gagal (error JS)
 *   [+NNNms][PID:N] PAGE   <route> → halaman mulai di-proses
 *   [+NNNms][PID:N] exit   code=N → proses exit normal
 *   Tidak ada DONE setelah LOAD = addon itu yang crash
 *   .build-crash-page.txt masih ada setelah build = halaman itu yang crash
 */
'use strict';

const fs     = require('fs');
const path   = require('path');
const Module = require('module');

const LOG        = path.join(process.cwd(), '.build-debug.log');
const CRASH_PAGE = path.join(process.cwd(), '.build-crash-page.txt');
const PID        = process.pid;
const T0         = Date.now();

// ── Logger ──────────────────────────────────────────────────────────────────
function w(msg) {
  const elapsed = String(Date.now() - T0).padStart(7);
  const line    = `[+${elapsed}ms][PID:${PID}] ${msg}\n`;
  process.stderr.write(line);
  try { fs.appendFileSync(LOG, line); } catch (_) {}
}

w(`boot  node=${process.version} NEXT_BUILD=${process.env.NEXT_BUILD || '(unset)'} PPID=${process.ppid}`);

// ── LAPIS 1: Intercept setiap native .node load ──────────────────────────────
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

// ── LAPIS 2: Intercept module load untuk page bundles ───────────────────────
// Next.js (webpack) menghasilkan bundle di .next/server/app/ dan .next/server/pages/
// Ketika "Collecting page data", worker me-require() bundle halaman satu per satu.
// Kita tulis nama halaman ke file checkpoint — jika crash, file ini tetap ada.

const PAGE_PATTERNS = [
  /[/\\]\.next[/\\]server[/\\]app[/\\](.+?)(\/page|\/route)\.js$/,
  /[/\\]\.next[/\\]server[/\\]pages[/\\](.+?)\.js$/,
  /[/\\]\.next[/\\]server[/\\]chunks[/\\]app[/\\](.+?)\.js$/,
];

function extractRoute(filename) {
  for (const pat of PAGE_PATTERNS) {
    const m = filename.match(pat);
    if (m) return m[1].replace(/\\/g, '/');
  }
  return null;
}

const origLoad = Module._load;
Module._load = function (request, parent, isMain) {
  const result = origLoad.apply(this, arguments);

  // Resolve absolute path jika memungkinkan (tanpa throw)
  try {
    const abs = require.resolve(request, { paths: parent ? [path.dirname(parent.filename || '')] : [] });
    const route = extractRoute(abs);
    if (route) {
      const label = `/${route}`;
      w(`PAGE  ${label}`);
      // Tulis checkpoint — dihapus saat exit normal (build sukses)
      try {
        fs.writeFileSync(
          CRASH_PAGE,
          `PID ${PID} | ${new Date().toISOString()}\nHalaman: ${label}\nFile: ${abs}\n`,
          'utf8'
        );
      } catch (_) {}
    }
  } catch (_) {
    // bukan file lokal — skip
  }

  return result;
};

// ── Heartbeat setiap 15 detik ────────────────────────────────────────────────
// Tulis tanda "masih hidup" ke log — gap besar = proses hang sebelum crash
let heartbeatN = 0;
const hbInterval = setInterval(() => {
  heartbeatN++;
  w(`heartbeat #${heartbeatN} uptime=${Math.round((Date.now() - T0) / 1000)}s`);
}, 15000);
hbInterval.unref(); // jangan tahan event loop

// ── Lifecycle hooks ──────────────────────────────────────────────────────────
process.on('exit', (code) => {
  clearInterval(hbInterval);
  w(`exit  code=${code}`);
  if (code === 0) {
    // Build sukses — hapus crash page checkpoint
    try { fs.unlinkSync(CRASH_PAGE); } catch (_) {}
    w('Build selesai normal — .build-crash-page.txt dihapus');
  } else {
    // Build gagal — baca crash page jika ada
    try {
      const lastPage = fs.readFileSync(CRASH_PAGE, 'utf8').trim();
      w(`CRASH TERDETEKSI — halaman terakhir diproses:\n${lastPage}`);
    } catch (_) {
      w('CRASH TERDETEKSI — tidak ada info halaman (crash di fase awal)');
    }
  }
});

process.on('uncaughtException', (err) => {
  w(`UNCAUGHT_EXCEPTION ${err.stack || err.message}`);
});

process.on('unhandledRejection', (r) => {
  w(`UNHANDLED_REJECTION ${r instanceof Error ? r.stack : String(r)}`);
});
