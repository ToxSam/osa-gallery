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

        // Update meta tags dynamically
        if (foundAvatar) {
          const ogImageUrl = `/api/og?type=avatar&avatarName=${encodeURIComponent(foundAvatar.name)}&project=${encodeURIComponent(foundAvatar.project)}&thumbnail=${encodeURIComponent(foundAvatar.thumbnailUrl || '')}`;
          const pageTitle = `${foundAvatar.name} - 無料VRMアバター | Open Source Avatars`;
          const pageDescription = `${foundAvatar.name}をダウンロード - ${foundAvatar.project}の無料3D VRMアバター。CC0ライセンス、${foundAvatar.polygonCount.toLocaleString()}ポリゴン、VR、ゲーム、メタバース対応。`;

          // Update document title
          document.title = pageTitle;

          // Update or create meta tags
          const updateMetaTag = (property: string, content: string) => {
            let meta = document.querySelector(`meta[property="${property}"]`) || 
                       document.querySelector(`meta[name="${property}"]`);
            if (!meta) {
              meta = document.createElement('meta');
              if (property.startsWith('og:') || property.startsWith('twitter:')) {
                meta.setAttribute('property', property);
              } else {
                meta.setAttribute('name', property);
              }
              document.head.appendChild(meta);
            }
            meta.setAttribute('content', content);
          };

          updateMetaTag('description', pageDescription);
          updateMetaTag('og:title', pageTitle);
          updateMetaTag('og:description', pageDescription);
          updateMetaTag('og:image', `https://opensourceavatars.com${ogImageUrl}`);
          updateMetaTag('og:url', window.location.href);
          updateMetaTag('twitter:card', 'summary_large_image');
          updateMetaTag('twitter:title', pageTitle);
          updateMetaTag('twitter:description', pageDescription);
          updateMetaTag('twitter:image', `https://opensourceavatars.com${ogImageUrl}`);
        }
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
      alert('ダウンロードに失敗しました');
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const text = `${avatar?.name}をチェック - 無料3Dアバター`;

    if (navigator.share) {
      try {
        await navigator.share({ title: avatar?.name, text, url });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('リンクをコピーしました！');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream dark:bg-cream-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !avatar) {
    return (
      <div className="min-h-screen bg-cream dark:bg-cream-dark flex flex-col">
        <AvatarHeader 
          title="Open Source Avatars"
          description="アバターが見つかりません"
          socialLink="https://x.com/toxsam"
        />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-headline mb-4 text-gray-900 dark:text-gray-100">アバターが見つかりません</h1>
            <p className="text-body-lg text-gray-500 dark:text-gray-400 mb-8">
              お探しのアバターは存在しないか、削除されました。
            </p>
            <Button onClick={() => router.push('/gallery')} className="btn-primary">
              <ArrowLeft className="mr-2 h-4 w-4" />
              ギャラリーに戻る
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
      <AvatarProductSchema avatar={avatar} locale="ja" />
      <BreadcrumbSchema
        items={[
          { name: 'ホーム', url: 'https://opensourceavatars.com/ja' },
          { name: 'ギャラリー', url: 'https://opensourceavatars.com/ja/gallery' },
          { name: avatar.name, url: `https://opensourceavatars.com/ja/avatars/${avatar.id}` },
        ]}
      />
      
      <AvatarHeader 
        title={avatar.name}
        description={avatar.description || `無料3D VRMアバター - ${avatar.project}`}
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
              ギャラリーに戻る
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
                  {avatar.description || 'VR、ゲーム、メタバースで使用できる高品質な3Dアバターです。'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 flex-wrap">
                <Button onClick={handleDownload} className="btn-primary flex-1 sm:flex-none">
                  <Download className="mr-2 h-4 w-4" />
                  {avatar.format.toUpperCase()}をダウンロード
                </Button>
                <Button onClick={handleShare} variant="outline" className="btn-outline">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Technical Specs */}
              <Card className="border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <CardContent className="pt-6">
                  <h3 className="text-title mb-4 text-gray-900 dark:text-gray-100">技術仕様</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <Box className="h-4 w-4" />
                        <span>フォーマット</span>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {avatar.format.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <Layers className="h-4 w-4" />
                        <span>ポリゴン数</span>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {avatar.polygonCount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <ImageIcon className="h-4 w-4" />
                        <span>マテリアル数</span>
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
                  <h3 className="text-title mb-4 text-gray-900 dark:text-gray-100">ライセンスと使用方法</h3>
                  <p className="text-body text-gray-500 dark:text-gray-400 mb-4">
                    このアバターは<strong className="text-gray-900 dark:text-gray-100">CC0ライセンス</strong>で公開されており、
                    商用プロジェクトを含むあらゆる用途で完全に無料で使用できます。
                  </p>
                  <ul className="space-y-2 text-body text-gray-500 dark:text-gray-400">
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-gray-900 dark:bg-gray-100 rounded-full mt-2"></span>
                      <span>商用・非商用プロジェクトでの使用</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-gray-900 dark:bg-gray-100 rounded-full mt-2"></span>
                      <span>改変および派生作品の作成</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-gray-900 dark:bg-gray-100 rounded-full mt-2"></span>
                      <span>クレジット表記不要（表記していただけると嬉しいです！）</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Additional Info */}
              <div className="text-caption text-gray-500 dark:text-gray-400">
                <p>作成日: {new Date(avatar.createdAt).toLocaleDateString('ja-JP')}</p>
                <p className="mt-2">
                  <a 
                    href="https://github.com/ToxSam/open-source-avatars" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300 underline"
                  >
                    Open Source Avatars
                  </a>
                  コレクションの一部
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
