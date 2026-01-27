'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface DocBreadcrumbProps {
  items: BreadcrumbItem[];
}

export const DocBreadcrumb: React.FC<DocBreadcrumbProps> = ({ items }) => {
  const { locale } = useI18n();

  // Get the resources page href - use first breadcrumb item if available, otherwise default to /resources
  const getResourcesHref = () => {
    if (items.length > 0 && items[0].href) {
      const href = items[0].href;
      // Check if href already includes a locale prefix
      if (/^\/(en|ja)\//.test(href)) {
        return href;
      }
      // Add locale prefix if it starts with /
      if (href.startsWith('/')) {
        return `/${locale}${href}`;
      }
      return `/${locale}/${href}`;
    }
    return `/${locale}/resources`;
  };
  
  const resourcesHref = getResourcesHref();

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
      <Link
        href={resourcesHref}
        className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors flex items-center"
      >
        <Image
          src="/favicon-32x32.png"
          alt="Resources"
          width={16}
          height={16}
          className="w-4 h-4 invert dark:invert-0"
        />
      </Link>
      {items.map((item, index) => {
        // Check if href already includes a locale prefix
        const hasLocalePrefix = item.href && /^\/(en|ja)\//.test(item.href);
        const href = item.href 
          ? (hasLocalePrefix 
              ? item.href 
              : item.href.startsWith('/') 
                ? `/${locale}${item.href}` 
                : item.href)
          : undefined;
        
        return (
          <React.Fragment key={index}>
            <ChevronRight className="h-4 w-4" />
            {href ? (
              <Link
                href={href}
                className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-900 dark:text-gray-100 font-medium">
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
