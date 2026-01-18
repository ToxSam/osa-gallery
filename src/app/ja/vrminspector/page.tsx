'use client';

import dynamic from 'next/dynamic';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { AvatarHeader } from '@/components/avatar/AvatarHeader';
import { Info, Smile, Image, Computer } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Suspense } from 'react';

// Dynamically import the VRMInspector component with no SSR
const VRMInspector = dynamic(
  () => import('@/components/VRMViewer/VRMInspector'),
  { ssr: false }
);

export default function VRMInspectorPage() {
  const { t } = useI18n();
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="min-h-screen bg-cream">
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
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-cream bg-opacity-90 backdrop-blur-sm">
          <div className="max-w-md p-8 text-center">
            <Computer className="w-16 h-16 mx-auto mb-6 text-blue-600" />
            <h2 className="text-2xl font-bold mb-4">
              {t('vrmviewer.mobile.desktopOnly.title')}
            </h2>
            <p className="text-gray-600">
              {t('vrmviewer.mobile.desktopOnly.description')}
            </p>
          </div>
        </div>

        {/* Mobile Content (shown behind overlay) */}
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-4">{t('vrmviewer.mobile.intro.title')}</h1>
          <p className="text-gray-600 mb-8">
            {t('vrmviewer.mobile.intro.description')}
          </p>

          {/* Feature List */}
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-semibold mb-4">{t('vrmviewer.mobile.features.title')}</h2>
              <div className="grid gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-start gap-4">
                    <Info className="w-6 h-6 text-blue-600 mt-1" />
                    <div>
                      <h3 className="font-medium">{t('vrmviewer.mobile.features.modelInfo.title')}</h3>
                      <p className="text-sm text-gray-600">{t('vrmviewer.mobile.features.modelInfo.description')}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-start gap-4">
                    <Smile className="w-6 h-6 text-blue-600 mt-1" />
                    <div>
                      <h3 className="font-medium">{t('vrmviewer.mobile.features.expressionControl.title')}</h3>
                      <p className="text-sm text-gray-600">{t('vrmviewer.mobile.features.expressionControl.description')}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-start gap-4">
                    <Image className="w-6 h-6 text-blue-600 mt-1" />
                    <div>
                      <h3 className="font-medium">{t('vrmviewer.mobile.features.textureAnalysis.title')}</h3>
                      <p className="text-sm text-gray-600">{t('vrmviewer.mobile.features.textureAnalysis.description')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Coming Soon */}
            <div className="bg-blue-50 p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                {t('vrmviewer.mobile.comingSoon.title')}
              </h3>
              <p className="text-blue-700">
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