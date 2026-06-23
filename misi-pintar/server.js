/**
 * Entry point untuk cPanel Node.js App (Phusion Passenger)
 * 
 * Setup di cPanel:
 *   Application root       : /home/user/misi-pintar
 *   Application startup file: server.js
 *   Node.js version        : 20.x
 *
 * Sebelum menjalankan ini, pastikan sudah menjalankan:
 *   ./deploy-cpanel.sh
 */

const path = require("path");

// Load .env dari root project
require("dotenv").config({ path: path.join(__dirname, ".env") });

// Jalankan Next.js standalone server
require("./.next/standalone/misi-pintar/server.js");
