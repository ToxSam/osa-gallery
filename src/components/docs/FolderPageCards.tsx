'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface FolderPage {
  title: string;
  description: string;
  href: string;
}

interface FolderPageCardsProps {
  pages: FolderPage[];
}

export const FolderPageCards: React.FC<FolderPageCardsProps> = ({ pages }) => {
  const { locale } = useI18n();

  if (!pages || pages.length === 0) return null;

  return (
    <div className="my-12">
      <div className="grid md:grid-cols-2 gap-4">
        {pages.map((page, index) => {
          const href = page.href.startsWith('/') ? `/${locale}${page.href}` : page.href;
          
          return (
            <Link
              key={index}
              href={href}
              className="group flex items-center justify-between p-6 border border-gray-300 dark:border-gray-700 rounded-lg hover:border-gray-900 dark:hover:border-gray-300 transition-all hover:bg-gray-50 dark:hover:bg-gray-900/50 bg-white dark:bg-gray-900/30"
            >
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2 group-hover:text-gray-700 dark:group-hover:text-gray-200">
                  {page.title}
                </h3>
                {page.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {page.description}
                  </p>
                )}
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-600 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors flex-shrink-0 ml-4" />
            </Link>
          );
        })}
      </div>
    </div>
  );
};
