import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '180px',
          height: '180px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)',
          borderRadius: '40px',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '8px',
            background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.25), transparent 60%)',
            borderRadius: '32px',
            display: 'flex',
          }}
        />
        <span style={{ fontSize: '90px', lineHeight: 1, position: 'relative' }}>🎯</span>
      </div>
    ),
    { ...size }
  )
}
