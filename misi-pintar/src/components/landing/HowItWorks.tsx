'use client'
import { motion } from 'framer-motion'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { UserPlus, ListChecks, Trophy } from 'lucide-react'

const steps = [
  {
    number: '01',
    icon: UserPlus,
    title: 'Buat Ruang Keluarga',
    desc: 'Daftar dalam 30 detik. Tambahkan profil anak dengan kode unik. FamilySpace Anda langsung aktif.',
    color: 'from-emerald-400 to-emerald-600',
    shadow: 'shadow-emerald-500/30',
    time: '30 detik setup',
    emoji: '🏠',
  },
  {
    number: '02',
    icon: ListChecks,
    title: 'Buat Misi & Kantong',
    desc: 'Pilih dari ratusan template misi siap pakai. Set reward saldo virtual. Buat kantong tabungan impian anak.',
    color: 'from-amber-400 to-orange-500',
    shadow: 'shadow-amber-500/30',
    time: 'Template siap pakai',
    emoji: '🎯',
  },
  {
    number: '03',
    icon: Trophy,
    title: 'Anak Klaim & Belajar',
    desc: 'Anak kerjakan misi, upload bukti, klaim reward. Belajar mandiri sekaligus melek keuangan dengan cara menyenangkan.',
    color: 'from-purple-400 to-purple-600',
    shadow: 'shadow-purple-500/30',
    time: 'Mandiri & termotivasi',
    emoji: '🏆',
  },
]

export default function HowItWorks() {
  const { ref, inView } = useScrollReveal()

  return (
    <section id="cara-kerja" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-purple-100 border border-purple-200 rounded-full px-4 py-2 mb-6">
            <span className="text-purple-700 text-sm font-semibold">⚙️ Cara Kerja</span>
          </div>
          <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-slate-900 mb-4">
            3 Langkah Menuju{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-emerald-700">
              Anak yang Melek Keuangan
            </span>
          </h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            Tidak perlu keahlian teknis. Tidak perlu waktu berjam-jam. Cukup 3 langkah mudah.
          </p>
        </motion.div>

        <div className="relative">
          <div className="hidden lg:block absolute top-24 left-[16.5%] right-[16.5%] h-0.5">
            <div className="w-full h-full border-t-2 border-dashed border-slate-200" />
            <motion.div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-400 to-emerald-600"
              style={{ height: '2px' }}
              initial={{ width: 0 }}
              animate={inView ? { width: '100%' } : {}}
              transition={{ duration: 1.5, delay: 0.5, ease: 'easeInOut' }}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 50 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-center text-center group"
              >
                <div className="relative mb-6">
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-xl ${step.shadow} group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300`}>
                    <step.icon className="w-9 h-9 text-white" />
                  </div>
                  <div className="absolute -top-3 -right-3 font-display font-black text-5xl text-slate-100 -z-10 select-none leading-none">
                    {step.number}
                  </div>
                </div>
                <div className="text-3xl mb-3">{step.emoji}</div>
                <h3 className="font-display font-bold text-slate-900 text-xl mb-3">{step.title}</h3>
                <p className="text-slate-500 leading-relaxed mb-4">{step.desc}</p>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  {step.time}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8 }}
          className="mt-16 text-center"
        >
          <p className="text-slate-500 text-base mb-6">Bergabung bersama ribuan keluarga yang sudah memulai perjalanan finansial mereka</p>
          <div className="flex items-center justify-center gap-2">
            {['👨‍👩‍👧', '👪', '👨‍👩‍👦‍👦', '👨‍👩‍👧‍👦', '👩‍👧', '👨‍👦'].map((emoji, i) => (
              <motion.span
                key={i}
                className="text-2xl"
                initial={{ opacity: 0, scale: 0 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.9 + i * 0.08 }}
              >
                {emoji}
              </motion.span>
            ))}
            <span className="text-slate-500 text-sm ml-2 font-medium">+47.000 keluarga lainnya</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
