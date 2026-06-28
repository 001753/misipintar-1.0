'use strict';
/**
 * scripts/seed-admin.js
 * ---------------------
 * Masukkan / update akun SUPER_ADMIN ke database.
 * Jalankan di server manapun yang punya DATABASE_URL:
 *
 *   node scripts/seed-admin.js
 *
 * Aman dijalankan berulang kali (upsert by email).
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
    const passwordHash = await bcrypt.hash(PASSWORD, 12);

    const user = await prisma.user.upsert({
      where:  { email: EMAIL },
      update: { passwordHash, name: NAME, role: ROLE },
      create: {
        id:           randomUUID(),
        email:        EMAIL,
        passwordHash,
        name:         NAME,
        role:         ROLE,
      },
    });

    console.log('✅  Admin seeded successfully:');
    console.log('    ID   :', user.id);
    console.log('    Email:', user.email);
    console.log('    Role :', user.role);
    console.log('    Name :', user.name);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('❌  seed-admin failed:', err.message);
  process.exit(1);
});
