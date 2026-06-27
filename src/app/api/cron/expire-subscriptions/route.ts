/**
 * POST /api/cron/expire-subscriptions
 * Menjalankan subscription expiry check — dipanggil via cron job cPanel.
 * Aman dijalankan tanpa Redis: menggunakan DB-based distributed lock.
 *
 * Setup cron di cPanel (setiap jam):
 *   0 * * * * curl -s -X POST https://mp.jobenapp.cloud/api/cron/expire-subscriptions \
 *             -H "Authorization: Bearer $CRON_SECRET" > /dev/null 2>&1
 */

import { NextRequest, NextResponse } from 'next/server'
import { runExpireSubscriptions } from '@/queues/workers/subscription.worker'

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
    const result = await runExpireSubscriptions()
    return NextResponse.json({
      ok: true,
      job: 'expire-subscriptions',
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[cron/expire-subscriptions] Error:', err)
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    )
  }
}
