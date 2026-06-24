'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import {
  ScrollText, ChevronRight, UserCheck, ShieldCheck, CreditCard,
  AlertTriangle, RefreshCw, Globe, FileText, Ban, CheckCircle
} from 'lucide-react'

const sections = [
  {
    id: '1',
    icon: UserCheck,
    color: 'from-emerald-400 to-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    border: 'border-emerald-100 dark:border-emerald-900/30',
    title: 'Penerimaan Syarat & Ketentuan',
    paragraphs: [
      'Dengan mendaftarkan akun, mengakses, atau menggunakan platform MisiPintar (mp.jobenapp.cloud), Anda ("Orang Tua" atau "Pengguna") menyatakan telah membaca, memahami, dan menyetujui seluruh Syarat dan Ketentuan yang tercantum dalam dokumen ini.',
      'Jika Anda tidak menyetujui salah satu ketentuan di bawah ini, harap berhenti menggunakan layanan kami. Penggunaan layanan secara berkelanjutan setelah perubahan dipublikasikan dianggap sebagai penerimaan atas perubahan tersebut.',
    ],
  },
  {
    id: '2',
    icon: Globe,
    color: 'from-blue-400 to-indigo-500',
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    border: 'border-blue-100 dark:border-blue-900/30',
    title: 'Deskripsi Layanan',
    paragraphs: [
      'MisiPintar adalah platform edutech-fintech berbasis gamifikasi yang memungkinkan orang tua menetapkan "misi" harian untuk anak-anak mereka berupa tugas rumah tangga, tugas akademik, atau aktivitas positif lainnya.',
      'Anak-anak mendapatkan saldo saku virtual sebagai imbalan atas penyelesaian misi yang diverifikasi oleh orang tua. Saldo virtual bersifat non-tunai, tidak dapat ditarik secara fisik, dan hanya berlaku dalam ekosistem MisiPintar.',
    ],
    highlights: [
      { icon: '🎯', text: 'Misi Pintar — gamifikasi tugas harian anak' },
      { icon: '💰', text: 'Saldo Saku Virtual — reward non-tunai terverifikasi' },
      { icon: '🐷', text: 'Kantong Menabung — simulasi tabungan + bunga' },
      { icon: '📊', text: 'Dasbor Orang Tua — kontrol & analitik penuh' },
    ],
  },
  {
    id: '3',
    icon: UserCheck,
    color: 'from-teal-400 to-cyan-500',
    bg: 'bg-teal-50 dark:bg-teal-950/20',
    border: 'border-teal-100 dark:border-teal-900/30',
    title: 'Persyaratan Pengguna & Akun',
    items: [
      {
        label: 'Usia Minimum',
        text: 'Akun orang tua hanya dapat dibuat oleh individu berusia minimal 17 (tujuh belas) tahun. Akun anak dikelola sepenuhnya oleh orang tua yang bertanggung jawab.',
      },
      {
        label: 'Satu Akun Per Keluarga',
        text: 'Setiap keluarga hanya diizinkan memiliki satu FamilySpace (ruang keluarga). Pembuatan akun duplikat atau penggunaan identitas palsu merupakan pelanggaran ketentuan ini.',
      },
      {
        label: 'Keamanan Akun',
        text: 'Anda bertanggung jawab penuh atas keamanan kata sandi dan semua aktivitas yang terjadi di bawah akun Anda. Segera hubungi kami jika terjadi akses tidak sah.',
      },
      {
        label: 'Informasi Akurat',
        text: 'Anda wajib menyediakan informasi yang akurat dan terkini saat pendaftaran. Informasi yang tidak benar dapat mengakibatkan penonaktifan akun tanpa pemberitahuan.',
      },
    ],
  },
  {
    id: '4',
    icon: CreditCard,
    color: 'from-amber-400 to-orange-500',
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-amber-100 dark:border-amber-900/30',
    title: 'Paket Langganan & Pembayaran',
    paragraphs: [
      'MisiPintar menyediakan paket Starter (gratis selamanya) dengan fitur dasar, serta paket berlangganan berbayar (Pro, Educator, School) dengan fitur lebih lengkap.',
    ],
    paymentItems: [
      {
        label: 'Siklus Pembayaran',
        text: 'Pembayaran bersifat bulanan atau tahunan, diproses melalui Midtrans / InterActive QRIS. Langganan diperbarui secara otomatis kecuali dibatalkan sebelum tanggal jatuh tempo.',
      },
      {
        label: 'Kebijakan Pengembalian Dana',
        text: 'Kami menawarkan jaminan uang kembali 7 (tujuh) hari sejak tanggal aktivasi paket pertama. Pengembalian dana setelah 7 hari tidak dapat diproses kecuali terjadi gangguan teknis signifikan dari pihak kami.',
      },
      {
        label: 'Perubahan Harga',
        text: 'MisiPintar berhak mengubah harga paket dengan pemberitahuan minimal 30 (tiga puluh) hari sebelumnya melalui email terdaftar. Pengguna yang sudah berlangganan tidak terpengaruh hingga siklus perpanjangan berikutnya.',
      },
      {
        label: 'Saldo Virtual Bukan Uang Nyata',
        text: 'Seluruh saldo saku virtual, tabungan simulasi, dan bunga virtual di dalam aplikasi tidak memiliki nilai moneter nyata dan tidak dapat ditukarkan, ditransfer, atau dicairkan ke luar platform.',
      },
    ],
  },
  {
    id: '5',
    icon: Ban,
    color: 'from-red-400 to-rose-500',
    bg: 'bg-red-50 dark:bg-red-950/20',
    border: 'border-red-100 dark:border-red-900/30',
    title: 'Larangan Penggunaan',
    intro: 'Pengguna dilarang keras menggunakan platform MisiPintar untuk:',
    prohibitions: [
      'Menyalahgunakan, meretas, atau mencoba mengeksploitasi celah keamanan sistem.',
      'Membuat konten misi yang mengandung unsur SARA, kekerasan, pornografi, atau materi berbahaya bagi anak.',
      'Menciptakan akun palsu atau menyamar sebagai individu lain.',
      'Menggunakan bot, scraper, atau alat otomatis untuk mengakses atau mengumpulkan data platform.',
      'Menjual kembali atau mendistribusikan akses platform tanpa izin tertulis dari JobenApps.',
      'Melakukan aktivitas yang melanggar hukum yang berlaku di Republik Indonesia.',
    ],
  },
  {
    id: '6',
    icon: ShieldCheck,
    color: 'from-violet-400 to-purple-600',
    bg: 'bg-violet-50 dark:bg-violet-950/20',
    border: 'border-violet-100 dark:border-violet-900/30',
    title: 'Kekayaan Intelektual',
    paragraphs: [
      'Seluruh konten, desain, logo, nama merek "MisiPintar", "JobenApps", kode sumber, dan aset digital dalam platform ini adalah milik eksklusif Joben Enterprise dan dilindungi oleh hukum kekayaan intelektual Republik Indonesia.',
      'Anda diberikan lisensi terbatas, non-eksklusif, dan tidak dapat dialihkan untuk menggunakan platform semata-mata untuk keperluan pribadi dan keluarga sesuai Syarat dan Ketentuan ini. Segala penggunaan komersial tanpa izin tertulis adalah pelanggaran hukum.',
    ],
  },
  {
    id: '7',
    icon: AlertTriangle,
    color: 'from-orange-400 to-amber-500',
    bg: 'bg-orange-50 dark:bg-orange-950/20',
    border: 'border-orange-100 dark:border-orange-900/30',
    title: 'Batasan Tanggung Jawab',
    paragraphs: [
      'MisiPintar menyediakan layanan "sebagaimana adanya" (as-is) dengan upaya terbaik untuk memastikan ketersediaan dan keandalan. Namun, kami tidak menjamin bahwa layanan akan selalu bebas gangguan, error, atau kehilangan data akibat kejadian di luar kendali kami (force majeure).',
      'Dalam batas yang diizinkan hukum, Joben Enterprise tidak bertanggung jawab atas kerugian tidak langsung, insidental, atau kerugian yang timbul dari penggunaan atau ketidakmampuan menggunakan layanan, termasuk namun tidak terbatas pada kehilangan data atau keuntungan.',
    ],
  },
  {
    id: '8',
    icon: RefreshCw,
    color: 'from-slate-400 to-slate-600',
    bg: 'bg-slate-50 dark:bg-slate-900/40',
    border: 'border-slate-100 dark:border-slate-800',
    title: 'Perubahan Syarat & Ketentuan',
    paragraphs: [
      'Kami berhak memodifikasi Syarat dan Ketentuan ini kapan saja. Perubahan material akan dikomunikasikan melalui email terdaftar atau notifikasi dalam aplikasi minimal 14 (empat belas) hari sebelum berlaku.',
      'Dokumen ini diatur dan ditafsirkan berdasarkan hukum Republik Indonesia. Setiap sengketa yang timbul dari atau terkait dengan Syarat dan Ketentuan ini akan diselesaikan melalui musyawarah, atau jika gagal, melalui Pengadilan Negeri yang berwenang di Jakarta.',
    ],
  },
]

