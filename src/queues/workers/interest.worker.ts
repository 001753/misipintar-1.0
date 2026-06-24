import { Worker, Job } from "bullmq";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { getBullConnection } from "@/lib/redis-bull";

const LOCK_KEY = "cron:mutex:interest";
const LOCK_TTL_SECONDS = 300; // 5 menit
const BATCH_SIZE = 500;

async function acquireLock(): Promise<boolean> {
  if (!redis) return false;
  const result = await redis.set(LOCK_KEY, "1", "EX", LOCK_TTL_SECONDS, "NX");
  return result === "OK";
}

async function releaseLock(): Promise<void> {
  if (!redis) return;
  await redis.del(LOCK_KEY);
}

async function runInterestEngine(): Promise<{
  processed: number;
  credited: number;
  totalInterest: number;
}> {
  const locked = await acquireLock();
  if (!locked) {
    console.log("[InterestWorker] Skipped — lock held by another instance");
    return { processed: 0, credited: 0, totalInterest: 0 };
  }

  let cursor = 0;
  let processed = 0;
  let credited = 0;
  let totalInterest = 0;

  try {
    // Ambil AppConfig untuk interestRate
    const appConfig = await prisma.appConfig.findUnique({ where: { id: "global-config" } });
    const configData = (appConfig?.data ?? {}) as Record<string, unknown>;
    const interestRate = typeof configData.interestRate === "number" ? configData.interestRate : 2; // default 2%

    while (true) {
      const children = await prisma.child.findMany({
        where: {
          deletedAt: null,
          savingsBalance: { gt: 0 },
          familySpace: {
            subscription: {
              // Hanya proses bunga untuk langganan yang masih aktif
              status: { in: ["TRIAL", "PRO", "EDUCATOR", "SCHOOL"] },
              plan: {
                // hasInterest is stored in plan.limits JSON
                NOT: { limits: {} },
              },
            },
          },
        },
        include: {
          familySpace: {
            include: {
              subscription: { include: { plan: true } },
            },
          },
        },
        skip: cursor,
        take: BATCH_SIZE,
        orderBy: { createdAt: "asc" },
      });

      if (children.length === 0) break;

      for (const child of children) {
        const limits = child.familySpace.subscription?.plan?.limits as Record<string, unknown> | null;
        if (!limits?.hasInterest) {
          processed++;
          continue;
        }

        const rate = typeof limits.interestRate === "number" ? limits.interestRate : interestRate;
        const interest = Math.floor(child.savingsBalance * (rate / 100));
        if (interest <= 0) {
          processed++;
          continue;
        }

        try {
          await prisma.$transaction(async (tx) => {
            const before = await tx.child.findUniqueOrThrow({
              where: { id: child.id },
              select: { savingsBalance: true },
            });

            const updated = await tx.child.update({
              where: { id: child.id },
              data: { savingsBalance: { increment: interest } },
              select: { savingsBalance: true },
            });

            await tx.transactionLedger.create({
              data: {
                familySpaceId: child.familySpaceId,
                childId: child.id,
                type: "INTEREST",
                amount: interest,
                balanceBefore: before.savingsBalance,
                balanceAfter: updated.savingsBalance,
                description: `Bunga tabungan ${rate}% harian`,
              },
            });
          });

          credited++;
          totalInterest += interest;
        } catch (err) {
          console.error(`[InterestWorker] Failed for child ${child.id}:`, err);
        }

        processed++;
      }

      cursor += BATCH_SIZE;
      if (children.length < BATCH_SIZE) break;
    }

    // Log summary (AdminAuditLog requires adminId — cron has no actor, use console only)
    console.log(
      `[InterestWorker] Done — processed=${processed}, credited=${credited}, totalInterest=${totalInterest}`
    );
  } finally {
    await releaseLock();
  }

  return { processed, credited, totalInterest };
}

// ─────────────────────────────────────────────────────────
// [3.3] Tax Engine (PRO+ hasTax = true)
// ─────────────────────────────────────────────────────────
const TAX_LOCK_KEY = "cron:mutex:tax";

