'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { loginParent, loginChild } from '@/actions/auth'

type Tab = 'parent' | 'child'

const LOCKOUT_SECONDS = 15 * 60 // 15 menit

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>('parent')
  const [error, setError] = useState<string | null>(null)
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [isPending, startTransition] = useTransition()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const router = useRouter()

  // [7.5] Countdown timer saat rate limited
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

  function formatCountdown(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (isRateLimited) return
    setError(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const action = tab === 'parent' ? loginParent : loginChild
      const result = await action(formData)
      if (result.success) {
        router.push(tab === 'parent' ? '/dashboard' : '/child/dashboard')
        router.refresh()
      } else {
        // [7.5] Deteksi rate limit — tampilkan countdown
        if (
          result.error?.includes('Terlalu banyak') ||
          result.error?.includes('terkunci')
        ) {
          setIsRateLimited(true)
          setCountdown(LOCKOUT_SECONDS)
        }
        setError(result.error)
      }
    })
  }

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm disabled:bg-gray-50 disabled:text-gray-400'

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600 mb-4">
          <span className="text-3xl">🎯</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Misi Pintar</h1>
        <p className="text-gray-500 text-sm mt-1">Platform keuangan keluarga yang menyenangkan</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        {/* Tab switcher */}
        <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
          <button
            type="button"
            onClick={() => { setTab('parent'); setError(null); setIsRateLimited(false) }}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              tab === 'parent'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            👨‍👩‍👧 Orang Tua
          </button>
          <button
            type="button"
            onClick={() => { setTab('child'); setError(null); setIsRateLimited(false) }}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              tab === 'child'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            👧 Anak
          </button>
        </div>

        {/* [7.5] Rate limit banner dengan countdown */}
        {isRateLimited && (
          <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <p className="text-amber-800 text-sm font-semibold mb-1">
              🔒 Akun terkunci sementara
            </p>
            <p className="text-amber-700 text-xs">
              Terlalu banyak percobaan login gagal. Coba lagi dalam:
            </p>
            <p className="text-amber-900 text-2xl font-mono font-bold mt-2 text-center tracking-widest">
              {formatCountdown(countdown)}
            </p>
          </div>
        )}

        {/* Error biasa (bukan rate limit) */}
        {error && !isRateLimited && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'parent' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="nama@email.com"
                  disabled={isRateLimited}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  disabled={isRateLimited}
                  className={inputClass}
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kode Keluarga
                </label>
                <input
                  name="spaceCode"
                  type="text"
                  required
                  maxLength={6}
                  pattern="[0-9]{6}"
                  placeholder="123456"
                  disabled={isRateLimited}
                  className={`${inputClass} tracking-widest text-center font-mono`}
                />
                <p className="text-xs text-gray-400 mt-1">Kode 6 digit dari orang tua</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  name="username"
                  type="text"
                  required
                  placeholder="username-kamu"
                  disabled={isRateLimited}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="••••••"
                  disabled={isRateLimited}
                  className={inputClass}
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isPending || isRateLimited}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-sm"
          >
            {isPending
              ? 'Masuk...'
              : isRateLimited
              ? `Tunggu ${formatCountdown(countdown)}`
              : 'Masuk'}
          </button>
        </form>

        {tab === 'parent' && (
          <p className="text-center text-sm text-gray-500 mt-4">
            Belum punya akun?{' '}
            <Link href="/register" className="text-emerald-600 hover:text-emerald-700 font-medium">
              Daftar sekarang
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
