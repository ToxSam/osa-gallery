import React, { Suspense } from "react";
import Finder from "@/components/finder/Finder";
import { LoadingScreen } from "@/components/ui/loading-screen";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Avatar Finder - Batch Download | Open Source Avatars',
  description: 'Browse and download multiple avatars at once. File browser interface for batch downloading VRM, FBX, and other avatar formats.',
  openGraph: {
    title: 'Avatar Finder - Batch Download | Open Source Avatars',
    description: 'Browse and download multiple avatars at once. File browser interface for batch downloading VRM, FBX, and other avatar formats.',
    url: 'https://opensourceavatars.com/finder',
    type: 'website',
    images: [
      {
        url: '/api/og?type=finder&title=Avatar Finder&description=Batch Download Multiple Avatars',
        width: 1200,
        height: 630,
        alt: 'Open Source Avatars Finder',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Avatar Finder - Batch Download',
    description: 'Browse and download multiple avatars at once.',
    images: ['/api/og?type=finder&title=Avatar Finder&description=Batch Download Multiple Avatars'],
  },
};

const FinderPage = () => {
  return (
    <main className="h-screen bg-cream dark:bg-cream-dark overflow-hidden">
      <Suspense fallback={<LoadingScreen />}>
        <Finder />
      </Suspense>
    </main>
  );
};

export default FinderPage;
