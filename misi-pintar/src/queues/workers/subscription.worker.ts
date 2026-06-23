/**
 * [4.6] Subscription Expiry Worker — PRD v4.1
 *
 * Cron setiap jam: cari Subscription dengan currentPeriodEnd < now()
 * dan status bukan EXPIRED/CANCELLED → update ke EXPIRED
 * Gunakan Redis distributed lock: "cron:mutex:expire-subs"
 */

import { Worker, Job } from "bullmq";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { getBullConnection } from "@/lib/redis-bull";

const LOCK_KEY = "cron:mutex:expire-subs";
const LOCK_TTL_SECONDS = 300; // 5 menit
const BATCH_SIZE = 200;

async function acquireLock(): Promise<boolean> {
  if (!redis) return false;
  const result = await redis.set(LOCK_KEY, "1", "EX", LOCK_TTL_SECONDS, "NX");
  return result === "OK";
}

async function releaseLock(): Promise<void> {
  if (!redis) return;
  await redis.del(LOCK_KEY);
}

export async function runExpireSubscriptions(): Promise<{
  checked: number;
  expired: number;
  errors: number;
}> {
  const locked = await acquireLock();
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
      // Cari subscription yang melewati currentPeriodEnd tapi belum EXPIRED/CANCELLED
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
            // Update status ke EXPIRED
            await tx.subscription.update({
              where: { id: sub.id },
              data: { status: "EXPIRED" },
            });

            // Kirim notifikasi in-app ke parent
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

    // Juga handle cancelAtPeriodEnd yang sudah lewat — ubah ke CANCELLED
    const cancelledCount = await expireCancelledSubscriptions(now);

    console.log(
      `[SubExpiry] Done — checked=${checked}, expired=${expired}, cancelled=${cancelledCount}, errors=${errors}`
    );
  } finally {
    await releaseLock();
  }

  return { checked, expired, errors };
}

/**
 * Handle cancelAtPeriodEnd: jika sudah lewat periodEnd, ubah ke CANCELLED
 */
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

export function startSubscriptionWorker() {
  const connection = getBullConnection();
  if (!redis || !connection) {
    console.warn(
      "[SubExpiry] Redis not available — subscription expiry cron disabled"
    );
    return null;
  }

  const worker = new Worker(
    "subscriptions",
    async (job: Job) => {
      console.log(`[SubExpiry] Job ${job.id} started`);
      return runExpireSubscriptions();
    },
    { connection }
  );

  worker.on("failed", (job, err) => {
    console.error(`[SubExpiry] Job ${job?.id} failed:`, err);
  });

  return worker;
}
