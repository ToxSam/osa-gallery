'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language, filename }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="relative group my-6">
      {filename && (
        <div className="px-4 py-2 bg-gray-800 dark:bg-gray-900 text-gray-300 dark:text-gray-400 text-xs font-mono border-b border-gray-700 dark:border-gray-800 rounded-t-lg">
          {filename}
        </div>
      )}
      <div className="relative">
        <pre className={`
          overflow-x-auto p-4 rounded-lg
          ${filename ? 'rounded-t-none' : 'rounded-lg'}
          bg-gray-900 dark:bg-gray-950
          text-gray-100 dark:text-gray-200
          text-sm font-mono leading-relaxed
          border border-gray-700 dark:border-gray-800
        `}>
          <code className={language ? `language-${language}` : ''}>
            {code}
          </code>
        </pre>
        <button
          onClick={handleCopy}
          className={`
            absolute top-4 right-4
            p-2 rounded-lg
            bg-gray-800 dark:bg-gray-900
            text-gray-300 dark:text-gray-400
            hover:bg-gray-700 dark:hover:bg-gray-800
            hover:text-white dark:hover:text-gray-100
            transition-all opacity-0 group-hover:opacity-100
            focus:opacity-100 focus:outline-none
            focus:ring-2 focus:ring-gray-600 dark:focus:ring-gray-400
          `}
          aria-label="Copy code"
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
};
