'use client'

export default function GlobalError({
  error,
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
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: '#f9fafb',
          color: '#111827',
          gap: '12px',
          padding: '16px',
        }}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ef4444"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
          Terjadi Kesalahan
        </h2>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
          {error?.digest ? `Kode: ${error.digest}` : 'Silakan coba lagi.'}
        </p>
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <button
            onClick={reset}
            style={{
              padding: '8px 20px',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            Coba Lagi
          </button>
          <a
            href="/"
            style={{
              padding: '8px 20px',
              background: '#3b82f6',
              color: 'white',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            Ke Beranda
          </a>
        </div>
      </body>
    </html>
  )
}
