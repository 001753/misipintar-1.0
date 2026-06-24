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

// Load .env from misi-pintar directory (primary)
const mpEnv = path.join(__dirname, "misi-pintar", ".env");
if (fs.existsSync(mpEnv)) {
  require("dotenv").config({ path: mpEnv });
} else {
  // Fallback: load from project root
  require("dotenv").config({ path: path.join(__dirname, ".env") });
}

// cPanel Passenger compatibility:
// Next.js standalone server.js defaults to hostname="localhost" port=3000.
// Passenger communicates via a Unix socket or assigns a random PORT.
// Setting HOSTNAME=0.0.0.0 ensures the server binds on all interfaces.
if (!process.env.HOSTNAME) {
  process.env.HOSTNAME = "0.0.0.0";
}
if (!process.env.PORT) {
  process.env.PORT = "3000";
}

const standaloneServer = path.join(__dirname, "misi-pintar", ".next", "standalone", "server.js");

if (!fs.existsSync(standaloneServer)) {
  console.error("❌  Build not found. Run first:");
  console.error("    cd ~/public_html/misipintar");
  console.error("    bash misi-pintar/deploy-cpanel.sh");
  console.error("");
  console.error("   Expected at:", standaloneServer);
  process.exit(1);
}

require(standaloneServer);
