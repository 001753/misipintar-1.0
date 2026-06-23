/**
 * Next.js Instrumentation — dijalankan sekali saat server startup.
 * Digunakan untuk bootstrap BullMQ workers.
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startCleanupLoginAttemptsWorker } = await import(
      "@/lib/jobs/cleanupLoginAttempts"
    );
    startCleanupLoginAttemptsWorker();
  }
}
