import { useState } from 'react'
import './Modules.css'

const modules = [
  {
    id: 1,
    icon: '💸',
    level: 'Pemula',
    title: 'Apa Itu Uang Digital?',
    desc: 'Memahami konsep uang digital vs uang fisik, dan mengapa nilainya sama pentingnya.',
    topics: ['Sejarah uang & evolusinya', 'Uang fisik vs digital', 'Nilai uang sesungguhnya', 'Kerja keras & penghargaan'],
    color: '#6C63FF',
  },
  {
    id: 2,
    icon: '📱',
    level: 'Pemula',
    title: 'E-Wallet & QRIS',
    desc: 'Cara kerja dompet digital dan standar pembayaran QRIS yang digunakan di seluruh Indonesia.',
    topics: ['Apa itu e-wallet?', 'Cara kerja QRIS', 'GoPay, OVO, Dana, ShopeePay', 'Keamanan transaksi digital'],
    color: '#FF6584',
  },
  {
    id: 3,
    icon: '🎮',
    level: 'Menengah',
    title: 'Top-Up Game & Pengelolaan',
    desc: 'Belajar bijak dalam pengeluaran untuk game online dan hiburan digital.',
    topics: ['Psikologi mikrotransaksi', 'Anggaran hiburan digital', 'FOMO & impulsive spending', 'Prioritas pengeluaran'],
    color: '#43D9AD',
  },
  {
    id: 4,
    icon: '💰',
    level: 'Menengah',
    title: 'Menabung di Era Digital',
    desc: 'Strategi menabung yang efektif menggunakan teknologi finansial modern.',
    topics: ['Rekening tabungan digital', 'Fitur autosave', 'Target keuangan', 'Tabungan vs investasi'],
    color: '#FFD166',
  },
  {
    id: 5,
    icon: '📊',
    level: 'Lanjutan',
    title: 'Investasi untuk Pemula',
    desc: 'Pengenalan dasar investasi yang cocok untuk anak muda Indonesia.',
    topics: ['Reksa dana & obligasi', 'Saham untuk pemula', 'Risiko & return', 'Platform investasi legal'],
    color: '#FF9F43',
  },
]

export default function Modules() {
  const [active, setActive] = useState(null)

  return (
    <section id="modules" className="modules section">
      <div className="container">
        <div className="section-header">
          <span className="badge">📚 Kurikulum</span>
          <h2 className="section-title">Modul <span className="gradient-text">Belajar Terstruktur</span></h2>
          <p className="section-desc">Dari dasar hingga lanjutan, pelajari literasi keuangan digital langkah demi langkah.</p>
        </div>
        <div className="modules-list">
          {modules.map((mod) => (
            <div
              key={mod.id}
              className={`module-card ${active === mod.id ? 'active' : ''}`}
              onClick={() => setActive(active === mod.id ? null : mod.id)}
              style={{ '--mod-color': mod.color }}
            >
              <div className="module-header">
                <div className="module-left">
                  <div className="module-icon" style={{ background: `${mod.color}22`, color: mod.color }}>{mod.icon}</div>
                  <div className="module-info">
                    <span className="module-level" style={{ color: mod.color }}>{mod.level}</span>
                    <h3 className="module-title">{mod.title}</h3>
                    <p className="module-desc">{mod.desc}</p>
                  </div>
                </div>
                <div className="module-toggle">{active === mod.id ? '▲' : '▼'}</div>
              </div>
              {active === mod.id && (
                <div className="module-topics">
                  <div className="topics-label">Topik yang dipelajari:</div>
                  <ul className="topics-list">
                    {mod.topics.map((t, i) => (
                      <li key={i}><span className="topic-dot" style={{ background: mod.color }}></span>{t}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
