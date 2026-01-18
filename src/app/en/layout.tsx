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
  title: 'Open Source Avatars - Free 3D VRM Avatars for VR, Gaming & Metaverse',
  description: 'Download 300+ free, high-quality 3D VRM avatars for VR, gaming, VTubing, and metaverse. CC0 licensed open-source avatars for any project. No attribution required.',
  openGraph: {
    title: 'Open Source Avatars - Free 3D VRM Avatars',
    description: 'Download 300+ free, high-quality 3D VRM avatars for VR, gaming, VTubing, and metaverse. CC0 licensed.',
    url: 'https://opensourceavatars.com/en',
    type: 'website',
    images: [
      {
        url: 'https://opensourceavatars.com/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'Open Source Avatars - Free 3D VRM Avatars',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Open Source Avatars - Free 3D VRM Avatars',
    description: 'Download 300+ free, high-quality 3D VRM avatars. CC0 licensed.',
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

export default function EnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={fontClasses} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <I18nProvider defaultLocale="en">
          <AuthProvider>{children}</AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}