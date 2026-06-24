'use client'
import { motion } from 'framer-motion'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { Target, TrendingUp, Lock, PartyPopper, Coins, BarChart3 } from 'lucide-react'
import Link from 'next/link'

const features = [
  {
    icon: Target,
    title: 'Kantong Impian',
    desc: 'Anak membuat kantong bertujuan: "Sepatu Nike", "Game Switch", "Buku". Lengkap dengan progress bar visual menuju target.',
    color: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/60',
    titleColor: 'text-slate-900 dark:text-white',
    descColor: 'text-slate-600 dark:text-gray-300',
  },
  {
    icon: TrendingUp,
    title: 'Bunga Reward Orang Tua',
    desc: 'Orang tua bisa memberi "bunga" 5–20% sebagai motivasi menabung lebih lama. Anak belajar konsep compound interest sejak dini.',
    color: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
    iconColor: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-100 dark:bg-blue-900/60',
    titleColor: 'text-slate-900 dark:text-white',
    descColor: 'text-slate-600 dark:text-gray-300',
  },
  {
    icon: Lock,
    title: 'Kunci Tabungan',
    desc: 'Orang tua bisa kunci kantong sehingga tidak bisa dicairkan sebelum tanggal/target tercapai. Mengajarkan komitmen finansial.',
    color: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800',
    iconColor: 'text-purple-600 dark:text-purple-400',
    iconBg: 'bg-purple-100 dark:bg-purple-900/60',
    titleColor: 'text-slate-900 dark:text-white',
    descColor: 'text-slate-600 dark:text-gray-300',
  },
  {
    icon: PartyPopper,
    title: 'Momen Perayaan',
    desc: 'Saat target tercapai, app menampilkan animasi konfeti & notifikasi ke semua anggota keluarga. Momen bangga bersama!',
    color: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
    iconColor: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-900/60',
    titleColor: 'text-slate-900 dark:text-white',
    descColor: 'text-slate-600 dark:text-gray-300',
  },
  {
    icon: Coins,
    title: 'Auto-Setor dari Misi',
    desc: 'Set persentase otomatis dari setiap reward misi langsung masuk kantong tabungan. Disiplin finansial berjalan otomatis.',
    color: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800',
    iconColor: 'text-orange-600 dark:text-orange-400',
    iconBg: 'bg-orange-100 dark:bg-orange-900/60',
    titleColor: 'text-slate-900 dark:text-white',
    descColor: 'text-slate-600 dark:text-gray-300',
  },
  {
    icon: BarChart3,
    title: 'Laporan Progres',
    desc: 'Grafik pertumbuhan saldo tabungan per minggu. Anak lihat sendiri uang mereka "tumbuh" dari kerja keras.',
    color: 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800',
    iconColor: 'text-teal-600 dark:text-teal-400',
    iconBg: 'bg-teal-100 dark:bg-teal-900/60',
    titleColor: 'text-slate-900 dark:text-white',
    descColor: 'text-slate-600 dark:text-gray-300',
  },
]

export default function TabunganSection() {
  const { ref, inView } = useScrollReveal()
  const { ref: cardRef, inView: cardInView } = useScrollReveal(0.2)

  return (
    <section id="tabungan" className="py-20 md:py-28 bg-slate-950 dark:bg-gray-950 relative overflow-hidden transition-colors duration-200">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 30% 40%, #10b981, transparent 60%), radial-gradient(circle at 70% 60%, #f59e0b, transparent 60%)' }} />
      </div>
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{ backgroundImage: 'radial-gradient(circle, #10b981 1px, transparent 1px)', backgroundSize: '32px 32px' }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-2 mb-6">
            <span className="text-xs font-bold text-white bg-emerald-500 px-2 py-0.5 rounded-full">BARU</span>
            <span className="text-emerald-400 text-sm font-semibold">Modul Tabungan Virtual</span>
          </div>
          <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-4">
            Anak Punya Rekening Impian{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">
              Sendiri
            </span>
            <br />— Untuk Pertama Kalinya!
          </h2>
          <p className="text-slate-400 text-lg max-w-3xl mx-auto leading-relaxed">
            Bukan sekadar celengan. Misi Pintar hadir dengan sistem kantong tabungan bertujuan yang mengajarkan anak merencanakan, menunda kesenangan, dan merayakan pencapaian finansial nyata.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="grid sm:grid-cols-2 gap-4">
            {features.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.1 + 0.2 }}
                className={`${feat.color} border rounded-2xl p-5 hover:-translate-y-1 transition-transform duration-200`}
              >
                <div className={`w-10 h-10 ${feat.iconBg} rounded-xl flex items-center justify-center mb-3`}>
                  <feat.icon className={`w-5 h-5 ${feat.iconColor}`} />
                </div>
                <h3 className={`font-semibold ${feat.titleColor} text-sm mb-1`}>{feat.title}</h3>
                <p className={`${feat.descColor} text-xs leading-relaxed`}>{feat.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            ref={cardRef}
            initial={{ opacity: 0, x: 60 }}
            animate={cardInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="flex justify-center"
          >
            <div className="relative w-full max-w-sm">
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 to-amber-500/20 rounded-[3rem] blur-2xl" />
              <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 border border-slate-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-xs text-slate-500 dark:text-gray-400 font-medium mb-0.5">🎯 Kantong Impian</div>
                    <div className="font-display font-bold text-slate-900 dark:text-white text-xl">Sepatu Nike Air Max</div>
                  </div>
                  <div className="text-3xl" style={{ animation: 'piggyBounce 2s ease-in-out infinite' }}>🐷</div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600 dark:text-gray-300 font-medium">Progress</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">68%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                    <motion.div
                      className="h-4 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                      initial={{ width: 0 }}
                      animate={cardInView ? { width: '68%' } : { width: 0 }}
                      transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 dark:text-gray-500 mt-1">
                    <span>Rp 306.000 terkumpul</span>
                    <span>Target: Rp 450.000</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {[
                    { icon: '🔒', text: 'Dikunci · Cair: 17 Agustus 2025' },
                    { icon: '📈', text: 'Bunga Ayah: +5%/bulan' },
                    { icon: '⏰', text: 'Perkiraan tercapai: 3 minggu lagi' },
                    { icon: '⚡', text: 'Auto-setor 30% dari setiap misi' },
                  ].map((item) => (
                    <div key={item.text} className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-300 bg-slate-50 dark:bg-gray-700/50 rounded-xl px-3 py-2">
                      <span>{item.icon}</span>
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex gap-2">
                  {['💰', '🪙', '💵'].map((coin, i) => (
                    <motion.span
                      key={i}
                      className="text-xl"
                      animate={{ y: [0, -20, 0], opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 1.5, delay: i * 0.3, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      {coin}
                    </motion.span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8 }}
          className="text-center bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 border border-emerald-500/20 rounded-3xl p-8"
        >
          <div className="text-3xl mb-4">🎊</div>
          <h3 className="font-display font-bold text-white text-2xl mb-2">Buat Kantong Impian Pertama Anak Anda</h3>
          <p className="text-slate-400 mb-6">Sepenuhnya gratis · Tidak ada biaya administrasi · Tidak terhubung ke bank</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold px-8 py-4 rounded-2xl hover:-translate-y-1 transition-transform duration-200 shadow-lg shadow-emerald-500/30"
          >
            🐷 Mulai Tabungan Virtual Sekarang
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
