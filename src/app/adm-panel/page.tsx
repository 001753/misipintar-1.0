'use client'
export const dynamic = 'force-dynamic'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { loginSuperAdmin } from '@/actions/auth'

const LOCKOUT_SECONDS = 15 * 60

export default function AdminLoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, startTransition] = useTransition()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (!isRateLimited || countdown <= 0) return
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setIsRateLimited(false)
          setError(null)
          clearInterval(timerRef.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current!)
  }, [isRateLimited, countdown])

  function formatCountdown(s: number) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (isRateLimited || isPending) return
    setError(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await loginSuperAdmin(formData)
      if (result.success) {
        router.push('/superadmin')
        router.refresh()
      } else {
        if (result.error?.includes('Terlalu banyak')) {
          setIsRateLimited(true)
          setCountdown(LOCKOUT_SECONDS)
        }
        setError(result.error ?? 'Terjadi kesalahan.')
      }
    })
  }

  return (
    <div className="w-full max-w-sm">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-800 border border-gray-700 mb-4">
          <span className="text-2xl">🛡️</span>
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">Admin Panel</h1>
        <p className="text-gray-500 text-sm mt-1">Misi Pintar — Akses Terbatas</p>
      </div>

      {/* Card */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-7 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Email Admin
            </label>
            <input
              name="email"
              type="email"
              required
              autoComplete="username"
              placeholder="admin@domain.com"
              disabled={isPending || isRateLimited}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="••••••••••"
                disabled={isPending || isRateLimited}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition pr-12"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition text-sm select-none"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 bg-red-950/60 border border-red-800/60 rounded-xl px-4 py-3">
              <span className="text-red-400 text-sm mt-0.5 flex-shrink-0">⚠️</span>
              <p className="text-red-300 text-sm leading-snug">{error}</p>
            </div>
          )}

          {/* Rate limit warning */}
          {isRateLimited && countdown > 0 && (
            <div className="flex items-center gap-2.5 bg-orange-950/60 border border-orange-800/60 rounded-xl px-4 py-3">
              <span className="text-orange-400 text-sm flex-shrink-0">🔒</span>
              <p className="text-orange-300 text-sm">
                Akun dikunci. Coba lagi dalam{' '}
                <span className="font-bold font-mono">{formatCountdown(countdown)}</span>
              </p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending || isRateLimited}
            className="w-full py-3 px-4 bg-red-600 hover:bg-red-500 active:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-sm tracking-wide mt-1"
          >
            {isPending
              ? 'Memverifikasi...'
              : isRateLimited
              ? `Terkunci ${formatCountdown(countdown)}`
              : 'Masuk ke Panel Admin'}
          </button>
        </form>
      </div>

      {/* Footer */}
      <div className="text-center mt-6 space-y-1">
        <p className="text-gray-600 text-xs">
          Akses ini direkam dan diaudit secara penuh.
        </p>
        <a
          href="/login"
          className="text-gray-600 hover:text-gray-400 text-xs transition-colors"
        >
          ← Kembali ke halaman utama
        </a>
      </div>
    </div>
  )
}
