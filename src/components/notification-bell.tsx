'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'

const TYPE_ICONS: Record<string, string> = {
  TASK_CLAIMED: '📋',
  TASK_APPROVED: '🎉',
  TASK_REJECTED: '😔',
  SAVINGS_DEPOSIT: '💰',
  CHARITY: '🤲',
  subscription_expired: '⚠️',
  subscription_cancelled: '❌',
  SUBSCRIPTION_ACTIVATED: '✅',
}

type Notification = {
  id: string
  title: string
  body: string
  type: string
  isRead: boolean
  createdAt: string
}

interface Props {
  initialUnread: number
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'Baru saja'
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`
  return `${Math.floor(diff / 86400)} hari lalu`
}

export default function NotificationBell({ initialUnread }: Props) {
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(initialUnread)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchUnread = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/recent', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      setUnread(data.unreadCount)
    } catch {
      // non-fatal
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(fetchUnread, 30_000)
    return () => clearInterval(interval)
  }, [fetchUnread])

  useEffect(() => {
    window.addEventListener('focus', fetchUnread)
    return () => window.removeEventListener('focus', fetchUnread)
  }, [fetchUnread])

  const openDropdown = useCallback(async () => {
    setOpen(true)
    setLoading(true)
    try {
      const res = await fetch('/api/notifications/recent?markRead=1', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications)
      setUnread(0)
    } catch {
      // non-fatal
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      {/* Bell button */}
      <button
        onClick={() => (open ? setOpen(false) : openDropdown())}
        className="relative flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors focus:outline-none"
        aria-label="Notifikasi"
      >
        <span className="text-lg leading-none">🔔</span>
        <span className="hidden md:inline">Notifikasi</span>
        {unread > 0 && (
          <span className="absolute -top-2 -right-2 md:-right-4 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-8 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-xl dark:shadow-black/40 border border-gray-200 dark:border-gray-700 z-50 overflow-hidden transition-colors duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <p className="font-semibold text-gray-900 dark:text-gray-50 text-sm">Notifikasi</p>
            <Link
              href="/dashboard/notifications"
              onClick={() => setOpen(false)}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium"
            >
              Lihat semua →
            </Link>
          </div>

          {/* Body */}
          <div className="max-h-[360px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8 gap-2 text-gray-400 dark:text-gray-500">
                <span className="inline-block w-4 h-4 border-2 border-gray-300 dark:border-gray-600 border-t-emerald-500 rounded-full animate-spin" />
                <span className="text-sm">Memuat...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-2xl mb-1">🔔</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">Belum ada notifikasi</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {notifications.map((n) => (
                  <li key={n.id} className={`flex gap-3 px-4 py-3 ${!n.isRead ? 'bg-emerald-50/50 dark:bg-emerald-950/30' : ''}`}>
                    <span className="text-xl flex-shrink-0 mt-0.5">{TYPE_ICONS[n.type] ?? '🔔'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug">
                        {n.title}
                        {!n.isRead && (
                          <span className="ml-1.5 inline-block w-2 h-2 rounded-full bg-emerald-500 align-middle" />
                        )}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-2.5">
              <Link
                href="/dashboard/notifications"
                onClick={() => setOpen(false)}
                className="block text-center text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium"
              >
                Lihat semua riwayat notifikasi
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
