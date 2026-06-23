/**
 * Prisma Seed — Misi Pintar PRD v4.1
 * Jalankan: npx prisma db seed
 *
 * Yang dibuat:
 * - 4 Plan (STARTER, PRO, EDUCATOR, SCHOOL)
 * - AppConfig global (phaseMode: FULL_FREE)
 * - SuperAdmin user awal (email dari env SEED_ADMIN_EMAIL)
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PLANS = [
  {
    type: "STARTER" as const,
    name: "Starter",
    price: 0,
    yearlyPrice: 0,
    currency: "IDR",
    isActive: true,
    limits: {
      maxChildren: 2,
      maxTasksPerMonth: 10,
      hasInterest: false,
      hasTax: false,
    },
  },
  {
    type: "PRO" as const,
    name: "Pro",
    price: 29000,
    yearlyPrice: 290000,
    currency: "IDR",
    isActive: true,
    limits: {
      maxChildren: 5,
      maxTasksPerMonth: -1,
      hasInterest: true,
      interestRate: 2,
      hasTax: true,
      taxRate: 5,
    },
  },
  {
    type: "EDUCATOR" as const,
    name: "Educator",
    price: 99000,
    yearlyPrice: 990000,
    currency: "IDR",
    isActive: true,
    limits: {
      maxChildren: -1,
      maxTasksPerMonth: -1,
      maxFamilies: 30,
      hasInterest: true,
      interestRate: 2,
      hasTax: true,
      taxRate: 5,
    },
  },
  {
    type: "SCHOOL" as const,
    name: "School",
    price: 0,
    yearlyPrice: 0,
    currency: "IDR",
    isActive: true,
    limits: {
      maxChildren: -1,
      maxTasksPerMonth: -1,
      maxFamilies: -1,
      hasInterest: true,
      interestRate: 2,
      hasTax: true,
      taxRate: 5,
      sso: true,
    },
  },
];

const APP_CONFIG_DEFAULT = {
  phaseMode: "FULL_FREE" as const,
  data: {
    interestRate: 2,
    taxRate: 5,
    maxTrialDays: 14,
    maintenanceMode: false,
    featureFlags: {
      pushNotifications: false,
      pdfReports: true,
      interestEngine: true,
      taxEngine: true,
    },
  },
};

async function seedPlans() {
  console.log("Seeding plans...");
  const results: string[] = [];

  for (const plan of PLANS) {
    await prisma.plan.upsert({
      where: { type: plan.type },
      update: {
        name: plan.name,
        price: plan.price,
        yearlyPrice: plan.yearlyPrice,
        limits: plan.limits,
        isActive: plan.isActive,
      },
      create: plan,
    });
    results.push(`  ✓ ${plan.name} (${plan.type})`);
  }

  results.forEach((r) => console.log(r));
  console.log(`Plans seeded: ${results.length}`);
}

async function seedAppConfig() {
  console.log("Seeding AppConfig...");

  await prisma.appConfig.upsert({
    where: { id: "global-config" },
    update: {
      phaseMode: APP_CONFIG_DEFAULT.phaseMode,
      data: APP_CONFIG_DEFAULT.data,
    },
    create: {
      id: "global-config",
      phaseMode: APP_CONFIG_DEFAULT.phaseMode,
      data: APP_CONFIG_DEFAULT.data,
    },
  });

  console.log("  ✓ AppConfig (global-config) seeded");
}

async function seedSuperAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@misi-pintar.id";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "Admin@MisiPintar2026!";

  console.log(`Seeding SuperAdmin (${email})...`);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`  ✓ SuperAdmin sudah ada (${email}) — skip`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      email,
      name: "Super Admin",
      passwordHash,
      role: "SUPER_ADMIN",
    },
  });

  console.log(`  ✓ SuperAdmin created: ${email}`);
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.log(`  ⚠️  Default password digunakan — GANTI sebelum production!`);
    console.log(`     Password: ${password}`);
  }
}

async function main() {
  console.log("🌱 Misi Pintar — Prisma Seed\n");

  try {
    await seedPlans();
    await seedAppConfig();
    await seedSuperAdmin();

    console.log("\n✅ Seed selesai.");
  } catch (err) {
    console.error("❌ Seed gagal:", err);
    throw err;
  } finally {
    await prisma.$disconnect();
  }
}

main();
