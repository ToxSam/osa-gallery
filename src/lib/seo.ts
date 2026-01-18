import { Metadata } from 'next';

interface MetadataParams {
  title: string;
  description: string;
  path: string;
  locale?: 'en' | 'ja';
  images?: string[];
  type?: 'website' | 'article';
  keywords?: string[];
}

const baseUrl = 'https://opensourceavatars.com';

const defaultKeywords = [
  'free 3D avatars',
  'VRM avatars',
  'open source avatars',
  'metaverse avatars',
  'VRM download',
  'free VRM models',
  '3D avatar download',
  'VTuber avatars',
  'VRChat avatars',
  'CC0 avatars',
  '無料3Dアバター',
  'VRMアバター',
  'オープンソースアバター',
];

export function generateSEOMetadata({
  title,
  description,
  path,
  locale = 'en',
  images = [],
  type = 'website',
  keywords = [],
}: MetadataParams): Metadata {
  const fullTitle = title === 'Open Source Avatars' 
    ? 'Open Source Avatars - Free 3D VRM Avatars for VR, Gaming & Metaverse'
    : `${title} | Open Source Avatars`;

  const url = `${baseUrl}${path}`;
  const defaultImage = `${baseUrl}/og-image.png`;
  const imageUrls = images.length > 0 ? images : [defaultImage];

  const allKeywords = [...defaultKeywords, ...keywords].join(', ');

  // Alternate language URLs
  const alternateLocale = locale === 'en' ? 'ja' : 'en';
  const alternatePath = path.replace(`/${locale}`, `/${alternateLocale}`);

  return {
    metadataBase: new URL(baseUrl),
    title: fullTitle,
    description,
    keywords: allKeywords,
    authors: [{ name: 'ToxSam', url: 'https://toxsam.com' }],
    creator: 'ToxSam',
    publisher: 'Open Source Avatars',
    
    // Open Graph
    openGraph: {
      type,
      locale: locale === 'en' ? 'en_US' : 'ja_JP',
      url,
      title: fullTitle,
      description,
      siteName: 'Open Source Avatars',
      images: imageUrls.map(img => ({
        url: img,
        width: 1200,
        height: 630,
        alt: title,
      })),
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      site: '@toxsam',
      creator: '@toxsam',
      title: fullTitle,
      description,
      images: imageUrls,
    },

    // Robots
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

    // Alternate languages
    alternates: {
      canonical: url,
      languages: {
        'en': `${baseUrl}/en${path.replace(`/${locale}`, '')}`,
        'ja': `${baseUrl}/ja${path.replace(`/${locale}`, '')}`,
        'x-default': `${baseUrl}/en${path.replace(`/${locale}`, '')}`,
      },
    },

    // Additional
    category: 'Technology',
    classification: '3D Avatars, VRM, Metaverse',
  };
}

// Helper for avatar-specific metadata
export function generateAvatarMetadata(
  avatar: {
    id: string;
    name: string;
    description?: string;
    thumbnailUrl?: string;
    format: string;
    project: string;
    polygonCount?: number;
  },
  locale: 'en' | 'ja' = 'en'
): Metadata {
  const title = locale === 'en' 
    ? `${avatar.name} - Free ${avatar.format.toUpperCase()} Avatar`
    : `${avatar.name} - 無料${avatar.format.toUpperCase()}アバター`;

  const description = locale === 'en'
    ? avatar.description || 
      `Download ${avatar.name}, a free open-source ${avatar.format.toUpperCase()} avatar from the ${avatar.project} collection. Perfect for VR, gaming, VTubing, and metaverse applications. ${avatar.polygonCount ? `${avatar.polygonCount.toLocaleString()} polygons.` : ''} CC0 license - use freely in any project.`
    : avatar.description ||
      `${avatar.name}をダウンロード。${avatar.project}コレクションの無料オープンソース${avatar.format.toUpperCase()}アバターです。VR、ゲーム、VTuber、メタバース用に最適。${avatar.polygonCount ? `${avatar.polygonCount.toLocaleString()}ポリゴン。` : ''}CC0ライセンス - あらゆるプロジェクトで自由に使用できます。`;

  const keywords = locale === 'en' ? [
    avatar.name,
    `${avatar.format} avatar`,
    `${avatar.project} avatar`,
    'download VRM',
    'free avatar model',
    'VTuber model',
    'VRChat avatar',
    '3D character model',
  ] : [
    avatar.name,
    `${avatar.format}アバター`,
    `${avatar.project}アバター`,
    'VRMダウンロード',
    '無料アバターモデル',
    'VTuberモデル',
    'VRChatアバター',
    '3Dキャラクターモデル',
  ];

  return generateSEOMetadata({
    title,
    description,
    path: `/${locale}/avatars/${avatar.id}`,
    locale,
    images: avatar.thumbnailUrl ? [avatar.thumbnailUrl] : [],
    type: 'article',
    keywords,
  });
}
