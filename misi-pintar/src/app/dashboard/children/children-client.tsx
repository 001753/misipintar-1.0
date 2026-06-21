'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createChild, updateChild, changeChildPassword, deleteChild } from '@/actions/children'

type Child = {
  id: string
  name: string
  username: string
  avatar: string | null
  balance: number
  savingsBalance: number
  charityBalance: number
}

type Props = {
  children: Child[]
  maxChildren: number
  avatars: string[]
}

type Modal =
  | { type: 'create' }
  | { type: 'edit'; child: Child }
  | { type: 'password'; child: Child }
  | { type: 'delete'; child: Child }
  | null

export default function ChildrenClient({ children, maxChildren, avatars }: Props) {
  const router = useRouter()
  const [modal, setModal] = useState<Modal>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0])

  function closeModal() {
    setModal(null)
    setError(null)
    setSelectedAvatar(avatars[0])
  }

  function handleSubmit(action: (fd: FormData) => Promise<{ success: boolean; error?: string }>) {
    return (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      setError(null)
      const fd = new FormData(e.currentTarget)
      fd.set('avatar', selectedAvatar)
      startTransition(async () => {
        const res = await action(fd)
        if (res.success) {
          closeModal()
          setSuccess('Berhasil!')
          setTimeout(() => setSuccess(null), 3000)
          router.refresh()
        } else {
          setError(res.error ?? 'Terjadi kesalahan.')
        }
      })
    }
  }

  const canAdd = children.length < maxChildren

  return (
    <>
      {success && (
        <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl">
          {success}
        </div>
      )}

      {/* Add button */}
      <div className="mb-6">
        <button
          onClick={() => { setSelectedAvatar(avatars[0]); setModal({ type: 'create' }) }}
          disabled={!canAdd}
          className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          + Tambah Anak
        </button>
        {!canAdd && (
          <p className="text-xs text-amber-600 mt-1">
            Batas {maxChildren} anak tercapai. Upgrade plan untuk menambah lebih banyak.
          </p>
        )}
      </div>

      {/* Children grid */}
      {children.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-4xl mb-3">👧</p>
          <p className="text-gray-600 font-medium">Belum ada anak terdaftar</p>
          <p className="text-gray-400 text-sm mt-1">Klik "Tambah Anak" untuk memulai</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {children.map((child) => (
            <div key={child.id} className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-2xl">
                  {child.avatar ?? '🧒'}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{child.name}</p>
                  <p className="text-xs text-gray-400">@{child.username}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-[10px] text-gray-500">Saldo</p>
                  <p className="text-xs font-bold text-emerald-600">
                    {child.balance.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-2">
                  <p className="text-[10px] text-blue-500">Tabungan</p>
                  <p className="text-xs font-bold text-blue-600">
                    {child.savingsBalance.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-2">
                  <p className="text-[10px] text-purple-500">Sedekah</p>
                  <p className="text-xs font-bold text-purple-600">
                    {child.charityBalance.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mb-2">
                <Link
                  href={`/dashboard/history/${child.id}`}
                  className="flex-1 text-xs py-1.5 border border-emerald-200 rounded-lg hover:bg-emerald-50 text-emerald-600 text-center transition-colors"
                >
                  📋 Riwayat
                </Link>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setSelectedAvatar(child.avatar ?? avatars[0]); setModal({ type: 'edit', child }) }}
                  className="flex-1 text-xs py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => setModal({ type: 'password', child })}
                  className="flex-1 text-xs py-1.5 border border-blue-200 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                >
                  Password
                </button>
                <button
                  onClick={() => setModal({ type: 'delete', child })}
                  className="flex-1 text-xs py-1.5 border border-red-200 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            {/* Create Modal */}
            {modal.type === 'create' && (
              <form onSubmit={handleSubmit(createChild)} className="p-6 space-y-4">
                <h2 className="text-lg font-bold text-gray-900">Tambah Anak</h2>
                <AvatarPicker avatars={avatars} selected={selectedAvatar} onChange={setSelectedAvatar} />
                <Field label="Nama Lengkap" name="name" placeholder="Contoh: Budi Santoso" required />
                <Field label="Username" name="username" placeholder="Contoh: budi (huruf kecil)" required />
                <Field label="Password" name="password" type="password" placeholder="Min. 6 karakter" required />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <ModalActions onCancel={closeModal} isPending={isPending} submitLabel="Tambah Anak" />
              </form>
            )}

            {/* Edit Modal */}
            {modal.type === 'edit' && (
              <form
                onSubmit={handleSubmit((fd) => updateChild(modal.child.id, fd))}
                className="p-6 space-y-4"
              >
                <h2 className="text-lg font-bold text-gray-900">Edit Anak</h2>
                <AvatarPicker avatars={avatars} selected={selectedAvatar} onChange={setSelectedAvatar} />
                <Field label="Nama Lengkap" name="name" defaultValue={modal.child.name} required />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <ModalActions onCancel={closeModal} isPending={isPending} submitLabel="Simpan" />
              </form>
            )}

            {/* Change Password Modal */}
            {modal.type === 'password' && (
              <form
                onSubmit={handleSubmit((fd) => changeChildPassword(modal.child.id, fd))}
                className="p-6 space-y-4"
              >
                <h2 className="text-lg font-bold text-gray-900">Ganti Password</h2>
                <p className="text-sm text-gray-500">Ganti password untuk <strong>{modal.child.name}</strong></p>
                <Field label="Password Baru" name="newPassword" type="password" placeholder="Min. 6 karakter" required />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <ModalActions onCancel={closeModal} isPending={isPending} submitLabel="Simpan Password" />
              </form>
            )}

            {/* Delete Modal */}
            {modal.type === 'delete' && (
              <div className="p-6 space-y-4">
                <h2 className="text-lg font-bold text-gray-900">Hapus Anak</h2>
                <p className="text-sm text-gray-600">
                  Yakin ingin menghapus akun <strong>{modal.child.name}</strong>? Riwayat transaksi akan tetap tersimpan.
                </p>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      setError(null)
                      startTransition(async () => {
                        const res = await deleteChild(modal.child.id)
                        if (res.success) {
                          closeModal()
                          router.refresh()
                        } else {
                          setError(res.error ?? 'Terjadi kesalahan.')
                        }
                      })
                    }}
                    className="flex-1 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 disabled:opacity-50"
                  >
                    {isPending ? 'Menghapus...' : 'Ya, Hapus'}
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

function Field({
  label, name, type = 'text', placeholder, defaultValue, required,
}: {
  label: string; name: string; type?: string; placeholder?: string; defaultValue?: string; required?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={required}
        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
    </div>
  )
}

function AvatarPicker({ avatars, selected, onChange }: { avatars: string[]; selected: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Avatar</label>
      <div className="flex flex-wrap gap-2">
        {avatars.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => onChange(a)}
            className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
              selected === a ? 'bg-emerald-100 ring-2 ring-emerald-500' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {a}
          </button>
        ))}
      </div>
    </div>
  )
}

function ModalActions({ onCancel, isPending, submitLabel }: { onCancel: () => void; isPending: boolean; submitLabel: string }) {
  return (
    <div className="flex gap-3 pt-2">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
      >
        Batal
      </button>
      <button
        type="submit"
        disabled={isPending}
        className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
      >
        {isPending ? 'Menyimpan...' : submitLabel}
      </button>
    </div>
  )
}
