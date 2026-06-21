'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { claimTask } from '@/actions/tasks'

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
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran file maksimal 5MB.')
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
    <div className="bg-white rounded-2xl p-6 space-y-5">
      {/* Task info */}
      <div className="bg-emerald-50 rounded-xl p-4">
        <p className="font-bold text-gray-900 text-lg">{task.title}</p>
        {task.description && (
          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
        )}
        <p className="text-emerald-600 font-black text-xl mt-3">
          +Rp {task.rewardAmount.toLocaleString('id-ID')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Photo proof */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Foto Bukti <span className="text-gray-400 font-normal">(opsional, maks. 5MB)</span>
          </label>
          <label className="block cursor-pointer">
            {preview ? (
              <div className="relative">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-xl border border-gray-200"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl opacity-0 hover:opacity-100 transition-opacity">
                  <p className="text-white text-sm font-medium">Ganti foto</p>
                </div>
              </div>
            ) : (
              <div className="w-full h-32 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-emerald-400 hover:text-emerald-500 transition-colors">
                <span className="text-2xl mb-1">📷</span>
                <span className="text-xs">Tap untuk ambil foto bukti</span>
              </div>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>
        </div>

        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 font-medium"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isBusy}
            className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {uploading ? 'Mengupload...' : isPending ? 'Mengklaim...' : '✓ Klaim Tugas'}
          </button>
        </div>
      </form>
    </div>
  )
}
