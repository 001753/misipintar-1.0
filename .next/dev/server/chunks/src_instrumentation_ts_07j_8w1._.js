module.exports = [
"[project]/src/instrumentation.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Next.js Instrumentation — runs once on server startup.
 * Bootstraps BullMQ background workers and registers recurring cron jobs.
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */ __turbopack_context__.s([
    "register",
    ()=>register
]);
async function register() {
    // Jangan jalankan workers saat build phase — mencegah SIGSEGV di cPanel
    // karena BullMQ/Firebase mendaftarkan signal handler di worker process next build.
    // NEXT_BUILD=1 di-set secara eksplisit di npm run build (lebih andal dari NEXT_PHASE
    // yang tidak selalu di-inject ke subprocess worker oleh Next.js 16).
    if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.NEXT_BUILD === '1') return;
    if ("TURBOPACK compile-time truthy", 1) {
        // Cleanup cron: delete LoginAttempt older than 30 days
        const { startCleanupLoginAttemptsWorker } = await __turbopack_context__.A("[project]/src/lib/jobs/cleanupLoginAttempts.ts [instrumentation] (ecmascript, async loader)");
        startCleanupLoginAttemptsWorker();
        // Notification worker: FCM push + SSE dispatch
        const { startNotificationWorker } = await __turbopack_context__.A("[project]/src/queues/workers/notification.worker.ts [instrumentation] (ecmascript, async loader)");
        startNotificationWorker();
        // Interest & subscription workers — only when Redis is available
        if (process.env.REDIS_URL) {
            try {
                const { interestQueue, subscriptionQueue } = await __turbopack_context__.A("[project]/src/queues/index.ts [instrumentation] (ecmascript, async loader)");
                if (interestQueue && subscriptionQueue) {
                    const { startInterestWorker } = await __turbopack_context__.A("[project]/src/queues/workers/interest.worker.ts [instrumentation] (ecmascript, async loader)");
                    const { startSubscriptionWorker } = await __turbopack_context__.A("[project]/src/queues/workers/subscription.worker.ts [instrumentation] (ecmascript, async loader)");
                    startInterestWorker();
                    startSubscriptionWorker();
                    // Register recurring jobs (idempotent — BullMQ deduplicates by jobId)
                    await Promise.all([
                        interestQueue.add('daily-interest', {
                            type: 'INTEREST'
                        }, {
                            repeat: {
                                pattern: '0 0 * * *'
                            },
                            jobId: 'daily-interest'
                        }),
                        interestQueue.add('monthly-tax', {
                            type: 'TAX'
                        }, {
                            repeat: {
                                pattern: '0 1 1 * *'
                            },
                            jobId: 'monthly-tax'
                        }),
                        subscriptionQueue.add('expire-subscriptions', {
                            type: 'EXPIRE'
                        }, {
                            repeat: {
                                pattern: '0 * * * *'
                            },
                            jobId: 'expire-subscriptions'
                        })
                    ]);
                    console.log('[Workers] Interest, Tax & Subscription Expiry workers started');
                }
            } catch (err) {
                console.error('[Workers] Failed to start background workers:', err);
            }
        } else {
            console.log('[Workers] REDIS_URL not set — Interest & Subscription workers disabled');
        }
    }
}
}),
];

//# sourceMappingURL=src_instrumentation_ts_07j_8w1._.js.map