import { ImageResponse } from 'next/og'

export const alt = 'MisiPintar - Ubah Kuota Marah-Marah Jadi Kuota Senyuman'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #020617 0%, #0f172a 40%, #042f2e 100%)',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'sans-serif',
        }}
      >
        {/* ── Background glow blobs ── */}
        <div
          style={{
            position: 'absolute',
            top: '-120px',
            left: '-80px',
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)',
            borderRadius: '9999px',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-100px',
            right: '-60px',
            width: '420px',
            height: '420px',
            background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)',
            borderRadius: '9999px',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '200px',
            right: '280px',
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
            borderRadius: '9999px',
            display: 'flex',
          }}
        />

        {/* ── Grid overlay ── */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
            display: 'flex',
          }}
        />

        {/* ── Content wrapper ── */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            padding: '56px 72px',
            height: '100%',
            justifyContent: 'space-between',
          }}
        >
          {/* ── Top: Logo + Badge ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '30px',
                  boxShadow: '0 0 32px rgba(16,185,129,0.4)',
                }}
              >
                🎯
              </div>
              <span
                style={{
                  fontSize: '28px',
                  fontWeight: 900,
                  color: '#ffffff',
                  letterSpacing: '-0.5px',
                }}
              >
                MisiPintar
              </span>
            </div>

            {/* Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(16,185,129,0.12)',
                border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: '9999px',
                padding: '10px 20px',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '9999px',
                  background: '#10b981',
                  display: 'flex',
                }}
              />
              <span style={{ color: '#6ee7b7', fontSize: '16px', fontWeight: 600 }}>
                Literasi Keuangan Keluarga #1 Indonesia
              </span>
            </div>
          </div>

          {/* ── Middle: Headline ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span
                style={{
                  fontSize: '70px',
                  fontWeight: 900,
                  color: '#f8fafc',
                  lineHeight: 1.05,
                  letterSpacing: '-2px',
                }}
              >
                Ubah Kuota
              </span>
              <span
                style={{
                  fontSize: '70px',
                  fontWeight: 900,
                  color: '#10b981',
                  lineHeight: 1.05,
                  letterSpacing: '-2px',
                }}
              >
                Marah-Marah
              </span>
              <span
                style={{
                  fontSize: '70px',
                  fontWeight: 900,
                  color: '#f8fafc',
                  lineHeight: 1.05,
                  letterSpacing: '-2px',
                }}
              >
                Jadi Kuota Senyuman ✨
              </span>
            </div>

            <p
              style={{
                fontSize: '22px',
                color: '#94a3b8',
                lineHeight: 1.5,
                margin: 0,
                maxWidth: '720px',
              }}
            >
              Tugas anak jadi misi seru berhadiah saldo virtual. Anak belajar nilai kerja keras,
              orang tua tenang. 100% gratis selamanya.
            </p>
          </div>

          {/* ── Bottom: Features + URL ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Feature pills */}
            <div style={{ display: 'flex', gap: '12px' }}>
              {[
                { icon: '🎯', label: 'Misi & Reward' },
                { icon: '💰', label: 'Saldo Virtual' },
                { icon: '🐷', label: 'Kantong Impian' },
                { icon: '👨‍👩‍👧', label: 'Multi-Anak' },
              ].map((f) => (
                <div
                  key={f.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    padding: '10px 16px',
                  }}
                >
                  <span style={{ fontSize: '18px' }}>{f.icon}</span>
                  <span style={{ color: '#cbd5e1', fontSize: '15px', fontWeight: 600 }}>
                    {f.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Domain */}
            <span
              style={{
                fontSize: '18px',
                color: '#475569',
                fontWeight: 600,
                letterSpacing: '0.5px',
              }}
            >
              mp.jobenapp.cloud
            </span>
          </div>
        </div>

        {/* ── Left accent bar ── */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: '15%',
            width: '5px',
            height: '70%',
            background: 'linear-gradient(180deg, transparent, #10b981, transparent)',
            borderRadius: '9999px',
            display: 'flex',
          }}
        />
      </div>
    ),
    { ...size }
  )
}
