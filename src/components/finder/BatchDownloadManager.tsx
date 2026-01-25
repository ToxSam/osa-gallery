'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { X, Download, CheckCircle, XCircle, Loader2, Folder, File, Image, Box, FileImage } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { Avatar } from '@/types/avatar';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionItem } from '@/components/ui/accordion';
import { DownloadItem } from './DownloadQueue';
import { getAllAvatarFiles, FileTypeInfo } from './utils/fileTypes';
import { DownloadOptions } from '@/lib/hooks/useDownloadQueue';

interface BatchDownloadManagerProps {
  isOpen: boolean;
  selectedAvatars: Avatar[];
  selectedFileTypes: Record<string, Set<string>>;
  downloadQueue: DownloadItem[];
  onClose: () => void;
  onStartDownload: (options: DownloadOptions) => void;
  onCancel: (itemId: string) => void;
  onRetry: (itemId: string) => void;
  onClear: () => void;
}

export default function BatchDownloadManager({
  isOpen,
  selectedAvatars,
  selectedFileTypes,
  downloadQueue,
  onClose,
  onStartDownload,
  onCancel,
  onRetry,
  onClear,
}: BatchDownloadManagerProps) {
  const { t } = useI18n();
  const [downloadVrms, setDownloadVrms] = useState(true);
  const [downloadFbx, setDownloadFbx] = useState(false);
  const [downloadGlb, setDownloadGlb] = useState(false);
  const [downloadImages, setDownloadImages] = useState(false);
  const [extractTextures, setExtractTextures] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<FileSystemDirectoryHandle | null>(null);
  const [folderName, setFolderName] = useState<string>('');
  const [visibleCount, setVisibleCount] = useState(20);
  const panelRef = useRef<HTMLDivElement>(null);
  const itemsPerPage = 20;
  const [hasCelebrated, setHasCelebrated] = useState(false);

  // Check if download has started
  useEffect(() => {
    setIsDownloading(downloadQueue.length > 0);
  }, [downloadQueue.length]);

  // Reset folder selection when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedFolder(null);
      setFolderName('');
      setVisibleCount(itemsPerPage);
    }
  }, [isOpen]);

  // Reset visible count when download options change
  useEffect(() => {
    setVisibleCount(itemsPerPage);
  }, [downloadVrms, downloadFbx, downloadGlb, downloadImages, extractTextures]);

  // Handle click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Check if selected avatars have FBX or GLB files
  const hasFbxFiles = useMemo(() => {
    return selectedAvatars.some((avatar) => {
      const allFiles = getAllAvatarFiles(avatar);
      return allFiles.some((file) => {
        const fileId = file.id.toLowerCase();
        const label = file.label.toLowerCase();
        const filename = file.filename?.toLowerCase() || '';
        return file.category === 'model' && (
          fileId === 'fbx' || fileId === 'voxel_fbx' ||
          label.includes('fbx') || filename.endsWith('.fbx')
        );
      });
    });
  }, [selectedAvatars]);

  const hasGlbFiles = useMemo(() => {
    return selectedAvatars.some((avatar) => {
      const allFiles = getAllAvatarFiles(avatar);
      return allFiles.some((file) => {
        const fileId = file.id.toLowerCase();
        const label = file.label.toLowerCase();
        const filename = file.filename?.toLowerCase() || '';
        return file.category === 'model' && (
          fileId === 'glb' ||
          label.includes('glb') || filename.endsWith('.glb')
        );
      });
    });
  }, [selectedAvatars]);

  // Get files for an avatar based on download options
  const getFilesForAvatar = useCallback((avatar: Avatar): FileTypeInfo[] => {
    const allFiles = getAllAvatarFiles(avatar);
    return allFiles.filter((file) => {
      // Model files - check specific types
      if (file.category === 'model') {
        const fileId = file.id.toLowerCase();
        const label = file.label.toLowerCase();
        const filename = file.filename?.toLowerCase() || '';
        
        // Check for VRM files (excluding FBX and GLB)
        if (downloadVrms) {
          const isFbx = fileId === 'fbx' || fileId === 'voxel_fbx' || 
                       label.includes('fbx') || filename.endsWith('.fbx');
          const isGlb = fileId === 'glb' || 
                       label.includes('glb') || filename.endsWith('.glb');
          if (!isFbx && !isGlb) return true;
        }
        
        // Check for FBX files
        if (downloadFbx) {
          const isFbx = fileId === 'fbx' || fileId === 'voxel_fbx' || 
                       label.includes('fbx') || filename.endsWith('.fbx');
          if (isFbx) return true;
        }
        
        // Check for GLB files
        if (downloadGlb) {
          const isGlb = fileId === 'glb' || 
                       label.includes('glb') || filename.endsWith('.glb');
          if (isGlb) return true;
        }
        
        return false;
      }
      
      // Thumbnail files
      if (file.category === 'thumbnail' && downloadImages) return true;
      
      // Texture files
      if (file.category === 'texture' && extractTextures) return true;
      
      return false;
    });
  }, [downloadVrms, downloadFbx, downloadGlb, downloadImages, extractTextures]);

  // Get visible avatars based on pagination
  const visibleAvatars = useMemo(() => {
    return selectedAvatars.slice(0, visibleCount);
  }, [selectedAvatars, visibleCount]);

  // Calculate total files count across all selected avatars (not just visible ones)
  const totalFilesCount = useMemo(() => {
    return selectedAvatars.reduce((total, avatar) => {
      const files = getFilesForAvatar(avatar);
      return total + files.length;
    }, 0);
  }, [selectedAvatars, getFilesForAvatar]);

  const completedCount = downloadQueue.filter((item) => item.status === 'complete').length;
  const failedCount = downloadQueue.filter((item) => item.status === 'failed').length;
  const downloadingCount = downloadQueue.filter((item) => item.status === 'downloading').length;
  const queuedCount = downloadQueue.filter((item) => item.status === 'queued').length;
  const overallProgress = downloadQueue.length > 0 ? (completedCount / downloadQueue.length) * 100 : 0;

  // Trigger celebration when reaching 100%
  useEffect(() => {
    if (overallProgress >= 100 && downloadQueue.length > 0 && !hasCelebrated) {
      setHasCelebrated(true);
    }
  }, [overallProgress, downloadQueue.length, hasCelebrated]);

  // Reset celebration when download starts again
  useEffect(() => {
    if (downloadQueue.length === 0) {
      setHasCelebrated(false);
    }
  }, [downloadQueue.length]);

  if (!isOpen) return null;

  const handleFolderSelect = async () => {
    try {
      // Check if File System Access API is supported
      if (typeof window === 'undefined' || !('showDirectoryPicker' in window)) {
        alert(t('finder.batchDownload.folderNotSupported') || 'Folder selection is not supported in this browser. Please use Chrome, Edge, or another Chromium-based browser for automatic downloads without prompts.');
        return;
      }

      const handle = await (window as any).showDirectoryPicker();
      setSelectedFolder(handle);
      setFolderName(handle.name);
      console.log('Folder selected:', handle.name);
      
      // Verify we can actually use this folder by checking permission
      try {
        if (handle.requestPermission) {
          const permission = await handle.requestPermission({ mode: 'readwrite' });
          console.log('Folder permission:', permission);
          if (permission !== 'granted') {
            console.warn('Folder permission not granted:', permission);
          }
        }
      } catch (permError) {
        console.log('Permission check:', permError);
        // This is OK - permission might already be granted from folder selection
      }
    } catch (error: any) {
      // User cancelled the dialog
      if (error.name === 'AbortError') {
        console.log('User cancelled folder selection');
        return;
      }
      console.error('Error selecting folder:', error);
      alert(t('finder.batchDownload.folderSelectionError') || `Error selecting folder: ${error.message || 'Unknown error'}`);
    }
  };


  const handleDownload = async () => {
    // Folder should already be selected (button is disabled if not)
    if (!selectedFolder) {
      console.error('Download attempted without folder selection');
      return;
    }
    
    console.log('Starting download with folder:', selectedFolder.name);
    onStartDownload({
      downloadVrms,
      downloadFbx,
      downloadGlb,
      downloadImages,
      extractTextures,
      folderHandle: selectedFolder,
    });
  };

  // Helper function to interpolate translation strings
  const interpolate = (str: string, params: Record<string, number | string>): string => {
    return str.replace(/\{(\w+)\}/g, (match, key) => {
      return params[key] !== undefined ? String(params[key]) : match;
    });
  };

  // Get file icon based on category
  const getFileIcon = (category: string) => {
    switch (category) {
      case 'model':
        return <Box className="h-3 w-3" />;
      case 'thumbnail':
        return <Image className="h-3 w-3" />;
      case 'texture':
        return <FileImage className="h-3 w-3" />;
      default:
        return <File className="h-3 w-3" />;
    }
  };

  const hasMore = selectedAvatars.length > visibleCount;

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + itemsPerPage, selectedAvatars.length));
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
      {/* Confetti overlay - positioned on top of everything */}
      <AnimatePresence>
        {hasCelebrated && overallProgress >= 100 && (
          <div className="absolute inset-0 pointer-events-none z-[60] overflow-hidden">
            {[...Array(50)].map((_, i) => {
              // Random angle for more natural burst
              const angle = (Math.random() * 360) * (Math.PI / 180);
              // Random distance with some variation
              const distance = 200 + Math.random() * 300;
              // Random velocity variation
              const velocity = 0.5 + Math.random() * 0.5;
              const x = Math.cos(angle) * distance * velocity;
              const y = Math.sin(angle) * distance * velocity;
              // Add some gravity effect (more downward)
              const gravityY = y + (Math.random() * 100);
              const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#FF69B4', '#32CD32', '#FF4500'];
              const color = colors[Math.floor(Math.random() * colors.length)];
              // Random size
              const size = 4 + Math.random() * 6;
              // Random rotation
              const rotation = Math.random() * 360;
              
              return (
                <motion.div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    left: '50%',
                    top: '50%',
                    width: `${size}px`,
                    height: `${size}px`,
                    backgroundColor: color,
                    originX: 0.5,
                    originY: 0.5,
                  }}
                  initial={{
                    x: 0,
                    y: 0,
                    opacity: 1,
                    scale: 1,
                    rotate: 0,
                  }}
                  animate={{
                    x: x,
                    y: gravityY,
                    opacity: [1, 1, 0.8, 0],
                    scale: [1, 1.2, 0.8, 0.3],
                    rotate: rotation + 360,
                  }}
                  exit={{
                    opacity: 0,
                  }}
                  transition={{
                    duration: 2 + Math.random(),
                    delay: Math.random() * 0.2,
                    ease: [0.25, 0.46, 0.45, 0.94], // easeOutQuad for more natural motion
                  }}
                />
              );
            })}
          </div>
        )}
      </AnimatePresence>
      
      <motion.div
        ref={panelRef}
        className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col relative z-[55]"
        animate={hasCelebrated && overallProgress >= 100 ? {
          x: [0, -4, 4, -3, 3, -2, 2, -1, 1, 0],
          y: [0, -2, 2, -1, 1, 0],
        } : {}}
        transition={{
          duration: 0.5,
          ease: 'easeInOut',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-300 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t('finder.batchDownload.title') || 'Batch Download Manager'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {!isDownloading ? (
            /* Pre-download view */
            <div className="flex flex-1 min-h-0">
              {/* Left: Avatar List */}
              <div className="w-1/2 border-r border-gray-300 dark:border-gray-700 overflow-y-auto bg-gray-50 dark:bg-gray-900/50">
                <div className="p-5">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        {t('finder.batchDownload.selectedAvatars') || 'Selected Avatars'}
                      </h3>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded-full">
                        {selectedAvatars.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        {t('finder.batchDownload.selectedFiles') || 'Selected Files'}
                      </h3>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded-full">
                        {totalFilesCount}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {visibleAvatars.map((avatar) => {
                      const files = getFilesForAvatar(avatar);
                      return (
                        <div
                          key={avatar.id}
                          className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex items-center gap-3 flex-shrink-0">
                              {avatar.thumbnailUrl ? (
                                <img
                                  src={avatar.thumbnailUrl}
                                  alt={avatar.name}
                                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-gray-200 dark:border-gray-700"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 border border-gray-200 dark:border-gray-700">
                                  <span className="text-xs text-gray-400">{t('finder.common.noImage')}</span>
                                </div>
                              )}
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100 min-w-[100px] max-w-[140px] truncate" title={avatar.name}>
                                {avatar.name}
                              </span>
                            </div>
                            {files.length > 0 && (
                              <div className="flex-1 min-w-0 pl-3 border-l border-gray-200 dark:border-gray-700">
                                <div 
                                  className="space-y-1 overflow-x-auto overflow-y-hidden file-list-scroll"
                                  style={{ 
                                    cursor: 'grab',
                                    WebkitOverflowScrolling: 'touch'
                                  }}
                                  onMouseDown={(e) => {
                                    const container = e.currentTarget;
                                    const rect = container.getBoundingClientRect();
                                    const startX = e.pageX - rect.left;
                                    const scrollLeft = container.scrollLeft;
                                    let isDown = true;

                                    const handleMouseMove = (e: MouseEvent) => {
                                      if (!isDown) return;
                                      e.preventDefault();
                                      const x = e.pageX - rect.left;
                                      const walk = (x - startX) * 1.5;
                                      container.scrollLeft = scrollLeft - walk;
                                      container.style.cursor = 'grabbing';
                                    };

                                    const handleMouseUp = () => {
                                      isDown = false;
                                      container.style.cursor = 'grab';
                                      document.removeEventListener('mousemove', handleMouseMove);
                                      document.removeEventListener('mouseup', handleMouseUp);
                                    };

                                    const handleMouseLeave = () => {
                                      if (isDown) {
                                        handleMouseUp();
                                      }
                                    };

                                    document.addEventListener('mousemove', handleMouseMove);
                                    document.addEventListener('mouseup', handleMouseUp);
                                    container.addEventListener('mouseleave', handleMouseLeave);
                                  }}
                                >
                                  {files.map((file) => {
                                    const fileName = file.filename || file.label;
                                    return (
                                      <div
                                        key={file.id}
                                        className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap pr-2"
                                        title={fileName}
                                      >
                                        <span className="text-gray-400 dark:text-gray-500 flex-shrink-0">
                                          {getFileIcon(file.category)}
                                        </span>
                                        <span className="select-none">
                                          {fileName}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {hasMore && (
                      <div className="pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleLoadMore}
                          className="w-full"
                        >
                          {interpolate(
                            t('finder.common.loadMore') || 'Load More ({count} remaining)',
                            { count: selectedAvatars.length - visibleCount }
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Download Options */}
              <div className="w-1/2 overflow-y-auto bg-white dark:bg-gray-900">
                <div className="p-5">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-5">
                    {t('finder.batchDownload.downloadOptions') || 'Download Options'}
                  </h3>
                  <div className="space-y-3">
                    <div 
                      className={`flex items-center gap-3 p-3.5 rounded-lg border-2 cursor-pointer transition-all ${
                        downloadVrms 
                          ? 'border-gray-900 dark:border-gray-100 bg-gray-100 dark:bg-gray-800' 
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                      onClick={() => setDownloadVrms(!downloadVrms)}
                    >
                      <Checkbox
                        checked={downloadVrms}
                        onCheckedChange={(checked) => setDownloadVrms(checked === true)}
                      />
                      <label className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer flex-1">
                        {t('finder.batchDownload.downloadVrms') || 'Download VRM Files'}
                      </label>
                    </div>

                    <div 
                      className={`flex items-center gap-3 p-3.5 rounded-lg border-2 transition-all ${
                        !hasFbxFiles
                          ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60 cursor-not-allowed'
                          : downloadFbx
                            ? 'border-gray-900 dark:border-gray-100 bg-gray-100 dark:bg-gray-800 cursor-pointer'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer'
                      }`}
                      onClick={() => hasFbxFiles && setDownloadFbx(!downloadFbx)}
                    >
                      <Checkbox
                        checked={downloadFbx}
                        onCheckedChange={(checked) => hasFbxFiles && setDownloadFbx(checked === true)}
                        disabled={!hasFbxFiles}
                      />
                      <label className={`text-sm font-medium cursor-pointer flex-1 ${
                        !hasFbxFiles 
                          ? 'text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                          : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        {t('finder.batchDownload.downloadFbx') || 'Download FBX Files'}
                      </label>
                    </div>

                    <div 
                      className={`flex items-center gap-3 p-3.5 rounded-lg border-2 transition-all ${
                        !hasGlbFiles
                          ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60 cursor-not-allowed'
                          : downloadGlb
                            ? 'border-gray-900 dark:border-gray-100 bg-gray-100 dark:bg-gray-800 cursor-pointer'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer'
                      }`}
                      onClick={() => hasGlbFiles && setDownloadGlb(!downloadGlb)}
                    >
                      <Checkbox
                        checked={downloadGlb}
                        onCheckedChange={(checked) => hasGlbFiles && setDownloadGlb(checked === true)}
                        disabled={!hasGlbFiles}
                      />
                      <label className={`text-sm font-medium cursor-pointer flex-1 ${
                        !hasGlbFiles 
                          ? 'text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                          : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        {t('finder.batchDownload.downloadGlb') || 'Download GLB Files'}
                      </label>
                    </div>

                    <div 
                      className={`flex items-center gap-3 p-3.5 rounded-lg border-2 cursor-pointer transition-all ${
                        downloadImages 
                          ? 'border-gray-900 dark:border-gray-100 bg-gray-100 dark:bg-gray-800' 
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                      onClick={() => setDownloadImages(!downloadImages)}
                    >
                      <Checkbox
                        checked={downloadImages}
                        onCheckedChange={(checked) => setDownloadImages(checked === true)}
                      />
                      <label className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer flex-1">
                        {t('finder.batchDownload.downloadImages') || 'Download Images'}
                      </label>
                    </div>

                    <div className="flex items-center gap-3 p-3.5 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60 cursor-not-allowed">
                      <Checkbox
                        checked={extractTextures}
                        onCheckedChange={(checked) => setExtractTextures(checked === true)}
                        disabled
                      />
                      <div className="flex-1">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 cursor-not-allowed block">
                          {t('finder.batchDownload.extractTextures') || 'Extract Textures (Experimental)'}
                        </label>
                        <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 block">
                          {t('finder.batchDownload.comingSoon') || 'Coming Soon'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Folder Selection */}
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-5">
                      {t('finder.batchDownload.downloadFolder') || 'Download Folder'}
                    </h3>
                    <div className="space-y-3">
                      {selectedFolder ? (
                        <div className="flex items-center gap-3 p-3.5 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                          <Folder className="h-5 w-5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {folderName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {t('finder.batchDownload.folderSelected') || 'Files will save here automatically'}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleFolderSelect}
                            className="flex-shrink-0"
                          >
                            {t('finder.common.change')}
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 p-3.5 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600">
                          <Folder className="h-5 w-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              {t('finder.batchDownload.selectFolder') || 'No folder selected'}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                              {t('finder.batchDownload.required') || 'Required'}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="default"
                            size="sm"
                            onClick={handleFolderSelect}
                            className="flex-shrink-0"
                          >
                            {t('finder.common.select')}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <Button
                      onClick={handleDownload}
                      disabled={(!downloadVrms && !downloadFbx && !downloadGlb && !downloadImages) || !selectedFolder}
                      className="w-full h-12 text-base font-semibold"
                      size="lg"
                    >
                      <Download className="h-5 w-5 mr-2" />
                      {t('finder.batchDownload.startDownload') || 'Start Download'}
                    </Button>
                    {!downloadVrms && !downloadFbx && !downloadGlb && !downloadImages && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                        {t('finder.batchDownload.selectOption') || 'Please select at least one download option'}
                      </p>
                    )}
                    {!selectedFolder && (downloadVrms || downloadFbx || downloadGlb || downloadImages) && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                        {t('finder.batchDownload.selectFolderFirst') || 'Please select a download folder first'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Download in progress view */
            <div className="flex-1 flex flex-col min-h-0">
              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto p-6">
                <Accordion>
                  <AccordionItem title={t('finder.batchDownload.selectedAvatars') || 'Selected Avatars'} defaultOpen={false}>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedAvatars.map((avatar) => (
                        <div
                          key={avatar.id}
                          className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        >
                          {avatar.thumbnailUrl && (
                            <img
                              src={avatar.thumbnailUrl}
                              alt={avatar.name}
                              className="w-10 h-10 rounded object-cover flex-shrink-0"
                            />
                          )}
                          <span className="text-sm text-gray-900 dark:text-gray-100 truncate flex-1">
                            {avatar.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </AccordionItem>

                  <AccordionItem title={t('finder.batchDownload.downloadOptions') || 'Download Options'} defaultOpen={false}>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {downloadVrms && (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                            {t('finder.batchDownload.downloadVrms') || 'Download VRM Files'}
                          </div>
                        )}
                        {downloadFbx && (
                          <div className="flex items-center gap-2 mt-2">
                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                            {t('finder.batchDownload.downloadFbx') || 'Download FBX Files'}
                          </div>
                        )}
                        {downloadGlb && (
                          <div className="flex items-center gap-2 mt-2">
                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                            {t('finder.batchDownload.downloadGlb') || 'Download GLB Files'}
                          </div>
                        )}
                        {downloadImages && (
                          <div className="flex items-center gap-2 mt-2">
                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                            {t('finder.batchDownload.downloadImages') || 'Download Images'}
                          </div>
                        )}
                        {extractTextures && (
                          <div className="flex items-center gap-2 mt-2">
                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                            {t('finder.batchDownload.extractTextures') || 'Extract Textures (Experimental)'}
                          </div>
                        )}
                      </div>
                    </div>
                  </AccordionItem>

                  <AccordionItem
                    title={t('finder.batchDownload.downloadProgress') || 'Download Progress'}
                    defaultOpen={true}
                  >
                    <div className="space-y-3">
                      {downloadQueue.length === 0 ? (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                          {t('finder.downloadQueue.empty')}
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200 dark:divide-gray-800">
                          {downloadQueue.map((item) => (
                            <div
                              key={item.id}
                              className="py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  {item.status === 'downloading' && (
                                    <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                  )}
                                  {item.status === 'complete' && (
                                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                                  )}
                                  {item.status === 'failed' && (
                                    <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                                  )}
                                  {item.status === 'queued' && (
                                    <Download className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                      {item.fileName}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                      {item.avatarName} • {item.fileType}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                  {item.status === 'queued' && onCancel && (
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => onCancel(item.id)}
                                    >
                                      {t('finder.downloadQueue.cancel')}
                                    </Button>
                                  )}
                                  {item.status === 'failed' && onRetry && (
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => onRetry(item.id)}
                                    >
                                      {t('finder.downloadQueue.retry')}
                                    </Button>
                                  )}
                                  <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[60px] text-right">
                                    {item.status === 'downloading' && `${item.progress}%`}
                                    {item.status === 'queued' && t('finder.downloadQueue.status.queued')}
                                    {item.status === 'complete' && t('finder.downloadQueue.status.complete')}
                                    {item.status === 'failed' && t('finder.downloadQueue.status.failed')}
                                  </span>
                                </div>
                              </div>
                              {item.status === 'downloading' && (
                                <Progress value={item.progress} className="h-1.5" />
                              )}
                              {item.error && (
                                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                  {item.error}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </AccordionItem>
                </Accordion>
              </div>

              {/* Overall Progress Bar - Fixed below scrollable content, always visible */}
              {downloadQueue.length > 0 && (
                <div className="flex-none p-6 pt-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {interpolate(
                        t('finder.downloadQueue.overallProgress') || '{completed} of {total} complete',
                        { completed: completedCount, total: downloadQueue.length }
                      )}
                    </span>
                    <motion.span
                      className="text-sm font-medium text-gray-900 dark:text-gray-100 inline-block"
                      animate={hasCelebrated && overallProgress >= 100 ? {
                        scale: [1, 1.4, 1.1, 1],
                      } : {}}
                      transition={{
                        duration: 0.6,
                        repeat: hasCelebrated && overallProgress >= 100 ? 1 : 0,
                        ease: 'easeOut',
                      }}
                    >
                      {Math.round(overallProgress)}%
                    </motion.span>
                  </div>
                  <Progress value={overallProgress} className="h-2" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {isDownloading && (
          <div className="p-4 border-t border-gray-300 dark:border-gray-700">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 flex-shrink-0">
                {interpolate(
                  t('finder.downloadQueue.progress') || 'Downloading {current} of {total} files',
                  { current: downloadingCount, total: downloadQueue.length }
                )}
              </div>
              {selectedFolder && folderName && (
                <div className="flex items-center gap-2 flex-1 min-w-0 justify-center">
                  <Folder className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {t('finder.batchDownload.filesDownloadedTo') || 'Files downloaded to:'}
                    </span>
                    <span className="text-sm font-mono text-gray-900 dark:text-gray-100 truncate">
                      {folderName}
                    </span>
                  </div>
                </div>
              )}
              <Button variant="secondary" size="sm" onClick={onClear} className="flex-shrink-0">
                {t('finder.downloadQueue.clear') || 'Clear Queue'}
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
