/**
 * Entry point untuk cPanel Node.js App (Phusion Passenger)
 *
 * Setup di cPanel:
 *   Application root        : /home/user/public_html/misipintar
 *   Application startup file: app.js
 *   Node.js version         : 20.x / 22.x
 *
 * Sebelum menjalankan ini, pastikan sudah menjalankan:
 *   ./deploy-cpanel.sh
 */

"use strict";

const path = require("path");
const fs = require("fs");

// Load .env dari root project
require("dotenv").config({ path: path.join(__dirname, ".env") });

// Standalone server path (Next.js output: standalone)
const standaloneServer = path.join(__dirname, ".next", "standalone", "server.js");

if (!fs.existsSync(standaloneServer)) {
  console.error("❌  Build belum tersedia. Jalankan dulu: ./deploy-cpanel.sh");
  console.error("   Path yang dicari:", standaloneServer);
  process.exit(1);
}

// Jalankan Next.js standalone server
require(standaloneServer);
