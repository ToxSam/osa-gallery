import React from "react";
import AvatarGallery from "@/components/avatar/AvatarGallery";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '300+ Free VRM Avatars Gallery | Open Source Avatars',
  description: 'Browse and download 300+ free, high-quality 3D VRM avatars for VR, gaming, VTubing, and metaverse. All CC0 licensed - use them in any project, no attribution required.',
  openGraph: {
    title: '300+ Free VRM Avatars Gallery | Open Source Avatars',
    description: 'Browse and download 300+ free, high-quality 3D VRM avatars for VR, gaming, VTubing, and metaverse. All CC0 licensed.',
    url: 'https://opensourceavatars.com/en/gallery',
    type: 'website',
    images: [
      {
        url: '/api/og?type=gallery&title=Avatar Gallery&description=300+ Free VRM Avatars for VR, Gaming & Metaverse',
        width: 1200,
        height: 630,
        alt: 'Open Source Avatars Gallery',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '300+ Free VRM Avatars Gallery',
    description: 'Browse and download 300+ free, high-quality 3D VRM avatars. All CC0 licensed.',
    images: ['/api/og?type=gallery&title=Avatar Gallery&description=300+ Free VRM Avatars for VR, Gaming & Metaverse'],
  },
};

const GalleryPage = () => {
  return (
    <main className="min-h-screen bg-cream">
      <AvatarGallery />
    </main>
  );
};

export default GalleryPage; 