'use client'

import { useState, useTransition, useRef } from 'react'
import { updateUserEmail, sendChangePhoneOtp, verifyAndChangePhone, changePassword } from '@/actions/auth'

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
type PwStep = 'idle' | 'form' | 'done'

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

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )
}

function CheckItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`flex items-center gap-1 text-xs transition-colors ${ok ? 'text-emerald-600 font-semibold' : 'text-gray-400'}`}>
      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0 transition-colors ${ok ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
        {ok ? '✓' : '•'}
      </span>
      {label}
    </span>
  )
}

export default function ProfileSettingsClient({ user }: Props) {
  const inputClass = 'w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-gray-50 focus:bg-white transition-all disabled:opacity-50'

  // ── Email ──────────────────────────────────────────────────────────────
  const [email, setEmail] = useState(user.email ?? '')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null)
  const [emailPending, startEmailTransition] = useTransition()

  function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setEmailError(null); setEmailSuccess(null)
    startEmailTransition(async () => {
      const r = await updateUserEmail(user.id, email)
      if (r.success) setEmailSuccess('Email berhasil disimpan! ✅')
      else setEmailError(r.error ?? 'Gagal menyimpan email.')
    })
  }

  // ── Ganti Nomor WA ────────────────────────────────────────────────────
  const [phoneStep, setPhoneStep] = useState<PhoneStep>('idle')
  const [newPhone, setNewPhone] = useState('')
  const [pendingPhone, setPendingPhone] = useState('')
  const [digits, setDigits] = useState<string[]>(Array(OTP_LEN).fill(''))
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [phoneSuccess, setPhoneSuccess] = useState<string | null>(null)
  const [phonePending, startPhoneTransition] = useTransition()
  const [cooldown, setCooldown] = useState(0)
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  function handleSendOtp(e: React.FormEvent) {
    e.preventDefault(); setPhoneError(null)
    startPhoneTransition(async () => {
      const r = await sendChangePhoneOtp(user.id, newPhone)
      if (r.success) {
        setPendingPhone(r.data.phone)
        setDigits(Array(OTP_LEN).fill(''))
        setPhoneStep('verify-otp')
        startCooldown()
        setTimeout(() => otpRefs.current[0]?.focus(), 100)
      } else setPhoneError(r.error ?? 'Gagal mengirim OTP.')
    })
  }

  function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    const code = digits.join('')
    if (code.length !== OTP_LEN) { setPhoneError('Masukkan 6 digit kode OTP'); return }
    setPhoneError(null)
    startPhoneTransition(async () => {
      const r = await verifyAndChangePhone(user.id, pendingPhone, code)
      if (r.success) {
        setPhoneSuccess(`Nomor berhasil diubah ke ${r.data.newPhone} ✅`)
        setPhoneStep('done'); clearCooldown()
      } else {
        setPhoneError(r.error ?? 'Verifikasi gagal.')
        setDigits(Array(OTP_LEN).fill(''))
        setTimeout(() => otpRefs.current[0]?.focus(), 100)
      }
    })
  }

  function handleResend() {
    if (cooldown > 0 || !pendingPhone) return
    setPhoneError(null)
    startPhoneTransition(async () => {
      const r = await sendChangePhoneOtp(user.id, pendingPhone)
      if (r.success) { setDigits(Array(OTP_LEN).fill('')); startCooldown(); setTimeout(() => otpRefs.current[0]?.focus(), 100) }
      else setPhoneError(r.error ?? 'Gagal mengirim ulang OTP.')
    })
  }

  function startCooldown() {
    setCooldown(RESEND_COOLDOWN); clearCooldown()
    cooldownRef.current = setInterval(() => {
      setCooldown(c => { if (c <= 1) { clearCooldown(); return 0 } return c - 1 })
    }, 1000)
  }
  function clearCooldown() { if (cooldownRef.current) clearInterval(cooldownRef.current) }
  function resetPhoneFlow() { setPhoneStep('idle'); setNewPhone(''); setPendingPhone(''); setDigits(Array(OTP_LEN).fill('')); setPhoneError(null); clearCooldown(); setCooldown(0) }

  function handleDigit(i: number, val: string) {
    const ch = val.replace(/\D/g, '').slice(-1)
    const next = [...digits]; next[i] = ch; setDigits(next); setPhoneError(null)
    if (ch && i < OTP_LEN - 1) otpRefs.current[i + 1]?.focus()
  }
  function handleDigitKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) otpRefs.current[i - 1]?.focus()
  }
  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LEN)
    const next = Array(OTP_LEN).fill(''); for (let i = 0; i < p.length; i++) next[i] = p[i]
    setDigits(next); otpRefs.current[Math.min(p.length, OTP_LEN - 1)]?.focus()
  }

  const maskedPhone = pendingPhone ? pendingPhone.slice(0, 5) + '****' + pendingPhone.slice(-3) : ''

  // ── Ganti Password ────────────────────────────────────────────────────
  const [pwStep, setPwStep] = useState<PwStep>('idle')
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwPending, startPwTransition] = useTransition()

  const pwChecks = {
    length: newPw.length >= 8,
    upper: /[A-Z]/.test(newPw),
    number: /[0-9]/.test(newPw),
    match: newPw.length > 0 && newPw === confirmPw,
  }
  const pwValid = Object.values(pwChecks).every(Boolean)

  function handlePwSubmit(e: React.FormEvent) {
    e.preventDefault(); setPwError(null)
    if (!pwValid) { setPwError('Pastikan semua syarat password terpenuhi.'); return }
    startPwTransition(async () => {
      const r = await changePassword(user.id, currentPw, newPw)
      if (r.success) {
        setPwStep('done')
        setCurrentPw(''); setNewPw(''); setConfirmPw('')
      } else setPwError(r.error ?? 'Gagal mengganti password.')
    })
  }

  function resetPwFlow() { setPwStep('idle'); setCurrentPw(''); setNewPw(''); setConfirmPw(''); setPwError(null); setShowCurrent(false); setShowNew(false); setShowConfirm(false) }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Pengaturan Profil</h1>
        <p className="text-gray-500 text-sm mt-1">Kelola informasi akun kamu</p>
      </div>

      {/* ────────────────────────────────── INFO AKUN */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-bold text-gray-900 text-base flex items-center gap-2">
          <span className="text-xl">👤</span> Informasi Akun
        </h2>

        <div className="space-y-3">
          {/* Nama */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50">
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Nama</p>
              <p className="text-gray-900 font-semibold mt-0.5">{user.name}</p>
            </div>
            <span className="text-xl opacity-30">✏️</span>
          </div>

          {/* Nomor WA + Ganti Flow */}
          <div className="rounded-2xl border border-emerald-100 overflow-hidden">
            <div className="flex items-center justify-between p-3 bg-emerald-50">
              <div>
                <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide">No. WhatsApp (Login)</p>
                <p className="text-emerald-800 font-bold mt-0.5 font-mono text-sm">
                  {phoneStep === 'done' && pendingPhone ? pendingPhone : (user.phone ?? '—')}
                </p>
              </div>
              {phoneStep === 'idle' && user.role === 'PARENT' && (
                <button onClick={() => { setPhoneStep('enter-new'); setPhoneError(null) }}
                  className="text-xs text-emerald-700 font-bold border border-emerald-300 bg-white px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-colors">
                  Ganti
                </button>
              )}
              {(phoneStep === 'enter-new' || phoneStep === 'verify-otp') && (
                <button onClick={resetPhoneFlow} className="text-xs text-gray-400 hover:text-gray-600 font-semibold px-2">Batal</button>
              )}
            </div>

            {/* Step 1 — nomor baru */}
            {phoneStep === 'enter-new' && (
              <div className="p-4 border-t border-emerald-100 bg-white">
                <p className="text-xs text-gray-500 mb-3 leading-relaxed">Masukkan nomor WhatsApp baru. Kode verifikasi akan dikirim ke nomor tersebut.</p>
                {phoneError && <div className="mb-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2"><span>⚠️</span>{phoneError}</div>}
                <form onSubmit={handleSendOtp} className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm select-none">📱</span>
                    <input type="tel" value={newPhone} onChange={(e) => { setNewPhone(e.target.value); setPhoneError(null) }}
                      placeholder="0812-3456-7890" required disabled={phonePending} autoComplete="tel"
                      className="w-full pl-9 pr-3 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-gray-50 focus:bg-white transition-all disabled:opacity-50" />
                  </div>
                  <button type="submit" disabled={phonePending || !newPhone.trim()}
                    className="flex items-center gap-1.5 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-bold rounded-2xl text-sm transition-colors shrink-0">
                    {phonePending && <Spinner />} {phonePending ? 'Mengirim...' : 'Kirim OTP'}
                  </button>
                </form>
              </div>
            )}

            {/* Step 2 — verifikasi OTP */}
            {phoneStep === 'verify-otp' && (
              <div className="p-4 border-t border-emerald-100 bg-white">
                <p className="text-xs text-gray-500 mb-0.5">Kode OTP dikirim ke WhatsApp</p>
                <p className="text-sm font-bold text-emerald-700 mb-3">{maskedPhone}</p>
                {phoneError && <div className="mb-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2"><span>⚠️</span>{phoneError}</div>}
                <form onSubmit={handleVerifyOtp} className="space-y-3">
                  <div className="flex justify-center gap-1.5">
                    {Array.from({ length: OTP_LEN }).map((_, i) => (
                      <input key={i} ref={(el) => { otpRefs.current[i] = el }} type="text" inputMode="numeric"
                        maxLength={1} value={digits[i]}
                        onChange={(e) => handleDigit(i, e.target.value)}
                        onKeyDown={(e) => handleDigitKey(i, e)}
                        onPaste={i === 0 ? handlePaste : undefined}
                        disabled={phonePending}
                        className={`w-10 h-12 text-center text-lg font-black rounded-xl border-2 transition-all focus:outline-none ${digits[i] ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-gray-50'} focus:border-emerald-500 focus:bg-white disabled:opacity-50`} />
                    ))}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    {cooldown > 0
                      ? <p className="text-xs text-gray-400">Kirim ulang dalam <span className="font-mono font-bold text-gray-600">{cooldown}s</span></p>
                      : <button type="button" onClick={handleResend} disabled={phonePending} className="text-xs text-emerald-600 font-bold hover:text-emerald-700 disabled:opacity-50 underline underline-offset-2">Kirim ulang OTP</button>}
                    <button type="submit" disabled={phonePending || digits.join('').length < OTP_LEN}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-bold rounded-2xl text-sm transition-colors">
                      {phonePending && <Spinner />} {phonePending ? 'Memverifikasi...' : 'Verifikasi →'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Done */}
            {phoneStep === 'done' && (
              <div className="px-4 py-3 border-t border-emerald-100 bg-emerald-50/60">
                <p className="text-emerald-700 text-xs font-semibold">{phoneSuccess}</p>
                <p className="text-emerald-600 text-xs mt-0.5">Refresh halaman untuk melihat perubahan pada sesi aktif.</p>
              </div>
            )}
          </div>

          {/* Role */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50">
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Role</p>
              <p className="text-gray-900 font-semibold mt-0.5">{user.role === 'SUPER_ADMIN' ? '⭐ Super Admin' : '👨‍👩‍👧 Orang Tua'}</p>
            </div>
            <span className="text-xl opacity-30">🔖</span>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────── GANTI PASSWORD */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-xl">🔑</span>
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-base">Ganti Password</h2>
              <p className="text-gray-500 text-sm mt-0.5">Masukkan password lama lalu buat yang baru</p>
            </div>
          </div>
          {pwStep === 'idle' && (
            <button onClick={() => setPwStep('form')}
              className="text-xs text-violet-700 font-bold border border-violet-200 bg-violet-50 px-3 py-1.5 rounded-xl hover:bg-violet-100 transition-colors shrink-0">
              Ubah
            </button>
          )}
          {pwStep === 'form' && (
            <button onClick={resetPwFlow} className="text-xs text-gray-400 hover:text-gray-600 font-semibold px-2">Batal</button>
          )}
        </div>

        {/* Idle state */}
        {pwStep === 'idle' && (
          <div className="flex items-center p-3 rounded-2xl bg-gray-50">
            <div className="flex-1">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Password aktif</p>
              <p className="text-gray-600 text-sm mt-0.5 font-mono tracking-widest">••••••••••</p>
            </div>
          </div>
        )}

        {/* Form ganti password */}
        {pwStep === 'form' && (
          <>
            {pwError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
                <span className="flex-shrink-0">⚠️</span> {pwError}
              </div>
            )}
            <form onSubmit={handlePwSubmit} className="space-y-4">
              {/* Password lama */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">Password Saat Ini</label>
                <div className="relative">
                  <input type={showCurrent ? 'text' : 'password'} value={currentPw}
                    onChange={(e) => { setCurrentPw(e.target.value); setPwError(null) }}
                    placeholder="Masukkan password lama" required disabled={pwPending} autoComplete="current-password"
                    className={inputClass + ' pr-11'} />
                  <button type="button" onClick={() => setShowCurrent(v => !v)} tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5">
                    <EyeIcon open={showCurrent} />
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-dashed border-gray-100" />

              {/* Password baru */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">Password Baru</label>
                <div className="relative">
                  <input type={showNew ? 'text' : 'password'} value={newPw}
                    onChange={(e) => { setNewPw(e.target.value); setPwError(null) }}
                    placeholder="Min 8 karakter, huruf kapital & angka" required disabled={pwPending} autoComplete="new-password"
                    className={inputClass + ' pr-11'} />
                  <button type="button" onClick={() => setShowNew(v => !v)} tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5">
                    <EyeIcon open={showNew} />
                  </button>
                </div>

                {/* Strength checklist */}
                {newPw.length > 0 && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 px-1 pt-1">
                    <CheckItem ok={pwChecks.length} label="Min 8 karakter" />
                    <CheckItem ok={pwChecks.upper} label="Huruf kapital" />
                    <CheckItem ok={pwChecks.number} label="Ada angka" />
                  </div>
                )}
              </div>

              {/* Konfirmasi password baru */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">Konfirmasi Password Baru</label>
                <div className="relative">
                  <input type={showConfirm ? 'text' : 'password'} value={confirmPw}
                    onChange={(e) => { setConfirmPw(e.target.value); setPwError(null) }}
                    placeholder="Ulangi password baru" required disabled={pwPending} autoComplete="new-password"
                    className={`${inputClass} pr-11 ${confirmPw.length > 0 ? (pwChecks.match ? 'border-emerald-400 ring-1 ring-emerald-300' : 'border-red-300 ring-1 ring-red-200') : ''}`} />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5">
                    <EyeIcon open={showConfirm} />
                  </button>
                </div>
                {confirmPw.length > 0 && (
                  <p className={`text-xs px-1 pt-0.5 font-semibold ${pwChecks.match ? 'text-emerald-600' : 'text-red-500'}`}>
                    {pwChecks.match ? '✓ Password cocok' : '✗ Password tidak cocok'}
                  </p>
                )}
              </div>

              <button type="submit" disabled={pwPending || !currentPw || !pwValid}
                className="btn-press w-full py-3.5 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-md shadow-violet-100 transition-all text-sm">
                {pwPending
                  ? <span className="flex items-center justify-center gap-2"><Spinner /> Menyimpan...</span>
                  : 'Simpan Password Baru 🔑'}
              </button>
            </form>
          </>
        )}

        {/* Done */}
        {pwStep === 'done' && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
            <p className="text-3xl">✅</p>
            <p className="text-emerald-800 font-bold text-sm">Password berhasil diubah!</p>
            <p className="text-emerald-600 text-xs">Gunakan password baru saat login berikutnya.</p>
            <button onClick={resetPwFlow} className="mt-2 text-xs text-emerald-700 font-bold underline underline-offset-2">Tutup</button>
          </div>
        )}
      </div>

      {/* ────────────────────────────────── EMAIL */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-xl">📧</span>
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-base">{user.email ? 'Email Terdaftar' : 'Tambahkan Email (Opsional)'}</h2>
            <p className="text-gray-500 text-sm mt-0.5 leading-relaxed">Backup identitas selain nomor WhatsApp. Tidak wajib diisi.</p>
          </div>
        </div>

        {!user.email && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-100 flex items-start gap-2">
            <span className="text-base flex-shrink-0">💡</span>
            <p className="text-amber-700 text-xs leading-relaxed">Belum ada email. Tambahkan sekarang sebagai cadangan jika kamu mengganti nomor WhatsApp.</p>
          </div>
        )}

        {emailSuccess && <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold">{emailSuccess}</div>}
        {emailError && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2"><span>⚠️</span>{emailError}</div>}

        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">Alamat Email</label>
            <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setEmailError(null); setEmailSuccess(null) }}
              placeholder="nama@email.com" disabled={emailPending} autoComplete="email" className={inputClass} />
          </div>
          <button type="submit" disabled={emailPending || !email.trim() || email === (user.email ?? '')}
            className="btn-press w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-md shadow-emerald-100 transition-all text-sm">
            {emailPending
              ? <span className="flex items-center justify-center gap-2"><Spinner /> Menyimpan...</span>
              : user.email ? 'Perbarui Email' : 'Simpan Email 📧'}
          </button>
        </form>
      </div>

      {/* ────────────────────────────────── KEAMANAN */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-gray-900 text-base flex items-center gap-2 mb-4">
          <span className="text-xl">🔐</span> Keamanan Akun
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50">
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Verifikasi 2 Langkah</p>
              <p className="text-gray-600 text-sm mt-0.5">OTP via WhatsApp aktif</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl">✅ Aktif</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50">
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Sesi Login</p>
              <p className="text-gray-600 text-sm mt-0.5">Perangkat ini aktif</p>
            </div>
            <form action="/api/auth/signout" method="POST">
              <button type="submit"
                className="text-xs text-red-500 hover:text-red-700 font-bold border border-red-100 px-3 py-1.5 rounded-xl hover:bg-red-50 transition-colors">
                Keluar
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
