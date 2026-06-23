'server-only'

import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'

const MAX_ATTEMPTS = 5
const WINDOW_MINUTES = 15

/**
 * [7.1] Cek apakah identifier sudah melampaui batas percobaan login.
 * Menggunakan Redis counter (cepat) dengan DB fallback jika Redis mati.
 * Throw 'RATE_LIMITED' jika sudah terkunci.
 */
export async function checkLoginRateLimit(
  identifier: string,
  ipAddress: string
): Promise<void> {
  // ── Redis path (lebih cepat) ──────────────────────────
  if (redis) {
    try {
      const key = `login_attempts:${identifier}`
      const count = await redis.incr(key)
      if (count === 1) await redis.expire(key, WINDOW_MINUTES * 60)
      if (count > MAX_ATTEMPTS) {
        throw new Error('RATE_LIMITED')
      }
      return
    } catch (err: any) {
      if (err?.message === 'RATE_LIMITED') throw err
      // Redis error — fallback ke DB
    }
  }

  // ── DB fallback: hitung LoginAttempt gagal dalam window ─
  const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000)

  const failedCount = await prisma.loginAttempt.count({
    where: {
      identifier,
      success: false,
      createdAt: { gte: since },
    },
  })

  if (failedCount >= MAX_ATTEMPTS) {
    // JANGAN bedakan pesan dengan "password salah" — cegah enumeration attack
    throw new Error('RATE_LIMITED')
  }
}

/**
 * [7.1] Hapus counter rate limit setelah login berhasil.
 */
export async function clearLoginRateLimit(identifier: string): Promise<void> {
  if (!redis) return
  try {
    await redis.del(`login_attempts:${identifier}`)
  } catch {
    // silent — tidak kritis
  }
}

/**
 * [7.1] Catat percobaan login ke DB.
 */
export async function recordLoginAttempt(
  identifier: string,
  ipAddress: string,
  success: boolean
): Promise<void> {
  try {
    await prisma.loginAttempt.create({
      data: { identifier, ipAddress, success },
    })
  } catch {
    // silent — jangan blokir login karena error audit
  }
}
