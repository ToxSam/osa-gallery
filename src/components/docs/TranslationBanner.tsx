'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface TranslationBannerProps {
  currentLocale: string;
  targetLocale: string;
}

export const TranslationBanner: React.FC<TranslationBannerProps> = ({
  currentLocale,
  targetLocale
}) => {
  const pathname = usePathname();
  
  // Get the path without locale prefix
  const pathWithoutLocale = pathname?.replace(/^\/(en|ja)/, '') || '';
  const englishPath = `/en${pathWithoutLocale}`;
  
  if (currentLocale === 'ja') {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mb-6 rounded-r">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              このページはまだ日本語に翻訳されていません。
            </p>
            <Link 
              href={englishPath}
              className="text-sm text-yellow-900 dark:text-yellow-100 underline font-medium mt-1 inline-block hover:text-yellow-700 dark:hover:text-yellow-300"
            >
              English version →
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return null;
};
