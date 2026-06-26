'use client'
export const dynamic = 'force-dynamic'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { verifyForgotPasswordOtp, sendForgotPasswordOtp } from '@/actions/auth'

const OTP_LENGTH = 6
const RESEND_COOLDOWN = 60

export default function VerifyOtpPage() {
  const [phone, setPhone] = useState<string>('')
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isResending, startResend] = useTransition()
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN)
  const [canResend, setCanResend] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()

  useEffect(() => {
    const saved = sessionStorage.getItem('fp_phone')
    if (!saved) {
      router.replace('/forgot-password')
      return
    }
    setPhone(saved)
    inputRefs.current[0]?.focus()
  }, [router])

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) { setCanResend(true); return }
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  function handleDigitChange(index: number, val: string) {
    const char = val.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = char
    setDigits(next)
    setError(null)
    if (char && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    const next = Array(OTP_LENGTH).fill('')
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i]
    setDigits(next)
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1)
    inputRefs.current[focusIdx]?.focus()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const code = digits.join('')
    if (code.length !== OTP_LENGTH) {
      setError('Masukkan 6 digit kode OTP')
      return
    }
    setError(null)

    const formData = new FormData()
    formData.set('phone', phone)
    formData.set('code', code)

    startTransition(async () => {
      const result = await verifyForgotPasswordOtp(formData)
      if (result.success) {
        sessionStorage.setItem('fp_reset_token', result.data.resetToken)
        sessionStorage.removeItem('fp_phone')
        router.push('/forgot-password/reset')
      } else {
        setError(result.error ?? 'Verifikasi gagal.')
        setDigits(Array(OTP_LENGTH).fill(''))
        inputRefs.current[0]?.focus()
      }
    })
  }

  function handleResend() {
    if (!canResend || !phone) return
    const formData = new FormData()
    formData.set('phone', phone)
    startResend(async () => {
      await sendForgotPasswordOtp(formData)
      setCanResend(false)
      setCooldown(RESEND_COOLDOWN)
      setDigits(Array(OTP_LENGTH).fill(''))
      setError(null)
      inputRefs.current[0]?.focus()
    })
  }

  const maskedPhone = phone
    ? phone.slice(0, 4) + '****' + phone.slice(-4)
    : '...'

  return (
    <div className="animate-fade-up">
      <div className="text-center mb-6">
        <div className="animate-pop-in inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 mb-3 shadow-lg shadow-emerald-200">
          <span className="text-3xl">📲</span>
        </div>
        <h1 className="text-2xl font-black text-gray-900">Masukkan Kode OTP</h1>
        <p className="text-gray-500 text-sm mt-1">
          Kode telah dikirim ke WhatsApp
        </p>
        <p className="text-emerald-600 font-bold text-sm">{maskedPhone}</p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-6">
        {error && (
          <div className="animate-scale-in mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* OTP Input Boxes */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide px-1 mb-3 text-center">
              Kode OTP (6 digit)
            </label>
            <div className="flex justify-center gap-2">
              {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digits[i]}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={i === 0 ? handlePaste : undefined}
                  disabled={isPending}
                  className={`w-12 h-14 text-center text-xl font-black rounded-2xl border-2 transition-all duration-150 focus:outline-none
                    ${digits[i]
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 bg-gray-50 text-gray-900'
                    }
                    focus:border-emerald-500 focus:bg-white disabled:opacity-50`}
                />
              ))}
            </div>
            <p className="text-center text-xs text-gray-400 mt-3">
              Cek WhatsApp kamu. Kode berlaku 10 menit.
            </p>
          </div>

          <button
            type="submit"
            disabled={isPending || digits.join('').length < OTP_LENGTH}
            className="btn-press w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-md shadow-emerald-100 transition-all text-sm"
          >
            {isPending
              ? <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Memverifikasi...
                </span>
              : 'Verifikasi OTP →'}
          </button>
        </form>

        {/* Resend */}
        <div className="mt-5 text-center">
          {canResend ? (
            <button
              onClick={handleResend}
              disabled={isResending}
              className="text-emerald-600 hover:text-emerald-700 text-sm font-bold underline underline-offset-2 disabled:opacity-50"
            >
              {isResending ? 'Mengirim ulang...' : '📲 Kirim ulang OTP'}
            </button>
          ) : (
            <p className="text-gray-400 text-sm">
              Kirim ulang dalam{' '}
              <span className="font-mono font-bold text-gray-600">{cooldown}s</span>
            </p>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          <Link href="/forgot-password" className="text-gray-400 hover:text-gray-600 font-semibold">
            ← Ganti nomor
          </Link>
        </p>
      </div>
    </div>
  )
}
