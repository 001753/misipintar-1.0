'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRef } from 'react'
import { useInView } from 'framer-motion'
import { ArrowRight, Clock, BookOpen } from 'lucide-react'

const articles = [
  {
    id: 1,
    category: 'Parenting & Uang',
    categoryColor: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300',
    emoji: '💰',
    readTime: '4 menit',
    title: 'Kenapa Anak Zaman Sekarang Tidak Tahu Harga Barang?',
    excerpt: 'Di era QRIS dan dompet digital, anak tidak pernah melihat uang fisik berpindah tangan. Akibatnya, mereka kehilangan "rasa" terhadap nilai uang. Begini cara mengatasinya.',
    tag: 'Paling Banyak Dibaca',
    tagColor: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
    gradient: 'from-emerald-500/10 to-teal-500/5',
    border: 'border-emerald-100 dark:border-emerald-900/30',
    hoverBorder: 'hover:border-emerald-300 dark:hover:border-emerald-700',
    accent: 'bg-emerald-500',
    featured: true,
  },
  {
    id: 2,
    category: 'Psikologi Anak',
    categoryColor: 'bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300',
    emoji: '🧠',
    readTime: '3 menit',
    title: 'Delayed Gratification: Rahasia Anak Sukses yang Dimulai dari Usia 5 Tahun',
    excerpt: 'Studi "Marshmallow Test" Stanford membuktikan: anak yang bisa menunda kepuasan instan memiliki prestasi akademik dan keuangan yang jauh lebih baik di masa dewasa.',
    tag: 'Populer',
    tagColor: 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300',
    gradient: 'from-indigo-500/10 to-purple-500/5',
    border: 'border-indigo-100 dark:border-indigo-900/30',
    hoverBorder: 'hover:border-indigo-300 dark:hover:border-indigo-700',
    accent: 'bg-indigo-500',
    featured: false,
  },
  {
    id: 3,
    category: 'Tips Praktis',
    categoryColor: 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300',
    emoji: '🎯',
    readTime: '5 menit',
    title: '7 Misi Harian yang Terbukti Membentuk Karakter Disiplin Anak',
    excerpt: 'Dari merapikan tempat tidur hingga membaca 20 halaman buku — ini daftar misi sederhana yang berdampak besar pada pembentukan disiplin dan rasa tanggung jawab anak.',
    tag: 'Panduan',
    tagColor: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
    gradient: 'from-amber-500/10 to-orange-500/5',
    border: 'border-amber-100 dark:border-amber-900/30',
    hoverBorder: 'hover:border-amber-300 dark:hover:border-amber-700',
    accent: 'bg-amber-500',
    featured: false,
  },
  {
    id: 4,
    category: 'Literasi Keuangan',
    categoryColor: 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300',
    emoji: '🐷',
    readTime: '3 menit',
    title: 'Ajarkan 3 Kantong Uang Sejak Dini: Tabung, Sedekah, Belanja',
    excerpt: 'Konsep "three-jar method" adalah metode literasi keuangan paling efektif untuk anak usia 6–14 tahun. Anak belajar mengalokasikan pendapatan bahkan sebelum memiliki rekening bank.',
    tag: 'Terbaru',
    tagColor: 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300',
    gradient: 'from-rose-500/10 to-pink-500/5',
    border: 'border-rose-100 dark:border-rose-900/30',
    hoverBorder: 'hover:border-rose-300 dark:hover:border-rose-700',
    accent: 'bg-rose-500',
    featured: false,
  },
  {
    id: 5,
    category: 'Studi Kasus',
    categoryColor: 'bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300',
    emoji: '📊',
    readTime: '6 menit',
    title: 'Dari Tagihan Game Rp 300ribu/Bulan ke Tabungan Rp 500ribu: Kisah Nyata Keluarga Andi',
    excerpt: 'Andi (38) hampir menyerah mendidik anaknya yang kecanduan top-up game online. Tiga bulan dengan MisiPintar, anaknya berhenti meminta — dan mulai menabung sendiri.',
    tag: 'Kisah Nyata',
    tagColor: 'bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300',
    gradient: 'from-violet-500/10 to-purple-500/5',
    border: 'border-violet-100 dark:border-violet-900/30',
    hoverBorder: 'hover:border-violet-300 dark:hover:border-violet-700',
    accent: 'bg-violet-500',
    featured: false,
  },
  {
    id: 6,
    category: 'Teknologi & Anak',
    categoryColor: 'bg-cyan-100 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300',
    emoji: '📱',
    readTime: '4 menit',
    title: 'QRIS, E-Wallet, dan Bahaya "Uang Tidak Terasa": Panduan Orang Tua Digital',
    excerpt: 'Ketika transaksi hanya butuh satu ketuk layar, anak kehilangan kesempatan belajar nilai uang secara emosional. Inilah mengapa pendidikan keuangan berbasis teknologi menjadi sangat krusial.',
    tag: 'Edukasi',
    tagColor: 'bg-cyan-100 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300',
    gradient: 'from-cyan-500/10 to-blue-500/5',
    border: 'border-cyan-100 dark:border-cyan-900/30',
    hoverBorder: 'hover:border-cyan-300 dark:hover:border-cyan-700',
    accent: 'bg-cyan-500',
    featured: false,
  },
]

