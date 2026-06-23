'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createTask, approveTask, rejectTask } from '@/actions/tasks'

type Child = { id: string; name: string; avatar: string | null }
type Task = {
  id: string
  title: string
  description: string | null
  rewardAmount: number
  status: string
  claimedAt: Date | null
  approvedAt: Date | null
  proofPhotoUrl: string | null
  child: { name: string; avatar: string | null }
}

type Props = {
  children: Child[]
  tasks: Task[]
  tasksThisMonth: number
  maxTasksPerMonth: number
}

export default function TasksClient({ children, tasks, tasksThisMonth, maxTasksPerMonth }: Props) {
  const router = useRouter()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [rejectModal, setRejectModal] = useState<{ taskId: string; title: string } | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [confirmApproveId, setConfirmApproveId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)

  const canCreate = maxTasksPerMonth === -1 || tasksThisMonth < maxTasksPerMonth
  const taskQuotaLabel = maxTasksPerMonth === -1
    ? null
    : `${tasksThisMonth} / ${maxTasksPerMonth} tugas bulan ini`

  function showSuccess(msg: string) {
    setSuccess(msg)
    setTimeout(() => setSuccess(null), 4000)
  }

  function showError(msg: string) {
    setError(msg)
    setTimeout(() => setError(null), 6000)
  }

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await createTask(fd)
      if (res.success) {
        setShowCreateForm(false)
        ;(e.target as HTMLFormElement).reset()
        showSuccess('✅ Tugas berhasil dibuat!')
        router.refresh()
      } else {
        setError(res.error ?? 'Terjadi kesalahan.')
      }
    })
  }

  function handleApprove(taskId: string) {
    setActiveTaskId(taskId)
    setConfirmApproveId(null)
    startTransition(async () => {
      const res = await approveTask(taskId)
      setActiveTaskId(null)
      if (res.success) {
        showSuccess(`✅ Tugas disetujui! Reward Rp ${res.data.newBalance.toLocaleString('id-ID')} ditambahkan ke saldo anak.`)
        router.refresh()
      } else {
        showError(res.error ?? 'Terjadi kesalahan.')
      }
    })
  }

  function handleReject() {
    if (!rejectModal) return
    setActiveTaskId(rejectModal.taskId)
    startTransition(async () => {
      const res = await rejectTask(rejectModal.taskId, rejectReason)
      setActiveTaskId(null)
      if (res.success) {
        setRejectModal(null)
        setRejectReason('')
        showSuccess('Tugas ditolak dan anak telah diberitahu.')
        router.refresh()
      } else {
        showError(res.error ?? 'Terjadi kesalahan.')
      }
    })
  }

  const statusLabel: Record<string, string> = {
    PENDING: 'Menunggu', CLAIMED: 'Diklaim', APPROVED: 'Disetujui', REJECTED: 'Ditolak',
  }
  const statusColor: Record<string, string> = {
    PENDING: 'bg-gray-100 text-gray-600',
    CLAIMED: 'bg-amber-100 text-amber-700',
    APPROVED: 'bg-emerald-100 text-emerald-700',
    REJECTED: 'bg-red-100 text-red-600',
  }

  const filteredTasks = filterStatus === 'ALL' ? tasks : tasks.filter((t) => t.status === filterStatus)
  const claimedTasks = tasks.filter((t) => t.status === 'CLAIMED')

  return (
    <>
      {success && (
        <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="ml-3 text-emerald-500 hover:text-emerald-700 font-bold">×</button>
        </div>
      )}
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-3 text-red-400 hover:text-red-600 font-bold">×</button>
        </div>
      )}

      {/* Pending approval banner */}
      {claimedTasks.length > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-amber-800">
              {claimedTasks.length} tugas menunggu persetujuan Anda
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              Klik "Lihat" untuk menyaring dan menyetujui
            </p>
          </div>
          <button
            onClick={() => setFilterStatus('CLAIMED')}
            className="px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700"
          >
            Lihat
          </button>
        </div>
      )}

      {/* Create task */}
      <div className="mb-6">
        {!showCreateForm ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateForm(true)}
              disabled={!canCreate}
              className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              + Buat Tugas Baru
            </button>
            {taskQuotaLabel && (
              <span className={`text-xs font-medium ${tasksThisMonth >= maxTasksPerMonth ? 'text-red-500' : 'text-gray-400'}`}>
                {taskQuotaLabel}
              </span>
            )}
          </div>
        ) : (
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Buat Tugas Baru</h3>
              {taskQuotaLabel && (
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  tasksThisMonth >= maxTasksPerMonth
                    ? 'bg-red-50 text-red-500'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {taskQuotaLabel}
                </span>
              )}
            </div>

            {children.length === 0 ? (
              <p className="text-sm text-amber-600">Tambah anak terlebih dahulu sebelum membuat tugas.</p>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Untuk Anak</label>
                  <select
                    name="childId"
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Pilih anak...</option>
                    {children.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.avatar} {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Judul Tugas</label>
                  <input
                    name="title"
                    required
                    minLength={3}
                    maxLength={100}
                    placeholder="Contoh: Bersihkan kamar"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">Minimal 3 karakter</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deskripsi <span className="text-gray-400">(opsional)</span>
                  </label>
                  <textarea
                    name="description"
                    rows={2}
                    placeholder="Instruksi lebih detail..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reward (Rp)</label>
                  <input
                    name="rewardAmount"
                    type="number"
                    required
                    min={1}
                    placeholder="Contoh: 5000"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setShowCreateForm(false); setError(null) }}
                className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
              >
                Batal
              </button>
              {children.length > 0 && (
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isPending ? 'Menyimpan...' : 'Buat Tugas'}
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['ALL', 'PENDING', 'CLAIMED', 'APPROVED', 'REJECTED'].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterStatus === s
                ? 'bg-emerald-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s === 'ALL' ? 'Semua' : statusLabel[s]}
            {s === 'CLAIMED' && claimedTasks.length > 0 && (
              <span className="ml-1 bg-amber-400 text-white rounded-full px-1.5">{claimedTasks.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Task list */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-10 text-center">
          <p className="text-3xl mb-2">📋</p>
          <p className="text-gray-500 text-sm">Belum ada tugas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const isThisTaskPending = isPending && activeTaskId === task.id
            const isBeingConfirmed = confirmApproveId === task.id

            return (
              <div
                key={task.id}
                className={`bg-white rounded-xl border p-4 transition-all ${
                  isThisTaskPending ? 'border-emerald-300 opacity-75' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-900 truncate">{task.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${statusColor[task.status]}`}>
                        {statusLabel[task.status]}
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-xs text-gray-400 mb-1 truncate">{task.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{task.child.avatar} {task.child.name}</span>
                      <span className="font-semibold text-emerald-600">
                        Rp {task.rewardAmount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {task.status === 'CLAIMED' && (
                    <div className="flex flex-col gap-2 shrink-0 items-end">
                      {/* Proof photo link */}
                      {task.proofPhotoUrl && (
                        <a
                          href={task.proofPhotoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-2 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                        >
                          📷 Lihat Bukti
                        </a>
                      )}

                      {/* Confirm step or action buttons */}
                      {isBeingConfirmed ? (
                        <div className="flex flex-col gap-1.5 items-end">
                          <p className="text-xs text-gray-500 text-right">Setujui tugas ini?</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setConfirmApproveId(null)}
                              disabled={isThisTaskPending}
                              className="text-xs px-2 py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50"
                            >
                              Batal
                            </button>
                            <button
                              onClick={() => handleApprove(task.id)}
                              disabled={isThisTaskPending}
                              className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1"
                            >
                              {isThisTaskPending ? (
                                <>
                                  <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  Memproses...
                                </>
                              ) : 'Ya, Setujui'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setConfirmApproveId(task.id)}
                            disabled={isPending}
                            className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                          >
                            ✓ Setuju
                          </button>
                          <button
                            onClick={() => setRejectModal({ taskId: task.id, title: task.title })}
                            disabled={isPending}
                            className="text-xs px-3 py-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 disabled:opacity-50"
                          >
                            ✕ Tolak
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Per-task loading indicator */}
                {isThisTaskPending && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-emerald-600">
                    <span className="inline-block w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    Memproses...
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Tolak Tugas</h2>
            <p className="text-sm text-gray-600">
              Tugas: <strong>{rejectModal.title}</strong>
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alasan penolakan <span className="text-gray-400">(opsional)</span>
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
                disabled={isPending && activeTaskId === rejectModal.taskId}
                className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleReject}
                disabled={isPending && activeTaskId === rejectModal.taskId}
                className="flex-1 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {isPending && activeTaskId === rejectModal.taskId ? (
                  <>
                    <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Menolak...
                  </>
                ) : 'Tolak Tugas'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
