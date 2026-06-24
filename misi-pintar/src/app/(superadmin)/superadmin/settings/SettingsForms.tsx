'use client'

import { useState, useTransition } from 'react'
import { changePassword, updateUserEmail } from '@/actions/auth'

function StatusBanner({ ok, msg }: { ok: boolean; msg: string }) {
  return (
    <div className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${
      ok
        ? 'bg-green-950/60 border border-green-800 text-green-300'
        : 'bg-red-950/60 border border-red-800 text-red-300'
    }`}>
      <span className="mt-0.5 flex-shrink-0">{ok ? '✅' : '⚠️'}</span>
      {msg}
    </div>
  )
}

function PasswordSection({ userId }: { userId: string }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (next !== confirm) {
      setStatus({ ok: false, msg: 'Password baru dan konfirmasi tidak cocok.' })
      return
    }
    setStatus(null)
    startTransition(async () => {
      const res = await changePassword(userId, current, next)
      if (res.success) {
        setStatus({ ok: true, msg: 'Password berhasil diperbarui.' })
        setCurrent('')
        setNext('')
        setConfirm('')
      } else {
        setStatus({ ok: false, msg: res.error ?? 'Gagal memperbarui password.' })
      }
    })
  }

  const inputClass =
    'w-full px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition'

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-xl">🔑</span>
        <div>
          <h2 className="text-base font-semibold text-white">Ganti Password</h2>
          <p className="text-xs text-gray-500 mt-0.5">Wajib isi password saat ini untuk konfirmasi</p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-4 max-w-sm">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Password Saat Ini</label>
          <input
            type={show ? 'text' : 'password'}
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••••"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Password Baru</label>
          <input
            type={show ? 'text' : 'password'}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            required
            autoComplete="new-password"
            placeholder="••••••••••"
            className={inputClass}
          />
          <p className="text-xs text-gray-600 mt-1.5">
            Min. 8 karakter, huruf besar, angka, dan simbol
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Konfirmasi Password Baru</label>
          <input
            type={show ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
            placeholder="••••••••••"
            className={inputClass}
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
          <input
            type="checkbox"
            checked={show}
            onChange={(e) => setShow(e.target.checked)}
            className="accent-indigo-500"
          />
          <span className="text-xs text-gray-500">Tampilkan password</span>
        </label>

        {status && <StatusBanner ok={status.ok} msg={status.msg} />}

        <button
          type="submit"
          disabled={isPending || !current || !next || !confirm}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
        >
          {isPending ? 'Menyimpan...' : 'Simpan Password Baru'}
        </button>
      </form>
    </div>
  )
}

function EmailSection({ userId, currentEmail }: { userId: string; currentEmail: string }) {
  const [email, setEmail] = useState(currentEmail)
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setStatus(null)
    startTransition(async () => {
      const res = await updateUserEmail(userId, email)
      if (res.success) {
        setStatus({ ok: true, msg: 'Email berhasil diperbarui.' })
      } else {
        setStatus({ ok: false, msg: res.error ?? 'Gagal memperbarui email.' })
      }
    })
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-xl">📧</span>
        <div>
          <h2 className="text-base font-semibold text-white">Email Login</h2>
          <p className="text-xs text-gray-500 mt-0.5">Email ini digunakan untuk masuk ke /adm-panel</p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-4 max-w-sm">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Alamat Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>

        {status && <StatusBanner ok={status.ok} msg={status.msg} />}

        <button
          type="submit"
          disabled={isPending || email === currentEmail || !email}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
        >
          {isPending ? 'Menyimpan...' : 'Simpan Email'}
        </button>
      </form>
    </div>
  )
}

export default function SettingsForms({
  userId,
  currentEmail,
}: {
  userId: string
  currentEmail: string
}) {
  return (
    <div className="space-y-6">
      <PasswordSection userId={userId} />
      <EmailSection userId={userId} currentEmail={currentEmail} />
    </div>
  )
}
