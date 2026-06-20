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

  // Tampilkan kode setelah register berhasil
  if (spaceCode) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
            <span className="text-3xl">🎉</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Akun Berhasil Dibuat!</h2>
          <p className="text-gray-500 text-sm mb-6">
            Simpan kode keluarga ini. Anak-anakmu akan menggunakan kode ini untuk login.
          </p>

          <div className="bg-emerald-50 rounded-xl p-4 mb-6">
            <p className="text-xs text-emerald-700 font-medium mb-2">KODE KELUARGA</p>
            <p className="text-4xl font-black tracking-[0.3em] text-emerald-700 font-mono">
              {spaceCode}
            </p>
          </div>

          <p className="text-xs text-gray-400 mb-6">
            Screenshot atau catat kode ini. Kamu bisa melihatnya lagi di pengaturan akun.
          </p>

          <button
            onClick={() => router.push('/login')}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors text-sm"
          >
            Lanjut ke Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600 mb-4">
          <span className="text-3xl">🎯</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Buat FamilySpace</h1>
        <p className="text-gray-500 text-sm mt-1">Mulai perjalanan finansial keluargamu</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Lengkap
            </label>
            <input
              name="ownerName"
              type="text"
              required
              minLength={2}
              placeholder="Nama orang tua"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="nama@email.com"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Minimal 8 karakter"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Keluarga
            </label>
            <input
              name="familyName"
              type="text"
              required
              minLength={2}
              placeholder="cth: Keluarga Budi"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">Nama ini akan dilihat oleh anggota keluargamu</p>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold rounded-xl transition-colors text-sm mt-2"
          >
            {isPending ? 'Membuat akun...' : 'Buat FamilySpace'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Sudah punya akun?{' '}
          <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  )
}
