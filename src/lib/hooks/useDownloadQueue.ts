import { useState, useCallback, useRef, useEffect } from 'react';
import { DownloadItem } from '@/components/finder/DownloadQueue';
import { downloadAvatar } from '@/lib/download-utils';
import { Avatar } from '@/types/avatar';
import { getAvailableFileTypes, getAllAvatarFiles } from '@/components/finder/utils/fileTypes';
import { isIPFSUrl, normalizeIPFSUrl, isClientSideDownloadUrl, isGitHubRawUrl } from '@/lib/download-utils';

const MAX_CONCURRENT_DOWNLOADS = 6;
const MAX_RETRIES = 3;

// Sanitize filename to remove invalid characters for file systems
function sanitizeFileName(fileName: string): string {
  // Remove or replace invalid characters for file systems
  // Invalid characters: < > : " / \ | ? * and control characters
  // Also handle special cases like "Thumbnail: PNG" -> "Thumbnail_PNG"
  let sanitized = fileName
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_') // Replace invalid chars with underscore
    .replace(/\s+/g, '_') // Replace spaces with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
  
  // Ensure we have a valid filename (at least 1 character, max 255)
  if (sanitized.length === 0) {
    sanitized = 'file';
  }
  
  return sanitized.substring(0, 255); // Limit length (most file systems have 255 char limit)
}

export interface DownloadOptions {
  downloadVrms: boolean;
  downloadFbx?: boolean;
  downloadGlb?: boolean;
  downloadImages: boolean;
  extractTextures: boolean;
  folderHandle?: FileSystemDirectoryHandle | null;
}

interface UseDownloadQueueReturn {
  queue: DownloadItem[];
  addToQueue: (
    avatars: Avatar[],
    selectedFileTypes: Record<string, Set<string>>,
    options?: DownloadOptions
  ) => void;
  cancelItem: (itemId: string) => void;
  retryItem: (itemId: string) => void;
  clearQueue: () => void;
}

