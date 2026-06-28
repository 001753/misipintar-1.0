'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createChild } from '@/actions/children'
import { createTask } from '@/actions/tasks'

const AVATARS = ['🧒', '👦', '👧', '🧑', '🐱', '🐶', '🦁', '🐼', '🦊', '🐯', '🐸', '🐧']

const MISSION_TEMPLATES = [
  { icon: '🛏️', title: 'Merapikan Kamar', reward: 5000 },
  { icon: '📚', title: 'Mengerjakan PR', reward: 8000 },
  { icon: '🍽️', title: 'Mencuci Piring', reward: 3000 },
  { icon: '🧹', title: 'Menyapu Rumah', reward: 4000 },
  { icon: '🗑️', title: 'Buang Sampah', reward: 2000 },
  { icon: '✏️', title: 'Belajar 30 Menit', reward: 6000 },
]

const STEPS = [
  { label: 'Selamat Datang', icon: '👋' },
  { label: 'Profil Anak', icon: '👧' },
  { label: 'Misi Pertama', icon: '🎯' },
  { label: 'Selesai', icon: '🎉' },
]

interface Props {
  familyName: string
  spaceCode: string
  parentName: string
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
}

const Spinner = () => (
  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
)

export default function OnboardingWizard({ familyName, spaceCode, parentName }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [childId, setChildId] = useState<string | null>(null)
  const [childName, setChildName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState('🧒')
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null)
  const [customTitle, setCustomTitle] = useState('')
  const [customReward, setCustomReward] = useState('')
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(spaceCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const firstName = parentName.split(' ')[0]

  const goTo = (next: number) => {
    setDir(next > step ? 1 : -1)
    setError(null)
    setStep(next)
  }

  const inputClass =
    'w-full px-4 py-3.5 rounded-2xl border border-slate-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-white dark:bg-gray-800 text-slate-900 dark:text-gray-100 placeholder:text-slate-400 dark:placeholder:text-gray-500 transition-all shadow-sm'

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
        goTo(2)
      } else {
        setError(res.error ?? 'Gagal membuat akun anak.')
      }
    })
  }

  function handleCreateMission(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    if (!childId) return
    const title = selectedTemplate !== null ? MISSION_TEMPLATES[selectedTemplate].title : customTitle.trim()
    const reward = selectedTemplate !== null ? MISSION_TEMPLATES[selectedTemplate].reward : parseInt(customReward, 10)
    if (!title) return setError('Pilih atau tulis judul misi.')
    if (!reward || reward <= 0) return setError('Masukkan nominal reward yang valid.')
    const fd = new FormData()
    fd.set('childId', childId)
    fd.set('title', title)
    fd.set('rewardAmount', String(reward))
    startTransition(async () => {
      const res = await createTask(fd)
      if (res.success) goTo(3)
      else setError(res.error ?? 'Gagal membuat misi.')
    })
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-8">

      {/* Progress stepper */}
      {step < 3 && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md mb-8"
        >
          <div className="flex items-center gap-0">
            {STEPS.slice(0, 3).map((s, i) => (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    i < step
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200 dark:shadow-emerald-900/40'
                      : i === step
                      ? 'bg-white dark:bg-gray-900 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-md'
                      : 'bg-slate-100 dark:bg-gray-800 text-slate-400 dark:text-gray-600'
                  }`}>
                    {i < step ? '✓' : s.icon}
                  </div>
                  <span className={`text-[10px] font-semibold whitespace-nowrap transition-colors ${
                    i === step ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-gray-600'
                  }`}>{s.label}</span>
                </div>
                {i < 2 && (
                  <div className="flex-1 mx-2 mb-4">
                    <div className="h-0.5 bg-slate-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{ width: i < step ? '100%' : '0%' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Step card */}
      <div className="w-full max-w-md relative" style={{ minHeight: 420 }}>
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            className="w-full"
          >

            {/* ── Step 0: Welcome ── */}
            {step === 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-3xl border border-slate-100 dark:border-gray-800 shadow-xl shadow-slate-200/60 dark:shadow-black/40 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500" />
                <div className="p-8 text-center">
                  <div className="relative inline-flex mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200/60 dark:shadow-emerald-900/40">
                      <span className="text-4xl">🎯</span>
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center text-xs shadow-md">✨</div>
                  </div>
                  <h1 className="text-2xl font-black text-slate-900 dark:text-gray-50 mb-2">
                    Halo, {firstName}! 👋
                  </h1>
                  <p className="text-slate-500 dark:text-gray-400 text-sm leading-relaxed mb-8">
                    FamilySpace <span className="font-bold text-emerald-600 dark:text-emerald-400">{familyName}</span> sudah siap.
                    Setup hanya butuh <strong className="text-slate-700 dark:text-gray-300">2 menit</strong>.
                  </p>

                  <div className="space-y-3 mb-8 text-left">
                    {[
                      { num: '1', title: 'Tambah akun anak', desc: 'Login khusus si kecil', done: false },
                      { num: '2', title: 'Buat misi pertama', desc: 'Tugas + reward otomatis', done: false },
                    ].map((item) => (
                      <div key={item.num} className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-gray-800/60 border border-slate-100 dark:border-gray-700/50">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black text-sm flex-shrink-0 shadow-sm shadow-emerald-200 dark:shadow-emerald-900/30">
                          {item.num}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-gray-200">{item.title}</p>
                          <p className="text-xs text-slate-500 dark:text-gray-400">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/50 rounded-2xl px-4 py-3 mb-6 flex items-center gap-3 text-left">
                    <span className="text-2xl flex-shrink-0">🏠</span>
                    <div>
                      <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">Kode Keluarga</p>
                      <p className="text-xl font-black tracking-[0.3em] text-amber-700 dark:text-amber-300 font-mono leading-tight">{spaceCode}</p>
                      <p className="text-[11px] text-amber-600/80 dark:text-amber-500/80">Bagikan ke anak untuk login</p>
                    </div>
                  </div>

                  <button
                    onClick={() => goTo(1)}
                    className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 dark:shadow-emerald-900/40 transition-all text-sm active:scale-[0.98]"
                  >
                    Mulai Setup →
                  </button>
                </div>
                <div className="px-8 pb-5 text-center">
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="text-xs text-slate-400 dark:text-gray-500 hover:text-slate-500 dark:hover:text-gray-400 transition-colors"
                  >
                    Lewati, setup nanti
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 1: Add Child ── */}
            {step === 1 && (
              <div className="bg-white dark:bg-gray-900 rounded-3xl border border-slate-100 dark:border-gray-800 shadow-xl shadow-slate-200/60 dark:shadow-black/40 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500" />
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900 flex items-center justify-center text-xl">
                      👧
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900 dark:text-gray-50">Tambah Akun Anak</h2>
                      <p className="text-xs text-slate-500 dark:text-gray-400">Buat login khusus untuk si kecil</p>
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                      className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2"
                    >
                      ⚠️ {error}
                    </motion.div>
                  )}

                  {/* Avatar picker */}
                  <div className="mb-5">
                    <p className="text-[11px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-2.5">Pilih Avatar</p>
                    <div className="flex flex-wrap gap-2">
                      {AVATARS.map((a) => (
                        <button
                          key={a} type="button" onClick={() => setSelectedAvatar(a)}
                          className={`w-11 h-11 rounded-2xl text-2xl flex items-center justify-center transition-all duration-150 ${
                            selectedAvatar === a
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 ring-2 ring-emerald-500 scale-110 shadow-md shadow-emerald-100 dark:shadow-emerald-900/30'
                              : 'bg-slate-50 dark:bg-gray-800 hover:bg-slate-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleAddChild} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest px-1">Nama Anak</label>
                        <input name="name" type="text" required minLength={2} placeholder="cth: Budi" className={inputClass} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest px-1">Username</label>
                        <input name="username" type="text" required minLength={3} maxLength={20} placeholder="cth: budi123" pattern="[a-z0-9_]+" className={inputClass} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest px-1">Password Anak</label>
                      <input name="password" type="password" required minLength={6} placeholder="Min 6 karakter, mudah diingat" className={inputClass} />
                    </div>

                    <div className="flex gap-3 pt-1">
                      <button
                        type="button" onClick={() => goTo(0)}
                        className="flex-1 py-3.5 rounded-2xl border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-400 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        ← Kembali
                      </button>
                      <button
                        type="submit" disabled={isPending}
                        className="flex-[2] py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 disabled:opacity-50 text-white font-bold rounded-2xl shadow-md shadow-emerald-100 dark:shadow-emerald-900/30 transition-all text-sm active:scale-[0.98] flex items-center justify-center gap-2"
                      >
                        {isPending ? <><Spinner /> Membuat...</> : 'Lanjut →'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ── Step 2: Create Mission ── */}
            {step === 2 && (
              <div className="bg-white dark:bg-gray-900 rounded-3xl border border-slate-100 dark:border-gray-800 shadow-xl shadow-slate-200/60 dark:shadow-black/40 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500" />
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900 flex items-center justify-center text-xl">
                      🎯
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900 dark:text-gray-50">Misi Pertama</h2>
                      <p className="text-xs text-slate-500 dark:text-gray-400">
                        Untuk <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedAvatar} {childName}</span>
                      </p>
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                      className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2"
                    >
                      ⚠️ {error}
                    </motion.div>
                  )}

                  <form onSubmit={handleCreateMission} className="space-y-4">
                    <div>
                      <p className="text-[11px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-2.5">Template Cepat</p>
                      <div className="grid grid-cols-2 gap-2">
                        {MISSION_TEMPLATES.map((t, i) => (
                          <button
                            key={i} type="button"
                            onClick={() => { setSelectedTemplate(i); setCustomTitle(''); setCustomReward('') }}
                            className={`flex items-center gap-2.5 p-3 rounded-2xl border-2 text-left transition-all duration-150 ${
                              selectedTemplate === i
                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 shadow-sm'
                                : 'border-slate-100 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/60 hover:border-slate-300 dark:hover:border-gray-600'
                            }`}
                          >
                            <span className="text-xl flex-shrink-0">{t.icon}</span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 dark:text-gray-200 truncate leading-tight">{t.title}</p>
                              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                                Rp {t.reward.toLocaleString('id-ID')}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="relative flex items-center gap-3">
                      <div className="flex-1 h-px bg-slate-200 dark:bg-gray-700" />
                      <span className="text-[11px] text-slate-400 dark:text-gray-500 font-medium flex-shrink-0">atau tulis sendiri</span>
                      <div className="flex-1 h-px bg-slate-200 dark:bg-gray-700" />
                    </div>

                    <div className="space-y-2.5">
                      <input
                        type="text" value={customTitle}
                        onChange={(e) => { setCustomTitle(e.target.value); setSelectedTemplate(null) }}
                        placeholder="Nama misi custom..."
                        className={inputClass}
                      />
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 dark:text-gray-500 font-semibold select-none">Rp</span>
                        <input
                          type="number" value={customReward}
                          onChange={(e) => { setCustomReward(e.target.value); setSelectedTemplate(null) }}
                          placeholder="Nominal reward"
                          min={100}
                          className={`${inputClass} pl-10`}
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-1">
                      <button
                        type="button" onClick={() => goTo(1)}
                        className="flex-1 py-3.5 rounded-2xl border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-400 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        ← Kembali
                      </button>
                      <button
                        type="submit"
                        disabled={isPending || (selectedTemplate === null && (!customTitle.trim() || !customReward))}
                        className="flex-[2] py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 disabled:opacity-40 text-white font-bold rounded-2xl shadow-md shadow-emerald-100 dark:shadow-emerald-900/30 transition-all text-sm active:scale-[0.98] flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                      >
                        {isPending ? <><Spinner /> Membuat...</> : 'Buat Misi 🚀'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ── Step 3: Done ── */}
            {step === 3 && (
              <div className="bg-white dark:bg-gray-900 rounded-3xl border border-slate-100 dark:border-gray-800 shadow-xl shadow-slate-200/60 dark:shadow-black/40 overflow-hidden text-center">
                <div className="h-2 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500" />
                <div className="p-8">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                    className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-200/60 dark:shadow-emerald-900/50"
                  >
                    <span className="text-5xl">🎉</span>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-gray-50 mb-2">Siap Beraksi!</h2>
                    <p className="text-slate-500 dark:text-gray-400 text-sm leading-relaxed mb-8">
                      Akun <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedAvatar} {childName}</span> sudah siap dan misi pertama sudah dibuat.
                      Bagikan kode ini agar {childName} bisa login!
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.35 }}
                    className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-200/60 dark:border-emerald-900/50 rounded-2xl p-5 mb-8"
                  >
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-3">🏠 Kode Keluarga</p>
                    <div className="flex items-center justify-center gap-3">
                      <p className="text-4xl font-black tracking-[0.4em] text-emerald-700 dark:text-emerald-400 font-mono">{spaceCode}</p>
                      <button
                        onClick={handleCopy}
                        className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                          copied
                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200 dark:shadow-emerald-900/40 scale-105'
                            : 'bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 hover:shadow-md hover:shadow-emerald-100 dark:hover:shadow-emerald-900/30'
                        }`}
                      >
                        <AnimatePresence mode="wait">
                          {copied ? (
                            <motion.span
                              key="check"
                              initial={{ scale: 0.5, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.5, opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              className="flex items-center gap-1"
                            >
                              ✓ Tersalin!
                            </motion.span>
                          ) : (
                            <motion.span
                              key="copy"
                              initial={{ scale: 0.5, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.5, opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              className="flex items-center gap-1"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              Salin
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </button>
                    </div>
                    <p className="text-xs text-emerald-600/70 dark:text-emerald-500/70 mt-2">Masuk di app → Login Anak → pakai kode ini</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                    className="space-y-3"
                  >
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 dark:shadow-emerald-900/40 transition-all text-sm active:scale-[0.98]"
                    >
                      Lihat Dashboard →
                    </button>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`Halo ${childName}! 👋\n\nAyah/Bunda udah bikin akun Misi Pintar buat kamu! 🎯\n\nCara masuk:\n1. Buka app Misi Pintar\n2. Pilih "Login Anak"\n3. Masukkan Kode Keluarga: *${spaceCode}*\n4. Login pakai username & password yang udah dibuat\n\nYuk mulai misi pertama kamu! 🚀`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 rounded-2xl border-2 border-[#25D366] text-[#25D366] font-bold text-sm hover:bg-[#25D366] hover:text-white transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Bagikan via WhatsApp
                    </a>
                    <button
                      onClick={() => router.push('/dashboard/tasks')}
                      className="w-full py-3 rounded-2xl text-slate-400 dark:text-gray-500 font-medium text-sm hover:text-slate-600 dark:hover:text-gray-400 transition-colors"
                    >
                      Tambah Misi Lainnya
                    </button>
                  </motion.div>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
