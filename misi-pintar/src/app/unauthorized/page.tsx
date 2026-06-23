import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 p-4">
      <div className="text-center max-w-sm w-full animate-scale-in">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-red-100 mb-6 animate-pop-in">
          <span className="text-5xl">🚫</span>
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Akses Ditolak</h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          Kamu tidak memiliki izin untuk mengakses halaman ini.
        </p>
        <Link
          href="/login"
          className="btn-press inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-100 transition-all text-sm"
        >
          ← Kembali ke Login
        </Link>
      </div>
    </div>
  )
}
