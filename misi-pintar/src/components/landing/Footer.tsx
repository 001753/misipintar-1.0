import Link from 'next/link'
import { Target, Heart, Share2, Play, MessageCircle } from 'lucide-react'

const links = {
  Fitur: [
    { label: 'Misi Pintar', href: '#fitur' },
    { label: 'Tabungan Virtual', href: '#tabungan' },
    { label: 'Pahlawan Rumah', href: '#' },
    { label: 'Sistem Pajak', href: '#' },
  ],
  Perusahaan: [
    { label: 'Tentang Kami', href: '/tentang-kami' },
    { label: 'Blog', href: '#' },
    { label: 'Karir', href: '#' },
    { label: 'Kontak', href: '#' },
  ],
  Legal: [
    { label: 'Kebijakan Privasi', href: '/kebijakan-privasi' },
    { label: 'Syarat & Ketentuan', href: '/syarat-ketentuan' },
    { label: 'Cookie', href: '#' },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Target className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white font-display">
                Misi<span className="text-emerald-400">Pintar</span>
              </span>
            </Link>
            <p className="text-slate-400 leading-relaxed mb-6 max-w-sm">
              Mendidik generasi melek keuangan sejak dini. Platform gamifikasi keuangan keluarga #1 Indonesia.
            </p>

            <div className="flex flex-col gap-3 mb-6">
              {[
                { label: '📱 App Store', badge: 'Coming Soon', color: 'border-slate-700' },
                { label: '📱 Google Play', badge: 'Coming Soon', color: 'border-slate-700' },
              ].map((app) => (
                <button
                  key={app.label}
                  disabled
                  className={`flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border ${app.color} bg-slate-800/50 text-slate-400 text-sm cursor-not-allowed`}
                >
                  <span>{app.label}</span>
                  <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">{app.badge}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              {[
                { icon: Share2, label: 'Instagram' },
                { icon: Play, label: 'YouTube' },
                { icon: MessageCircle, label: 'Twitter' },
              ].map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  aria-label={label}
                  className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors duration-200"
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="text-white font-semibold text-sm mb-4 font-display">{category}</h4>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-slate-400 text-sm hover:text-emerald-400 transition-colors duration-200"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            © 2025 Misi Pintar. Dibuat dengan{' '}
            <Heart className="inline w-3.5 h-3.5 text-red-400 fill-red-400" /> untuk keluarga Indonesia.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-slate-600 text-xs">🇮🇩 Made in Indonesia</span>
          </div>
        </div>

        {/* Powered By */}
        <div className="mt-6 pt-6 border-t border-slate-800/60 flex justify-center">
          <div className="flex items-center gap-2.5 group">
            <div className="flex items-center gap-1.5">
              <div className="w-px h-3 bg-slate-700" />
              <span className="text-slate-600 text-[10px] font-medium uppercase tracking-[0.15em]">Powered by</span>
              <div className="w-px h-3 bg-slate-700" />
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm shadow-amber-500/30">
                <span className="text-[9px] font-black text-white leading-none">JE</span>
              </div>
              <span className="text-[11px] font-black tracking-widest text-slate-300 group-hover:text-amber-400 transition-colors duration-300 uppercase">
                JOBEN ENTERPRISE
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
