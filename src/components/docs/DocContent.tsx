'use client';

import React, { useEffect } from 'react';

interface DocContentProps {
  children: React.ReactNode;
}

/**
 * Component that automatically adds IDs to headings for TOC navigation
 */
export const DocContent: React.FC<DocContentProps> = ({ children }) => {
  useEffect(() => {
    const addHeadingIds = () => {
      const headings = document.querySelectorAll('.prose h2, .prose h3, .prose h4');
      
      headings.forEach((heading) => {
        // Skip if already has an ID
        if (heading.id) return;

        const text = heading.textContent || '';
        
        // Generate ID if not present
        const id = text.toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();
        
        if (id) {
          heading.id = id;
        }
      });
    };

    // Run after content is rendered
    const timer = setTimeout(addHeadingIds, 100);
    
    // Re-run when content changes
    const observer = new MutationObserver(addHeadingIds);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [children]);

  return <>{children}</>;
};
