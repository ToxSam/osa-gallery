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
          {/* Main Content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '80px',
              maxWidth: '1000px',
            }}
          >
            {/* Logo/Title */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '40px',
              }}
            >
              <div
                style={{
                  fontSize: '60px',
                  fontWeight: 'bold',
                  color: '#000',
                  letterSpacing: '-0.02em',
                }}
              >
                Open Source Avatars
              </div>
            </div>

            {/* Avatar Info */}
            {avatarName && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  marginBottom: '40px',
                  padding: '40px 60px',
                  backgroundColor: 'white',
                  borderRadius: '20px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                }}
              >
                {project && (
                  <div
                    style={{
                      fontSize: '24px',
                      color: '#666',
                      marginBottom: '16px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {project}
                  </div>
                )}
                <div
                  style={{
                    fontSize: '72px',
                    fontWeight: 'bold',
                    color: '#000',
                    marginBottom: '20px',
                    textAlign: 'center',
                  }}
                >
                  {avatarName}
                </div>
                <div
                  style={{
                    fontSize: '28px',
                    color: '#666',
                    textAlign: 'center',
                  }}
                >
                  Free VRM Avatar · CC0 License
                </div>
              </div>
            )}

            {/* Description for non-avatar pages */}
            {!avatarName && (
              <div
                style={{
                  fontSize: '36px',
                  color: '#666',
                  textAlign: 'center',
                  maxWidth: '800px',
                  lineHeight: 1.4,
                }}
              >
                {description}
              </div>
            )}

            {/* Bottom Stats */}
            <div
              style={{
                display: 'flex',
                gap: '60px',
                marginTop: '60px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '48px',
                    fontWeight: 'bold',
                    color: '#000',
                  }}
                >
                  300+
                </div>
                <div
                  style={{
                    fontSize: '24px',
                    color: '#666',
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
                }}
              >
                <div
                  style={{
                    fontSize: '48px',
                    fontWeight: 'bold',
                    color: '#000',
                  }}
                >
                  CC0
                </div>
                <div
                  style={{
                    fontSize: '24px',
                    color: '#666',
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
                }}
              >
                <div
                  style={{
                    fontSize: '48px',
                    fontWeight: 'bold',
                    color: '#000',
                  }}
                >
                  VRM
                </div>
                <div
                  style={{
                    fontSize: '24px',
                    color: '#666',
                  }}
                >
                  Format
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              position: 'absolute',
              bottom: '40px',
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              color: '#666',
              fontSize: '20px',
            }}
          >
            <div>opensourceavatars.com</div>
            <div>·</div>
            <div>@toxsam</div>
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
    return new Response(`Failed to generate image`, {
      status: 500,
    });
  }
}
