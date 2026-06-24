/**
 * Entry point untuk cPanel Node.js App (Phusion Passenger)
 *
 * Setup di cPanel:
 *   Application root        : /home/user/public_html/misipintar
 *   Application startup file: app.js  (gunakan app.js — lebih lengkap)
 *   Node.js version         : 20.x / 22.x
 *
 * Sebelum menjalankan ini, pastikan sudah menjalankan:
 *   ./deploy-cpanel.sh
 *
 * NOTE: Gunakan app.js sebagai startup file — app.js memeriksa
 * keberadaan build sebelum menjalankan server.
 */

"use strict";

const path = require("path");

// Load .env dari root project
require("dotenv").config({ path: path.join(__dirname, ".env") });

// Jalankan Next.js standalone server
// Output standalone Next.js ada di .next/standalone/server.js (bukan subdirektori)
require("./.next/standalone/server.js");
