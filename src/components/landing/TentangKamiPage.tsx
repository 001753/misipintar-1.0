'use client'
import { motion, useInView } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import {
  Target, Rocket, Shield, PiggyBank, Users, TrendingUp,
  Heart, Globe, Star, ArrowRight, CheckCircle, Lightbulb,
  Building2, Award
} from 'lucide-react'

const PARTICLES = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  left: ((i * 37 + 13) % 100).toFixed(2),
  top: ((i * 53 + 7) % 100).toFixed(2),
  duration: 3 + (i % 4),
  delay: (i * 0.17) % 5,
}))

function ClientParticles() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null
  return (
    <>
      {PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          className="absolute w-1 h-1 bg-emerald-400/30 rounded-full"
          style={{ left: `${p.left}%`, top: `${p.top}%` }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay }}
        />
      ))}
    </>
  )
}

function SectionReveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

const pillars = [
  {
    icon: Lightbulb,
    emoji: '💡',
    color: 'from-amber-400 to-orange-500',
    glow: 'shadow-amber-500/20',
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-amber-100 dark:border-amber-900/30',
    title: 'Mengubah Drama Menjadi Motivasi',
    desc: 'Kami membantu para orang tua menyederhanakan instruksi rumah tangga tanpa perlu emosi atau berteriak. Sistem insentif berbasis saldo saku virtual membuat anak bergerak secara mandiri atas kesadaran dan target pribadi mereka.',
  },
  {
    icon: PiggyBank,
    emoji: '🐷',
    color: 'from-emerald-400 to-emerald-600',
    glow: 'shadow-emerald-500/20',
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    border: 'border-emerald-100 dark:border-emerald-900/30',
    title: 'Menanamkan Delayed Gratification',
    desc: 'Kami mengajarkan anak untuk menunda kepuasan instan. Melalui fitur Kantong Menabung, anak dididik untuk merencanakan keuangan, menetapkan target barang impian, dan memahami bahwa setiap rupiah adalah buah dari kontribusi nyata.',
  },
  {
    icon: Shield,
    emoji: '🛡️',
    color: 'from-blue-400 to-indigo-500',
    glow: 'shadow-blue-500/20',
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    border: 'border-blue-100 dark:border-blue-900/30',
    title: 'Proteksi Total & Kontrol Orang Tua',
    desc: 'Kami memastikan kenyamanan finansial keluarga terjaga penuh. Seluruh kendali, persetujuan bukti tugas (anti-cheat), pengaturan bunga tabungan simulasi, hingga batas penalti harian berada 100% di tangan orang tua.',
  },
]

const milestones = [
  { year: '2023', title: 'Ide Lahir', desc: 'Riset mendalam tentang krisis literasi keuangan anak Indonesia dimulai.' },
  { year: '2024', title: 'Pengembangan', desc: 'Prototipe pertama diuji bersama 50 keluarga pilot di Jabodetabek.' },
  { year: '2025', title: 'Peluncuran', desc: 'Platform resmi diluncurkan. Target 1 Juta Keluarga Pintar Indonesia.' },
]

const values = [
  { icon: Heart, label: 'Family First', desc: 'Setiap keputusan produk didasarkan pada kebaikan keluarga Indonesia.' },
  { icon: Shield, label: 'Keamanan Data', desc: 'Standar keamanan siber tertinggi. Data keluarga Anda tidak pernah dijual.' },
  { icon: Globe, label: 'Inklusif', desc: 'Dirancang untuk seluruh lapisan masyarakat, dari kota besar hingga pelosok.' },
  { icon: TrendingUp, label: 'Inovasi Berkelanjutan', desc: 'Kami terus berinovasi agar selalu relevan dengan kebutuhan keluarga modern.' },
]

