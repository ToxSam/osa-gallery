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
          backgroundColor: '#FAF9F6',
          backgroundImage: 'radial-gradient(circle at 25px 25px, lightgray 2%, transparent 0%), radial-gradient(circle at 75px 75px, lightgray 2%, transparent 0%)',
          backgroundSize: '100px 100px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px',
          }}
        >
          <div
            style={{
              fontSize: '80px',
              fontWeight: 'bold',
              color: '#000',
              marginBottom: '40px',
              letterSpacing: '-0.02em',
            }}
          >
            Open Source Avatars
          </div>
          <div
            style={{
              fontSize: '40px',
              color: '#666',
              textAlign: 'center',
              maxWidth: '900px',
              lineHeight: 1.3,
              marginBottom: '60px',
            }}
          >
            300+ Free 3D VRM Avatars for VR, Gaming & Metaverse
          </div>
          <div
            style={{
              display: 'flex',
              gap: '60px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '56px', fontWeight: 'bold', color: '#000' }}>300+</div>
              <div style={{ fontSize: '28px', color: '#666' }}>Avatars</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '56px', fontWeight: 'bold', color: '#000' }}>CC0</div>
              <div style={{ fontSize: '28px', color: '#666' }}>License</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '56px', fontWeight: 'bold', color: '#000' }}>FREE</div>
              <div style={{ fontSize: '28px', color: '#666' }}>Forever</div>
            </div>
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: '50px',
            fontSize: '24px',
            color: '#666',
          }}
        >
          opensourceavatars.com
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
