/**
 * Download utilities for handling avatar downloads
 * All downloads are routed through the server-side API to preserve user gesture chain
 */

// Helper to check if a URL is an IPFS URL (used for normalization in server-side API)
export function isIPFSUrl(url: string): boolean {
  return url.includes('ipfs') || url.includes('dweb.link') || url.startsWith('ipfs://');
}

// Helper to check if a URL is a GitHub raw URL (used for normalization in server-side API)
export function isGitHubRawUrl(url: string): boolean {
  return url.includes('raw.githubusercontent.com') || url.includes('github.com') && url.includes('/raw/');
}

// Helper to check if a URL should be downloaded client-side (DEPRECATED - kept for backward compatibility)
// NOTE: All downloads should now go through server-side API to preserve user gesture chain
export function isClientSideDownloadUrl(url: string): boolean {
  // Always return false - we route everything through server-side API now
  return false;
}

// Helper to normalize IPFS URLs (convert ipfs:// to https://dweb.link/ipfs/)
// This is still used by the server-side API for handling IPFS URLs
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
 * DEPRECATED: Client-side download function for IPFS and GitHub raw URLs
 * 
 * This function is no longer used. All downloads are now routed through the
 * server-side API endpoint (/api/avatars/[id]/direct-download) to preserve
 * the user gesture chain and avoid Chrome security warnings.
 * 
 * The server-side API handles IPFS, GitHub, and Arweave URLs correctly.
 */
export async function downloadIPFSFile(
  url: string,
  filename: string
): Promise<void> {
  // This function is deprecated - should not be called
  // All downloads should go through downloadAvatar() which uses server-side API
  console.warn('downloadIPFSFile is deprecated. Use downloadAvatar() instead.');
  throw new Error('Client-side downloads are disabled. Use downloadAvatar() with server-side API instead.');
}

/**
 * Main download function that routes all downloads through the server-side API
 * This preserves the user gesture chain and avoids Chrome security warnings.
 * 
 * The server-side API handles IPFS, GitHub, and Arweave URLs correctly.
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

  // Always use server-side download API to preserve user gesture chain
  // The server-side API handles IPFS, GitHub, and Arweave URLs correctly
  const formatParam = format ? `?format=${format}` : '';
  // URL encode the avatar ID in case it contains special characters like slashes
  const encodedAvatarId = encodeURIComponent(avatar.id);
  const directDownloadUrl = `/api/avatars/${encodedAvatarId}/direct-download${formatParam}`;
  
  // Create a temporary anchor element and click it immediately to preserve user gesture chain
  // This must happen synchronously without any async operations to maintain the gesture chain
  const link = document.createElement('a');
  link.href = directDownloadUrl;
  link.download = ''; // Let server set filename via Content-Disposition header
  link.style.display = 'none';
  link.setAttribute('rel', 'noopener noreferrer'); // Security best practice
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
