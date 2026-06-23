'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { claimTask } from '@/actions/tasks'

const MAX_SIZE = 3 * 1024 * 1024 // 3 MB

type Task = {
  id: string
  title: string
  description: string | null
  rewardAmount: number
}

export default function ClaimClient({ task }: { task: Task }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_SIZE) {
      setError('Ukuran file maksimal 3 MB.')
      e.target.value = ''
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Format file harus JPG, PNG, atau WebP.')
      e.target.value = ''
      return
    }
    setError(null)
    setProofFile(file)
    setPreview(URL.createObjectURL(file))
  }

  function removePhoto() {
    setProofFile(null)
    setPreview(null)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    let proofPhotoUrl: string | undefined

    if (proofFile) {
      setUploading(true)
      try {
        const fd = new FormData()
        fd.append('file', proofFile)
        const res = await fetch('/api/upload/proof', { method: 'POST', body: fd })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error ?? 'Upload gagal.')
        }
        const data = await res.json()
        proofPhotoUrl = data.url
      } catch (err: any) {
        setError(err.message ?? 'Upload foto gagal.')
        setUploading(false)
        return
      }
      setUploading(false)
    }

    startTransition(async () => {
      const res = await claimTask(task.id, proofPhotoUrl)
      if (res.success) {
        router.push('/child/tasks')
        router.refresh()
      } else {
        setError(res.error ?? 'Terjadi kesalahan.')
      }
    })
  }

  const isBusy = isPending || uploading

  return (
    <div className="bg-white rounded-2xl p-5 space-y-5">
      {/* Task info card */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
        <p className="font-bold text-gray-900 text-lg leading-snug">{task.title}</p>
        {task.description && (
          <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{task.description}</p>
        )}
        <div className="mt-3 inline-flex items-center gap-1.5 bg-emerald-600 text-white text-sm font-bold px-3 py-1.5 rounded-full">
          <span>🏆</span>
          <span>+Rp {task.rewardAmount.toLocaleString('id-ID')}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Photo proof — optional */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-gray-700">
              📷 Foto Bukti
            </label>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              Opsional · maks. 3 MB
            </span>
          </div>

          {preview ? (
            <div className="relative rounded-xl overflow-hidden border border-gray-200">
              <img
                src={preview}
                alt="Preview bukti"
                className="w-full h-52 object-cover"
              />
              <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />
              <button
                type="button"
                onClick={removePhoto}
                className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow hover:bg-red-600 transition-colors"
              >
                ×
              </button>
              <label className="absolute bottom-2 right-2 bg-white/90 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full cursor-pointer hover:bg-white shadow">
                Ganti foto
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
            </div>
          ) : (
            <label className="block cursor-pointer">
              <div className="w-full h-36 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-emerald-400 hover:text-emerald-500 hover:bg-emerald-50/30 transition-all active:scale-95">
                <span className="text-3xl mb-1.5">📷</span>
                <span className="text-sm font-medium">Tambah foto bukti</span>
                <span className="text-xs mt-0.5">JPG, PNG, atau WebP · maks. 3 MB</span>
              </div>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="sr-only"
              />
            </label>
          )}
        </div>

        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl flex items-center justify-between gap-2">
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)} className="text-red-400 font-bold flex-shrink-0">×</button>
          </div>
        )}

        {/* Upload progress indicator */}
        {uploading && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
            <span className="inline-block w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <span className="text-sm text-emerald-700 font-medium">Mengupload foto...</span>
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={isBusy}
            className="flex-1 py-3.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 font-medium active:scale-95 transition-all disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isBusy}
            className="flex-1 py-3.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Mengklaim...
              </>
            ) : (
              '✓ Klaim Tugas'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