export default function TentangKamiPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 pt-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 -left-40 w-[500px] h-[500px] bg-amber-500/8 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[150px]" />
          <ClientParticles />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-2 mb-8"
            >
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 text-sm font-semibold">Tentang Kami</span>
              <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">JobenApps</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="font-bold text-4xl sm:text-5xl lg:text-6xl leading-[1.1] text-white mb-6"
            >
              Membangun Generasi{' '}
              <span
                className="text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(90deg, #34d399, #10b981, #059669)' }}
              >
                Cerdas Finansial
              </span>
              {' '}&{' '}
              <span
                className="text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(90deg, #fbbf24, #f59e0b, #d97706)' }}
              >
                Disiplin Sejak Dini
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-slate-300 text-lg sm:text-xl leading-relaxed mb-10 max-w-2xl mx-auto"
            >
              Di era digital yang berkembang begitu pesat, tantangan terbesar orang tua bukan lagi sekadar membesarkan anak — melainkan mempersiapkan mereka menghadapi dunia nyata.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                href="/register"
                className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-400 to-emerald-600 text-white font-bold text-base px-8 py-4 rounded-2xl shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5 transition-all duration-200"
              >
                <Rocket className="w-5 h-5" />
                Mulai Gratis Sekarang
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/#fitur"
                className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white font-semibold text-base px-8 py-4 rounded-2xl hover:bg-white/20 transition-all duration-200 backdrop-blur-sm"
              >
                Lihat Fitur
              </Link>
            </motion.div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white dark:from-gray-950 to-transparent" />
      </section>

      {/* ── PROBLEM STATEMENT ── */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <SectionReveal>
              <div className="inline-flex items-center gap-2 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-full px-4 py-1.5 mb-6">
                <span className="text-red-500 text-sm font-semibold">⚠️ Masalah yang Kami Lihat</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white leading-tight mb-6">
                Metode Konvensional Sudah{' '}
                <span className="text-red-500">Tidak Lagi Efektif</span>
              </h2>
              <p className="text-slate-600 dark:text-gray-400 text-lg leading-relaxed mb-6">
                Kebanyakan anak masa kini tumbuh di tengah ekosistem digital yang sangat konsumtif — di mana top-up game, belanja online, dan pemuasan instan hanya berjarak satu klik saja.
              </p>
              <p className="text-slate-600 dark:text-gray-400 text-lg leading-relaxed mb-8">
                Memberikan uang jajan secara cuma-cuma tanpa indikator pencapaian justru berisiko membentuk mentalitas konsumtif tanpa menghargai esensi kerja keras.
              </p>
              <div className="flex flex-col gap-3">
                {[
                  'Anak tidak memahami nilai uang dan kerja keras',
                  'Instant gratification melemahkan karakter disiplin',
                  'Orang tua kehabisan cara mendidik tanpa emosi',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-red-500 text-xs font-bold">✕</span>
                    </div>
                    <span className="text-slate-600 dark:text-gray-400 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </SectionReveal>

            <SectionReveal delay={0.15}>
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-emerald-500/10 to-amber-500/10 rounded-3xl blur-xl" />
                <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 border border-slate-700/50 shadow-2xl">
                  <div className="text-center mb-6">
                    <div className="text-5xl mb-3">💡</div>
                    <h3 className="text-white font-bold text-xl mb-2">MisiPintar Hadir Sebagai Jawaban</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Platform edutech-fintech keluarga nomor{' '}
                      <span className="text-emerald-400 font-bold">#1 di Indonesia</span>{' '}
                      yang menjembatani komunikasi orang tua dan anak melalui metode gamifikasi yang menyenangkan.
                    </p>
                  </div>
                  <div className="space-y-3">
                    {[
                      { icon: '🎯', text: 'Rutinitas harian jadi "Misi Pintar" yang edukatif' },
                      { icon: '💰', text: 'Saldo saku virtual sebagai reward nyata' },
                      { icon: '📊', text: 'Dasbor orang tua dengan kontrol penuh' },
                      { icon: '🏆', text: 'Sistem gamifikasi yang membangun karakter' },
                    ].map((item) => (
                      <div key={item.text} className="flex items-center gap-3 bg-slate-700/40 rounded-xl px-4 py-3 border border-slate-600/30">
                        <span className="text-xl">{item.icon}</span>
                        <span className="text-slate-300 text-sm">{item.text}</span>
                        <CheckCircle className="w-4 h-4 text-emerald-400 ml-auto flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SectionReveal>
          </div>
        </div>
      </section>

      {/* ── WHAT WE DO ── */}
      <section className="py-20 bg-slate-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionReveal className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-full px-4 py-1.5 mb-4">
              <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-700 dark:text-emerald-400 text-sm font-semibold">Apa yang Kami Lakukan</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Lebih dari Sekadar Aplikasi Keuangan
            </h2>
            <p className="text-slate-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
              MisiPintar adalah <strong className="text-slate-800 dark:text-white">ekosistem pembentuk karakter</strong> bagi anak-anak usia dini hingga remaja.
            </p>
          </SectionReveal>

          <div className="grid md:grid-cols-3 gap-8">
            {pillars.map((pillar, i) => (
              <SectionReveal key={pillar.title} delay={i * 0.12}>
                <div className={`h-full rounded-3xl border p-8 ${pillar.bg} ${pillar.border} hover:shadow-xl ${pillar.glow} transition-all duration-300 hover:-translate-y-1`}>
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${pillar.color} flex items-center justify-center shadow-lg mb-6`}>
                    <pillar.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-3xl mb-4">{pillar.emoji}</div>
                  <h3 className="text-slate-900 dark:text-white font-bold text-xl mb-4 leading-snug">{pillar.title}</h3>
                  <p className="text-slate-600 dark:text-gray-400 leading-relaxed text-sm">{pillar.desc}</p>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── VISION ── */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <SectionReveal delay={0.1}>
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-amber-500/10 to-emerald-500/10 rounded-3xl blur-xl" />
                <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-gray-800 shadow-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-10">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl" />
                  <div className="relative z-10">
                    <div className="text-6xl mb-6">🇮🇩</div>
                    <div className="text-emerald-400 font-bold text-sm mb-3 tracking-widest uppercase">Visi Nasional</div>
                    <h3 className="text-white font-bold text-3xl sm:text-4xl leading-tight mb-4">
                      1 Juta Keluarga<br />
                      <span className="text-emerald-400">Pintar</span> Indonesia
                    </h3>
                    <p className="text-slate-400 leading-relaxed mb-8">
                      Dikembangkan di bawah naungan <span className="text-amber-400 font-semibold">JobenApps (Joben Enterprise)</span>, MisiPintar berkomitmen penuh mendukung program nasional dalam meningkatkan indeks literasi keuangan masyarakat Indonesia sejak usia dini.
                    </p>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { value: '47K+', label: 'Keluarga Aktif' },
                        { value: '1.2Jt', label: 'Misi Selesai' },
                        { value: '4.9', label: 'Rating' },
                      ].map((stat) => (
                        <div key={stat.label} className="text-center bg-white/5 border border-white/10 rounded-2xl p-4">
                          <div className="text-white font-bold text-2xl">{stat.value}</div>
                          <div className="text-slate-400 text-xs mt-1">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </SectionReveal>

            <SectionReveal>
              <div className="inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-full px-4 py-1.5 mb-6">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="text-amber-700 dark:text-amber-400 text-sm font-semibold">Visi Besar Kami</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white leading-tight mb-6">
                Kecerdasan Finansial Dimulai dari{' '}
                <span className="text-emerald-500">Tempat Tidur yang Dirapikan</span>
              </h2>
              <p className="text-slate-600 dark:text-gray-400 text-lg leading-relaxed mb-8">
                Kami percaya bahwa kecerdasan finansial tidak dimulai saat anak menerima gaji pertama mereka di usia dewasa, melainkan dimulai dari tempat tidur yang mereka rapikan sendiri setiap pagi di rumah.
              </p>
              <div className="space-y-4">
                {milestones.map((m, i) => (
                  <div key={m.year} className="flex gap-5">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-emerald-500/20 flex-shrink-0">
                        {m.year.slice(2)}
                      </div>
                      {i < milestones.length - 1 && (
                        <div className="w-px flex-1 bg-emerald-200 dark:bg-emerald-900/50 mt-2 min-h-[2rem]" />
                      )}
                    </div>
                    <div className="pb-4">
                      <div className="font-bold text-slate-900 dark:text-white">{m.year} — {m.title}</div>
                      <div className="text-slate-500 dark:text-gray-400 text-sm mt-1">{m.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionReveal>
          </div>
        </div>
      </section>

      {/* ── VALUES ── */}
      <section className="py-20 bg-slate-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionReveal className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-full px-4 py-1.5 mb-4">
              <Award className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-blue-700 dark:text-blue-400 text-sm font-semibold">Nilai-Nilai Kami</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Komitmen yang Tidak Pernah Kami Kompromikan
            </h2>
            <p className="text-slate-600 dark:text-gray-400 text-lg max-w-xl mx-auto">
              Prinsip-prinsip yang menjadi landasan setiap keputusan yang kami buat.
            </p>
          </SectionReveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <SectionReveal key={v.label} delay={i * 0.1}>
                <div className="group h-full bg-white dark:bg-gray-950 rounded-3xl border border-slate-100 dark:border-gray-800 p-7 hover:border-emerald-200 dark:hover:border-emerald-900/50 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-5 group-hover:scale-110 transition-transform duration-200">
                    <v.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-2">{v.label}</h3>
                  <p className="text-slate-500 dark:text-gray-400 text-sm leading-relaxed">{v.desc}</p>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUOTE CALLOUT ── */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionReveal>
            <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-10 sm:p-14 text-center overflow-hidden border border-slate-700/50 shadow-2xl">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
              <div className="relative z-10">
                <div className="text-5xl mb-6">💬</div>
                <blockquote className="text-white font-bold text-2xl sm:text-3xl lg:text-4xl leading-tight mb-6">
                  "Kami berkomitmen untuk terus berinovasi, menjaga privasi data keluarga dengan standar keamanan siber tertinggi, serta menghadirkan teknologi yang{' '}
                  <span className="text-emerald-400">inklusif, adaptif, dan mudah digunakan</span>{' '}
                  oleh seluruh keluarga di Indonesia."
                </blockquote>
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                    <span className="text-white font-black text-xs">JE</span>
                  </div>
                  <div className="text-left">
                    <div className="text-white font-semibold text-sm">Tim MisiPintar</div>
                    <div className="text-slate-400 text-xs">JobenApps · Joben Enterprise</div>
                  </div>
                </div>
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* ── JOBEN ENTERPRISE ── */}
      <section className="py-16 bg-slate-50 dark:bg-gray-900 border-y border-slate-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionReveal>
            <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-xl shadow-amber-500/30">
                  <span className="text-white font-black text-2xl">JE</span>
                </div>
              </div>
              <div className="text-center md:text-left flex-1">
                <div className="text-xs font-bold tracking-widest text-amber-600 dark:text-amber-400 uppercase mb-2">Dikembangkan oleh</div>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3">
                  JobenApps <span className="text-slate-400 font-normal">·</span> Joben Enterprise
                </h3>
                <p className="text-slate-600 dark:text-gray-400 leading-relaxed max-w-xl">
                  Perusahaan teknologi Indonesia yang berfokus pada solusi digital inovatif untuk meningkatkan kualitas hidup keluarga dan masyarakat Indonesia secara luas dan berkelanjutan.
                </p>
              </div>
              <div className="flex-shrink-0">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold px-7 py-3.5 rounded-2xl shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:-translate-y-0.5 transition-all duration-200"
                >
                  <Users className="w-5 h-5" />
                  Bergabung Sekarang
                </Link>
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 bg-gradient-to-b from-slate-950 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px]" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <SectionReveal>
            <div className="text-5xl mb-6">🚀</div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              Mari Tumbuh Bersama{' '}
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg, #34d399, #10b981)' }}>
                MisiPintar
              </span>
            </h2>
            <p className="text-slate-300 text-lg leading-relaxed mb-10">
              Sambut hari esok yang lebih harmonis di rumah Anda. Mari bergabung bersama ribuan orang tua cerdas lainnya yang telah bertransformasi dari metode{' '}
              <em>"mengomeli"</em> menjadi <strong className="text-emerald-400">"menginspirasi"</strong>.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
              <Link
                href="/register"
                className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-400 to-emerald-600 text-white font-bold text-lg px-10 py-4 rounded-2xl shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-1 transition-all duration-200"
              >
                <Rocket className="w-5 h-5" />
                Mulai Gratis — Tanpa Kartu Kredit
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-400">
              {['✅ 100% Gratis', '🔒 Data Aman', '⚡ Setup 1 Menit', '🇮🇩 Buatan Indonesia'].map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* ── TAGLINE ── */}
      <div className="bg-slate-950 py-6 text-center border-t border-slate-800">
        <p className="text-slate-400 text-sm">
          <span className="text-white font-bold">MisiPintar</span>{' '}
          — Hubungan Keluarga Lebih Hangat,{' '}
          <span className="text-emerald-400 font-semibold">Anak Lebih Hebat.</span>
        </p>
      </div>

      <Footer />
    </div>
  )
}
