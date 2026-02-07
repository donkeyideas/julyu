import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Julyu - AI-Powered Grocery Price Comparison'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#000000',
          backgroundImage:
            'radial-gradient(circle at 50% 0%, rgba(34, 197, 94, 0.15) 0%, transparent 50%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px',
          }}
        >
          <div
            style={{
              fontSize: '80px',
              fontWeight: 900,
              color: '#22c55e',
              letterSpacing: '-2px',
            }}
          >
            Julyu
          </div>
          <div
            style={{
              fontSize: '32px',
              fontWeight: 600,
              color: '#ffffff',
              textAlign: 'center',
              maxWidth: '800px',
            }}
          >
            Save $287/Month on Groceries
          </div>
          <div
            style={{
              fontSize: '20px',
              color: '#9ca3af',
              textAlign: 'center',
              maxWidth: '700px',
            }}
          >
            AI-powered price comparison across 50+ retailers
          </div>
          <div
            style={{
              display: 'flex',
              gap: '32px',
              marginTop: '16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#22c55e',
                fontSize: '18px',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#22c55e',
                }}
              />
              Receipt Scanning
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#22c55e',
                fontSize: '18px',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#22c55e',
                }}
              />
              Price Tracking
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#22c55e',
                fontSize: '18px',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#22c55e',
                }}
              />
              AI Matching
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