function ArticleCard({ article, index }: { article: typeof articles[0]; index: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 36 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: (index % 3) * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="group h-full"
    >
      <div className={`relative h-full flex flex-col bg-white dark:bg-gray-900 rounded-3xl border ${article.border} ${article.hoverBorder} hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden`}>
        {/* Color accent top strip */}
        <div className={`h-1 w-full ${article.accent}`} />

        {/* Bg gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-br ${article.gradient} opacity-60 pointer-events-none`} />

        <div className="relative z-10 flex flex-col flex-1 p-6 sm:p-7">
          {/* Top row */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${article.categoryColor}`}>
                {article.category}
              </span>
              {article.tag && (
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${article.tagColor}`}>
                  {article.tag}
                </span>
              )}
            </div>
            <span className="text-3xl flex-shrink-0">{article.emoji}</span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-snug mb-3 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-200">
            {article.title}
          </h3>

          {/* Excerpt */}
          <p className="text-slate-500 dark:text-gray-400 text-sm leading-relaxed flex-1 mb-5">
            {article.excerpt}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-gray-800">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs">
              <Clock className="w-3.5 h-3.5" />
              <span>{article.readTime} baca</span>
            </div>
            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-xs group-hover:gap-2.5 transition-all duration-200">
              Baca Selengkapnya
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    </motion.article>
  )
}

export default function LiterasisSection() {
  const headerRef = useRef(null)
  const headerInView = useInView(headerRef, { once: true, margin: '-80px' })

  const [featured, ...rest] = articles

  return (
    <section className="py-24 bg-slate-50 dark:bg-gray-900" id="literasi">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 30 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12"
        >
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-full px-4 py-1.5 mb-4">
              <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-700 dark:text-emerald-400 text-sm font-semibold">Literasi Keuangan</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white leading-tight">
              Bacaan Cerdas untuk<br className="hidden sm:block" />{' '}
              <span className="text-emerald-500">Orang Tua Pintar</span>
            </h2>
            <p className="text-slate-500 dark:text-gray-400 text-base mt-3 max-w-xl">
              Artikel pilihan seputar parenting keuangan, psikologi anak, dan metode gamifikasi yang terbukti efektif.
            </p>
          </div>
          <Link
            href="/blog"
            className="flex-shrink-0 inline-flex items-center gap-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-200 font-semibold text-sm px-6 py-3 rounded-2xl hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            Semua Artikel
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* Featured + side cards */}
        <div className="grid lg:grid-cols-5 gap-6 mb-6">
          {/* Featured card — spans 3 columns */}
          <motion.div
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-3 group"
          >
            <div className={`relative h-full flex flex-col bg-white dark:bg-gray-900 rounded-3xl border ${featured.border} ${featured.hoverBorder} hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden`}>
              <div className={`h-1.5 w-full ${featured.accent}`} />
              <div className={`absolute inset-0 bg-gradient-to-br ${featured.gradient} opacity-60 pointer-events-none`} />
              <div className="relative z-10 flex flex-col flex-1 p-8 sm:p-10">
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${featured.categoryColor}`}>
                      {featured.category}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${featured.tagColor}`}>
                      {featured.tag}
                    </span>
                  </div>
                  <span className="text-4xl">{featured.emoji}</span>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-2xl sm:text-3xl leading-snug mb-4 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-200">
                  {featured.title}
                </h3>
                <p className="text-slate-500 dark:text-gray-400 text-base leading-relaxed flex-1 mb-6">
                  {featured.excerpt}
                </p>
                <div className="flex items-center justify-between pt-5 border-t border-slate-100 dark:border-gray-800">
                  <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>{featured.readTime} baca</span>
                  </div>
                  <span className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm px-5 py-2.5 rounded-xl group-hover:gap-3 transition-all duration-200 cursor-pointer">
                    Baca Selengkapnya
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Two stacked side cards */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {rest.slice(0, 2).map((article, i) => (
              <ArticleCard key={article.id} article={article} index={i} />
            ))}
          </div>
        </div>

        {/* Bottom row — 3 cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.slice(2).map((article, i) => (
            <ArticleCard key={article.id} article={article} index={i + 2} />
          ))}
        </div>

        {/* Bottom CTA strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.55, delay: 0.2 }}
          className="mt-12 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-3xl p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl shadow-emerald-500/20"
        >
          <div>
            <div className="text-emerald-200 text-xs font-bold uppercase tracking-widest mb-2">Newsletter Mingguan</div>
            <h3 className="text-white font-bold text-xl sm:text-2xl leading-tight mb-1">
              Dapatkan Artikel Terbaru Langsung ke WhatsApp
            </h3>
            <p className="text-emerald-200 text-sm">
              Tips parenting keuangan, misi inspiratif, dan panduan edutech untuk keluarga Indonesia.
            </p>
          </div>
          <Link
            href="/register"
            className="flex-shrink-0 inline-flex items-center gap-2 bg-white text-emerald-700 font-bold text-sm px-7 py-3.5 rounded-2xl hover:bg-emerald-50 hover:-translate-y-0.5 transition-all duration-200 shadow-lg"
          >
            Daftar Gratis Sekarang
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
