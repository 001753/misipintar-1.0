/**
 * [9.4] BullMQ Cron — Cleanup LoginAttempt lama (> 30 hari)
 * Berjalan setiap hari pukul 02:00 WIB (19:00 UTC).
 * Menggunakan distributed Redis lock agar tidak double-run di multi-instance.
 *
 * Catatan PRD: AdminAuditLog.adminId is NOT NULL — cron worker tidak bisa menulis
 * ke AdminAuditLog. Cron ini log ke console.error jika gagal (bukan aksi admin).
 */

import { Queue, Worker } from "bullmq";
import { prisma } from "@/lib/prisma";

const QUEUE_NAME = "cron:cleanup-login-attempts";
const MUTEX_KEY = "cron:mutex:cleanup-login-attempts";
const LOCK_TTL_MS = 5 * 60 * 1000; // 5 menit

// BullMQ membutuhkan connection string atau config object — bukan ioredis instance
// karena BullMQ v5 bundel ioredis sendiri (versi berbeda)
function getBullConnection() {
  const url = process.env.REDIS_URL;
  if (!url) return null;

  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port || "6379", 10),
      password: parsed.password || undefined,
      username: parsed.username || undefined,
      tls: parsed.protocol === "rediss:" ? {} : undefined,
    };
  } catch {
    return null;
  }
}

export function startCleanupLoginAttemptsWorker() {
  const connection = getBullConnection();
  if (!connection) {
    console.error("[Cron] REDIS_URL tidak tersedia — cleanup LoginAttempt dilewati");
    return null;
  }

  // Buat queue dengan recurring job harian
  const queue = new Queue(QUEUE_NAME, { connection });

  queue
    .add(
      "cleanup",
      {},
      {
        repeat: {
          pattern: "0 19 * * *", // 02:00 WIB setiap hari
        },
        jobId: "cleanup-login-attempts-daily",
        removeOnComplete: { count: 3 },
        removeOnFail: { count: 5 },
      }
    )
    .catch((err) =>
      console.error("[Cron] Gagal mendaftarkan recurring job:", err)
    );

  // Worker — proses job
  const worker = new Worker(
    QUEUE_NAME,
    async () => {
      // Distributed lock — hanya 1 instance yang boleh jalan
      // Gunakan ioredis dari @/lib/redis untuk lock (bukan BullMQ connection)
      const { redis } = await import("@/lib/redis");
      if (!redis) return { skipped: true, reason: "no_redis" };

      const lockAcquired = await redis.set(MUTEX_KEY, "1", "PX", LOCK_TTL_MS, "NX");
      if (!lockAcquired) {
        return { skipped: true, reason: "mutex_locked" };
      }

      try {
        const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const result = await prisma.loginAttempt.deleteMany({
          where: { createdAt: { lt: cutoff } },
        });
        return { deleted: result.count, cutoff: cutoff.toISOString() };
      } finally {
        await redis.del(MUTEX_KEY).catch(() => {});
      }
    },
    { connection, concurrency: 1 }
  );

  worker.on("completed", (_job, result) => {
    if (result?.skipped) return;
    console.error(
      `[Cron] cleanup-login-attempts selesai: deleted=${result?.deleted ?? 0}`
    );
  });

  worker.on("failed", (_job, err) => {
    console.error("[Cron] cleanup-login-attempts GAGAL:", err?.message);
  });

  return worker;
}
