'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { approveTask, rejectTask } from '@/actions/tasks'

type Task = {
  id: string
  title: string
  description: string | null
  rewardAmount: number
  claimedAt: Date | null
  proofPhotoUrl: string | null
  child: { name: string; avatar: string | null }
}

export default function PendingTasksClient({ tasks }: { tasks: Task[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [rejectModal, setRejectModal] = useState<{ taskId: string; title: string } | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleApprove(taskId: string) {
    startTransition(async () => {
      const res = await approveTask(taskId)
      if (res.success) {
        setSuccess(`Disetujui! Saldo baru: Rp ${res.data.newBalance.toLocaleString('id-ID')}`)
        setTimeout(() => setSuccess(null), 4000)
        router.refresh()
      } else {
        setError(res.error ?? 'Terjadi kesalahan.')
      }
    })
  }

  function handleReject() {
    if (!rejectModal) return
    startTransition(async () => {
      const res = await rejectTask(rejectModal.taskId, rejectReason)
      if (res.success) {
        setRejectModal(null)
        setRejectReason('')
        setSuccess('Tugas ditolak.')
        setTimeout(() => setSuccess(null), 3000)
        router.refresh()
      } else {
        setError(res.error ?? 'Terjadi kesalahan.')
      }
    })
  }

  return (
    <>
      {success && (
        <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">tutup</button>
        </div>
      )}

      <div className="space-y-4">
        {tasks.map((task) => (
          <div key={task.id} className="bg-white rounded-2xl border border-amber-200 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{task.child.avatar ?? '🧒'}</span>
                  <span className="text-sm text-gray-500">{task.child.name}</span>
                </div>
                <h3 className="font-semibold text-gray-900 text-base">{task.title}</h3>
                {task.description && (
                  <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                )}
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-emerald-600 font-bold text-sm">
                    Rp {task.rewardAmount.toLocaleString('id-ID')}
                  </span>
                  {task.claimedAt && (
                    <span className="text-xs text-gray-400">
                      Diklaim {new Date(task.claimedAt).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
              </div>

              {task.proofPhotoUrl && (
                <a
                  href={task.proofPhotoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0"
                >
                  <img
                    src={task.proofPhotoUrl}
                    alt="Bukti"
                    className="w-16 h-16 object-cover rounded-xl border border-gray-200"
                  />
                </a>
              )}
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => handleApprove(task.id)}
                disabled={isPending}
                className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                ✓ Setujui Tugas
              </button>
              <button
                onClick={() => setRejectModal({ taskId: task.id, title: task.title })}
                disabled={isPending}
                className="flex-1 py-2.5 border border-red-200 text-red-500 rounded-xl text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                ✕ Tolak
              </button>
            </div>
          </div>
        ))}
      </div>

      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Tolak Tugas</h2>
            <p className="text-sm text-gray-600">
              Tugas: <strong>{rejectModal.title}</strong>
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alasan <span className="text-gray-400">(opsional)</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="Contoh: Foto bukti tidak jelas..."
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setRejectModal(null); setRejectReason('') }}
                className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleReject}
                disabled={isPending}
                className="flex-1 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 disabled:opacity-50"
              >
                {isPending ? 'Menolak...' : 'Tolak Tugas'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
