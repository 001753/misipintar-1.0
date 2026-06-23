'use client'
import { useEffect } from 'react'

const COIN_KEYFRAMES = `
@keyframes coinRiseLeft {
  0%   { bottom: -40px; opacity: 0; transform: translateX(0) rotate(0deg); }
  10%  { opacity: 0.9; }
  90%  { opacity: 0.5; }
  100% { bottom: 110vh; opacity: 0; transform: translateX(-50px) rotate(360deg); }
}
@keyframes coinRiseRight {
  0%   { bottom: -40px; opacity: 0; transform: translateX(0) rotate(0deg); }
  10%  { opacity: 0.9; }
  90%  { opacity: 0.5; }
  100% { bottom: 110vh; opacity: 0; transform: translateX(50px) rotate(-360deg); }
}
`

let coinCounter = 0

export default function CoinTrail() {
  useEffect(() => {
    const styleEl = document.createElement('style')
    styleEl.textContent = COIN_KEYFRAMES
    document.head.appendChild(styleEl)

    const emojis = ['💰', '🪙', '⭐', '✨', '💵']

    function spawnCoin() {
      const id = ++coinCounter
      const side = Math.random() > 0.5 ? 'left' : 'right'
      const x = side === 'left'
        ? Math.random() * 100
        : window.innerWidth - Math.random() * 100
      const emoji = emojis[Math.floor(Math.random() * emojis.length)]
      const duration = 2000 + Math.random() * 2000
      const size = 14 + Math.random() * 10
      const animation = side === 'left' ? 'coinRiseLeft' : 'coinRiseRight'

      const el = document.createElement('div')
      el.id = `coin-${id}`
      el.style.cssText = `
        position: fixed;
        left: ${x}px;
        bottom: -40px;
        font-size: ${size}px;
        opacity: 0;
        pointer-events: none;
        z-index: 9999;
        animation: ${animation} ${duration}ms ease-out forwards;
      `
      el.textContent = emoji
      document.body.appendChild(el)

      setTimeout(() => el.remove(), duration)
    }

    let lastScroll = 0
    const handleScroll = () => {
      const current = window.scrollY
      const diff = Math.abs(current - lastScroll)
      if (diff > 40 && Math.random() > 0.72) {
        spawnCoin()
        lastScroll = current
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      styleEl.remove()
    }
  }, [])

  return null
}
