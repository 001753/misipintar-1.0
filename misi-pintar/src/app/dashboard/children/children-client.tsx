'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  createChild,
  updateChild,
  changeChildPassword,
  deleteChild,
  restoreChild,
} from '@/actions/children'

type Child = {
  id: string
  name: string
  username: string
  avatar: string | null
  balance: number
  savingsBalance: number
  charityBalance: number
  deletedAt?: Date | null
}

type TaskCounts = {
  total: number
  pending: number
  approved: number
}

type Props = {
  activeChildren: Child[]
  archivedChildren: Child[]
  maxChildren: number
  avatars: string[]
  taskCountMap: Record<string, TaskCounts>
}

type Tab = 'active' | 'archived'

type Modal =
  | { type: 'create' }
  | { type: 'edit'; child: Child }
  | { type: 'password'; child: Child }
  | { type: 'deactivate'; child: Child }
  | { type: 'restore'; child: Child }
  | null

export default function ChildrenClient({
  activeChildren,
  archivedChildren,
  maxChildren,
  avatars,
  taskCountMap,
}: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('active')
  const [modal, setModal] = useState<Modal>(null)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0])
  const [usernameValue, setUsernameValue] = useState('')

  const canAdd = activeChildren.length < maxChildren

  function closeModal() {
    setModal(null)
    setError(null)
    setSelectedAvatar(avatars[0])
    setUsernameValue('')
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  function openEdit(child: Child) {
    setSelectedAvatar(child.avatar ?? avatars[0])
    setUsernameValue(child.username)
    setModal({ type: 'edit', child })
  }

  function runAction(
    action: () => Promise<{ success: boolean; error?: string }>,
    successMsg: string
  ) {
    setError(null)
    startTransition(async () => {
      const res = await action()
      if (res.success) {
        closeModal()
        showToast(successMsg)
        router.refresh()
      } else {
        setError(res.error ?? 'Terjadi kesalahan.')
      }
    })
  }

  function handleFormSubmit(
    action: (fd: FormData) => Promise<{ success: boolean; error?: string }>,
    successMsg: string
  ) {
    return (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      const fd = new FormData(e.currentTarget)
      fd.set('avatar', selectedAvatar)
      runAction(() => action(fd), successMsg)
    }
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-[100] bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-fade-up text-sm font-medium">
          <span>✅</span>
          <span>{toast}</span>
          <button onClick={() => setToast(null)} className="ml-1 opacity-70 hover:opacity-100 font-bold">×</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">👨‍👩‍👧 Keluarga</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            <span className="font-bold text-emerald-600">{activeChildren.length}</span>
            <span className="text-gray-400">/{maxChildren} anak aktif</span>
            {archivedChildren.length > 0 && (
              <span className="ml-2 text-gray-400">· {archivedChildren.length} diarsipkan</span>
            )}
          </p>
        </div>
        <button
          onClick={() => { setSelectedAvatar(avatars[0]); setUsernameValue(''); setModal({ type: 'create' }) }}
          disabled={!canAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-2xl hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md active:scale-95"
        >
          <span className="text-base leading-none">+</span>
          Tambah Anak
        </button>
      </div>

      {!canAdd && (
        <div className="mb-5 flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-700">
          <span>⚠️</span>
          <span>Batas {maxChildren} anak aktif tercapai. <Link href="/dashboard/billing" className="underline font-semibold hover:text-amber-900">Upgrade plan</Link> untuk menambah lebih banyak.</span>
        </div>
      )}

      {/* Tab Bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-fit mb-6">
        <button
          onClick={() => setTab('active')}
          className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
            tab === 'active'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Aktif
          <span className={`ml-2 px-1.5 py-0.5 rounded-md text-xs font-bold ${
            tab === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'
          }`}>
            {activeChildren.length}
          </span>
        </button>
        <button
          onClick={() => setTab('archived')}
          className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
            tab === 'archived'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Arsip
          {archivedChildren.length > 0 && (
            <span className={`ml-2 px-1.5 py-0.5 rounded-md text-xs font-bold ${
              tab === 'archived' ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-500'
            }`}>
              {archivedChildren.length}
            </span>
          )}
        </button>
      </div>

      {/* Active Tab */}
      {tab === 'active' && (
        activeChildren.length === 0 ? (
          <EmptyState
            emoji="👧"
            title="Belum ada anak terdaftar"
            desc='Klik "Tambah Anak" untuk memulai perjalanan keluarga.'
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeChildren.map((child) => (
              <ChildCard
                key={child.id}
                child={child}
                tasks={taskCountMap[child.id]}
                onEdit={() => openEdit(child)}
                onPassword={() => { setError(null); setModal({ type: 'password', child }) }}
                onDeactivate={() => { setError(null); setModal({ type: 'deactivate', child }) }}
              />
            ))}
          </div>
        )
      )}

      {/* Archived Tab */}
      {tab === 'archived' && (
        archivedChildren.length === 0 ? (
          <EmptyState
            emoji="🗂️"
            title="Tidak ada akun yang diarsipkan"
            desc="Akun anak yang dinonaktifkan akan muncul di sini."
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {archivedChildren.map((child) => (
              <ArchivedChildCard
                key={child.id}
                child={child}
                tasks={taskCountMap[child.id]}
                onRestore={() => { setError(null); setModal({ type: 'restore', child }) }}
              />
            ))}
          </div>
        )
      )}

      {/* ── Modals ── */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">

            {/* Create */}
            {modal.type === 'create' && (
              <form onSubmit={handleFormSubmit(createChild, 'Akun anak berhasil ditambahkan!')} className="p-6 space-y-4">
                <ModalHeader title="Tambah Anak" onClose={closeModal} />
                <AvatarPicker avatars={avatars} selected={selectedAvatar} onChange={setSelectedAvatar} />
                <Field label="Nama Lengkap" name="name" placeholder="Contoh: Budi Santoso" required />
                <UsernameField value={usernameValue} onChange={setUsernameValue} />
                <Field label="Password" name="password" type="password" placeholder="Min. 6 karakter" required />
                <ErrorBox error={error} />
                <ModalActions onCancel={closeModal} isPending={isPending} submitLabel="Tambah Anak" />
              </form>
            )}

            {/* Edit */}
            {modal.type === 'edit' && (
              <form
                onSubmit={handleFormSubmit((fd) => updateChild(modal.child.id, fd), 'Data anak berhasil diperbarui.')}
                className="p-6 space-y-4"
              >
                <ModalHeader title="Edit Profil Anak" onClose={closeModal} />
                <p className="text-sm text-gray-500 -mt-2">Mengubah profil <strong className="text-gray-800">{modal.child.name}</strong></p>
                <AvatarPicker avatars={avatars} selected={selectedAvatar} onChange={setSelectedAvatar} />
                <Field label="Nama Lengkap" name="name" defaultValue={modal.child.name} required />
                <UsernameField value={usernameValue} onChange={setUsernameValue} label="Username" />
                <ErrorBox error={error} />
                <ModalActions onCancel={closeModal} isPending={isPending} submitLabel="Simpan Perubahan" />
              </form>
            )}

            {/* Change Password */}
            {modal.type === 'password' && (
              <form
                onSubmit={handleFormSubmit((fd) => changeChildPassword(modal.child.id, fd), 'Password anak berhasil diubah.')}
                className="p-6 space-y-4"
              >
                <ModalHeader title="Reset Password" onClose={closeModal} />
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-2xl">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xl flex-shrink-0">
                    {modal.child.avatar?.startsWith('data:image/') ? (
                      <img src={modal.child.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span>{modal.child.avatar ?? '🧒'}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{modal.child.name}</p>
                    <p className="text-xs text-gray-500">@{modal.child.username}</p>
                  </div>
                </div>
                <Field label="Password Baru" name="newPassword" type="password" placeholder="Min. 6 karakter" required />
                <p className="text-xs text-gray-400 -mt-2">Password tidak boleh sama dengan username anak.</p>
                <ErrorBox error={error} />
                <ModalActions onCancel={closeModal} isPending={isPending} submitLabel="Simpan Password" submitColor="blue" />
              </form>
            )}

            {/* Deactivate */}
            {modal.type === 'deactivate' && (
              <div className="p-6 space-y-4">
                <ModalHeader title="Nonaktifkan Akun" onClose={closeModal} />
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl flex-shrink-0">
                    {modal.child.avatar?.startsWith('data:image/') ? (
                      <img src={modal.child.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span>{modal.child.avatar ?? '🧒'}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{modal.child.name}</p>
                    <p className="text-sm text-gray-500">@{modal.child.username}</p>
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-1">
                  <p className="text-sm font-semibold text-amber-800">Yang akan terjadi:</p>
                  <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                    <li>Anak tidak bisa login ke akun ini</li>
                    <li>Semua riwayat tugas & transaksi tetap tersimpan</li>
                    <li>Akun bisa dipulihkan kapan saja dari tab Arsip</li>
                  </ul>
                </div>
                <ErrorBox error={error} />
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isPending}
                    className="flex-1 py-2.5 border border-gray-200 rounded-2xl text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 font-medium"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => runAction(() => deleteChild(modal.child.id), 'Akun anak berhasil dinonaktifkan.')}
                    className="flex-1 py-2.5 bg-red-500 text-white rounded-2xl text-sm font-semibold hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                  >
                    {isPending ? <Spinner /> : '🚫 Nonaktifkan'}
                  </button>
                </div>
              </div>
            )}

            {/* Restore */}
            {modal.type === 'restore' && (
              <div className="p-6 space-y-4">
                <ModalHeader title="Pulihkan Akun" onClose={closeModal} />
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl flex-shrink-0 opacity-60">
                    {modal.child.avatar?.startsWith('data:image/') ? (
                      <img src={modal.child.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span>{modal.child.avatar ?? '🧒'}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{modal.child.name}</p>
                    <p className="text-sm text-gray-500">@{modal.child.username}</p>
                  </div>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-sm text-emerald-700">
                  Akun ini akan aktif kembali dan anak bisa login seperti biasa.
                </div>
                <ErrorBox error={error} />
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isPending}
                    className="flex-1 py-2.5 border border-gray-200 rounded-2xl text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 font-medium"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => runAction(() => restoreChild(modal.child.id), 'Akun anak berhasil dipulihkan!')}
                    className="flex-1 py-2.5 bg-emerald-600 text-white rounded-2xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                  >
                    {isPending ? <Spinner /> : '✅ Pulihkan Akun'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  )
}

// ── Sub-components ──────────────────────────────────────────

function ChildCard({
  child,
  tasks,
  onEdit,
  onPassword,
  onDeactivate,
}: {
  child: Child
  tasks?: TaskCounts
  onEdit: () => void
  onPassword: () => void
  onDeactivate: () => void
}) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Card header */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center text-3xl overflow-hidden flex-shrink-0 border border-emerald-100">
              {child.avatar?.startsWith('data:image/') ? (
                <img src={child.avatar} alt={child.name} className="w-full h-full object-cover" />
              ) : (
                <span>{child.avatar ?? '🧒'}</span>
              )}
            </div>
            <div>
              <p className="font-bold text-gray-900 leading-tight">{child.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">@{child.username}</p>
            </div>
          </div>
          <div className="flex-shrink-0">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              Aktif
            </span>
          </div>
        </div>

        {/* Balance stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <StatBox label="Saldo" value={child.balance} color="emerald" />
          <StatBox label="Tabungan" value={child.savingsBalance} color="blue" />
          <StatBox label="Sedekah" value={child.charityBalance} color="purple" />
        </div>

        {/* Task stats */}
        {tasks && (
          <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-2xl">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span>📋</span>
              <span><strong className="text-gray-800">{tasks.total}</strong> total tugas</span>
            </div>
            <div className="w-px h-3 bg-gray-200" />
            <div className="flex items-center gap-1.5 text-xs text-amber-600">
              <span>⏳</span>
              <span><strong>{tasks.pending}</strong> menunggu</span>
            </div>
            <div className="w-px h-3 bg-gray-200" />
            <div className="flex items-center gap-1.5 text-xs text-emerald-600">
              <span>✅</span>
              <span><strong>{tasks.approved}</strong> selesai</span>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="border-t border-gray-50 px-5 py-3 flex items-center gap-2">
        <Link
          href={`/dashboard/history/${child.id}`}
          className="flex-1 text-xs py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-center font-medium transition-colors"
        >
          📋 Riwayat
        </Link>
        <button
          onClick={onEdit}
          className="flex-1 text-xs py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl font-medium transition-colors"
        >
          ✏️ Edit
        </button>
        <button
          onClick={onPassword}
          className="flex-1 text-xs py-2 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-xl font-medium transition-colors"
        >
          🔑 Password
        </button>
        <button
          onClick={onDeactivate}
          className="px-3 py-2 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-xl transition-colors"
          title="Nonaktifkan akun"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function ArchivedChildCard({
  child,
  tasks,
  onRestore,
}: {
  child: Child
  tasks?: TaskCounts
  onRestore: () => void
}) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden opacity-70 hover:opacity-90 transition-opacity">
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-3xl overflow-hidden flex-shrink-0 border border-gray-200 grayscale">
              {child.avatar?.startsWith('data:image/') ? (
                <img src={child.avatar} alt={child.name} className="w-full h-full object-cover" />
              ) : (
                <span>{child.avatar ?? '🧒'}</span>
              )}
            </div>
            <div>
              <p className="font-bold text-gray-600 leading-tight">{child.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">@{child.username}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-500 text-xs font-semibold rounded-xl flex-shrink-0">
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
            Nonaktif
          </span>
        </div>

        {tasks && tasks.total > 0 && (
          <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-2xl mb-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span>📋</span>
              <span><strong className="text-gray-500">{tasks.total}</strong> riwayat tugas</span>
            </div>
            <div className="w-px h-3 bg-gray-200" />
            <div className="flex items-center gap-1.5 text-xs text-emerald-500">
              <span>✅</span>
              <span><strong>{tasks.approved}</strong> selesai</span>
            </div>
          </div>
        )}
      </div>
      <div className="border-t border-gray-50 px-5 py-3">
        <button
          onClick={onRestore}
          className="w-full text-xs py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-1.5"
        >
          ✅ Pulihkan Akun
        </button>
      </div>
    </div>
  )
}

function StatBox({ label, value, color }: { label: string; value: number; color: 'emerald' | 'blue' | 'purple' }) {
  const styles = {
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
  }
  return (
    <div className={`${styles[color]} rounded-xl p-2 text-center`}>
      <p className="text-[9px] font-medium uppercase tracking-wide opacity-70">{label}</p>
      <p className="text-xs font-black mt-0.5 tabular-nums">
        {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toLocaleString('id-ID')}
      </p>
    </div>
  )
}

function EmptyState({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
  return (
    <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-16 text-center">
      <p className="text-5xl mb-4">{emoji}</p>
      <p className="text-gray-700 font-semibold">{title}</p>
      <p className="text-gray-400 text-sm mt-1">{desc}</p>
    </div>
  )
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-black text-gray-900">{title}</h2>
      <button
        type="button"
        onClick={onClose}
        className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors text-lg font-bold"
      >
        ×
      </button>
    </div>
  )
}

function AvatarPicker({
  avatars,
  selected,
  onChange,
}: {
  avatars: string[]
  selected: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">Avatar</label>
      <div className="flex flex-wrap gap-2">
        {avatars.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => onChange(a)}
            className={`w-11 h-11 rounded-2xl text-xl flex items-center justify-center transition-all ${
              selected === a
                ? 'bg-emerald-100 ring-2 ring-emerald-500 scale-110'
                : 'bg-gray-100 hover:bg-gray-200 hover:scale-105'
            }`}
          >
            {a}
          </button>
        ))}
      </div>
    </div>
  )
}

function Field({
  label,
  name,
  type = 'text',
  placeholder,
  defaultValue,
  required,
}: {
  label: string
  name: string
  type?: string
  placeholder?: string
  defaultValue?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={required}
        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
      />
    </div>
  )
}

function UsernameField({
  value,
  onChange,
  label = 'Username',
}: {
  value: string
  onChange: (v: string) => void
  label?: string
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
        <input
          name="username"
          type="text"
          placeholder="budi123"
          required
          value={value}
          onChange={(e) => onChange(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
          className="w-full pl-8 pr-3.5 py-2.5 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
        />
      </div>
      <p className="text-xs text-gray-400 mt-1">Huruf kecil, angka, dan underscore saja. Min. 3 karakter.</p>
    </div>
  )
}

function ErrorBox({ error }: { error: string | null }) {
  if (!error) return null
  return (
    <div className="flex items-start gap-2 px-3.5 py-3 bg-red-50 border border-red-200 rounded-2xl">
      <span className="text-red-500 mt-0.5 flex-shrink-0">⚠️</span>
      <p className="text-sm text-red-700">{error}</p>
    </div>
  )
}

function ModalActions({
  onCancel,
  isPending,
  submitLabel,
  submitColor = 'emerald',
}: {
  onCancel: () => void
  isPending: boolean
  submitLabel: string
  submitColor?: 'emerald' | 'blue'
}) {
  const colors = {
    emerald: 'bg-emerald-600 hover:bg-emerald-700',
    blue: 'bg-blue-600 hover:bg-blue-700',
  }
  return (
    <div className="flex gap-3 pt-2">
      <button
        type="button"
        onClick={onCancel}
        disabled={isPending}
        className="flex-1 py-2.5 border border-gray-200 rounded-2xl text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 font-medium transition-colors"
      >
        Batal
      </button>
      <button
        type="submit"
        disabled={isPending}
        className={`flex-1 py-2.5 ${colors[submitColor]} text-white rounded-2xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition-colors`}
      >
        {isPending ? <Spinner /> : submitLabel}
      </button>
    </div>
  )
}

function Spinner() {
  return (
    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
  )
}
