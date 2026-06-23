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

// ─── Preset task catalog ──────────────────────────────────────────────────────
const TASK_CATALOG = [
  {
    category: 'Pahlawan Rumah',
    emoji: '🏠',
    color: 'emerald',
    tasks: [
      { title: 'Merapikan Kamar',      desc: 'Merapikan kamar sendiri hingga rapi dan bersih.' },
      { title: 'Menyapu & Mengepel',   desc: 'Menyapu dan mengepel lantai rumah.' },
      { title: 'Membersihkan Kamar Mandi', desc: 'Menyikat kamar mandi hingga bersih.' },
      { title: 'Mencuci Piring',       desc: 'Mencuci piring dan peralatan makan.' },
      { title: 'Buang Sampah',         desc: 'Membuang sampah ke luar rumah.' },
      { title: 'Jemur & Lipat Baju',   desc: 'Menjemur dan melipat pakaian.' },
      { title: 'Mencuci Kendaraan',    desc: 'Mencuci sepeda atau motor hingga bersih.' },
      { title: 'Menyiram Tanaman',     desc: 'Menyiram semua tanaman di rumah.' },
    ],
  },
  {
    category: 'Misi Pintar',
    emoji: '📚',
    color: 'blue',
    tasks: [
      { title: 'Mengerjakan PR',        desc: 'Menyelesaikan semua PR sekolah.' },
      { title: 'Belajar Mandiri',       desc: 'Belajar buku pelajaran secara mandiri.' },
      { title: 'Membaca Buku',          desc: 'Membaca buku cerita atau buku edukasi.' },
      { title: 'Belajar Bahasa Asing',  desc: 'Belajar bahasa asing selama 30 menit.' },
      { title: 'Belajar Komputer',      desc: 'Belajar mengetik, Canva, atau coding.' },
      { title: 'Siapkan Buku Sekolah',  desc: 'Menyiapkan buku pelajaran untuk hari besok.' },
    ],
  },
  {
    category: 'Misi Kebaikan',
    emoji: '🤲',
    color: 'purple',
    tasks: [
      { title: 'Temani Adik Belajar',   desc: 'Menemani atau membantu PR adik.' },
      { title: 'Bantu Masak',           desc: 'Membantu memotong sayur atau memasak.' },
      { title: 'Siapkan Meja Makan',    desc: 'Menyiapkan meja makan sebelum waktu makan.' },
      { title: 'Belanja ke Warung',     desc: 'Membeli galon, gas, atau belanjaan rumah.' },
      { title: 'Ambil Paket',           desc: 'Mengambil paket kiriman dari kurir.' },
      { title: 'Pijat Orang Tua',       desc: 'Memijat orang tua saat lelah.' },
    ],
  },
]

