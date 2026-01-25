import { Avatar } from '@/types/avatar';
import { getArweaveTxId } from '@/lib/arweaveMapping';
import { getArweaveUrl } from '@/lib/arweave-client';

export interface FileTypeInfo {
  id: string;
  label: string;
  url: string | null;
  isVoxel: boolean;
  category: 'model' | 'thumbnail' | 'texture';
  filename?: string; // Original filename for display
}

/**
 * Get file extension from URL or filename
 */
function getFileExtension(urlOrFilename: string): string {
  const match = urlOrFilename.match(/\.([^.]+)$/);
  return match ? match[1].toLowerCase() : '';
}

/**
 * Get label from filename
 */
function getLabelFromFilename(filename: string): string {
  const ext = getFileExtension(filename);
  const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
  
  // Map common extensions to labels
  const extMap: Record<string, string> = {
    'vrm': 'VRM',
    'fbx': 'FBX',
    'glb': 'GLB',
    'gltf': 'GLTF',
    'png': 'PNG',
    'jpg': 'JPG',
    'jpeg': 'JPEG',
    'webp': 'WEBP',
    'gif': 'GIF',
  };
  
  const extLabel = extMap[ext] || ext.toUpperCase();
  
  // Check if voxel variant
  if (nameWithoutExt.toLowerCase().includes('voxel')) {
    return `Voxel ${extLabel}`;
  }
  
  return extLabel;
}

/**
 * Extract transaction ID from Arweave URL
 */
function extractTxIdFromUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  // Match Arweave transaction ID pattern (43 chars alphanumeric + _ -)
  const match = url.match(/arweave\.net\/([a-zA-Z0-9_-]{43})/);
  return match ? match[1] : null;
}

/**
 * Find matching filename in ardriveFiles by transaction ID
 */
function findFilenameByTxId(txId: string, ardriveFiles: string[], type: 'model' | 'thumbnail'): string | null {
  if (!ardriveFiles || !txId) return null;
  
  for (const filename of ardriveFiles) {
    const fileTxId = getArweaveTxId(filename, type);
    if (fileTxId === txId) {
      return filename;
    }
  }
  return null;
}

/**
 * Get all available files for an avatar (including all models, textures, thumbnails)
 * For Arweave avatars: Uses URLs from alternateModels but filenames from ardriveFiles for better display
 */
