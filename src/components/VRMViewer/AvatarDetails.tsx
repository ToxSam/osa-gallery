'use client';

import React from 'react';
import { useI18n } from '@/lib/i18n';

type AvatarMetadata = {
  triangleCount: number;
  materialCount: number;
  format: string;
  vrmVersion: string | number;
  title?: string;
  version?: string;
  author?: string;
  license?: string;
  licenseType?: string;
  allowedUserName?: string;
};

interface AvatarDetailsProps {
  metadata: AvatarMetadata;
}

export const AvatarDetails: React.FC<AvatarDetailsProps> = ({ metadata }) => {
  const { t } = useI18n();

  return (
    <div className="bg-cream/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
      {metadata.title && (
        <h2 className="text-xl font-bold mb-4">{metadata.title}</h2>
      )}

      {/* Technical Details Section */}
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900 mb-2">
          {t('avatar.details.title')}
        </h3>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
          <dt className="text-gray-600">{t('avatar.details.format')}</dt>
          <dd className="text-gray-900">{metadata.format}</dd>
          
          <dt className="text-gray-600">{t('avatar.details.polygons')}</dt>
          <dd className="text-gray-900">{metadata.triangleCount.toLocaleString()}</dd>
          
          <dt className="text-gray-600">{t('avatar.details.materials')}</dt>
          <dd className="text-gray-900">{metadata.materialCount}</dd>
          
          {metadata.author && (
            <>
              <dt className="text-gray-600">{t('avatar.details.author')}</dt>
              <dd className="text-gray-900">{metadata.author}</dd>
            </>
          )}
          
          {metadata.licenseType && (
            <>
              <dt className="text-gray-600">{t('avatar.details.license')}</dt>
              <dd className="text-gray-900">{metadata.licenseType}</dd>
            </>
          )}
        </dl>
      </div>

      {/* VRM Information Section */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-2">
          {t('avatar.vrm.title')}
        </h3>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
          <dt className="text-gray-600">{t('avatar.vrm.version')}</dt>
          <dd className="text-gray-900">{metadata.vrmVersion}</dd>
          
          {metadata.allowedUserName && (
            <>
              <dt className="text-gray-600">{t('avatar.vrm.allowedUsers')}</dt>
              <dd className="text-gray-900">
                {metadata.allowedUserName === 'Everyone' 
                  ? t('avatar.vrm.everyone')
                  : metadata.allowedUserName}
              </dd>
            </>
          )}
        </dl>
      </div>
    </div>
  );
}; 