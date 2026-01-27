'use client';

import React, { useEffect, useState } from 'react';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface DocTOCProps {
  items: TOCItem[];
}

export const DocTOC: React.FC<DocTOCProps> = ({ items }) => {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const handleScroll = () => {
      // Find the main content scroll container
      const mainContent = document.querySelector('main[data-doc-main-content]');
      if (!mainContent) return;

      const headings = items.map((item) => {
        const element = document.getElementById(item.id);
        if (!element) return null;
        
        // Get position relative to the scroll container
        const containerRect = mainContent.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const top = elementRect.top - containerRect.top;
        
        return { id: item.id, top };
      }).filter(Boolean) as Array<{ id: string; top: number }>;

      // Find the heading closest to the top (within 150px from container top)
      const current = headings
        .filter((h) => h.top <= 150)
        .sort((a, b) => b.top - a.top)[0];

      if (current) {
        setActiveId(current.id);
      } else if (headings.length > 0 && headings[0].top > 150) {
        // If we're above all headings, don't highlight any
        setActiveId('');
      }
    };

    // Listen to scroll on the main content area, not window
    const mainContent = document.querySelector('main[data-doc-main-content]');
    if (mainContent) {
      mainContent.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll(); // Initial check
      return () => mainContent.removeEventListener('scroll', handleScroll);
    }
  }, [items]);

  if (items.length === 0) return null;

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    const mainContent = document.querySelector('main[data-doc-main-content]') as HTMLElement;
    
    if (element && mainContent) {
      const offset = 100; // Account for header
      const containerRect = mainContent.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const scrollTop = mainContent.scrollTop;
      const elementTop = elementRect.top - containerRect.top + scrollTop;
      const offsetPosition = elementTop - offset;
      
      mainContent.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      window.history.pushState(null, '', `#${id}`);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider leading-none">
          On This Page
        </h3>
      </div>
      <nav className="space-y-1">
        {items.map((item) => {
          // Clean text - remove any # symbols
          const cleanText = item.text.replace(/^#+\s*/, '').trim();
          
          // Better indentation matching GitBook style
          const indent = item.level === 2 ? 0 : item.level === 3 ? 16 : 32;
          const isActive = activeId === item.id;

          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                scrollToHeading(item.id);
              }}
              className={`
                relative block text-sm transition-all py-1.5 rounded-md
                ${isActive
                  ? 'text-gray-900 dark:text-gray-100 font-medium bg-gray-100 dark:bg-gray-800/60'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800/30'
                }
                ${item.level === 2 ? 'font-semibold' : 'font-normal'}
              `}
              style={{ paddingLeft: `${indent}px` }}
            >
              <span className="line-clamp-2">{cleanText}</span>
            </a>
          );
        })}
      </nav>
    </div>
  );
};
