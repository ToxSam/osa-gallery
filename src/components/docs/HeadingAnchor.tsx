'use client';

import React from 'react';
import { Hash } from 'lucide-react';

interface HeadingAnchorProps {
  id: string;
  level: 2 | 3 | 4;
}

export const HeadingAnchor: React.FC<HeadingAnchorProps> = ({ id, level }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      // Update URL hash
      window.history.pushState(null, '', `#${id}`);
    }
  };

  return (
    <a
      href={`#${id}`}
      onClick={handleClick}
      className="absolute -left-6 top-0 opacity-0 group-hover:opacity-100 text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-opacity"
      aria-label={`Link to ${id}`}
    >
      <Hash className="h-4 w-4" />
    </a>
  );
};
