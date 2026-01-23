/**
 * Download utilities for handling avatar downloads
 * Supports both server-side (Arweave) and client-side (IPFS) downloads
 */

// Helper to check if a URL is an IPFS URL
export function isIPFSUrl(url: string): boolean {
  return url.includes('ipfs') || url.includes('dweb.link') || url.startsWith('ipfs://');
}

// Helper to normalize IPFS URLs (convert ipfs:// to https://dweb.link/ipfs/)
export function normalizeIPFSUrl(url: string): string {
  if (url.startsWith('ipfs://')) {
    const ipfsHash = url.replace('ipfs://', '').replace('ipfs/', '');
    return `https://dweb.link/ipfs/${ipfsHash}`;
  }
  return url;
}

// Helper to get file extension based on format
function getFileExtension(format: string): string {
  if (format === 'fbx' || format === 'voxel-fbx' || format === 'voxel_fbx') {
    return '.fbx';
  }
  return '.vrm'; // Default to VRM for any other format
}

// Helper to get model URL for a specific format
function getModelUrlForFormat(
  avatar: { modelFileUrl: string | null; metadata?: { alternateModels?: Record<string, string> } },
  format: string | null
): string | null {
  if (!format || !avatar.metadata?.alternateModels) {
    return avatar.modelFileUrl;
  }

  const alternateModels = avatar.metadata.alternateModels;

  if (format === 'fbx') {
    const url = alternateModels['fbx'];
    // If alternate model exists, use it; otherwise fall back to default
    return url || avatar.modelFileUrl;
  }

  if (format === 'voxel') {
    const url = alternateModels['voxel_vrm'];
    return url || avatar.modelFileUrl;
  }

  if (format === 'voxel-fbx' || format === 'voxel_fbx') {
    const url = alternateModels['voxel_fbx'] || alternateModels['voxel-fbx'];
    return url || avatar.modelFileUrl;
  }

  return avatar.modelFileUrl;
}

/**
 * Client-side download function for IPFS URLs
 * Fetches the file directly from the browser and triggers download
 */
export async function downloadIPFSFile(
  url: string,
  filename: string
): Promise<void> {
  try {
    console.log(`Downloading IPFS file: ${url}`);
    
    // Normalize IPFS URL
    const normalizedUrl = normalizeIPFSUrl(url);
    
    // Fetch the file
    const response = await fetch(normalizedUrl);
    
    if (!response.ok) {
      // Try alternative gateway if dweb.link fails
      if (normalizedUrl.includes('dweb.link')) {
        const alternativeUrl = normalizedUrl.replace('dweb.link', 'ipfs.io');
        console.log(`Retrying with alternative IPFS gateway: ${alternativeUrl}`);
        const retryResponse = await fetch(alternativeUrl);
        
        if (!retryResponse.ok) {
          throw new Error(`Failed to fetch file: ${retryResponse.status} ${retryResponse.statusText}`);
        }
        
        const blob = await retryResponse.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
        return;
      }
      
      throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
    }

    // Convert to blob and trigger download
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
    
    console.log(`Successfully downloaded: ${filename}`);
  } catch (error) {
    console.error('IPFS download error:', error);
    throw error;
  }
}

/**
 * Main download function that handles both IPFS (client-side) and Arweave (server-side) downloads
 */
export async function downloadAvatar(
  avatar: { 
    id: string; 
    name: string; 
    modelFileUrl: string | null; 
    metadata?: { 
      alternateModels?: Record<string, string>;
      number?: string;
    } 
  },
  format: string | null = null
): Promise<void> {
  if (!avatar.modelFileUrl) {
    throw new Error('No model file available');
  }

  // Get the model URL for the requested format
  const modelUrl = getModelUrlForFormat(avatar, format);
  
  if (!modelUrl) {
    throw new Error('Could not determine model URL');
  }

  // Check if it's an IPFS URL
  if (isIPFSUrl(modelUrl)) {
    // Use client-side download for IPFS
    const extension = getFileExtension(format || 'default');
    const cleanName = (avatar.name || avatar.metadata?.number || 'avatar').replace(/[^a-zA-Z0-9_-]/g, '_');
    const voxelPart = format && (format.includes('voxel') || format === 'voxel') ? '_voxel' : '';
    const filename = `${cleanName}${voxelPart}${extension}`;
    
    await downloadIPFSFile(modelUrl, filename);
  } else {
    // Use server-side download for Arweave and other URLs
    const formatParam = format ? `?format=${format}` : '';
    const directDownloadUrl = `/api/avatars/${avatar.id}/direct-download${formatParam}`;
    window.open(directDownloadUrl, '_blank');
  }
}
