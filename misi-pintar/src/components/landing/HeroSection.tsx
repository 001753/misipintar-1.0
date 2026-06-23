'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import MeshBackground from '@/components/ui/MeshBackground'
import { Rocket, Play, CheckCircle, Star, Zap, TrendingUp } from 'lucide-react'

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 pt-20">
      <MeshBackground />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          <div className="text-center lg:text-left">
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

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl xl:text-7xl leading-[1.1] text-white mb-6"
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

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-slate-300 text-lg sm:text-xl leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0"
            >
              <strong className="text-white">Misi Pintar</strong> mengubah PR sekolah, baca buku, dan tugas rumah jadi <em className="text-emerald-400">misi seru berhadiah saldo saku virtual</em>. Anak belajar mandiri. Orang tua tenang.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 mb-8 justify-center lg:justify-start"
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

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap items-center gap-4 justify-center lg:justify-start"
            >
              {['100% Gratis', 'Tanpa Kartu Kredit', '1 Menit Setup'].map((item) => (
                <div key={item} className="flex items-center gap-1.5 text-sm text-slate-400">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex justify-center lg:justify-end"
          >
            <div className="relative" style={{ animation: 'float 6s ease-in-out infinite' }}>
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 to-amber-500/20 rounded-[3rem] blur-2xl" />
              <div className="relative w-[280px] sm:w-[320px] bg-gradient-to-b from-slate-800 to-slate-900 rounded-[2.5rem] shadow-2xl shadow-black/60 border border-white/10 overflow-hidden">
                <div className="bg-slate-800 px-6 pt-10 pb-4">
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-1.5 bg-slate-600 rounded-full" />
                  <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-emerald-100 text-xs font-medium">Saldo Saku</span>
                      <span className="text-emerald-200 text-xs">Zara ⭐ Lv.8</span>
                    </div>
                    <div className="text-white font-bold text-2xl">Rp 37.500</div>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3 h-3 text-emerald-200" />
                      <span className="text-emerald-200 text-xs">+Rp 5.000 minggu ini</span>
                    </div>
                  </div>

                  <div className="bg-slate-700/50 rounded-2xl p-4 mb-3 border border-slate-600/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-300 text-xs font-semibold">🎯 Misi Aktif</span>
                      <span className="text-amber-400 text-xs font-bold">+Rp 5.000</span>
                    </div>
                    <div className="text-white text-sm font-medium mb-2">📚 PR Matematika</div>
                    <div className="w-full bg-slate-600 rounded-full h-2">
                      <div className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-2 rounded-full" style={{ width: '70%', animation: 'shimmer 2s ease-in-out infinite' }} />
                    </div>
                    <div className="text-slate-400 text-xs mt-1">Selesai sebelum jam 20.00</div>
                  </div>

                  <div className="bg-slate-700/50 rounded-2xl p-4 border border-slate-600/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-300 text-xs font-semibold">🐷 Kantong Impian</span>
                      <span className="text-emerald-400 text-xs">68%</span>
                    </div>
                    <div className="text-white text-sm font-medium mb-2">👟 Sepatu Nike</div>
                    <div className="w-full bg-slate-600 rounded-full h-2">
                      <div className="bg-gradient-to-r from-amber-400 to-amber-500 h-2 rounded-full" style={{ width: '68%' }} />
                    </div>
                    <div className="text-slate-400 text-xs mt-1">Rp 306.000 / Rp 450.000</div>
                  </div>
                </div>

                <div className="absolute -top-2 -right-2">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg text-lg"
                  >
                    🔔
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
    </section>
  )
}
