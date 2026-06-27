/**
 * POST /api/cron/interest
 * Menjalankan interest engine harian — dipanggil via cron job cPanel.
 * Aman dijalankan tanpa Redis: menggunakan DB-based distributed lock.
 *
 * Setup cron di cPanel (setiap hari jam 00:05):
 *   5 0 * * * curl -s -X POST https://mp.jobenapp.cloud/api/cron/interest \
 *             -H "Authorization: Bearer $CRON_SECRET" > /dev/null 2>&1
 */

import { NextRequest, NextResponse } from 'next/server'
import { runInterestEngine } from '@/queues/workers/interest.worker'

export const dynamic = 'force-dynamic'

function checkAuth(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true // jika tidak di-set, izinkan (dev mode)
  const auth = req.headers.get('authorization')
  return auth === `Bearer ${secret}`
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runInterestEngine()
    return NextResponse.json({
      ok: true,
      job: 'daily-interest',
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[cron/interest] Error:', err)
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    )
  }
}
