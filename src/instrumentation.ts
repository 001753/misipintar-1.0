/**
 * Next.js Instrumentation — runs once on server startup.
 * Bootstraps BullMQ background workers and registers recurring cron jobs.
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Jangan jalankan workers saat build phase — mencegah SIGSEGV di cPanel
  // karena BullMQ/Firebase mendaftarkan signal handler di worker process next build.
  // NEXT_BUILD=1 di-set secara eksplisit di npm run build (lebih andal dari NEXT_PHASE
  // yang tidak selalu di-inject ke subprocess worker oleh Next.js 16).
  if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.NEXT_BUILD === '1') return

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Kumpulkan semua worker untuk graceful shutdown saat SIGTERM
    const workersToClose: Array<{ close(): Promise<void> }> = []

    // Cleanup cron: delete LoginAttempt older than 30 days (butuh Redis)
    if (process.env.REDIS_URL) {
      const { startCleanupLoginAttemptsWorker } = await import(
        '@/lib/jobs/cleanupLoginAttempts'
      )
      const cleanupWorker = startCleanupLoginAttemptsWorker()
      if (cleanupWorker) workersToClose.push(cleanupWorker)
    } else {
      console.log('[Workers] REDIS_URL tidak ada — CleanupLoginAttempts worker dilewati (gunakan /api/cron/cleanup-login-attempts)')
    }

    // Notification worker: FCM push + SSE dispatch (butuh Redis)
    if (process.env.REDIS_URL) {
      const { startNotificationWorker } = await import(
        '@/queues/workers/notification.worker'
      )
      const notifWorker = startNotificationWorker()
      if (notifWorker) workersToClose.push(notifWorker)
    }

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

          const interestWorker = startInterestWorker()
          const subWorker = startSubscriptionWorker()
          if (interestWorker) workersToClose.push(interestWorker)
          if (subWorker) workersToClose.push(subWorker)

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

    // ── Graceful Shutdown ──────────────────────────────────────────────────────
    // Phusion Passenger mengirim SIGTERM saat merestart/mematikan proses.
    // Tanpa handler ini:
    //   - BullMQ worker mati mendadak → job stuck di state "active" di Redis
    //   - Prisma connection pool tidak ditutup bersih → potensi koneksi menggantung
    //   - Redis subscriber SSE tidak di-unsubscribe → leak di Redis side
    // Dengan handler ini: semua resource ditutup sebelum proses exit.
    const gracefulShutdown = async (signal: string) => {
      console.log(`[Shutdown] ${signal} diterima — memulai graceful shutdown...`)

      // Tutup semua BullMQ workers (tunggu job yang sedang berjalan selesai, maks 10 detik)
      if (workersToClose.length > 0) {
        console.log(`[Shutdown] Menutup ${workersToClose.length} worker(s)...`)
        await Promise.allSettled(
          workersToClose.map((w) => w.close())
        )
      }

      // Tutup koneksi Prisma
      try {
        const { prisma } = await import('@/lib/prisma')
        await (prisma as unknown as { $disconnect(): Promise<void> }).$disconnect()
        console.log('[Shutdown] Prisma disconnected.')
      } catch {
        // Non-fatal — lanjut shutdown
      }

      // Tutup koneksi Redis
      try {
        const { redis } = await import('@/lib/redis')
        if (redis) {
          await redis.quit()
          console.log('[Shutdown] Redis disconnected.')
        }
      } catch {
        // Non-fatal — lanjut shutdown
      }

      console.log('[Shutdown] Graceful shutdown selesai.')
      process.exit(0)
    }

    // Daftarkan hanya sekali (idempotent)
    process.once('SIGTERM', () => gracefulShutdown('SIGTERM'))
    process.once('SIGINT',  () => gracefulShutdown('SIGINT'))
  }
}
