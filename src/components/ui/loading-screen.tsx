'use client';

import React from 'react';
import { CrescentSpinner } from './crescent-spinner';
import { useI18n } from '@/lib/i18n';

interface LoadingScreenProps {
  message?: string;
  className?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message,
  className = '' 
}) => {
  const { t } = useI18n();
  const loadingText = message || t('common.loading');

  return (
    <div className={`min-h-screen flex items-center justify-center bg-cream dark:bg-gray-950 ${className}`}>
      <div className="text-center">
        <CrescentSpinner size="md" className="mx-auto mb-4" />
        <p className="text-white dark:text-white text-sm font-medium">
          {loadingText}
        </p>
      </div>
    </div>
  );
};
