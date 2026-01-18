import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Open Source Avatars - Free 3D VRM Avatars';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0a',
          backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(100, 100, 100, 0.15) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(100, 100, 100, 0.15) 0%, transparent 50%)',
          padding: '80px',
        }}
      >
        {/* Logo */}
        <div
          style={{
            fontSize: '72px',
            fontWeight: 'bold',
            color: '#fff',
            marginBottom: '32px',
            letterSpacing: '-0.02em',
            textAlign: 'center',
          }}
        >
          Open Source Avatars
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: '36px',
            color: '#aaa',
            textAlign: 'center',
            maxWidth: '900px',
            lineHeight: 1.4,
            marginBottom: '64px',
          }}
        >
          300+ Free 3D VRM Avatars for VR, Gaming & Metaverse
        </div>

        {/* Stats */}
        <div
          style={{
            display: 'flex',
            gap: '48px',
            marginBottom: '64px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '24px 32px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              border: '2px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div
              style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: '#fff',
              }}
            >
              300+
            </div>
            <div
              style={{
                fontSize: '20px',
                color: '#888',
                marginTop: '8px',
              }}
            >
              Free Avatars
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '24px 32px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              border: '2px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div
              style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: '#fff',
              }}
            >
              CC0
            </div>
            <div
              style={{
                fontSize: '20px',
                color: '#888',
                marginTop: '8px',
              }}
            >
              License
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '24px 32px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              border: '2px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div
              style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: '#fff',
              }}
            >
              VRM
            </div>
            <div
              style={{
                fontSize: '20px',
                color: '#888',
                marginTop: '8px',
              }}
            >
              Format
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            fontSize: '18px',
            color: '#666',
          }}
        >
          opensourceavatars.com · @toxsam
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
