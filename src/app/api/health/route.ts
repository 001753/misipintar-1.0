import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const start = Date.now()

  const checks: Record<string, { status: 'ok' | 'error'; latencyMs?: number; detail?: string }> = {}

  // ── Database check ──────────────────────────────────────────────────────────
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database = { status: 'ok', latencyMs: Date.now() - start }
  } catch (err) {
    checks.database = {
      status: 'error',
      detail: err instanceof Error ? err.message : String(err),
    }
  }

  // ── Redis check (opsional — tidak gagal jika tidak ada) ────────────────────
  try {
    const { redis } = await import('@/lib/redis')
    if (redis) {
      const redisStart = Date.now()
      await redis.ping()
      checks.redis = { status: 'ok', latencyMs: Date.now() - redisStart }
    } else {
      checks.redis = { status: 'ok', detail: 'disabled (REDIS_URL not set)' }
    }
  } catch (err) {
    checks.redis = {
      status: 'error',
      detail: err instanceof Error ? err.message : String(err),
    }
  }

  const allOk = Object.values(checks).every((c) => c.status === 'ok')
  const totalMs = Date.now() - start

  const body = {
    status: allOk ? 'ok' : 'degraded',
    uptime: Math.floor(process.uptime()),
    totalMs,
    checks,
    node: process.version,
    env: process.env.NODE_ENV ?? 'unknown',
  }

  return NextResponse.json(body, { status: allOk ? 200 : 503 })
}