export function useDownloadQueue(): UseDownloadQueueReturn {
  const [queue, setQueue] = useState<DownloadItem[]>([]);
  const activeDownloadsRef = useRef<Set<string>>(new Set());
  const retryCountsRef = useRef<Record<string, number>>({});
  const folderHandleRef = useRef<FileSystemDirectoryHandle | null>(null);

  // Save file to folder using File System Access API
  const saveFileToFolder = useCallback(async (
    blob: Blob,
    fileName: string,
    folderHandle: FileSystemDirectoryHandle | null
  ): Promise<void> => {
    // Use folder handle if available
    const handle = folderHandle || folderHandleRef.current;
    
    if (!handle) {
      console.warn('No folder handle available, falling back to blob download');
      // Fallback: use blob download (this will trigger save prompts)
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      return;
    }

    // Check if File System Access API is available
    if (typeof window === 'undefined' || !('showDirectoryPicker' in window)) {
      console.warn('File System Access API not available, falling back to blob download');
      // Fallback: use blob download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      return;
    }

    try {
      console.log('Saving file to folder:', fileName, 'Folder:', handle.name);
      
      // Request permission if the method is available (for subsequent saves after page reload)
      // Permission is automatically granted on folder selection via showDirectoryPicker
      if (handle.requestPermission) {
        try {
          const permissionStatus = await handle.requestPermission({ mode: 'readwrite' });
          if (permissionStatus !== 'granted') {
            console.warn('Permission not granted for folder access:', permissionStatus);
            // Continue anyway - permission might already be granted from folder selection
          }
        } catch (permError) {
          // requestPermission might not be available or might fail
          // This is OK if permission was already granted via showDirectoryPicker
          console.log('Permission check skipped or already granted');
        }
      }
      
      // Create or get file handle
      const fileHandle = await handle.getFileHandle(fileName, { create: true });
      
      // Write file
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      
      console.log('Successfully saved file to folder:', fileName);
    } catch (error: any) {
      console.error('Error saving to folder:', error);
      
      // If it's a permission error, don't fall back - throw to show error
      if (error.name === 'NotAllowedError' || error.name === 'SecurityError' || error.message?.includes('Permission')) {
        console.error('Permission denied for folder access. User may need to re-select folder.');
        throw new Error('Permission denied. Please re-select the download folder.');
      }
      
      // For other errors, fall through to blob download
      console.warn('Falling back to blob download due to error');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  }, []);

  // Download a single file
  const downloadFile = useCallback(async (item: DownloadItem, folderHandle?: FileSystemDirectoryHandle | null): Promise<void> => {
    const handle = folderHandle || folderHandleRef.current;
    
    if (handle) {
      console.log('Downloading with folder handle:', handle.name, 'File:', item.fileName);
    } else {
      console.warn('Downloading without folder handle - will trigger save prompts:', item.fileName);
    }
    return new Promise((resolve, reject) => {
      // Update status to downloading
      setQueue((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? { ...q, status: 'downloading' as const, progress: 0 }
            : q
        )
      );

      // Fetch all files (IPFS, GitHub raw, Arweave, images) and save them
      let downloadUrl = item.url;
      
      // Check if this is a thumbnail or texture (should be downloaded directly, not through API)
      const isThumbnailOrTexture = item.fileTypeId.startsWith('thumbnail') || 
                                    item.fileTypeId.startsWith('texture') ||
                                    item.fileTypeId.startsWith('ardrive_thumbnail');
      
      // Check if this is a GLB or FBX file (these can be downloaded directly from Arweave URLs)
      const isGlbOrFbx = item.fileTypeId === 'glb' || item.fileTypeId === 'fbx';
      
      // For Arweave URLs (not IPFS, not GitHub), use the direct-download API endpoint
      // BUT: thumbnails, textures, GLB, and FBX files should be downloaded directly from their URL
      // (The API is mainly for VRM files that need special handling)
      if (!isClientSideDownloadUrl(item.url) && !isThumbnailOrTexture && !isGlbOrFbx) {
        const avatarId = item.avatarId;
        
        // Determine format from file type ID
        let format: string | null = null;
        const fileTypeId = item.fileTypeId;
        if (fileTypeId === 'voxel_fbx' || fileTypeId === 'voxel-fbx') {
          format = 'voxel-fbx';
        } else if (fileTypeId === 'voxel_vrm' || fileTypeId === 'voxel') {
          format = 'voxel';
        }
        // For 'vrm' (default), format stays null
        // Note: GLB and FBX are now handled directly above
        
        const formatParam = format ? `?format=${format}` : '';
        downloadUrl = `/api/avatars/${avatarId}/direct-download${formatParam}`;
      }
      
      // Normalize IPFS URLs, but keep GitHub raw URLs, API URLs, and direct Arweave URLs as-is
      const normalizedUrl = isIPFSUrl(item.url) ? normalizeIPFSUrl(item.url) : downloadUrl;
      
      fetch(normalizedUrl)
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.blob();
        })
        .then((blob) => {
          // Save file to folder or download
          return saveFileToFolder(blob, item.fileName, handle || null);
        })
        .then(() => {
          // Mark as complete
          setQueue((prev) =>
            prev.map((q) =>
              q.id === item.id
                ? { ...q, status: 'complete' as const, progress: 100 }
                : q
            )
          );
          activeDownloadsRef.current.delete(item.id);
          resolve();
        })
        .catch((error) => {
          const retryCount = retryCountsRef.current[item.id] || 0;
          
          if (retryCount < MAX_RETRIES) {
            // Retry with exponential backoff
            retryCountsRef.current[item.id] = retryCount + 1;
            const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
            
            setTimeout(() => {
              downloadFile(item, handle).then(resolve).catch(reject);
            }, delay);
          } else {
            // Mark as failed
            setQueue((prev) =>
              prev.map((q) =>
                q.id === item.id
                  ? {
                      ...q,
                      status: 'failed' as const,
                      error: error.message || 'Download failed',
                    }
                  : q
              )
            );
            activeDownloadsRef.current.delete(item.id);
            reject(error);
          }
        });
    });
  }, [saveFileToFolder]);

  // Process queue - start downloads up to max concurrent
  useEffect(() => {
    const queuedItems = queue.filter(
      (item) => item.status === 'queued' && !activeDownloadsRef.current.has(item.id)
    );

    const availableSlots = MAX_CONCURRENT_DOWNLOADS - activeDownloadsRef.current.size;

    for (let i = 0; i < Math.min(availableSlots, queuedItems.length); i++) {
      const item = queuedItems[i];
      activeDownloadsRef.current.add(item.id);
      downloadFile(item, folderHandleRef.current).catch((error) => {
        console.error('Download error:', error);
      });
    }
  }, [queue, downloadFile]);

  // Add avatars to download queue
  const addToQueue = useCallback(
    (
      avatars: Avatar[],
      selectedFileTypes: Record<string, Set<string>>,
      options?: DownloadOptions
    ) => {
      const newItems: DownloadItem[] = [];
      const downloadOptions = options || { downloadVrms: true, downloadImages: false, extractTextures: false };
      
      // Store folder handle for use during downloads
      if (downloadOptions.folderHandle) {
        folderHandleRef.current = downloadOptions.folderHandle;
        console.log('Folder handle stored:', downloadOptions.folderHandle.name);
      } else {
        console.warn('No folder handle provided in download options');
      }

      avatars.forEach((avatar) => {
        const allFiles = getAllAvatarFiles(avatar);
        const avatarSelectedTypes = selectedFileTypes[avatar.id] || new Set();

        // Determine which files to download based on options
        let filesToDownload: typeof allFiles = [];

        if (downloadOptions.downloadVrms) {
          // Download VRM files (excluding FBX and GLB)
          const modelFiles = allFiles.filter((ft) => {
            if (ft.category !== 'model') return false;
            const fileId = ft.id.toLowerCase();
            const label = ft.label.toLowerCase();
            const filename = ft.filename?.toLowerCase() || '';
            // Exclude FBX and GLB files
            const isFbx = fileId === 'fbx' || fileId === 'voxel_fbx' || 
                         label.includes('fbx') || filename.endsWith('.fbx');
            const isGlb = fileId === 'glb' || 
                         label.includes('glb') || filename.endsWith('.glb');
            return !isFbx && !isGlb;
          });
          if (avatarSelectedTypes.size > 0) {
            // If specific file types are selected, only download those
            filesToDownload.push(
              ...modelFiles.filter((ft) => avatarSelectedTypes.has(ft.id))
            );
          } else {
            // Default: download all VRM model files
            filesToDownload.push(...modelFiles);
          }
        }

        if (downloadOptions.downloadFbx) {
          // Download FBX files
          const fbxFiles = allFiles.filter((ft) => {
            if (ft.category !== 'model') return false;
            const fileId = ft.id.toLowerCase();
            const label = ft.label.toLowerCase();
            const filename = ft.filename?.toLowerCase() || '';
            return fileId === 'fbx' || fileId === 'voxel_fbx' || 
                   label.includes('fbx') || filename.endsWith('.fbx');
          });
          filesToDownload.push(...fbxFiles);
        }

        if (downloadOptions.downloadGlb) {
          // Download GLB files
          const glbFiles = allFiles.filter((ft) => {
            if (ft.category !== 'model') return false;
            const fileId = ft.id.toLowerCase();
            const label = ft.label.toLowerCase();
            const filename = ft.filename?.toLowerCase() || '';
            return fileId === 'glb' || 
                   label.includes('glb') || filename.endsWith('.glb');
          });
          filesToDownload.push(...glbFiles);
        }

        if (downloadOptions.downloadImages) {
          // Download thumbnail/image files
          const imageFiles = allFiles.filter(
            (ft) => ft.category === 'thumbnail' || ft.category === 'texture'
          );
          filesToDownload.push(...imageFiles);
        }

        // Note: extractTextures is a placeholder for future functionality
        if (downloadOptions.extractTextures) {
          // Future: extract textures from VRM files
          // This is not implemented yet
        }

        filesToDownload.forEach((fileType) => {
          if (!fileType.url) return;

          // Determine extension from filename, label, category, or URL (in that order)
          let extension = 'vrm'; // default for model files
          
          // For thumbnails, default to png instead of vrm
          if (fileType.category === 'thumbnail' || fileType.category === 'texture') {
            extension = 'png'; // Default for images
          }
          
          // First, try to get extension from filename if available (most reliable)
          if (fileType.filename) {
            const filenameExt = fileType.filename.split('.').pop()?.toLowerCase();
            if (filenameExt && ['vrm', 'fbx', 'glb', 'gltf', 'png', 'jpg', 'jpeg', 'webp', 'gif'].includes(filenameExt)) {
              extension = filenameExt;
            }
          }
          
          // If no extension from filename, try from label
          if (extension === 'vrm' || (extension === 'png' && fileType.category === 'thumbnail')) {
            const labelLower = fileType.label.toLowerCase();
            if (labelLower.includes('fbx')) extension = 'fbx';
            else if (labelLower.includes('glb')) extension = 'glb';
            else if (labelLower.includes('gltf')) extension = 'gltf';
            else if (labelLower.includes('png')) extension = 'png';
            else if (labelLower.includes('jpg') || labelLower.includes('jpeg')) extension = 'jpg';
            else if (labelLower.includes('webp')) extension = 'webp';
            else if (labelLower.includes('gif')) extension = 'gif';
          }
          
          // If still no extension, try from URL (works for GitHub raw, IPFS, but not Arweave)
          if ((extension === 'vrm' || (extension === 'png' && fileType.category === 'thumbnail')) && fileType.url.includes('.')) {
            const urlExt = fileType.url.split('.').pop()?.split('?')[0].toLowerCase();
            if (urlExt && ['vrm', 'fbx', 'glb', 'gltf', 'png', 'jpg', 'jpeg', 'webp', 'gif'].includes(urlExt)) {
              extension = urlExt;
            }
          }
          
          // Also check fileType.id for format hints (for model files)
          if (fileType.category === 'model') {
            const fileId = fileType.id.toLowerCase();
            if (fileId === 'fbx' || fileId === 'voxel_fbx') extension = 'fbx';
            else if (fileId === 'glb') extension = 'glb';
          }
          
          const cleanName = sanitizeFileName(avatar.name);
          // Sanitize the file type label as well (it might contain colons like "Thumbnail: PNG")
          const cleanLabel = sanitizeFileName(fileType.label);
          const fileName = `${cleanName}_${cleanLabel}.${extension}`;
          
          // Final sanitization of the complete filename
          const finalFileName = sanitizeFileName(fileName) || `file_${Date.now()}.${extension}`;

          newItems.push({
            id: `${avatar.id}_${fileType.id}_${Date.now()}_${Math.random()}`,
            avatarId: avatar.id,
            avatarName: avatar.name,
            fileType: fileType.label,
            fileTypeId: fileType.id,
            fileName: finalFileName,
            url: fileType.url,
            status: 'queued',
            progress: 0,
          });
        });
      });

      setQueue((prev) => [...prev, ...newItems]);
    },
    []
  );

  const cancelItem = useCallback((itemId: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== itemId));
    activeDownloadsRef.current.delete(itemId);
  }, []);

  const retryItem = useCallback(
    (itemId: string) => {
      setQueue((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, status: 'queued' as const, error: undefined }
            : item
        )
      );
      retryCountsRef.current[itemId] = 0;
    },
    []
  );

  const clearQueue = useCallback(() => {
    setQueue([]);
    activeDownloadsRef.current.clear();
    retryCountsRef.current = {};
  }, []);

  return {
    queue,
    addToQueue,
    cancelItem,
    retryItem,
    clearQueue,
  };
}
