'use client';

import React from 'react';
import { DocSearch } from './DocSearch';
import { DocBreadcrumb } from './DocBreadcrumb';
import { Menu, X } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface DocHeaderProps {
  breadcrumbItems: BreadcrumbItem[];
  sidebarOpen?: boolean;
  onMenuToggle?: () => void;
}

export const DocHeader: React.FC<DocHeaderProps> = ({ 
  breadcrumbItems,
  sidebarOpen = false,
  onMenuToggle
}) => {
  return (
    <div
      className="fixed left-0 right-0 z-40 bg-cream dark:bg-cream-dark/90 backdrop-blur-md border-b border-gray-300 dark:border-gray-700 h-24 md:h-20 flex items-center"
      style={{ top: 'var(--osa-avatar-header-height)' }}
    >
      {/* Align with content: same pl as content area (sidebar) + content padding */}
      <div className="w-full flex justify-start pl-4 md:pl-8 lg:pl-[calc(18rem+3rem)] pr-6 md:pr-8 lg:pr-12">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3 w-full md:w-auto max-w-4xl">
          {/* Mobile: First row - Hamburger and Search side by side */}
          <div className="flex items-center gap-2 w-full md:w-80 md:flex-shrink-0">
            {/* Mobile Menu Button - Left side of search bar */}
            {onMenuToggle && (
              <button
                data-doc-menu-button
                onClick={onMenuToggle}
                className="md:hidden p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors flex-shrink-0"
                aria-label="Toggle documentation menu"
              >
                {sidebarOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            )}
            <div className="flex-1 md:flex-none">
              <DocSearch />
            </div>
          </div>
          {/* Mobile: Second row - Breadcrumbs below */}
          <div className="md:border-l md:border-gray-300 dark:md:border-gray-700 md:pl-3 flex-shrink-0">
            <DocBreadcrumb items={breadcrumbItems} />
          </div>
        </div>
      </div>
    </div>
  );
};
