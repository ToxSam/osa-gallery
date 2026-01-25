'use client';

import dynamic from 'next/dynamic';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { AvatarHeader } from '@/components/avatar/AvatarHeader';
import { Info, Smile, Image, Computer } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Suspense, useEffect } from 'react';

// Dynamically import the VRMInspector component with no SSR
const VRMInspector = dynamic(
  () => import('@/components/VRMViewer/VRMInspector'),
  { ssr: false }
);

export default function VRMInspectorPage() {
  const { t } = useI18n();
  const isMobile = useIsMobile();

  useEffect(() => {
    // Update meta tags for VRM Inspector page
    document.title = 'VRM Inspector - Analyze & Preview VRM Avatars | Open Source Avatars';
    
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

    const description = 'Free online VRM avatar inspector and analyzer tool. View metadata, test expressions, inspect materials, analyze textures, and validate VRM files. Perfect for VTubers and VR developers.';
    const ogImageUrl = '/api/og?type=default&title=VRM Inspector Tool&description=Analyze, Preview & Inspect VRM Avatars Online';
    
    updateMetaTag('description', description);
    updateMetaTag('og:title', 'VRM Inspector - Analyze & Preview VRM Avatars');
    updateMetaTag('og:description', description);
    updateMetaTag('og:image', `https://opensourceavatars.com${ogImageUrl}`);
    updateMetaTag('og:url', window.location.href);
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', 'VRM Inspector - Analyze & Preview VRM Avatars');
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', `https://opensourceavatars.com${ogImageUrl}`);
  }, []);

  if (isMobile) {
    return (
      <div className="min-h-screen bg-cream dark:bg-cream-dark transition-colors">
        {/* Header - Higher z-index to stay on top */}
        <div className="relative z-50">
          <AvatarHeader 
            title={t('vrmviewer.mobile.intro.title') as string}
            description={t('vrmviewer.description') as string}
            socialLink="https://github.com/ToxSam/osa-gallery"
            showWarningButton={true}
          />
        </div>

        {/* Desktop Only Notice - Lower z-index */}
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-cream/95 dark:bg-cream-dark/95 backdrop-blur-md">
          <div className="max-w-md p-8 text-center border border-gray-300 dark:border-gray-700 rounded-lg bg-cream dark:bg-gray-900 shadow-lg mx-4">
            <Computer className="w-16 h-16 mx-auto mb-6 text-gray-900 dark:text-gray-100" />
            <h2 className="text-title mb-4 text-gray-900 dark:text-gray-100">
              {t('vrmviewer.mobile.desktopOnly.title')}
            </h2>
            <p className="text-body text-gray-500 dark:text-gray-400">
              {t('vrmviewer.mobile.desktopOnly.description')}
            </p>
          </div>
        </div>

        {/* Mobile Content (shown behind overlay) */}
        <div className="container-custom py-8">
          <h1 className="text-title mb-4 text-gray-900 dark:text-gray-100">{t('vrmviewer.mobile.intro.title')}</h1>
          <p className="text-body text-gray-500 dark:text-gray-400 mb-8">
            {t('vrmviewer.mobile.intro.description')}
          </p>

          {/* Feature List */}
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">{t('vrmviewer.mobile.features.title')}</h2>
              <div className="grid gap-6">
                <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg border border-gray-300 dark:border-gray-700">
                  <div className="flex items-start gap-4">
                    <Info className="w-6 h-6 text-gray-900 dark:text-gray-100 mt-1" />
                    <div>
                      <h3 className="font-medium mb-2 text-gray-900 dark:text-gray-100">{t('vrmviewer.mobile.features.modelInfo.title')}</h3>
                      <p className="text-small text-gray-500 dark:text-gray-400">{t('vrmviewer.mobile.features.modelInfo.description')}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg border border-gray-300 dark:border-gray-700">
                  <div className="flex items-start gap-4">
                    <Smile className="w-6 h-6 text-gray-900 dark:text-gray-100 mt-1" />
                    <div>
                      <h3 className="font-medium mb-2 text-gray-900 dark:text-gray-100">{t('vrmviewer.mobile.features.expressionControl.title')}</h3>
                      <p className="text-small text-gray-500 dark:text-gray-400">{t('vrmviewer.mobile.features.expressionControl.description')}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg border border-gray-300 dark:border-gray-700">
                  <div className="flex items-start gap-4">
                    <Image className="w-6 h-6 text-gray-900 dark:text-gray-100 mt-1" />
                    <div>
                      <h3 className="font-medium mb-2 text-gray-900 dark:text-gray-100">{t('vrmviewer.mobile.features.textureAnalysis.title')}</h3>
                      <p className="text-small text-gray-500 dark:text-gray-400">{t('vrmviewer.mobile.features.textureAnalysis.description')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Coming Soon */}
            <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-xl border border-gray-300 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {t('vrmviewer.mobile.comingSoon.title')}
              </h3>
              <p className="text-body text-gray-500 dark:text-gray-400">
                {t('vrmviewer.mobile.comingSoon.description')}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VRMInspector />
    </Suspense>
  );
}
