'use server'

import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { resetUnreadBadge } from '@/lib/notifications/sse'

/**
 * [5.5] Tandai semua notifikasi sebagai sudah dibaca.
 * Reset badge counter di Redis.
 */
export async function markAllNotificationsRead(): Promise<void> {
  const session = await auth()
  if (!session || !session.user.id) redirect('/login')

  const userId = session.user.id

  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  })

  // Reset badge counter di Redis
  await resetUnreadBadge(userId)
}
