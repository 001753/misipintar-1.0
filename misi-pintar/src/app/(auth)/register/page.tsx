'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { registerFamilySpace } from '@/actions/auth'

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [spaceCode, setSpaceCode] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
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
        setError(result.error ?? 'Terjadi kesalahan.')
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

          <div className="animate-fade-up delay-200 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 mb-4 border border-emerald-100">
            <p className="text-xs text-emerald-700 font-bold uppercase tracking-widest mb-3">🏠 Kode Keluarga</p>
            <p className="text-5xl font-black tracking-[0.4em] text-emerald-700 font-mono">
              {spaceCode}
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-6 text-left">
            <p className="text-amber-700 text-xs font-semibold mb-1">💡 Tip: Lengkapi profil</p>
            <p className="text-amber-600 text-xs">
              Setelah login, kamu bisa menambahkan alamat email di halaman Profil untuk backup akun.
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
      <div className="text-center mb-6">
        <div className="animate-pop-in inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 mb-3 shadow-lg shadow-emerald-200">
          <span className="text-3xl">🎯</span>
        </div>
        <h1 className="text-2xl font-black text-gray-900">Buat FamilySpace</h1>
        <p className="text-gray-500 text-sm mt-1">Mulai perjalanan finansial keluargamu</p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-6">
        {error && (
          <div className="animate-scale-in mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">
              Nama Lengkap
            </label>
            <input name="ownerName" type="text" required minLength={2}
              placeholder="Nama orang tua" className={inputClass} />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">
              No. WhatsApp
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base select-none">📱</span>
              <input
                name="phone"
                type="tel"
                required
                autoComplete="tel"
                placeholder="0812-3456-7890"
                className={`${inputClass} pl-10`}
              />
            </div>
            <p className="text-xs text-gray-400 px-1">
              Untuk login & menerima OTP lupa password via WhatsApp
            </p>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">
              Password
            </label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Min 8 karakter, huruf kapital & angka"
                className={`${inputClass} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            <div className="flex gap-2 px-1 mt-1">
              <span className="text-xs text-gray-400">Syarat:</span>
              <span className="text-xs text-gray-400">• Min 8 karakter</span>
              <span className="text-xs text-gray-400">• 1 huruf kapital</span>
              <span className="text-xs text-gray-400">• 1 angka</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">
              Nama Keluarga
            </label>
            <input name="familyName" type="text" required minLength={2}
              placeholder="cth: Keluarga Budi" className={inputClass} />
            <p className="text-xs text-gray-400 px-1">Nama ini terlihat oleh semua anggota keluarga</p>
          </div>

          {/* Info email */}
          <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 flex items-start gap-2">
            <span className="text-base flex-shrink-0">ℹ️</span>
            <p className="text-blue-700 text-xs leading-relaxed">
              <strong>Email tidak wajib saat daftar.</strong> Kamu bisa menambahkan email nanti di halaman Profil setelah login.
            </p>
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
