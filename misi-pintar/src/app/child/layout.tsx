import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { logoutAction } from '@/actions/auth'

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
    <div className="min-h-screen bg-gradient-to-b from-emerald-500 via-emerald-600 to-emerald-700 relative">
      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute top-32 -left-16 w-48 h-48 bg-teal-400/20 rounded-full blur-2xl" />
      </div>

      {/* ── Top header (mobile only shows logo) ── */}
      <header className="relative z-10 flex items-center justify-between px-4 pt-4 pb-2">
        <Link href="/child/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <span className="text-base">🎯</span>
          </div>
          <span className="font-black text-white text-sm">Misi Pintar</span>
        </Link>

        {/* Desktop inline nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-emerald-100 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-white/10 transition-all"
            >
              {label}
            </Link>
          ))}
          <form action={logoutAction}>
            <button type="submit" className="text-emerald-100 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-white/10 transition-all">
              Keluar
            </button>
          </form>
        </nav>
      </header>

      {/* ── Content ── */}
      <div className="relative z-10 max-w-sm mx-auto px-4 pb-28">
        {children}
      </div>

      {/* ── Mobile Bottom Nav (glassy) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 pb-safe">
        <div className="mx-3 mb-3 bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50">
          <div className="flex items-center justify-around px-2 py-3">
            {navLinks.map(({ href, icon, label }) => (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-0.5 px-2 rounded-2xl transition-all active:scale-90"
              >
                <span className="text-xl leading-none">{icon}</span>
                <span className="text-[10px] text-gray-600 font-semibold leading-none mt-0.5">{label}</span>
              </Link>
            ))}
            <form action={logoutAction} className="flex flex-col items-center">
              <button type="submit" className="flex flex-col items-center gap-0.5 px-2 rounded-2xl transition-all active:scale-90">
                <span className="text-xl leading-none">🚪</span>
                <span className="text-[10px] text-gray-600 font-semibold leading-none mt-0.5">Keluar</span>
              </button>
            </form>
          </div>
        </div>
      </nav>
    </div>
  )
}
