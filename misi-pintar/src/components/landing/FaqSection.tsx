'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    q: 'Apakah ini tidak membuat anak bermental matre/pamrih?',
    a: 'Justru sebaliknya. Misi Pintar mengajarkan bahwa uang adalah hasil dari kerja dan tanggung jawab — bukan sesuatu yang didapat gratis. Sistem reward dikaitkan dengan prestasi nyata dan nilai-nilai karakter, bukan sekadar "minta dan dapat". Penelitian menunjukkan anak yang belajar nilai uang sejak dini justru lebih bijak finansial saat dewasa.',
  },
  {
    q: 'Bagaimana jika saldo virtual dihabiskan untuk hal tidak berguna?',
    a: 'Orang tua punya kontrol penuh. Anda bisa mengatur ke mana saldo bisa digunakan — hanya untuk tabungan, atau bisa juga untuk "beli" hadiah virtual yang sudah Anda setujui. Ini justru sarana latihan membuat keputusan finansial dalam lingkungan yang aman dan terkontrol.',
  },
  {
    q: 'Apakah saldo virtual bisa dicairkan ke uang sungguhan?',
    a: 'Saldo virtual adalah representasi digital dari uang nyata yang sudah Anda janjikan. Cara pencairan terserah kesepakatan keluarga — bisa transfer langsung, atau ditukar hadiah fisik. Misi Pintar tidak terhubung ke sistem perbankan, sehingga sepenuhnya aman dan dalam kendali orang tua.',
  },
  {
    q: 'Berapa usia anak yang cocok menggunakan Misi Pintar?',
    a: 'Usia 5–15 tahun adalah rentang ideal. Anak usia 5–7 tahun bisa mulai dengan misi sederhana. Usia 8–12 tahun adalah fase emas dengan fitur penuh. Usia 13–15 tahun dapat menggunakan fitur tabungan bertujuan yang lebih kompleks untuk persiapan finansial remaja.',
  },
  {
    q: 'Apakah data keluarga aman dan privat?',
    a: 'Keamanan adalah prioritas utama. Data keluarga dienkripsi end-to-end, tidak dibagikan ke pihak ketiga, tidak ada iklan berbasis data anak. Kami mematuhi regulasi perlindungan data anak. Tidak ada informasi bank atau kartu kredit yang diperlukan.',
  },
  {
    q: 'Berapa lama fase gratis ini berlaku?',
    a: 'Kami berkomitmen memberikan akses gratis untuk 1 juta keluarga pertama sebagai bagian dari misi kami membangun Indonesia yang melek keuangan. Slot masih tersedia — daftar sekarang untuk mengunci akses gratis Anda.',
  },
  {
    q: 'Apa bedanya fitur Tabungan Virtual dengan celengan biasa?',
    a: 'Celengan biasa tidak punya tujuan, tidak ada bunga reward, tidak ada kunci komitmen, dan tidak ada momen perayaan. Kantong Impian Misi Pintar mengajarkan goal-based saving — anak menetapkan target spesifik, melihat progresnya setiap hari, mendapatkan bunga dari orang tua, dan merayakan pencapaian bersama keluarga. Ini simulasi rekening tabungan nyata dalam lingkungan yang aman.',
  },
  {
    q: 'Apakah bisa digunakan untuk lebih dari satu anak?',
    a: 'Ya! Satu FamilySpace bisa menampung beberapa profil anak sekaligus. Setiap anak punya dashboard sendiri, saldo terpisah, dan misi yang bisa dibedakan sesuai usia dan kebutuhan. Bahkan anak-anak bisa melihat progress satu sama lain sebagai motivasi.',
  },
]

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const { ref, inView } = useScrollReveal()

  return (
    <section id="faq" className="py-20 md:py-28 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-full px-4 py-2 mb-6">
            <span className="text-slate-600 text-sm font-semibold">❓ Pertanyaan Umum</span>
          </div>
          <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-slate-900 mb-4">
            Punya Pertanyaan?{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-emerald-700">
              Kami Jawab!
            </span>
          </h2>
          <p className="text-slate-500 text-lg">Pertanyaan yang sering ditanyakan oleh orang tua</p>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              className={`border rounded-2xl overflow-hidden transition-colors duration-200 ${
                openIndex === i ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-100 bg-white hover:border-emerald-100'
              }`}
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span className="font-semibold text-slate-900 text-base leading-snug">{faq.q}</span>
                <motion.div
                  animate={{ rotate: openIndex === i ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                    openIndex === i ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.div>
              </button>

              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 text-slate-600 leading-relaxed border-t border-emerald-100">
                      <div className="pt-4">{faq.a}</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
