import { Queue } from 'bullmq'
import { getBullConnection } from '@/lib/redis-bull'

/**
 * Create a BullMQ Queue only if Redis is configured.
 * Returns null when REDIS_URL is not set — callers must handle null gracefully.
 */
function makeQueue(name: string): Queue | null {
  const connection = getBullConnection()
  if (!connection) return null
  try {
    return new Queue(name, { connection })
  } catch {
    return null
  }
}

export const notificationQueue = makeQueue('notifications')
export const reportQueue       = makeQueue('reports')
export const subscriptionQueue = makeQueue('subscriptions')
export const interestQueue     = makeQueue('interest')
