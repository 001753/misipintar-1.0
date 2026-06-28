import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { execSync } from 'child_process'

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

function getGitCommit(): { hash: string; short: string; date: string } | null {
  try {
    const hash  = execSync('git rev-parse HEAD',            { timeout: 2000 }).toString().trim()
    const date  = execSync('git log -1 --format=%ci HEAD',  { timeout: 2000 }).toString().trim()
    return { hash, short: hash.slice(0, 7), date }
  } catch {
    return null
  }
}

export async function GET() {
  const start = Date.now()

  const checks: Record<string, { status: 'ok' | 'warn' | 'error'; latencyMs?: number; detail?: string }> = {}

  // ── Database ────────────────────────────────────────────────────────────────
  try {
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    checks.database = { status: 'ok', latencyMs: Date.now() - dbStart }
  } catch (err) {
    checks.database = {
      status: 'error',
      detail: err instanceof Error ? err.message : String(err),
    }
  }

  // ── Seeding: STARTER plan ───────────────────────────────────────────────────
  if (checks.database?.status === 'ok') {
    try {
      const starterPlan = await prisma.plan.findFirst({ where: { type: 'STARTER' } })
      checks.starterPlan = starterPlan
        ? { status: 'ok', detail: `id: ${starterPlan.id}` }
        : { status: 'error', detail: 'Plan STARTER tidak ditemukan — jalankan: /api/seed/plans' }
    } catch (err) {
      checks.starterPlan = {
        status: 'error',
        detail: err instanceof Error ? err.message : String(err),
      }
    }
  }

  // ── Env vars ────────────────────────────────────────────────────────────────
  const envChecks: Record<string, { required: boolean; present: boolean }> = {
    DATABASE_URL:     { required: true,  present: !!process.env.DATABASE_URL },
    NEXTAUTH_SECRET:  { required: true,  present: !!(process.env.NEXTAUTH_SECRET || process.env.SESSION_SECRET) },
    APP_URL:          { required: true,  present: !!process.env.APP_URL },
    NEXTAUTH_URL:     { required: true,  present: !!process.env.NEXTAUTH_URL },
    MIDTRANS_SERVER_KEY: { required: true,  present: !!process.env.MIDTRANS_SERVER_KEY },
    MIDTRANS_CLIENT_KEY: { required: true,  present: !!process.env.MIDTRANS_CLIENT_KEY },
    SMTP_HOST:        { required: false, present: !!process.env.SMTP_HOST },
    SMTP_USER:        { required: false, present: !!process.env.SMTP_USER },
    SMTP_PASS:        { required: false, present: !!process.env.SMTP_PASS },
    FONNTE_TOKEN:     { required: false, present: !!process.env.FONNTE_TOKEN },
    REDIS_URL:        { required: false, present: !!process.env.REDIS_URL },
    FIREBASE_PROJECT_ID: { required: false, present: !!process.env.FIREBASE_PROJECT_ID },
    CRON_SECRET:      { required: false, present: !!process.env.CRON_SECRET },
  }

  const missingRequired = Object.entries(envChecks).filter(([, v]) => v.required && !v.present).map(([k]) => k)
  const missingOptional = Object.entries(envChecks).filter(([, v]) => !v.required && !v.present).map(([k]) => k)

  checks.envVars = {
    status: missingRequired.length > 0 ? 'error' : missingOptional.length > 0 ? 'warn' : 'ok',
    detail: [
      missingRequired.length > 0 ? `❌ Wajib belum diset: ${missingRequired.join(', ')}` : '',
      missingOptional.length > 0 ? `⚠️  Opsional belum diset: ${missingOptional.join(', ')}` : '',
    ].filter(Boolean).join(' | ') || 'Semua env var tersedia',
  }

  // ── Redis (opsional) ────────────────────────────────────────────────────────
  try {
    const { redis } = await import('@/lib/redis')
    if (redis) {
      const redisStart = Date.now()
      await redis.ping()
      checks.redis = { status: 'ok', latencyMs: Date.now() - redisStart }
    } else {
      checks.redis = { status: 'warn', detail: 'Disabled — REDIS_URL tidak diset (BullMQ workers nonaktif)' }
    }
  } catch (err) {
    checks.redis = {
      status: 'error',
      detail: err instanceof Error ? err.message : String(err),
    }
  }

  // ── SMTP config (opsional) ──────────────────────────────────────────────────
  const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
  checks.smtp = smtpConfigured
    ? { status: 'ok', detail: `${process.env.SMTP_USER} via ${process.env.SMTP_HOST}:${process.env.SMTP_PORT ?? '587'}` }
    : { status: 'warn', detail: 'SMTP belum dikonfigurasi — email receipts nonaktif' }

  // ── Midtrans config ─────────────────────────────────────────────────────────
  const midtransConfigured = !!(process.env.MIDTRANS_SERVER_KEY && process.env.MIDTRANS_CLIENT_KEY)
  const midtransMode = process.env.MIDTRANS_IS_PRODUCTION === 'true' ? 'production' : 'sandbox'
  checks.midtrans = midtransConfigured
    ? { status: 'ok', detail: `mode: ${midtransMode}` }
    : { status: 'error', detail: 'MIDTRANS_SERVER_KEY atau MIDTRANS_CLIENT_KEY tidak diset' }

  // ── Memory ──────────────────────────────────────────────────────────────────
  const mem = process.memoryUsage()
  const memory = {
    rss:       `${Math.round(mem.rss       / 1024 / 1024)} MB`,
    heapUsed:  `${Math.round(mem.heapUsed  / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)} MB`,
  }

  // ── App version & git ───────────────────────────────────────────────────────
  let appVersion = 'unknown'
  try {
    const pkg = require('../../../../package.json') as { version?: string }
    appVersion = pkg.version ?? 'unknown'
  } catch { /* tidak kritis */ }

  const git = getGitCommit()

  // ── Status final ────────────────────────────────────────────────────────────
  const hasError = Object.values(checks).some((c) => c.status === 'error')
  const hasWarn  = Object.values(checks).some((c) => c.status === 'warn')
  const overallStatus = hasError ? 'degraded' : hasWarn ? 'ok (with warnings)' : 'ok'

  return NextResponse.json({
    status:    overallStatus,
    timestamp: new Date().toISOString(),
    totalMs:   Date.now() - start,
    uptime: {
      seconds: Math.floor(process.uptime()),
      human:   formatUptime(process.uptime()),
    },
    checks,
    system: {
      node:    process.version,
      pid:     process.pid,
      env:     process.env.NODE_ENV ?? 'unknown',
      memory,
    },
    app: {
      name:    'misi-pintar',
      version: appVersion,
      ...(git ? { commit: git.short, commitDate: git.date } : {}),
    },
  }, {
    status:  hasError ? 503 : 200,
    headers: { 'Cache-Control': 'no-store' },
  })
}
