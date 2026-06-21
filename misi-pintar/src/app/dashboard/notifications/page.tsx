/**
 * [5.5] In-App Notification Center
 * Tampilkan semua Notification dari DB untuk user dari session.
 * Tandai semua sebagai read saat halaman dibuka (Server Action).
 */

import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { markAllNotificationsRead } from '@/actions/notifications'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

const TYPE_ICONS: Record<string, string> = {
  TASK_CLAIMED: '📋',
  TASK_APPROVED: '🎉',
  TASK_REJECTED: '😔',
  subscription_expired: '⚠️',
  subscription_cancelled: '❌',
  SUBSCRIPTION_ACTIVATED: '✅',
}

export default async function NotificationsPage() {
  const session = await auth()
  if (!session || session.user.role !== 'PARENT') redirect('/login')

  const userId = session.user.id

  // Ambil notifikasi untuk user ini, terbaru dulu, maks 50
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  // Tandai semua sebagai read (non-blocking)
  await markAllNotificationsRead()

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifikasi</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-emerald-600 mt-1">
              {unreadCount} notifikasi belum dibaca (sudah ditandai terbaca)
            </p>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-4xl mb-3">🔔</p>
          <p className="text-gray-600 font-medium">Belum ada notifikasi</p>
          <p className="text-gray-400 text-sm mt-1">
            Notifikasi tugas dan langganan akan muncul di sini
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const icon = TYPE_ICONS[notif.type] ?? '🔔'
            const wasUnread = !notif.isRead
            return (
              <div
                key={notif.id}
                className={`bg-white rounded-xl border p-4 flex gap-4 transition-colors ${
                  wasUnread
                    ? 'border-emerald-200 bg-emerald-50/40'
                    : 'border-gray-200'
                }`}
              >
                <div className="text-2xl flex-shrink-0 mt-0.5">{icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-gray-900 text-sm">
                      {notif.title}
                      {wasUnread && (
                        <span className="ml-2 inline-block w-2 h-2 rounded-full bg-emerald-500 align-middle" />
                      )}
                    </p>
                    <p className="text-xs text-gray-400 flex-shrink-0">
                      {formatDistanceToNow(new Date(notif.createdAt), {
                        addSuffix: true,
                        locale: idLocale,
                      })}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{notif.body}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
