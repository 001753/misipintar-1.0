/**
 * Next.js Instrumentation — runs once on server startup.
 * Bootstraps BullMQ background workers.
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
  }
}
