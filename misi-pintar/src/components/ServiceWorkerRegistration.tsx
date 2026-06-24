'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        })

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (!newWorker) return
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[SW] Update tersedia — reload untuk versi terbaru.')
            }
          })
        })
      } catch (err) {
        console.warn('[SW] Registrasi gagal:', err)
      }
    }

    // Register after page load to not block rendering
    if (document.readyState === 'complete') {
      register()
    } else {
      window.addEventListener('load', register, { once: true })
    }
  }, [])

  return null
}
