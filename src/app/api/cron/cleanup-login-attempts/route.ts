/**
 * POST /api/cron/cleanup-login-attempts
 * Hapus LoginAttempt lama (> 30 hari) — dipanggil via cron job cPanel.
 *
 * Setup cron di cPanel (setiap hari jam 02:00 WIB = 19:00 UTC):
 *   0 19 * * * curl -s -X POST https://mp.jobenapp.cloud/api/cron/cleanup-login-attempts \
 *              -H "Authorization: Bearer $CRON_SECRET" > /dev/null 2>&1
 */

import { NextRequest, NextResponse } from 'next/server'
import { runCleanupLoginAttempts } from '@/lib/jobs/cleanupLoginAttempts'

export const dynamic = 'force-dynamic'

function checkAuth(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  const auth = req.headers.get('authorization')
  return auth === `Bearer ${secret}`
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runCleanupLoginAttempts()
    return NextResponse.json({
      ok: true,
      job: 'cleanup-login-attempts',
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[cron/cleanup-login-attempts] Error:', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
