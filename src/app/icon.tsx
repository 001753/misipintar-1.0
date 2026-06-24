import { ImageResponse } from 'next/og'

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '512px',
          height: '512px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)',
          borderRadius: '115px',
          position: 'relative',
        }}
      >
        {/* Inner glow */}
        <div
          style={{
            position: 'absolute',
            inset: '24px',
            background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.25), transparent 60%)',
            borderRadius: '90px',
            display: 'flex',
          }}
        />

        {/* Target icon */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0px',
            position: 'relative',
          }}
        >
          <span style={{ fontSize: '240px', lineHeight: 1 }}>🎯</span>
        </div>
      </div>
    ),
    { ...size }
  )
}
