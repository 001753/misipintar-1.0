/**
 * fix-doku-migration.js
 *
 * Script satu-kali untuk memperbaiki migration 20260723000000_add_doku_payment_provider
 * yang gagal karena PostgreSQL error 25001:
 *   ALTER TYPE ... ADD VALUE tidak bisa dijalankan di dalam transaction block.
 *   Prisma membungkus migration dalam BEGIN/COMMIT sehingga selalu gagal.
 *
 * Script ini:
 *   1. Menambahkan enum values MANDIRI_VA dan EWALLET TANPA transaction
 *   2. Menambahkan kolom Invoice dan index yang diperlukan DOKU (idempotent)
 *   3. Menandai migration gagal sebagai applied di _prisma_migrations
 *
 * Cara pakai (dari direktori root aplikasi):
 *   node scripts/fix-doku-migration.js
 *
 * Setelah selesai, jalankan:
 *   ./node_modules/.bin/prisma migrate deploy
 * (akan apply migration 20260723100000_add_doku_invoice_columns)
 */

"use strict";

const path = require("path");
const fs   = require("fs");
const crypto = require("crypto");

// Load .env dari root project
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const { Client } = require("pg");

const MIGRATION_NAME = "20260723000000_add_doku_payment_provider";

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("❌ DATABASE_URL tidak ditemukan di .env");
    process.exit(1);
  }

  console.log("═══════════════════════════════════════════════════════");
  console.log("  Fix Migrasi DOKU — 20260723000000");
  console.log("═══════════════════════════════════════════════════════\n");

  const client = new Client({ connectionString: dbUrl });
  await client.connect();
  console.log("  ✓ Terkoneksi ke database\n");

  try {
    // ── 1. ALTER TYPE di luar transaction ─────────────────────────────────────
    // WAJIB: PostgreSQL tidak izinkan ADD VALUE dalam transaction block.
    // Menggunakan client.query() tanpa BEGIN = berjalan di luar transaction.
    console.log("▶ [1/3] Menambahkan enum values PayMethod ...");
    await client.query(
      `ALTER TYPE "PayMethod" ADD VALUE IF NOT EXISTS 'MANDIRI_VA'`
    );
    await client.query(
      `ALTER TYPE "PayMethod" ADD VALUE IF NOT EXISTS 'EWALLET'`
    );
    console.log("    ✓ MANDIRI_VA dan EWALLET tersedia\n");

    // ── 2. Kolom dan index Invoice (dalam transaction, aman) ──────────────────
    console.log("▶ [2/3] Menambahkan kolom dan index Invoice ...");
    await client.query("BEGIN");
    try {
      await client.query(`
        ALTER TABLE "Invoice"
          ADD COLUMN IF NOT EXISTS "billingCycle"             TEXT,
          ADD COLUMN IF NOT EXISTS "paymentProvider"          TEXT NOT NULL DEFAULT 'MIDTRANS',
          ADD COLUMN IF NOT EXISTS "providerInvoiceNumber"    TEXT,
          ADD COLUMN IF NOT EXISTS "providerRequestId"        TEXT,
          ADD COLUMN IF NOT EXISTS "providerTransactionId"    TEXT,
          ADD COLUMN IF NOT EXISTS "paymentUrl"               TEXT
      `);
      await client.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_providerInvoiceNumber_key"
          ON "Invoice"("providerInvoiceNumber")
      `);
      await client.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_providerRequestId_key"
          ON "Invoice"("providerRequestId")
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS "Invoice_paymentProvider_status_idx"
          ON "Invoice"("paymentProvider", "status")
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS "Invoice_providerTransactionId_idx"
          ON "Invoice"("providerTransactionId")
      `);
      await client.query("COMMIT");
      console.log("    ✓ Kolom dan index berhasil ditambahkan\n");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    }

    // ── 3. Tandai migration sebagai applied di _prisma_migrations ─────────────
    console.log("▶ [3/3] Menandai migration sebagai applied ...");
    const now = new Date();

    // Cek apakah record migration sudah ada
    const { rows } = await client.query(
      `SELECT id, finished_at, rolled_back_at
         FROM "_prisma_migrations"
        WHERE migration_name = $1`,
      [MIGRATION_NAME]
    );

    if (rows.length > 0) {
      // Record ada (migration pernah gagal) → clear failed state
      await client.query(`
        UPDATE "_prisma_migrations"
           SET finished_at        = $1,
               rolled_back_at     = NULL,
               applied_steps_count = 1,
               logs               = NULL
         WHERE migration_name     = $2
      `, [now, MIGRATION_NAME]);
      console.log("    ✓ Record migration diperbarui: failed → applied");
    } else {
      // Record tidak ada (fresh DB atau belum dicoba) → buat record baru
      // Prisma checksum = SHA-256 hex dari isi migration.sql
      const migrationSqlPath = path.join(
        __dirname, "..", "prisma", "migrations", MIGRATION_NAME, "migration.sql"
      );
      let checksum = "";
      if (fs.existsSync(migrationSqlPath)) {
        const content = fs.readFileSync(migrationSqlPath, "utf-8");
        checksum = crypto.createHash("sha256").update(content, "utf-8").digest("hex");
      }
      const id = crypto.randomUUID();
      await client.query(`
        INSERT INTO "_prisma_migrations"
          (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
        VALUES ($1, $2, $3, $4, NULL, NULL, $3, 1)
      `, [id, checksum, now, MIGRATION_NAME]);
      console.log("    ✓ Record migration dibuat (baselining)");
    }

    console.log("\n═══════════════════════════════════════════════════════");
    console.log("  ✅ Selesai! Langkah selanjutnya:");
    console.log("     Jalankan satu dari berikut:");
    console.log("     a) bash deploy.sh          (deploy ulang lengkap)");
    console.log("     b) ./node_modules/.bin/prisma migrate deploy");
    console.log("        (hanya apply migration 20260723100000)");
    console.log("═══════════════════════════════════════════════════════\n");

  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("\n❌ Error:", err.message);
    if (err.detail)   console.error("   Detail:", err.detail);
    if (err.hint)     console.error("   Hint:  ", err.hint);
    if (err.code)     console.error("   Code:  ", err.code);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
