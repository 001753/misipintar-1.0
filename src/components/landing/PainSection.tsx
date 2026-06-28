'use client'
import { motion } from 'framer-motion'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { Smartphone, Moon, HandHeart } from 'lucide-react'

const pains = [
  {
    icon: Smartphone,
    emoji: '📱',
    title: 'Kecanduan Screen-Time',
    desc: 'Anak lebih kenal karakter game daripada nilai pecahan. Layar menyita 6-8 jam sehari — waktu berharga yang bisa dipakai belajar dan berkembang.',
    color: 'from-red-500/20 to-orange-500/20',
    border: 'border-red-500/20',
    iconColor: 'text-red-400',
  },
  {
    icon: Moon,
    emoji: '😡',
    title: 'Drama Tiap Malam Demi PR',
    desc: 'Jam 9 malam masih perang dingin soal PR. Air mata, ngambek, hingga orang tua yang ikut stress — sebuah rutinitas yang tidak perlu terjadi.',
    color: 'from-orange-500/20 to-amber-500/20',
    border: 'border-orange-500/20',
    iconColor: 'text-orange-400',
  },
  {
    icon: HandHeart,
    emoji: '🤲',
    title: 'Mental Menengadah Tangan',
    desc: '"Pa, minta uang jajan dong." Tanpa usaha, tanpa pengertian nilai uang. Kebiasaan ini terbawa hingga dewasa jika tidak segera diubah.',
    color: 'from-amber-500/20 to-yellow-500/20',
    border: 'border-amber-500/20',
    iconColor: 'text-amber-400',
  },
]

export default function PainSection() {
  const { ref, inView } = useScrollReveal()

  return (
    <section className="py-20 md:py-28 bg-slate-100 dark:bg-slate-950 relative overflow-hidden transition-colors duration-200">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #ef4444 0%, transparent 50%), radial-gradient(circle at 80% 50%, #f59e0b 0%, transparent 50%)' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-2 mb-6">
            <span className="text-red-400 text-sm font-semibold">😤 Masalah Nyata</span>
          </div>
          <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-slate-900 dark:text-white mb-6">
            Mengapa Pola Lama{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">
              Tidak Lagi Bekerja?
            </span>
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Generasi Alpha tumbuh di dunia digital. Pendekatan lama — uang saku cash, PR tanpa imbalan, ceramah soal hemat — sudah tidak relevan.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {pains.map((pain, i) => (
            <motion.div
              key={pain.title}
              initial={{ opacity: 0, y: 50 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className={`relative bg-gradient-to-br ${pain.color} border ${pain.border} rounded-3xl p-8 hover:-translate-y-2 transition-transform duration-300`}
            >
              <div className="text-5xl mb-4">{pain.emoji}</div>
              <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white mb-3">{pain.title}</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{pain.desc}</p>
              <div className="absolute top-6 right-6 opacity-10">
                <pain.icon className={`w-16 h-16 ${pain.iconColor}`} />
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-8 py-4">
            <span className="text-2xl">💡</span>
            <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-lg">
              Ada cara yang lebih baik — dan anak-anak menyukainya.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
