'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import MeshBackground from '@/components/ui/MeshBackground'
import { Rocket, Play, CheckCircle, Star } from 'lucide-react'

const floatingStats = [
  { emoji: '🎯', label: 'Misi Selesai Hari Ini', value: '+1.247', color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/20', delay: 0 },
  { emoji: '👨‍👩‍👧', label: 'Keluarga Aktif', value: '47.200+', color: 'from-amber-500/20 to-amber-600/10 border-amber-500/20', delay: 0.15 },
  { emoji: '⭐', label: 'Rating Pengguna', value: '4.9 / 5.0', color: 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/20', delay: 0.3 },
]

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900 pt-20">
      <MeshBackground />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 w-full">
        <div className="max-w-3xl mx-auto text-center">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-2 mb-6"
          >
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-emerald-400 text-sm font-semibold">Literasi Keuangan Keluarga #1 Indonesia</span>
            <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">BARU</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display font-bold text-5xl sm:text-6xl lg:text-7xl xl:text-8xl leading-[1.05] text-white mb-6"
          >
            Ubah Kuota{' '}
            <span
              className="inline-block text-transparent bg-clip-text"
              style={{
                backgroundImage: 'linear-gradient(90deg, #f87171, #fb923c, #fbbf24)',
                backgroundSize: '200% auto',
                animation: 'gradientX 4s ease infinite',
              }}
            >
              Marah-Marah
            </span>
            <br />
            Jadi Kuota{' '}
            <span
              className="inline-block text-transparent bg-clip-text"
              style={{
                backgroundImage: 'linear-gradient(90deg, #34d399, #10b981, #059669)',
                backgroundSize: '200% auto',
                animation: 'gradientX 4s ease infinite',
              }}
            >
              Senyuman
            </span>{' '}
            ✨
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-slate-300 text-lg sm:text-xl leading-relaxed mb-8 max-w-2xl mx-auto"
          >
            <strong className="text-white">Misi Pintar</strong> mengubah PR sekolah, baca buku, dan tugas rumah jadi{' '}
            <em className="text-emerald-400">misi seru berhadiah saldo saku virtual</em>. Anak belajar mandiri. Orang tua tenang.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 mb-10 justify-center"
          >
            <Link
              href="/register"
              className="group relative inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-400 to-emerald-600 text-white font-bold text-base px-8 py-4 rounded-2xl shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-1 transition-all duration-200 overflow-hidden"
            >
              <span className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12" />
              <Rocket className="w-5 h-5" />
              Ambil Gratis Sekarang
            </Link>
            <button className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white font-semibold text-base px-8 py-4 rounded-2xl hover:bg-white/20 transition-all duration-200 backdrop-blur-sm">
              <Play className="w-5 h-5 fill-white" />
              Lihat Demo
            </button>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="flex flex-wrap items-center gap-5 justify-center mb-16"
          >
            {['100% Gratis', 'Tanpa Kartu Kredit', '1 Menit Setup'].map((item) => (
              <div key={item} className="flex items-center gap-1.5 text-sm text-slate-400">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </motion.div>

          {/* Floating stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {floatingStats.map((s) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.55 + s.delay, ease: [0.22, 1, 0.36, 1] }}
                className={`bg-gradient-to-br ${s.color} border backdrop-blur-sm rounded-2xl px-5 py-4 text-center`}
              >
                <div className="text-2xl mb-1">{s.emoji}</div>
                <div className="text-white font-bold text-xl">{s.value}</div>
                <div className="text-slate-400 text-xs mt-0.5">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white dark:from-gray-950 to-transparent" />
    </section>
  )
}
