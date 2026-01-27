import { NextRequest, NextResponse } from 'next/server';
import { getAvatars, getDownloadCounts, saveDownloadCounts } from '@/lib/github-storage';

// Define interfaces
interface DownloadCounts {
  counts: Record<string, number>;
}

interface AvatarMetadata {
  alternateModels?: {
    voxel?: string;
    voxel_vrm?: string;
    fbx?: string;
    'voxel-fbx'?: string;
    voxel_fbx?: string;
    [key: string]: string | undefined;
  };
  [key: string]: any;
}

interface Avatar {
  id: string;
  name: string;
  modelFileUrl: string | null;
  metadata: AvatarMetadata;
  [key: string]: any;
}

// Helper function to get model filename for a specific format
function getModelFilenameForFormat(
  avatar: Avatar,
  format: string | null
): string | null {
  if (!format || !avatar.metadata?.alternateModels) {
    return null;
  }
  
  const alternateModels = avatar.metadata.alternateModels;
  
  // Find the appropriate key based on the format
  if (format === 'fbx') {
    return alternateModels['fbx'] || null;
  }
  
  if (format === 'glb') {
    return alternateModels['glb'] || null;
  }
  
  if (format === 'voxel') {
    return alternateModels['voxel_vrm'] || null;
  }
  
  if (format === 'voxel-fbx' || format === 'voxel_fbx') {
    return alternateModels['voxel_fbx'] || alternateModels['voxel-fbx'] || null;
  }
  
  return null;
}

// Helper to get file extension based on format
function getFileExtension(format: string): string {
  if (format === 'fbx' || format === 'voxel-fbx' || format === 'voxel_fbx') {
    return '.fbx';
  }
  if (format === 'glb') {
    return '.glb';
  }
  return '.vrm'; // Default to VRM for any other format
}

// Helper to check if a URL is an IPFS URL
function isIPFSUrl(url: string): boolean {
  return url.includes('ipfs') || url.includes('dweb.link') || url.startsWith('ipfs://');
}

// Helper to check if a URL is a GitHub raw URL
function isGitHubRawUrl(url: string): boolean {
  return url.includes('raw.githubusercontent.com') || (url.includes('github.com') && url.includes('/raw/'));
}

