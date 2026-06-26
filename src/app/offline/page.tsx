export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import Link from 'next/link'
import ReloadButton from '@/components/ReloadButton'

export const metadata: Metadata = {
  title: 'Tidak Ada Koneksi',
  description: 'Halaman ini tersimpan secara offline.',
  robots: { index: false, follow: false },
}

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 text-center">
      {/* Icon */}
      <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-emerald-500/10 border border-emerald-500/20">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 text-emerald-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 3l18 18M10.584 10.587a2 2 0 002.828 2.83M7.05 7.05A7 7 0 0117.95 17.95M12 20.5A8.38 8.38 0 013.5 12 8.38 8.38 0 0112 3.5"
          />
        </svg>
      </div>

      {/* Text */}
      <h1 className="text-3xl font-black text-white mb-3 tracking-tight">
        Tidak Ada Koneksi
      </h1>
      <p className="text-slate-400 text-lg max-w-sm leading-relaxed mb-2">
        Periksa koneksi internet kamu, lalu coba lagi.
      </p>
      <p className="text-slate-600 text-sm mb-10">
        Beberapa halaman sudah tersimpan offline dan bisa diakses tanpa internet.
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <ReloadButton />
        <Link
          href="/"
          className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-semibold px-8 py-3 transition-colors"
        >
          Kembali ke Beranda
        </Link>
      </div>

      {/* Branding */}
      <div className="mt-16 flex items-center gap-2 text-slate-600 text-sm">
        <span className="text-lg">🎯</span>
        <span>MisiPintar</span>
      </div>
    </div>
  )
}
