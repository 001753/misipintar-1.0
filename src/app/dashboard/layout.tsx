import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { logoutAction } from '@/actions/auth'
import { getUnreadCount } from '@/lib/notifications/sse'
import NotificationBell from '@/components/notification-bell'
import ThemeToggle from '@/components/ThemeToggle'
import DashboardBottomNav from '@/components/DashboardBottomNav'

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session || session.user.role !== 'PARENT') redirect('/login')

  const unreadCount = await getUnreadCount(session.user.id)

  const navLinks = [
    { href: '/dashboard',               icon: '🏠', label: 'Beranda' },
    { href: '/dashboard/children',      icon: '👧', label: 'Anak' },
    { href: '/dashboard/tasks',         icon: '📋', label: 'Tugas' },
    { href: '/dashboard/tasks/pending', icon: '⏳', label: 'Review' },
    { href: '/dashboard/ledger',        icon: '💰', label: 'Saldo' },
    { href: '/dashboard/billing',       icon: '💳', label: 'Langganan' },
    { href: '/dashboard/settings',      icon: '⚙️', label: 'Profil' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      {/* ── Top Header ── */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30 shadow-sm dark:shadow-black/20 transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-sm">
              <span className="text-base">🎯</span>
            </div>
            <span className="font-black text-gray-900 dark:text-gray-50 text-base hidden sm:block">
              Misi Pintar
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, icon, label }) => (
              <Link
                key={href}
                href={href}
                className="px-3 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-all"
              >
                {icon} {label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <NotificationBell initialUnread={unreadCount} />
            <span className="text-sm text-gray-600 dark:text-gray-400 hidden md:block font-medium">
              {session.user.name?.split(' ')[0]}
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 font-medium transition-colors px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40"
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

        {/* ── Powered By Footer ── */}
        <div className="mt-10 pt-5 border-t border-gray-100 dark:border-gray-800 flex justify-center transition-colors duration-200">
          <div className="flex items-center gap-2 group">
            <span className="text-[10px] font-medium text-gray-300 dark:text-gray-600 uppercase tracking-[0.15em]">Powered by</span>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-md bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm shadow-amber-400/25">
                <span className="text-[7px] font-black text-white leading-none">JE</span>
              </div>
              <span className="text-[10px] font-black tracking-widest text-gray-300 dark:text-gray-600 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors duration-300 uppercase">
                JOBEN ENTERPRISE
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* ── Mobile Bottom Nav ── */}
      <DashboardBottomNav />
    </div>
  )
}
