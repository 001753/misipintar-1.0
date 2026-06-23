import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { logoutAction } from '@/actions/auth'
import { getUnreadCount } from '@/lib/notifications/sse'
import NotificationBell from '@/components/notification-bell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session || session.user.role !== 'PARENT') redirect('/login')

  const unreadCount = await getUnreadCount(session.user.id)

  const navLinks = [
    { href: '/dashboard',              icon: '🏠', label: 'Beranda' },
    { href: '/dashboard/children',     icon: '👧', label: 'Anak' },
    { href: '/dashboard/tasks',        icon: '📋', label: 'Tugas' },
    { href: '/dashboard/tasks/pending',icon: '⏳', label: 'Review' },
    { href: '/dashboard/ledger',       icon: '💰', label: 'Saldo' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Top Header ── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-sm">
              <span className="text-base">🎯</span>
            </div>
            <span className="font-black text-gray-900 text-base hidden sm:block">Misi Pintar</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, icon, label }) => (
              <Link
                key={href}
                href={href}
                className="px-3 py-2 rounded-xl text-sm font-medium text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
              >
                {icon} {label}
              </Link>
            ))}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-2">
            <NotificationBell initialUnread={unreadCount} />
            <span className="text-sm text-gray-600 hidden md:block font-medium">
              {session.user.name?.split(' ')[0]}
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-xs text-gray-400 hover:text-red-500 font-medium transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
              >
                Keluar
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-8">
        {children}
      </main>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.08)] pb-safe">
        <div className="flex items-center justify-around px-2 pt-2 pb-2">
          {navLinks.map(({ href, icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-2xl transition-all active:scale-90 min-w-0"
            >
              <span className="text-xl leading-none">{icon}</span>
              <span className="text-[10px] text-gray-500 font-medium leading-none mt-0.5 truncate">{label}</span>
            </Link>
          ))}
          <form action={logoutAction} className="flex flex-col items-center">
            <button type="submit" className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-2xl transition-all active:scale-90">
              <span className="text-xl leading-none">🚪</span>
              <span className="text-[10px] text-gray-500 font-medium leading-none mt-0.5">Keluar</span>
            </button>
          </form>
        </div>
      </nav>
    </div>
  )
}
