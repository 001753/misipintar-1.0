'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import { MessageCircle, Mail, MapPin, ArrowRight, Clock, ExternalLink, Phone } from 'lucide-react'

const cards = [
  {
    id: 'whatsapp',
    icon: MessageCircle,
    emoji: '💬',
    label: 'WhatsApp',
    badge: 'Respon Tercepat',
    badgeColor: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
    gradient: 'from-emerald-400 to-emerald-600',
    glow: 'hover:shadow-emerald-500/20',
    border: 'hover:border-emerald-200 dark:hover:border-emerald-800',
    ring: 'group-hover:ring-emerald-500/20',
    title: '081460081343',
    subtitle: 'Chat langsung dengan tim support kami',
    availability: 'Senin – Sabtu · 08.00 – 21.00 WIB',
    cta: 'Mulai Chat Sekarang',
    ctaColor: 'from-emerald-500 to-emerald-600 shadow-emerald-500/25 hover:shadow-emerald-500/40',
    href: 'https://wa.me/6281460081343?text=Halo%20Admin%20MisiPintar,%20saya%20butuh%20bantuan',
    external: true,
  },
  {
    id: 'email',
    icon: Mail,
    emoji: '📧',
    label: 'Email',
    badge: 'Pertanyaan Detail',
    badgeColor: 'bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800',
    gradient: 'from-indigo-400 to-indigo-600',
    glow: 'hover:shadow-indigo-500/20',
    border: 'hover:border-indigo-200 dark:hover:border-indigo-800',
    ring: 'group-hover:ring-indigo-500/20',
    title: 'admin@jobenapp.cloud',
    subtitle: 'Kirim pertanyaan, laporan, atau kerja sama bisnis',
    availability: 'Dibalas dalam 1×24 jam kerja',
    cta: 'Kirim Email',
    ctaColor: 'from-indigo-500 to-indigo-600 shadow-indigo-500/25 hover:shadow-indigo-500/40',
    href: 'mailto:admin@jobenapp.cloud',
    external: false,
  },
  {
    id: 'address',
    icon: MapPin,
    emoji: '📍',
    label: 'Kantor',
    badge: 'Kunjungan Terjadwal',
    badgeColor: 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
    gradient: 'from-amber-400 to-orange-500',
    glow: 'hover:shadow-amber-500/20',
    border: 'hover:border-amber-200 dark:hover:border-amber-800',
    ring: 'group-hover:ring-amber-500/20',
    title: 'Sentra Town Kawasan Terpadu',
    subtitle: 'The Park Mall Solo Baru',
    availability: 'JobenApps (Joben Enterprise)',
    cta: 'Lihat di Maps',
    ctaColor: 'from-amber-500 to-orange-500 shadow-amber-500/25 hover:shadow-amber-500/40',
    href: 'https://maps.google.com/?q=The+Park+Mall+Solo+Baru',
    external: true,
  },
]

const faqs = [
  { q: 'Berapa lama waktu respons tim support?', a: 'Melalui WhatsApp, kami merespons rata-rata dalam 15 menit pada jam kerja. Email dibalas dalam 1×24 jam kerja.' },
  { q: 'Apakah ada biaya untuk menghubungi support?', a: 'Tidak ada biaya apapun. Layanan dukungan pelanggan MisiPintar sepenuhnya gratis untuk semua pengguna, termasuk paket Starter.' },
  { q: 'Bagaimana jika saya mengalami masalah teknis di malam hari?', a: 'Anda dapat mengirimkan pesan WhatsApp dan tim kami akan segera menindaklanjuti pada hari kerja berikutnya.' },
  { q: 'Untuk kerjasama bisnis atau institusi, ke mana saya menghubungi?', a: 'Silakan kirim email ke admin@jobenapp.cloud dengan subjek "Kerjasama Bisnis" atau "Kerjasama Institusi" dan tim kami akan menghubungi Anda.' },
]

