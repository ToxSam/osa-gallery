import { useState } from 'react';
import { Avatar } from '@/types/avatar';

interface DownloadResponse {
  downloadUrl: string;
  format: string;
  avatarName?: string;
}

// Helper function to get file extension based on format
function getFileExtension(format: string): string {
  if (format === 'fbx' || format === 'voxel-fbx' || format === 'voxel_fbx') {
    return '.fbx';
  }
  return '.vrm'; // Default to VRM for any other format
}

export function useAvatarSelection() {
  const [selectedAvatars, setSelectedAvatars] = useState<Set<string>>(new Set());
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleAvatarSelect = (avatarId: string) => {
    const newSelectedAvatars = new Set(selectedAvatars);
    if (newSelectedAvatars.has(avatarId)) {
      newSelectedAvatars.delete(avatarId);
    } else {
      newSelectedAvatars.clear(); // Single selection only
      newSelectedAvatars.add(avatarId);
    }
    setSelectedAvatars(newSelectedAvatars);
  };

  const handleDownloadSelected = async () => {
    try {
      setIsDownloading(true);

      // Make sure we have at least one avatar selected
      if (selectedAvatars.size === 0) {
        setIsDownloading(false);
        alert('Please select an avatar to download');
        return;
      }

      // Get the first selected avatar ID
      const avatarId = Array.from(selectedAvatars)[0];

      // Use the direct download endpoint with proper download link
      // This preserves the user gesture chain and avoids security warnings
      const format = selectedFormat || null;
      const formatParam = format ? `?format=${format}` : '';
      const directDownloadUrl = `/api/avatars/${avatarId}/direct-download${formatParam}`;
      
      // Create a proper download link instead of window.open() to avoid security warnings
      const link = document.createElement('a');
      link.href = directDownloadUrl;
      link.download = ''; // Let server set filename via Content-Disposition header
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Mark download as complete immediately since link click is synchronous
      setIsDownloading(false);
    } catch (error) {
      setIsDownloading(false);
      console.error('Download error:', error);
      alert('Download failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const clearSelection = () => {
    setSelectedAvatars(new Set());
  };

  const handleFormatChange = (format: string | null) => {
    setSelectedFormat(format);
  };

  return {
    selectedAvatars,
    selectedFormat,
    isDownloading,
    handleAvatarSelect,
    handleDownloadSelected,
    clearSelection,
    handleFormatChange
  };
}