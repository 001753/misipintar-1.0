export const dynamic = 'force-dynamic'
import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { markAllNotificationsRead } from '@/actions/notifications'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

const TYPE_ICONS: Record<string, string> = {
  TASK_CLAIMED:             '📋',
  TASK_APPROVED:            '🎉',
  TASK_REJECTED:            '😔',
  subscription_expired:     '⚠️',
  subscription_cancelled:   '❌',
  SUBSCRIPTION_ACTIVATED:   '✅',
}

export default async function NotificationsPage() {
  const session = await auth()
  if (!session || session.user.role !== 'PARENT') redirect('/login')

  const userId = session.user.id

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  await markAllNotificationsRead()

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">🔔 Notifikasi</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-emerald-600 font-semibold mt-1">
              {unreadCount} belum dibaca — ditandai terbaca otomatis
            </p>
          )}
        </div>
        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full font-medium">
          {notifications.length} total
        </span>
      </div>

      {notifications.length === 0 ? (
        <div className="animate-scale-in bg-white rounded-3xl border-2 border-dashed border-gray-200 p-12 text-center">
          <p className="text-5xl mb-3">🔔</p>
          <p className="text-gray-700 font-bold">Belum ada notifikasi</p>
          <p className="text-gray-400 text-sm mt-1 leading-relaxed">
            Notifikasi tugas dan langganan akan muncul di sini
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif, i) => {
            const icon = TYPE_ICONS[notif.type] ?? '🔔'
            const wasUnread = !notif.isRead
            return (
              <div
                key={notif.id}
                className={`animate-fade-up card-hover bg-white rounded-2xl border p-4 flex gap-4 transition-all delay-${Math.min(i * 50, 500)} ${
                  wasUnread
                    ? 'border-emerald-200 bg-emerald-50/30 shadow-sm'
                    : 'border-gray-100'
                }`}
              >
                <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-xl flex-shrink-0">
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-gray-900 text-sm leading-snug">
                      {notif.title}
                      {wasUnread && (
                        <span className="ml-2 inline-block w-2 h-2 rounded-full bg-emerald-500 align-middle" />
                      )}
                    </p>
                    <p className="text-[10px] text-gray-400 flex-shrink-0 bg-gray-50 px-2 py-0.5 rounded-full">
                      {formatDistanceToNow(new Date(notif.createdAt), {
                        addSuffix: true,
                        locale: idLocale,
                      })}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">{notif.body}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
