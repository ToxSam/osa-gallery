import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { GeistMono } from 'geist/font/mono';
import { Noto_Sans_JP } from 'next/font/google';
import { AuthProvider } from '@/lib/auth/AuthProvider';
import { I18nProvider } from '@/lib/i18n';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
};

export const metadata: Metadata = {
  title: 'Open Source Avatars - VR・ゲーム・メタバース向け無料3DアバターVRM',
  description: 'VR、ゲーム、VTuber、メタバース向けの300種類以上の無料・高品質3D VRMアバターをダウンロード。CC0ライセンス - クレジット表記不要で自由に使用可能。',
  openGraph: {
    title: 'Open Source Avatars - 無料3D VRMアバター',
    description: 'VR、ゲーム、VTuber、メタバース向けの300種類以上の無料・高品質3D VRMアバターをダウンロード。CC0ライセンス。',
    url: 'https://opensourceavatars.com/ja',
    type: 'website',
    locale: 'ja_JP',
    images: [
      {
        url: 'https://opensourceavatars.com/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'Open Source Avatars - 無料3D VRMアバター',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Open Source Avatars - 無料3D VRMアバター',
    description: '300種類以上の無料・高品質3D VRMアバターをダウンロード。CC0ライセンス。',
    images: ['https://opensourceavatars.com/opengraph-image.png'],
  },
};

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  variable: '--font-noto-sans-jp',
});

const fontClasses = `${inter.variable} ${GeistMono.variable} ${notoSansJP.variable}`;

export default function JaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={fontClasses} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <I18nProvider defaultLocale="ja">
          <AuthProvider>{children}</AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}