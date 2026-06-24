'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createChild } from '@/actions/children'
import { createTask } from '@/actions/tasks'

const AVATARS = ['🧒', '👦', '👧', '🧑', '🐱', '🐶', '🦁', '🐼', '🦊', '🐯']

const MISSION_TEMPLATES = [
  { icon: '🛏️', title: 'Merapikan Kamar', reward: 5000 },
  { icon: '🍽️', title: 'Mencuci Piring', reward: 3000 },
  { icon: '📚', title: 'Mengerjakan PR', reward: 8000 },
  { icon: '🧹', title: 'Menyapu Rumah', reward: 4000 },
  { icon: '🗑️', title: 'Buang Sampah', reward: 2000 },
  { icon: '✏️', title: 'Belajar Mandiri 30 Menit', reward: 6000 },
]

interface Props {
  familyName: string
  spaceCode: string
  parentName: string
}

export default function OnboardingWizard({ familyName, spaceCode, parentName }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [childId, setChildId] = useState<string | null>(null)
  const [childName, setChildName] = useState('')

  const [selectedAvatar, setSelectedAvatar] = useState('🧒')
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null)
  const [customTitle, setCustomTitle] = useState('')
  const [customReward, setCustomReward] = useState('')

  const firstName = parentName.split(' ')[0]

  const inputClass =
    'w-full px-4 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-gray-750 transition-all'

  function handleAddChild(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    fd.set('avatar', selectedAvatar)
    startTransition(async () => {
      const res = await createChild(fd)
      if (res.success) {
        setChildName(fd.get('name')?.toString() ?? '')
        setChildId(res.data.childId)
        setStep(3)
      } else {
        setError(res.error ?? 'Gagal membuat akun anak.')
      }
    })
  }

  function handleCreateMission(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    if (!childId) return

    const title =
      selectedTemplate !== null
        ? MISSION_TEMPLATES[selectedTemplate].title
        : customTitle.trim()
    const reward =
      selectedTemplate !== null
        ? MISSION_TEMPLATES[selectedTemplate].reward
        : parseInt(customReward, 10)

    if (!title) return setError('Pilih atau tulis judul misi.')
    if (!reward || reward <= 0) return setError('Masukkan nominal reward yang valid.')

    const fd = new FormData()
    fd.set('childId', childId)
    fd.set('title', title)
    fd.set('rewardAmount', String(reward))

    startTransition(async () => {
      const res = await createTask(fd)
      if (res.success) {
        setStep(4)
      } else {
        setError(res.error ?? 'Gagal membuat misi.')
      }
    })
  }

  const stepLabels = ['Selamat Datang', 'Tambah Anak', 'Misi Pertama', 'Selesai!']

  return (
    <div className="max-w-lg mx-auto">
      {step < 4 && (
        <div className="mb-6 animate-fade-up">
          <div className="flex items-center gap-2 mb-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    s <= step ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
            Langkah {step} dari 3 — {stepLabels[step - 1]}
          </p>
        </div>
      )}

      {/* ── Step 1: Welcome ── */}
      {step === 1 && (
        <div className="animate-fade-up space-y-5">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-8 text-center shadow-sm">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-100 dark:shadow-emerald-900/30">
              <span className="text-4xl">🎯</span>
            </div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-gray-50 mb-1">
              Halo, {firstName}! 👋
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">
              FamilySpace <span className="font-bold text-emerald-600 dark:text-emerald-400">{familyName}</span> siap!
              Mari setup dalam 2 langkah cepat.
            </p>

            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 rounded-2xl p-4 mb-6 text-left space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black text-sm flex-shrink-0">1</span>
                <div>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Tambah akun anak</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Buat login khusus untuk si kecil</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black text-sm flex-shrink-0">2</span>
                <div>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Buat misi pertama</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Pilih tugas & tentukan rewardnya</p>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900 rounded-xl p-3 mb-6 text-left flex gap-2">
              <span className="flex-shrink-0">🏠</span>
              <div>
                <p className="text-xs font-bold text-amber-700 dark:text-amber-300">Kode Keluarga</p>
                <p className="text-lg font-black tracking-widest text-amber-700 dark:text-amber-400 font-mono">{spaceCode}</p>
                <p className="text-xs text-amber-600 dark:text-amber-500">Bagikan ke anak untuk login</p>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="btn-press w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold rounded-2xl shadow-md shadow-emerald-100 dark:shadow-emerald-900/20 transition-all text-sm"
            >
              Mulai Setup →
            </button>
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            className="w-full text-center text-xs text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 transition-colors"
          >
            Lewati, setup nanti
          </button>
        </div>
      )}

      {/* ── Step 2: Add Child ── */}
      {step === 2 && (
        <div className="animate-fade-up">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
            <div className="text-center mb-6">
              <p className="text-3xl mb-2">👧</p>
              <h2 className="text-xl font-black text-gray-900 dark:text-gray-50">Tambah Akun Anak</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Buat akun login untuk si kecil</p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Pilih Avatar</p>
              <div className="flex flex-wrap gap-2">
                {AVATARS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setSelectedAvatar(a)}
                    className={`w-11 h-11 rounded-2xl text-2xl flex items-center justify-center transition-all border-2 ${
                      selectedAvatar === a
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 scale-110 shadow-sm'
                        : 'border-transparent bg-gray-100 dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleAddChild} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-1">
                  Nama Anak
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  minLength={2}
                  placeholder="cth: Budi"
                  className={inputClass}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-1">
                  Username
                </label>
                <input
                  name="username"
                  type="text"
                  required
                  minLength={3}
                  maxLength={20}
                  placeholder="cth: budi123"
                  pattern="[a-z0-9_]+"
                  className={inputClass}
                />
                <p className="text-xs text-gray-400 dark:text-gray-500 px-1">
                  Huruf kecil, angka, underscore. Untuk login anak.
                </p>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-1">
                  Password Anak
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  placeholder="Min 6 karakter"
                  className={inputClass}
                />
                <p className="text-xs text-gray-400 dark:text-gray-500 px-1">
                  Buat password yang mudah diingat anak
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setError(null); setStep(1) }}
                  className="flex-1 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-semibold text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  ← Kembali
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-[2] py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 disabled:from-emerald-300 disabled:to-emerald-300 dark:disabled:from-gray-700 dark:disabled:to-gray-700 text-white font-bold rounded-2xl shadow-md shadow-emerald-100 dark:shadow-emerald-900/20 transition-all text-sm"
                >
                  {isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Membuat...
                    </span>
                  ) : (
                    'Lanjut →'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Step 3: Create Mission ── */}
      {step === 3 && (
        <div className="animate-fade-up">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
            <div className="text-center mb-6">
              <p className="text-3xl mb-2">📋</p>
              <h2 className="text-xl font-black text-gray-900 dark:text-gray-50">Misi Pertama</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Pilih tugas untuk{' '}
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{childName}</span>
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleCreateMission} className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Pilih Template Cepat
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {MISSION_TEMPLATES.map((t, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setSelectedTemplate(i)
                        setCustomTitle('')
                        setCustomReward('')
                      }}
                      className={`flex items-center gap-2 p-3 rounded-2xl border-2 text-left transition-all ${
                        selectedTemplate === i
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50'
                          : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <span className="text-xl flex-shrink-0">{t.icon}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{t.title}</p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                          Rp {t.reward.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                <span className="text-xs text-gray-400 dark:text-gray-500 font-medium flex-shrink-0">atau tulis sendiri</span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => {
                    setCustomTitle(e.target.value)
                    setSelectedTemplate(null)
                  }}
                  placeholder="Judul misi custom..."
                  className={inputClass}
                />
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400 font-medium">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={customReward}
                    onChange={(e) => {
                      setCustomReward(e.target.value)
                      setSelectedTemplate(null)
                    }}
                    placeholder="Nominal reward"
                    min={100}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setError(null); setStep(2) }}
                  className="flex-1 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-semibold text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  ← Kembali
                </button>
                <button
                  type="submit"
                  disabled={isPending || (selectedTemplate === null && (!customTitle.trim() || !customReward))}
                  className="flex-[2] py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 disabled:from-emerald-300 disabled:to-emerald-300 dark:disabled:from-gray-700 dark:disabled:to-gray-700 text-white font-bold rounded-2xl shadow-md shadow-emerald-100 dark:shadow-emerald-900/20 transition-all text-sm disabled:cursor-not-allowed"
                >
                  {isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Membuat...
                    </span>
                  ) : (
                    'Buat Misi 🚀'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Step 4: Done ── */}
      {step === 4 && (
        <div className="animate-fade-up">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-8 text-center shadow-sm">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-5 shadow-xl shadow-emerald-100 dark:shadow-emerald-900/30 animate-pop-in">
              <span className="text-5xl">🎉</span>
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-gray-50 mb-2">Siap Beraksi!</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-8">
              {childName} sudah terdaftar dan misi pertama sudah dibuat.
              Sekarang bagikan <span className="font-bold text-emerald-600 dark:text-emerald-400">Kode Keluarga</span> ke{' '}
              {childName} agar bisa login dan mulai menyelesaikan misi!
            </p>

            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 rounded-2xl p-4 mb-8">
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-widest mb-1">
                🏠 Kode Keluarga
              </p>
              <p className="text-4xl font-black tracking-[0.4em] text-emerald-700 dark:text-emerald-400 font-mono">
                {spaceCode}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="btn-press w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold rounded-2xl shadow-md shadow-emerald-100 dark:shadow-emerald-900/20 transition-all text-sm"
              >
                Lihat Dashboard →
              </button>
              <button
                onClick={() => router.push('/dashboard/tasks')}
                className="w-full py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-semibold text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Buat Misi Lainnya
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
