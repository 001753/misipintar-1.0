'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { staggerContainer, fadeUpVariants } from '@/lib/animations'
import { ShieldCheck } from 'lucide-react'

const categories = ['Semua', 'Akademik', 'Rumah', 'Karakter', 'Digital']

const missions = [
  { id: 1, emoji: '📚', title: 'PR Sekolah', cat: 'Akademik', syarat: 'Selesai sebelum jam 20.00', reward: 5000, template: true },
  { id: 2, emoji: '📖', title: 'Baca Buku', cat: 'Akademik', syarat: 'Buat rangkuman 1 halaman', reward: 7500, template: true },
  { id: 3, emoji: '🌍', title: 'Bahasa Asing', cat: 'Akademik', syarat: 'Latihan 15 menit/hari', reward: 6000, template: true },
  { id: 4, emoji: '💻', title: 'Skill Komputer', cat: 'Digital', syarat: 'Buat 1 proyek kecil', reward: 10000, template: true },
  { id: 5, emoji: '🧹', title: 'Beberes Kamar', cat: 'Rumah', syarat: 'Rapi & bersih sebelum jam 8', reward: 3000, template: true },
  { id: 6, emoji: '🍳', title: 'Bantu Masak', cat: 'Rumah', syarat: 'Bantu mama masak makan siang', reward: 4000, template: true },
  { id: 7, emoji: '🙏', title: 'Sholat Tepat Waktu', cat: 'Karakter', syarat: '5 waktu tidak bolong selama 1 minggu', reward: 15000, template: true },
  { id: 8, emoji: '🤝', title: 'Bantu Adik Belajar', cat: 'Karakter', syarat: 'Ajarkan 1 pelajaran ke adik', reward: 8000, template: true },
]

function formatRupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

export default function MisiPintarSection() {
  const [activeTab, setActiveTab] = useState('Semua')
  const { ref, inView } = useScrollReveal()

  const filtered = activeTab === 'Semua' ? missions : missions.filter((m) => m.cat === activeTab)

  return (
    <section id="fitur" className="py-20 md:py-28 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-emerald-100 border border-emerald-200 rounded-full px-4 py-2 mb-6">
            <span className="text-emerald-700 text-sm font-semibold">🎮 Misi Pintar</span>
          </div>
          <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-slate-900 mb-4">
            Saat Belajar Terasa Seru{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-emerald-700">
              Seperti Naik Level!
            </span>
          </h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            Ratusan template misi siap pakai — dari PR sekolah hingga karakter. Orang tua atur, anak klaim!
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-2 justify-center mb-10"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                activeTab === cat
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {filtered.map((mission, i) => (
              <motion.div
                key={mission.id}
                custom={i}
                variants={fadeUpVariants}
                whileHover={{ scale: 1.03, y: -6, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.97 }}
                className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 cursor-pointer group"
              >
                <div className="text-4xl mb-3">{mission.emoji}</div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-display font-bold text-slate-900 text-base group-hover:text-emerald-600 transition-colors">{mission.title}</h3>
                  {mission.template && (
                    <span className="relative inline-flex shrink-0 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 overflow-hidden">
                      <span className="relative z-10">Template</span>
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    </span>
                  )}
                </div>
                <p className="text-slate-500 text-xs leading-relaxed mb-4">{mission.syarat}</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-600 text-base">{formatRupiah(mission.reward)}</span>
                  <span className="text-xs text-slate-400 bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg">{mission.cat}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5 }}
          className="mt-10 flex items-center justify-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-6 py-4"
        >
          <ShieldCheck className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-amber-700 text-sm font-medium">
            <strong>Fitur Bukti Kerja Anti-Cheat:</strong> Anak wajib upload foto/teks bukti sebelum reward cair. Orang tua review & approve.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
