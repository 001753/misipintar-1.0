'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import { Shield, ChevronRight, Lock, Eye, Users, Trash2, Bell, CreditCard, Bot, FileText } from 'lucide-react'

const sections = [
  {
    id: '1',
    icon: Eye,
    color: 'from-blue-400 to-indigo-500',
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    border: 'border-blue-100 dark:border-blue-900/30',
    title: 'Informasi yang Kami Kumpulkan',
    content: [
      {
        subtitle: 'A. Informasi Akun Orang Tua (Pengendali Utama)',
        items: [
          {
            label: 'Data Registrasi',
            text: 'Nama lengkap, nomor WhatsApp aktif (untuk integrasi notifikasi Fonnte), alamat email, dan kata sandi yang dienkripsi secara aman.',
          },
          {
            label: 'Data Transaksi',
            text: 'Informasi pembayaran langganan paket Pro melalui gerbang pembayaran resmi (Midtrans / InterActive QRIS). Kami tidak pernah menyimpan data kartu kredit atau kredensial bank Anda di server kami.',
          },
        ],
      },
      {
        subtitle: 'B. Informasi Akun Anak (Di bawah Kendali Orang Tua)',
        items: [
          {
            label: 'Profil Virtual Anak',
            text: 'Nama panggilan, username unik untuk login tanpa email, dan pilihan avatar emoji.',
          },
          {
            label: 'Aktivitas Misi',
            text: 'Data mengenai daftar tugas (Misi Pintar), bukti penyelesaian tugas, catatan tabungan virtual, serta bunga simulasi yang didapatkan anak di dalam aplikasi.',
          },
        ],
      },
    ],
  },
  {
    id: '2',
    icon: Bell,
    color: 'from-emerald-400 to-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    border: 'border-emerald-100 dark:border-emerald-900/30',
    title: 'Penggunaan Informasi Anda',
    paragraph: 'MisiPintar menggunakan data yang dikumpulkan semata-mata untuk kepentingan operasional dan edukasi keluarga Anda, antara lain:',
    bullets: [
      'Menyediakan, memelihara, dan mengamankan dasbor FamilySpace Anda.',
      'Mengirimkan notifikasi perkembangan tugas dan pencairan saldo anak langsung ke WhatsApp Orang Tua melalui sistem Fonnte.',
      'Memproses validasi pembayaran upgrade paket premium secara otomatis menggunakan Midtrans / QRIS.',
      'Mengoptimalkan respons asisten pintar berbasis kecerdasan buatan (Gemini API) guna memberikan rekomendasi misi pintar yang relevan bagi anak (tanpa mengekspos identitas asli anak).',
    ],
  },
  {
    id: '3',
    icon: Lock,
    color: 'from-violet-400 to-purple-600',
    bg: 'bg-violet-50 dark:bg-violet-950/20',
    border: 'border-violet-100 dark:border-violet-900/30',
    title: 'Keamanan Data Tingkat Tinggi',
    paragraph: 'Kami berkomitmen menjaga privasi keluarga Anda dengan standar keamanan siber terbaik:',
    items: [
      {
        label: 'Enkripsi Total',
        text: 'Seluruh kata sandi dienkripsi menggunakan algoritma hashing satu arah, dan data sensitif dilindungi menggunakan kunci enkripsi bawaan industri (ENCRYPTION_KEY).',
      },
      {
        label: 'Isolasi Multi-Tenant',
        text: 'Data antar-keluarga diisolasi secara ketat di dalam database PostgreSQL kami. Keluarga lain tidak akan pernah bisa melihat kode akses ruang (Space Code), profil anak, atau aktivitas misi keluarga Anda.',
      },
      {
        label: 'Perlindungan Anak',
        text: 'Akun anak tidak memiliki akses ke dunia luar, tidak memiliki fitur chat publik, dan tidak dapat dihubungi oleh pengguna asing dari luar lingkaran keluarga Anda.',
      },
    ],
  },
  {
    id: '4',
    icon: Users,
    color: 'from-amber-400 to-orange-500',
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-amber-100 dark:border-amber-900/30',
    title: 'Berbagi Informasi dengan Pihak Ketiga',
    paragraph: 'Kami tidak akan pernah menjual, menyewakan, atau menukar data pribadi keluarga Anda kepada pihak ketiga untuk kepentingan iklan atau pemasaran. Kami hanya membagikan data terenkripsi secara terbatas kepada mitra layanan yang terintegrasi langsung:',
    partners: [
      { name: 'Fonnte', desc: 'Untuk mengirimkan gerbang notifikasi pesan teks WhatsApp.', icon: '💬' },
      { name: 'Midtrans / InterActive', desc: 'Untuk memproses keamanan transaksi pembayaran QRIS dan Virtual Account.', icon: '💳' },
      { name: 'Google Gemini API', desc: 'Untuk memproses analisis teks rekomendasi tugas cerdas tanpa menyertakan informasi identitas asli (anonimisasi data).', icon: '🤖' },
    ],
  },
  {
    id: '5',
    icon: FileText,
    color: 'from-teal-400 to-cyan-500',
    bg: 'bg-teal-50 dark:bg-teal-950/20',
    border: 'border-teal-100 dark:border-teal-900/30',
    title: 'Hak Anda atas Data Pribadi',
    paragraph: 'Sebagai orang tua yang memegang kendali penuh atas FamilySpace, Anda memiliki hak mutlak untuk:',
    rights: [
      {
        icon: '✏️',
        label: 'Akses & Koreksi',
        text: 'Mengubah, memperbarui, atau memperbaiki informasi profil keluarga dan akun anak kapan saja melalui dasbor pengaturan.',
      },
      {
        icon: '🗑️',
        label: 'Penghapusan Akun',
        text: 'Menghapus akun keluarga Anda secara permanen. Penghapusan akun akan membersihkan seluruh data anak, riwayat misi, dan catatan keuangan virtual dari database produksi kami seketika.',
      },
    ],
  },
]

