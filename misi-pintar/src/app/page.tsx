import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function HomePage() {
  const session = await auth()

  if (session) {
    const role = session.user.role
    if (role === 'PARENT') redirect('/dashboard')
    if (role === 'CHILD') redirect('/child/dashboard')
    if (role === 'SUPER_ADMIN') redirect('/superadmin')
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Decorative background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-float" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float delay-300" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-teal-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float delay-500" />
      </div>

      <div className="text-center max-w-sm w-full relative z-10">
        {/* Logo */}
        <div className="animate-pop-in flex justify-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-2xl shadow-emerald-300">
              <span className="text-5xl">🎯</span>
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center shadow-lg animate-bounce-soft">
              <span className="text-sm">⭐</span>
            </div>
          </div>
        </div>

        {/* Headline */}
        <div className="animate-fade-up delay-100">
          <h1 className="text-4xl font-black text-gray-900 leading-tight">
            Misi <span className="gradient-text">Pintar</span>
          </h1>
          <p className="text-gray-500 mt-3 leading-relaxed text-sm px-4">
            Platform gamifikasi keuangan untuk keluarga. Ajarkan anak nilai uang dengan cara yang menyenangkan.
          </p>
        </div>

        {/* Feature pills */}
        <div className="animate-fade-up delay-200 flex flex-wrap justify-center gap-2 mt-5">
          {['🎮 Gamifikasi', '💰 Saldo Virtual', '✅ Misi Tugas', '📊 Laporan'].map((f) => (
            <span
              key={f}
              className="px-3 py-1 bg-white border border-gray-100 shadow-sm rounded-full text-xs font-medium text-gray-600"
            >
              {f}
            </span>
          ))}
        </div>

        {/* CTAs */}
        <div className="animate-fade-up delay-300 flex flex-col gap-3 mt-8">
          <Link
            href="/register"
            className="btn-press w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 transition-all text-sm"
          >
            Mulai Gratis Sekarang 🚀
          </Link>
          <Link
            href="/login"
            className="btn-press w-full py-4 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-2xl border border-gray-200 shadow-sm transition-all text-sm"
          >
            Sudah punya akun? Masuk
          </Link>
        </div>

        {/* Social proof */}
        <p className="animate-fade-in delay-500 text-xs text-gray-400 mt-6">
          Dipercaya ribuan keluarga Indonesia 🇮🇩
        </p>
      </div>
    </main>
  )
}
