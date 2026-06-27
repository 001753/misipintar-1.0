/**
 * [4.6] Subscription Expiry Worker — PRD v4.1
 *
 * Cron setiap jam: cari Subscription dengan currentPeriodEnd < now()
 * dan status bukan EXPIRED/CANCELLED → update ke EXPIRED
 *
 * Menggunakan DB-based distributed lock (pengganti Redis mutex).
 * Tanpa Redis: dipanggil via /api/cron/expire-subscriptions
 * Dengan Redis: BullMQ worker jalan otomatis (backward compatible)
 */

import { prisma } from "@/lib/prisma";
import { acquireDbLock, releaseDbLock } from "@/lib/db-lock";
import { getBullConnection } from "@/lib/redis-bull";

const LOCK_TTL_SECONDS = 300;
const BATCH_SIZE = 200;

export async function runExpireSubscriptions(): Promise<{
  checked: number;
  expired: number;
  errors: number;
}> {
  const locked = await acquireDbLock("cron:expire-subs", LOCK_TTL_SECONDS);
  if (!locked) {
    console.log("[SubExpiry] Skipped — lock held by another instance");
    return { checked: 0, expired: 0, errors: 0 };
  }

  let cursor = 0;
  let checked = 0;
  let expired = 0;
  let errors = 0;
  const now = new Date();

  try {
    while (true) {
      const subscriptions = await prisma.subscription.findMany({
        where: {
          currentPeriodEnd: { lt: now },
          status: {
            notIn: ["EXPIRED", "CANCELLED", "FREE"],
          },
        },
        include: {
          familySpace: {
            select: {
              id: true,
              name: true,
              ownerId: true,
            },
          },
          plan: { select: { name: true } },
        },
        skip: cursor,
        take: BATCH_SIZE,
        orderBy: { currentPeriodEnd: "asc" },
      });

      if (subscriptions.length === 0) break;

      for (const sub of subscriptions) {
        try {
          await prisma.$transaction(async (tx) => {
            await tx.subscription.update({
              where: { id: sub.id },
              data: { status: "EXPIRED" },
            });

            await tx.notification.create({
              data: {
                familySpaceId: sub.familySpace.id,
                userId: sub.familySpace.ownerId,
                title: "Langganan Berakhir",
                body: `Langganan ${sub.plan.name} keluarga ${sub.familySpace.name} telah berakhir. Perpanjang sekarang untuk tetap menikmati fitur premium.`,
                type: "subscription_expired",
              },
            });
          });

          expired++;
          console.log(
            `[SubExpiry] Expired: sub=${sub.id} family=${sub.familySpace.name} plan=${sub.plan.name} end=${sub.currentPeriodEnd.toISOString()}`
          );
        } catch (err) {
          errors++;
          console.error(`[SubExpiry] Failed to expire sub=${sub.id}:`, err);
        }

        checked++;
      }

      cursor += BATCH_SIZE;
      if (subscriptions.length < BATCH_SIZE) break;
    }

    const cancelledCount = await expireCancelledSubscriptions(now);

    console.log(
      `[SubExpiry] Done — checked=${checked}, expired=${expired}, cancelled=${cancelledCount}, errors=${errors}`
    );
  } finally {
    await releaseDbLock("cron:expire-subs");
  }

  return { checked, expired, errors };
}

async function expireCancelledSubscriptions(now: Date): Promise<number> {
  const toCancel = await prisma.subscription.findMany({
    where: {
      cancelAtPeriodEnd: true,
      currentPeriodEnd: { lt: now },
      status: { notIn: ["CANCELLED", "EXPIRED", "FREE"] },
    },
    include: {
      familySpace: { select: { id: true, name: true, ownerId: true } },
      plan: { select: { name: true } },
    },
    take: BATCH_SIZE,
  });

  let cancelled = 0;
  for (const sub of toCancel) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.subscription.update({
          where: { id: sub.id },
          data: { status: "CANCELLED", cancelAtPeriodEnd: false },
        });

        await tx.notification.create({
          data: {
            familySpaceId: sub.familySpace.id,
            userId: sub.familySpace.ownerId,
            title: "Langganan Dibatalkan",
            body: `Langganan ${sub.plan.name} keluarga ${sub.familySpace.name} telah dibatalkan sesuai permintaan.`,
            type: "subscription_cancelled",
          },
        });
      });
      cancelled++;
    } catch (err) {
      console.error(`[SubExpiry] Failed to cancel sub=${sub.id}:`, err);
    }
  }

  return cancelled;
}

// ─────────────────────────────────────────────────────────
// Legacy BullMQ worker (hanya aktif jika Redis tersedia)
// ─────────────────────────────────────────────────────────
export function startSubscriptionWorker() {
  const connection = getBullConnection();
  if (!connection) {
    console.warn(
      "[SubExpiry] Redis not available — using cron endpoint instead (/api/cron/expire-subscriptions)"
    );
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Worker } = require("bullmq") as typeof import("bullmq");
    const worker = new Worker(
      "subscriptions",
      async (job: import("bullmq").Job) => {
        console.log(`[SubExpiry] Job ${job.id} started`);
        return runExpireSubscriptions();
      },
      { connection }
    );

    worker.on("failed", (job, err) => {
      console.error(`[SubExpiry] Job ${job?.id} failed:`, err);
    });

    return worker;
  } catch {
    return null;
  }
}
