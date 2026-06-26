'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="id">
      <body
        style={{
          margin: 0,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: '#020617',
          color: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '480px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px' }}>
            Terjadi Kesalahan
          </h1>
          <p style={{ color: '#94a3b8', marginBottom: '28px', lineHeight: 1.6 }}>
            Maaf, terjadi kesalahan yang tidak terduga. Coba muat ulang halaman.
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: '#10b981',
              color: '#ffffff',
              border: 'none',
              padding: '12px 28px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: 600,
            }}
          >
            Coba Lagi
          </button>
        </div>
      </body>
    </html>
  )
}
