'use client'

import { useState, useTransition } from 'react'
import { updateUserEmail } from '@/actions/auth'

interface Props {
  user: {
    id: string
    name: string
    phone: string | null
    email: string | null
    role: string
  }
}

export default function ProfileSettingsClient({ user }: Props) {
  const [email, setEmail] = useState(user.email ?? '')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    startTransition(async () => {
      const result = await updateUserEmail(user.id, email)
      if (result.success) {
        setSuccess('Email berhasil disimpan! ✅')
      } else {
        setError(result.error ?? 'Gagal menyimpan email.')
      }
    })
  }

  const inputClass =
    'w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-gray-50 focus:bg-white transition-all disabled:opacity-50'

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Pengaturan Profil</h1>
        <p className="text-gray-500 text-sm mt-1">Kelola informasi akun kamu</p>
      </div>

      {/* Kartu Info Akun */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-bold text-gray-900 text-base flex items-center gap-2">
          <span className="text-xl">👤</span> Informasi Akun
        </h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50">
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Nama</p>
              <p className="text-gray-900 font-semibold mt-0.5">{user.name}</p>
            </div>
            <span className="text-2xl">✏️</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
            <div>
              <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide">No. WhatsApp (Login)</p>
              <p className="text-emerald-800 font-bold mt-0.5 font-mono">
                {user.phone ?? '—'}
              </p>
            </div>
            <span className="text-2xl">📱</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50">
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Role</p>
              <p className="text-gray-900 font-semibold mt-0.5">
                {user.role === 'SUPER_ADMIN' ? '⭐ Super Admin' : '👨‍👩‍👧 Orang Tua'}
              </p>
            </div>
            <span className="text-2xl">🔖</span>
          </div>
        </div>
      </div>

      {/* Kartu Tambah Email */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-xl">📧</span>
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-base">
              {user.email ? 'Email Terdaftar' : 'Tambahkan Email (Opsional)'}
            </h2>
            <p className="text-gray-500 text-sm mt-0.5 leading-relaxed">
              Email berguna untuk pemulihan akun tambahan dan notifikasi penting. Tidak wajib diisi.
            </p>
          </div>
        </div>

        {!user.email && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-100 flex items-start gap-2">
            <span className="text-base flex-shrink-0">💡</span>
            <p className="text-amber-700 text-xs leading-relaxed">
              Kamu belum menambahkan email. Tambahkan sekarang sebagai cadangan jika kamu mengganti nomor WhatsApp.
            </p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">
              Alamat Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); setSuccess(null) }}
              placeholder="nama@email.com"
              disabled={isPending}
              autoComplete="email"
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={isPending || !email.trim() || email === user.email}
            className="btn-press w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-md shadow-emerald-100 transition-all text-sm"
          >
            {isPending
              ? <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Menyimpan...
                </span>
              : user.email
              ? 'Perbarui Email'
              : 'Simpan Email 📧'}
          </button>
        </form>
      </div>

      {/* Info keamanan */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-gray-900 text-base flex items-center gap-2 mb-4">
          <span className="text-xl">🔐</span> Keamanan
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50">
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Password</p>
              <p className="text-gray-600 text-sm mt-0.5">••••••••••</p>
            </div>
            <a
              href="/forgot-password"
              className="text-xs text-emerald-600 hover:text-emerald-700 font-bold border border-emerald-200 px-3 py-1.5 rounded-xl hover:bg-emerald-50 transition-colors"
            >
              Ganti Password
            </a>
          </div>
          <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50">
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Verifikasi 2 Langkah</p>
              <p className="text-gray-600 text-sm mt-0.5">Via OTP WhatsApp</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl">
              ✅ Aktif
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
