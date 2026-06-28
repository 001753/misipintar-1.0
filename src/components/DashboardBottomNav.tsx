'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logoutAction } from '@/actions/auth'

const navLinks = [
  { href: '/dashboard',               icon: '🏠', label: 'Beranda' },
  { href: '/dashboard/children',      icon: '👧', label: 'Anak' },
  { href: '/dashboard/tasks',         icon: '📋', label: 'Tugas' },
  { href: '/dashboard/tasks/pending', icon: '⏳', label: 'Review' },
  { href: '/dashboard/ledger',        icon: '💰', label: 'Saldo' },
  { href: '/dashboard/billing',       icon: '💳', label: 'Langganan' },
  { href: '/dashboard/settings',      icon: '⚙️', label: 'Profil' },
]

const allHrefs = navLinks.map((l) => l.href)

function isActive(href: string, pathname: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard'
  const moreSpecific = allHrefs.some(
    (other) => other !== href && other.startsWith(href) && pathname.startsWith(other)
  )
  if (moreSpecific) return false
  return pathname === href || pathname.startsWith(href + '/')
}

export default function DashboardBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.4)] pb-safe transition-colors duration-200">
      <div className="flex items-center justify-around px-1 pt-1 pb-2">
        {navLinks.map(({ href, icon, label }) => {
          const active = isActive(href, pathname)
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-2xl transition-all active:scale-90 min-w-0 relative ${
                active ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              {active && (
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-emerald-500" />
              )}
              <span className={`text-xl leading-none transition-transform ${active ? 'scale-110' : ''}`}>
                {icon}
              </span>
              <span className={`text-[9px] font-semibold leading-none mt-0.5 truncate transition-colors ${
                active ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'
              }`}>
                {label}
              </span>
            </Link>
          )
        })}
        <form action={logoutAction} className="flex flex-col items-center">
          <button
            type="submit"
            className="flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-2xl transition-all active:scale-90 text-gray-400 dark:text-gray-500"
          >
            <span className="text-xl leading-none">🚪</span>
            <span className="text-[9px] font-semibold leading-none mt-0.5">Keluar</span>
          </button>
        </form>
      </div>
    </nav>
  )
}
