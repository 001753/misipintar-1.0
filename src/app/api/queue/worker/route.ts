/**
 * POST /api/queue/worker  — start interest, tax & subscription-expiry workers.
 * GET  /api/queue/worker  — report repeatable job status.
 *
 * Call POST once after deployment (e.g. from a startup script or cron ping).
 * Requires REDIS_URL to be configured — returns 503 otherwise.
 *
 * Import @/queues dilakukan secara lazy (dynamic import di dalam handler) —
 * BUKAN static import di atas — untuk mencegah bullmq/@msgpackr-extract
 * native addon termuat saat build worker mengevaluasi modul ini.
 */
import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

let workersStarted = false

export async function POST() {
  if (!redis) {
    return NextResponse.json(
      { error: 'Redis not configured — workers disabled' },
      { status: 503 }
    )
  }

  // Lazy import — mencegah bullmq native addon (@msgpackr-extract) termuat saat build
  const { interestQueue, subscriptionQueue } = await import('@/queues')

  if (!interestQueue || !subscriptionQueue) {
    return NextResponse.json(
      { error: 'BullMQ queues unavailable — check REDIS_URL' },
      { status: 503 }
    )
  }

  if (workersStarted) {
    return NextResponse.json({ message: 'Workers already running' })
  }

  try {
    const { startInterestWorker } = await import(
      '@/queues/workers/interest.worker'
    )
    const { startSubscriptionWorker } = await import(
      '@/queues/workers/subscription.worker'
    )

    startInterestWorker()
    startSubscriptionWorker()

    // Register recurring jobs (idempotent — BullMQ deduplicates by jobId)
    await Promise.all([
      interestQueue.add(
        'daily-interest',
        { type: 'INTEREST' },
        { repeat: { pattern: '0 0 * * *' }, jobId: 'daily-interest' }
      ),
      interestQueue.add(
        'monthly-tax',
        { type: 'TAX' },
        { repeat: { pattern: '0 1 1 * *' }, jobId: 'monthly-tax' }
      ),
      subscriptionQueue.add(
        'expire-subscriptions',
        { type: 'EXPIRE' },
        { repeat: { pattern: '0 * * * *' }, jobId: 'expire-subscriptions' }
      ),
    ])

    workersStarted = true
    console.log('[Workers] Interest, Tax & Subscription Expiry workers started')

    return NextResponse.json({
      message: 'Workers started successfully',
      jobs: [
        'daily-interest (0 0 * * *)',
        'monthly-tax (0 1 1 * *)',
        'expire-subscriptions (0 * * * *)',
      ],
    })
  } catch (err) {
    console.error('[Workers] Failed to start:', err)
    return NextResponse.json(
      { error: 'Failed to start workers', detail: String(err) },
      { status: 500 }
    )
  }
}

export async function GET() {
  if (!redis) {
    return NextResponse.json({
      status: 'disabled',
      reason: 'Redis not configured',
    })
  }

  // Lazy import — mencegah bullmq native addon (@msgpackr-extract) termuat saat build
  const { interestQueue, subscriptionQueue } = await import('@/queues')

  if (!interestQueue || !subscriptionQueue) {
    return NextResponse.json({
      status: 'disabled',
      reason: 'Redis not configured',
    })
  }

  const [interestJobs, subJobs] = await Promise.all([
    interestQueue.getRepeatableJobs(),
    subscriptionQueue.getRepeatableJobs(),
  ])

  return NextResponse.json({
    status: 'ok',
    workers_started: workersStarted,
    jobs: { interest: interestJobs, subscription: subJobs },
  })
}
