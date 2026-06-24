'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { sendForgotPasswordOtp } from '@/actions/auth'

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await sendForgotPasswordOtp(formData)
      if (result.success) {
        // Simpan phone di sessionStorage untuk langkah berikutnya
        sessionStorage.setItem('fp_phone', result.data.phone)
        router.push('/forgot-password/verify')
      } else {
        setError(result.error ?? 'Terjadi kesalahan.')
      }
    })
  }

  const inputClass =
    'w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-gray-50 focus:bg-white transition-all disabled:opacity-50'

  return (
    <div className="animate-fade-up">
      <div className="text-center mb-6">
        <div className="animate-pop-in inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 mb-3 shadow-lg shadow-emerald-200">
          <span className="text-3xl">🔑</span>
        </div>
        <h1 className="text-2xl font-black text-gray-900">Lupa Password?</h1>
        <p className="text-gray-500 text-sm mt-1">
          Kami kirim kode OTP ke nomor WhatsApp kamu
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-6">
        {/* Info box */}
        <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
          <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0">📱</span>
            <div>
              <p className="text-emerald-800 text-sm font-semibold">Via WhatsApp</p>
              <p className="text-emerald-700 text-xs mt-0.5 leading-relaxed">
                Kode OTP 6 digit akan dikirim ke nomor WhatsApp yang kamu daftarkan. Berlaku 10 menit.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="animate-scale-in mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
                disabled={isPending}
                className={`${inputClass} pl-10`}
              />
            </div>
            <p className="text-xs text-gray-400 px-1">
              Masukkan nomor yang kamu daftarkan di Misi Pintar
            </p>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="btn-press w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-md shadow-emerald-100 transition-all text-sm mt-2"
          >
            {isPending
              ? <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Mengirim OTP...
                </span>
              : 'Kirim OTP via WhatsApp 📲'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          Ingat password?{' '}
          <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-bold">
            Kembali ke Login
          </Link>
        </p>
      </div>
    </div>
  )
}
