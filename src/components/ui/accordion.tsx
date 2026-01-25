'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccordionItemProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function AccordionItem({ title, defaultOpen = false, children, className }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn('border-b border-gray-200 dark:border-gray-700 min-w-0 max-w-full overflow-hidden', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 px-2 sm:px-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors min-w-0 max-w-full"
      >
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider truncate min-w-0 flex-1 text-left">
          {title}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform flex-shrink-0',
            isOpen && 'transform rotate-180'
          )}
        />
      </button>
      {isOpen && (
        <div className="px-2 sm:px-4 pb-4 pt-2 min-w-0 max-w-full overflow-hidden">
          {children}
        </div>
      )}
    </div>
  );
}

interface AccordionProps {
  children: React.ReactNode;
  className?: string;
}

export function Accordion({ children, className }: AccordionProps) {
  return (
    <div className={cn('space-y-0 min-w-0 max-w-full overflow-hidden w-full', className)}>
      {children}
    </div>
  );
}
