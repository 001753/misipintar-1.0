/**
 * [9.4] Cleanup LoginAttempt lama (> 30 hari)
 *
 * Strategi:
 * - Jika Redis tersedia: BullMQ worker via cron (require lazy)
 * - Jika tidak ada Redis: cron endpoint /api/cron/cleanup-login-attempts
 *
 * bullmq dan Queue/Worker di-require() secara lazy di dalam fungsi — BUKAN
 * static import di atas — karena static import menyebabkan @msgpackr-extract
 * native addon termuat saat build worker → SIGABRT di cPanel.
 */

import { prisma } from "@/lib/prisma";
import { acquireDbLock, releaseDbLock } from "@/lib/db-lock";
import { getBullConnection } from "@/lib/redis-bull";

/** Logika cleanup — bisa dipanggil langsung (tanpa Redis/BullMQ) */
export async function runCleanupLoginAttempts(): Promise<{ deleted: number; cutoff: string }> {
  const locked = await acquireDbLock("cron:cleanup-login-attempts", 300);
  if (!locked) {
    console.log("[Cron] cleanup-login-attempts — lock held, skipped");
    return { deleted: 0, cutoff: "" };
  }

  try {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const result = await prisma.loginAttempt.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    console.log(`[Cron] cleanup-login-attempts: deleted=${result.count}`);
    return { deleted: result.count, cutoff: cutoff.toISOString() };
  } finally {
    await releaseDbLock("cron:cleanup-login-attempts");
  }
}

/** BullMQ worker — hanya aktif jika Redis tersedia */
export function startCleanupLoginAttemptsWorker() {
  const connection = getBullConnection();
  if (!connection) {
    console.error("[Cron] REDIS_URL tidak tersedia — cleanup LoginAttempt dilewati (gunakan /api/cron/cleanup-login-attempts)");
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Queue, Worker } = require("bullmq") as typeof import("bullmq");

    const QUEUE_NAME = "cron:cleanup-login-attempts";
    const queue = new Queue(QUEUE_NAME, { connection });

    queue
      .add(
        "cleanup",
        {},
        {
          repeat: { pattern: "0 19 * * *" }, // 02:00 WIB
          jobId: "cleanup-login-attempts-daily",
          removeOnComplete: { count: 3 },
          removeOnFail: { count: 5 },
        }
      )
      .catch((err: unknown) =>
        console.error("[Cron] Gagal mendaftarkan recurring job:", err)
      );

    const worker = new Worker(
      QUEUE_NAME,
      async () => runCleanupLoginAttempts(),
      { connection, concurrency: 1 }
    );

    worker.on("completed", (_job: unknown, result: { deleted?: number; skipped?: boolean }) => {
      if (result?.skipped) return;
      console.log(`[Cron] cleanup-login-attempts selesai: deleted=${result?.deleted ?? 0}`);
    });

    worker.on("failed", (_job: unknown, err: Error) => {
      console.error("[Cron] cleanup-login-attempts GAGAL:", err?.message);
    });

    return worker;
  } catch {
    return null;
  }
}
