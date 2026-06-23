'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateChildAvatar } from '@/actions/child-settings'

const MAX_PX = 320
const QUALITY = 0.75

async function compressToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      let w = img.naturalWidth
      let h = img.naturalHeight

      if (w > h) {
        if (w > MAX_PX) { h = Math.round(h * MAX_PX / w); w = MAX_PX }
      } else {
        if (h > MAX_PX) { w = Math.round(w * MAX_PX / h); h = MAX_PX }
      }

      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('canvas error')); return }
      ctx.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', QUALITY))
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Gagal memuat gambar'))
    }

    img.src = url
  })
}

interface Props {
  currentAvatar: string | null
  size?: 'lg' | 'xl'
  dark?: boolean
}

export default function AvatarUploadButton({
  currentAvatar,
  size = 'xl',
  dark = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [compressing, setCompressing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  const isImage = currentAvatar?.startsWith('data:image/')
  const dim = size === 'xl' ? 'w-24 h-24' : 'w-20 h-20'
  const emoji = size === 'xl' ? 'text-5xl' : 'text-4xl'

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (inputRef.current) inputRef.current.value = ''
    if (!file) return

    setError(null)
    setSaved(false)
    setCompressing(true)
    try {
      const base64 = await compressToBase64(file)
      if (base64.length > 280 * 1024) {
        setError('Foto terlalu besar. Coba foto dengan resolusi lebih rendah.')
        return
      }
      setPreview(base64)
    } catch {
      setError('Gagal memproses foto. Coba foto lain.')
    } finally {
      setCompressing(false)
    }
  }

  function handleConfirm() {
    if (!preview) return
    startTransition(async () => {
      const result = await updateChildAvatar(preview)
      if (result.success) {
        setSaved(true)
        setPreview(null)
        router.refresh()
        setTimeout(() => setSaved(false), 3000)
      } else {
        setError(result.error ?? 'Gagal menyimpan foto.')
        setPreview(null)
      }
    })
  }

  const busy = compressing || isPending

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className={`relative ${dim} rounded-full flex items-center justify-center
            ${dark ? 'bg-gray-100 hover:bg-gray-200' : 'bg-white/20 hover:bg-white/30'}
            active:scale-95 transition-all focus:outline-none focus:ring-2
            ${dark ? 'focus:ring-emerald-400' : 'focus:ring-white/60'}
            overflow-hidden shadow-md`}
          aria-label="Ganti foto profil"
        >
          {isImage ? (
            <img
              src={currentAvatar!}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className={emoji}>{currentAvatar ?? '🧒'}</span>
          )}

          <span className="absolute bottom-0.5 right-0.5 bg-emerald-500 rounded-full p-1 shadow border-2 border-white text-[10px] leading-none select-none">
            📷
          </span>

          {busy && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white text-xs font-medium">
                {compressing ? 'Memproses...' : 'Menyimpan...'}
              </span>
            </div>
          )}
        </button>

        {saved && (
          <p className={`text-xs font-medium ${dark ? 'text-emerald-600' : 'text-emerald-200'}`}>
            ✓ Foto tersimpan
          </p>
        )}
        {error && !preview && (
          <p className={`text-xs ${dark ? 'text-red-500' : 'text-red-300'} text-center max-w-[180px]`}>
            {error}
          </p>
        )}
        {!busy && !saved && !error && (
          <p className={`text-xs ${dark ? 'text-gray-400' : 'text-white/60'}`}>
            Ketuk untuk ganti foto
          </p>
        )}
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-gray-900 text-center text-lg">Preview Foto</h3>

            <div className="flex justify-center">
              <img
                src={preview}
                alt="Preview avatar"
                className="w-32 h-32 rounded-full object-cover border-4 border-emerald-400 shadow-lg"
              />
            </div>

            <p className="text-xs text-gray-400 text-center">
              Foto dikompres otomatis — tetap jernih, hemat penyimpanan
            </p>

            {error && (
              <p className="text-xs text-red-500 text-center">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setPreview(null); setError(null) }}
                disabled={isPending}
                className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleConfirm}
                disabled={isPending}
                className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-60"
              >
                {isPending ? 'Menyimpan...' : 'Simpan Foto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
