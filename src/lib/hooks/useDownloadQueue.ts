import { useState, useCallback, useRef } from 'react';
import { DownloadItem } from '@/components/finder/DownloadQueue';
import { Avatar } from '@/types/avatar';
import { getAllAvatarFiles } from '@/components/finder/utils/fileTypes';
import { isIPFSUrl, normalizeIPFSUrl, isClientSideDownloadUrl } from '@/lib/download-utils';
import JSZip from 'jszip';

const MAX_CONCURRENT_FETCHES = 5;
const MAX_RETRIES = 3;

// Generate time-based filename for ZIP downloads
function generateZipFilename(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  // Format: osa-avatars-2026-01-27-153045.zip
  return `osa-avatars-${year}-${month}-${day}-${hours}${minutes}${seconds}.zip`;
}

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
  const isProcessingZipRef = useRef<boolean>(false);
  const zipProgressRef = useRef<{ fetched: number; total: number; failed: string[] }>({ fetched: 0, total: 0, failed: [] });

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
      a.style.display = 'none';
      a.setAttribute('rel', 'noopener noreferrer'); // Security best practice
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Revoke URL after a short delay to ensure download starts
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
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
      a.style.display = 'none';
      a.setAttribute('rel', 'noopener noreferrer'); // Security best practice
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Revoke URL after a short delay to ensure download starts
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
      return;
    }

    try {
      console.log('Saving file to folder:', fileName, 'Folder:', handle.name);
      
      // Request permission if the method is available (for subsequent saves after page reload)
      // Permission is automatically granted on folder selection via showDirectoryPicker
      if ('requestPermission' in handle && typeof (handle as any).requestPermission === 'function') {
        try {
          const permissionStatus = await (handle as any).requestPermission({ mode: 'readwrite' });
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
      a.style.display = 'none';
      a.setAttribute('rel', 'noopener noreferrer'); // Security best practice
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Revoke URL after a short delay to ensure download starts
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    }
  }, []);

  // Fetch a single file with retry logic
  const fetchFileWithRetry = useCallback(async (
    item: DownloadItem,
    retryCount: number = 0
  ): Promise<{ blob: Blob; item: DownloadItem }> => {
    let downloadUrl = item.url;
    
    // Check if this is a thumbnail or texture (should be downloaded directly, not through API)
    // These are small files and don't need to go through the API
    const isThumbnailOrTexture = item.fileTypeId.startsWith('thumbnail') || 
                                  item.fileTypeId.startsWith('texture') ||
                                  item.fileTypeId.startsWith('ardrive_thumbnail');
    
    // Check if this is a GLB or FBX file (these can be downloaded directly from Arweave URLs)
    // For now, we'll download these directly, but they could also go through the API
    const isGlbOrFbx = item.fileTypeId === 'glb' || item.fileTypeId === 'fbx';
    
    // For VRM model files, always use the server-side API endpoint to preserve user gesture chain
    // This ensures consistent behavior and avoids Chrome security warnings
    // The API handles IPFS, GitHub, and Arweave URLs correctly
    if (!isThumbnailOrTexture && !isGlbOrFbx && item.avatarId) {
      const avatarId = item.avatarId;
      
      // Determine format from file type ID
      let format: string | null = null;
      const fileTypeId = item.fileTypeId;
      if (fileTypeId === 'voxel_fbx' || fileTypeId === 'voxel-fbx') {
        format = 'voxel-fbx';
      } else if (fileTypeId === 'voxel_vrm' || fileTypeId === 'voxel') {
        format = 'voxel';
      } else if (fileTypeId === 'fbx') {
        format = 'fbx';
      } else if (fileTypeId === 'glb') {
        format = 'glb';
      }
      // For default VRM files, format is null (default)
      
      const formatParam = format ? `?format=${format}` : '';
      // URL encode the avatar ID in case it contains special characters like slashes
      const encodedAvatarId = encodeURIComponent(avatarId);
      downloadUrl = `/api/avatars/${encodedAvatarId}/direct-download${formatParam}`;
    }
    
    // For thumbnails, textures, and direct GLB/FBX files, use the original URL
    // Normalize IPFS URLs if needed (for direct downloads of thumbnails/textures)
    const normalizedUrl = (!isThumbnailOrTexture && !isGlbOrFbx && item.avatarId) 
      ? downloadUrl // Already set to API URL above
      : (isIPFSUrl(item.url) ? normalizeIPFSUrl(item.url) : item.url);
    
    try {
      const response = await fetch(normalizedUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const blob = await response.blob();
      return { blob, item };
    } catch (error: any) {
      if (retryCount < MAX_RETRIES) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchFileWithRetry(item, retryCount + 1);
      }
      throw error;
    }
  }, []);

  // Process ZIP download - fetch all files and create ZIP
  const processZipDownload = useCallback(async (items: DownloadItem[]) => {
    if (isProcessingZipRef.current) {
      console.warn('ZIP download already in progress');
      return;
    }

    isProcessingZipRef.current = true;
    zipProgressRef.current = { fetched: 0, total: items.length, failed: [] };

    // Initialize all items as queued - show each file individually
    setQueue(items.map(item => ({ ...item, status: 'queued' as const, progress: 0 })));

    const zip = new JSZip();
    let completedFetches = 0;
    const failedItems: { item: DownloadItem; error: string }[] = [];

    // Process items with concurrency limit - update each file's status individually
    const processBatch = async (batch: DownloadItem[]) => {
      // Mark batch items as downloading
      setQueue((prev) =>
        prev.map((q) =>
          batch.some(b => b.id === q.id)
            ? { ...q, status: 'downloading' as const, progress: 0 }
            : q
        )
      );

      const results = await Promise.allSettled(
        batch.map(item => fetchFileWithRetry(item))
      );

      results.forEach((result, index) => {
        const item = batch[index];
        if (result.status === 'fulfilled') {
          const { blob, item: fetchedItem } = result.value;
          zip.file(fetchedItem.fileName, blob);
          completedFetches++;
          zipProgressRef.current.fetched = completedFetches;
          
          // Mark this specific file as complete
          setQueue((prev) =>
            prev.map((q) =>
              q.id === item.id
                ? { ...q, status: 'complete' as const, progress: 100 }
                : q
            )
          );
        } else {
          const error = result.reason?.message || 'Failed to fetch';
          failedItems.push({
            item,
            error,
          });
          zipProgressRef.current.failed.push(item.fileName);
          
          // Mark this specific file as failed
          setQueue((prev) =>
            prev.map((q) =>
              q.id === item.id
                ? { ...q, status: 'failed' as const, error }
                : q
            )
          );
        }
      });
    };

    // Process items in batches of MAX_CONCURRENT_FETCHES
    for (let i = 0; i < items.length; i += MAX_CONCURRENT_FETCHES) {
      const batch = items.slice(i, i + MAX_CONCURRENT_FETCHES);
      await processBatch(batch);
    }

    // All files fetched - now add ZIP generation item
    const zipItemId = `zip-${Date.now()}`;
    const zipFileName = generateZipFilename();
    const zipItem: DownloadItem = {
      id: zipItemId,
      avatarId: '',
      avatarName: 'ZIP Archive',
      fileType: 'Archive',
      fileTypeId: 'zip',
      fileName: zipFileName,
      url: '',
      status: 'downloading',
      progress: 0,
    };

    // Add ZIP item to queue
    setQueue((prev) => [...prev, zipItem]);

    // Generate ZIP file
    try {
      setQueue((prev) =>
        prev.map((q) =>
          q.id === zipItemId
            ? { ...q, progress: 0, status: 'downloading' as const }
            : q
        )
      );

      const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
        // Update progress during ZIP generation
        const zipProgress = Math.round(metadata.percent);
        setQueue((prev) =>
          prev.map((q) =>
            q.id === zipItemId
              ? { ...q, progress: zipProgress }
              : q
          )
        );
      });

      // Trigger single download
      const url = window.URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = zipFileName;
      a.style.display = 'none';
      a.setAttribute('rel', 'noopener noreferrer');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => window.URL.revokeObjectURL(url), 100);

      // Mark ZIP as complete
      setQueue((prev) =>
        prev.map((q) =>
          q.id === zipItemId
            ? {
                ...q,
                status: 'complete' as const,
                progress: 100,
              }
            : q
        )
      );

      console.log(`ZIP download complete: ${completedFetches} files, ${failedItems.length} failed`);
    } catch (error: any) {
      console.error('Error generating ZIP:', error);
      setQueue((prev) =>
        prev.map((q) =>
          q.id === zipItemId
            ? {
                ...q,
                status: 'failed' as const,
                error: error.message || 'Failed to create ZIP file',
              }
            : q
        )
      );
    } finally {
      isProcessingZipRef.current = false;
    }
  }, [fetchFileWithRetry]);

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
          if ((extension === 'vrm' || (extension === 'png' && fileType.category === 'thumbnail')) && fileType.url && fileType.url.includes('.')) {
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

      // Instead of adding items to queue, process them as ZIP immediately
      if (newItems.length > 0) {
        // Clear any existing queue
        setQueue([]);
        // Process as ZIP download
        processZipDownload(newItems);
      }
    },
    [processZipDownload]
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
