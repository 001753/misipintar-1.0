"use strict";

/**
 * cPanel startup file — Phusion Passenger entry point
 *
 * cPanel setup:
 *   Application root        : /home/USER/public_html/misipintar
 *   Application startup file: app.js
 *   Node.js version         : 20.x / 22.x
 *
 * Run ./misi-pintar/deploy-cpanel.sh before starting for the first time.
 */

const path = require("path");
const fs   = require("fs");

// Load .env from project root
require("dotenv").config({ path: path.join(__dirname, ".env") });

// Also attempt to load from misi-pintar directory (fallback)
const mpEnv = path.join(__dirname, "misi-pintar", ".env");
if (fs.existsSync(mpEnv)) {
  require("dotenv").config({ path: mpEnv });
}

const standaloneServer = path.join(__dirname, "misi-pintar", ".next", "standalone", "server.js");

if (!fs.existsSync(standaloneServer)) {
  console.error("❌  Build not found. Run first: cd misi-pintar && ./deploy-cpanel.sh");
  console.error("   Expected at:", standaloneServer);
  process.exit(1);
}

require(standaloneServer);