function Card({ card, index }: { card: typeof cards[0]; index: number }) {
  const Icon = card.icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      className="group"
    >
      <div className={`relative h-full bg-white dark:bg-gray-900 rounded-3xl border border-slate-100 dark:border-gray-800 ${card.border} transition-all duration-300 ${card.glow} hover:shadow-2xl hover:-translate-y-1.5 overflow-hidden`}>
        <div className={`h-1 w-full bg-gradient-to-r ${card.gradient}`} />
        <div className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-xl ring-4 ring-transparent ${card.ring} transition-all duration-300`}>
              <Icon className="w-8 h-8 text-white" strokeWidth={1.8} />
            </div>
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${card.badgeColor}`}>
              {card.badge}
            </span>
          </div>
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-gray-500 mb-2">
            {card.label}
          </div>
          <h3 className="text-slate-900 dark:text-white font-bold text-xl leading-snug mb-1 break-all sm:break-normal">
            {card.title}
          </h3>
          <p className="text-slate-500 dark:text-gray-400 text-sm leading-relaxed mb-4">
            {card.subtitle}
          </p>
          <div className="flex items-center gap-2 mb-8">
            <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="text-slate-500 dark:text-gray-500 text-xs">{card.availability}</span>
          </div>
          <a
            href={card.href}
            target={card.external ? '_blank' : undefined}
            rel={card.external ? 'noopener noreferrer' : undefined}
            className={`group/btn w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r ${card.ctaColor} text-white font-semibold text-sm px-6 py-3.5 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200`}
          >
            {card.cta}
            {card.external
              ? <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
              : <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            }
          </a>
        </div>
        <div className={`absolute -bottom-10 -right-10 w-40 h-40 bg-gradient-to-br ${card.gradient} opacity-5 rounded-full blur-2xl pointer-events-none`} />
      </div>
    </motion.div>
  )
}

export default function HubungiKamiClient() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
      <Navbar />

      <section className="relative pt-32 pb-24 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[300px] bg-emerald-500/8 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-amber-500/8 rounded-full blur-[80px]" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-2 mb-8"
          >
            <Phone className="w-4 h-4 text-indigo-400" />
            <span className="text-indigo-400 text-sm font-semibold">Hubungi Kami</span>
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-emerald-400 text-xs font-medium">Online</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
          >
            Kami Siap{' '}
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(90deg, #818cf8, #6366f1)' }}
            >
              Membantu
            </span>{' '}
            Anda
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-slate-300 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto mb-10"
          >
            Ada pertanyaan, laporan, atau ingin berkolaborasi? Tim MisiPintar selalu siap memberikan respons terbaik melalui saluran komunikasi pilihan Anda.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="flex flex-wrap justify-center gap-6 text-sm"
          >
            {[
              { icon: '⚡', text: 'Respons WA < 15 Menit' },
              { icon: '📧', text: 'Email 1×24 Jam Kerja' },
              { icon: '⭐', text: '4.9 Rating Kepuasan' },
            ].map((s) => (
              <div key={s.text} className="flex items-center gap-2 text-slate-400">
                <span>{s.icon}</span>
                <span>{s.text}</span>
              </div>
            ))}
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white dark:from-gray-950 to-transparent" />
      </section>

      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {cards.map((card, i) => (
              <Card key={card.id} card={card} index={i} />
            ))}
          </div>
        </div>
      </section>

      <div className="border-t border-slate-100 dark:border-gray-800 bg-slate-50 dark:bg-gray-900 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <span className="text-white font-black text-sm">JE</span>
              </div>
              <div>
                <div className="font-bold text-slate-900 dark:text-white text-sm">JobenApps · Joben Enterprise</div>
                <div className="text-slate-500 dark:text-gray-400 text-xs">Sentra Town, The Park Mall Solo Baru</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 justify-center sm:justify-end text-xs text-slate-500 dark:text-gray-500">
              <Link href="/tentang-kami" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Tentang Kami</Link>
              <span>·</span>
              <Link href="/kebijakan-privasi" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Kebijakan Privasi</Link>
              <span>·</span>
              <Link href="/syarat-ketentuan" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Syarat & Ketentuan</Link>
            </div>
          </div>
        </div>
      </div>

      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-full px-4 py-1.5 mb-4">
              <span className="text-slate-600 dark:text-gray-300 text-sm font-semibold">❓ Pertanyaan Umum</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-3">
              Mungkin Pertanyaan Anda{' '}
              <span className="text-indigo-500">Sudah Terjawab</span>
            </h2>
            <p className="text-slate-500 dark:text-gray-400 text-base">
              Temukan jawaban cepat sebelum menghubungi tim kami.
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div
                key={faq.q}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="bg-slate-50 dark:bg-gray-900 border border-slate-100 dark:border-gray-800 rounded-2xl p-6 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  <div className="w-7 h-7 rounded-xl bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold text-xs">Q</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm mb-2">{faq.q}</p>
                    <p className="text-slate-500 dark:text-gray-400 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-b from-slate-950 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px]" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-5xl mb-6">🤝</div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
            Masih Butuh Bantuan?
          </h2>
          <p className="text-slate-400 text-base leading-relaxed mb-8">
            Tim kami yang ramah dan profesional siap menjawab semua pertanyaan Anda. Jangan ragu untuk menghubungi kami melalui saluran mana pun.
          </p>
          <a
            href="https://wa.me/6281460081343?text=Halo%20Admin%20MisiPintar,%20saya%20butuh%20bantuan"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-400 to-emerald-600 text-white font-bold text-base px-10 py-4 rounded-2xl shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-1 transition-all duration-200"
          >
            <MessageCircle className="w-5 h-5" />
            Chat WhatsApp Sekarang
            <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  )
}
