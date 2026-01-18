'use client';

import { usePathname } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { ChevronDown, Globe } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

type Locale = 'en' | 'ja';

const languages: Record<Locale, { name: string; short: string }> = {
  en: { name: 'English', short: 'EN' },
  ja: { name: '日本語', short: 'JA' },
};

export function LanguageSelector() {
  const pathname = usePathname();
  const { locale, setLocale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle mounting to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (newLocale: Locale) => {
    // Update the locale in our i18n context
    setLocale(newLocale);
    
    // Get the current path segments
    const segments = pathname.split('/').filter(Boolean);
    
    // Remove the current locale from the path if it exists
    const pathWithoutLocale = segments.length > 0 && ['en', 'ja'].includes(segments[0])
      ? '/' + segments.slice(1).join('/')
      : pathname;
    
    // Create the new path with the new locale
    const newPath = `/${newLocale}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`;
    window.location.href = newPath;
    setIsOpen(false);
  };

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 min-w-[60px]">
        <Globe className="h-3.5 w-3.5" />
        <span>...</span>
      </div>
    );
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200
                   bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800
                   text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100
                   border border-gray-300 dark:border-gray-700
                   focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        aria-label="Select language"
      >
        <Globe className="h-3.5 w-3.5" />
        <span className="font-semibold">{languages[locale as Locale].short}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 origin-top-right rounded-lg shadow-lg 
                        bg-cream dark:bg-gray-900 
                        border border-gray-300 dark:border-gray-700
                        ring-1 ring-black ring-opacity-5 dark:ring-white dark:ring-opacity-10
                        focus:outline-none z-50
                        animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {(Object.entries(languages) as [Locale, typeof languages[Locale]][]).map(([code, lang]) => (
              <button
                key={code}
                onClick={() => handleLanguageChange(code)}
                className={`
                  w-full px-4 py-2.5 text-left text-sm transition-colors duration-150
                  ${locale === code
                    ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                  ${code === 'en' ? 'rounded-t-lg' : ''}
                  ${code === 'ja' ? 'rounded-b-lg' : ''}
                `}
                role="menuitem"
              >
                <div className="flex items-center justify-between">
                  <span>{lang.name}</span>
                  {locale === code && (
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 