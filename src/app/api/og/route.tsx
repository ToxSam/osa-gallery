import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const title = searchParams.get('title') || 'Open Source Avatars';
    const description = searchParams.get('description') || 'Free 3D VRM Avatars for VR, Gaming & Metaverse';
    const avatarName = searchParams.get('avatarName');
    const project = searchParams.get('project');
    const thumbnailUrl = searchParams.get('thumbnail');
    const type = searchParams.get('type') || 'default'; // 'avatar', 'gallery', 'default'

    // For avatar pages with thumbnail
    if (type === 'avatar' && thumbnailUrl && avatarName) {
      return new ImageResponse(
        (
          <div
            style={{
              height: '100%',
              width: '100%',
              display: 'flex',
              backgroundColor: '#0a0a0a',
              backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(100, 100, 100, 0.15) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(100, 100, 100, 0.15) 0%, transparent 50%)',
            }}
          >
            {/* Left Side - Avatar Image */}
            <div
              style={{
                width: '50%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px',
              }}
            >
              <img
                src={thumbnailUrl}
                alt={avatarName}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  borderRadius: '20px',
                  border: '4px solid rgba(255, 255, 255, 0.1)',
                }}
              />
            </div>

            {/* Right Side - Info */}
            <div
              style={{
                width: '50%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '80px 60px',
              }}
            >
              {/* Project Badge */}
              {project && (
                <div
                  style={{
                    display: 'inline-block',
                    fontSize: '20px',
                    color: '#888',
                    marginBottom: '24px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                    fontWeight: 600,
                  }}
                >
                  {project}
                </div>
              )}

              {/* Avatar Name */}
              <div
                style={{
                  fontSize: '64px',
                  fontWeight: 'bold',
                  color: '#fff',
                  marginBottom: '24px',
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                }}
              >
                {avatarName}
              </div>

              {/* Description */}
              <div
                style={{
                  fontSize: '24px',
                  color: '#aaa',
                  marginBottom: '48px',
                  lineHeight: 1.4,
                }}
              >
                Free 3D VRM Avatar · Ready for VR, Games & Metaverse
              </div>

              {/* Stats Pills */}
              <div
                style={{
                  display: 'flex',
                  gap: '16px',
                  flexWrap: 'wrap',
                }}
              >
                <div
                  style={{
                    padding: '12px 24px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '999px',
                    fontSize: '18px',
                    color: '#fff',
                    fontWeight: 600,
                  }}
                >
                  ✓ CC0 License
                </div>
                <div
                  style={{
                    padding: '12px 24px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '999px',
                    fontSize: '18px',
                    color: '#fff',
                    fontWeight: 600,
                  }}
                >
                  ✓ VRM Format
                </div>
                <div
                  style={{
                    padding: '12px 24px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '999px',
                    fontSize: '18px',
                    color: '#fff',
                    fontWeight: 600,
                  }}
                >
                  ✓ Free Forever
                </div>
              </div>

              {/* Bottom Brand */}
              <div
                style={{
                  marginTop: '60px',
                  fontSize: '18px',
                  color: '#666',
                }}
              >
                opensourceavatars.com
              </div>
            </div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      );
    }

    // For gallery and other pages
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
              fontSize: type === 'gallery' ? '56px' : '72px',
              fontWeight: 'bold',
              color: '#fff',
              marginBottom: '32px',
              letterSpacing: '-0.02em',
              textAlign: 'center',
            }}
          >
            {title}
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: type === 'gallery' ? '32px' : '36px',
              color: '#aaa',
              textAlign: 'center',
              maxWidth: '900px',
              lineHeight: 1.4,
              marginBottom: '64px',
            }}
          >
            {description}
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
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.log(`Error generating OG image: ${e.message}`);
    return new Response(`Failed to generate image: ${e.message}`, {
      status: 500,
    });
  }
}
