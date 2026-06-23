'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { staggerContainer, fadeUpVariants } from '@/lib/animations'
import { Trophy, Crown, Star, Flame, Shield, Zap, ChevronUp, ChevronDown } from 'lucide-react'

const chores = [
  { emoji: '🧹', title: 'Sapu & Pel Lantai', reward: 3000, xp: 25, cat: 'Harian', color: 'from-orange-400 to-amber-500', time: '15 mnt' },
  { emoji: '🍽️', title: 'Cuci Piring', reward: 2500, xp: 20, cat: 'Harian', color: 'from-blue-400 to-blue-500', time: '10 mnt' },
  { emoji: '🌿', title: 'Siram Tanaman', reward: 2000, xp: 15, cat: 'Harian', color: 'from-emerald-400 to-green-500', time: '5 mnt' },
  { emoji: '🧺', title: 'Lipat Baju', reward: 4000, xp: 30, cat: 'Mingguan', color: 'from-purple-400 to-purple-500', time: '20 mnt' },
  { emoji: '🗑️', title: 'Buang Sampah', reward: 1500, xp: 10, cat: 'Harian', color: 'from-slate-400 to-slate-500', time: '5 mnt' },
  { emoji: '🪟', title: 'Lap Jendela', reward: 5000, xp: 40, cat: 'Mingguan', color: 'from-cyan-400 to-cyan-500', time: '25 mnt' },
]

const leaderboard = [
  { rank: 1, name: 'Zara', age: 11, avatar: '👧', xp: 2840, level: 12, badge: '👑', streak: 14, weeklyDone: 18, trend: 'up', color: 'from-amber-400 to-yellow-500' },
  { rank: 2, name: 'Faiz', age: 9, avatar: '👦', xp: 2210, level: 10, badge: '🥈', streak: 9, weeklyDone: 14, trend: 'up', color: 'from-slate-300 to-slate-400' },
  { rank: 3, name: 'Kiki', age: 7, avatar: '🧒', xp: 1640, level: 8, badge: '🥉', streak: 6, weeklyDone: 11, trend: 'down', color: 'from-orange-300 to-amber-400' },
]

const heroFeatures = [
  {
    icon: Crown,
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-50',
    border: 'border-amber-100',
    title: 'Sistem Gelar Pahlawan',
    desc: 'Anak naik level dari "Pahlawan Pemula" → "Pahlawan Bintang" → "Pahlawan Legenda" berdasarkan tugas yang diselesaikan.',
  },
  {
    icon: Flame,
    iconColor: 'text-orange-500',
    iconBg: 'bg-orange-50',
    border: 'border-orange-100',
    title: 'Streak Harian Berapi',
    desc: 'Bonus XP berlipat setiap hari berturut-turut menyelesaikan tugas. Streak 7 hari = bonus reward ekstra dari orang tua.',
  },
  {
    icon: Shield,
    iconColor: 'text-emerald-500',
    iconBg: 'bg-emerald-50',
    border: 'border-emerald-100',
    title: 'Kompetisi Antar Saudara',
    desc: 'Leaderboard keluarga real-time mendorong semangat kompetisi positif. Siapa yang paling banyak bantu rumah minggu ini?',
  },
  {
    icon: Zap,
    iconColor: 'text-purple-500',
    iconBg: 'bg-purple-50',
    border: 'border-purple-100',
    title: 'Bonus Kejutan Orang Tua',
    desc: 'Orang tua bisa kirim "Bonus Surprise" kapan saja untuk tugas yang dilakukan dengan sangat baik. Momen spesial yang diingat seumur hidup.',
  },
]

function formatRupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