export function getAllAvatarFiles(avatar: Avatar): FileTypeInfo[] {
  const files: FileTypeInfo[] = [];
  // Track URLs we've already added to avoid duplicates
  const addedUrls = new Set<string>();
  const addedFilenames = new Set<string>();

  // Helper to check if a file already exists
  const fileExists = (filename: string, url?: string | null): boolean => {
    if (url && addedUrls.has(url)) return true;
    // Normalize filename for comparison (remove path, lowercase)
    const normalizedFilename = filename.split('/').pop()?.toLowerCase() || '';
    return addedFilenames.has(normalizedFilename);
  };

  // Helper to add a file and track it
  const addFile = (file: FileTypeInfo) => {
    files.push(file);
    if (file.url) addedUrls.add(file.url);
    if (file.filename) {
      addedFilenames.add(file.filename.toLowerCase());
    }
  };

  // Build maps for matching Arweave files
  const ardriveModels = avatar.metadata?.ardriveFiles?.models || [];
  const ardriveThumbnails = avatar.metadata?.ardriveFiles?.thumbnails || [];

  // Default model - try to find matching filename from ardriveFiles
  // Check if it's GLB based on format or URL extension
  if (avatar.modelFileUrl) {
    let displayFilename = avatar.modelFileUrl.split('/').pop() || 'model.vrm';
    const urlExt = getFileExtension(avatar.modelFileUrl);
    const isGlb = avatar.format?.toUpperCase() === 'GLB' || urlExt === 'glb';
    
    // If it's an Arweave URL, try to find the actual filename
    const txId = extractTxIdFromUrl(avatar.modelFileUrl);
    if (txId) {
      const matchedFilename = findFilenameByTxId(txId, ardriveModels, 'model');
      if (matchedFilename) {
        displayFilename = matchedFilename;
      }
    }
    
    if (!fileExists(displayFilename, avatar.modelFileUrl)) {
      addFile({
        id: isGlb ? 'glb' : 'vrm_main',
        label: getLabelFromFilename(displayFilename),
        url: avatar.modelFileUrl,
        isVoxel: false,
        category: 'model',
        filename: displayFilename,
      });
    }
    
    // If it's a VRM file, try to infer a GLB version (common pattern: same base URL with .glb extension)
    // Only do this if GLB is not already in alternateModels
    if (!isGlb && urlExt === 'vrm' && !avatar.metadata?.alternateModels?.glb) {
      // Try to create GLB URL by replacing .vrm with .glb
      const glbUrl = avatar.modelFileUrl.replace(/\.vrm$/i, '.glb');
      const glbFilename = displayFilename.replace(/\.vrm$/i, '.glb');
      
      // Only add if it's a different URL and not already exists
      if (glbUrl !== avatar.modelFileUrl && !fileExists(glbFilename, glbUrl)) {
        // Check if GLB file might exist in ardriveFiles
        const hasGlbInArdrive = ardriveModels.some((f: string) => 
          f.toLowerCase().endsWith('.glb') && 
          f.toLowerCase().replace(/\.glb$/, '') === displayFilename.toLowerCase().replace(/\.vrm$/, '')
        );
        
        // Only add inferred GLB if we have evidence it might exist (in ardriveFiles or if description mentions GLB)
        const descriptionMentionsGlb = avatar.description?.toLowerCase().includes('glb');
        if (hasGlbInArdrive || descriptionMentionsGlb) {
          addFile({
            id: 'glb',
            label: getLabelFromFilename(glbFilename),
            url: glbUrl,
            isVoxel: false,
            category: 'model',
            filename: glbFilename,
          });
        }
      }
    }
  }

  // Alternate models from metadata - use URLs but match with ardriveFiles for filenames
  if (avatar.metadata?.alternateModels) {
    const altModels = avatar.metadata.alternateModels;

    // FBX
    if (altModels.fbx && typeof altModels.fbx === 'string' && altModels.fbx.trim()) {
      let displayFilename = altModels.fbx.split('/').pop() || 'model.fbx';
      
      // If it's an Arweave URL, try to find the actual filename
      const txId = extractTxIdFromUrl(altModels.fbx);
      if (txId) {
        const matchedFilename = findFilenameByTxId(txId, ardriveModels, 'model');
        if (matchedFilename) {
          displayFilename = matchedFilename;
        }
      }
      
      if (!fileExists(displayFilename, altModels.fbx)) {
        addFile({
          id: 'fbx',
          label: getLabelFromFilename(displayFilename),
          url: altModels.fbx,
          isVoxel: false,
          category: 'model',
          filename: displayFilename,
        });
      }
    }

    // GLB (if exists) - check multiple possible field names for compatibility
    const glbUrl = altModels.glb || altModels.GLB || (typeof altModels === 'object' ? (altModels as any)['glb'] : null);
    if (glbUrl && typeof glbUrl === 'string' && glbUrl.trim()) {
      let displayFilename = glbUrl.split('/').pop() || 'model.glb';
      
      // Ensure filename has .glb extension if missing
      if (!displayFilename.toLowerCase().endsWith('.glb')) {
        const baseName = displayFilename.split('.')[0] || displayFilename;
        displayFilename = `${baseName}.glb`;
      }
      
      const txId = extractTxIdFromUrl(glbUrl);
      if (txId) {
        const matchedFilename = findFilenameByTxId(txId, ardriveModels, 'model');
        if (matchedFilename) {
          displayFilename = matchedFilename;
        }
      }
      
      if (!fileExists(displayFilename, glbUrl)) {
        addFile({
          id: 'glb',
          label: getLabelFromFilename(displayFilename),
          url: glbUrl,
          isVoxel: false,
          category: 'model',
          filename: displayFilename,
        });
      }
    }

    // Voxel VRM
    if (altModels.voxel_vrm) {
      let displayFilename = altModels.voxel_vrm.split('/').pop() || 'model_voxel.vrm';
      
      const txId = extractTxIdFromUrl(altModels.voxel_vrm);
      if (txId) {
        const matchedFilename = findFilenameByTxId(txId, ardriveModels, 'model');
        if (matchedFilename) {
          displayFilename = matchedFilename;
        }
      }
      
      if (!fileExists(displayFilename, altModels.voxel_vrm)) {
        addFile({
          id: 'voxel_vrm',
          label: getLabelFromFilename(displayFilename),
          url: altModels.voxel_vrm,
          isVoxel: true,
          category: 'model',
          filename: displayFilename,
        });
      }
    }

    // Voxel FBX
    if (altModels.voxel_fbx || altModels['voxel-fbx']) {
      const url = altModels.voxel_fbx || altModels['voxel-fbx'];
      let displayFilename = url.split('/').pop() || 'model_voxel.fbx';
      
      const txId = extractTxIdFromUrl(url);
      if (txId) {
        const matchedFilename = findFilenameByTxId(txId, ardriveModels, 'model');
        if (matchedFilename) {
          displayFilename = matchedFilename;
        }
      }
      
      if (!fileExists(displayFilename, url)) {
        addFile({
          id: 'voxel_fbx',
          label: getLabelFromFilename(displayFilename),
          url: url,
          isVoxel: true,
          category: 'model',
          filename: displayFilename,
        });
      }
    }
  }

  // Check animation_url for GLB files (fallback for legacy data structure)
  // NOTE: This is a temporary fallback. For proper structure, use metadata.alternateModels.glb
  // Only use this if alternateModels.glb doesn't exist
  const hasGlbInAlternateModels = !!(avatar.metadata?.alternateModels?.glb && 
    typeof avatar.metadata.alternateModels.glb === 'string' && 
    avatar.metadata.alternateModels.glb.trim());
  
  if (avatar.metadata?.animation_url && !hasGlbInAlternateModels) {
    const animationUrl = avatar.metadata.animation_url;
    const urlExt = getFileExtension(animationUrl);
    
    // Check if animation_url points to a GLB file
    if (urlExt === 'glb' || animationUrl.toLowerCase().includes('.glb')) {
      let displayFilename = animationUrl.split('/').pop() || 'model.glb';
      
      // Ensure filename has .glb extension if missing
      if (!displayFilename.toLowerCase().endsWith('.glb')) {
        const baseName = displayFilename.split('.')[0] || displayFilename;
        displayFilename = `${baseName}.glb`;
      }
      
      // If it's an Arweave URL, try to find the actual filename
      const txId = extractTxIdFromUrl(animationUrl);
      if (txId) {
        const matchedFilename = findFilenameByTxId(txId, ardriveModels, 'model');
        if (matchedFilename) {
          displayFilename = matchedFilename;
        }
      }
      
      if (!fileExists(displayFilename, animationUrl)) {
        addFile({
          id: 'glb',
          label: getLabelFromFilename(displayFilename),
          url: animationUrl,
          isVoxel: false,
          category: 'model',
          filename: displayFilename,
        });
      }
    }
  }

  // Models from ArDrive files (only add if not already in alternateModels)
  // This is a fallback for cases where alternateModels doesn't have all files
  if (avatar.metadata?.ardriveFiles?.models) {
    const models = avatar.metadata.ardriveFiles.models;
    models.forEach((modelFilename: string, index: number) => {
      // Skip if we already have this file from alternateModels
      if (fileExists(modelFilename)) {
        return;
      }
      
      const fileExt = getFileExtension(modelFilename);
      const isGlb = fileExt === 'glb';
      
      // Try to get Arweave transaction ID from mapping
      const txId = getArweaveTxId(modelFilename, 'model');
      if (txId) {
        const url = getArweaveUrl(txId);
        if (!fileExists(modelFilename, url)) {
          // Use appropriate ID based on file type
          const fileId = isGlb ? 'glb' : (fileExt === 'fbx' ? 'fbx' : `ardrive_model_${index}`);
          addFile({
            id: fileId,
            label: getLabelFromFilename(modelFilename),
            url: url,
            isVoxel: modelFilename.toLowerCase().includes('voxel'),
            category: 'model',
            filename: modelFilename,
          });
        }
      } else {
        // If no Arweave mapping, but it's a GLB file mentioned in ardriveFiles,
        // we might still want to show it (though without a URL, it won't be downloadable)
        // For now, skip files without Arweave mapping to avoid broken links
      }
    });
  }

  // Thumbnails - try to find matching filename from ardriveFiles
  if (avatar.thumbnailUrl) {
    let displayFilename = avatar.thumbnailUrl.split('/').pop() || 'thumbnail.png';
    
    // If it's an Arweave URL, try to find the actual filename
    const txId = extractTxIdFromUrl(avatar.thumbnailUrl);
    if (txId) {
      const matchedFilename = findFilenameByTxId(txId, ardriveThumbnails, 'thumbnail');
      if (matchedFilename) {
        displayFilename = matchedFilename;
      }
    }
    
    if (!fileExists(displayFilename, avatar.thumbnailUrl)) {
      addFile({
        id: 'thumbnail_main',
        label: `Thumbnail: ${getLabelFromFilename(displayFilename)}`,
        url: avatar.thumbnailUrl,
        isVoxel: false,
        category: 'thumbnail',
        filename: displayFilename,
      });
    }
  }

  // Alternate views (thumbnails) - prioritize these
  if (avatar.metadata?.alternateViews) {
    const altViews = avatar.metadata.alternateViews;
    if (altViews.icon) {
      const filename = altViews.icon.split('/').pop() || 'icon.png';
      if (!fileExists(filename, altViews.icon)) {
        addFile({
          id: 'thumbnail_icon',
          label: `Thumbnail (Icon): ${getLabelFromFilename(filename)}`,
          url: altViews.icon,
          isVoxel: false,
          category: 'thumbnail',
          filename: filename,
        });
      }
    }
    if (altViews.midShot) {
      const filename = altViews.midShot.split('/').pop() || 'midshot.png';
      if (!fileExists(filename, altViews.midShot)) {
        addFile({
          id: 'thumbnail_midshot',
          label: `Thumbnail (Mid Shot): ${getLabelFromFilename(filename)}`,
          url: altViews.midShot,
          isVoxel: false,
          category: 'thumbnail',
          filename: filename,
        });
      }
    }
    if (altViews.fullbody) {
      const filename = altViews.fullbody.split('/').pop() || 'fullbody.png';
      if (!fileExists(filename, altViews.fullbody)) {
        addFile({
          id: 'thumbnail_fullbody',
          label: `Thumbnail (Full Body): ${getLabelFromFilename(filename)}`,
          url: altViews.fullbody,
          isVoxel: false,
          category: 'thumbnail',
          filename: filename,
        });
      }
    }
  }

  // Thumbnails from ArDrive files (only add if not already in alternateViews)
  if (avatar.metadata?.ardriveFiles?.thumbnails) {
    const thumbnails = avatar.metadata.ardriveFiles.thumbnails;
    thumbnails.forEach((thumbnailFilename: string, index: number) => {
      // Skip if we already have this thumbnail
      if (fileExists(thumbnailFilename)) {
        return;
      }
      
      const txId = getArweaveTxId(thumbnailFilename, 'thumbnail');
      if (txId) {
        const url = getArweaveUrl(txId);
        if (!fileExists(thumbnailFilename, url)) {
          addFile({
            id: `ardrive_thumbnail_${index}`,
            label: `Thumbnail: ${getLabelFromFilename(thumbnailFilename)}`,
            url: url,
            isVoxel: false,
            category: 'thumbnail',
            filename: thumbnailFilename,
          });
        }
      }
    });
  }

  // Textures from ArDrive files
  if (avatar.metadata?.ardriveFiles?.textures) {
    const textures = avatar.metadata.ardriveFiles.textures;
    textures.forEach((textureFilename: string, index: number) => {
      // Skip if we already have this texture
      if (fileExists(textureFilename)) {
        return;
      }
      
      // Try to get Arweave transaction ID from mapping
      const txId = getArweaveTxId(textureFilename, 'model'); // Textures might be in model mapping
      if (txId) {
        const url = getArweaveUrl(txId);
        if (!fileExists(textureFilename, url)) {
          addFile({
            id: `texture_${index}`,
            label: `Texture: ${getLabelFromFilename(textureFilename)}`,
            url: url,
            isVoxel: false,
            category: 'texture',
            filename: textureFilename,
          });
        }
      }
    });
  }

  return files;
}

/**
 * Get all available file types for an avatar (backwards compatibility)
 */
export function getAvailableFileTypes(avatar: Avatar): FileTypeInfo[] {
  return getAllAvatarFiles(avatar);
}

/**
 * Get ArDrive URL for a filename from ardriveFiles
 */
export function getArDriveFileUrl(filename: string, avatar: Avatar): string | null {
  // Try to get from Arweave mapping
  const txId = getArweaveTxId(filename, 'model');
  if (txId) {
    return getArweaveUrl(txId);
  }
  
  // If not found in mapping, return null (file might not be available)
  return null;
}

/**
 * Check if avatar has specific file type
 */
export function hasFileType(avatar: Avatar, fileType: 'vrm' | 'fbx' | 'voxel'): boolean {
  switch (fileType) {
    case 'vrm':
      return !!avatar.modelFileUrl;
    case 'fbx':
      return !!avatar.metadata?.alternateModels?.fbx;
    case 'voxel':
      return !!(avatar.metadata?.alternateModels?.voxel_vrm || avatar.metadata?.alternateModels?.voxel_fbx);
    default:
      return false;
  }
}