const COLOR_MAP: Record<string, { bg: string; ring: string; text: string; badge: string; light: string }> = {
  emerald: {
    bg:    'bg-emerald-600',
    ring:  'ring-emerald-400',
    text:  'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-700',
    light: 'bg-emerald-50',
  },
  blue: {
    bg:    'bg-blue-600',
    ring:  'ring-blue-400',
    text:  'text-blue-700',
    badge: 'bg-blue-100 text-blue-700',
    light: 'bg-blue-50',
  },
  purple: {
    bg:    'bg-purple-600',
    ring:  'ring-purple-400',
    text:  'text-purple-700',
    badge: 'bg-purple-100 text-purple-700',
    light: 'bg-purple-50',
  },
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function TasksClient({ children, tasks, tasksThisMonth, maxTasksPerMonth }: Props) {
  const router = useRouter()

  // Form state
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<{ title: string; desc: string } | 'custom' | null>(null)
  const [customTitle, setCustomTitle] = useState('')
  const [customDesc, setCustomDesc] = useState('')
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  // Review / approval state
  const [rejectModal, setRejectModal] = useState<{ taskId: string; title: string } | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [confirmApproveId, setConfirmApproveId] = useState<string | null>(null)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)

  // Feedback
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [filterStatus, setFilterStatus] = useState<string>('ALL')

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

  function resetForm() {
    setShowCreateForm(false)
    setSelectedPreset(null)
    setCustomTitle('')
    setCustomDesc('')
    setExpandedCategory(null)
    setError(null)
  }

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)

    // Inject title/description from preset or custom
    if (selectedPreset && selectedPreset !== 'custom') {
      fd.set('title', selectedPreset.title)
      fd.set('description', selectedPreset.desc)
    }

    startTransition(async () => {
      const res = await createTask(fd)
      if (res.success) {
        resetForm()
        showSuccess('✅ Tugas berhasil dibuat!')
        router.refresh()
      } else {
        showError(res.error ?? 'Terjadi kesalahan.')
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
        showSuccess(`✅ Tugas disetujui! Saldo anak bertambah Rp ${res.data.newBalance.toLocaleString('id-ID')}.`)
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
        showSuccess('Tugas ditolak.')
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

  const currentTitle = selectedPreset === 'custom' ? customTitle : (selectedPreset?.title ?? '')
  const currentDesc  = selectedPreset === 'custom' ? customDesc  : (selectedPreset?.desc  ?? '')

  return (
    <>
      {/* Toasts */}
      {success && (
        <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="ml-3 text-emerald-500 font-bold text-lg leading-none">×</button>
        </div>
      )}
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-3 text-red-400 font-bold text-lg leading-none">×</button>
        </div>
      )}

      {/* Pending approval banner */}
      {claimedTasks.length > 0 && (
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-amber-800 text-sm">
              {claimedTasks.length} tugas menunggu persetujuan Anda
            </p>
            <p className="text-xs text-amber-600 mt-0.5">Klik untuk menyaring dan menyetujui</p>
          </div>
          <button
            onClick={() => setFilterStatus('CLAIMED')}
            className="shrink-0 px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700"
          >
            Lihat
          </button>
        </div>
      )}

      {/* Create task trigger */}
      {!showCreateForm && (
        <div className="mb-5 flex items-center gap-3">
          <button
            onClick={() => setShowCreateForm(true)}
            disabled={!canCreate}
            className="px-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-95"
          >
            + Buat Tugas Baru
          </button>
          {taskQuotaLabel && (
            <span className={`text-xs font-medium ${tasksThisMonth >= maxTasksPerMonth ? 'text-red-500' : 'text-gray-400'}`}>
              {taskQuotaLabel}
            </span>
          )}
        </div>
      )}

      {/* ── CREATE FORM ─────────────────────────────────────────────────────── */}
      {showCreateForm && (
        <form onSubmit={handleCreate} className="mb-6 bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div>
              <h3 className="font-bold text-gray-900">Buat Tugas Baru</h3>
              {taskQuotaLabel && (
                <p className={`text-xs mt-0.5 ${tasksThisMonth >= maxTasksPerMonth ? 'text-red-500' : 'text-gray-400'}`}>
                  {taskQuotaLabel}
                </p>
              )}
            </div>
            <button type="button" onClick={resetForm} className="text-gray-400 hover:text-gray-600 text-2xl leading-none font-light">×</button>
          </div>

          <div className="p-4 space-y-5">
            {children.length === 0 ? (
              <p className="text-sm text-amber-600 py-2">Tambah anak terlebih dahulu sebelum membuat tugas.</p>
            ) : (
              <>
                {/* ── Step 1: Pick task ───────────────────── */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    1 · Pilih Jenis Tugas
                  </p>

                  <div className="space-y-2">
                    {TASK_CATALOG.map((cat) => {
                      const colors = COLOR_MAP[cat.color]
                      const isOpen = expandedCategory === cat.category
                      const hasSelection = selectedPreset && selectedPreset !== 'custom' &&
                        cat.tasks.some((t) => t.title === (selectedPreset as any).title)

                      return (
                        <div key={cat.category} className={`rounded-xl border overflow-hidden ${hasSelection ? 'border-gray-300' : 'border-gray-200'}`}>
                          {/* Category header */}
                          <button
                            type="button"
                            onClick={() => setExpandedCategory(isOpen ? null : cat.category)}
                            className={`w-full flex items-center justify-between px-3.5 py-3 text-left transition-colors ${isOpen ? colors.light : 'hover:bg-gray-50'}`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-xl">{cat.emoji}</span>
                              <span className="font-semibold text-gray-800 text-sm">{cat.category}</span>
                              {hasSelection && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${colors.badge}`}>
                                  ✓ Dipilih
                                </span>
                              )}
                            </div>
                            <span className={`text-gray-400 text-sm transition-transform ${isOpen ? 'rotate-180' : ''}`}>▾</span>
                          </button>

                          {/* Task chips */}
                          {isOpen && (
                            <div className="border-t border-gray-100 p-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                              {cat.tasks.map((t) => {
                                const chosen = selectedPreset !== 'custom' &&
                                  (selectedPreset as any)?.title === t.title
                                return (
                                  <button
                                    key={t.title}
                                    type="button"
                                    onClick={() => {
                                      setSelectedPreset(t)
                                      setExpandedCategory(null)
                                    }}
                                    className={`text-left px-3 py-2.5 rounded-xl border text-sm font-medium transition-all active:scale-95 ${
                                      chosen
                                        ? `${colors.bg} text-white border-transparent shadow-sm`
                                        : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                                  >
                                    {t.title}
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}

                    {/* Lainnya */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPreset('custom')
                        setExpandedCategory(null)
                      }}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-xl border text-left transition-all active:scale-95 ${
                        selectedPreset === 'custom'
                          ? 'border-gray-400 bg-gray-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-xl">✏️</span>
                      <span className="font-semibold text-gray-800 text-sm">Tugas Lainnya</span>
                      {selectedPreset === 'custom' && (
                        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold bg-gray-200 text-gray-600">✓ Dipilih</span>
                      )}
                    </button>
                  </div>
                </div>

                {/* ── Step 2: Task detail (shown when something is selected) ── */}
                {selectedPreset && (
                  <div className="space-y-4 pt-1 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-1">
                      2 · Detail Tugas
                    </p>

                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Judul Tugas</label>
                      {selectedPreset === 'custom' ? (
                        <input
                          name="title"
                          required
                          minLength={3}
                          maxLength={100}
                          value={customTitle}
                          onChange={(e) => setCustomTitle(e.target.value)}
                          placeholder="Tulis nama tugas..."
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      ) : (
                        <div className="flex items-center justify-between px-3 py-2.5 border border-emerald-200 bg-emerald-50 rounded-xl">
                          <span className="text-sm font-medium text-emerald-800">{currentTitle}</span>
                          <button
                            type="button"
                            onClick={() => setSelectedPreset(null)}
                            className="text-xs text-emerald-600 underline ml-2 shrink-0"
                          >
                            Ganti
                          </button>
                        </div>
                      )}
                      {/* Hidden field for preset title */}
                      {selectedPreset !== 'custom' && (
                        <input type="hidden" name="title" value={currentTitle} />
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Deskripsi <span className="text-gray-400 font-normal">(opsional)</span>
                      </label>
                      {selectedPreset === 'custom' ? (
                        <textarea
                          name="description"
                          rows={2}
                          value={customDesc}
                          onChange={(e) => setCustomDesc(e.target.value)}
                          placeholder="Instruksi lebih detail..."
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                        />
                      ) : (
                        <textarea
                          name="description"
                          rows={2}
                          defaultValue={currentDesc}
                          placeholder="Instruksi lebih detail..."
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                        />
                      )}
                    </div>

                    {/* For child */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Untuk Anak</label>
                      <select
                        name="childId"
                        required
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      >
                        <option value="">Pilih anak...</option>
                        {children.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.avatar} {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Reward */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reward (Rp)</label>
                      <input
                        name="rewardAmount"
                        type="number"
                        required
                        min={1}
                        placeholder="Contoh: 5000"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <div className="flex gap-2 mt-2">
                        {[1000, 2000, 5000, 10000].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={(e) => {
                              const input = (e.currentTarget.closest('form') as HTMLFormElement)
                                ?.querySelector<HTMLInputElement>('[name=rewardAmount]')
                              if (input) input.value = String(amt)
                            }}
                            className="text-xs px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors"
                          >
                            {(amt / 1000).toLocaleString('id-ID')}k
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 font-medium"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isPending || !selectedPreset}
                    className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
                  >
                    {isPending ? (
                      <>
                        <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Menyimpan...
                      </>
                    ) : 'Buat Tugas'}
                  </button>
                </div>
              </>
            )}
          </div>
        </form>
      )}

      {/* ── FILTER BAR ───────────────────────────────────────────────────────── */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
        {['ALL', 'PENDING', 'CLAIMED', 'APPROVED', 'REJECTED'].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterStatus === s
                ? 'bg-emerald-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s === 'ALL' ? 'Semua' : statusLabel[s]}
            {s === 'CLAIMED' && claimedTasks.length > 0 && (
              <span className="ml-1 bg-amber-400 text-white rounded-full px-1.5 text-[10px]">
                {claimedTasks.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── TASK LIST ────────────────────────────────────────────────────────── */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-10 text-center">
          <p className="text-3xl mb-2">📋</p>
          <p className="text-gray-500 text-sm">Belum ada tugas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const isThisTaskPending = isPending && activeTaskId === task.id
            const isBeingConfirmed  = confirmApproveId === task.id

            return (
              <div
                key={task.id}
                className={`bg-white rounded-xl border p-4 transition-all ${
                  isThisTaskPending ? 'border-emerald-300 opacity-75' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900">{task.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${statusColor[task.status]}`}>
                        {statusLabel[task.status]}
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-xs text-gray-400 mb-1 line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{task.child.avatar} {task.child.name}</span>
                      <span className="font-semibold text-emerald-600">
                        Rp {task.rewardAmount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* Approve / reject controls */}
                  {task.status === 'CLAIMED' && (
                    <div className="flex flex-col gap-2 shrink-0 items-end">
                      {task.proofPhotoUrl && (
                        <a
                          href={task.proofPhotoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-2 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                        >
                          📷 Bukti
                        </a>
                      )}
                      {isBeingConfirmed ? (
                        <div className="flex flex-col gap-1.5 items-end">
                          <p className="text-xs text-gray-500">Setujui tugas ini?</p>
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
                                <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
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

      {/* ── REJECT MODAL ─────────────────────────────────────────────────────── */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
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
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleReject}
                disabled={isPending && activeTaskId === rejectModal.taskId}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-1.5"
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
