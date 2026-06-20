import { useState } from 'react'
import './Navbar.css'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <a href="#" className="navbar-logo">
          <span className="logo-icon">💡</span>
          <span className="logo-text">MisiPintar</span>
        </a>
        <ul className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <li><a href="#features" onClick={() => setMenuOpen(false)}>Fitur</a></li>
          <li><a href="#modules" onClick={() => setMenuOpen(false)}>Modul</a></li>
          <li><a href="#quiz" onClick={() => setMenuOpen(false)}>Kuis</a></li>
        </ul>
        <a href="#quiz" className="navbar-cta">Mulai Belajar</a>
        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          <span></span><span></span><span></span>
        </button>
      </div>
    </nav>
  )
}
