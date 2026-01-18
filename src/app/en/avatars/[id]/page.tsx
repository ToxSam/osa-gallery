'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AvatarHeader } from '@/components/avatar/AvatarHeader';
import { Footer } from '@/components/Footer';
import { VRMViewer } from '@/components/VRMViewer/VRMViewer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, ArrowLeft, Share2, Github, Box, Layers, Image as ImageIcon } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { AvatarProductSchema, BreadcrumbSchema } from '@/components/StructuredData';

interface Avatar {
  id: string;
  name: string;
  project: string;
  projectId: string;
  description: string;
  thumbnailUrl: string;
  modelFileUrl: string;
  polygonCount: number;
  format: string;
  materialCount: number;
  isPublic: boolean;
  createdAt: string;
  metadata?: any;
}

export default function AvatarDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useI18n();
  const [avatar, setAvatar] = useState<Avatar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvatar = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/avatars');
        
        if (!response.ok) {
          throw new Error('Failed to fetch avatars');
        }

        const data = await response.json();
        const foundAvatar = data.avatars.find((a: Avatar) => a.id === params.id);

        if (!foundAvatar) {
          setError('Avatar not found');
          return;
        }

        setAvatar(foundAvatar);
      } catch (err) {
        console.error('Error fetching avatar:', err);
        setError('Failed to load avatar');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchAvatar();
    }
  }, [params.id]);

  const handleDownload = async () => {
    if (!avatar) return;
    
    try {
      const response = await fetch(`/api/avatars/${avatar.id}/direct-download`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${avatar.name}.${avatar.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download avatar');
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const text = `Check out ${avatar?.name} - Free 3D Avatar`;

    if (navigator.share) {
      try {
        await navigator.share({ title: avatar?.name, text, url });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream dark:bg-cream-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading avatar...</p>
        </div>
      </div>
    );
  }

  if (error || !avatar) {
    return (
      <div className="min-h-screen bg-cream dark:bg-cream-dark flex flex-col">
        <AvatarHeader 
          title="Open Source Avatars"
          description="Avatar not found"
          socialLink="https://x.com/toxsam"
        />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-headline mb-4 text-gray-900 dark:text-gray-100">Avatar Not Found</h1>
            <p className="text-body-lg text-gray-500 dark:text-gray-400 mb-8">
              The avatar you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => router.push('/gallery')} className="btn-primary">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Gallery
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-cream-dark flex flex-col">
      {/* Structured Data */}
      <AvatarProductSchema avatar={avatar} locale="en" />
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: 'https://opensourceavatars.com/en' },
          { name: 'Gallery', url: 'https://opensourceavatars.com/en/gallery' },
          { name: avatar.name, url: `https://opensourceavatars.com/en/avatars/${avatar.id}` },
        ]}
      />
      
      <AvatarHeader 
        title={avatar.name}
        description={avatar.description || `Free 3D VRM Avatar - ${avatar.project}`}
        socialLink="https://x.com/toxsam"
      />

      <main className="flex-1 section-padding">
        <div className="container-custom">
          {/* Breadcrumb */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/gallery')}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Gallery
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* 3D Viewer */}
            <div className="relative">
              <div className="aspect-square bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700">
                <VRMViewer 
                  url={avatar.modelFileUrl}
                  animationUrl={null}
                  backgroundGLB={null}
                  onMetadataLoad={() => {}}
                  showInfoPanel={false}
                  onToggleInfoPanel={() => {}}
                />
              </div>
            </div>

            {/* Avatar Details */}
            <div className="space-y-6">
              <div>
                <div className="inline-block bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium mb-4">
                  {avatar.project}
                </div>
                <h1 className="text-headline mb-4 text-gray-900 dark:text-gray-100">{avatar.name}</h1>
                <p className="text-body-lg text-gray-500 dark:text-gray-400">
                  {avatar.description || 'A high-quality 3D avatar ready for use in VR, games, and the metaverse.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 flex-wrap">
                <Button onClick={handleDownload} className="btn-primary flex-1 sm:flex-none">
                  <Download className="mr-2 h-4 w-4" />
                  Download {avatar.format.toUpperCase()}
                </Button>
                <Button onClick={handleShare} variant="outline" className="btn-outline">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Technical Specs */}
              <Card className="border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <CardContent className="pt-6">
                  <h3 className="text-title mb-4 text-gray-900 dark:text-gray-100">Technical Specifications</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <Box className="h-4 w-4" />
                        <span>Format</span>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {avatar.format.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <Layers className="h-4 w-4" />
                        <span>Polygons</span>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {avatar.polygonCount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <ImageIcon className="h-4 w-4" />
                        <span>Materials</span>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {avatar.materialCount}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* License Info */}
              <Card className="border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <CardContent className="pt-6">
                  <h3 className="text-title mb-4 text-gray-900 dark:text-gray-100">License & Usage</h3>
                  <p className="text-body text-gray-500 dark:text-gray-400 mb-4">
                    This avatar is released under a <strong className="text-gray-900 dark:text-gray-100">CC0 license</strong>, 
                    making it completely free to use for any purpose, including commercial projects.
                  </p>
                  <ul className="space-y-2 text-body text-gray-500 dark:text-gray-400">
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-gray-900 dark:bg-gray-100 rounded-full mt-2"></span>
                      <span>Use in commercial and non-commercial projects</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-gray-900 dark:bg-gray-100 rounded-full mt-2"></span>
                      <span>Modify and create derivatives</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-gray-900 dark:bg-gray-100 rounded-full mt-2"></span>
                      <span>No attribution required (but appreciated!)</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Additional Info */}
              <div className="text-caption text-gray-500 dark:text-gray-400">
                <p>Created: {new Date(avatar.createdAt).toLocaleDateString()}</p>
                <p className="mt-2">
                  Part of the{' '}
                  <a 
                    href="https://github.com/ToxSam/open-source-avatars" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300 underline"
                  >
                    Open Source Avatars
                  </a>
                  {' '}collection
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
