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
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-emerald-600 mb-6">
          <span className="text-4xl">🎯</span>
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-3">Misi Pintar</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          Platform gamifikasi keuangan untuk keluarga. Ajarkan anak nilai uang dengan cara yang menyenangkan.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/register"
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors"
          >
            Mulai Gratis
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl border border-gray-200 transition-colors"
          >
            Masuk
          </Link>
        </div>
      </div>
    </main>
  )
}
