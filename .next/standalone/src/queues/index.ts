import { getBullConnection } from '@/lib/redis-bull'

// bullmq di-require() secara lazy di dalam makeQueue() — BUKAN static import di atas.
//
// Root cause SIGSEGV di cPanel:
//   static `import { Queue } from 'bullmq'` menyebabkan bullmq memuat msgpackr,
//   yang memuat @msgpackr-extract native C++ addon (.node file).
//   Ketika build worker exit setelah "Collecting page data", destructor native
//   dari @msgpackr-extract mengakses freed memory → SIGSEGV.
//
// Fix: require('bullmq') hanya dipanggil di dalam makeQueue(), yaitu hanya saat
// Queue pertama kali dibuat — TIDAK saat modul di-import.

type BullQueue = import('bullmq').Queue

function makeQueue(name: string): BullQueue | null {
  const connection = getBullConnection()
  if (!connection) return null
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Queue } = require('bullmq') as typeof import('bullmq')
    return new Queue(name, { connection })
  } catch {
    return null
  }
}

export const notificationQueue = makeQueue('notifications')
export const reportQueue       = makeQueue('reports')
export const subscriptionQueue = makeQueue('subscriptions')
export const interestQueue     = makeQueue('interest')
