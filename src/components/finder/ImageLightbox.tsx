'use client';

import React, { useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface ImageLightboxProps {
  isOpen: boolean;
  imageUrl: string;
  imageAlt: string;
  filename?: string;
  onClose: () => void;
  onDownload?: () => void;
}

export default function ImageLightbox({
  isOpen,
  imageUrl,
  imageAlt,
  filename,
  onClose,
  onDownload,
}: ImageLightboxProps) {
  const { t } = useI18n();
  
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    // Prevent body scroll when lightbox is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking the backdrop, not the image itself
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDownload) {
      onDownload();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      {/* Action buttons - grouped on the right */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        {/* Download button - subtle */}
        {onDownload && (
          <button
            onClick={handleDownload}
            className="p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-all hover:scale-110"
            aria-label={t('finder.lightbox.download') as string}
            title={filename ? `${t('finder.lightbox.download') as string} ${filename}` : t('finder.lightbox.downloadImage') as string}
          >
            <Download className="h-4 w-4" />
          </button>
        )}
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
          aria-label={t('finder.lightbox.close') as string}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Image container */}
      <div className="relative max-w-[95vw] max-h-[95vh] p-4">
        <img
          src={imageUrl}
          alt={imageAlt}
          className="max-w-full max-h-[95vh] object-contain rounded-lg shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
}
