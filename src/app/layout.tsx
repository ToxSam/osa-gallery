import './globals.css';
import { I18nProvider } from '@/lib/i18n';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import type { Metadata } from 'next';
import { WebsiteSchema, OrganizationSchema } from '@/components/StructuredData';

export const metadata: Metadata = {
  metadataBase: new URL('https://opensourceavatars.com'),
  title: {
    default: 'Open Source Avatars - Free 3D VRM Avatars for VR, Gaming & Metaverse',
    template: '%s | Open Source Avatars',
  },
  description: 'Download 300+ free, high-quality 3D VRM avatars for VR, gaming, VTubing, and metaverse. CC0 licensed open-source avatars for any project. No attribution required.',
  keywords: [
    'free 3D avatars',
    'VRM avatars download',
    'open source avatars',
    'metaverse avatars free',
    'VRM models',
    'VTuber avatars',
    'VRChat avatars',
    'CC0 avatars',
    '3D character models',
    'free VRM download',
    'avatar VRM inspector',
    '無料3Dアバター',
    'VRMアバター',
  ],
  authors: [{ name: 'ToxSam', url: 'https://toxsam.com' }],
  creator: 'ToxSam',
  publisher: 'Open Source Avatars',
  applicationName: 'Open Source Avatars',
  
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://opensourceavatars.com',
    title: 'Open Source Avatars - Free 3D VRM Avatars',
    description: 'Download 300+ free, high-quality 3D VRM avatars for VR, gaming, VTubing, and metaverse. CC0 licensed.',
    siteName: 'Open Source Avatars',
  },
  
  twitter: {
    card: 'summary_large_image',
    site: '@toxsam',
    creator: '@toxsam',
    title: 'Open Source Avatars - Free 3D VRM Avatars',
    description: 'Download 300+ free, high-quality 3D VRM avatars for VR, gaming, VTubing, and metaverse. CC0 licensed.',
  },
  
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  icons: {
    icon: '/favicon.ico',
  },
  
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html 
      lang="en" 
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Theme initialization script to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme');
                const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const shouldBeDark = theme === 'dark' || (!theme && systemPrefersDark);
                if (shouldBeDark) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={GeistSans.className}>
        <WebsiteSchema />
        <OrganizationSchema />
        <I18nProvider defaultLocale="en">
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}