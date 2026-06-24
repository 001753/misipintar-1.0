/**
 * [5.1] Notification Worker — FCM Push + SSE real-time dispatch.
 * Consumes the "notifications" BullMQ queue.
 * Runs only when REDIS_URL is configured (graceful no-op otherwise).
 */
import { Worker, Job } from 'bullmq'
import { getBullConnection } from '@/lib/redis-bull'
import {
  sendPushNotification,
  getUserFcmTokens,
  getChildFcmTokens,
} from '@/lib/notifications/fcm'
import {
  publishToFamily,
  incrementUnreadBadge,
} from '@/lib/notifications/sse'

export type NotificationJobData = {
  type: string
  familySpaceId: string
  targetUserId?: string
  targetChildId?: string
  title: string
  body: string
  data?: Record<string, string>
}

export function startNotificationWorker() {
  const connection = getBullConnection()
  if (!connection) {
    console.warn('[NotificationWorker] Redis not available — worker disabled')
    return null
  }

  const worker = new Worker<NotificationJobData>(
    'notifications',
    async (job: Job<NotificationJobData>) => {
      const {
        type,
        familySpaceId,
        targetUserId,
        targetChildId,
        title,
        body,
        data,
      } = job.data

      // 1. SSE real-time broadcast to all connected clients in this family
      await publishToFamily(familySpaceId, {
        type,
        payload: { title, body, ...(data ?? {}) },
      })

      // 2. FCM push notification to device tokens
      const tokens: string[] = []
      if (targetUserId) {
        tokens.push(...(await getUserFcmTokens(targetUserId)))
      }
      if (targetChildId) {
        tokens.push(...(await getChildFcmTokens(targetChildId)))
      }

      let fcmResult = { successCount: 0, failureCount: 0 }
      if (tokens.length > 0) {
        fcmResult = await sendPushNotification(tokens, title, body, data)
      }

      // 3. Increment unread badge counter
      if (targetUserId) {
        await incrementUnreadBadge(targetUserId)
      }

      return {
        type,
        sse: true,
        fcm: { tokens: tokens.length, ...fcmResult },
      }
    },
    { connection, concurrency: 5 }
  )

  worker.on('completed', (job, result) => {
    console.log(
      `[NotificationWorker] Job ${job.id} done — sse=${result.sse} fcm_sent=${result.fcm.successCount}`
    )
  })

  worker.on('failed', (job, err) => {
    console.error(`[NotificationWorker] Job ${job?.id} failed:`, err.message)
  })

  return worker
}