async function runTaxEngine(): Promise<{
  processed: number;
  taxed: number;
  totalTax: number;
}> {
  if (!redis) return { processed: 0, taxed: 0, totalTax: 0 };

  const taxLocked = await (async () => {
    const r = await redis!.set(TAX_LOCK_KEY, "1", "EX", LOCK_TTL_SECONDS, "NX");
    return r === "OK";
  })();
  if (!taxLocked) {
    console.log("[TaxWorker] Skipped — lock held by another instance");
    return { processed: 0, taxed: 0, totalTax: 0 };
  }

  let cursor = 0;
  let processed = 0;
  let taxed = 0;
  let totalTax = 0;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth(), 1);

  try {
    while (true) {
      const children = await prisma.child.findMany({
        where: {
          deletedAt: null,
          familySpace: {
            subscription: {
              // Hanya kenakan pajak untuk langganan yang masih aktif
              status: { in: ["TRIAL", "PRO", "EDUCATOR", "SCHOOL"] },
              plan: { NOT: { limits: {} } },
            },
          },
        },
        include: {
          familySpace: {
            include: { subscription: { include: { plan: true } } },
          },
        },
        skip: cursor,
        take: BATCH_SIZE,
        orderBy: { createdAt: "asc" },
      });

      if (children.length === 0) break;

      for (const child of children) {
        const limits = child.familySpace.subscription?.plan?.limits as Record<string, unknown> | null;
        if (!limits?.hasTax) {
          processed++;
          continue;
        }

        const taxRate = typeof limits.taxRate === "number" ? limits.taxRate : 5;

        // Hitung total reward bulan lalu
        const lastMonthRewards = await prisma.transactionLedger.aggregate({
          where: {
            childId: child.id,
            type: "TASK_REWARD",
            createdAt: { gte: monthStart, lt: monthEnd },
          },
          _sum: { amount: true },
        });

        const rewardTotal = lastMonthRewards._sum.amount ?? 0;
        const taxAmount = Math.floor(rewardTotal * (taxRate / 100));
        if (taxAmount <= 0) {
          processed++;
          continue;
        }

        try {
          await prisma.$transaction(async (tx) => {
            const current = await tx.child.findUniqueOrThrow({
              where: { id: child.id },
              select: { balance: true },
            });

            if (current.balance < taxAmount) return; // skip jika saldo tidak cukup

            const updated = await tx.child.update({
              where: { id: child.id },
              data: { balance: { decrement: taxAmount } },
              select: { balance: true },
            });

            await tx.transactionLedger.create({
              data: {
                familySpaceId: child.familySpaceId,
                childId: child.id,
                type: "TAX",
                amount: -taxAmount,
                balanceBefore: current.balance,
                balanceAfter: updated.balance,
                description: `Pajak virtual ${taxRate}% dari reward bulan ${monthStart.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}`,
                refId: `tax-${monthStart.toISOString().substring(0, 7)}`,
              },
            });
          });

          taxed++;
          totalTax += taxAmount;
        } catch (err) {
          console.error(`[TaxWorker] Failed for child ${child.id}:`, err);
        }

        processed++;
      }

      cursor += BATCH_SIZE;
      if (children.length < BATCH_SIZE) break;
    }

    console.log(`[TaxWorker] Done — processed=${processed}, taxed=${taxed}, totalTax=${totalTax}`);
  } finally {
    if (redis) await redis.del(TAX_LOCK_KEY);
  }

  return { processed, taxed, totalTax };
}

// ─────────────────────────────────────────────────────────
// Worker registrations
// ─────────────────────────────────────────────────────────
export function startInterestWorker() {
  const connection = getBullConnection();
  if (!redis || !connection) {
    console.warn("[InterestWorker] Redis not available — interest cron disabled");
    return null;
  }

  const worker = new Worker(
    "interest",
    async (job: Job) => {
      console.log(`[InterestWorker] Job ${job.id} started`);
      if (job.data?.type === "TAX") {
        return runTaxEngine();
      }
      return runInterestEngine();
    },
    { connection }
  );

  worker.on("failed", (job, err) => {
    console.error(`[InterestWorker] Job ${job?.id} failed:`, err);
  });

  return worker;
}

export { runInterestEngine, runTaxEngine };
