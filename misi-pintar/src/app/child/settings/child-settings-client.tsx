'use client'

import { useState, useTransition } from 'react'
import { childChangeOwnPassword } from '@/actions/child-settings'
import AvatarUploadButton from '@/components/avatar-upload-button'

interface Props {
  name: string
  username: string
  avatar: string
}

export default function ChildSettingsClient({ name, username, avatar }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await childChangeOwnPassword(formData)
      if (result.success) {
        setSuccess(true)
        ;(e.target as HTMLFormElement).reset()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Profil Card */}
      <div className="bg-white rounded-2xl p-5 shadow">
        <div className="flex items-center gap-4">
          <AvatarUploadButton currentAvatar={avatar} size="lg" dark />
          <div>
            <p className="font-bold text-gray-900">{name}</p>
            <p className="text-sm text-gray-500">@{username}</p>
          </div>
        </div>
      </div>

      {/* Ganti Password Card */}
      <div className="bg-white rounded-2xl p-5 shadow">
        <h2 className="font-bold text-gray-900 mb-4">🔒 Ganti Password</h2>

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
            ✅ Password berhasil diubah!
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Password Lama */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password Lama
            </label>
            <div className="relative">
              <input
                name="currentPassword"
                type={showCurrent ? 'text' : 'password'}
                required
                placeholder="••••••"
                className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              >
                {showCurrent ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Password Baru */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password Baru
            </label>
            <div className="relative">
              <input
                name="newPassword"
                type={showNew ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="Minimal 6 karakter"
                className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              >
                {showNew ? '🙈' : '👁️'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Minimal 6 karakter, tidak boleh sama dengan username
            </p>
          </div>

          {/* Konfirmasi Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Konfirmasi Password Baru
            </label>
            <div className="relative">
              <input
                name="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="Ulangi password baru"
                className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              >
                {showConfirm ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold rounded-xl transition-colors text-sm mt-1"
          >
            {isPending ? 'Menyimpan...' : 'Simpan Password Baru'}
          </button>
        </form>
      </div>

      {/* Aturan Keamanan */}
      <div className="bg-white/20 rounded-2xl p-4">
        <p className="text-white text-xs font-medium mb-2">🛡️ Tips Keamanan Password</p>
        <ul className="text-white/80 text-xs space-y-1">
          <li>• Minimal 6 karakter</li>
          <li>• Jangan pakai nama atau username kamu</li>
          <li>• Jangan share password ke siapapun</li>
          <li>• Ganti password secara berkala</li>
        </ul>
      </div>
    </div>
  )
}
