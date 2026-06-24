'use client'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { motion } from 'framer-motion'
import CountUp from 'react-countup'

const stats = [
  { icon: '👨‍👩‍👧‍👦', value: 47200, suffix: '+', label: 'Keluarga Aktif', decimals: 0 },
  { icon: '✅', value: 1.2, suffix: ' Juta', label: 'Misi Selesai', decimals: 1 },
  { icon: '⭐', value: 4.9, suffix: '/5.0', label: 'Rating App', decimals: 1 },
  { icon: '🏆', value: 1, suffix: ' #1', label: 'Literasi ID', decimals: 0 },
]

export default function StatsBar() {
  const { ref, inView } = useScrollReveal(0.3)

  return (
    <section className="py-12 bg-white dark:bg-gray-950 border-b border-slate-100 dark:border-gray-800 transition-colors duration-200" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="text-center bg-white dark:bg-gray-900 backdrop-blur-sm border border-slate-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md dark:hover:shadow-black/30 hover:-translate-y-1 transition-all duration-200"
            >
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="font-display font-bold text-2xl sm:text-3xl text-slate-900 dark:text-white">
                {inView ? (
                  <CountUp
                    start={0}
                    end={stat.value}
                    duration={2.5}
                    decimals={stat.decimals}
                    separator="."
                    decimal=","
                  />
                ) : (
                  '0'
                )}
                <span className="text-emerald-500">{stat.suffix}</span>
              </div>
              <div className="text-slate-500 dark:text-gray-400 text-sm font-medium mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
