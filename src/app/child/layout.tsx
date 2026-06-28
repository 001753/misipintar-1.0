import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { logoutAction } from '@/actions/auth'
import ThemeToggle from '@/components/ThemeToggle'
import ChildBottomNav from '@/components/ChildBottomNav'

export const dynamic = 'force-dynamic';

export default async function ChildLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || session.user.role !== 'CHILD') redirect('/login')

  const navLinks = [
    { href: '/child/dashboard', icon: '🏠', label: 'Beranda' },
    { href: '/child/tasks',     icon: '🎯', label: 'Misi' },
    { href: '/child/transfer',  icon: '💸', label: 'Transfer' },
    { href: '/child/history',   icon: '📜', label: 'Riwayat' },
    { href: '/child/settings',  icon: '⚙️', label: 'Profil' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-500 via-emerald-600 to-emerald-700 dark:from-emerald-950 dark:via-gray-950 dark:to-gray-950 relative transition-colors duration-200">
      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 dark:bg-emerald-400/5 rounded-full blur-3xl" />
        <div className="absolute top-32 -left-16 w-48 h-48 bg-teal-400/20 dark:bg-teal-500/10 rounded-full blur-2xl" />
      </div>

      {/* ── Top header ── */}
      <header className="relative z-10 flex items-center justify-between px-4 pt-4 pb-2">
        <Link href="/child/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-white/20 dark:bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <span className="text-base">🎯</span>
          </div>
          <span className="font-black text-white dark:text-gray-100 text-sm">Misi Pintar</span>
        </Link>

        {/* Desktop inline nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-emerald-100 dark:text-gray-300 hover:text-white dark:hover:text-white text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-white/10 transition-all"
            >
              {label}
            </Link>
          ))}
          <form action={logoutAction}>
            <button type="submit" className="text-emerald-100 dark:text-gray-300 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-white/10 transition-all">
              Keluar
            </button>
          </form>
          <ThemeToggle className="text-white/70 hover:text-white hover:bg-white/10" />
        </nav>

        {/* Mobile theme toggle */}
        <div className="md:hidden">
          <ThemeToggle className="text-white/70 hover:text-white hover:bg-white/10" />
        </div>
      </header>

      {/* ── Content ── */}
      <div className="relative z-10 max-w-sm mx-auto px-4 pb-28">
        {children}

        {/* ── Powered By Footer ── */}
        <div className="mt-8 pt-5 border-t border-white/10 dark:border-gray-800 flex justify-center">
          <div className="flex items-center gap-2 group">
            <span className="text-[10px] font-medium text-white/30 dark:text-gray-600 uppercase tracking-[0.15em]">Powered by</span>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-md bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm shadow-amber-400/30">
                <span className="text-[7px] font-black text-white leading-none">JE</span>
              </div>
              <span className="text-[10px] font-black tracking-widest text-white/30 dark:text-gray-600 group-hover:text-amber-300 dark:group-hover:text-amber-400 transition-colors duration-300 uppercase">
                JOBEN ENTERPRISE
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile Bottom Nav (glassy) ── */}
      <ChildBottomNav />
    </div>
  )
}
