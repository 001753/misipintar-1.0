import './Features.css'

const features = [
  {
    icon: '🧠',
    title: 'Psikologi Uang',
    desc: 'Pahami mengapa uang digital terasa "tidak nyata" dan bagaimana ini mempengaruhi keputusan finansialmu.',
  },
  {
    icon: '📲',
    title: 'Dunia Cashless',
    desc: 'Pelajari cara kerja QRIS, e-wallet, dan sistem pembayaran digital yang kamu gunakan setiap hari.',
  },
  {
    icon: '💡',
    title: 'Kebiasaan Sehat',
    desc: 'Bangun kebiasaan finansial yang baik sejak dini — menabung, menganggarkan, dan berinvestasi.',
  },
  {
    icon: '🎮',
    title: 'Belajar Interaktif',
    desc: 'Kuis seru dan modul interaktif yang membuat belajar keuangan jadi menyenangkan.',
  },
  {
    icon: '📊',
    title: 'Literasi Finansial',
    desc: 'Tingkatkan pemahaman tentang nilai uang, inflasi, dan bagaimana ekonomi digital bekerja.',
  },
  {
    icon: '🔐',
    title: 'Keamanan Digital',
    desc: 'Lindungi diri dari penipuan online dan pelajari cara bertransaksi digital dengan aman.',
  },
]

export default function Features() {
  return (
    <section id="features" className="features section">
      <div className="container">
        <div className="section-header">
          <span className="badge">✨ Kenapa MisiPintar</span>
          <h2 className="section-title">Belajar Keuangan <span className="gradient-text">untuk Gen Z & Alpha</span></h2>
          <p className="section-desc">Platform pertama yang dirancang khusus untuk generasi yang tumbuh di era digital cashless Indonesia.</p>
        </div>
        <div className="features-grid">
          {features.map((f, i) => (
            <div className="feature-card" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
