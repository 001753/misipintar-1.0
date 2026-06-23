'use client'
import { motion } from 'framer-motion'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import Link from 'next/link'
import { CheckCircle, Flame, Clock } from 'lucide-react'

const features = [
  'Ruang Keluarga tak terbatas',
  'Misi Pintar + Template lengkap',
  '🆕 Kantong Tabungan Virtual',
  'Sistem Pajak Jajan',
  'Pahlawan Rumah',
  'Fitur Bukti Kerja Anti-Cheat',
  'Laporan Perkembangan Anak',
]

export default function PricingBanner() {
  const { ref, inView } = useScrollReveal()

  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-3xl"
        >
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, #064e3b, #065f46, #047857, #059669, #10b981)',
              backgroundSize: '300% 300%',
              animation: 'gradientX 8s ease infinite',
            }}
          />
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #fbbf24, transparent 50%), radial-gradient(circle at 80% 50%, #34d399, transparent 50%)' }} />
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

          <div className="relative z-10 px-8 py-12 md:px-16 md:py-16 text-center">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-5 py-2 mb-6"
            >
              <Flame className="w-4 h-4 text-amber-300" />
              <span className="text-white text-sm font-bold">🎊 GRATIS SELAMANYA UNTUK 1 JUTA KELUARGA PERTAMA</span>
            </motion.div>

            <h2 className="font-display font-black text-white text-3xl sm:text-4xl lg:text-5xl mb-3">
              Paket Premium Senilai{' '}
              <span className="relative">
                <span className="text-white/40 line-through decoration-red-400">Rp 29.000/bln</span>
              </span>
            </h2>
            <div className="text-emerald-200 font-bold text-2xl sm:text-3xl mb-8">
              GRATIS selama masa promosi 🎁
            </div>

            <div className="grid sm:grid-cols-2 gap-3 mb-10 max-w-2xl mx-auto text-left">
              {features.map((feat, i) => (
                <motion.div
                  key={feat}
                  initial={{ opacity: 0, x: -20 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className="flex items-center gap-2.5 text-white"
                >
                  <CheckCircle className="w-5 h-5 text-emerald-300 flex-shrink-0" />
                  <span className="text-sm font-medium">{feat}</span>
                </motion.div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-3 mb-6">
              <Clock className="w-5 h-5 text-amber-300" />
              <div className="text-amber-200 text-sm font-medium">
                Slot tersisa:{' '}
                <span className="font-bold text-white text-lg">
                  952.847
                </span>
                {' '}dari 1.000.000
              </div>
            </div>

            <Link
              href="/register"
              className="group relative inline-flex items-center justify-center gap-3 bg-white text-emerald-700 font-black text-lg px-10 py-5 rounded-2xl shadow-2xl hover:-translate-y-1 hover:shadow-emerald-900/40 transition-all duration-200 overflow-hidden"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <span className="text-xl">🔥</span>
              Buat Ruang Keluarga Sekarang — GRATIS
            </Link>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              {['Tanpa kartu kredit', 'Setup 1 menit', 'Bisa cancel kapanpun'].map((item) => (
                <span key={item} className="flex items-center gap-1.5 text-emerald-200 text-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-300" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
