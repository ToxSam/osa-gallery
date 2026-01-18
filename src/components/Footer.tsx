'use client';

import React from 'react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';

export const Footer: React.FC = () => {
  const { locale } = useI18n();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-gray-300 dark:border-gray-700 bg-cream dark:bg-cream-dark py-20 md:py-32 transition-colors">
      <div className="max-w-7xl mx-auto px-6 md:px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-1">
            <Link href={`/${locale}`} className="inline-block mb-4">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                OSA
              </h3>
            </Link>
            <p className="text-small text-gray-500 dark:text-gray-400 leading-relaxed">
              The home of truly free avatars and tools.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-caption text-gray-900 dark:text-gray-100 mb-4">
              Navigation
            </h4>
            <ul className="space-y-3">
              <li>
                <Link 
                  href={`/${locale}`}
                  className="text-small text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors link-hover"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  href={`/${locale}/gallery`}
                  className="text-small text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors link-hover"
                >
                  Gallery
                </Link>
              </li>
              <li>
                <Link 
                  href={`/${locale}/vrminspector`}
                  className="text-small text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors link-hover"
                >
                  VRM Inspector
                </Link>
              </li>
              <li>
                <Link 
                  href={`/${locale}/about`}
                  className="text-small text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors link-hover"
                >
                  About
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-caption text-gray-900 dark:text-gray-100 mb-4">
              Resources
            </h4>
            <ul className="space-y-3">
              <li>
                <Link 
                  href={`/${locale}/resources`}
                  className="text-small text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors link-hover"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <a 
                  href="https://github.com/toxsam/open-source-avatars"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-small text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors link-hover"
                >
                  GitHub Repo
                </a>
              </li>
              <li>
                <a 
                  href="https://vrm.dev/en/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-small text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors link-hover"
                >
                  VRM Specification
                </a>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-caption text-gray-900 dark:text-gray-100 mb-4">
              Connect
            </h4>
            <ul className="space-y-3">
              <li>
                <a 
                  href="https://toxsam.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-small text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors link-hover"
                >
                  ToxSam.com
                </a>
              </li>
              <li>
                <a 
                  href="https://twitter.com/toxsam"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-small text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors link-hover"
                >
                  Twitter
                </a>
              </li>
              <li>
                <a 
                  href="https://github.com/ToxSam"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-small text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors link-hover"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-300 dark:border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-small text-gray-500 dark:text-gray-400">
              © {currentYear} ToxSam. All avatars CC0.
            </p>
            <div className="flex items-center gap-4">
              <a 
                href="https://toxsam.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors flex items-center justify-center"
                aria-label="ToxSam website"
              >
                <svg className="w-[16px] h-[16px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </a>
              <a 
                href="https://twitter.com/toxsam"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors flex items-center justify-center"
                aria-label="X/Twitter"
              >
                <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a 
                href="https://github.com/ToxSam"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors flex items-center justify-center"
                aria-label="GitHub"
              >
                <svg className="w-[16px] h-[16px]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
