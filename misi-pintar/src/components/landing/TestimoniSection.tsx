'use client'
import { motion } from 'framer-motion'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { Star, BadgeCheck } from 'lucide-react'

const testimonials = [
  {
    stars: 5,
    quote: 'Anak saya yang tadinya males belajar, sekarang malah nagih misi baru tiap hari! Ajaib banget. Misi Pintar beneran mengubah dinamika keluarga kami.',
    name: 'Bunda Rina',
    city: 'Jakarta',
    role: 'Ibu dari Rafi (9 tahun)',
    gradient: 'from-emerald-400 to-emerald-600',
  },
  {
    stars: 5,
    quote: 'Awalnya skeptis soal virtual money, tapi liat Alisha nabung Rp 300rb untuk beli buku sendiri tanpa minta-minta... saya terharu. Ini yang saya impikan.',
    name: 'Ayah Dimas',
    city: 'Surabaya',
    role: 'Ayah dari Alisha (11 tahun)',
    gradient: 'from-blue-400 to-blue-600',
  },
  {
    stars: 5,
    quote: 'PR selesai sendiri tanpa diingatkan. Bahkan minta tambah misi! Luar biasa. Highly recommended buat semua orang tua.',
    name: 'Mama Sari',
    city: 'Bandung',
    role: 'Ibu dari Naufal (8 tahun)',
    gradient: 'from-purple-400 to-purple-600',
  },
  {
    stars: 5,
    quote: 'Fitur tabungan impiannya keren banget. Anak ngerti sendiri arti menabung untuk impiannya. Ini yang namanya financial literacy sejak dini!',
    name: 'Bunda Fitri',
    city: 'Yogyakarta',
    role: 'Ibu dari Zahra (10 tahun)',
    gradient: 'from-amber-400 to-orange-500',
  },
  {
    stars: 5,
    quote: 'Drama malam sudah hilang total. Sekarang ganti jadi kompetisi siapa duluan klaim misi! Bonding keluarga juga meningkat drastis.',
    name: 'Papah Rizky',
    city: 'Medan',
    role: 'Ayah dari Faiz (7 & 9 tahun)',
    gradient: 'from-rose-400 to-pink-500',
  },
  {
    stars: 5,
    quote: 'Sekarang anak malah ngajak adiknya buat misi bareng. Mereka kompetisi positif. Bonding keluarga meningkat. Terima kasih Misi Pintar!',
    name: 'Bunda Dewi',
    city: 'Semarang',
    role: 'Ibu dari Azkia (8 & 12 tahun)',
    gradient: 'from-teal-400 to-emerald-500',
  },
]

export default function TestimoniSection() {
  const { ref, inView } = useScrollReveal()

  return (
    <section id="testimoni" className="py-20 md:py-28 bg-slate-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-amber-100 border border-amber-200 rounded-full px-4 py-2 mb-6">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="text-amber-700 text-sm font-semibold">Testimoni Nyata</span>
          </div>
          <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-slate-900 mb-4">
            Dipercaya{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">
              Ribuan Keluarga Indonesia
            </span>
          </h2>
          <div className="flex items-center justify-center gap-1 mb-2">
            {[1,2,3,4,5].map(i => <Star key={i} className="w-6 h-6 text-amber-400 fill-amber-400" />)}
            <span className="ml-2 text-slate-700 font-bold text-lg">4.9/5</span>
          </div>
          <p className="text-slate-500">dari 3.200+ ulasan terverifikasi</p>
        </motion.div>

        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="break-inside-avoid bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-1">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                  <BadgeCheck className="w-3 h-3" />
                  Verified
                </div>
              </div>
              <p className="text-slate-700 leading-relaxed mb-6 italic">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                  {t.name.split(' ').slice(-1)[0][0]}
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm">{t.name}</div>
                  <div className="text-slate-500 text-xs">{t.city} · {t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
