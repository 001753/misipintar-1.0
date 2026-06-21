import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { logoutAction } from '@/actions/auth'
import { getUnreadCount } from '@/lib/notifications/sse'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session || session.user.role !== 'PARENT') redirect('/login')

  const unreadCount = await getUnreadCount(session.user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            <span className="font-bold text-gray-900">Misi Pintar</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/dashboard" className="text-gray-600 hover:text-emerald-600 font-medium">
              Beranda
            </Link>
            <Link href="/dashboard/children" className="text-gray-600 hover:text-emerald-600 font-medium">
              Anak
            </Link>
            <Link href="/dashboard/tasks" className="text-gray-600 hover:text-emerald-600 font-medium">
              Tugas
            </Link>
            <Link href="/dashboard/ledger" className="text-gray-600 hover:text-emerald-600 font-medium">
              Saldo
            </Link>
            <Link href="/dashboard/billing" className="text-gray-600 hover:text-emerald-600 font-medium">
              Billing
            </Link>
            {/* [5.5] Notifikasi dengan badge counter */}
            <Link
              href="/dashboard/notifications"
              className="relative text-gray-600 hover:text-emerald-600 font-medium"
            >
              Notifikasi
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-3 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            {/* Badge mobile */}
            <Link
              href="/dashboard/notifications"
              className="relative md:hidden text-gray-600 hover:text-emerald-600"
              aria-label="Notifikasi"
            >
              <span className="text-xl">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
            <span className="text-sm text-gray-600 hidden md:block">
              {session.user.name}
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-sm text-gray-500 hover:text-red-600 font-medium transition-colors"
              >
                Keluar
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
