import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const parts: string[] = []
  if (d > 0) parts.push(`${d}d`)
  if (h > 0) parts.push(`${h}h`)
  if (m > 0) parts.push(`${m}m`)
  parts.push(`${s}s`)
  return parts.join(' ')
}

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

  // ── Plan seeding check — STARTER plan harus ada ───────────────────────────
  if (checks.database?.status === 'ok') {
    try {
      const starterPlan = await prisma.plan.findFirst({ where: { type: 'STARTER' } })
      checks.starterPlan = starterPlan
        ? { status: 'ok', detail: `id: ${starterPlan.id}` }
        : { status: 'error', detail: 'Plan STARTER tidak ditemukan — jalankan: npm run db:seed' }
    } catch (err) {
      checks.starterPlan = {
        status: 'error',
        detail: err instanceof Error ? err.message : String(err),
      }
    }
  }

  // ── Env vars critical check ────────────────────────────────────────────────
  const requiredEnvs = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'SESSION_SECRET']
  const missingEnvs = requiredEnvs.filter((k) => !process.env[k])
  checks.envVars = missingEnvs.length === 0
    ? { status: 'ok', detail: 'Semua env var kritis tersedia' }
    : { status: 'error', detail: `Missing: ${missingEnvs.join(', ')}` }

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

  // ── Memory usage ────────────────────────────────────────────────────────────
  const mem = process.memoryUsage()
  const memory = {
    rss:       `${Math.round(mem.rss       / 1024 / 1024)} MB`,
    heapUsed:  `${Math.round(mem.heapUsed  / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)} MB`,
    external:  `${Math.round(mem.external  / 1024 / 1024)} MB`,
  }

  // ── App version dari package.json ──────────────────────────────────────────
  let appVersion = 'unknown'
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pkg = require('../../../../package.json') as { version?: string }
    appVersion = pkg.version ?? 'unknown'
  } catch {
    // tidak kritis
  }

  const allOk = Object.values(checks).every((c) => c.status === 'ok')
  const totalMs = Date.now() - start

  const body = {
    status: allOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: Math.floor(process.uptime()),
      human:   formatUptime(process.uptime()),
    },
    totalMs,
    checks,
    system: {
      node:   process.version,
      pid:    process.pid,
      memory,
      env:    process.env.NODE_ENV ?? 'unknown',
    },
    app: {
      name:    'misi-pintar',
      version: appVersion,
    },
  }

  return NextResponse.json(body, {
    status: allOk ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  })
}
