'use client';

import React, { useState, useEffect, useMemo, memo } from 'react';
import { Download, File, Image as ImageIcon, FileIcon, FileText, Layers, Box } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Avatar, Project } from '@/types/avatar';
import { VRMViewer } from '@/components/VRMViewer/VRMViewer';
import { DEFAULT_ANIMATION } from '@/components/VRMViewer/constants/defaults';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionItem } from '@/components/ui/accordion';
import { getAvailableFileTypes, getAllAvatarFiles } from './utils/fileTypes';
import { FileTypeInfo } from './utils/fileTypes';
import { downloadAvatar } from '@/lib/download-utils';
import TextureRenderer from '@/components/VRMViewer/TextureRenderer';
import ImageLightbox from './ImageLightbox';
import * as THREE from 'three';

interface PreviewPanelProps {
  avatar: Avatar | null;
  selectedFile: FileTypeInfo | null;
  projects: Project[];
}

// Helper function to format file size
const formatFileSize = (bytes: number | null | undefined, t?: (key: string) => string): string => {
  if (!bytes || bytes === 0) return t ? t('finder.common.unknown') : 'Unknown';
  
  const k = 1024;
  const sizes = [
    t ? t('finder.fileSizeUnits.bytes') : 'Bytes',
    t ? t('finder.fileSizeUnits.kb') : 'KB',
    t ? t('finder.fileSizeUnits.mb') : 'MB',
    t ? t('finder.fileSizeUnits.gb') : 'GB'
  ];
  
  // Calculate the appropriate unit index
  let i = Math.floor(Math.log(bytes) / Math.log(k));
  
  // Ensure we use at least KB for files >= 1024 bytes
  if (bytes >= k && i < 1) i = 1;
  // Ensure we use at least MB for files >= 1 MB
  if (bytes >= k * k && i < 2) i = 2;
  // Ensure we use at least GB for files >= 1 GB
  if (bytes >= k * k * k && i < 3) i = 3;
  
  // Clamp to valid array index
  i = Math.min(i, sizes.length - 1);
  i = Math.max(i, 0);
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper function to format file size in MB (for model files - always shows in MB even if < 1 MB)
const formatFileSizeInMB = (bytes: number | null | undefined, t?: (key: string) => string): string => {
  if (!bytes || bytes === 0) return t ? t('finder.common.unknown') : 'Unknown';
  
  const k = 1024;
  const mbUnit = t ? t('finder.fileSizeUnits.mb') : 'MB';
  const gbUnit = t ? t('finder.fileSizeUnits.gb') : 'GB';
  
  // If file is >= 1 GB, show in GB
  if (bytes >= k * k * k) {
    const gb = bytes / (k * k * k);
    return parseFloat(gb.toFixed(2)) + ' ' + gbUnit;
  }
  
  // Otherwise, always show in MB (even if < 1 MB, e.g., "0.5 MB")
  const mb = bytes / (k * k);
  return parseFloat(mb.toFixed(2)) + ' ' + mbUnit;
};

// Helper to get download button text
const getDownloadButtonText = (selectedFile: FileTypeInfo | null, avatar: Avatar | null, t?: (key: string) => string): string => {
  if (!avatar) return t ? t('finder.common.download') : 'Download';
  if (selectedFile) {
    return `${t ? t('finder.common.download') : 'Download'} ${selectedFile.label}`;
  }
  return t ? t('finder.common.downloadAllFiles') : 'Download All Files';
};

// Helper to extract just the format from labels like "Thumbnail: PNG" -> "PNG"
const extractFormat = (label: string): string => {
  // If label contains a colon, take the part after it
  const colonIndex = label.indexOf(':');
  if (colonIndex !== -1) {
    return label.substring(colonIndex + 1).trim();
  }
  return label;
};

// Helper to get file format from file info
const getFileFormat = (file: FileTypeInfo | null): string => {
  if (!file) return 'Unknown';
  
  // First, try to get format from label (most reliable)
  if (file.label) {
    const format = extractFormat(file.label);
    // If format looks valid (not the full label), return it
    if (format && format.length <= 10 && !format.includes(' ')) {
      return format;
    }
    // Check if label contains format info
    const labelLower = file.label.toLowerCase();
    if (labelLower.includes('vrm')) return 'VRM';
    if (labelLower.includes('fbx')) return 'FBX';
    if (labelLower.includes('glb')) return 'GLB';
    if (labelLower.includes('gltf')) return 'GLTF';
  }
  
  // Check file ID
  if (file.id) {
    const fileId = file.id.toLowerCase();
    if (fileId === 'vrm' || fileId === 'vrm_main' || fileId === 'voxel_vrm') return 'VRM';
    if (fileId === 'fbx' || fileId === 'voxel_fbx') return 'FBX';
    if (fileId === 'glb') return 'GLB';
  }
  
  // Check filename extension
  if (file.filename) {
    const ext = file.filename.split('.').pop()?.toLowerCase();
    if (ext) {
      const extMap: Record<string, string> = {
        'vrm': 'VRM',
        'fbx': 'FBX',
        'glb': 'GLB',
        'gltf': 'GLTF',
      };
      if (extMap[ext]) return extMap[ext];
      return ext.toUpperCase();
    }
  }
  
  // Check URL extension as last resort
  if (file.url) {
    const urlExt = file.url.split('.').pop()?.toLowerCase() || null;
    if (urlExt && urlExt.length <= 5) {
      const extMap: Record<string, string> = {
        'vrm': 'VRM',
        'fbx': 'FBX',
        'glb': 'GLB',
        'gltf': 'GLTF',
      };
      if (extMap[urlExt]) return extMap[urlExt];
    }
  }
  
  return 'Unknown';
};

// Helper to check if a string is a URL (IPFS, HTTP, HTTPS)
const isUrl = (str: string): boolean => {
  if (!str || typeof str !== 'string') return false;
  const trimmed = str.trim();
  return trimmed.startsWith('http://') || 
         trimmed.startsWith('https://') || 
         trimmed.startsWith('ipfs://') ||
         trimmed.startsWith('ar://') ||
         /^[a-zA-Z0-9]{46}$/.test(trimmed); // Arweave transaction ID
};

// Helper to get license type name
const getLicenseTypeName = (licenseType: any, licenseName?: string, otherPermissions?: string, t?: (key: string) => string): string => {
  // If there's an IPFS/URL link in otherPermissions, it's likely "Other"
  if (otherPermissions && isUrl(otherPermissions)) {
    return t ? t('finder.licenseTypes.other') : 'Other';
  }
  
  // IMPORTANT: If licenseName is provided, use it directly
  if (licenseName && typeof licenseName === 'string' && licenseName.trim() !== '') {
    const cleanName = licenseName.trim();
    // Format: Replace underscores with spaces and capitalize correctly
    if (cleanName.includes('_')) {
      // Special case for common Creative Commons formats
      if (cleanName.startsWith('CC_')) {
        return cleanName.replace(/_/g, ' ');
      }
      // For other underscore formats, just replace underscores
      return cleanName.replace(/_/g, ' ');
    }
    return cleanName;
  }
  
  // Only fall back to numeric mapping if no licenseName is provided
  // Convert to number if it's a string containing only digits
  if (typeof licenseType === 'string' && /^\d+$/.test(licenseType)) {
    licenseType = parseInt(licenseType, 10);
  }
  
  // Standard VRM license mapping as per the spec
  const licenseTypes: Record<number, string> = {
    0: t ? t('finder.licenseTypes.redistributionProhibited') : 'Redistribution Prohibited',
    1: t ? t('finder.licenseTypes.cc0') : 'CC0',
    2: t ? t('finder.licenseTypes.ccBy') : 'CC BY',
    3: t ? t('finder.licenseTypes.ccByNc') : 'CC BY NC',
    4: t ? t('finder.licenseTypes.ccBySa') : 'CC BY SA',
    5: t ? t('finder.licenseTypes.ccByNcSa') : 'CC BY NC SA',
    6: t ? t('finder.licenseTypes.ccByNd') : 'CC BY ND',
    7: t ? t('finder.licenseTypes.ccByNcNd') : 'CC BY NC ND',
    8: t ? t('finder.licenseTypes.other') : 'Other'
  };
  
  return licenseTypes[licenseType as number] || (t ? t('finder.common.unknown') : 'Unknown');
};

// Helper to extract URLs from text and make them clickable
const renderLinkableText = (text: string): React.ReactNode => {
  if (!text) return text;
  
  // Check if the entire text is a URL
  if (isUrl(text)) {
    const url = text.trim();
    const displayUrl = url.length > 50 ? `${url.substring(0, 47)}...` : url;
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 dark:text-blue-400 hover:underline break-all"
      >
        {displayUrl}
      </a>
    );
  }
  
  // Check if text contains URLs
  const urlRegex = /(https?:\/\/[^\s]+|ipfs:\/\/[^\s]+|ar:\/\/[^\s]+)/gi;
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (isUrl(part)) {
      const displayUrl = part.length > 50 ? `${part.substring(0, 47)}...` : part;
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline break-all"
        >
          {displayUrl}
        </a>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

// Helper to get allowed user name
const getAllowedUserName = (allowedUser: any, t?: (key: string) => string): string => {
  // Convert to number if it's a string containing only digits
  if (typeof allowedUser === 'string' && /^\d+$/.test(allowedUser)) {
    allowedUser = parseInt(allowedUser, 10);
  }
  
  // Check if it's a string matching the values
  if (typeof allowedUser === 'string') {
    if (allowedUser.toLowerCase() === 'everyone') {
      return t ? t('finder.permissions.everyone') : 'Everyone';
    } else if (allowedUser.toLowerCase().includes('explicit') || 
               allowedUser.toLowerCase().includes('contact')) {
      return t ? t('finder.permissions.explicitUser') : 'Explicit User';
    } else if (allowedUser.toLowerCase().includes('author') || 
               allowedUser.toLowerCase().includes('only')) {
      return t ? t('finder.permissions.onlyAuthor') : 'Only Author';
    }
  }
  
  const allowedUsers: Record<number, string> = {
    0: t ? t('finder.permissions.onlyAuthor') : 'Only Author',
    1: t ? t('finder.permissions.everyone') : 'Everyone',
    2: t ? t('finder.permissions.explicitUser') : 'Explicit User'
  };
  
  return allowedUsers[allowedUser as number] || (t ? t('finder.common.unknown') : 'Unknown');
};

// Helper to get usage permission name
const getUsageName = (usage: any, t?: (key: string) => string): string => {
  // For VRM 0.x format: 0 = Disallow, 1 = Allow
  if (usage === 0 || usage === '0') {
    return t ? t('finder.usage.disallow') : 'Disallow';
  } else if (usage === 1 || usage === '1') {
    return t ? t('finder.usage.allow') : 'Allow';
  } else if (typeof usage === 'string') {
    // Handle string values (case insensitive)
    const value = usage.toLowerCase().trim();
    if (value === 'allow' || value === 'allowed' || value === 'yes' || value === 'true') {
      return t ? t('finder.usage.allow') : 'Allow';
    } else {
      return t ? t('finder.usage.disallow') : 'Disallow';
    }
  } else if (usage === true) {
    return t ? t('finder.usage.allow') : 'Allow';
  } else if (usage === false) {
    return t ? t('finder.usage.disallow') : 'Disallow';
  }
  
  // Default fallback
  return t ? t('finder.usage.disallow') : 'Disallow';
};

interface VRMMetadata {
  title?: string;
  author?: string;
  version?: string;
  contactInformation?: string;
  reference?: string;
  licenseType?: number;
  licenseName?: string;
  allowedUserName?: number;
  commercialUsageName?: number;
  violentUsageName?: number;
  sexualUsageName?: number;
  otherPermissions?: string;
}

interface ModelStats {
  fileSize: string;
  format: string;
  height: number;
  vertices: number;
  triangles: number;
  materials: number;
  textures: number;
  bones: number;
}

interface ExtractedTexture {
  name: string;
  type: string;
  mapType: string;
  texture: THREE.Texture;
  material: string;
  fileSize: string;
}

function PreviewPanel({ avatar, selectedFile, projects }: PreviewPanelProps) {
  const { t } = useI18n();
  
  // Helper function to ensure translation result is a string
  const getTranslationString = (value: string | string[]): string => {
    return Array.isArray(value) ? value[0] : value;
  };
  
  // Wrapper function to convert t() to the signature expected by helper functions
  const tString = (key: string): string => {
    return getTranslationString(t(key));
  };
  
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [imageFileSize, setImageFileSize] = useState<number | null>(null);
  const [imageFormat, setImageFormat] = useState<string | null>(null); // Detected format from Content-Type
  const [correctedFilename, setCorrectedFilename] = useState<string | null>(null); // Filename with correct extension
  const [modelFileSize, setModelFileSize] = useState<number | null>(null);
  const [vrmMetadata, setVrmMetadata] = useState<VRMMetadata | null>(null);
  const [vrmVersion, setVrmVersion] = useState<string | null>(null);
  const [modelStats, setModelStats] = useState<ModelStats>({
    fileSize: t('finder.common.unknown') as string,
    format: t('finder.common.unknown') as string,
    height: 0,
    vertices: 0,
    triangles: 0,
    materials: 0,
    textures: 0,
    bones: 0,
  });
  const [activeTab, setActiveTab] = useState<'model' | 'textures'>('model');
  const [extractedTextures, setExtractedTextures] = useState<ExtractedTexture[]>([]);
  const [lightboxImage, setLightboxImage] = useState<{
    url: string;
    alt: string;
    filename?: string;
    downloadHandler?: () => void;
  } | null>(null);

  // Helper to map Content-Type to image format
  const getImageFormatFromContentType = (contentType: string | null): string | null => {
    if (!contentType) return null;
    
    const contentTypeLower = contentType.toLowerCase();
    const formatMap: Record<string, string> = {
      'image/png': 'PNG',
      'image/jpeg': 'JPEG',
      'image/jpg': 'JPEG',
      'image/gif': 'GIF',
      'image/webp': 'WEBP',
      'image/svg+xml': 'SVG',
      'image/bmp': 'BMP',
      'image/tiff': 'TIFF',
      'image/x-icon': 'ICO',
    };
    
    // Check exact match first
    if (formatMap[contentTypeLower]) {
      return formatMap[contentTypeLower];
    }
    
    // Check if it starts with image/
    if (contentTypeLower.startsWith('image/')) {
      const format = contentTypeLower.split('/')[1].split(';')[0].toUpperCase();
      return format;
    }
    
    return null;
  };

  // Helper to get file extension from format
  const getExtensionFromFormat = (format: string): string => {
    const extMap: Record<string, string> = {
      'PNG': 'png',
      'JPEG': 'jpg',
      'GIF': 'gif',
      'WEBP': 'webp',
      'SVG': 'svg',
      'BMP': 'bmp',
      'TIFF': 'tiff',
      'ICO': 'ico',
    };
    return extMap[format.toUpperCase()] || 'png';
  };

  // Load image dimensions, file size, and format when image file is selected
  useEffect(() => {
    if (selectedFile && (selectedFile.category === 'thumbnail' || selectedFile.category === 'texture') && selectedFile.url) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      };
      
      img.onerror = () => {
        setImageDimensions(null);
      };
      
      img.src = selectedFile.url;

      // Fetch file size and Content-Type
      fetch(selectedFile.url, { method: 'HEAD' })
        .then((response) => {
          // Get Content-Type to determine actual format
          const contentType = response.headers.get('content-type');
          const detectedFormat = getImageFormatFromContentType(contentType);
          
          if (detectedFormat) {
            setImageFormat(detectedFormat);
            
            // Update filename with correct extension if missing
            const currentFilename = selectedFile.filename || (selectedFile.url ? selectedFile.url.split('/').pop() : null) || 'image';
            const hasExtension = /\.(png|jpg|jpeg|gif|webp|svg|bmp|tiff|ico)$/i.test(currentFilename);
            
            if (!hasExtension) {
              const extension = getExtensionFromFormat(detectedFormat);
              const baseName = currentFilename.split('.')[0] || currentFilename;
              setCorrectedFilename(`${baseName}.${extension}`);
            } else {
              setCorrectedFilename(null); // Filename already has extension
            }
          } else {
            setImageFormat(null);
            setCorrectedFilename(null);
          }
          
          // Get file size
          const contentLength = response.headers.get('content-length');
          if (contentLength) {
            setImageFileSize(parseInt(contentLength, 10));
          }
        })
        .catch(() => {
          // If HEAD fails, try to get size and type from the loaded image/blob
          if (!selectedFile.url) return;
          
          let detectedFormatFromResponse: string | null = null;
          
          fetch(selectedFile.url)
            .then((response) => {
              // Try to get Content-Type from response
              const contentType = response.headers.get('content-type');
              detectedFormatFromResponse = getImageFormatFromContentType(contentType);
              
              if (detectedFormatFromResponse) {
                setImageFormat(detectedFormatFromResponse);
                
                // Update filename with correct extension if missing
                const currentFilename = selectedFile.filename || (selectedFile.url ? selectedFile.url.split('/').pop() : null) || 'image';
                const hasExtension = /\.(png|jpg|jpeg|gif|webp|svg|bmp|tiff|ico)$/i.test(currentFilename);
                
                if (!hasExtension) {
                  const extension = getExtensionFromFormat(detectedFormatFromResponse);
                  const baseName = currentFilename.split('.')[0] || currentFilename;
                  setCorrectedFilename(`${baseName}.${extension}`);
                } else {
                  setCorrectedFilename(null);
                }
              } else {
                setImageFormat(null);
                setCorrectedFilename(null);
              }
              
              return response.blob();
            })
            .then((blob) => {
              setImageFileSize(blob.size);
              
              // If we didn't get format from headers, try from blob type
              if (!detectedFormatFromResponse && blob.type) {
                const detectedFormat = getImageFormatFromContentType(blob.type);
                if (detectedFormat) {
                  setImageFormat(detectedFormat);
                  
                  const currentFilename = selectedFile.filename || (selectedFile.url ? selectedFile.url.split('/').pop() : null) || 'image';
                  const hasExtension = /\.(png|jpg|jpeg|gif|webp|svg|bmp|tiff|ico)$/i.test(currentFilename);
                  
                  if (!hasExtension) {
                    const extension = getExtensionFromFormat(detectedFormat);
                    const baseName = currentFilename.split('.')[0] || currentFilename;
                    setCorrectedFilename(`${baseName}.${extension}`);
                  } else {
                    setCorrectedFilename(null);
                  }
                }
              }
            })
            .catch(() => {
              setImageFileSize(null);
              setImageFormat(null);
              setCorrectedFilename(null);
            });
        });
    } else {
      setImageDimensions(null);
      setImageFileSize(null);
      setImageFormat(null);
      setCorrectedFilename(null);
    }
  }, [selectedFile]);

  // Load file size for GLB/FBX model files
  useEffect(() => {
    if (selectedFile && selectedFile.category === 'model' && selectedFile.url) {
      const fileFormat = getFileFormat(selectedFile);
      // Only fetch file size for GLB/FBX files (not VRM, as VRM file size comes from metadata)
      if (fileFormat === 'FBX' || fileFormat === 'GLB' || fileFormat === 'GLTF') {
        // Fetch file size
        fetch(selectedFile.url, { method: 'HEAD' })
          .then((response) => {
            const contentLength = response.headers.get('content-length');
            if (contentLength) {
              setModelFileSize(parseInt(contentLength, 10));
            } else {
              // If HEAD doesn't provide content-length, try fetching as blob
              if (!selectedFile.url) return;
              fetch(selectedFile.url)
                .then((response) => response.blob())
                .then((blob) => {
                  setModelFileSize(blob.size);
                })
                .catch(() => {
                  setModelFileSize(null);
                });
            }
          })
          .catch(() => {
            // If HEAD fails, try to get size from fetching the blob
            if (!selectedFile.url) return;
            fetch(selectedFile.url)
              .then((response) => response.blob())
              .then((blob) => {
                setModelFileSize(blob.size);
              })
              .catch(() => {
                setModelFileSize(null);
              });
          });
      } else {
        setModelFileSize(null);
      }
    } else {
      setModelFileSize(null);
    }
  }, [selectedFile]);

  // Handle metadata load from VRMViewer
  const handleMetadataLoad = useMemo(() => {
    return (data: any) => {
      if (!data) return;
      
      // Update model stats
      setModelStats(prev => ({
        ...prev,
        triangles: data.triangleCount || 0,
        materials: data.materialCount || 0,
        format: data.format || (t('finder.common.unknown') as string),
        height: data.avatarHeight || 0,
        fileSize: data.fileSize || (t('finder.common.unknown') as string),
        vertices: data.vertexCount || 0,
        textures: data.textureCount || 0,
        bones: data.boneCount || 0,
      }));
      
      // Set VRM version
      setVrmVersion(data.vrmVersion || (t('finder.common.unknown') as string));
      
      // Process VRM metadata if available
      if (data.rawMetadata) {
        try {
          const rawMeta = data.rawMetadata;
          const cleanedMetadata: VRMMetadata = {
            title: rawMeta.title || (t('finder.common.unknown') as string),
            version: data.version || rawMeta.version || rawMeta.specVersion || (t('finder.common.unknown') as string),
            author: rawMeta.author || rawMeta.authors?.[0] || (t('finder.common.unknown') as string),
            contactInformation: data.contactInformation || rawMeta.contactInformation || '',
            reference: data.reference || rawMeta.reference || '',
            licenseType: rawMeta.licenseType,
            licenseName: data.licenseName || rawMeta.licenseName || '',
            allowedUserName: rawMeta.allowedUserName,
            commercialUsageName: rawMeta.commercialUsageName || rawMeta.commercialUssageName,
            violentUsageName: rawMeta.violentUsageName || rawMeta.violentUssageName,
            sexualUsageName: rawMeta.sexualUsageName || rawMeta.sexualUssageName,
            otherPermissions: rawMeta.otherPermissionUrl || rawMeta.otherPermissions || '',
          };
          
          setVrmMetadata(cleanedMetadata);
        } catch (error) {
          console.error('Error processing metadata:', error);
        }
      }
    };
  }, []);

  // Handle textures load from VRMViewer
  const handleTexturesLoad = useMemo(() => {
    return (textures: ExtractedTexture[]) => {
      setExtractedTextures(textures);
    };
  }, []);

  // Reset metadata when avatar or selected file changes
  useEffect(() => {
    setVrmMetadata(null);
    setVrmVersion(null);
    setExtractedTextures([]);
    setActiveTab('model'); // Reset to model tab when switching avatars/files
    setModelFileSize(null); // Reset model file size
    setModelStats({
      fileSize: t('finder.common.unknown') as string,
      format: t('finder.common.unknown') as string,
      height: 0,
      vertices: 0,
      triangles: 0,
      materials: 0,
      textures: 0,
      bones: 0,
    });
  }, [avatar?.id, selectedFile?.id]);

  // Determine which file to preview - memoized to prevent unnecessary VRMViewer reloads
  // Must be called before any early returns to follow Rules of Hooks
  const previewFile = useMemo(() => {
    if (selectedFile) {
      return selectedFile;
    }
    if (avatar?.modelFileUrl) {
      return {
        id: 'vrm_main',
        label: 'VRM',
        url: avatar.modelFileUrl,
        isVoxel: false,
        category: 'model' as const,
      };
    }
    return null;
  }, [selectedFile, avatar?.modelFileUrl]);

  // Check if we're viewing a VRM file - must be before early returns to follow Rules of Hooks
  // Only show tabs when actually previewing a VRM model, not when viewing images/thumbnails
  const isVRMFile = useMemo(() => {
    // Helper to check if a file is VRM
    const checkIsVRM = (file: { id?: string; filename?: string; url?: string | null; label?: string } | null): boolean => {
      if (!file) return false;
      
      // First, check file ID (most reliable indicator)
      if (file.id) {
        const fileId = file.id.toLowerCase();
        if (fileId === 'fbx' || fileId === 'voxel_fbx' || fileId === 'glb') {
          return false; // Explicitly not VRM
        }
        if (fileId === 'vrm' || fileId === 'vrm_main' || fileId === 'voxel_vrm') {
          return true;
        }
      }
      
      // Check filename (most reliable for Arweave files)
      if (file.filename) {
        const filenameExt = file.filename.split('.').pop()?.toLowerCase();
        if (filenameExt === 'fbx' || filenameExt === 'glb' || filenameExt === 'gltf') {
          return false; // Explicitly not VRM
        }
        if (filenameExt === 'vrm') return true;
      }
      
      // Check URL extension (for IPFS and other URLs with extensions)
      if (file.url) {
        const urlExt = file.url.split('.').pop()?.toLowerCase() || null;
        if (urlExt === 'fbx' || urlExt === 'glb' || urlExt === 'gltf') {
          return false; // Explicitly not VRM
        }
        if (urlExt === 'vrm') return true;
      }
      
      // Check label (fallback - should contain format info)
      if (file.label) {
        const labelLower = file.label.toLowerCase();
        if (labelLower.includes('fbx') || labelLower.includes('glb') || labelLower.includes('gltf')) {
          return false; // Explicitly not VRM
        }
        if (labelLower.includes('vrm')) {
          return true;
        }
      }
      
      // If no extension in URL (Arweave), only assume VRM if we have no indication it's FBX/GLB
      if (file.url && (file.url.includes('arweave.net') || !file.url.includes('.'))) {
        // Only assume VRM if filename doesn't indicate otherwise
        if (file.filename) {
          const filenameExt = file.filename.split('.').pop()?.toLowerCase();
          if (filenameExt && filenameExt !== 'vrm' && filenameExt.length <= 5) {
            return false; // Has a non-VRM extension
          }
        }
        // If we can't determine from filename, check label
        if (file.label && !file.label.toLowerCase().includes('vrm')) {
          return false; // Label doesn't mention VRM
        }
        return true; // Arweave URL without clear indication, assume VRM
      }
      
      return false;
    };
    
    // If a specific file is selected, check if it's a VRM model
    if (previewFile) {
      // Only show tabs for model files, not for thumbnails or textures
      if (previewFile.category === 'model' && previewFile.url) {
        return checkIsVRM(previewFile);
      }
      // If it's a thumbnail or texture, don't show tabs
      return false;
    }
    // If no specific file is selected, check if the default model is VRM
    if (avatar?.modelFileUrl) {
      return checkIsVRM({ url: avatar.modelFileUrl });
    }
    return false;
  }, [previewFile, avatar?.modelFileUrl]);

  if (!avatar) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <p className="text-gray-500 dark:text-gray-400 text-center">
          {t('finder.preview.noSelection')}
        </p>
      </div>
    );
  }

  const project = projects.find((p) => p.id === avatar.projectId);
  const fileTypes = getAvailableFileTypes(avatar);
  const allFiles = getAllAvatarFiles(avatar);
  const modelFileTypes = fileTypes.filter((ft) => ft.category === 'model');
  const thumbnailFiles = allFiles.filter((ft) => ft.category === 'thumbnail');
  const textureFiles = allFiles.filter((ft) => ft.category === 'texture');

  const handleDownload = async () => {
    try {
      if (selectedFile && selectedFile.url) {
        // For all files, fetch as blob to ensure proper download with correct filename
        const response = await fetch(selectedFile.url);
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        
        // Determine filename - prefer correctedFilename (with detected extension), then selectedFile.filename, fallback to extracting from URL or avatar name
        let filename = correctedFilename || selectedFile.filename;
        if (!filename && selectedFile.url) {
          // Try to extract from URL
          const urlParts = selectedFile.url.split('/');
          const urlFilename = urlParts[urlParts.length - 1];
          // Check if URL filename has an extension
          if (urlFilename.includes('.') && !urlFilename.includes('?')) {
            filename = urlFilename.split('?')[0]; // Remove query params
          } else {
            // Fallback: use avatar name with extension from detected format, label, or URL
            const extension = imageFormat ? getExtensionFromFormat(imageFormat) :
                             (selectedFile.url ? selectedFile.url.split('.').pop()?.split('?')[0] : null) || 
                             selectedFile.label.split('.').pop()?.toLowerCase() || 
                             'bin';
            filename = `${avatar?.name || 'file'}.${extension}`;
          }
        }
        
        // Ensure filename is defined
        if (!filename) {
          filename = selectedFile.filename || selectedFile.label || 'file';
        }
        
        link.download = filename;
        link.style.display = 'none';
        link.setAttribute('rel', 'noopener noreferrer'); // Security best practice
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // Revoke URL after a short delay to ensure download starts
        setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 100);
      } else {
        // Default: download avatar
        await downloadAvatar(avatar, null);
      }
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const handleTextureDownload = async (texture: FileTypeInfo) => {
    if (!texture.url) return;
    try {
      // Fetch as blob to ensure proper download
      const response = await fetch(texture.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = texture.filename || `${texture.label}.${texture.url ? texture.url.split('.').pop() : 'png'}`;
      link.style.display = 'none';
      link.setAttribute('rel', 'noopener noreferrer'); // Security best practice
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Revoke URL after a short delay to ensure download starts
      setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 100);
    } catch (error) {
      console.error('Texture download error:', error);
    }
  };

  // Helper function to get image URL from texture (for lightbox)
  const getTextureImageUrl = (texture: ExtractedTexture): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        // If the texture image is already an HTMLImageElement with a src, use it
        if (texture.texture.image instanceof HTMLImageElement && texture.texture.image.src) {
          resolve(texture.texture.image.src);
          return;
        }

        // Otherwise, convert to data URL
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx || !texture.texture.image) {
          reject(new Error('Cannot get texture image: missing context or image'));
          return;
        }
        
        canvas.width = texture.texture.image.width;
        canvas.height = texture.texture.image.height;
        
        if (texture.texture.image instanceof HTMLImageElement) {
          ctx.drawImage(texture.texture.image, 0, 0);
          resolve(canvas.toDataURL('image/png', 0.95));
        } else if (texture.texture.image instanceof HTMLCanvasElement) {
          ctx.drawImage(texture.texture.image, 0, 0);
          resolve(canvas.toDataURL('image/png', 0.95));
        } else {
          // Use WebGL renderer for other types
          const tempScene = new THREE.Scene();
          const tempCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
          const tempRenderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
          });
          tempRenderer.setSize(texture.texture.image.width, texture.texture.image.height);
          
          const tempMaterial = new THREE.MeshBasicMaterial({
            map: texture.texture,
            side: THREE.DoubleSide
          });
          const tempGeometry = new THREE.PlaneGeometry(2, 2);
          const tempMesh = new THREE.Mesh(tempGeometry, tempMaterial);
          tempScene.add(tempMesh);
          
          tempRenderer.render(tempScene, tempCamera);
          ctx.drawImage(tempRenderer.domElement, 0, 0);
          
          tempGeometry.dispose();
          tempMaterial.dispose();
          tempRenderer.dispose();
          
          resolve(canvas.toDataURL('image/png', 0.95));
        }
      } catch (error) {
        reject(error);
      }
    });
  };

  // Helper function to download extracted texture as image (from VRM)
  const downloadExtractedTexture = (texture: ExtractedTexture) => {
    // Create a canvas to render the texture
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx || !texture.texture.image) {
      console.error('Cannot download texture: missing context or image');
      return;
    }
    
    // Set canvas dimensions to match the texture
    canvas.width = texture.texture.image.width;
    canvas.height = texture.texture.image.height;
    
    // If it's a normal HTML image, we can draw it directly
    if (texture.texture.image instanceof HTMLImageElement) {
      ctx.drawImage(texture.texture.image, 0, 0);
    } 
    // If it's a canvas (which might be the case for some textures), we can use the canvas directly
    else if (texture.texture.image instanceof HTMLCanvasElement) {
      ctx.drawImage(texture.texture.image, 0, 0);
    }
    // For other types of images (like ImageBitmap or OffscreenCanvas)
    else {
      // Create a temporary renderer to render the texture to canvas
      // Don't specify canvas in WebGLRenderer - it will create its own
      const tempScene = new THREE.Scene();
      const tempCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      
      const tempRenderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
      });
      tempRenderer.setSize(texture.texture.image.width, texture.texture.image.height);
      
      // Create a plane with the texture
      const tempMaterial = new THREE.MeshBasicMaterial({
        map: texture.texture,
        side: THREE.DoubleSide
      });
      const tempGeometry = new THREE.PlaneGeometry(2, 2);
      const tempMesh = new THREE.Mesh(tempGeometry, tempMaterial);
      tempScene.add(tempMesh);
      
      // Render to the renderer's canvas
      tempRenderer.render(tempScene, tempCamera);
      
      // Draw the renderer's canvas to our download canvas
      ctx.drawImage(tempRenderer.domElement, 0, 0);
      
      // Clean up
      tempGeometry.dispose();
      tempMaterial.dispose();
      tempRenderer.dispose();
    }
    
    // Convert to data URL and download
    try {
      const mimeType = 'image/png';
      const dataURL = canvas.toDataURL(mimeType, 0.95);
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = `${texture.name || 'texture'}.png`;
      link.style.display = 'none';
      link.setAttribute('rel', 'noopener noreferrer'); // Security best practice
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error creating download link:', error);
    }
  };

  // Helper functions for texture info (similar to VRMInspector)
  const getImageFormat = (texture: THREE.Texture): string => {
    if (texture.userData && texture.userData.mimeType) {
      const mimeType = texture.userData.mimeType;
      if (mimeType.includes('image/')) {
        return mimeType.split('/')[1].toUpperCase();
      }
    }
    if (texture.image && texture.image.src) {
      const src = texture.image.src;
      if (src.includes('data:image/')) {
        const mimeType = src.split(';')[0].split(':')[1];
        return mimeType.split('/')[1].toUpperCase();
      } else {
        const extension = src.split('.').pop()?.toLowerCase();
        if (extension && ['png', 'jpg', 'jpeg', 'webp'].includes(extension)) {
          return extension.toUpperCase();
        }
      }
    }
    if (texture.format === THREE.RGBAFormat) {
      return 'PNG (inferred)';
    }
    const translation = t('finder.common.unknown');
    return Array.isArray(translation) ? translation[0] : translation;
  };

  // Calculate vertices from polygonCount (approximate: vertices ≈ triangles * 2/3)
  const vertices = avatar.polygonCount ? Math.round(avatar.polygonCount * 2 / 3) : null;
  const triangles = avatar.polygonCount || null;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-cream dark:bg-cream-dark min-w-0 max-w-full w-full">
      {/* Header - With tabs for VRM files */}
      <div className="flex-none px-4 py-3 border-b border-gray-300 dark:border-gray-700 min-w-0 overflow-hidden">
        {isVRMFile ? (
          <div className="flex items-center gap-0">
            <button
              onClick={() => setActiveTab('model')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                activeTab === 'model'
                  ? 'text-gray-900 dark:text-gray-100 border-b-2 border-gray-900 dark:border-gray-100'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Model
            </button>
            <span className="text-gray-300 dark:text-gray-600">/</span>
            <button
              onClick={() => setActiveTab('textures')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                activeTab === 'textures'
                  ? 'text-gray-900 dark:text-gray-100 border-b-2 border-gray-900 dark:border-gray-100'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Textures
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {avatar.name}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {allFiles.length} {allFiles.length === 1 ? 'file' : 'files'}
            </p>
          </div>
        )}
      </div>

      {/* Textures Tab - Full panel when active */}
      {isVRMFile && activeTab === 'textures' ? (
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-4 grid gap-4">
            {extractedTextures.length > 0 ? (
              extractedTextures.map((texture, index) => {
                const tex = texture.texture;
                const dimensions = tex.image ? `${tex.image.width} × ${tex.image.height}` : (t('finder.common.unknown') as string);
                
                return (
                  <div key={index} className="bg-cream dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
                    {/* Texture Preview - Fixed height container for uniform display */}
                    <div 
                      className="w-full h-[240px] relative bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-center p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={async () => {
                        try {
                          const imageUrl = await getTextureImageUrl(texture);
                          setLightboxImage({
                            url: imageUrl,
                            alt: texture.name,
                            filename: `${texture.name || 'texture'}.png`,
                            downloadHandler: () => downloadExtractedTexture(texture),
                          });
                        } catch (error) {
                          console.error('Error opening texture in lightbox:', error);
                        }
                      }}
                    >
                      <TextureRenderer 
                        texture={tex} 
                        size={220}
                      />
                    </div>
                    
                    {/* Texture Info */}
                    <div className="p-3">
                      <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-2 truncate" title={texture.name}>
                        {texture.name}
                      </h3>
                      
                      <div className="space-y-1 text-xs min-w-0 max-w-full w-full">
                        <div className="flex gap-x-3 items-start min-w-0 max-w-full w-full">
                          <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">{t('vrmviewer.texture.dimensions')}:</span>
                          <span className="text-gray-900 dark:text-gray-100 break-words min-w-0 flex-1 text-right max-w-full">{dimensions}</span>
                        </div>
                        <div className="flex gap-x-3 items-start min-w-0 max-w-full w-full">
                          <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">{t('vrmviewer.texture.fileSize')}:</span>
                          <span className="text-gray-900 dark:text-gray-100 break-words min-w-0 flex-1 text-right max-w-full">{texture.fileSize}</span>
                        </div>
                        <div className="flex gap-x-3 items-start min-w-0 max-w-full w-full">
                          <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">{t('vrmviewer.texture.type')}:</span>
                          <span className="text-gray-900 dark:text-gray-100 break-words min-w-0 flex-1 text-right max-w-full">{texture.type}</span>
                        </div>
                      </div>
                      
                      {/* Download Button */}
                      <button
                        onClick={() => downloadExtractedTexture(texture)}
                        className="mt-3 w-full inline-flex items-center justify-center p-2 border border-gray-300 dark:border-gray-700 rounded-md text-gray-900 dark:text-gray-100 bg-cream dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-900 dark:hover:border-gray-100 transition-all"
                        title={t('vrmviewer.texture.download') as string}
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <p className="text-gray-500 dark:text-gray-400">{t('vrmviewer.textures.noTextures') || 'No textures found'}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Preview Area - Fixed 1:1 aspect ratio with proper overflow handling - Only show on model tab */}
          <div className="flex-none bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700 min-w-0" style={{ aspectRatio: '1 / 1', minHeight: '180px', maxHeight: '250px', width: '100%' }}>
            {previewFile && previewFile.category === 'model' && previewFile.url ? (
              // Show 3D viewer for model files (VRM, FBX, GLB)
              // Use key prop to prevent reload when URL hasn't changed
              (() => {
                // Check if it's a VRM file by looking at file ID, filename, URL extension, then label
                // IMPORTANT: Check for non-VRM formats (FBX, GLB) first to prevent loading them
                const isVRM = (() => {
                  // First, check file ID (most reliable indicator)
                  if (previewFile.id) {
                    const fileId = previewFile.id.toLowerCase();
                    if (fileId === 'fbx' || fileId === 'voxel_fbx' || fileId === 'glb') {
                      return false; // Explicitly not VRM
                    }
                    if (fileId === 'vrm' || fileId === 'vrm_main' || fileId === 'voxel_vrm') {
                      return true;
                    }
                  }
                  
                  // Check filename (most reliable for Arweave files)
                  if (previewFile.filename) {
                    const filenameExt = previewFile.filename.split('.').pop()?.toLowerCase();
                    if (filenameExt === 'fbx' || filenameExt === 'glb' || filenameExt === 'gltf') {
                      return false; // Explicitly not VRM
                    }
                    if (filenameExt === 'vrm') return true;
                  }
                  
                  // Check URL extension (for IPFS and other URLs with extensions)
                  if (previewFile.url) {
                    const urlExt = previewFile.url.split('.').pop()?.toLowerCase() || null;
                    if (urlExt === 'fbx' || urlExt === 'glb' || urlExt === 'gltf') {
                      return false; // Explicitly not VRM
                    }
                    if (urlExt === 'vrm') return true;
                  }
                  
                  // Check label (fallback - should contain format info)
                  if (previewFile.label) {
                    const labelLower = previewFile.label.toLowerCase();
                    if (labelLower.includes('fbx') || labelLower.includes('glb') || labelLower.includes('gltf')) {
                      return false; // Explicitly not VRM
                    }
                    if (labelLower.includes('vrm')) {
                      return true;
                    }
                  }
                  
                  // If no extension in URL (Arweave), only assume VRM if we have no indication it's FBX/GLB
                  // This is a fallback for Arweave URLs without extensions
                  if (previewFile.url && (previewFile.url.includes('arweave.net') || !previewFile.url.includes('.'))) {
                    // Only assume VRM if filename doesn't indicate otherwise
                    if (previewFile.filename) {
                      const filenameExt = previewFile.filename.split('.').pop()?.toLowerCase();
                      if (filenameExt && filenameExt !== 'vrm' && filenameExt.length <= 5) {
                        return false; // Has a non-VRM extension
                      }
                    }
                    // If we can't determine from filename, check label
                    if (previewFile.label && !previewFile.label.toLowerCase().includes('vrm')) {
                      return false; // Label doesn't mention VRM
                    }
                    return true; // Arweave URL without clear indication, assume VRM
                  }
                  return false;
                })();
                
                if (isVRM && previewFile.url) {
                  // For VRM files, use VRMViewer like the gallery page (without controls/panels)
                  return (
                    <VRMViewer 
                      key={previewFile.url}
                      url={previewFile.url}
                      animationUrl={DEFAULT_ANIMATION}
                      backgroundGLB={null}
                      onMetadataLoad={handleMetadataLoad}
                      onTexturesLoad={handleTexturesLoad}
                      showInfoPanel={false}
                      onToggleInfoPanel={() => {}}
                      hideControls={true}
                      cameraDistanceMultiplier={0.6}
                    />
                  );
                } else {
                  // For non-VRM model files (FBX, GLB), show a message
                  return (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4">
                      <p className="text-gray-600 dark:text-gray-400 text-center mb-2 font-semibold">
                        {t('finder.preview.fbxNotSupported.title')}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 text-center max-w-md">
                        {t('finder.preview.fbxNotSupported.message')}
                      </p>
                    </div>
                  );
                }
              })()
            ) : previewFile && (previewFile.category === 'thumbnail' || previewFile.category === 'texture') && previewFile.url ? (
              // Show image for thumbnail and texture files
              <div className="w-full h-full flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-800">
                <img 
                  src={previewFile.url} 
                  alt={previewFile.label}
                  className="max-w-full max-h-full object-contain rounded cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => {
                    if (!previewFile.url) return;
                    setLightboxImage({
                      url: previewFile.url,
                      alt: previewFile.label,
                      filename: correctedFilename || previewFile.filename,
                      downloadHandler: () => {
                        handleDownload();
                      },
                    });
                  }}
                />
              </div>
            ) : (
              // Default: show 3D viewer with main model (without controls/panels)
              avatar?.modelFileUrl ? (
                <VRMViewer 
                  key={avatar.modelFileUrl}
                  url={avatar.modelFileUrl}
                  animationUrl={DEFAULT_ANIMATION}
                  backgroundGLB={null}
                  onMetadataLoad={handleMetadataLoad}
                  onTexturesLoad={handleTexturesLoad}
                  showInfoPanel={false}
                  onToggleInfoPanel={() => {}}
                  hideControls={true}
                  cameraDistanceMultiplier={0.6}
                />
              ) : null
            )}
          </div>

          {/* Scrollable Info Section */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 min-w-0 max-w-full">
        <div className="p-2 sm:p-4 space-y-4 min-w-0 max-w-full w-full box-border">
          {/* Quick Info - Always visible */}
          <div className="space-y-2">
            {selectedFile && (
              <div className="flex items-center gap-2">
                {selectedFile.category === 'model' ? (
                  <Box className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                ) : (
                  <ImageIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                )}
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate min-w-0">
                  {correctedFilename || selectedFile.filename || selectedFile.label}
                </h3>
              </div>
            )}
            {!selectedFile && (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('finder.preview.metadata.collection')}: {project?.name || avatar.projectId}
                </p>
                <div>
                  <Badge variant="secondary" className="text-xs">
                    {project?.license || 'CC0'}
                  </Badge>
                </div>
              </>
            )}
          </div>

          {/* Image Information - Direct display (not in accordion) */}
          {selectedFile && (selectedFile.category === 'thumbnail' || selectedFile.category === 'texture') && (
            <div className="space-y-1 border-b border-gray-200 dark:border-gray-700 pb-4 px-2 sm:px-4 text-xs">
              <div className="flex gap-x-3 items-start min-w-0 max-w-full w-full">
                <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">Type:</span>
                <span className="text-gray-900 dark:text-gray-100 truncate min-w-0 flex-1 text-right max-w-full">
                  {selectedFile.category === 'thumbnail' ? (t('finder.common.thumbnail') as string) : (t('finder.common.texture') as string)}
                </span>
              </div>
              {(correctedFilename || selectedFile.filename) && (
                <div className="flex gap-x-3 items-start min-w-0 max-w-full w-full">
                  <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">Filename:</span>
                  <span className="text-gray-900 dark:text-gray-100 truncate min-w-0 flex-1 text-right max-w-full">
                    {correctedFilename || selectedFile.filename}
                  </span>
                </div>
              )}
              <div className="flex gap-x-3 items-start min-w-0 max-w-full w-full">
                <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">Format:</span>
                <span className="text-gray-900 dark:text-gray-100 truncate min-w-0 flex-1 text-right max-w-full">
                  {imageFormat || extractFormat(selectedFile.label) || 'Unknown'}
                </span>
              </div>
              {imageDimensions && (
                <div className="flex gap-x-3 items-start min-w-0 max-w-full w-full">
                  <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">Dimensions:</span>
                  <span className="text-gray-900 dark:text-gray-100 truncate min-w-0 flex-1 text-right max-w-full">
                    {imageDimensions.width.toLocaleString()} × {imageDimensions.height.toLocaleString()}
                  </span>
                </div>
              )}
              {imageFileSize && (
                <div className="flex gap-x-3 items-start min-w-0 max-w-full w-full">
                  <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">File Size:</span>
                  <span className="text-gray-900 dark:text-gray-100 truncate min-w-0 flex-1 text-right max-w-full">
                    {formatFileSize(imageFileSize, tString)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Collapsible Sections - Conditional based on selection */}
          <div className="min-w-0 max-w-full w-full overflow-hidden box-border">
          <Accordion>
            {/* Case 1: Avatar selected (no specific file) - Show all info */}
            {!selectedFile && (
              <>
                {/* VRM Basic Information - from VRM file */}
                {vrmMetadata && (
                  <AccordionItem title={t('finder.sections.basicInformation') as string} defaultOpen>
                    <div className="space-y-1 text-xs min-w-0 max-w-full w-full">
                      <div className="flex gap-x-3 items-start min-w-0 max-w-full w-full">
                        <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">Name:</span>
                        <span className="text-gray-900 dark:text-gray-100 break-words min-w-0 flex-1 text-right max-w-full">{vrmMetadata.title || 'undefined'}</span>
                      </div>
                      <div className="flex gap-x-3 items-start min-w-0">
                        <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">{t('vrmviewer.metadata.author')}:</span>
                        <span className="text-gray-900 dark:text-gray-100 break-all min-w-0 flex-1 text-right max-w-full">{vrmMetadata.author || 'undefined'}</span>
                      </div>
                      <div className="flex gap-x-3 items-start min-w-0">
                        <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">{t('vrmviewer.metadata.version')}:</span>
                        <span className="text-gray-900 dark:text-gray-100 break-words min-w-0 flex-1 text-right max-w-full">
                          {vrmMetadata?.version && vrmMetadata.version !== getTranslationString(t('finder.common.unknown')) ? `v${vrmMetadata.version}` : 'undefined'}
                        </span>
                      </div>
                      <div className="flex gap-x-3 items-start min-w-0">
                        <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">{t('vrmviewer.metadata.contactInfo')}:</span>
                        <span className="text-gray-900 dark:text-gray-100 break-all min-w-0 flex-1 text-right max-w-full">{vrmMetadata.contactInformation || 'undefined'}</span>
                      </div>
                      <div className="flex gap-x-3 items-start min-w-0">
                        <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">{t('vrmviewer.metadata.references')}:</span>
                        <span className="text-gray-900 dark:text-gray-100 break-all min-w-0 flex-1 text-right max-w-full">{vrmMetadata.reference || 'undefined'}</span>
                      </div>
                    </div>
                  </AccordionItem>
                )}

                {/* Model Information - merged with statistics */}
                <AccordionItem title={t('finder.sections.modelInformation') as string} defaultOpen>
                  <div className="space-y-1 text-xs min-w-0">
                      <div className="flex gap-x-3 items-start min-w-0">
                        <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">Format:</span>
                        <span className="text-gray-900 dark:text-gray-100 break-words min-w-0 flex-1 text-right max-w-full">
                          {avatar?.modelFileUrl ? getFileFormat({ 
                            id: 'vrm_main', 
                            label: 'VRM', 
                            url: avatar.modelFileUrl, 
                            isVoxel: false, 
                            category: 'model' 
                          }) : 'Unknown'}
                        </span>
                      </div>
                    {vrmVersion && (
                      <div className="flex gap-x-3 items-start min-w-0">
                        <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">VRM Type:</span>
                        <span className="text-gray-900 dark:text-gray-100 break-words min-w-0 flex-1 text-right max-w-full">
                          {vrmVersion}
                        </span>
                      </div>
                    )}
                    {modelStats.fileSize !== getTranslationString(t('finder.common.unknown')) && (
                      <div className="flex gap-x-3 items-start min-w-0">
                        <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">{t('vrmviewer.statistics.fileSize')}:</span>
                        <span className="text-gray-900 dark:text-gray-100 break-words min-w-0 flex-1 text-right max-w-full">{modelStats.fileSize}</span>
                      </div>
                    )}
                    {modelStats.height > 0 && (
                      <div className="flex gap-x-3 items-start min-w-0">
                        <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">{t('vrmviewer.statistics.height')}:</span>
                        <span className="text-gray-900 dark:text-gray-100 break-words min-w-0 flex-1 text-right max-w-full">
                          {modelStats.height.toFixed(2)}m
                        </span>
                      </div>
                    )}
                    {modelStats.vertices > 0 && (
                      <div className="flex gap-x-3 items-start min-w-0">
                        <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">{t('vrmviewer.statistics.vertices')}:</span>
                        <span className="text-gray-900 dark:text-gray-100 break-words min-w-0 flex-1 text-right max-w-full">
                          {modelStats.vertices.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {modelStats.triangles > 0 && (
                      <div className="flex gap-x-3 items-start min-w-0">
                        <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">{t('vrmviewer.statistics.triangles')}:</span>
                        <span className="text-gray-900 dark:text-gray-100 break-words min-w-0 flex-1 text-right max-w-full">
                          {modelStats.triangles.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {((vertices && vertices > 0) || (triangles && triangles > 0)) && !modelStats.triangles && (
                      <>
                        {vertices && vertices > 0 && (
                          <div className="flex gap-x-3 items-start min-w-0">
                            <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">Vertices:</span>
                            <span className="text-gray-900 dark:text-gray-100 break-words min-w-0 flex-1 text-right max-w-full">
                              {vertices.toLocaleString()}
                            </span>
                          </div>
                        )}
                        {triangles && triangles > 0 && (
                          <div className="flex gap-x-3 items-start min-w-0">
                            <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">Triangles:</span>
                            <span className="text-gray-900 dark:text-gray-100 break-words min-w-0 flex-1 text-right max-w-full">
                              {triangles.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                    {((modelStats.materials > 0) || (avatar.materialCount && avatar.materialCount > 0)) && (
                      <div className="flex gap-x-3 items-start min-w-0">
                        <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">{t('vrmviewer.statistics.materials')}:</span>
                        <span className="text-gray-900 dark:text-gray-100 break-words min-w-0 flex-1 text-right max-w-full">
                          {modelStats.materials > 0 ? modelStats.materials : (avatar.materialCount && avatar.materialCount > 0 ? avatar.materialCount : modelStats.materials)}
                        </span>
                      </div>
                    )}
                    {(extractedTextures.length > 0 || (modelStats.textures > 0 && extractedTextures.length === 0)) && (
                      <div className="flex gap-x-3 items-start min-w-0 max-w-full w-full">
                        <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">{t('vrmviewer.statistics.textures')}:</span>
                        <span className="text-gray-900 dark:text-gray-100 break-words min-w-0 flex-1 text-right max-w-full">
                          {extractedTextures.length > 0 ? extractedTextures.length : modelStats.textures}
                        </span>
                      </div>
                    )}
                    {modelStats.bones > 0 && (
                      <div className="flex gap-x-3 items-start min-w-0">
                        <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">{t('vrmviewer.statistics.bones')}:</span>
                        <span className="text-gray-900 dark:text-gray-100 break-words min-w-0 flex-1 text-right max-w-full">{modelStats.bones}</span>
                      </div>
                    )}
                  </div>
                </AccordionItem>

                {/* VRM License Information - from VRM file */}
                {vrmMetadata && (vrmMetadata.licenseType !== undefined || vrmMetadata.licenseName || vrmMetadata.allowedUserName !== undefined || vrmMetadata.commercialUsageName !== undefined || vrmMetadata.violentUsageName !== undefined || vrmMetadata.sexualUsageName !== undefined) && (
                  <AccordionItem title={t('finder.sections.licenseInformation') as string} defaultOpen>
                    <div className="space-y-1 text-xs min-w-0 max-w-full w-full">
                      <div className="flex gap-x-3 items-start min-w-0 max-w-full w-full">
                        <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">{t('vrmviewer.license.type')}:</span>
                        <span className="text-gray-900 dark:text-gray-100 break-words min-w-0 flex-1 text-right max-w-full">
                          {getLicenseTypeName(vrmMetadata.licenseType, vrmMetadata.licenseName, vrmMetadata.otherPermissions, tString)}
                        </span>
                      </div>
                      <div className="flex gap-x-3 items-start min-w-0">
                        <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">{t('vrmviewer.license.allowedUsers')}:</span>
                        <span className="text-gray-900 dark:text-gray-100 break-words min-w-0 flex-1 text-right max-w-full">
                          {getAllowedUserName(vrmMetadata.allowedUserName, tString)}
                        </span>
                      </div>
                      <div className="flex gap-x-3 items-start min-w-0">
                        <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">{t('vrmviewer.license.commercialUse')}:</span>
                        <span className="text-gray-900 dark:text-gray-100 break-words min-w-0 flex-1 text-right max-w-full">
                          {getUsageName(vrmMetadata.commercialUsageName, tString)}
                        </span>
                      </div>
                      <div className="flex gap-x-3 items-start min-w-0">
                        <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">{t('vrmviewer.license.violentUsage')}:</span>
                        <span className="text-gray-900 dark:text-gray-100 break-words min-w-0 flex-1 text-right max-w-full">
                          {getUsageName(vrmMetadata.violentUsageName, tString)}
                        </span>
                      </div>
                      <div className="flex gap-x-3 items-start min-w-0">
                        <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">{t('vrmviewer.license.sexualUsage')}:</span>
                        <span className="text-gray-900 dark:text-gray-100 break-words min-w-0 flex-1 text-right max-w-full">
                          {getUsageName(vrmMetadata.sexualUsageName, tString)}
                        </span>
                      </div>
                      {vrmMetadata.otherPermissions && (
                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('vrmviewer.metadata.otherPermissions')}</div>
                          <div className="text-xs text-gray-900 dark:text-gray-100 break-words">
                            {renderLinkableText(vrmMetadata.otherPermissions)}
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionItem>
                )}

                {/* Available Files */}
                {allFiles.length > 0 && (
                  <AccordionItem title={t('finder.sections.availableFiles') as string} defaultOpen>
                    <div className="space-y-2">
                      {allFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between text-sm py-1"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {file.category === 'model' && <Box className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />}
                            {file.category === 'thumbnail' && <ImageIcon className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />}
                            {file.category === 'texture' && <ImageIcon className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />}
                            <span className="text-gray-700 dark:text-gray-300 truncate">
                              {file.label}
                            </span>
                            {file.filename && (
                              <span className="text-xs text-gray-500 dark:text-gray-500 truncate">
                                ({file.filename})
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionItem>
                )}

                {/* Textures */}
                {textureFiles.length > 0 && (
                  <AccordionItem title={`TEXTURES (${textureFiles.length})`} defaultOpen={false}>
                    <div className="grid grid-cols-2 gap-3">
                      {textureFiles.map((texture) => (
                        <div
                          key={texture.id}
                          className="border border-gray-200 dark:border-gray-700 rounded-md p-2 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                        >
                          {texture.url ? (
                            <>
                              <img
                                src={texture.url}
                                alt={texture.label}
                                className="w-full aspect-square object-cover rounded mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => {
                                  setLightboxImage({
                                    url: texture.url!,
                                    alt: texture.label,
                                    filename: texture.filename,
                                    downloadHandler: () => handleTextureDownload(texture),
                                  });
                                }}
                              />
                              <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate mb-1">
                                {texture.filename || texture.label}
                              </p>
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {texture.label}
                                </p>
                                <button
                                  onClick={() => handleTextureDownload(texture)}
                                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  Download
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="w-full aspect-square bg-gray-100 dark:bg-gray-800 rounded mb-2 flex items-center justify-center">
                              <ImageIcon className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </AccordionItem>
                )}

                {/* Description */}
                {avatar.description && (
                  <AccordionItem title={t('finder.sections.description') as string} defaultOpen={false}>
                    <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                      {avatar.description}
                    </p>
                  </AccordionItem>
                )}
              </>
            )}

            {/* Case 2: Model file selected - Show model info and stats only */}
            {selectedFile && selectedFile.category === 'model' && (
              <>
                {/* VRM Basic Information - from VRM file */}
                {vrmMetadata && (
                  <AccordionItem title={t('finder.sections.basicInformation') as string} defaultOpen>
                    <div className="space-y-1 text-xs min-w-0 max-w-full w-full">
                      <div className="flex gap-x-3 items-start min-w-0 max-w-full w-full">
                        <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">Name:</span>
                        <span className="text-gray-900 dark:text-gray-100 break-words min-w-0 flex-1 text-right max-w-full">{vrmMetadata.title || 'undefined'}</span>
                      </div>
                      <div className="flex gap-x-3 items-start min-w-0">
                        <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">{t('vrmviewer.metadata.author')}:</span>
                        <span className="text-gray-900 dark:text-gray-100 break-all min-w-0 flex-1 text-right max-w-full">{vrmMetadata.author || 'undefined'}</span>
                      </div>
                      <div className="flex gap-x-3 items-start min-w-0">
                        <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">{t('vrmviewer.metadata.version')}:</span>
                        <span className="text-gray-900 dark:text-gray-100 break-words min-w-0 flex-1 text-right max-w-full">
                          {vrmMetadata?.version && vrmMetadata.version !== getTranslationString(t('finder.common.unknown')) ? `v${vrmMetadata.version}` : 'undefined'}
                        </span>
                      </div>
                      <div className="flex gap-x-3 items-start min-w-0">
                        <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">{t('vrmviewer.metadata.contactInfo')}:</span>
                        <span className="text-gray-900 dark:text-gray-100 break-all min-w-0 flex-1 text-right max-w-full">{vrmMetadata.contactInformation || 'undefined'}</span>
                      </div>
                      <div className="flex gap-x-3 items-start min-w-0">
                        <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">{t('vrmviewer.metadata.references')}:</span>
                        <span className="text-gray-900 dark:text-gray-100 break-all min-w-0 flex-1 text-right max-w-full">{vrmMetadata.reference || 'undefined'}</span>
                      </div>
                    </div>
                  </AccordionItem>
                )}

                {/* File Information - merged with model statistics */}
                <AccordionItem title={t('finder.sections.fileInformation') as string} defaultOpen>
                  <div className="space-y-1 text-xs min-w-0">
                      <div className="flex gap-x-3 items-start min-w-0">
                        <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">Format:</span>
                        <span className="text-gray-900 dark:text-gray-100 break-words min-w-0 flex-1 text-right max-w-full">
                          {getFileFormat(selectedFile)}
                        </span>
                      </div>
                    {selectedFile?.filename && (
                      <div className="flex gap-x-3 items-start min-w-0">
                        <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">Filename:</span>
                        <span className="text-gray-900 dark:text-gray-100 break-words min-w-0 flex-1 text-right max-w-full">
                          {selectedFile.filename}
                        </span>
                      </div>
                    )}
                    {/* Show file size for GLB/FBX files */}
                    {(() => {
                      const fileFormat = getFileFormat(selectedFile);
                      const isGLBOrFBX = fileFormat === 'FBX' || fileFormat === 'GLB' || fileFormat === 'GLTF';
                      
                      if (isGLBOrFBX && modelFileSize !== null) {
                        return (
                          <div className="flex gap-x-3 items-start min-w-0">
                            <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">{t('vrmviewer.statistics.fileSize')}:</span>
                            <span className="text-gray-900 dark:text-gray-100 break-words min-w-0 flex-1 text-right max-w-full">
                              {formatFileSizeInMB(modelFileSize, tString)}
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })()}
                    {/* Only show other fields if we have loaded data (not in initial loading state) */}
                    {(() => {
                      // Check if we're still loading - if fileSize is still 'unknown' and all stats are 0, we're loading
                      const isLoading = modelStats.fileSize === getTranslationString(t('finder.common.unknown')) && 
                                       modelStats.height === 0 && 
                                       modelStats.vertices === 0 && 
                                       modelStats.triangles === 0 && 
                                       modelStats.materials === 0 && 
                                       modelStats.textures === 0 && 
                                       modelStats.bones === 0 &&
                                       !vrmVersion &&
                                       extractedTextures.length === 0;
                      
                      // For FBX files, we never load VRM data, so show only format, filename, and file size
                      const isFBX = selectedFile && (getFileFormat(selectedFile) === 'FBX' || getFileFormat(selectedFile) === 'GLB' || getFileFormat(selectedFile) === 'GLTF');
                      
                      if (isLoading || isFBX) {
                        return null; // Only show format, filename, and file size during loading or for FBX
                      }
                      
                      return (
                        <>
                          {vrmVersion && getFileFormat(selectedFile) === 'VRM' && (
                            <div className="flex gap-x-3 items-start min-w-0">
                              <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">VRM Type:</span>
                              <span className="text-gray-900 dark:text-gray-100 break-words min-w-0 flex-1 text-right max-w-full">
                                {vrmVersion}
                              </span>
                            </div>
                          )}
                          {modelStats.fileSize !== getTranslationString(t('finder.common.unknown')) && (
                            <div className="flex gap-x-3 items-start min-w-0">
                              <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">{t('vrmviewer.statistics.fileSize')}:</span>
                              <span className="text-gray-900 dark:text-gray-100 break-words min-w-0 flex-1 text-right max-w-full">{modelStats.fileSize}</span>
                            </div>
                          )}
                          {modelStats.height > 0 && (
                            <div className="flex gap-x-3 items-start min-w-0">
                              <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">{t('vrmviewer.statistics.height')}:</span>
                              <span className="text-gray-900 dark:text-gray-100 break-words min-w-0 flex-1 text-right max-w-full">
                                {modelStats.height.toFixed(2)}m
                              </span>
                            </div>
                          )}
                          {modelStats.vertices > 0 && (
                            <div className="flex gap-x-3 items-start min-w-0">
                              <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">{t('vrmviewer.statistics.vertices')}:</span>
                              <span className="text-gray-900 dark:text-gray-100 break-words min-w-0 flex-1 text-right max-w-full">
                                {modelStats.vertices.toLocaleString()}
                              </span>
                            </div>
                          )}
                          {modelStats.triangles > 0 && (
                            <div className="flex gap-x-3 items-start min-w-0">
                              <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">{t('vrmviewer.statistics.triangles')}:</span>
                              <span className="text-gray-900 dark:text-gray-100 break-words min-w-0 flex-1 text-right max-w-full">
                                {modelStats.triangles.toLocaleString()}
                              </span>
                            </div>
                          )}
                          {((vertices && vertices > 0) || (triangles && triangles > 0)) && !modelStats.triangles && (
                            <>
                              {vertices && vertices > 0 && (
                                <div className="flex gap-x-3 items-start min-w-0">
                                  <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">Vertices:</span>
                                  <span className="text-gray-900 dark:text-gray-100 break-words min-w-0 flex-1 text-right max-w-full">
                                    {vertices.toLocaleString()}
                                  </span>
                                </div>
                              )}
                              {triangles && triangles > 0 && (
                                <div className="flex gap-x-3 items-start min-w-0">
                                  <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">Triangles:</span>
                                  <span className="text-gray-900 dark:text-gray-100 break-words min-w-0 flex-1 text-right max-w-full">
                                    {triangles.toLocaleString()}
                                  </span>
                                </div>
                              )}
                            </>
                          )}
                          {((modelStats.materials > 0) || (avatar.materialCount && avatar.materialCount > 0)) && (
                            <div className="flex gap-x-3 items-start min-w-0">
                              <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">{t('vrmviewer.statistics.materials')}:</span>
                              <span className="text-gray-900 dark:text-gray-100 break-words min-w-0 flex-1 text-right max-w-full">
                                {modelStats.materials > 0 ? modelStats.materials : (avatar.materialCount && avatar.materialCount > 0 ? avatar.materialCount : modelStats.materials)}
                              </span>
                            </div>
                          )}
                          {(extractedTextures.length > 0 || (modelStats.textures > 0 && extractedTextures.length === 0)) && (
                            <div className="flex gap-x-3 items-start min-w-0 max-w-full w-full">
                              <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">{t('vrmviewer.statistics.textures')}:</span>
                              <span className="text-gray-900 dark:text-gray-100 break-words min-w-0 flex-1 text-right max-w-full">
                                {extractedTextures.length > 0 ? extractedTextures.length : modelStats.textures}
                              </span>
                            </div>
                          )}
                          {modelStats.bones > 0 && (
                            <div className="flex gap-x-3 items-start min-w-0">
                              <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">{t('vrmviewer.statistics.bones')}:</span>
                              <span className="text-gray-900 dark:text-gray-100 break-words min-w-0 flex-1 text-right max-w-full">{modelStats.bones}</span>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </AccordionItem>

                {/* VRM License Information - from VRM file */}
                {vrmMetadata && (vrmMetadata.licenseType !== undefined || vrmMetadata.licenseName || vrmMetadata.allowedUserName !== undefined || vrmMetadata.commercialUsageName !== undefined || vrmMetadata.violentUsageName !== undefined || vrmMetadata.sexualUsageName !== undefined) && (
                  <AccordionItem title={t('finder.sections.licenseInformation') as string} defaultOpen>
                    <div className="space-y-1 text-xs min-w-0 max-w-full w-full">
                      <div className="flex gap-x-3 items-start min-w-0 max-w-full w-full">
                        <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">{t('vrmviewer.license.type')}:</span>
                        <span className="text-gray-900 dark:text-gray-100 break-words min-w-0 flex-1 text-right max-w-full">
                          {getLicenseTypeName(vrmMetadata.licenseType, vrmMetadata.licenseName, vrmMetadata.otherPermissions, tString)}
                        </span>
                      </div>
                      <div className="flex gap-x-3 items-start min-w-0">
                        <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">{t('vrmviewer.license.allowedUsers')}:</span>
                        <span className="text-gray-900 dark:text-gray-100 break-words min-w-0 flex-1 text-right max-w-full">
                          {getAllowedUserName(vrmMetadata.allowedUserName, tString)}
                        </span>
                      </div>
                      <div className="flex gap-x-3 items-start min-w-0">
                        <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">{t('vrmviewer.license.commercialUse')}:</span>
                        <span className="text-gray-900 dark:text-gray-100 break-words min-w-0 flex-1 text-right max-w-full">
                          {getUsageName(vrmMetadata.commercialUsageName, tString)}
                        </span>
                      </div>
                      <div className="flex gap-x-3 items-start min-w-0">
                        <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">{t('vrmviewer.license.violentUsage')}:</span>
                        <span className="text-gray-900 dark:text-gray-100 break-words min-w-0 flex-1 text-right max-w-full">
                          {getUsageName(vrmMetadata.violentUsageName, tString)}
                        </span>
                      </div>
                      <div className="flex gap-x-3 items-start min-w-0">
                        <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">{t('vrmviewer.license.sexualUsage')}:</span>
                        <span className="text-gray-900 dark:text-gray-100 break-words min-w-0 flex-1 text-right max-w-full">
                          {getUsageName(vrmMetadata.sexualUsageName, tString)}
                        </span>
                      </div>
                      {vrmMetadata.otherPermissions && (
                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('vrmviewer.metadata.otherPermissions')}</div>
                          <div className="text-xs text-gray-900 dark:text-gray-100 break-words">
                            {renderLinkableText(vrmMetadata.otherPermissions)}
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionItem>
                )}
              </>
            )}
          </Accordion>
          </div>
        </div>
      </div>

          {/* Sticky Download Button at Bottom */}
          <div className="flex-none border-t border-gray-300 dark:border-gray-700 p-4 bg-cream dark:bg-cream-dark min-w-0 overflow-hidden">
            <Button
              onClick={handleDownload}
              variant="default"
              className="w-full min-w-0"
            >
              <Download className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate min-w-0">{getDownloadButtonText(selectedFile, avatar, tString)}</span>
            </Button>
          </div>
        </>
      )}

      {/* Image Lightbox */}
      <ImageLightbox
        isOpen={lightboxImage !== null}
        imageUrl={lightboxImage?.url || ''}
        imageAlt={lightboxImage?.alt || ''}
        filename={lightboxImage?.filename}
        onClose={() => setLightboxImage(null)}
        onDownload={lightboxImage?.downloadHandler}
      />
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders when parent re-renders
// Only re-render if avatar, selectedFile, or projects actually change
export default memo(PreviewPanel, (prevProps, nextProps) => {
  // Return true if props are equal (should NOT re-render)
  // Return false if props are different (should re-render)
  
  // Check avatar
  if (prevProps.avatar?.id !== nextProps.avatar?.id) return false;
  if (prevProps.avatar?.modelFileUrl !== nextProps.avatar?.modelFileUrl) return false;
  
  // Check selectedFile
  if (prevProps.selectedFile?.id !== nextProps.selectedFile?.id) return false;
  if (prevProps.selectedFile?.url !== nextProps.selectedFile?.url) return false;
  
  // Check projects array length (shallow check - if length changes, re-render)
  if (prevProps.projects.length !== nextProps.projects.length) return false;
  
  // Props are equal, don't re-render
  return true;
});
