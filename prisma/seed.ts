/**
 * Prisma Seed — Misi Pintar PRD v4.1
 * Jalankan: npx prisma db seed
 *
 * Yang dibuat:
 * - 4 Plan (STARTER, PRO, EDUCATOR, SCHOOL)
 * - AppConfig global (phaseMode: FREEMIUM)
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
  phaseMode: "FREEMIUM" as const,
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

async function seedSampleData() {
  console.log("Seeding sample families...");

  const starterPlan = await prisma.plan.findUnique({ where: { type: "STARTER" } });
  const proPlan = await prisma.plan.findUnique({ where: { type: "PRO" } });
  if (!starterPlan || !proPlan) throw new Error("Plans belum ada — jalankan seedPlans() dulu");

  const families = [
    {
      parentEmail: "budi.santoso@demo.com",
      parentPassword: "Demo@Budi123",
      parentName: "Budi Santoso",
      spaceName: "Keluarga Santoso",
      spaceCode: "SANT01",
      plan: starterPlan,
      children: [
        { username: "andi_s", password: "Andi123!", name: "Andi Santoso", avatar: "👦", balance: 15000, savingsBalance: 5000 },
        { username: "rina_s", password: "Rina123!", name: "Rina Santoso", avatar: "👧", balance: 8000, savingsBalance: 2000 },
      ],
    },
    {
      parentEmail: "dewi.rahayu@demo.com",
      parentPassword: "Demo@Dewi123",
      parentName: "Dewi Rahayu",
      spaceName: "Keluarga Rahayu",
      spaceCode: "RAHU01",
      plan: proPlan,
      children: [
        { username: "bagas_r", password: "Bagas123!", name: "Bagas Rahayu", avatar: "🧒", balance: 32000, savingsBalance: 10000 },
        { username: "sari_r",  password: "Sari123!",  name: "Sari Rahayu",  avatar: "👧", balance: 21000, savingsBalance: 7000 },
        { username: "dika_r",  password: "Dika123!",  name: "Dika Rahayu",  avatar: "🦁", balance: 5000,  savingsBalance: 1000 },
      ],
    },
  ];

  for (const fam of families) {
    const existingParent = await prisma.user.findUnique({ where: { email: fam.parentEmail } });
    if (existingParent) {
      console.log(`  ↩ ${fam.parentEmail} sudah ada — skip`);
      continue;
    }

    const parentHash = await bcrypt.hash(fam.parentPassword, 12);

    await prisma.$transaction(async (tx) => {
      const parent = await tx.user.create({
        data: {
          email: fam.parentEmail,
          name: fam.parentName,
          passwordHash: parentHash,
          role: "PARENT",
        },
      });

      const space = await tx.familySpace.create({
        data: {
          name: fam.spaceName,
          spaceCode: fam.spaceCode,
          ownerId: parent.id,
          users: { connect: { id: parent.id } },
        },
      });

      await tx.user.update({
        where: { id: parent.id },
        data: { familySpaceId: space.id },
      });

      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      await tx.subscription.create({
        data: {
          familySpaceId: space.id,
          planId: fam.plan.id,
          status: fam.plan.type === "PRO" ? "PRO" : "FREE",
          currentPeriodEnd: periodEnd,
        },
      });

      for (const child of fam.children) {
        const childHash = await bcrypt.hash(child.password, 12);
        await tx.child.create({
          data: {
            username: child.username,
            name: child.name,
            passwordHash: childHash,
            avatar: child.avatar,
            familySpaceId: space.id,
            balance: child.balance,
            savingsBalance: child.savingsBalance,
          },
        });
      }
    });

    console.log(`  ✓ ${fam.spaceName} (${fam.parentEmail}) + ${fam.children.length} anak`);
  }

  console.log("Sample families seeded.");
}

async function main() {
  console.log("🌱 Misi Pintar — Prisma Seed\n");

  try {
    await seedPlans();
    await seedAppConfig();
    await seedSuperAdmin();
    await seedSampleData();

    console.log("\n✅ Seed selesai.");
  } catch (err) {
    console.error("❌ Seed gagal:", err);
    throw err;
  } finally {
    await prisma.$disconnect();
  }
}

main();
