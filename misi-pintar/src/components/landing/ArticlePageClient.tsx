'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import { type Article, type ArticleSection } from '@/lib/articles'
import { Clock, ArrowLeft, ArrowRight, BookOpen, Share2, User } from 'lucide-react'

function renderSection(s: ArticleSection, i: number) {
  switch (s.type) {
    case 'heading':
      return (
        <h2 key={i} className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-10 mb-4 leading-snug">
          {s.text}
        </h2>
      )
    case 'subheading':
      return (
        <h3 key={i} className="text-xl font-bold text-slate-800 dark:text-gray-100 mt-8 mb-3">
          {s.text}
        </h3>
      )
    case 'paragraph':
      return (
        <p key={i} className="text-slate-600 dark:text-gray-300 text-lg leading-relaxed mb-5">
          {s.text}
        </p>
      )
    case 'quote':
      return (
        <blockquote key={i} className="my-8 border-l-4 border-emerald-500 pl-6 pr-4 py-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-r-2xl">
          <p className="text-slate-700 dark:text-gray-200 text-lg font-medium leading-relaxed italic mb-3">
            "{s.text}"
          </p>
          {s.author && (
            <cite className="text-emerald-600 dark:text-emerald-400 text-sm font-semibold not-italic">
              — {s.author}
            </cite>
          )}
        </blockquote>
      )
    case 'list':
      return (
        <ul key={i} className="my-6 space-y-3">
          {s.items?.map((item, j) => (
            <li key={j} className="flex items-start gap-3 text-slate-600 dark:text-gray-300 text-base leading-relaxed">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2.5 flex-shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )
    case 'callout':
      return (
        <div key={i} className="my-8 bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/60 rounded-3xl p-7 flex items-start gap-5">
          <span className="text-4xl flex-shrink-0 mt-0.5">{s.icon}</span>
          <p className="text-slate-200 text-base leading-relaxed">{s.text}</p>
        </div>
      )
    case 'divider':
      return <hr key={i} className="my-8 border-slate-200 dark:border-gray-800" />
    default:
      return null
  }
}

export default function ArticlePageClient({
  article,
  related,
}: {
  article: Article
  related: Article[]
}) {
  const handleShare = async () => {
    try {
      await navigator.share({ title: article.title, text: article.excerpt, url: window.location.href })
    } catch {
      await navigator.clipboard.writeText(window.location.href)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative pt-32 pb-16 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className={`absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-br ${article.gradient} opacity-40 rounded-full blur-[100px]`} />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back */}
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
            <Link href="/blog" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition-colors mb-8 group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Kembali ke Blog
            </Link>
          </motion.div>

          {/* Badges */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.05 }}
            className="flex flex-wrap items-center gap-2 mb-5"
          >
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${article.categoryColor}`}>{article.category}</span>
            <span className={`text-xs font-bold px-2.5 py-1.5 rounded-full ${article.tagColor}`}>{article.tag}</span>
          </motion.div>

          {/* Title */}
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-5"
          >
            {article.title}
          </motion.h1>

          {/* Excerpt */}
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.18 }}
            className="text-slate-300 text-lg leading-relaxed mb-7 max-w-2xl"
          >
            {article.excerpt}
          </motion.p>

          {/* Meta row */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }}
            className="flex flex-wrap items-center justify-between gap-4"
          >
            <div className="flex items-center gap-5 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-white font-medium text-xs">{article.author}</div>
                  <div className="text-slate-500 text-xs">{article.authorRole}</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{article.readTime} baca</span>
              </div>
              <span>{article.publishedAt}</span>
            </div>
            <button onClick={handleShare}
              className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-white/20 transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              Bagikan
            </button>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-gray-950 to-transparent" />
      </section>

      {/* ── ARTICLE BODY ── */}
      <article className="flex-1 py-14">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.15 }}
          >
            {article.content.map((section, i) => renderSection(section, i))}
          </motion.div>

          {/* Article footer */}
          <div className="mt-14 pt-8 border-t border-slate-100 dark:border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-slate-900 dark:text-white font-bold text-sm">{article.author}</div>
                <div className="text-slate-500 dark:text-gray-400 text-xs">{article.authorRole} · MisiPintar</div>
              </div>
            </div>
            <button onClick={handleShare}
              className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm font-semibold px-5 py-2.5 rounded-2xl hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-all"
            >
              <Share2 className="w-4 h-4" />
              Bagikan Artikel Ini
            </button>
          </div>
        </div>
      </article>

      {/* ── CTA BANNER ── */}
      <section className="py-14 bg-slate-50 dark:bg-gray-900 border-y border-slate-100 dark:border-gray-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-5xl mb-4">🚀</div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3 leading-snug">
            Siap Menerapkan Ilmu Ini di Keluarga Anda?
          </h2>
          <p className="text-slate-500 dark:text-gray-400 text-base leading-relaxed mb-7 max-w-xl mx-auto">
            MisiPintar membantu Anda mengubah teori parenting keuangan menjadi aksi nyata yang menyenangkan untuk anak.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-sm px-8 py-4 rounded-2xl shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all duration-200"
            >
              Coba Gratis Sekarang
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/blog"
              className="inline-flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-200 font-semibold text-sm px-8 py-4 rounded-2xl hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-200"
            >
              <BookOpen className="w-4 h-4" />
              Baca Artikel Lain
            </Link>
          </div>
        </div>
      </section>

      {/* ── RELATED ARTICLES ── */}
      {related.length > 0 && (
        <section className="py-14 bg-white dark:bg-gray-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-emerald-500" />
              Artikel Terkait
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((a, i) => (
                <motion.div key={a.slug} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.45, delay: i * 0.08 }}
                >
                  <Link href={`/blog/${a.slug}`} className="group block h-full">
                    <div className={`relative h-full flex flex-col bg-white dark:bg-gray-900 rounded-3xl border ${a.border} ${a.hoverBorder} hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden`}>
                      <div className={`h-1 w-full ${a.accent}`} />
                      <div className={`absolute inset-0 bg-gradient-to-br ${a.gradient} opacity-60 pointer-events-none`} />
                      <div className="relative z-10 flex flex-col flex-1 p-6">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${a.categoryColor}`}>{a.category}</span>
                          <span className="text-2xl">{a.emoji}</span>
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug mb-3 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                          {a.title}
                        </h3>
                        <p className="text-slate-500 dark:text-gray-400 text-sm leading-relaxed flex-1 mb-4 line-clamp-2">{a.excerpt}</p>
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-gray-800">
                          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{a.readTime}</span>
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
          </div>
        </section>
      )}

      <Footer />
    </div>
  )
}
