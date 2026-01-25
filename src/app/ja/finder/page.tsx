import React, { Suspense } from "react";
import Finder from "@/components/finder/Finder";
import { LoadingScreen } from "@/components/ui/loading-screen";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'アバターファインダー - 一括ダウンロード | Open Source Avatars',
  description: '複数のアバターを一度に閲覧・ダウンロード。VRM、FBXなどのアバターフォーマットを一括ダウンロードするファイルブラウザーインターフェース。',
  openGraph: {
    title: 'アバターファインダー - 一括ダウンロード | Open Source Avatars',
    description: '複数のアバターを一度に閲覧・ダウンロード。VRM、FBXなどのアバターフォーマットを一括ダウンロードするファイルブラウザーインターフェース。',
    url: 'https://opensourceavatars.com/ja/finder',
    type: 'website',
    images: [
      {
        url: '/api/og?type=finder&title=アバターファインダー&description=複数のアバターを一括ダウンロード',
        width: 1200,
        height: 630,
        alt: 'Open Source Avatars ファインダー',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'アバターファインダー - 一括ダウンロード',
    description: '複数のアバターを一度に閲覧・ダウンロード。',
    images: ['/api/og?type=finder&title=アバターファインダー&description=複数のアバターを一括ダウンロード'],
  },
};

const FinderPage = () => {
  return (
    <main className="min-h-screen bg-cream dark:bg-cream-dark">
      <Suspense fallback={<LoadingScreen />}>
        <Finder />
      </Suspense>
    </main>
  );
};

export default FinderPage;
