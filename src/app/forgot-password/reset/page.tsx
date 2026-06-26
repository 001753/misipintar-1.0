'use client'
export const dynamic = 'force-dynamic'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { resetPasswordWithToken } from '@/actions/auth'

export default function ResetPasswordPage() {
  const [resetToken, setResetToken] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  useEffect(() => {
    const token = sessionStorage.getItem('fp_reset_token')
    if (!token) {
      router.replace('/forgot-password')
      return
    }
    setResetToken(token)
  }, [router])

  const checks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    match: password === confirm && confirm.length > 0,
  }
  const allValid = Object.values(checks).every(Boolean)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!allValid) {
      setError('Password belum memenuhi semua syarat.')
      return
    }
    setError(null)

    const formData = new FormData()
    formData.set('resetToken', resetToken)
    formData.set('password', password)

    startTransition(async () => {
      const result = await resetPasswordWithToken(formData)
      if (result.success) {
        sessionStorage.removeItem('fp_reset_token')
        setSuccess(true)
      } else {
        setError(result.error ?? 'Reset password gagal.')
      }
    })
  }

  if (success) {
    return (
      <div className="animate-scale-in">
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-8 text-center">
          <div className="animate-pop-in inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-4">
            <span className="text-4xl">✅</span>
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Password Berhasil Diubah!</h2>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            Password baru kamu sudah aktif. Sekarang login dengan nomor WhatsApp dan password baru.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="btn-press w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold rounded-2xl shadow-md shadow-emerald-100 transition-all text-sm"
          >
            Login Sekarang →
          </button>
        </div>
      </div>
    )
  }

  const inputClass =
    'w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-gray-50 focus:bg-white transition-all disabled:opacity-50 pr-12'

  return (
    <div className="animate-fade-up">
      <div className="text-center mb-6">
        <div className="animate-pop-in inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 mb-3 shadow-lg shadow-emerald-200">
          <span className="text-3xl">🔒</span>
        </div>
        <h1 className="text-2xl font-black text-gray-900">Password Baru</h1>
        <p className="text-gray-500 text-sm mt-1">Buat password yang kuat dan mudah diingat</p>
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
              Password Baru
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null) }}
                required
                disabled={isPending}
                placeholder="Min 8 karakter"
                className={inputClass}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">
              Konfirmasi Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setError(null) }}
                required
                disabled={isPending}
                placeholder="Ulangi password baru"
                className={inputClass}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Password checklist */}
          {password.length > 0 && (
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 space-y-1.5">
              {[
                { key: 'length', label: 'Minimal 8 karakter' },
                { key: 'upper', label: 'Minimal 1 huruf kapital (A-Z)' },
                { key: 'number', label: 'Minimal 1 angka (0-9)' },
                { key: 'match', label: 'Password cocok' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2">
                  <span className={`text-sm ${checks[key as keyof typeof checks] ? 'text-emerald-500' : 'text-gray-300'}`}>
                    {checks[key as keyof typeof checks] ? '✅' : '○'}
                  </span>
                  <span className={`text-xs ${checks[key as keyof typeof checks] ? 'text-emerald-700' : 'text-gray-400'}`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending || !allValid}
            className="btn-press w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-md shadow-emerald-100 transition-all text-sm mt-2"
          >
            {isPending
              ? <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Menyimpan password...
                </span>
              : 'Simpan Password Baru 🔐'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          <Link href="/login" className="text-gray-400 hover:text-gray-600 font-semibold">
            ← Kembali ke Login
          </Link>
        </p>
      </div>
    </div>
  )
}
