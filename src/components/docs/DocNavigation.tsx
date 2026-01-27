'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface DocNavigationProps {
  previous?: {
    title: string;
    href: string;
  };
  next?: {
    title: string;
    href: string;
  };
}

export const DocNavigation: React.FC<DocNavigationProps> = ({ previous, next }) => {
  const { locale } = useI18n();

  if (!previous && !next) return null;

  return (
    <div className="mt-16 pt-8 pb-16 border-t border-gray-300 dark:border-gray-700">
      <div className="grid md:grid-cols-2 gap-4">
        {previous ? (
          <Link
            href={previous.href.startsWith('/') ? `/${locale}${previous.href}` : previous.href}
            className="group flex items-center gap-3 p-4 border border-gray-300 dark:border-gray-700 rounded-lg hover:border-gray-900 dark:hover:border-gray-300 transition-all hover:bg-gray-50 dark:hover:bg-gray-900/50 bg-white dark:bg-gray-900/30"
          >
            <ChevronLeft className="h-5 w-5 text-gray-400 dark:text-gray-600 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Previous</div>
              <div className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-gray-700 dark:group-hover:text-gray-200 truncate">
                {previous.title}
              </div>
            </div>
          </Link>
        ) : (
          <div></div>
        )}
        
        {next ? (
          <Link
            href={next.href.startsWith('/') ? `/${locale}${next.href}` : next.href}
            className="group flex items-center gap-3 p-4 border border-gray-300 dark:border-gray-700 rounded-lg hover:border-gray-900 dark:hover:border-gray-300 transition-all hover:bg-gray-50 dark:hover:bg-gray-900/50 bg-white dark:bg-gray-900/30 md:ml-auto"
          >
            <div className="flex-1 min-w-0 text-right">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Next</div>
              <div className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-gray-700 dark:group-hover:text-gray-200 truncate">
                {next.title}
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-600 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors flex-shrink-0" />
          </Link>
        ) : null}
      </div>
    </div>
  );
};
