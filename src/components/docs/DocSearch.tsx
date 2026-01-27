'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useRouter } from 'next/navigation';
import type { SearchResult } from '@/lib/search';

interface DocSearchProps {
  onResultClick?: (id: string) => void;
}

export const DocSearch: React.FC<DocSearchProps> = ({ onResultClick }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { locale } = useI18n();
  const router = useRouter();

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`/api/docs/search?q=${encodeURIComponent(query)}&locale=${locale}`);
        if (response.ok) {
          const data = await response.json();
          setResults(data.results || []);
        }
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, locale]);

  const handleSelect = useCallback((result: SearchResult) => {
    router.push(result.href);
    onResultClick?.(result.id);
    setQuery('');
    setIsOpen(false);
  }, [router, onResultClick]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && focusedIndex >= 0 && results[focusedIndex]) {
      e.preventDefault();
      handleSelect(results[focusedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setFocusedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search documentation..."
          className="w-full pl-10 pr-10 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent transition-colors"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Search Results */}
      {isOpen && (isLoading || results.length > 0 || (query && !isLoading)) && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
              Searching...
            </div>
          ) : results.length > 0 ? (
            results.map((result, index) => (
              <button
                key={`${result.id}-${index}`}
                onClick={() => handleSelect(result)}
                onMouseEnter={() => setFocusedIndex(index)}
                className={`
                  w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
                  ${focusedIndex === index ? 'bg-gray-100 dark:bg-gray-700' : ''}
                  ${index === 0 ? 'rounded-t-lg' : ''}
                  ${index === results.length - 1 ? 'rounded-b-lg' : ''}
                `}
              >
                <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                  {result.title}
                </div>
                {result.description && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                    {result.description}
                  </div>
                )}
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
};