// Helper to normalize IPFS URLs (convert ipfs:// to https://dweb.link/ipfs/)
function normalizeIPFSUrl(url: string): string {
  if (url.startsWith('ipfs://')) {
    const ipfsHash = url.replace('ipfs://', '').replace('ipfs/', '');
    return `https://dweb.link/ipfs/${ipfsHash}`;
  }
  return url;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get format from query parameter
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || null;
    
    // Next.js automatically decodes URL parameters, so params.id is already decoded
    // Get avatar details from GitHub storage
    const avatars = await getAvatars();
    const avatar = avatars.find((a: Avatar) => a.id === params.id);

    if (!avatar) {
      // Log for debugging - this helps identify if avatar IDs don't match
      console.error(`Avatar not found. ID: "${params.id}", Total avatars: ${avatars.length}`);
      // Log first few avatar IDs for debugging
      if (avatars.length > 0) {
        console.error('Sample avatar IDs:', avatars.slice(0, 3).map(a => a.id));
      }
      return NextResponse.json({ error: 'Avatar not found' }, { status: 404 });
    }

    if (!avatarToUse.modelFileUrl) {
      return NextResponse.json({ error: 'No model file available' }, { status: 400 });
    }

    let modelUrl = '';
    let actualFormat = format || 'default';
    
    // Check if a specific format was requested and if alternate models exist
    if (format && avatar.metadata?.alternateModels) {
      // Get model filename using our helper function
      const formatFilename = getModelFilenameForFormat(avatar, format);
      
      console.log('Download format requested:', format);
      console.log('Available alternate models:', JSON.stringify(avatar.metadata.alternateModels, null, 2));
      console.log('Format filename found:', formatFilename);
      
      if (formatFilename) {
        // Normalize IPFS URLs in alternate models too
        modelUrl = normalizeIPFSUrl(formatFilename);
      } else {
        // Format not found in alternate models - but instead of returning an error,
        // let's fallback to the default model and log a warning
        console.warn(`Requested format '${format}' not available for avatar '${avatar.name}'. Using default model instead.`);
        modelUrl = avatar.modelFileUrl;
        actualFormat = 'default'; // Reset to default format
      }
    } else {
      // Use the default model file URL
      modelUrl = avatar.modelFileUrl;
    }
    
    if (!modelUrl) {
      return NextResponse.json({ error: 'Could not determine model URL' }, { status: 400 });
    }
    
    // Normalize IPFS URLs if needed
    const normalizedUrl = normalizeIPFSUrl(modelUrl);
    const isIPFS = isIPFSUrl(normalizedUrl);
    const isGitHub = isGitHubRawUrl(normalizedUrl);
    
    // Create a proper filename
    // For GitHub URLs, try to extract filename from URL
    let filename: string;
    if (isGitHub) {
      const urlFilename = normalizedUrl.split('/').pop() || '';
      const urlExt = urlFilename.split('.').pop()?.toLowerCase();
      if (urlExt && ['vrm', 'fbx', 'glb', 'gltf'].includes(urlExt)) {
        const cleanName = (avatar.name || avatar.metadata?.number || 'avatar').replace(/[^a-zA-Z0-9_-]/g, '_');
        filename = `${cleanName}.${urlExt}`;
      } else {
        // Fallback to format-based extension
        const extension = getFileExtension(actualFormat);
        const cleanName = (avatar.name || avatar.metadata?.number || 'avatar').replace(/[^a-zA-Z0-9_-]/g, '_');
        const voxelPart = actualFormat && (actualFormat.includes('voxel') || actualFormat === 'voxel') ? '_voxel' : '';
        filename = `${cleanName}${voxelPart}${extension}`;
      }
    } else {
      const extension = getFileExtension(actualFormat);
      const cleanName = (avatar.name || avatar.metadata?.number || 'avatar').replace(/[^a-zA-Z0-9_-]/g, '_');
      const voxelPart = actualFormat && (actualFormat.includes('voxel') || actualFormat === 'voxel') ? '_voxel' : '';
      filename = `${cleanName}${voxelPart}${extension}`;
    }
    
    console.log(`Downloading ${filename} from ${normalizedUrl}${isIPFS ? ' (IPFS)' : isGitHub ? ' (GitHub)' : ''}`);
    
    try {
      // Fetch the file directly
      // For IPFS URLs, we might need a longer timeout and retry logic
      const fetchOptions: RequestInit = {
        headers: {
          'Accept': '*/*',
        }
      };
      
      // Add timeout for IPFS URLs (use AbortSignal.timeout if available, otherwise skip)
      let timeoutId: NodeJS.Timeout | null = null;
      if (isIPFS && typeof AbortSignal !== 'undefined' && AbortSignal.timeout) {
        try {
          fetchOptions.signal = AbortSignal.timeout(30000); // 30 seconds for IPFS
        } catch (e) {
          // Fallback: use manual timeout if AbortSignal.timeout is not available
          const controller = new AbortController();
          timeoutId = setTimeout(() => controller.abort(), 30000);
          fetchOptions.signal = controller.signal;
        }
      }
      
      const response = await fetch(normalizedUrl, fetchOptions);
      
      // Clear timeout if we set one manually
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      if (!response.ok) {
        // For IPFS URLs, provide more helpful error messages
        if (isIPFS) {
          console.error(`IPFS fetch failed: ${response.status} ${response.statusText}`);
          // Try alternative IPFS gateway if dweb.link fails
          if (normalizedUrl.includes('dweb.link')) {
            const alternativeUrl = normalizedUrl.replace('dweb.link', 'ipfs.io');
            console.log(`Retrying with alternative IPFS gateway: ${alternativeUrl}`);
            try {
              // Create new fetch options for retry
              const retryFetchOptions: RequestInit = {
                headers: {
                  'Accept': '*/*',
                }
              };
              
              // Add timeout for retry too
              let retryTimeoutId: NodeJS.Timeout | null = null;
              if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) {
                try {
                  retryFetchOptions.signal = AbortSignal.timeout(30000);
                } catch (e) {
                  const controller = new AbortController();
                  retryTimeoutId = setTimeout(() => controller.abort(), 30000);
                  retryFetchOptions.signal = controller.signal;
                }
              }
              
              const retryResponse = await fetch(alternativeUrl, retryFetchOptions);
              
              if (retryTimeoutId) {
                clearTimeout(retryTimeoutId);
              }
              if (retryResponse.ok) {
                const buffer = await retryResponse.arrayBuffer();
                // Update download counts in the background
                try {
                  const downloadCounts = await getDownloadCounts() as DownloadCounts;
                  if (!downloadCounts.counts) {
                    downloadCounts.counts = {};
                  }
                  downloadCounts.counts[avatar.id] = (downloadCounts.counts[avatar.id] || 0) + 1;
                  saveDownloadCounts(downloadCounts).catch((err: Error) => 
                    console.error('Failed to save download count:', err)
                  );
                } catch (error) {
                  console.error('Error updating download counts:', error);
                }
                return new NextResponse(buffer, {
                  status: 200,
                  headers: {
                    'Content-Type': (actualFormat === 'fbx' || actualFormat === 'glb') ? 'application/octet-stream' : 'model/vrm',
                    'Content-Disposition': `attachment; filename="${filename}"`,
                    'Cache-Control': 'public, max-age=86400',
                  }
                });
              }
            } catch (retryError) {
              console.error('Retry with alternative gateway also failed:', retryError);
            }
          }
        }
        return NextResponse.json({
          error: `Failed to fetch file: ${response.status} ${response.statusText}${isIPFS ? ' (IPFS gateway may be slow or unavailable)' : ''}`
        }, { status: response.status });
      }
      
      // Get file buffer
      const buffer = await response.arrayBuffer();
      
      // Update download counts in the background
      try {
        const downloadCounts = await getDownloadCounts() as DownloadCounts;
        
        if (!downloadCounts.counts) {
          downloadCounts.counts = {};
        }
        
        downloadCounts.counts[avatar.id] = (downloadCounts.counts[avatar.id] || 0) + 1;
        saveDownloadCounts(downloadCounts).catch((err: Error) => 
          console.error('Failed to save download count:', err)
        );
      } catch (error) {
        console.error('Error updating download counts:', error);
        // Continue anyway
      }
      
      // Return the file with proper headers
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': (actualFormat === 'fbx' || actualFormat === 'glb') ? 'application/octet-stream' : 'model/vrm',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'public, max-age=86400',
        }
      });
    } catch (error) {
      console.error('Download error:', error);
      return NextResponse.json({
        error: 'Failed to download file',
        message: (error as Error).message
      }, { status: 500 });
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: (error as Error).message
    }, { status: 500 });
  }
} 