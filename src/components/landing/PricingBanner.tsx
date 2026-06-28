'use client'
/**
 * PricingBanner / PricingSection — Dinamis berdasarkan data backend.
 *
 * phaseMode FULL_FREE   → Banner hijau "GRATIS" (seperti sebelumnya tapi data DB)
 * phaseMode FREEMIUM    → Kartu harga: STARTER gratis + Pro/Educator berbayar
 * phaseMode PAID_ONLY   → Semua kartu dengan harga real
 *
 * showPricingSection = false → tidak render apapun (hide dari landing page)
 * plan.limits.showOnLanding  = false → plan tidak ditampilkan di landing
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import Link from 'next/link'
import { CheckCircle, Flame, Clock, Star } from 'lucide-react'

// ── Types (diekspor untuk dipakai di page.tsx & LandingPage.tsx) ──────────────
export type PricingPlan = {
  id: string
  type: string
  name: string
  price: number
  yearlyPrice: number
  isActive: boolean
  limits: Record<string, unknown>
}

export type PricingData = {
  showPricingSection: boolean
  phaseMode: 'FULL_FREE' | 'FREEMIUM' | 'PAID_ONLY'
  plans: PricingPlan[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const PLAN_ICONS: Record<string, string> = {
  STARTER: '🌱',
  PRO: '🚀',
  EDUCATOR: '🎓',
  SCHOOL: '🏫',
}

function fmtRp(n: number): string {
  return `Rp ${n.toLocaleString('id-ID')}`
}

function getPlanFeatures(type: string, limits: Record<string, unknown>): string[] {
  const features: string[] = []
  const maxKids = limits.maxChildren as number
  const maxTasks = limits.maxTasksPerMonth as number

  features.push(maxKids === -1 ? 'Profil anak tak terbatas' : `${maxKids} profil anak`)
  features.push(maxTasks === -1 ? 'Misi tak terbatas/bulan' : `${maxTasks} misi/bulan`)
  features.push('Dashboard orang tua & anak')
  features.push('Notifikasi real-time')

  if (limits.hasTax) {
    const rate = (limits.taxRate as number) ?? 5
    features.push(`Sistem Pajak Jajan (${rate}%)`)
  }
  if (limits.hasInterest) {
    const rate = (limits.interestRate as number) ?? 2
    features.push(`Bunga Tabungan (${rate}%/bln)`)
  }
  if (type !== 'STARTER') {
    features.push('Laporan perkembangan PDF')
    features.push('Bukti kerja foto anti-cheat')
  }
  if (limits.sso) features.push('SSO Login Sekolah')

  return features
}

// ── Komponen: FULL_FREE Banner (hijau gradien, "GRATIS") ──────────────────────
function FullFreeBanner({ plans }: { plans: PricingPlan[] }) {
  const { ref, inView } = useScrollReveal()

  const featured = plans.find((p) => p.type === 'PRO') ?? plans[plans.length - 1]
  if (!featured) return null

  const features = getPlanFeatures(featured.type, featured.limits)
  const origPrice = featured.price

  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-slate-50 to-white dark:from-gray-900 dark:to-gray-950 transition-colors duration-200">
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
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 50%, #fbbf24, transparent 50%), radial-gradient(circle at 80% 50%, #34d399, transparent 50%)',
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />

          <div className="relative z-10 px-8 py-12 md:px-16 md:py-16 text-center">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-5 py-2 mb-6"
            >
              <Flame className="w-4 h-4 text-amber-300" />
              <span className="text-white text-sm font-bold">
                🎊 GRATIS SELAMANYA UNTUK 1 JUTA KELUARGA PERTAMA
              </span>
            </motion.div>

            <h2 className="font-display font-black text-white text-3xl sm:text-4xl lg:text-5xl mb-3">
              {origPrice > 0 ? (
                <>
                  Paket {featured.name} Senilai{' '}
                  <span className="text-white/40 line-through decoration-red-400">
                    {fmtRp(origPrice)}/bln
                  </span>
                </>
              ) : (
                'Semua Fitur GRATIS'
              )}
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
                <span className="font-bold text-white text-lg">952.847</span>
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

// ── Komponen: FREEMIUM / PAID_ONLY Kartu Harga ────────────────────────────────
function PricingCards({ plans }: { plans: PricingPlan[] }) {
  const { ref, inView } = useScrollReveal()
  const [yearly, setYearly] = useState(false)

  return (
    <section
      id="harga"
      className="py-20 md:py-28 bg-gradient-to-b from-slate-50 to-white dark:from-gray-900 dark:to-gray-950 transition-colors duration-200"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            <Star className="w-4 h-4" /> Paket &amp; Harga
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-3">
            Pilih Paket Yang Tepat
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-lg max-w-xl mx-auto">
            Mulai gratis, upgrade kapanpun ketika butuh lebih.
          </p>

          {/* Toggle bulanan / tahunan */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <span
              className={`text-sm font-medium transition-colors ${
                !yearly ? 'text-gray-900 dark:text-white' : 'text-gray-400'
              }`}
            >
              Bulanan
            </span>
            <button
              onClick={() => setYearly((v) => !v)}
              aria-label="Toggle periode tagihan"
              className={`relative w-12 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                yearly ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  yearly ? 'translate-x-6' : ''
                }`}
              />
            </button>
            <span
              className={`text-sm font-medium transition-colors ${
                yearly ? 'text-gray-900 dark:text-white' : 'text-gray-400'
              }`}
            >
              Tahunan{' '}
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">hemat ~20%</span>
            </span>
          </div>
        </motion.div>

        {/* Kartu */}
        <div
          className={`grid gap-6 ${
            plans.length === 1
              ? 'max-w-sm mx-auto'
              : plans.length === 2
              ? 'md:grid-cols-2 max-w-2xl mx-auto'
              : plans.length === 3
              ? 'md:grid-cols-3'
              : 'md:grid-cols-2 lg:grid-cols-4'
          }`}
        >
          {plans.map((plan, i) => {
            const isPro = plan.type === 'PRO'
            const price =
              yearly && plan.yearlyPrice > 0 ? plan.yearlyPrice : plan.price
            const isFree = price === 0
            const features = getPlanFeatures(plan.type, plan.limits)

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 40 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.1 + i * 0.1 }}
                className={`relative rounded-2xl overflow-hidden flex flex-col ${
                  isPro
                    ? 'ring-2 ring-emerald-500 shadow-2xl shadow-emerald-500/20 md:-mt-4 md:-mb-4'
                    : 'border border-gray-200 dark:border-gray-700'
                }`}
              >
                {isPro && (
                  <div className="bg-emerald-500 text-white text-center text-xs font-bold py-1.5 tracking-wide uppercase">
                    ⭐ Paling Populer
                  </div>
                )}

                <div
                  className={`p-6 flex flex-col h-full ${
                    isPro
                      ? 'bg-white dark:bg-gray-800'
                      : 'bg-white dark:bg-gray-800/60'
                  }`}
                >
                  {/* Nama plan */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">{PLAN_ICONS[plan.type] ?? '📦'}</span>
                    <p className="font-bold text-gray-900 dark:text-white text-base">
                      {plan.name}
                    </p>
                  </div>

                  {/* Harga */}
                  <div className="mb-6">
                    {isFree ? (
                      <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400">
                        Gratis
                      </p>
                    ) : (
                      <div>
                        <p className="text-3xl font-black text-gray-900 dark:text-white">
                          {fmtRp(price)}
                          <span className="text-sm font-medium text-gray-400 ml-1">
                            /{yearly ? 'tahun' : 'bln'}
                          </span>
                        </p>
                        {yearly && plan.price > 0 && plan.yearlyPrice > 0 && (
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                            Hemat {fmtRp(plan.price * 12 - plan.yearlyPrice)} vs bulanan
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Daftar fitur */}
                  <ul className="space-y-2.5 flex-1 mb-6">
                    {features.map((feat) => (
                      <li
                        key={feat}
                        className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300"
                      >
                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        {feat}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link
                    href="/register"
                    className={`block text-center py-3 px-5 rounded-xl font-bold text-sm transition-all duration-200 ${
                      isPro
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 hover:-translate-y-0.5'
                        : isFree
                        ? 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
                        : 'border-2 border-emerald-600 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                    }`}
                  >
                    {isFree ? 'Mulai Gratis' : isPro ? '🚀 Mulai Sekarang' : 'Pilih Paket'}
                  </Link>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Jaminan bawah */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-6 mt-12"
        >
          {['Tanpa kartu kredit di awal', 'Cancel kapanpun', 'Data aman & terenkripsi'].map(
            (item) => (
              <span
                key={item}
                className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-sm"
              >
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                {item}
              </span>
            )
          )}
        </motion.div>
      </div>
    </section>
  )
}

// ── Static Fallback (backward-compat bila data belum di-pass) ─────────────────
function StaticFallback() {
  const { ref, inView } = useScrollReveal()

  const staticFeatures = [
    'Ruang Keluarga tak terbatas',
    'Misi Pintar + Template lengkap',
    '🆕 Kantong Tabungan Virtual',
    'Sistem Pajak Jajan',
    'Pahlawan Rumah',
    'Fitur Bukti Kerja Anti-Cheat',
    'Laporan Perkembangan Anak',
  ]

  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-slate-50 to-white dark:from-gray-900 dark:to-gray-950 transition-colors duration-200">
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
              background:
                'linear-gradient(135deg, #064e3b, #065f46, #047857, #059669, #10b981)',
              backgroundSize: '300% 300%',
              animation: 'gradientX 8s ease infinite',
            }}
          />
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 50%, #fbbf24, transparent 50%), radial-gradient(circle at 80% 50%, #34d399, transparent 50%)',
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
          <div className="relative z-10 px-8 py-12 md:px-16 md:py-16 text-center">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-5 py-2 mb-6"
            >
              <Flame className="w-4 h-4 text-amber-300" />
              <span className="text-white text-sm font-bold">
                🎊 GRATIS SELAMANYA UNTUK 1 JUTA KELUARGA PERTAMA
              </span>
            </motion.div>
            <h2 className="font-display font-black text-white text-3xl sm:text-4xl lg:text-5xl mb-3">
              Paket Premium Senilai{' '}
              <span className="text-white/40 line-through decoration-red-400">Rp 29.000/bln</span>
            </h2>
            <div className="text-emerald-200 font-bold text-2xl sm:text-3xl mb-8">
              GRATIS selama masa promosi 🎁
            </div>
            <div className="grid sm:grid-cols-2 gap-3 mb-10 max-w-2xl mx-auto text-left">
              {staticFeatures.map((feat, i) => (
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
                <span className="font-bold text-white text-lg">952.847</span>
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

// ── Ekspor utama ───────────────────────────────────────────────────────────────
export default function PricingBanner({ pricingData }: { pricingData?: PricingData }) {
  // Backward compat: tidak ada data → fallback statis
  if (!pricingData) return <StaticFallback />

  // Admin menyembunyikan section → tidak render apapun
  if (!pricingData.showPricingSection) return null

  // Tidak ada plan yang diset tampil → tidak render
  if (pricingData.plans.length === 0) return null

  if (pricingData.phaseMode === 'FULL_FREE') {
    return <FullFreeBanner plans={pricingData.plans} />
  }

  return <PricingCards plans={pricingData.plans} />
}
