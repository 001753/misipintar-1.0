'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logoutAction } from '@/actions/auth'

const navLinks = [
  { href: '/child/dashboard', icon: '🏠', label: 'Beranda' },
  { href: '/child/tasks',     icon: '🎯', label: 'Misi' },
  { href: '/child/transfer',  icon: '💸', label: 'Transfer' },
  { href: '/child/history',   icon: '📜', label: 'Riwayat' },
  { href: '/child/settings',  icon: '⚙️', label: 'Profil' },
]

const allHrefs = navLinks.map((l) => l.href)

function isActive(href: string, pathname: string): boolean {
  if (href === '/child/dashboard') return pathname === '/child/dashboard'
  const moreSpecific = allHrefs.some(
    (other) => other !== href && other.startsWith(href) && pathname.startsWith(other)
  )
  if (moreSpecific) return false
  return pathname === href || pathname.startsWith(href + '/')
}

export default function ChildBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 pb-safe">
      <div className="mx-3 mb-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 dark:border-gray-700/50">
        <div className="flex items-center justify-around px-2 py-2.5">
          {navLinks.map(({ href, icon, label }) => {
            const active = isActive(href, pathname)
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-2xl transition-all active:scale-90 relative ${
                  active ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {active && (
                  <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-emerald-500" />
                )}
                <span className={`text-xl leading-none transition-transform ${active ? 'scale-110' : ''}`}>
                  {icon}
                </span>
                <span className={`text-[10px] font-semibold leading-none mt-0.5 transition-colors ${
                  active ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {label}
                </span>
              </Link>
            )
          })}
          <form action={logoutAction} className="flex flex-col items-center">
            <button
              type="submit"
              className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-2xl transition-all active:scale-90 text-gray-400 dark:text-gray-500"
            >
              <span className="text-xl leading-none">🚪</span>
              <span className="text-[10px] font-semibold leading-none mt-0.5">Keluar</span>
            </button>
          </form>
        </div>
      </div>
    </nav>
  )
}
