'use client';

import React, { useState, useEffect } from 'react';
import { DocSidebar } from './DocSidebar';
import { DocTOC } from './DocTOC';
import { DocHeader } from './DocHeader';
import { Menu, X } from 'lucide-react';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { usePathname } from 'next/navigation';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface DocLayoutProps {
  children: React.ReactNode;
  breadcrumbItems?: BreadcrumbItem[];
}

export const DocLayout: React.FC<DocLayoutProps> = ({ 
  children,
  breadcrumbItems = []
}) => {
  const pathname = usePathname();
  
  // Derive current section from pathname
  const getCurrentSection = () => {
    if (!pathname) return 'overview';
    
    // Remove locale prefix if present
    const pathWithoutLocale = pathname.replace(/^\/(en|ja)/, '');
    
    if (pathWithoutLocale === '/resources' || pathWithoutLocale === '/resources/') {
      return 'overview';
    }
    
    const parts = pathWithoutLocale.split('/').filter(Boolean);
    const resourcesIndex = parts.indexOf('resources');
    
    if (resourcesIndex === -1) return 'overview';
    
    // Get the section after 'resources'
    const section = parts[resourcesIndex + 1];
    
    // For nested routes, return the parent section for sidebar highlighting
    if (section === 'avatar-collections' || section === 'developers' || section === 'about') {
      return section;
    }
    
    // For specific pages, return the parent section
    if (parts[resourcesIndex + 2]) {
      return section; // Return parent section (avatar-collections, developers, about)
    }
    
    return section || 'overview';
  };
  
  const currentSection = getCurrentSection();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tocItems, setTocItems] = useState<Array<{ id: string; text: string; level: number }>>([]);
  const isMobile = useIsMobile();

  // Extract TOC from headings in the content
  useEffect(() => {
    const extractTOC = () => {
      // Only get headings from the main content area (prose article), not from header/footer
      const contentArea = document.querySelector('article.prose');
      if (!contentArea) return;
      
      const headings = contentArea.querySelectorAll('h2, h3, h4');
      const items: Array<{ id: string; text: string; level: number }> = [];
      
      // Filter out common website navigation headings
      const excludeTexts = ['OSA', 'Navigation', 'Resources', 'Connect', 'Menu'];
      
      headings.forEach((heading) => {
        let text = heading.textContent?.trim() || '';
        
        // Remove any # symbols from the text
        text = text.replace(/^#+\s*/, '').trim();
        
        // Skip if it's a navigation heading
        if (excludeTexts.some(exclude => text.toLowerCase().includes(exclude.toLowerCase()))) {
          return;
        }
        
        // Skip if text is empty after cleaning
        if (!text) {
          return;
        }
        
        const id = heading.id || text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || '';
        const level = parseInt(heading.tagName.charAt(1));
        
        // Set id if not already set
        if (!heading.id && id) {
          heading.id = id;
        }
        
        items.push({ id, text, level });
      });
      
      setTocItems(items);
    };

    // Extract TOC after content is rendered
    const timer = setTimeout(extractTOC, 100);
    return () => clearTimeout(timer);
  }, [children]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    if (sidebarOpen && isMobile) {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        // Check if click is outside sidebar and not on menu button (which is now in DocHeader)
        if (!target.closest('[data-doc-sidebar]') && 
            !target.closest('button[aria-label="Toggle documentation menu"]') &&
            !target.closest('[data-doc-menu-button]')) {
          setSidebarOpen(false);
        }
      };
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [sidebarOpen, isMobile]);

  // Layout offsets:
  // AvatarHeader is 4rem on mobile and 5rem on md+ (see CSS vars in globals.css).
  const avatarHeaderHeight = 'var(--osa-avatar-header-height)';
  const docHeaderHeight = 'var(--osa-doc-header-height)';
  const stackedHeaderHeight = `calc(${avatarHeaderHeight} + ${docHeaderHeight})`;
  
  return (
    <div className="h-screen bg-cream dark:bg-cream-dark flex flex-col transition-colors overflow-hidden">
      {/* Header with Search and Breadcrumbs - Fixed at top */}
      {breadcrumbItems.length > 0 && (
        <DocHeader 
          breadcrumbItems={breadcrumbItems}
          sidebarOpen={sidebarOpen}
          onMenuToggle={isMobile ? () => setSidebarOpen(!sidebarOpen) : undefined}
        />
      )}

      {/* Mobile Menu Button - Only show if no breadcrumbs (shouldn't happen, but keeping for safety) */}
      {isMobile && breadcrumbItems.length === 0 && (
        <button
          data-doc-menu-button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed left-4 z-40 p-2 bg-cream dark:bg-cream-dark/90 backdrop-blur-md border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          style={{
            top: avatarHeaderHeight,
          }}
          aria-label="Toggle documentation menu"
        >
          {sidebarOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      )}

      {/* Content area: flex row; pl for sidebar on lg; sidebar fixed over left padding */}
      <div 
        className="flex-1 flex flex-row min-h-0 relative overflow-hidden pl-0 lg:pl-72"
        style={{ 
          marginTop: breadcrumbItems.length > 0 ? stackedHeaderHeight : avatarHeaderHeight,
          height: breadcrumbItems.length > 0
            ? `calc(100vh - ${stackedHeaderHeight})`
            : `calc(100vh - ${avatarHeaderHeight})`
        }}
      >
        {/* Left Sidebar - Always fixed; overlay on mobile, over pl area on lg */}
        <aside
          data-doc-sidebar
          className={`
            fixed left-0
            w-64 lg:w-72
            bg-cream dark:bg-cream-dark
            border-r border-gray-300 dark:border-gray-700
            overflow-y-auto
            z-30
            transition-transform duration-300 ease-in-out
            ${sidebarOpen || !isMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
          style={{
            top: breadcrumbItems.length > 0 ? stackedHeaderHeight : avatarHeaderHeight,
            height: breadcrumbItems.length > 0
              ? `calc(100vh - ${stackedHeaderHeight})`
              : `calc(100vh - ${avatarHeaderHeight})`
          }}
        >
          <div className="p-4">
            <div className="mt-4">
              <DocSidebar currentSection={currentSection} onNavigate={() => setSidebarOpen(false)} />
            </div>
          </div>
        </aside>

        {/* Main Content - flex-1, scrollable (no overflow-x-hidden to avoid clipping) */}
        <main 
          className="flex-1 min-w-0 overflow-y-auto overflow-x-auto bg-cream dark:bg-cream-dark" 
          data-doc-main-content
        >
          <div className="w-full max-w-4xl mx-auto px-6 md:px-8 lg:px-12 py-12 lg:py-16 box-border min-w-0">
            {children}
          </div>
        </main>

        {/* Right TOC - in-flow on xl */}
        <aside 
          className="hidden xl:flex xl:flex-shrink-0 xl:w-64 xl:overflow-y-auto xl:h-full bg-cream dark:bg-cream-dark border-l border-gray-300 dark:border-gray-700"
        >
          <div className="flex-1 pt-8 px-6 pb-8 min-h-0">
            {tocItems.length > 0 ? (
              <DocTOC items={tocItems} />
            ) : (
              <div className="w-full" aria-hidden="true" />
            )}
          </div>
        </aside>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};
