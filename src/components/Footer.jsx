import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <span className="logo-icon">💡</span>
          <span className="logo-text">MisiPintar</span>
        </div>
        <p className="footer-tagline">
          Membangun generasi finansial yang cerdas dan bijak di era digital.
        </p>
        <div className="footer-links">
          <a href="#features">Fitur</a>
          <a href="#modules">Modul</a>
          <a href="#quiz">Kuis</a>
        </div>
        <p className="footer-copy">© 2026 MisiPintar. Edukasi keuangan untuk Generasi Alpha & Z Indonesia.</p>
      </div>
    </footer>
  )
}
