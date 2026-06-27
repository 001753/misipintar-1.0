'server-only'

/**
 * DB-based distributed lock menggunakan PostgreSQL.
 * Pengganti Redis SET NX EX untuk cron job di cPanel shared hosting.
 *
 * Cara kerja:
 * - acquire: INSERT INTO CronLock (upsert) dengan expiresAt = now + ttl
 *   Jika baris sudah ada DAN belum expired → return false (lock held)
 *   Jika baris sudah ada TAPI expired → anggap bebas, overwrite
 * - release: DELETE baris lock
 */

import { prisma } from '@/lib/prisma'

export async function acquireDbLock(
  id: string,
  ttlSeconds: number
): Promise<boolean> {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000)

  try {
    // Coba upsert: insert baru ATAU update hanya jika lock sudah expired
    const result = await prisma.$executeRaw`
      INSERT INTO "CronLock" ("id", "lockedAt", "expiresAt")
      VALUES (${id}, ${now}, ${expiresAt})
      ON CONFLICT ("id") DO UPDATE
        SET "lockedAt" = ${now}, "expiresAt" = ${expiresAt}
        WHERE "CronLock"."expiresAt" < ${now}
    `
    // result = jumlah baris yang dimodifikasi
    // 0 = lock masih dipegang (expiresAt belum lewat)
    // 1 = berhasil acquire (baru atau expired)
    return result === 1
  } catch {
    // Jika DB error, biarkan job jalan (single-instance cPanel aman)
    return true
  }
}

export async function releaseDbLock(id: string): Promise<void> {
  try {
    await prisma.cronLock.delete({ where: { id } }).catch(() => {})
  } catch {
    // silent
  }
}

/** Hapus semua lock yang sudah expired (panggil sesekali untuk housekeeping) */
export async function cleanExpiredLocks(): Promise<void> {
  try {
    await prisma.cronLock.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    })
  } catch {
    // silent
  }
}
