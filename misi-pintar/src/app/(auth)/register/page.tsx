'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { registerFamilySpace } from '@/actions/auth'

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [spaceCode, setSpaceCode] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await registerFamilySpace(formData)
      if (result.success) {
        setSpaceCode(result.data.spaceCode)
      } else {
        setError(result.error)
      }
    })
  }

  if (spaceCode) {
    return (
      <div className="animate-scale-in">
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-8 text-center">
          <div className="animate-pop-in inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-4">
            <span className="text-4xl">🎉</span>
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Selamat!</h2>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            FamilySpace berhasil dibuat. Simpan kode ini — anak-anakmu membutuhkannya untuk login.
          </p>

          <div className="animate-fade-up delay-200 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 mb-6 border border-emerald-100">
            <p className="text-xs text-emerald-700 font-bold uppercase tracking-widest mb-3">🏠 Kode Keluarga</p>
            <p className="text-5xl font-black tracking-[0.4em] text-emerald-700 font-mono">
              {spaceCode}
            </p>
          </div>

          <p className="text-xs text-gray-400 mb-6 leading-relaxed">
            📸 Screenshot atau catat kode ini sekarang. Kamu juga bisa melihatnya di pengaturan.
          </p>

          <button
            onClick={() => router.push('/login')}
            className="btn-press w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold rounded-2xl shadow-md shadow-emerald-100 transition-all text-sm"
          >
            Lanjut ke Login →
          </button>
        </div>
      </div>
    )
  }

  const inputClass = 'w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-gray-50 focus:bg-white transition-all'

  return (
    <div className="animate-fade-up">
      {/* Logo */}
      <div className="text-center mb-6">
        <div className="animate-pop-in inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 mb-3 shadow-lg shadow-emerald-200">
          <span className="text-3xl">🎯</span>
        </div>
        <h1 className="text-2xl font-black text-gray-900">Buat FamilySpace</h1>
        <p className="text-gray-500 text-sm mt-1">Mulai perjalanan finansial keluargamu</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-6">
        {error && (
          <div className="animate-scale-in mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">Nama Lengkap</label>
            <input name="ownerName" type="text" required minLength={2}
              placeholder="Nama orang tua" className={inputClass} />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">Email</label>
            <input name="email" type="email" required autoComplete="email"
              placeholder="nama@email.com" className={inputClass} />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">Password</label>
            <input name="password" type="password" required minLength={8}
              autoComplete="new-password" placeholder="Minimal 8 karakter" className={inputClass} />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">Nama Keluarga</label>
            <input name="familyName" type="text" required minLength={2}
              placeholder="cth: Keluarga Budi" className={inputClass} />
            <p className="text-xs text-gray-400 px-1">Nama ini terlihat oleh semua anggota keluarga</p>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="btn-press w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 disabled:from-emerald-300 disabled:to-emerald-300 text-white font-bold rounded-2xl shadow-md shadow-emerald-100 transition-all text-sm mt-2"
          >
            {isPending
              ? <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Membuat akun...
                </span>
              : 'Buat FamilySpace 🏠'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          Sudah punya akun?{' '}
          <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-bold">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  )
}