function XPBar({ xp, maxXp, color }: { xp: number; maxXp: number; color: string; inView: boolean }) {
  const pct = Math.min(100, Math.round((xp / maxXp) * 100))
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
      <motion.div
        className={`h-1.5 rounded-full bg-gradient-to-r ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }}
      />
    </div>
  )
}

export default function PahlawanRumahSection() {
  const { ref, inView } = useScrollReveal(0.1)
  const { ref: lbRef, inView: lbInView } = useScrollReveal(0.15)
  const [activeChore, setActiveChore] = useState<number | null>(null)

  return (
    <section
      id="pahlawan-rumah"
      className="py-20 md:py-32 relative overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #fffbeb 0%, #fff7ed 35%, #fef3c7 60%, #ecfdf5 100%)',
      }}
    >
      {/* Decorative blobs */}
      <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-amber-300/20 blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-emerald-300/20 blur-[80px] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, #f59e0b 1px, transparent 1px)', backgroundSize: '36px 36px' }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-amber-100 border border-amber-300 rounded-full px-5 py-2 mb-6 shadow-sm">
            <Trophy className="w-4 h-4 text-amber-600" />
            <span className="text-amber-700 text-sm font-bold tracking-wide">Pahlawan Rumah</span>
          </div>
          <h2 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-slate-900 mb-5 leading-[1.1]">
            Rumah Bersih,{' '}
            <span className="relative inline-block">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600">
                Anak Semakin
              </span>
              <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-emerald-700">
                Kaya & Bertanggung Jawab!
              </span>
            </span>
          </h2>
          <p className="text-slate-600 text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed">
            Ubah tugas rumah yang membosankan jadi arena kompetisi seru antar saudara.
            Siapa yang paling banyak bantu rumah minggu ini? Leaderboard keluarga akan menjawabnya!
          </p>
        </motion.div>

        {/* ── Feature Cards 2×2 ── */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-20"
        >
          {heroFeatures.map((feat, i) => (
            <motion.div
              key={feat.title}
              custom={i}
              variants={fadeUpVariants}
              whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.2 } }}
              className={`bg-white border ${feat.border} rounded-2xl p-6 shadow-sm hover:shadow-lg hover:shadow-amber-100/60 cursor-default`}
            >
              <div className={`w-11 h-11 ${feat.iconBg} rounded-xl flex items-center justify-center mb-4`}>
                <feat.icon className={`w-5 h-5 ${feat.iconColor}`} />
              </div>
              <h3 className="font-display font-bold text-slate-900 mb-2">{feat.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Main two-column: Chore Cards + Leaderboard ── */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">

          {/* Left — Chore Card Grid */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mb-6"
            >
              <h3 className="font-display font-bold text-2xl text-slate-900 mb-2">
                🏠 Katalog Tugas Rumah
              </h3>
              <p className="text-slate-500 text-sm">
                Pilih dari puluhan template tugas siap pakai — atau buat sendiri sesuai kebutuhan rumah tangga.
              </p>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
              className="grid sm:grid-cols-2 gap-3"
            >
              {chores.map((chore, i) => (
                <motion.button
                  key={chore.title}
                  custom={i}
                  variants={fadeUpVariants}
                  whileHover={{ scale: 1.03, y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveChore(activeChore === i ? null : i)}
                  className={`text-left bg-white border-2 rounded-2xl p-4 shadow-sm transition-all duration-200 ${
                    activeChore === i
                      ? 'border-amber-400 shadow-amber-100/80 shadow-lg'
                      : 'border-slate-100 hover:border-amber-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${chore.color} flex items-center justify-center text-xl flex-shrink-0 shadow-md`}>
                      {chore.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-semibold text-slate-900 text-sm truncate">{chore.title}</span>
                        <span className="text-xs text-slate-400 shrink-0">{chore.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-600 font-bold text-sm">{formatRupiah(chore.reward)}</span>
                        <span className="text-amber-500 text-xs font-medium">+{chore.xp} XP</span>
                        <span className="ml-auto text-xs bg-slate-50 border border-slate-100 text-slate-400 px-2 py-0.5 rounded-full">{chore.cat}</span>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {activeChore === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 pt-3 border-t border-amber-100 flex items-center justify-between gap-2">
                          <span className="text-xs text-slate-500">Klik "Pakai Template" untuk langsung aktif</span>
                          <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg whitespace-nowrap">
                            ✅ Pakai Template
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.8 }}
              className="mt-4 text-center text-sm text-slate-400"
            >
              + 40 template tugas rumah lainnya siap pakai
            </motion.div>
          </div>

          {/* Right — Animated Leaderboard */}
          <div ref={lbRef}>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={lbInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="mb-6"
            >
              <h3 className="font-display font-bold text-2xl text-slate-900 mb-2">
                🏆 Leaderboard Keluarga
              </h3>
              <p className="text-slate-500 text-sm">
                Kompetisi positif antar saudara — siapa Pahlawan Rumah minggu ini?
              </p>
            </motion.div>

            {/* Leaderboard Card */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={lbInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="bg-white rounded-3xl shadow-2xl shadow-amber-100/60 border border-amber-100/50 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white/80 text-xs font-semibold tracking-widest uppercase mb-1">Keluarga Budi</div>
                    <div className="text-white font-display font-black text-xl">Pahlawan Minggu Ini</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white/80 text-xs mb-1">Reset tiap Senin</div>
                    <div className="text-white font-bold text-sm">Sisa 3 hari</div>
                  </div>
                </div>
              </div>

              {/* Rank rows */}
              <div className="divide-y divide-slate-50">
                {leaderboard.map((member, i) => (
                  <motion.div
                    key={member.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={lbInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.35 + i * 0.12, duration: 0.5 }}
                    className={`px-6 py-4 flex items-center gap-4 ${i === 0 ? 'bg-amber-50/60' : 'bg-white'}`}
                  >
                    {/* Rank badge */}
                    <div className="relative flex-shrink-0">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${member.color} flex items-center justify-center text-2xl shadow-md`}>
                        {member.avatar}
                      </div>
                      <div className="absolute -top-1.5 -right-1.5 text-base leading-none">{member.badge}</div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-display font-bold text-slate-900">{member.name}</span>
                        <span className="text-xs text-slate-400">{member.age} thn</span>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full">Lv.{member.level}</span>
                        {member.streak >= 7 && (
                          <span className="text-xs font-bold text-orange-500 flex items-center gap-0.5">
                            <Flame className="w-3 h-3" />{member.streak}d
                          </span>
                        )}
                      </div>
                      <XPBar xp={member.xp} maxXp={3000} color={member.color} inView={lbInView} />
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-slate-400">{member.xp.toLocaleString('id-ID')} / 3.000 XP</span>
                        <span className="text-xs text-slate-400">{member.weeklyDone} tugas minggu ini</span>
                      </div>
                    </div>

                    {/* Trend */}
                    <div className={`flex-shrink-0 flex items-center gap-0.5 text-xs font-bold ${member.trend === 'up' ? 'text-emerald-500' : 'text-red-400'}`}>
                      {member.trend === 'up'
                        ? <ChevronUp className="w-4 h-4" />
                        : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Weekly summary bar */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
                <div className="grid grid-cols-3 gap-4 text-center">
                  {[
                    { label: 'Total Tugas', value: '43', icon: '✅' },
                    { label: 'XP Diberikan', value: '6.690', icon: '⭐' },
                    { label: 'Reward Cair', value: 'Rp 138.500', icon: '💰' },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <div className="text-base mb-0.5">{stat.icon}</div>
                      <div className="font-display font-bold text-slate-900 text-sm">{stat.value}</div>
                      <div className="text-slate-400 text-xs">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA inside card */}
              <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-t border-amber-100">
                <div className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-400 flex-shrink-0" />
                  <p className="text-sm text-amber-700 font-medium">
                    <strong>Zara</strong> akan naik ke <strong>Lv.13</strong> jika selesaikan 2 tugas lagi!
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Level progression showcase */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={lbInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.7 }}
              className="mt-6 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm"
            >
              <h4 className="font-display font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500" />
                Jenjang Gelar Pahlawan
              </h4>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {[
                  { label: 'Pemula', emoji: '🌱', color: 'from-slate-300 to-slate-400', lvl: '1-3' },
                  { label: 'Pejuang', emoji: '⚔️', color: 'from-blue-400 to-blue-500', lvl: '4-6' },
                  { label: 'Ksatria', emoji: '🛡️', color: 'from-purple-400 to-purple-500', lvl: '7-9' },
                  { label: 'Bintang', emoji: '⭐', color: 'from-amber-400 to-yellow-500', lvl: '10-12' },
                  { label: 'Legenda', emoji: '👑', color: 'from-orange-400 to-red-500', lvl: '13+' },
                ].map((tier, i) => (
                  <div key={tier.label} className="flex flex-col items-center gap-1 flex-shrink-0">
                    {i < 4 && (
                      <div className="absolute" />
                    )}
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center text-lg shadow-md`}>
                      {tier.emoji}
                    </div>
                    <span className="text-slate-700 text-xs font-semibold">{tier.label}</span>
                    <span className="text-slate-400 text-xs">Lv.{tier.lvl}</span>
                    {i < 4 && <span className="text-slate-200 text-sm -mt-1">→</span>}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── Bottom CTA strip ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.9 }}
          className="mt-20 relative overflow-hidden rounded-3xl"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500" />
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="relative z-10 px-8 py-10 md:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <div className="text-white/80 text-sm font-semibold mb-1">Siap jadi Keluarga Pahlawan?</div>
              <h3 className="font-display font-black text-white text-2xl md:text-3xl">
                Mulai Leaderboard Keluarga Anda Sekarang 🏠
              </h3>
              <p className="text-amber-100 mt-1 text-sm">Gratis · Setup 60 detik · Tidak perlu kartu kredit</p>
            </div>
            <motion.a
              href="/register"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="group relative flex-shrink-0 inline-flex items-center gap-2 bg-white text-amber-600 font-black text-base px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 overflow-hidden"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <Trophy className="w-5 h-5" />
              Buat Leaderboard Keluarga
            </motion.a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
