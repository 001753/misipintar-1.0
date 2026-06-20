import './Hero.css'

export default function Hero() {
  return (
    <section className="hero section">
      <div className="hero-bg-glow"></div>
      <div className="container hero-inner">
        <div className="hero-content animate-in">
          <span className="badge">🎓 Edukasi Keuangan Digital</span>
          <h1 className="hero-title">
            Uang Bukan Sekadar <span className="gradient-text">Angka Digital</span>
          </h1>
          <p className="hero-desc">
            Generasi Alpha & Z tumbuh di dunia cashless — QRIS, e-wallet, top-up game. Saatnya pahami nilai sejati uang dan membangun kebiasaan finansial yang sehat.
          </p>
          <div className="hero-actions">
            <a href="#modules" className="btn-primary">Jelajahi Modul</a>
            <a href="#quiz" className="btn-outline">Coba Kuis</a>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-num">5+</span>
              <span className="stat-label">Modul Belajar</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat">
              <span className="stat-num">10+</span>
              <span className="stat-label">Pertanyaan Kuis</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat">
              <span className="stat-num">100%</span>
              <span className="stat-label">Gratis</span>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="floating-card card-1">
            <span className="card-icon">📱</span>
            <div>
              <div className="card-title">E-Wallet</div>
              <div className="card-sub">Saldo: Rp 250.000</div>
            </div>
          </div>
          <div className="hero-phone">
            <div className="phone-screen">
              <div className="phone-header">
                <div className="ph-dot"></div>
                <div className="ph-dot"></div>
                <div className="ph-dot"></div>
              </div>
              <div className="phone-balance">
                <div className="pb-label">Saldo Kamu</div>
                <div className="pb-amount">Rp 125.000</div>
              </div>
              <div className="phone-qris">
                <div className="qris-box">
                  <div className="qris-pattern"></div>
                  <span>QRIS</span>
                </div>
              </div>
              <div className="phone-actions">
                <div className="pa-btn">💸 Bayar</div>
                <div className="pa-btn">📥 Top Up</div>
                <div className="pa-btn">🔄 Transfer</div>
              </div>
            </div>
          </div>
          <div className="floating-card card-2">
            <span className="card-icon">💰</span>
            <div>
              <div className="card-title">Kerja Keras</div>
              <div className="card-sub">= Nilai Nyata</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
