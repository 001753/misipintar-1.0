import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { logoutAction } from '@/actions/auth'

export default async function ChildLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || session.user.role !== 'CHILD') redirect('/login')

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-400 to-emerald-600">
      <header className="flex items-center justify-between px-4 py-3">
        <Link href="/child/dashboard" className="flex items-center gap-2 text-white">
          <span className="text-xl">🎯</span>
          <span className="font-bold text-sm">Misi Pintar</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/child/dashboard" className="text-emerald-100 hover:text-white text-xs font-medium">
            Beranda
          </Link>
          <Link href="/child/tasks" className="text-emerald-100 hover:text-white text-xs font-medium">
            Tugas
          </Link>
          <Link href="/child/history" className="text-emerald-100 hover:text-white text-xs font-medium">
            Riwayat
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="text-emerald-100 hover:text-white text-xs">
              Keluar
            </button>
          </form>
        </nav>
      </header>
      <div className="max-w-sm mx-auto px-4 pb-8">{children}</div>
    </div>
  )
}
