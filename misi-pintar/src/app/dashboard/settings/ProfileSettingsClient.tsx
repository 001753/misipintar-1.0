'use client'

import { useState, useTransition, useRef } from 'react'
import { updateUserEmail, sendChangePhoneOtp, verifyAndChangePhone } from '@/actions/auth'

interface Props {
  user: {
    id: string
    name: string
    phone: string | null
    email: string | null
    role: string
  }
}

type PhoneStep = 'idle' | 'enter-new' | 'verify-otp' | 'done'
const OTP_LEN = 6
const RESEND_COOLDOWN = 60

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  )
}

export default function ProfileSettingsClient({ user }: Props) {
  // ── Email section ──────────────────────────────────────
  const [email, setEmail] = useState(user.email ?? '')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null)
  const [emailPending, startEmailTransition] = useTransition()

  // ── Change phone section ───────────────────────────────
  const [phoneStep, setPhoneStep] = useState<PhoneStep>('idle')
  const [newPhone, setNewPhone] = useState('')
  const [pendingPhone, setPendingPhone] = useState('') // normalized phone sent
  const [digits, setDigits] = useState<string[]>(Array(OTP_LEN).fill(''))
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [phoneSuccess, setPhoneSuccess] = useState<string | null>(null)
  const [phonePending, startPhoneTransition] = useTransition()
  const [cooldown, setCooldown] = useState(0)
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const inputClass =
    'w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-gray-50 focus:bg-white transition-all disabled:opacity-50'

  // ── Email handlers ────────────────────────────────────
  function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setEmailError(null)
    setEmailSuccess(null)
    startEmailTransition(async () => {
      const result = await updateUserEmail(user.id, email)
      if (result.success) setEmailSuccess('Email berhasil disimpan! ✅')
      else setEmailError(result.error ?? 'Gagal menyimpan email.')
    })
  }

  // ── Phone step 1: send OTP to new number ──────────────
  function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setPhoneError(null)
    startPhoneTransition(async () => {
      const result = await sendChangePhoneOtp(user.id, newPhone)
      if (result.success) {
        setPendingPhone(result.data.phone)
        setDigits(Array(OTP_LEN).fill(''))
        setPhoneStep('verify-otp')
        startCooldown()
        setTimeout(() => inputRefs.current[0]?.focus(), 100)
      } else {
        setPhoneError(result.error ?? 'Gagal mengirim OTP.')
      }
    })
  }

  // ── Phone step 2: verify OTP ──────────────────────────
  function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    const code = digits.join('')
    if (code.length !== OTP_LEN) { setPhoneError('Masukkan 6 digit kode OTP'); return }
    setPhoneError(null)
    startPhoneTransition(async () => {
      const result = await verifyAndChangePhone(user.id, pendingPhone, code)
      if (result.success) {
        setPhoneSuccess(`Nomor WhatsApp berhasil diubah ke ${result.data.newPhone} ✅`)
        setPhoneStep('done')
        clearCooldown()
      } else {
        setPhoneError(result.error ?? 'Verifikasi gagal.')
        setDigits(Array(OTP_LEN).fill(''))
        setTimeout(() => inputRefs.current[0]?.focus(), 100)
      }
    })
  }

  // ── Resend OTP ────────────────────────────────────────
  function handleResend() {
    if (cooldown > 0 || !pendingPhone) return
    setPhoneError(null)
    startPhoneTransition(async () => {
      const result = await sendChangePhoneOtp(user.id, pendingPhone)
      if (result.success) {
        setDigits(Array(OTP_LEN).fill(''))
        startCooldown()
        setTimeout(() => inputRefs.current[0]?.focus(), 100)
      } else {
        setPhoneError(result.error ?? 'Gagal mengirim ulang OTP.')
      }
    })
  }

  function startCooldown() {
    setCooldown(RESEND_COOLDOWN)
    clearCooldown()
    cooldownRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearCooldown(); return 0 }
        return c - 1
      })
    }, 1000)
  }
  function clearCooldown() {
    if (cooldownRef.current) clearInterval(cooldownRef.current)
  }

  function resetPhoneFlow() {
    setPhoneStep('idle')
    setNewPhone('')
    setPendingPhone('')
    setDigits(Array(OTP_LEN).fill(''))
    setPhoneError(null)
    clearCooldown()
    setCooldown(0)
  }

  // ── OTP digit input helpers ───────────────────────────
  function handleDigit(i: number, val: string) {
    const ch = val.replace(/\D/g, '').slice(-1)
    const next = [...digits]; next[i] = ch; setDigits(next)
    setPhoneError(null)
    if (ch && i < OTP_LEN - 1) inputRefs.current[i + 1]?.focus()
  }
  function handleDigitKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) inputRefs.current[i - 1]?.focus()
  }
  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LEN)
    const next = Array(OTP_LEN).fill('')
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i]
    setDigits(next)
    inputRefs.current[Math.min(pasted.length, OTP_LEN - 1)]?.focus()
  }

  const maskedNew = pendingPhone
    ? pendingPhone.slice(0, 5) + '****' + pendingPhone.slice(-3)
    : ''

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Pengaturan Profil</h1>
        <p className="text-gray-500 text-sm mt-1">Kelola informasi akun kamu</p>
      </div>

      {/* ── Kartu Info Akun ── */}
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
            <span className="text-xl opacity-40">✏️</span>
          </div>

          {/* Nomor WA — with change flow embedded */}
          <div className="rounded-2xl border border-emerald-100 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-3 bg-emerald-50">
              <div>
                <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide">No. WhatsApp (Login)</p>
                <p className="text-emerald-800 font-bold mt-0.5 font-mono text-sm">
                  {phoneStep === 'done' && pendingPhone ? pendingPhone : (user.phone ?? '—')}
                </p>
              </div>
              {phoneStep === 'idle' && user.role === 'PARENT' && (
                <button
                  onClick={() => { setPhoneStep('enter-new'); setPhoneError(null) }}
                  className="text-xs text-emerald-700 font-bold border border-emerald-300 bg-white px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-colors"
                >
                  Ganti
                </button>
              )}
              {phoneStep !== 'idle' && phoneStep !== 'done' && (
                <button onClick={resetPhoneFlow} className="text-xs text-gray-400 hover:text-gray-600 font-semibold px-2">
                  Batal
                </button>
              )}
            </div>

            {/* Step 1: Enter new number */}
            {phoneStep === 'enter-new' && (
              <div className="p-4 border-t border-emerald-100 bg-white">
                <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                  Masukkan nomor WhatsApp baru. Kami akan mengirim kode verifikasi ke nomor tersebut.
                </p>
                {phoneError && (
                  <div className="mb-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <span>⚠️</span> {phoneError}
                  </div>
                )}
                <form onSubmit={handleSendOtp} className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm select-none">📱</span>
                    <input
                      type="tel"
                      value={newPhone}
                      onChange={(e) => { setNewPhone(e.target.value); setPhoneError(null) }}
                      placeholder="0812-3456-7890"
                      required
                      disabled={phonePending}
                      autoComplete="tel"
                      className="w-full pl-9 pr-3 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-gray-50 focus:bg-white transition-all disabled:opacity-50"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={phonePending || !newPhone.trim()}
                    className="flex items-center gap-1.5 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-bold rounded-2xl text-sm transition-colors shrink-0"
                  >
                    {phonePending ? <Spinner /> : null}
                    {phonePending ? 'Mengirim...' : 'Kirim OTP'}
                  </button>
                </form>
              </div>
            )}

            {/* Step 2: OTP verification */}
            {phoneStep === 'verify-otp' && (
              <div className="p-4 border-t border-emerald-100 bg-white">
                <p className="text-xs text-gray-500 mb-1">
                  Kode OTP dikirim ke WhatsApp
                </p>
                <p className="text-sm font-bold text-emerald-700 mb-3">{maskedNew}</p>

                {phoneError && (
                  <div className="mb-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <span>⚠️</span> {phoneError}
                  </div>
                )}

                <form onSubmit={handleVerifyOtp} className="space-y-3">
                  {/* OTP boxes */}
                  <div className="flex justify-center gap-1.5">
                    {Array.from({ length: OTP_LEN }).map((_, i) => (
                      <input
                        key={i}
                        ref={(el) => { inputRefs.current[i] = el }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digits[i]}
                        onChange={(e) => handleDigit(i, e.target.value)}
                        onKeyDown={(e) => handleDigitKey(i, e)}
                        onPaste={i === 0 ? handlePaste : undefined}
                        disabled={phonePending}
                        className={`w-10 h-12 text-center text-lg font-black rounded-xl border-2 transition-all duration-150 focus:outline-none
                          ${digits[i] ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-gray-50 text-gray-900'}
                          focus:border-emerald-500 focus:bg-white disabled:opacity-50`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div>
                      {cooldown > 0 ? (
                        <p className="text-xs text-gray-400">
                          Kirim ulang dalam <span className="font-mono font-bold text-gray-600">{cooldown}s</span>
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResend}
                          disabled={phonePending}
                          className="text-xs text-emerald-600 font-bold hover:text-emerald-700 disabled:opacity-50 underline underline-offset-2"
                        >
                          Kirim ulang OTP
                        </button>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={phonePending || digits.join('').length < OTP_LEN}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-bold rounded-2xl text-sm transition-colors"
                    >
                      {phonePending ? <Spinner /> : null}
                      {phonePending ? 'Memverifikasi...' : 'Verifikasi →'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Done */}
            {phoneStep === 'done' && (
              <div className="px-4 py-3 border-t border-emerald-100 bg-emerald-50/60">
                <p className="text-emerald-700 text-xs font-semibold">
                  {phoneSuccess}
                </p>
                <p className="text-emerald-600 text-xs mt-0.5">
                  Refresh halaman untuk melihat perubahan pada sesi aktif.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50">
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Role</p>
              <p className="text-gray-900 font-semibold mt-0.5">
                {user.role === 'SUPER_ADMIN' ? '⭐ Super Admin' : '👨‍👩‍👧 Orang Tua'}
              </p>
            </div>
            <span className="text-xl opacity-40">🔖</span>
          </div>
        </div>
      </div>

      {/* ── Kartu Email ── */}
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
              Backup identitas selain nomor WhatsApp. Tidak wajib diisi.
            </p>
          </div>
        </div>

        {!user.email && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-100 flex items-start gap-2">
            <span className="text-base flex-shrink-0">💡</span>
            <p className="text-amber-700 text-xs leading-relaxed">
              Belum ada email. Tambahkan sekarang sebagai cadangan jika kamu mengganti nomor WhatsApp.
            </p>
          </div>
        )}

        {emailSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold">
            {emailSuccess}
          </div>
        )}
        {emailError && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
            <span>⚠️</span> {emailError}
          </div>
        )}

        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">
              Alamat Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(null); setEmailSuccess(null) }}
              placeholder="nama@email.com"
              disabled={emailPending}
              autoComplete="email"
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={emailPending || !email.trim() || email === (user.email ?? '')}
            className="btn-press w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-md shadow-emerald-100 transition-all text-sm"
          >
            {emailPending
              ? <span className="flex items-center justify-center gap-2"><Spinner /> Menyimpan...</span>
              : user.email ? 'Perbarui Email' : 'Simpan Email 📧'}
          </button>
        </form>
      </div>

      {/* ── Kartu Keamanan ── */}
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
              <p className="text-gray-600 text-sm mt-0.5">OTP via WhatsApp aktif</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl">
              ✅ Aktif
            </span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50">
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Sesi Login</p>
              <p className="text-gray-600 text-sm mt-0.5">Perangkat ini aktif</p>
            </div>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="text-xs text-red-500 hover:text-red-700 font-bold border border-red-100 px-3 py-1.5 rounded-xl hover:bg-red-50 transition-colors"
              >
                Keluar
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
