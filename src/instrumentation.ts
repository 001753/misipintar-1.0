/**
 * Next.js Instrumentation — runs once on server startup.
 * Bootstraps BullMQ background workers and registers recurring cron jobs.
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Cleanup cron: delete LoginAttempt older than 30 days
    const { startCleanupLoginAttemptsWorker } = await import(
      '@/lib/jobs/cleanupLoginAttempts'
    )
    startCleanupLoginAttemptsWorker()

    // Notification worker: FCM push + SSE dispatch
    const { startNotificationWorker } = await import(
      '@/queues/workers/notification.worker'
    )
    startNotificationWorker()

    // Interest & subscription workers — only when Redis is available
    if (process.env.REDIS_URL) {
      try {
        const { interestQueue, subscriptionQueue } = await import('@/queues')

        if (interestQueue && subscriptionQueue) {
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

          console.log('[Workers] Interest, Tax & Subscription Expiry workers started')
        }
      } catch (err) {
        console.error('[Workers] Failed to start background workers:', err)
      }
    } else {
      console.log('[Workers] REDIS_URL not set — Interest & Subscription workers disabled')
    }
  }
}