export default function SyaratKetentuanPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative pt-32 pb-20 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-amber-500/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[300px] bg-emerald-500/8 rounded-full blur-[80px]" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-2 mb-8"
          >
            <ScrollText className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 text-sm font-semibold">Legal · Ketentuan</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
          >
            Syarat &{' '}
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg, #fbbf24, #f59e0b)' }}>
              Ketentuan
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-slate-300 text-lg leading-relaxed mb-4 max-w-2xl mx-auto"
          >
            Harap baca dokumen ini dengan cermat sebelum menggunakan layanan MisiPintar. Dokumen ini mengatur hak dan kewajiban antara Anda dan Joben Enterprise.
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="text-slate-500 text-sm"
          >
            Berlaku efektif: <span className="text-slate-400 font-medium">24 Juni 2026</span>
            {' · '}
            Berlaku untuk yurisdiksi: <span className="text-slate-400 font-medium">Republik Indonesia</span>
          </motion.p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white dark:from-gray-950 to-transparent" />
      </section>

      {/* ── AGREEMENT NOTICE ── */}
      <section className="py-8 bg-white dark:bg-gray-950 border-b border-slate-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-5">
            <CheckCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-amber-800 dark:text-amber-300 text-sm leading-relaxed">
              <strong>Dengan menggunakan MisiPintar</strong>, Anda menyatakan telah membaca, memahami, dan menyetujui seluruh syarat dan ketentuan ini. Dokumen ini merupakan perjanjian yang mengikat secara hukum antara Anda dan Joben Enterprise.
            </p>
          </div>
        </div>
      </section>

      {/* ── TABLE OF CONTENTS ── */}
      <section className="py-10 bg-white dark:bg-gray-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-50 dark:bg-gray-900 border border-slate-100 dark:border-gray-800 rounded-3xl p-6 sm:p-8">
            <h2 className="text-slate-900 dark:text-white font-bold text-lg mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-500" />
              Daftar Isi
            </h2>
            <div className="grid sm:grid-cols-2 gap-2">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#sc-${s.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors group"
                >
                  <span className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400 text-xs font-bold flex-shrink-0">
                    {s.id}
                  </span>
                  <span className="text-slate-600 dark:text-gray-400 text-sm group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                    {s.title}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTIONS ── */}
      <section className="py-6 pb-20 bg-white dark:bg-gray-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

          {/* S1 - Penerimaan */}
          <div id="sc-1" className={`rounded-3xl border p-8 sm:p-10 ${sections[0].bg} ${sections[0].border}`}>
            <SectionHeader num="1" icon={sections[0].icon} color={sections[0].color} title={sections[0].title} />
            <div className="mt-5 space-y-4">
              {(sections[0] as any).paragraphs.map((p: string, i: number) => (
                <p key={i} className="text-slate-600 dark:text-gray-400 text-sm leading-relaxed">{p}</p>
              ))}
            </div>
          </div>

          {/* S2 - Deskripsi Layanan */}
          <div id="sc-2" className={`rounded-3xl border p-8 sm:p-10 ${sections[1].bg} ${sections[1].border}`}>
            <SectionHeader num="2" icon={sections[1].icon} color={sections[1].color} title={sections[1].title} />
            <div className="mt-5 space-y-4 mb-6">
              {(sections[1] as any).paragraphs.map((p: string, i: number) => (
                <p key={i} className="text-slate-600 dark:text-gray-400 text-sm leading-relaxed">{p}</p>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(sections[1] as any).highlights.map((h: any) => (
                <div key={h.text} className="bg-white dark:bg-gray-950 rounded-2xl border border-blue-100 dark:border-blue-900/30 p-4 text-center">
                  <div className="text-2xl mb-2">{h.icon}</div>
                  <div className="text-slate-600 dark:text-gray-400 text-xs leading-tight">{h.text}</div>
                </div>
              ))}
            </div>
          </div>

          {/* S3 - Persyaratan Pengguna */}
          <div id="sc-3" className={`rounded-3xl border p-8 sm:p-10 ${sections[2].bg} ${sections[2].border}`}>
            <SectionHeader num="3" icon={sections[2].icon} color={sections[2].color} title={sections[2].title} />
            <div className="mt-6 space-y-4">
              {(sections[2] as any).items.map((item: any) => (
                <LabelItem key={item.label} label={item.label} text={item.text} accent="teal" />
              ))}
            </div>
          </div>

          {/* S4 - Pembayaran */}
          <div id="sc-4" className={`rounded-3xl border p-8 sm:p-10 ${sections[3].bg} ${sections[3].border}`}>
            <SectionHeader num="4" icon={sections[3].icon} color={sections[3].color} title={sections[3].title} />
            <div className="mt-5 mb-6 space-y-3">
              {(sections[3] as any).paragraphs.map((p: string, i: number) => (
                <p key={i} className="text-slate-600 dark:text-gray-400 text-sm leading-relaxed">{p}</p>
              ))}
            </div>
            <div className="space-y-4">
              {(sections[3] as any).paymentItems.map((item: any) => (
                <LabelItem key={item.label} label={item.label} text={item.text} accent="amber" />
              ))}
            </div>
          </div>

          {/* S5 - Larangan */}
          <div id="sc-5" className={`rounded-3xl border p-8 sm:p-10 ${sections[4].bg} ${sections[4].border}`}>
            <SectionHeader num="5" icon={sections[4].icon} color={sections[4].color} title={sections[4].title} />
            <p className="text-slate-600 dark:text-gray-400 text-sm leading-relaxed mt-4 mb-5">{(sections[4] as any).intro}</p>
            <ul className="space-y-3">
              {(sections[4] as any).prohibitions.map((item: string) => (
                <li key={item} className="flex items-start gap-3 bg-white dark:bg-gray-950 rounded-2xl border border-red-100 dark:border-red-900/30 px-5 py-3.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                  <span className="text-slate-700 dark:text-gray-300 text-sm leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* S6 - Kekayaan Intelektual */}
          <div id="sc-6" className={`rounded-3xl border p-8 sm:p-10 ${sections[5].bg} ${sections[5].border}`}>
            <SectionHeader num="6" icon={sections[5].icon} color={sections[5].color} title={sections[5].title} />
            <div className="mt-5 space-y-4">
              {(sections[5] as any).paragraphs.map((p: string, i: number) => (
                <p key={i} className="text-slate-600 dark:text-gray-400 text-sm leading-relaxed">{p}</p>
              ))}
            </div>
          </div>

          {/* S7 - Batasan Tanggung Jawab */}
          <div id="sc-7" className={`rounded-3xl border p-8 sm:p-10 ${sections[6].bg} ${sections[6].border}`}>
            <SectionHeader num="7" icon={sections[6].icon} color={sections[6].color} title={sections[6].title} />
            <div className="mt-5 space-y-4">
              {(sections[6] as any).paragraphs.map((p: string, i: number) => (
                <p key={i} className="text-slate-600 dark:text-gray-400 text-sm leading-relaxed">{p}</p>
              ))}
            </div>
          </div>

          {/* S8 - Perubahan */}
          <div id="sc-8" className={`rounded-3xl border p-8 sm:p-10 ${sections[7].bg} ${sections[7].border}`}>
            <SectionHeader num="8" icon={sections[7].icon} color={sections[7].color} title={sections[7].title} />
            <div className="mt-5 space-y-4">
              {(sections[7] as any).paragraphs.map((p: string, i: number) => (
                <p key={i} className="text-slate-600 dark:text-gray-400 text-sm leading-relaxed">{p}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT / NAVIGATION CTA ── */}
      <section className="py-16 bg-slate-50 dark:bg-gray-900 border-t border-slate-100 dark:border-gray-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-4xl mb-4">⚖️</div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Pertanyaan Hukum atau Kepatuhan?</h2>
          <p className="text-slate-600 dark:text-gray-400 text-sm leading-relaxed mb-6 max-w-xl mx-auto">
            Tim legal kami siap membantu. Untuk pertanyaan terkait Syarat & Ketentuan, hak pengguna, atau kepatuhan hukum, hubungi kami melalui email resmi di{' '}
            <a href="mailto:legal@jobenapp.cloud" className="text-amber-600 dark:text-amber-400 font-semibold hover:underline">
              legal@jobenapp.cloud
            </a>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/kebijakan-privasi"
              className="inline-flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-200 font-semibold text-sm px-7 py-3.5 rounded-2xl hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-md transition-all duration-200"
            >
              <FileText className="w-4 h-4" />
              Kebijakan Privasi
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold text-sm px-7 py-3.5 rounded-2xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all duration-200"
            >
              Mulai Gratis Sekarang
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

function SectionHeader({ num, icon: Icon, color, title }: { num: string; icon: any; color: string; title: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg flex-shrink-0`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <div className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">Pasal {num}</div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{title}</h2>
      </div>
    </div>
  )
}

function LabelItem({ label, text, accent = 'blue' }: { label: string; text: string; accent?: string }) {
  const accentMap: Record<string, string> = {
    blue: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300',
    teal: 'bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300',
    amber: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
    violet: 'bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300',
  }
  return (
    <div className="bg-white dark:bg-gray-950 rounded-2xl border border-slate-100 dark:border-gray-800 p-5">
      <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-3 ${accentMap[accent] ?? accentMap.blue}`}>{label}</span>
      <p className="text-slate-600 dark:text-gray-400 text-sm leading-relaxed">{text}</p>
    </div>
  )
}
