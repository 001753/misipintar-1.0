/**
 * POST /api/cron/tax
 * Menjalankan tax engine bulanan — dipanggil via cron job cPanel.
 * Aman dijalankan tanpa Redis: menggunakan DB-based distributed lock.
 *
 * Setup cron di cPanel (tanggal 1 setiap bulan, jam 01:05):
 *   5 1 1 * * curl -s -X POST https://mp.jobenapp.cloud/api/cron/tax \
 *             -H "Authorization: Bearer $CRON_SECRET" > /dev/null 2>&1
 */

import { NextRequest, NextResponse } from 'next/server'
import { runTaxEngine } from '@/queues/workers/interest.worker'

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
    const result = await runTaxEngine()
    return NextResponse.json({
      ok: true,
      job: 'monthly-tax',
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[cron/tax] Error:', err)
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    )
  }
}
