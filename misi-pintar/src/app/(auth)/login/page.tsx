'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { loginParent, loginChild } from '@/actions/auth'

type Tab = 'parent' | 'child'

const LOCKOUT_SECONDS = 15 * 60

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>('parent')
  const [error, setError] = useState<string | null>(null)
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [countdown, setCountdown] = useState(0)
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
        if (result.error?.includes('Terlalu banyak') || result.error?.includes('terkunci')) {
          setIsRateLimited(true)
          setCountdown(LOCKOUT_SECONDS)
        }
        setError(result.error)
      }
    })
  }

  const inputClass =
    'w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-gray-50 focus:bg-white transition-all disabled:opacity-50'

  return (
    <div className="animate-fade-up">
      {/* Logo */}
      <div className="text-center mb-6">
        <div className="animate-pop-in inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 mb-3 shadow-lg shadow-emerald-200">
          <span className="text-3xl">🎯</span>
        </div>
        <h1 className="text-2xl font-black text-gray-900">Misi Pintar</h1>
        <p className="text-gray-500 text-sm mt-1">Platform keuangan keluarga yang menyenangkan</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-6">
        {/* Tab switcher */}
        <div className="flex rounded-2xl bg-gray-100 p-1 mb-6 gap-1">
          {(['parent', 'child'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setTab(t); setError(null); setIsRateLimited(false) }}
              className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                tab === t
                  ? 'bg-white text-gray-900 shadow-sm scale-[1.02]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'parent' ? '👨‍👩‍👧 Orang Tua' : '👧 Anak'}
            </button>
          ))}
        </div>

        {/* Rate limit banner */}
        {isRateLimited && (
          <div className="animate-scale-in mb-4 p-4 rounded-2xl bg-amber-50 border border-amber-200">
            <p className="text-amber-800 text-sm font-bold mb-1">🔒 Akun terkunci sementara</p>
            <p className="text-amber-700 text-xs">Terlalu banyak percobaan. Coba lagi dalam:</p>
            <p className="text-amber-900 text-3xl font-mono font-black mt-2 text-center tracking-widest">
              {formatCountdown(countdown)}
            </p>
          </div>
        )}

        {/* Error */}
        {error && !isRateLimited && (
          <div className="animate-scale-in mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'parent' ? (
            <>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">Email</label>
                <input name="email" type="email" required autoComplete="email"
                  placeholder="nama@email.com" disabled={isRateLimited} className={inputClass} />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">Password</label>
                <input name="password" type="password" required autoComplete="current-password"
                  placeholder="••••••••" disabled={isRateLimited} className={inputClass} />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">Kode Keluarga</label>
                <input name="spaceCode" type="text" required maxLength={6} pattern="[0-9]{6}"
                  placeholder="123456" disabled={isRateLimited}
                  className={`${inputClass} tracking-[0.5em] text-center font-mono text-lg`} />
                <p className="text-xs text-gray-400 px-1">Kode 6 digit dari orang tua</p>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">Username</label>
                <input name="username" type="text" required placeholder="username-kamu"
                  disabled={isRateLimited} className={inputClass} />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">Password</label>
                <input name="password" type="password" required placeholder="••••••"
                  disabled={isRateLimited} className={inputClass} />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isPending || isRateLimited}
            className="btn-press w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-md shadow-emerald-100 transition-all text-sm mt-2"
          >
            {isPending
              ? <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Masuk...
                </span>
              : isRateLimited
              ? `🔒 Tunggu ${formatCountdown(countdown)}`
              : 'Masuk →'}
          </button>
        </form>

        {tab === 'parent' && (
          <p className="text-center text-sm text-gray-500 mt-5">
            Belum punya akun?{' '}
            <Link href="/register" className="text-emerald-600 hover:text-emerald-700 font-bold">
              Daftar gratis
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
