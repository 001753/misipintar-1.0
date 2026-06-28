'use strict';
/**
 * scripts/seed-admin.js
 * ---------------------
 * Masukkan akun SUPER_ADMIN pertama kali ke database.
 * Kalau email sudah ada → SKIP (tidak ubah data yang ada).
 *
 * Jalankan di server manapun yang punya DATABASE_URL:
 *   node scripts/seed-admin.js
 */

require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');

const EMAIL    = 'admin@misi-pintar.id';
const PASSWORD = 'Admin@MisiPintar2026!';
const NAME     = 'Super Admin';
const ROLE     = 'SUPER_ADMIN';

async function main() {
  const prisma = new PrismaClient();

  try {
    // ── Cek apakah admin sudah ada ──────────────────────────────────────────
    const existing = await prisma.user.findUnique({ where: { email: EMAIL } });

    if (existing) {
      console.log('⏭   Admin sudah ada — skip (tidak ada perubahan).');
      console.log('    ID   :', existing.id);
      console.log('    Email:', existing.email);
      console.log('    Role :', existing.role);
      return;
    }

    // ── Baru create kalau belum ada ─────────────────────────────────────────
    const passwordHash = await bcrypt.hash(PASSWORD, 12);

    const user = await prisma.user.create({
      data: {
        id:    randomUUID(),
        email: EMAIL,
        passwordHash,
        name:  NAME,
        role:  ROLE,
      },
    });

    console.log('✅  Admin berhasil dibuat:');
    console.log('    ID   :', user.id);
    console.log('    Email:', user.email);
    console.log('    Role :', user.role);
    console.log('    Name :', user.name);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('❌  seed-admin gagal:', err.message);
  process.exit(1);
});
