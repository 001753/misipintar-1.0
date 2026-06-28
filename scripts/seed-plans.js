'use strict';
/**
 * scripts/seed-plans.js
 * ---------------------
 * Seed Plans (STARTER, PRO, EDUCATOR, SCHOOL) + AppConfig ke database.
 * Aman dijalankan berulang kali — pakai upsert, data yang ada tidak ditimpa.
 *
 *   node scripts/seed-plans.js
 */

require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PLANS = [
  {
    type: 'STARTER',
    name: 'Starter',
    price: 0,
    yearlyPrice: 0,
    limits: { maxChildren: 2, maxTasksPerMonth: 10, hasInterest: false, hasTax: false },
  },
  {
    type: 'PRO',
    name: 'Pro',
    price: 29000,
    yearlyPrice: 290000,
    limits: { maxChildren: 5, maxTasksPerMonth: -1, hasInterest: true, interestRate: 2, hasTax: true, taxRate: 5 },
  },
  {
    type: 'EDUCATOR',
    name: 'Educator',
    price: 99000,
    yearlyPrice: 990000,
    limits: { maxChildren: -1, maxTasksPerMonth: -1, maxFamilies: 30, hasInterest: true, interestRate: 2, hasTax: true, taxRate: 5 },
  },
  {
    type: 'SCHOOL',
    name: 'School',
    price: 0,
    yearlyPrice: 0,
    limits: { maxChildren: -1, maxTasksPerMonth: -1, maxFamilies: -1, hasInterest: true, interestRate: 2, hasTax: true, taxRate: 5, sso: true },
  },
];

async function main() {
  let anyNew = false;

  for (const plan of PLANS) {
    const existing = await prisma.plan.findUnique({ where: { type: plan.type } });
    if (existing) {
      console.log(`⏭   Plan ${plan.type} sudah ada — skip.`);
    } else {
      await prisma.plan.create({
        data: { ...plan, currency: 'IDR', isActive: true },
      });
      console.log(`✅  Plan ${plan.type} berhasil dibuat.`);
      anyNew = true;
    }
  }

  // AppConfig — buat jika belum ada, jangan timpa phaseMode yang sudah diset admin
  const configExists = await prisma.appConfig.findUnique({ where: { id: 'global-config' } });
  if (configExists) {
    console.log(`⏭   AppConfig sudah ada (phaseMode: ${configExists.phaseMode}) — skip.`);
  } else {
    await prisma.appConfig.create({
      data: {
        id:        'global-config',
        phaseMode: 'FULL_FREE',
        data: {
          interestRate: 2, taxRate: 5, maxTrialDays: 14,
          maintenanceMode: false,
          featureFlags: { pushNotifications: false, pdfReports: true, interestEngine: true, taxEngine: true },
        },
      },
    });
    console.log('✅  AppConfig berhasil dibuat (phaseMode: FULL_FREE).');
    anyNew = true;
  }

  if (!anyNew) {
    console.log('ℹ️   Semua data sudah ada — tidak ada yang diubah.');
  }
}

main()
  .catch((err) => {
    console.error('❌  seed-plans gagal:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
