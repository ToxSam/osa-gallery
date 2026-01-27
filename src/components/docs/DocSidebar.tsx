'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { usePathname } from 'next/navigation';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  children?: NavItem[];
}

interface DocSidebarProps {
  currentSection?: string;
  onNavigate?: () => void;
}

const navStructure: NavItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    href: '/resources',
  },
  {
    id: 'collections',
    label: 'Avatar Collections',
    href: '/resources/avatar-collections',
  },
  {
    id: 'developers',
    label: 'For Developers',
    href: '/resources/developers',
    children: [
      {
        id: 'database',
        label: 'Avatar Database',
        href: '/resources/developers/database',
      },
      {
        id: 'website',
        label: 'Website Source Code',
        href: '/resources/developers/website',
      },
    ],
  },
  {
    id: 'about',
    label: 'About',
    href: '/resources/about',
    children: [
      {
        id: 'vrm',
        label: 'VRM Format',
        href: '/resources/about/vrm',
      },
      {
        id: 'ardrive',
        label: 'ArDrive Storage',
        href: '/resources/about/ardrive',
      },
      {
        id: 'philosophy',
        label: 'Open Source Philosophy',
        href: '/resources/about/philosophy',
      },
      {
        id: 'license',
        label: 'License Guide',
        href: '/resources/about/license',
      },
    ],
  },
  {
    id: 'help',
    label: 'Help & Contact',
    href: '/resources/help',
  },
];

interface NavItemComponentProps {
  item: NavItem;
  currentSection: string;
  level?: number;
  onNavigate?: () => void;
}

const NavItemComponent: React.FC<NavItemComponentProps> = ({
  item,
  currentSection,
  level = 0,
  onNavigate,
}) => {
  const pathname = usePathname();
  const { locale } = useI18n();
  const href = item.href.startsWith('/') ? `/${locale}${item.href}` : item.href;
  const hasChildren = item.children && item.children.length > 0;
  
  // Check if any child is active
  const hasActiveChild = hasChildren && item.children?.some(child => {
    const childHref = child.href.startsWith('/') ? `/${locale}${child.href}` : child.href;
    return pathname === childHref;
  });
  
  const [isOpen, setIsOpen] = useState(
    hasActiveChild ||
    (hasChildren && pathname?.startsWith(href + '/')) ||
    level === 0 // Open top-level items by default
  );
  
  // Check if current pathname matches this item or any of its children
  const isActive = pathname === href || pathname?.startsWith(href + '/') || 
    (hasChildren && item.children?.some(child => {
      const childHref = child.href.startsWith('/') ? `/${locale}${child.href}` : child.href;
      return pathname === childHref;
    }));

  const handleLinkClick = (e: React.MouseEvent) => {
    // Allow navigation to folder pages - don't prevent default
    // Only prevent if clicking the chevron button
    if (!hasChildren) {
      onNavigate?.();
    }
  };
  
  const handleChevronClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  // Check if this exact page is active (not just parent)
  const isExactActive = pathname === href;
  
  return (
    <div className="mb-0.5">
      <Link
        href={href}
        onClick={handleLinkClick}
        className={`
          relative flex items-center gap-2 py-1.5 text-sm transition-colors
          ${isExactActive
            ? 'text-gray-900 dark:text-gray-100 font-medium bg-gray-100 dark:bg-gray-800/60'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }
          ${level > 0 ? 'pl-8' : 'pl-3'}
          ${isExactActive ? 'border-l-2 border-gray-900 dark:border-gray-100' : ''}
        `}
      >
        {hasChildren && (
          <button
            onClick={handleChevronClick}
            className="flex-shrink-0 w-4 h-4 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          >
            {isOpen ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        )}
        {!hasChildren && level > 0 && <span className="w-4" />}
        <span className="flex-1">{item.label}</span>
      </Link>

      {hasChildren && isOpen && (
        <div className="mt-0.5 space-y-0.5">
          {(item.children || []).map((child) => (
            <NavItemComponent
              key={child.id}
              item={child}
              currentSection={currentSection}
              level={level + 1}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const DocSidebar: React.FC<DocSidebarProps> = ({ 
  currentSection = 'overview',
  onNavigate 
}) => {
  return (
    <nav className="space-y-0.5">
      {navStructure.map((item) => (
        <NavItemComponent
          key={item.id}
          item={item}
          currentSection={currentSection}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
};
