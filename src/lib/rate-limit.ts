'server-only'

import { redis } from '@/lib/redis'
import { prisma } from '@/lib/prisma'

export interface RateLimitResult {
  success: boolean
  remaining: number
  retryAfterSeconds?: number
}

export interface RateLimitOptions {
  /** Unique key untuk bucket ini, contoh: `api:upload:${userId}` */
  key: string
  /** Maks request dalam window */
  max: number
  /** Durasi window dalam detik */
  windowSeconds: number
}

/**
 * Rate limiter yang menggunakan Redis jika tersedia,
 * atau DB LoginAttempt sebagai fallback.
 */
export async function rateLimit(opts: RateLimitOptions): Promise<RateLimitResult> {
  const { key, max, windowSeconds } = opts

  // ── Redis path ────────────────────────────────────────
  if (redis) {
    try {
      const redisKey = `rl:${key}`
      const count = await redis.incr(redisKey)
      if (count === 1) await redis.expire(redisKey, windowSeconds)
      const remaining = Math.max(0, max - count)
      if (count > max) {
        const ttl = await redis.ttl(redisKey)
        return { success: false, remaining: 0, retryAfterSeconds: ttl > 0 ? ttl : windowSeconds }
      }
      return { success: true, remaining }
    } catch {
      // fallback ke DB jika Redis error
    }
  }

  // ── DB fallback path (LoginAttempt table) ─────────────
  // Hitung attempts dalam window menggunakan identifier = key
  const since = new Date(Date.now() - windowSeconds * 1000)
  const count = await prisma.loginAttempt.count({
    where: {
      identifier: key,
      success: false,
      createdAt: { gte: since },
    },
  })

  if (count >= max) {
    const oldest = await prisma.loginAttempt.findFirst({
      where: { identifier: key, success: false, createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
    })
    const retryAfterMs = oldest
      ? oldest.createdAt.getTime() + windowSeconds * 1000 - Date.now()
      : windowSeconds * 1000
    return {
      success: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    }
  }

  return { success: true, remaining: max - count }
}