export default function KebijanPrivasiPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative pt-32 pb-20 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-violet-500/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-emerald-500/8 rounded-full blur-[80px]" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-2 mb-8"
          >
            <Shield className="w-4 h-4 text-violet-400" />
            <span className="text-violet-400 text-sm font-semibold">Legal · Privasi</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
          >
            Kebijakan{' '}
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg, #a78bfa, #7c3aed)' }}>
              Privasi
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-slate-300 text-lg leading-relaxed mb-4 max-w-2xl mx-auto"
          >
            Kami sangat menghargai kepercayaan yang Anda berikan selaku orang tua untuk mengasuh dan mendidik kedisiplinan serta literasi keuangan anak bersama kami.
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="text-slate-500 text-sm"
          >
            Terakhir Diperbarui: <span className="text-slate-400 font-medium">24 Juni 2026</span>
          </motion.p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white dark:from-gray-950 to-transparent" />
      </section>

      {/* ── TRUST BADGES ── */}
      <section className="py-10 bg-white dark:bg-gray-950 border-b border-slate-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: '🔒', label: 'Enkripsi End-to-End' },
              { icon: '🚫', label: 'Tidak Dijual ke Iklan' },
              { icon: '👶', label: 'Perlindungan Anak Ketat' },
              { icon: '🇮🇩', label: 'Hukum Perlindungan Data RI' },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-3 bg-slate-50 dark:bg-gray-900 border border-slate-100 dark:border-gray-800 rounded-2xl px-4 py-3">
                <span className="text-2xl">{b.icon}</span>
                <span className="text-slate-700 dark:text-gray-300 text-xs font-semibold leading-tight">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TABLE OF CONTENTS ── */}
      <section className="py-10 bg-white dark:bg-gray-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-50 dark:bg-gray-900 border border-slate-100 dark:border-gray-800 rounded-3xl p-6 sm:p-8">
            <h2 className="text-slate-900 dark:text-white font-bold text-lg mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-violet-500" />
              Daftar Isi
            </h2>
            <div className="grid sm:grid-cols-2 gap-2">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#section-${s.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors group"
                >
                  <span className="w-6 h-6 rounded-lg bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center text-violet-600 dark:text-violet-400 text-xs font-bold flex-shrink-0">
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
          {/* Section 1 */}
          <div id="section-1" className={`rounded-3xl border p-8 sm:p-10 ${sections[0].bg} ${sections[0].border}`}>
            <SectionHeader num="1" icon={sections[0].icon} color={sections[0].color} title={sections[0].title} />
            <div className="space-y-8 mt-6">
              {(sections[0] as any).content.map((block: any) => (
                <div key={block.subtitle}>
                  <h3 className="font-bold text-slate-800 dark:text-white text-base mb-4">{block.subtitle}</h3>
                  <div className="space-y-4">
                    {block.items.map((item: any) => (
                      <LabelItem key={item.label} label={item.label} text={item.text} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2 */}
          <div id="section-2" className={`rounded-3xl border p-8 sm:p-10 ${sections[1].bg} ${sections[1].border}`}>
            <SectionHeader num="2" icon={sections[1].icon} color={sections[1].color} title={sections[1].title} />
            <p className="text-slate-600 dark:text-gray-400 mt-4 mb-5 text-sm leading-relaxed">{(sections[1] as any).paragraph}</p>
            <ul className="space-y-3">
              {(sections[1] as any).bullets.map((b: string) => (
                <li key={b} className="flex items-start gap-3 text-sm text-slate-700 dark:text-gray-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          </div>

          {/* Section 3 */}
          <div id="section-3" className={`rounded-3xl border p-8 sm:p-10 ${sections[2].bg} ${sections[2].border}`}>
            <SectionHeader num="3" icon={sections[2].icon} color={sections[2].color} title={sections[2].title} />
            <p className="text-slate-600 dark:text-gray-400 mt-4 mb-6 text-sm leading-relaxed">{(sections[2] as any).paragraph}</p>
            <div className="space-y-4">
              {(sections[2] as any).items.map((item: any) => (
                <LabelItem key={item.label} label={item.label} text={item.text} accent="violet" />
              ))}
            </div>
          </div>

          {/* Section 4 */}
          <div id="section-4" className={`rounded-3xl border p-8 sm:p-10 ${sections[3].bg} ${sections[3].border}`}>
            <SectionHeader num="4" icon={sections[3].icon} color={sections[3].color} title={sections[3].title} />
            <p className="text-slate-600 dark:text-gray-400 mt-4 mb-6 text-sm leading-relaxed">{(sections[3] as any).paragraph}</p>
            <div className="grid sm:grid-cols-3 gap-4">
              {(sections[3] as any).partners.map((p: any) => (
                <div key={p.name} className="bg-white dark:bg-gray-950 rounded-2xl border border-amber-100 dark:border-amber-900/30 p-5">
                  <div className="text-3xl mb-3">{p.icon}</div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm mb-2">{p.name}</div>
                  <div className="text-slate-500 dark:text-gray-400 text-xs leading-relaxed">{p.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5 */}
          <div id="section-5" className={`rounded-3xl border p-8 sm:p-10 ${sections[4].bg} ${sections[4].border}`}>
            <SectionHeader num="5" icon={sections[4].icon} color={sections[4].color} title={sections[4].title} />
            <p className="text-slate-600 dark:text-gray-400 mt-4 mb-6 text-sm leading-relaxed">{(sections[4] as any).paragraph}</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {(sections[4] as any).rights.map((r: any) => (
                <div key={r.label} className="bg-white dark:bg-gray-950 rounded-2xl border border-teal-100 dark:border-teal-900/30 p-6">
                  <div className="text-3xl mb-3">{r.icon}</div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm mb-2">{r.label}</div>
                  <div className="text-slate-500 dark:text-gray-400 text-xs leading-relaxed">{r.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT CTA ── */}
      <section className="py-16 bg-slate-50 dark:bg-gray-900 border-t border-slate-100 dark:border-gray-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-4xl mb-4">📩</div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Ada Pertanyaan tentang Privasi Anda?</h2>
          <p className="text-slate-600 dark:text-gray-400 text-sm leading-relaxed mb-6">
            Tim kami siap membantu. Kirimkan pertanyaan Anda dan kami akan merespons dalam 1×24 jam kerja.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/syarat-ketentuan"
              className="inline-flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-200 font-semibold text-sm px-7 py-3.5 rounded-2xl hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md transition-all duration-200"
            >
              <FileText className="w-4 h-4" />
              Syarat & Ketentuan
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
    violet: 'bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300',
    emerald: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
  }
  return (
    <div className="bg-white dark:bg-gray-950 rounded-2xl border border-slate-100 dark:border-gray-800 p-5">
      <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-3 ${accentMap[accent] ?? accentMap.blue}`}>{label}</span>
      <p className="text-slate-600 dark:text-gray-400 text-sm leading-relaxed">{text}</p>
    </div>
  )
}
