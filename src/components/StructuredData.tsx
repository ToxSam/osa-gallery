'use client';

import React from 'react';
import Script from 'next/script';

interface WebsiteSchemaProps {
  locale?: 'en' | 'ja';
}

export function WebsiteSchema({ locale = 'en' }: WebsiteSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Open Source Avatars',
    alternateName: locale === 'ja' ? 'オープンソースアバター' : 'OSA',
    url: `https://opensourceavatars.com/${locale}`,
    description:
      locale === 'en'
        ? 'Download 300+ free, high-quality 3D VRM avatars for VR, gaming, VTubing, and metaverse. CC0 licensed open-source avatars for any project.'
        : '300以上の無料で高品質な3D VRMアバターをダウンロード。VR、ゲーム、VTuber、メタバース用。CC0ライセンスのオープンソースアバター。',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `https://opensourceavatars.com/${locale}/gallery?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    inLanguage: locale === 'en' ? 'en-US' : 'ja-JP',
  };

  return (
    <Script id="website-schema" type="application/ld+json" strategy="afterInteractive">
      {JSON.stringify(schema)}
    </Script>
  );
}

interface OrganizationSchemaProps {
  locale?: 'en' | 'ja';
}

export function OrganizationSchema({ locale = 'en' }: OrganizationSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Open Source Avatars',
    url: 'https://opensourceavatars.com',
    logo: 'https://opensourceavatars.com/logo.png',
    description:
      locale === 'en'
        ? 'A platform dedicated to providing high-quality, freely available 3D avatars for creators, developers, and users worldwide.'
        : '世界中のクリエイター、開発者、ユーザーに高品質で自由に利用できる3Dアバターを提供することに特化したプラットフォーム。',
    founder: {
      '@type': 'Person',
      name: 'ToxSam',
      url: 'https://toxsam.com',
    },
    sameAs: [
      'https://twitter.com/toxsam',
      'https://github.com/ToxSam/open-source-avatars',
      'https://github.com/ToxSam/osa-gallery',
    ],
  };

  return (
    <Script id="organization-schema" type="application/ld+json" strategy="afterInteractive">
      {JSON.stringify(schema)}
    </Script>
  );
}

interface AvatarProductSchemaProps {
  avatar: {
    id: string;
    name: string;
    description?: string;
    thumbnailUrl?: string;
    modelFileUrl: string;
    format: string;
    polygonCount?: number;
    materialCount?: number;
    project: string;
    createdAt: string;
  };
  locale?: 'en' | 'ja';
}

export function AvatarProductSchema({ avatar, locale = 'en' }: AvatarProductSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'DigitalDocument',
    '@id': `https://opensourceavatars.com/${locale}/avatars/${avatar.id}`,
    name: avatar.name,
    description:
      avatar.description ||
      (locale === 'en'
        ? `Free ${avatar.format.toUpperCase()} 3D avatar from the ${avatar.project} collection. Perfect for VR, gaming, and metaverse applications.`
        : `${avatar.project}コレクションの無料${avatar.format.toUpperCase()} 3Dアバター。VR、ゲーム、メタバース用に最適。`),
    image: avatar.thumbnailUrl || 'https://opensourceavatars.com/og-image.png',
    url: `https://opensourceavatars.com/${locale}/avatars/${avatar.id}`,
    dateCreated: avatar.createdAt,
    encodingFormat: avatar.format === 'vrm' ? 'model/gltf-binary' : 'model/fbx',
    fileFormat: avatar.format.toUpperCase(),
    license: 'https://creativecommons.org/publicdomain/zero/1.0/',
    keywords: [
      avatar.name,
      'VRM avatar',
      'free 3D avatar',
      'open source avatar',
      avatar.project,
      'CC0',
      'metaverse avatar',
      'VTuber',
    ].join(', '),
    isAccessibleForFree: true,
    creator: {
      '@type': 'Organization',
      name: 'Open Source Avatars',
      url: 'https://opensourceavatars.com',
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'Open Source Avatars',
      },
    },
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'Polygon Count',
        value: avatar.polygonCount?.toString() || 'Unknown',
      },
      {
        '@type': 'PropertyValue',
        name: 'Material Count',
        value: avatar.materialCount?.toString() || 'Unknown',
      },
      {
        '@type': 'PropertyValue',
        name: 'Format',
        value: avatar.format.toUpperCase(),
      },
      {
        '@type': 'PropertyValue',
        name: 'Collection',
        value: avatar.project,
      },
    ],
  };

  return (
    <Script id="avatar-product-schema" type="application/ld+json" strategy="afterInteractive">
      {JSON.stringify(schema)}
    </Script>
  );
}

interface BreadcrumbSchemaProps {
  items: Array<{
    name: string;
    url: string;
  }>;
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <Script id="breadcrumb-schema" type="application/ld+json" strategy="afterInteractive">
      {JSON.stringify(schema)}
    </Script>
  );
}

interface CollectionPageSchemaProps {
  totalItems: number;
  locale?: 'en' | 'ja';
}

export function CollectionPageSchema({ totalItems, locale = 'en' }: CollectionPageSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: locale === 'en' ? 'Avatar Gallery' : 'アバターギャラリー',
    description:
      locale === 'en'
        ? `Browse our collection of ${totalItems}+ free, open-source 3D VRM avatars`
        : `${totalItems}以上の無料オープンソース3D VRMアバターのコレクションを閲覧`,
    url: `https://opensourceavatars.com/${locale}/gallery`,
    numberOfItems: totalItems,
    about: {
      '@type': 'Thing',
      name: locale === 'en' ? '3D Avatars' : '3Dアバター',
      description:
        locale === 'en'
          ? 'Free VRM format avatars for virtual reality, gaming, and metaverse'
          : 'バーチャルリアリティ、ゲーム、メタバース用の無料VRM形式アバター',
    },
  };

  return (
    <Script id="collection-page-schema" type="application/ld+json" strategy="afterInteractive">
      {JSON.stringify(schema)}
    </Script>
  );
}
