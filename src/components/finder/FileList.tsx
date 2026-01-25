'use client';

import React from 'react';
import { File, Image, Box, FileImage } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Avatar } from '@/types/avatar';
import { getAllAvatarFiles, FileTypeInfo } from './utils/fileTypes';

interface FileListProps {
  avatar: Avatar | null;
  selectedFileId: string | null;
  onFileSelect: (file: FileTypeInfo | null) => void;
}

export default function FileList({ 
  avatar, 
  selectedFileId, 
  onFileSelect
}: FileListProps) {
  const { t } = useI18n();

  if (!avatar) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <p className="text-gray-500 dark:text-gray-400 text-center">
          {t('finder.fileList.noSelection') || 'Select an avatar to view files'}
        </p>
      </div>
    );
  }

  const files = getAllAvatarFiles(avatar);
  
  // Helper to get file format from filename or label
  const getFileFormat = (file: FileTypeInfo): string | null => {
    const filename = file.filename?.toLowerCase() || '';
    const label = file.label?.toUpperCase() || '';
    
    // Check filename extension first (most reliable)
    if (filename.endsWith('.vrm')) {
      return 'VRM';
    }
    if (filename.endsWith('.glb')) {
      return 'GLB';
    }
    if (filename.endsWith('.fbx')) {
      return 'FBX';
    }
    
    // Check label for format (for cases where filename might not have extension)
    // Check for VRM (including Voxel VRM)
    if (label.includes('VRM') && !label.includes('FBX')) {
      return 'VRM';
    }
    // Check for GLB
    if (label.includes('GLB')) {
      return 'GLB';
    }
    // Check for FBX (including Voxel FBX)
    if (label.includes('FBX')) {
      return 'FBX';
    }
    
    // Images (thumbnails) - check category first, then filename extension, then label
    if (file.category === 'thumbnail') {
      return 'IMAGES';
    }
    if (filename.match(/\.(png|jpg|jpeg|webp|gif)$/i)) {
      return 'IMAGES';
    }
    if (label.includes('THUMBNAIL') || label.includes('PNG') || label.includes('JPG') || label.includes('JPEG') || label.includes('WEBP') || label.includes('GIF')) {
      return 'IMAGES';
    }
    
    return null;
  };

  // Group files by format
  const vrmFiles = files.filter((f) => getFileFormat(f) === 'VRM');
  const glbFiles = files.filter((f) => getFileFormat(f) === 'GLB');
  const fbxFiles = files.filter((f) => getFileFormat(f) === 'FBX');
  const imageFiles = files.filter((f) => getFileFormat(f) === 'IMAGES');

  const getFileIcon = (category: string) => {
    switch (category) {
      case 'model':
        return <Box className="h-4 w-4" />;
      case 'thumbnail':
        return <Image className="h-4 w-4" />;
      case 'texture':
        return <FileImage className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const handleFileClick = (file: FileTypeInfo) => {
    onFileSelect(file);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-none px-4 py-3 border-b border-gray-300 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {avatar ? avatar.name : (t('finder.fileList.title') || 'Files')}
        </h3>
        {avatar && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {files.length} {files.length === 1 ? 'file' : 'files'}
          </p>
        )}
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto">
        {files.length === 0 ? (
          <div className="flex items-center justify-center h-full p-8">
            <p className="text-gray-500 dark:text-gray-400 text-center">
              {t('finder.fileList.noFiles') || 'No files available'}
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-0.5">
            {/* VRM Files */}
            {vrmFiles.length > 0 && (
              <>
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {t('finder.fileList.categories.vrm') || 'VRM'}
                </div>
                {vrmFiles.map((file) => {
                  const isSelected = selectedFileId === file.id;
                  return (
                    <button
                      key={file.id}
                      onClick={() => handleFileClick(file)}
                      className={`w-full px-3 py-1.5 rounded-md transition-colors flex items-center gap-2 text-left ${
                        isSelected
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium border-l-2 border-l-gray-900 dark:border-l-gray-100'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                        {getFileIcon(file.category)}
                        <div className="flex-1 min-w-0">
                          {/* Filename on top, format below */}
                          {file.filename && (
                            <div className="text-sm font-medium truncate">
                              {file.filename}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {file.label}
                          </div>
                        </div>
                      </button>
                  );
                })}
              </>
            )}

            {/* GLB Files */}
            {glbFiles.length > 0 && (
              <>
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-2">
                  {t('finder.fileList.categories.glb') || 'GLB'}
                </div>
                {glbFiles.map((file) => {
                  const isSelected = selectedFileId === file.id;
                  return (
                    <button
                      key={file.id}
                      onClick={() => handleFileClick(file)}
                      className={`w-full px-3 py-1.5 rounded-md transition-colors flex items-center gap-2 text-left ${
                        isSelected
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium border-l-2 border-l-gray-900 dark:border-l-gray-100'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                        {getFileIcon(file.category)}
                        <div className="flex-1 min-w-0">
                          {/* Filename on top, format below */}
                          {file.filename && (
                            <div className="text-sm font-medium truncate">
                              {file.filename}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {file.label}
                          </div>
                        </div>
                      </button>
                  );
                })}
              </>
            )}

            {/* FBX Files */}
            {fbxFiles.length > 0 && (
              <>
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-2">
                  {t('finder.fileList.categories.fbx') || 'FBX'}
                </div>
                {fbxFiles.map((file) => {
                  const isSelected = selectedFileId === file.id;
                  return (
                    <button
                      key={file.id}
                      onClick={() => handleFileClick(file)}
                      className={`w-full px-3 py-1.5 rounded-md transition-colors flex items-center gap-2 text-left ${
                        isSelected
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium border-l-2 border-l-gray-900 dark:border-l-gray-100'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                        {getFileIcon(file.category)}
                        <div className="flex-1 min-w-0">
                          {/* Filename on top, format below */}
                          {file.filename && (
                            <div className="text-sm font-medium truncate">
                              {file.filename}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {file.label}
                          </div>
                        </div>
                      </button>
                  );
                })}
              </>
            )}

            {/* Images */}
            {imageFiles.length > 0 && (
              <>
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-2">
                  {t('finder.fileList.categories.images') || 'IMAGES'}
                </div>
                {imageFiles.map((file) => {
                  const isSelected = selectedFileId === file.id;
                  return (
                    <button
                      key={file.id}
                      onClick={() => handleFileClick(file)}
                      className={`w-full px-3 py-1.5 rounded-md transition-colors flex items-center gap-2 text-left ${
                        isSelected
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium border-l-2 border-l-gray-900 dark:border-l-gray-100'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                        {getFileIcon(file.category)}
                        <div className="flex-1 min-w-0">
                          {/* Filename on top, format below */}
                          {file.filename && (
                            <div className="text-sm font-medium truncate">
                              {file.filename}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {file.label}
                          </div>
                        </div>
                      </button>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
