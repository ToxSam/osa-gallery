'use client';

import React from 'react';
import { X, ChevronUp, ChevronDown, Download, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export interface DownloadItem {
  id: string;
  avatarId: string;
  avatarName: string;
  fileType: string; // Label for display
  fileTypeId: string; // ID for format mapping (e.g., 'vrm', 'fbx', 'voxel_vrm')
  fileName: string;
  url: string;
  status: 'queued' | 'downloading' | 'complete' | 'failed';
  progress: number;
  error?: string;
}

interface DownloadQueueProps {
  queue: DownloadItem[];
  isMinimized: boolean;
  onMinimize: () => void;
  onMaximize: () => void;
  onClear: () => void;
  onCancel?: (itemId: string) => void;
  onRetry?: (itemId: string) => void;
}

export default function DownloadQueue({
  queue,
  isMinimized,
  onMinimize,
  onMaximize,
  onClear,
  onCancel,
  onRetry,
}: DownloadQueueProps) {
  const { t } = useI18n();

  const completedCount = queue.filter((item) => item.status === 'complete').length;
  const failedCount = queue.filter((item) => item.status === 'failed').length;
  const downloadingCount = queue.filter((item) => item.status === 'downloading').length;
  const queuedCount = queue.filter((item) => item.status === 'queued').length;

  const overallProgress = queue.length > 0 ? (completedCount / queue.length) * 100 : 0;

  if (isMinimized) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-300 dark:border-gray-700 shadow-lg z-50">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onMaximize}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <ChevronUp className="h-4 w-4" />
              {t('finder.downloadQueue.title')}
            </button>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {t('finder.downloadQueue.overallProgress', {
                completed: completedCount,
                total: queue.length,
              })}
            </span>
          </div>
          <div className="w-32">
            <Progress value={overallProgress} className="h-2" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-300 dark:border-gray-700 shadow-lg z-50 max-h-[400px] flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-300 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t('finder.downloadQueue.title')}
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {t('finder.downloadQueue.progress', {
              current: downloadingCount,
              total: queue.length,
            })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onMinimize}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onClear}
          >
            {t('finder.downloadQueue.clear')}
          </Button>
        </div>
      </div>

      {/* Queue List */}
      <div className="flex-1 overflow-y-auto">
        {queue.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            {t('finder.downloadQueue.empty')}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {queue.map((item) => (
              <div
                key={item.id}
                className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
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

      {/* Footer with Overall Progress */}
      <div className="px-4 py-3 border-t border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {t('finder.downloadQueue.overallProgress', {
              completed: completedCount,
              total: queue.length,
            })}
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {Math.round(overallProgress)}%
          </span>
        </div>
        <Progress value={overallProgress} className="h-2" />
      </div>
    </div>
  );
}
