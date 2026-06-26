'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import { articles } from '@/lib/articles'
import { Clock, ArrowRight, Search, BookOpen } from 'lucide-react'

const categories = ['Semua', ...Array.from(new Set(articles.map((a) => a.category)))]

export default function BlogPage() {
  const [active, setActive] = useState('Semua')
  const [query, setQuery] = useState('')

  const filtered = articles.filter((a) => {
    const matchCat = active === 'Semua' || a.category === active
    const matchQ = query === '' || a.title.toLowerCase().includes(query.toLowerCase()) || a.excerpt.toLowerCase().includes(query.toLowerCase())
    return matchCat && matchQ
  })

  const [featured, ...rest] = filtered

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
      <Navbar />

      {/* HERO */}
      <section className="relative pt-32 pb-16 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px]" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.45 }}
            className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-2 mb-7"
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 text-sm font-semibold">Blog & Literasi Keuangan</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.08 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4"
          >
            Bacaan untuk{' '}
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg,#34d399,#10b981)' }}>
              Keluarga Pintar
            </span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.18 }}
            className="text-slate-300 text-lg leading-relaxed mb-8 max-w-2xl mx-auto"
          >
            Artikel pilihan tentang parenting keuangan, psikologi anak, dan metode gamifikasi yang terbukti efektif untuk keluarga Indonesia.
          </motion.p>
          {/* Search */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.28 }}
            className="relative max-w-lg mx-auto"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari artikel..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-white/10 border border-white/15 text-white placeholder-slate-500 text-sm rounded-2xl pl-12 pr-5 py-3.5 focus:outline-none focus:border-emerald-500/50 focus:bg-white/15 transition-all backdrop-blur-sm"
            />
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white dark:from-gray-950 to-transparent" />
      </section>

      {/* CATEGORY TABS */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-b border-slate-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-3 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className={`flex-shrink-0 text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200 ${
                  active === cat
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                    : 'text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ARTICLES */}
      <section className="flex-1 py-14 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            {filtered.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="py-24 text-center"
              >
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-slate-500 dark:text-gray-400 text-lg">Tidak ada artikel yang cocok.</p>
                <button onClick={() => { setQuery(''); setActive('Semua') }}
                  className="mt-4 text-emerald-600 dark:text-emerald-400 font-semibold text-sm hover:underline"
                >
                  Reset filter
                </button>
              </motion.div>
            ) : (
              <motion.div key={active + query} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Featured */}
                {featured && (
                  <Link href={`/blog/${featured.slug}`} className="group block mb-8">
                    <div className={`relative rounded-3xl border ${featured.border} ${featured.hoverBorder} overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300`}>
                      <div className={`h-1.5 w-full ${featured.accent}`} />
                      <div className={`absolute inset-0 bg-gradient-to-br ${featured.gradient} pointer-events-none`} />
                      <div className="relative z-10 p-8 sm:p-10 grid lg:grid-cols-3 gap-8 items-center">
                        <div className="lg:col-span-2">
                          <div className="flex flex-wrap gap-2 mb-4">
                            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${featured.categoryColor}`}>{featured.category}</span>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${featured.tagColor}`}>{featured.tag}</span>
                          </div>
                          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-snug mb-3 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {featured.title}
                          </h2>
                          <p className="text-slate-500 dark:text-gray-400 leading-relaxed mb-6 line-clamp-3">{featured.excerpt}</p>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                              <Clock className="w-4 h-4" />
                              <span>{featured.readTime} baca</span>
                            </div>
                            <span className="text-slate-400 text-sm">{featured.publishedAt}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center lg:items-end gap-4">
                          <div className="text-8xl">{featured.emoji}</div>
                          <span className="inline-flex items-center gap-2 bg-emerald-500 text-white font-semibold text-sm px-6 py-3 rounded-2xl group-hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/25">
                            Baca Artikel <ArrowRight className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )}

                {/* Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rest.map((article, i) => (
                    <motion.div
                      key={article.slug}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, delay: i * 0.07 }}
                    >
                      <Link href={`/blog/${article.slug}`} className="group block h-full">
                        <div className={`relative h-full flex flex-col bg-white dark:bg-gray-900 rounded-3xl border ${article.border} ${article.hoverBorder} hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden`}>
                          <div className={`h-1 w-full ${article.accent}`} />
                          <div className={`absolute inset-0 bg-gradient-to-br ${article.gradient} opacity-60 pointer-events-none`} />
                          <div className="relative z-10 flex flex-col flex-1 p-6">
                            <div className="flex items-start justify-between gap-2 mb-4">
                              <div className="flex flex-wrap gap-1.5">
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${article.categoryColor}`}>{article.category}</span>
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${article.tagColor}`}>{article.tag}</span>
                              </div>
                              <span className="text-3xl flex-shrink-0">{article.emoji}</span>
                            </div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-snug mb-3 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              {article.title}
                            </h3>
                            <p className="text-slate-500 dark:text-gray-400 text-sm leading-relaxed flex-1 mb-5 line-clamp-3">{article.excerpt}</p>
                            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-gray-800">
                              <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{article.readTime}</span>
                              </div>
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                                Baca <ArrowRight className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <Footer />
    </div>
  )
}
