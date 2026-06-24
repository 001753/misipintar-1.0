import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { resetUnreadBadge } from '@/lib/notifications/sse'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'PARENT' || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const url = new URL(request.url)
  const markRead = url.searchParams.get('markRead') === '1'

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 8,
    select: {
      id: true,
      title: true,
      body: true,
      type: true,
      isRead: true,
      createdAt: true,
    },
  })

  const unreadCount = notifications.filter((n) => !n.isRead).length

  if (markRead && unreadCount > 0) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    })
    await resetUnreadBadge(userId)
  }

  return NextResponse.json({ notifications, unreadCount })
}
