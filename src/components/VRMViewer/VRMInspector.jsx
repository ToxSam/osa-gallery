'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Eye, Layers, FileText, Info, Download, FileIcon, Image, Code } from 'lucide-react';
import { AvatarHeader } from '@/components/avatar/AvatarHeader';
import VRMInspectorViewer from './InspectorViewer';
import { VRMLoaderPlugin } from '@pixiv/three-vrm';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import TextureRenderer from './TextureRenderer';
import { useI18n } from '@/lib/i18n';
import { I18nProvider } from '@/lib/i18n';

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper to get license type name
const getLicenseTypeName = (licenseType, licenseName) => {
  console.log('🔍 DEBUG - getLicenseTypeName called with:', licenseType, 'type:', typeof licenseType, 'licenseName:', licenseName);
  
  // IMPORTANT: If licenseName is provided, use it directly - this ensures we show exactly what's in the VRM file
  if (licenseName && typeof licenseName === 'string' && licenseName.trim() !== '') {
    const cleanName = licenseName.trim();
    console.log('🔍 DEBUG - Using provided licenseName directly:', cleanName);
    
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
  console.log('🔍 DEBUG - No license name provided, falling back to numeric mapping');
  
  // Convert to number if it's a string containing only digits
  if (typeof licenseType === 'string' && /^\d+$/.test(licenseType)) {
    console.log('🔍 DEBUG - Converting string licenseType to number');
    licenseType = parseInt(licenseType, 10);
  }
  
  // Standard VRM license mapping as per the spec
  const licenseTypes = {
    0: 'Redistribution Prohibited',
    1: 'CC0',
    2: 'CC BY',
    3: 'CC BY NC',
    4: 'CC BY SA',
    5: 'CC BY NC SA',
    6: 'CC BY ND',
    7: 'CC BY NC ND',
    8: 'Other'
  };
  
  const result = licenseTypes[licenseType] || 'Unknown';
  console.log('🔍 DEBUG - Resolved license type from numeric value:', result);
  
  return result;
};

// Helper to get allowed user name
const getAllowedUserName = (allowedUser) => {
  console.log('🔍 DEBUG - getAllowedUserName called with:', allowedUser, 'type:', typeof allowedUser);
  
  // Convert to number if it's a string containing only digits
  if (typeof allowedUser === 'string' && /^\d+$/.test(allowedUser)) {
    console.log('🔍 DEBUG - Converting string allowedUser to number');
    allowedUser = parseInt(allowedUser, 10);
  }
  
  // Check if it's a string matching the values
  if (typeof allowedUser === 'string') {
    if (allowedUser.toLowerCase() === 'everyone') {
      console.log('🔍 DEBUG - String match: Everyone');
      return 'Everyone';
    } else if (allowedUser.toLowerCase().includes('explicit') || 
               allowedUser.toLowerCase().includes('contact')) {
      console.log('🔍 DEBUG - String match: Explicit User');
      return 'Explicit User';
    } else if (allowedUser.toLowerCase().includes('author') || 
               allowedUser.toLowerCase().includes('only')) {
      console.log('🔍 DEBUG - String match: Only Author');
      return 'Only Author';
    }
  }
  
  const allowedUsers = {
    0: 'Only Author',
    1: 'Everyone',
    2: 'Explicit User'
  };
  
  const result = allowedUsers[allowedUser] || 'Unknown';
  console.log('🔍 DEBUG - Resolved allowed user:', result);
  return result;
};

// Helper to get usage permission name
const getUsageName = (usage) => {
  console.log('🔍 DEBUG - getUsageName called with:', usage, 'type:', typeof usage);
  
  // For VRM 0.x format:
  // 0 = Disallow, 1 = Allow
  if (usage === 0 || usage === '0') {
    console.log('🔍 DEBUG - Usage is 0, returning "Disallow"');
    return 'Disallow';
  } else if (usage === 1 || usage === '1') {
    console.log('🔍 DEBUG - Usage is 1, returning "Allow"');
    return 'Allow';
  } else if (typeof usage === 'string') {
    // Handle string values (case insensitive)
    const value = usage.toLowerCase().trim();
    console.log('🔍 DEBUG - Usage is string, lowercase value:', value);
    if (value === 'allow' || value === 'allowed' || value === 'yes' || value === 'true') {
      return 'Allow';
    } else {
      return 'Disallow';
    }
  } else if (usage === true) {
    console.log('🔍 DEBUG - Usage is true boolean, returning "Allow"');
    return 'Allow';
  } else if (usage === false) {
    console.log('🔍 DEBUG - Usage is false boolean, returning "Disallow"');
    return 'Disallow';
  }
  
  // Default fallback
  console.log('🔍 DEBUG - Unknown usage value type:', typeof usage, 'value:', usage, 'defaulting to "Disallow"');
  return 'Disallow'; // Default to disallow for safety
};

// Add these helper functions to format texture properties
const getTextureFormat = (texture) => {
  const formats = {
    [THREE.RedFormat]: 'Red',
    [THREE.RGFormat]: 'RG',
    [THREE.RGBAFormat]: 'RGBA',
    [THREE.DepthFormat]: 'Depth',
    [THREE.DepthStencilFormat]: 'DepthStencil',
  };
  return formats[texture.format] || 'Unknown';
};

const getImageFormat = (texture) => {
  let imageFormat = 'Unknown';
  
  // First check if there's a userData.mimeType property (common in glTF)
  if (texture.userData && texture.userData.mimeType) {
    const mimeType = texture.userData.mimeType;
    if (mimeType.includes('image/')) {
      return mimeType.split('/')[1].toUpperCase();
    }
  }
  
  // Next try to infer from the image source (for web-loaded textures)
  if (texture.image) {
    // Check for common properties that might indicate format
    
    // Check for source attribute on the image (used by some loaders)
    if (texture.image.src) {
      const src = texture.image.src;
      if (src.includes('data:image/')) {
        // For data URLs, extract format from the MIME type
        const mimeType = src.split(';')[0].split(':')[1];
        imageFormat = mimeType.split('/')[1].toUpperCase();
        return imageFormat;
      } else {
        // For regular URLs, get extension
        const extension = src.split('.').pop().toLowerCase();
        if (['png', 'jpg', 'jpeg', 'webp', 'bmp', 'tga', 'tiff'].includes(extension)) {
          imageFormat = extension.toUpperCase();
          // Normalize JPEG
          if (imageFormat === 'JPG') imageFormat = 'JPEG';
          return imageFormat;
        }
      }
    }
    
    // Try to infer from image data or properties
    if (texture.image.data && texture.image.data.constructor && texture.image.data.constructor.name) {
      // For Uint8Array or similar, likely a PNG or JPEG
      if (texture.image.data.constructor.name === 'Uint8Array' || 
          texture.image.data.constructor.name === 'Uint8ClampedArray') {
        // Check image dimensions for clues
        // PNGs often have alpha, JPEGs don't
        if (texture.format === THREE.RGBAFormat) {
          return 'PNG';
        } else if (texture.format === THREE.RGBFormat) {
          return 'JPEG';
        }
      }
    }
    
    // If image has a fileFormat property (some THREE loaders add this)
    if (texture.image.fileFormat) {
      return texture.image.fileFormat.toUpperCase();
    }
  }
  
  // Try to infer from the texture name
  if (texture.name) {
    const lowerName = texture.name.toLowerCase();
    if (lowerName.endsWith('.png')) return 'PNG';
    if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) return 'JPEG';
    if (lowerName.endsWith('.webp')) return 'WEBP';
    if (lowerName.endsWith('.tga')) return 'TGA';
    if (lowerName.endsWith('.bmp')) return 'BMP';
  }
  
  // For VRM files, textures are often PNGs, so as a last resort we can guess
  // based on the THREE.js format
  if (texture.format === THREE.RGBAFormat) {
    // RGBA format is typically PNG in VRMs
    return 'PNG (inferred)';
  } else if (texture.format === THREE.RGBFormat) {
    // RGB format is typically JPEG in VRMs
    return 'JPEG (inferred)';
  }
  
  return imageFormat;
};

const getWrapMode = (mode) => {
  const modes = {
    [THREE.RepeatWrapping]: 'Repeat',
    [THREE.ClampToEdgeWrapping]: 'Clamp to Edge',
    [THREE.MirroredRepeatWrapping]: 'Mirrored Repeat',
  };
  return modes[mode] || 'Unknown';
};

const getFilterMode = (mode) => {
  const modes = {
    [THREE.NearestFilter]: 'Nearest',
    [THREE.NearestMipmapNearestFilter]: 'Nearest Mipmap Nearest',
    [THREE.NearestMipmapLinearFilter]: 'Nearest Mipmap Linear',
    [THREE.LinearFilter]: 'Linear',
    [THREE.LinearMipmapNearestFilter]: 'Linear Mipmap Nearest',
    [THREE.LinearMipmapLinearFilter]: 'Linear Mipmap Linear',
  };
  return modes[mode] || 'Unknown';
};

// Add expression category definitions
const expressionCategories = {
  emotions: [
    'happy', 'angry', 'sad', 'relaxed', 'neutral', 
    'surprised', 'joy', 'sorrow', 'fun', 'worried'
  ],
  eyes: [
    'blink', 'blinkLeft', 'blinkRight', 'blink_l', 'blink_r',
    'blinkright', 'blinkleft', 'Blink_L', 'Blink_R',
    'close_l', 'close_r', 'wink', 'winkLeft', 'winkRight'
  ],
  eyeMovements: [
    'lookUp', 'lookDown', 'lookLeft', 'lookRight',
    'lookup', 'lookdown', 'lookleft', 'lookright',
    'look_up', 'look_down', 'look_left', 'look_right'
  ],
  mouth: [
    'aa', 'ih', 'ou', 'ee', 'oh',
    'a', 'i', 'u', 'e', 'o',
    'smile', 'frown', 'grin',
    'open', 'close',
    'happy_mouth', 'angry_mouth', 'sad_mouth'
  ],
  facialExpressions: [
    'blush', 'shy', 'embarrassed', 'calm',
    'serious', 'smug', 'raised_eyebrows',
    'surprised_eyebrows', 'angry_eyebrows',
    'happy_eyebrows', 'sad_eyebrows'
  ],
  other: []
};

// Add expression icons mapping
const expressionIcons = {
  // Emotions
  happy: '😊',
  angry: '😠',
  sad: '😢',
  relaxed: '😌',
  neutral: '😐',
  surprised: '😮',
  joy: '😄',
  sorrow: '😥',
  fun: '😋',
  worried: '😟',
  
  // Eyes
  blink: '👁️',
  blinkLeft: '👁️',
  blinkRight: '👁️',
  wink: '😉',
  winkLeft: '😉',
  winkRight: '😉',
  'blink_l': '👁️',
  'blink_r': '👁️',
  'close_l': '👁️',
  'close_r': '👁️',
  
  // Eye Movements
  lookUp: '⬆️',
  lookDown: '⬇️',
  lookLeft: '⬅️',
  lookRight: '➡️',
  lookup: '⬆️',
  lookdown: '⬇️',
  lookleft: '⬅️',
  lookright: '➡️',
  'look_up': '⬆️',
  'look_down': '⬇️',
  'look_left': '⬅️',
  'look_right': '➡️',
  
  // Mouth
  aa: '👄',
  ih: '👄',
  ou: '👄',
  ee: '👄',
  oh: '👄',
  a: '👄',
  i: '👄',
  u: '👄',
  e: '👄',
  o: '👄',
  smile: '😊',
  frown: '☹️',
  grin: '😁',
  open: '👄',
  close: '👄',
  'happy_mouth': '😊',
  'angry_mouth': '😠',
  'sad_mouth': '😢',
  
  // Facial Expressions
  blush: '😊',
  shy: '😳',
  embarrassed: '😳',
  calm: '😌',
  serious: '😐',
  smug: '😏',
  'raised_eyebrows': '🤨',
  'surprised_eyebrows': '😮',
  'angry_eyebrows': '😠',
  'happy_eyebrows': '😊',
  'sad_eyebrows': '😢',
  
  // Default
  default: '🎭'
};

// Add this before the VRMInspector component definition
const MemoizedVRMInspectorViewer = React.memo(VRMInspectorViewer, (prevProps, nextProps) => {
  // Only re-render if the URL changes
  return prevProps.url === nextProps.url;
});

const VRMInspector = React.memo(() => {
  const { t } = useI18n();
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [vrmMetadata, setVrmMetadata] = useState(null);
  const [vrmVersion, setVrmVersion] = useState(null);
  const [textures, setTextures] = useState([]);
  const [activeInfoSection, setActiveInfoSection] = useState(''); // upload, info, textures, expressions
  const [expressions, setExpressions] = useState([]);
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const [modelStats, setModelStats] = useState({
    vertices: 0,
    triangles: 0,
    materials: 0,
    textures: 0,
    bones: 0,
    height: 0,
    fileSize: '0 Bytes'
  });
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Create a reference to the VRM instance
  const vrmRef = useRef(null);

  // Helper function to download texture as image
  const downloadTextureAsImage = (texture, filename) => {
    // Create a canvas to render the texture
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions to match the texture
    if (texture.image) {
      canvas.width = texture.image.width;
      canvas.height = texture.image.height;
      
      // If it's a normal HTML image, we can draw it directly
      if (texture.image instanceof HTMLImageElement) {
        ctx.drawImage(texture.image, 0, 0);
      } 
      // If it's a canvas (which might be the case for some textures), we can use the canvas directly
      else if (texture.image instanceof HTMLCanvasElement) {
        ctx.drawImage(texture.image, 0, 0);
      }
      // For other types of images (like ImageBitmap or OffscreenCanvas)
      else {
        // Create a temporary renderer to render the texture to canvas
        const tempScene = new THREE.Scene();
        const tempCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        
        const tempRenderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true
        });
        tempRenderer.setSize(texture.image.width, texture.image.height);
        
        // Create a plane with the texture
        const tempMaterial = new THREE.MeshBasicMaterial({
          map: texture,
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
      
      // Convert the canvas to a data URL and create download link
      try {
        // Try to get a data URL in the original format if possible
        const imageFormat = getImageFormat(texture).toLowerCase();
        const mimeType = imageFormat === 'png' ? 'image/png' : 
                         imageFormat === 'jpeg' || imageFormat === 'jpg' ? 'image/jpeg' : 
                         imageFormat === 'webp' ? 'image/webp' : 'image/png';
                         
        const dataURL = canvas.toDataURL(mimeType, 0.95); // 0.95 quality for JPEG
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = filename || `texture_${Date.now()}.${mimeType.split('/')[1]}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        return true;
      } catch (error) {
        console.error('Error creating download link:', error);
        return false;
      }
    } else {
      console.error('Texture has no image data');
      return false;
    }
  };

  // Handle file selection
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.name.toLowerCase().endsWith('.vrm')) {
      setFile(selectedFile);
      setError(null);
      setIsLoading(true);
      setLoadingProgress(0);
      processVRMFile(selectedFile);
      setActiveInfoSection('info'); // Switch to info tab after upload
    } else {
      setError('Please select a valid VRM file');
      setFile(null);
      setFileUrl('');
      setVrmMetadata(null);
      setVrmVersion(null);
      setTextures([]);
      setModelStats({
        vertices: 0,
        triangles: 0,
        materials: 0,
        textures: 0,
        bones: 0,
        height: 0,
        fileSize: '0 Bytes'
      });
    }
  };

  // Handle drag and drop
  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.toLowerCase().endsWith('.vrm')) {
      setFile(droppedFile);
      setError(null);
      setIsLoading(true);
      setLoadingProgress(0);
      processVRMFile(droppedFile);
      setActiveInfoSection('info'); // Switch to info tab after upload
    } else {
      setError('Please drop a valid VRM file');
    }
  };

  // Helper function to deep inspect an object (for debugging)
  const debugInspect = (obj, maxDepth = 3, depth = 0) => {
    if (depth >= maxDepth) return '[Max Depth]';
    if (!obj) return obj;
    
    if (Array.isArray(obj)) {
      return `Array(${obj.length}): [${obj.length > 0 ? '...' : ''}]`;
    }
    
    if (typeof obj === 'object') {
      if (obj instanceof THREE.Object3D) {
        return `[Object3D: ${obj.name || 'unnamed'}]`;
      }
      if (obj instanceof THREE.Material) {
        return `[Material: ${obj.name || 'unnamed'}]`;
      }
      if (obj instanceof THREE.Texture) {
        return `[Texture]`;
      }
      
      const keys = Object.keys(obj);
      return `{${keys.map(k => `${k}: ${typeof obj[k] === 'object' ? debugInspect(obj[k], maxDepth, depth + 1) : obj[k]}`).join(', ')}}`;
    }
    
    return obj;
  };

  // Helper function to extract VRM metadata from the raw GLTF
  const extractVRMMetadata = (gltf) => {
    try {
      console.log('Extracting VRM metadata with direct access to GLTF structure');
      
      // Special direct handling for VRM 0.x
      // This is the most reliable way to get VRM 0.x metadata
      if (gltf.parser && gltf.parser.json && gltf.parser.json.extensions && gltf.parser.json.extensions.VRM) {
        console.log('Direct VRM 0.x extension detected');
        const vrm0Data = gltf.parser.json.extensions.VRM;
        
        console.log('VRM 0.x raw data:', vrm0Data);
        
        if (vrm0Data.meta) {
          console.log('Using direct VRM 0.x metadata');
          // Log the license properties specifically for debugging
          console.log('VRM 0.x license fields:', {
            licenseType: vrm0Data.meta.licenseType,
            licenseName: vrm0Data.meta.licenseName,
            allowedUserName: vrm0Data.meta.allowedUserName,
            violentUssageName: vrm0Data.meta.violentUssageName,
            sexualUssageName: vrm0Data.meta.sexualUssageName,
            commercialUssageName: vrm0Data.meta.commercialUssageName
          });
          return { metadata: vrm0Data.meta, vrmVersion: 'VRM 0.x' };
        }
      }
      
      // Continue with standard metadata extraction flow
      const vrm = gltf.userData.vrm;
      let metadata = null;
      let vrmVersion = null;
      
      // Check for VRM 0.x specific extension
      let isVRM0 = false;
      if (gltf.parser && gltf.parser.json && gltf.parser.json.extensions && gltf.parser.json.extensions.VRM) {
        isVRM0 = true;
        console.log('VRM 0.x extension detected');
        vrmVersion = 'VRM 0.x';
      }
      
      // Additional VRM 0.x detection
      if (vrm && vrm.meta && vrm.meta.metaVersion === 0) {
        isVRM0 = true;
        vrmVersion = 'VRM 0.x';
        console.log('VRM 0.x metaVersion detected');
      }
      
      if (vrm) {
        // Check for meta property in VRM
        if (vrm.meta) {
          metadata = vrm.meta;
          
          // Force VRM 0.x detection if we detected it earlier
          if (isVRM0) {
            vrmVersion = 'VRM 0.x';
          } else {
            vrmVersion = vrm.meta.version || (vrm.meta.specVersion ? 'VRM 1.0' : 'VRM 0.x');
          }
        }
      }
      
      // If we couldn't get metadata from VRM instance, try to get it from the raw GLTF data
      if (!metadata) {
        // Try to extract from GLTF extensions
        if (gltf.parser && gltf.parser.json && gltf.parser.json.extensions) {
          // Check for VRM extension (VRM 0.x)
          if (gltf.parser.json.extensions.VRM) {
            metadata = gltf.parser.json.extensions.VRM.meta;
            vrmVersion = 'VRM 0.x';
            console.log('Detected VRM 0.x metadata from GLTF extensions');
          }
          // Check for VRMC_vrm extension (VRM 1.0)
          else if (gltf.parser.json.extensions.VRMC_vrm) {
            metadata = gltf.parser.json.extensions.VRMC_vrm.meta;
            vrmVersion = 'VRM 1.0';
            console.log('Detected VRM 1.0 metadata from GLTF extensions');
          }
        }
      }
      
      // If we still don't have metadata, try to look for it elsewhere
      if (!metadata) {
        // Try some known alternative locations
        if (gltf.userData && gltf.userData.gltfExtensions) {
          if (gltf.userData.gltfExtensions.VRM) {
            metadata = gltf.userData.gltfExtensions.VRM.meta;
            vrmVersion = 'VRM 0.x';
          } else if (gltf.userData.gltfExtensions.VRMC_vrm) {
            metadata = gltf.userData.gltfExtensions.VRMC_vrm.meta;
            vrmVersion = 'VRM 1.0';
          }
        }
      }
      
      // Attempt to find additional license information if not present in metadata
      if (metadata && (!metadata.licenseType && !metadata.licenseName && !metadata.license)) {
        console.log('Looking for additional license information');
        
        // Try to extract license information from VRM 0.x structure
        if (gltf.parser && gltf.parser.json && gltf.parser.json.extensions && gltf.parser.json.extensions.VRM) {
          const vrmData = gltf.parser.json.extensions.VRM;
          
          // In VRM 0.x, license info might be in the meta object
          if (vrmData.meta) {
            // Check for license fields
            if (vrmData.meta.licenseType !== undefined) {
              metadata.licenseType = vrmData.meta.licenseType;
            }
            
            if (vrmData.meta.allowedUserName !== undefined) {
              metadata.allowedUserName = vrmData.meta.allowedUserName;
            }
            
            // For VRM 0.x, check both spellings of usage fields
            if (vrmData.meta.violentUssageName !== undefined) {
              metadata.violentUsageName = vrmData.meta.violentUssageName;
            } else if (vrmData.meta.violentUsage !== undefined) {
              metadata.violentUsageName = vrmData.meta.violentUsage;
            }
            
            if (vrmData.meta.sexualUssageName !== undefined) {
              metadata.sexualUsageName = vrmData.meta.sexualUssageName;
            } else if (vrmData.meta.sexualUsage !== undefined) {
              metadata.sexualUsageName = vrmData.meta.sexualUsage;
            }
            
            if (vrmData.meta.commercialUssageName !== undefined) {
              metadata.commercialUsageName = vrmData.meta.commercialUssageName;
            } else if (vrmData.meta.commercialUsage !== undefined) {
              metadata.commercialUsageName = vrmData.meta.commercialUsage;
            }
          }
        }
        
        // Check if license info might be in a different structure (VRM 1.0+)
        if (vrmVersion && (vrmVersion.startsWith('VRM 1.0') || vrmVersion.startsWith('1.') || vrmVersion === '1.1')) {
          // For VRM 1.0, try to look in the gltf.userData.vrm structure
          if (vrm) {
            // Check if there's a license field at the root level
            if (vrm.license) {
              // Merge license information into metadata
              if (vrm.license.licenseName) metadata.licenseName = vrm.license.licenseName;
              if (vrm.license.licenseUrl) metadata.licenseUrl = vrm.license.licenseUrl;
              if (vrm.license.personation) metadata.avatarPermission = vrm.license.personation;
              if (vrm.license.allowedUser) metadata.allowedUser = vrm.license.allowedUser;
              
              // Check for permissions
              if (vrm.license.violent) metadata.violentUsage = vrm.license.violent === 'Allow' ? 0 : 1;
              if (vrm.license.sexual) metadata.sexualUsage = vrm.license.sexual === 'Allow' ? 0 : 1;
              if (vrm.license.commercial) metadata.commercialUsage = vrm.license.commercial === 'Allow' ? 0 : 1;
              
              // Alternatively, permissions might be in a nested object
              if (vrm.license.permissions) {
                metadata.permissions = vrm.license.permissions;
              }
            }
          }
        }
      }
      
      // If version is a VRM 0.x with a weird numerical version like 1.1, override it
      if (isVRM0 && typeof vrmVersion === 'string' && vrmVersion.match(/^[0-9]/)) {
        vrmVersion = 'VRM 0.x';
      }
      
      // VRM 0.x always has a metaVersion=0, make sure we detect it
      if (metadata && metadata.metaVersion === 0) {
        vrmVersion = 'VRM 0.x';
        console.log('Setting version to VRM 0.x due to metaVersion=0');
      }
      
      console.log('Extracted metadata:', metadata);
      console.log('Detected VRM version:', vrmVersion);
      
      // Return whatever we found
      return { metadata, vrmVersion };
    } catch (error) {
      console.error('Error extracting VRM metadata:', error);
      return { metadata: null, vrmVersion: null };
    }
  };

  // Helper function to create a clean metadata object
  const createCleanMetadataObject = (rawMeta, version) => {
    console.log('Creating clean metadata object with:', rawMeta, 'Version:', version);
    
    if (!rawMeta) {
      return {
        title: 'Unknown',
        version: 'Unknown',
        author: 'Unknown',
        contactInformation: '',
        reference: '',
        thumbnail: null,
        licenseType: 0,
        allowedUserName: 0,
        violentUsageName: 0,
        sexualUsageName: 0,
        commercialUsageName: 0,
        otherPermissionUrl: '',
        licenseName: '',
        otherLicenseUrl: '',
        otherPermissions: ''
      };
    }
    
    // Initialize clean object with defaults
    const cleanMeta = {
      title: rawMeta.title || 'Unknown',
      version: rawMeta.version || rawMeta.specVersion || 'Unknown', // Check both version and specVersion
      author: rawMeta.author || rawMeta.authors?.[0] || 'Unknown',
      contactInformation: rawMeta.contactInformation || '',
      reference: rawMeta.reference || '',
      thumbnail: rawMeta.texture?.image || null,
      otherPermissions: rawMeta.otherPermissionUrl || rawMeta.otherPermissions || ''
    };
    
    // Parse license type - handle both VRM 0.x and VRM 1.0
    // For VRM 0.x: licenseType is a numeric value
    // For VRM 1.0: licenseName is a string value
    
    // Handle license type field mapping
    if (version && version.includes('0.x')) {
      // VRM 0.x license handling
      console.log('Handling VRM 0.x license fields');
      console.log('Raw license type:', rawMeta.licenseType, typeof rawMeta.licenseType);
      
      // License Type mapping
      if (rawMeta.licenseType !== undefined) {
        // If it's already a number, use it directly
        if (typeof rawMeta.licenseType === 'number') {
          console.log('Using numeric license type directly:', rawMeta.licenseType);
          cleanMeta.licenseType = rawMeta.licenseType;
        } 
        // If it's a string, try to convert it to a number
        else if (typeof rawMeta.licenseType === 'string') {
          // Map standard license names to numeric values
      const licenseMap = {
            'redistribution_prohibited': 0,
            'cc0': 1,
            'cc_by': 2,
            'cc_by_nc': 3,
            'cc_by_sa': 4,
            'cc_by_nc_sa': 5,
            'cc_by_nd': 6,
            'cc_by_nc_nd': 7,
            // Alternative spellings
            'redistribution prohibited': 0,
            'cc by': 2,
            'cc by-nc': 3,
            'cc by-sa': 4,
            'cc by-nc-sa': 5,
            'cc by-nd': 6,
            'cc by-nc-nd': 7,
          };
          
          // Try to find a match in the map
          const licenseKey = rawMeta.licenseType.toLowerCase().trim();
          console.log('Looking up string license type:', licenseKey);
          if (licenseMap[licenseKey] !== undefined) {
            cleanMeta.licenseType = licenseMap[licenseKey];
            console.log('Mapped string license to:', cleanMeta.licenseType);
          } else {
            // Default to "Redistribution Prohibited" if we can't determine
            console.log('Could not map license string, defaulting to 0');
            cleanMeta.licenseType = 0;
          }
        } else {
          // Default to "Redistribution Prohibited" if not a number or string
          console.log('License type is neither number nor string, defaulting to 0');
          cleanMeta.licenseType = 0;
        }
      } else {
        // Default to "Redistribution Prohibited"
        console.log('No license type found, defaulting to 0');
        cleanMeta.licenseType = 0;
      }
      
      // Handle allowed user name
      if (rawMeta.allowedUserName !== undefined) {
        // If it's already a number, use it directly
        if (typeof rawMeta.allowedUserName === 'number') {
          cleanMeta.allowedUserName = rawMeta.allowedUserName;
        }
        // If it's a string, try to convert it to a number
        else if (typeof rawMeta.allowedUserName === 'string') {
          // Map standard allowed user names to numeric values
          const allowedUserMap = {
            'only_author': 0,
            'only author': 0,
            'everyone': 1,
            'explicit': 2,
            'explicit_contact': 2,
            'contactrequired': 2,
            'contact required': 2
          };
          
          // Try to find a match in the map
          const allowedUserKey = rawMeta.allowedUserName.toLowerCase().trim();
          if (allowedUserMap[allowedUserKey] !== undefined) {
            cleanMeta.allowedUserName = allowedUserMap[allowedUserKey];
          } else {
            // Default to "Only Author" if we can't determine
            cleanMeta.allowedUserName = 0;
          }
        } else {
          // Default to "Only Author" if not a number or string
          cleanMeta.allowedUserName = 0;
        }
      } else {
        // Default to "Only Author"
        cleanMeta.allowedUserName = 0;
      }
      
      // Handle usage permissions
      // In VRM 0.x: 0 = Disallow, 1 = Allow
      const handleUsagePermission = (field, defaultValue = 0) => {
        if (rawMeta[field] !== undefined) {
          // If it's already a number, use it directly
          if (typeof rawMeta[field] === 'number') {
            return rawMeta[field];
          }
          // If it's a string, try to convert it to a number
          else if (typeof rawMeta[field] === 'string') {
            // Map standard permission names to numeric values
            const permissionMap = {
              'disallow': 0,
              'allow': 1,
              'disallowed': 0,
              'allowed': 1,
              'no': 0,
              'yes': 1,
              'false': 0,
              'true': 1
            };
            
            // Try to find a match in the map
            const permissionKey = rawMeta[field].toLowerCase().trim();
            if (permissionMap[permissionKey] !== undefined) {
              return permissionMap[permissionKey];
            }
          }
        }
        return defaultValue;
      };
      
      // Set usage permissions with appropriate fallbacks
      const handleVRMUsage = (violent, sexual, commercial) => {
        // Check violent usage with all possible field names
        if (violent !== undefined) {
          cleanMeta.violentUsageName = handleUsagePermission('violentUsageName', handleUsagePermission('violentUssageName', violent));
        } else if (rawMeta.violentUsageName !== undefined) {
          cleanMeta.violentUsageName = handleUsagePermission('violentUsageName');
        } else if (rawMeta.violentUssageName !== undefined) {
          cleanMeta.violentUsageName = handleUsagePermission('violentUssageName');
        } else if (rawMeta.violentUsage !== undefined) {
          cleanMeta.violentUsageName = handleUsagePermission('violentUsage');
        } else {
          cleanMeta.violentUsageName = 0; // Default: Disallow
        }

        // Check sexual usage with all possible field names
        if (sexual !== undefined) {
          cleanMeta.sexualUsageName = handleUsagePermission('sexualUsageName', handleUsagePermission('sexualUssageName', sexual));
        } else if (rawMeta.sexualUsageName !== undefined) {
          cleanMeta.sexualUsageName = handleUsagePermission('sexualUsageName');
        } else if (rawMeta.sexualUssageName !== undefined) {
          cleanMeta.sexualUsageName = handleUsagePermission('sexualUssageName');
        } else if (rawMeta.sexualUsage !== undefined) {
          cleanMeta.sexualUsageName = handleUsagePermission('sexualUsage');
        } else {
          cleanMeta.sexualUsageName = 0; // Default: Disallow
        }

        // Check commercial usage with all possible field names
        if (commercial !== undefined) {
          cleanMeta.commercialUsageName = handleUsagePermission('commercialUsageName', handleUsagePermission('commercialUssageName', commercial));
        } else if (rawMeta.commercialUsageName !== undefined) {
          cleanMeta.commercialUsageName = handleUsagePermission('commercialUsageName');
        } else if (rawMeta.commercialUssageName !== undefined) {
          cleanMeta.commercialUsageName = handleUsagePermission('commercialUssageName');
        } else if (rawMeta.commercialUsage !== undefined) {
          cleanMeta.commercialUsageName = handleUsagePermission('commercialUsage');
      } else {
          cleanMeta.commercialUsageName = 0; // Default: Disallow
        }
      };
      
      // Process all usage permissions
      handleVRMUsage(
        rawMeta.violent, 
        rawMeta.sexual, 
        rawMeta.commercial
      );
      
      // Additional license URL fields
      cleanMeta.otherPermissionUrl = rawMeta.otherPermissionUrl || '';
      cleanMeta.licenseName = rawMeta.licenseName || '';
      cleanMeta.otherLicenseUrl = rawMeta.otherLicenseUrl || '';
      } else {
      // VRM 1.0+ license handling
      console.log('Handling VRM 1.0+ license fields');
      
      // In VRM 1.0, licenseName is used instead of licenseType
      if (rawMeta.licenseName) {
        // Map license names to VRM 0.x numeric values for consistency
        const licenseMap = {
          'CC0': 1,
          'CC BY': 2,
          'CC BY-NC': 3,
          'CC BY-SA': 4,
          'CC BY-NC-SA': 5,
          'CC BY-ND': 6,
          'CC BY-NC-ND': 7,
          'Other': 8,
          'Redistribution Prohibited': 0
        };
        
        // Try to find a match in the map
        if (licenseMap[rawMeta.licenseName] !== undefined) {
          cleanMeta.licenseType = licenseMap[rawMeta.licenseName];
        } else {
          // Default to "Other" if we can't determine
          cleanMeta.licenseType = 8;
        }
        
        cleanMeta.licenseName = rawMeta.licenseName;
      } else {
        // Default to "Redistribution Prohibited"
        cleanMeta.licenseType = 0;
        cleanMeta.licenseName = '';
      }
      
      // In VRM 1.0, allowedUser is used instead of allowedUserName
      if (rawMeta.allowedUser) {
        // Map allowed user to VRM 0.x numeric values for consistency
        const allowedUserMap = {
          'OnlyAuthor': 0,
          'ExplicitlyLicensedPerson': 2,
          'Everyone': 1
        };
        
        if (allowedUserMap[rawMeta.allowedUser] !== undefined) {
          cleanMeta.allowedUserName = allowedUserMap[rawMeta.allowedUser];
        } else {
          // Default to "Only Author" if we can't determine
          cleanMeta.allowedUserName = 0;
        }
      } else {
        // Default to "Only Author"
        cleanMeta.allowedUserName = 0;
      }
      
      // In VRM 1.0, boolean properties are used for permissions
      const boolToNum = (bool, defaultVal = 0) => {
        if (typeof bool === 'boolean') return bool ? 1 : 0;
        if (typeof bool === 'string') {
          if (bool.toLowerCase() === 'true' || bool.toLowerCase() === 'allow') return 1;
          if (bool.toLowerCase() === 'false' || bool.toLowerCase() === 'disallow') return 0;
        }
        return defaultVal;
      };
      
      cleanMeta.violentUsageName = boolToNum(rawMeta.violentUsePermission || rawMeta.violent, 0);
      cleanMeta.sexualUsageName = boolToNum(rawMeta.sexualUsePermission || rawMeta.sexual, 0);
      cleanMeta.commercialUsageName = boolToNum(rawMeta.commercialUsePermission || rawMeta.commercial, 0);
      
      // Other license fields
      cleanMeta.otherPermissionUrl = rawMeta.otherPermissionUrl || rawMeta.otherLicenseUrl || '';
      cleanMeta.otherLicenseUrl = rawMeta.otherLicenseUrl || '';
    }
    
    // Final sanity checks to make sure required fields are set
    if (cleanMeta.licenseType === undefined) cleanMeta.licenseType = 0;
    if (cleanMeta.allowedUserName === undefined) cleanMeta.allowedUserName = 0;
    if (cleanMeta.violentUsageName === undefined) cleanMeta.violentUsageName = 0;
    if (cleanMeta.sexualUsageName === undefined) cleanMeta.sexualUsageName = 0;
    if (cleanMeta.commercialUsageName === undefined) cleanMeta.commercialUsageName = 0;
    
    console.log('Final clean metadata object:', cleanMeta);
    return cleanMeta;
  };

  // Process the VRM file to extract metadata, textures, and statistics
  const processVRMFile = (file) => {
    if (!file) return;
    
    // Set file size immediately when file is selected
    setModelStats(prev => ({
      ...prev,
      fileSize: formatFileSize(file.size)
    }));
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target.result;
        setFileUrl(URL.createObjectURL(file));
        
        // Create a THREE.js loader to parse the VRM
        const loader = new GLTFLoader();
        loader.register((parser) => {
          return new VRMLoaderPlugin(parser);
        });
        
        // Load and parse the VRM file
        loader.parse(
          arrayBuffer,
          '',
          (gltf) => {
            console.log('VRM loaded:', gltf);
            
            try {
              // Extract metadata using our helper function
              const { metadata: rawMetadata, vrmVersion } = extractVRMMetadata(gltf);
              
              if (rawMetadata) {
                console.log('VRM metadata found:', rawMetadata, 'Version:', vrmVersion);
                
                // Create a clean metadata object
                const cleanMetadata = createCleanMetadataObject(rawMetadata, vrmVersion);
                
                // Set state
                setVrmMetadata(cleanMetadata);
                setVrmVersion(vrmVersion);
                
                // Log all properties for debugging
                console.log('Original VRM meta properties:');
                for (const key in rawMetadata) {
                  console.log(`${key}: ${typeof rawMetadata[key] === 'object' ? JSON.stringify(rawMetadata[key]) : rawMetadata[key]}`);
                }
              } else {
                console.error('No VRM metadata found in the file');
                setError('Could not extract VRM metadata from the file');
              }

              // Extract textures and calculate stats
              const extractedTextures = [];
              let vertexCount = 0;
              let triangleCount = 0;
              let materialCount = 0;
              let boneCount = 0;
              const uniqueMaterials = new Set();
              const uniqueTextures = new Set();

              console.log('Traversing scene to extract data...');
              
              // Function to count bones recursively
              const countBonesRecursively = (node) => {
                let count = 0;
                if (node.isBone) {
                  count++;
                }
                if (node.children && node.children.length > 0) {
                  node.children.forEach(child => {
                    count += countBonesRecursively(child);
                  });
                }
                return count;
              };
              
              // Get VRM instance
              const vrm = gltf.userData.vrm;
              vrmRef.current = vrm;
              
              // Get the humanoid bones directly if available
              if (vrm && vrm.humanoid) {
                console.log('VRM has humanoid:', vrm.humanoid);
                
                // Check if it's a structure with humanBones property
                if (vrm.humanoid.humanBones) {
                  boneCount = Object.keys(vrm.humanoid.humanBones).length;
                } 
                // Or if it has a getNormalizedBoneNode method
                else if (typeof vrm.humanoid.getNormalizedBoneNode === 'function') {
                  // Try to count bones by checking all possible humanoid bone names
                  const humanoidBones = [
                    'hips', 'spine', 'chest', 'upperChest', 'neck', 'head',
                    'leftShoulder', 'leftUpperArm', 'leftLowerArm', 'leftHand',
                    'rightShoulder', 'rightUpperArm', 'rightLowerArm', 'rightHand',
                    'leftUpperLeg', 'leftLowerLeg', 'leftFoot', 'rightUpperLeg',
                    'rightLowerLeg', 'rightFoot', 'leftToes', 'rightToes',
                    'leftEye', 'rightEye', 'jaw',
                    // Fingers
                    'leftThumbMetacarpal', 'leftThumbProximal', 'leftThumbDistal',
                    'leftIndexProximal', 'leftIndexIntermediate', 'leftIndexDistal',
                    'leftMiddleProximal', 'leftMiddleIntermediate', 'leftMiddleDistal',
                    'leftRingProximal', 'leftRingIntermediate', 'leftRingDistal',
                    'leftLittleProximal', 'leftLittleIntermediate', 'leftLittleDistal',
                    'rightThumbMetacarpal', 'rightThumbProximal', 'rightThumbDistal',
                    'rightIndexProximal', 'rightIndexIntermediate', 'rightIndexDistal',
                    'rightMiddleProximal', 'rightMiddleIntermediate', 'rightMiddleDistal',
                    'rightRingProximal', 'rightRingIntermediate', 'rightRingDistal',
                    'rightLittleProximal', 'rightLittleIntermediate', 'rightLittleDistal'
                  ];
                  
                  // Count bones that exist in this model
                  boneCount = humanoidBones.filter(boneName => {
                    try {
                      return vrm.humanoid.getNormalizedBoneNode(boneName) !== null;
                    } catch (e) {
                      return false;
                    }
                  }).length;
                }
                
                console.log(`Found ${boneCount} bones from humanoid`);
              }
              
              // If no humanoid bones, try to count manually
              if (boneCount === 0) {
                boneCount = countBonesRecursively(gltf.scene);
                console.log(`Found ${boneCount} bones from scene traversal`);
              }
              
              // Process meshes and materials
              gltf.scene.traverse((node) => {
                // Count vertices and triangles
                if (node.isMesh) {
                  console.log('Found mesh:', node.name);
                  const geometry = node.geometry;
                  if (geometry) {
                    if (geometry.attributes.position) {
                      vertexCount += geometry.attributes.position.count;
                      console.log(`Added ${geometry.attributes.position.count} vertices, total: ${vertexCount}`);
                    }
                    if (geometry.index) {
                      triangleCount += geometry.index.count / 3;
                      console.log(`Added ${geometry.index.count / 3} triangles, total: ${triangleCount}`);
                    } else if (geometry.attributes.position) {
                      triangleCount += geometry.attributes.position.count / 3;
                      console.log(`Added ${geometry.attributes.position.count / 3} triangles, total: ${triangleCount}`);
                    }
                  }

                  // Process materials
                  const materials = Array.isArray(node.material) ? node.material : [node.material];
                  materials.forEach(material => {
                    if (material && !uniqueMaterials.has(material.uuid)) {
                      uniqueMaterials.add(material.uuid);
                      materialCount++;
                      
                      console.log('Processing material:', material.name || 'unnamed');
                      
                      // Check all possible texture properties
                      const textureProperties = [
                        'map', 'normalMap', 'emissiveMap', 'metalnessMap', 
                        'roughnessMap', 'aoMap', 'displacementMap', 'alphaMap'
                      ];
                      
                      textureProperties.forEach(prop => {
                        if (material[prop] && material[prop].image) {
                          // Only add textures we haven't seen before
                          if (!uniqueTextures.has(material[prop].uuid)) {
                            uniqueTextures.add(material[prop].uuid);
                            
                            console.log(`Found texture (${prop}):`, material[prop].name || prop);
                            
                            // Generate a meaningful name for the texture
                            const textureName = material[prop].name || 
                                             `${material.name ? material.name + '_' : ''}${prop}`;
                            
                            // Calculate approximate file size based on image dimensions and format
                            let fileSize = 'Unknown';
                            try {
                              if (material[prop].image) {
                                const { width, height } = material[prop].image;
                                // Estimate based on format (rough approximation)
                                let bytesPerPixel = 4; // Default to RGBA (4 bytes per pixel)
                                
                                if (material[prop].format === THREE.RedFormat) {
                                  bytesPerPixel = 1;
                                } else if (material[prop].format === THREE.RGFormat) {
                                  bytesPerPixel = 2;
                                } else if (material[prop].format === THREE.RGBAFormat) {
                                  bytesPerPixel = 4;
                                }
                                
                                const sizeInBytes = width * height * bytesPerPixel;
                                
                                // Convert to appropriate unit
                                if (sizeInBytes < 1024) {
                                  fileSize = `${sizeInBytes} B`;
                                } else if (sizeInBytes < 1024 * 1024) {
                                  fileSize = `${(sizeInBytes / 1024).toFixed(1)} KB`;
                                } else {
                                  fileSize = `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
                                }
                              }
                            } catch (e) {
                              console.warn('Error calculating texture size:', e);
                            }
                            
                            // Add human-readable texture type
                            const textureTypeMap = {
                              'map': 'Albedo/Diffuse',
                              'normalMap': 'Normal',
                              'emissiveMap': 'Emissive',
                              'metalnessMap': 'Metalness',
                              'roughnessMap': 'Roughness',
                              'aoMap': 'Ambient Occlusion',
                              'displacementMap': 'Displacement/Height',
                              'alphaMap': 'Alpha/Transparency'
                            };
                            
                            const readableType = textureTypeMap[prop] || prop;
                            
                            extractedTextures.push({
                              name: textureName,
                              type: readableType,
                              mapType: prop,
                              texture: material[prop],
                              material: material.name || 'unnamed',
                              fileSize: fileSize
                            });
                          }
                        }
                      });
                    }
                  });
                }
              });
              
              console.log(`Extracted ${extractedTextures.length} textures`);
              
              setTextures(extractedTextures);
              setModelStats(prev => ({
                ...prev,
                vertices: vertexCount,
                triangles: Math.floor(triangleCount),
                materials: materialCount,
                textures: extractedTextures.length,
                bones: boneCount
              }));

              // Extract expressions/blendshapes
              extractExpressions(vrm, gltf);

              // Make sure to set loading to false when everything is done
              setIsLoading(false);

            } catch (error) {
              console.error('Error processing VRM:', error);
              setError('Failed to process VRM file: ' + error.message);
              setIsLoading(false);
            }
          },
          (progress) => {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            console.log('Loading progress:', percent + '%');
            setLoadingProgress(percent);
          },
          (error) => {
            console.error('Error loading VRM:', error);
            setError('Failed to load VRM file: ' + error.message);
            setIsLoading(false);
          }
        );
      } catch (error) {
        console.error('Error processing VRM:', error);
        setError('Failed to process VRM file: ' + error.message);
        setIsLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Add a new function to extract expressions from the VRM
  const extractExpressions = (vrm, gltf) => {
    try {
      console.log('Extracting expressions from VRM:', vrm);
      const expressionsList = [];

      if (vrm.expressionManager) {
        console.log('Found expression manager, checking expressions');
        const expressions = vrm.expressionManager.expressions;
        console.log('Found expressions:', expressions);

        if (expressions) {
          // Convert the expressions array to a list
          expressions.forEach((expression) => {
            // Get the clean name by removing the VRMExpression_ prefix
            const cleanName = expression.name.replace('VRMExpression_', '');
            console.log(`Processing expression: ${cleanName}`, expression);
            
            expressionsList.push({
              name: cleanName,
              originalName: expression.name, // Keep the original name for reference
              preset: expression.preset || 'custom',
              weight: expression.weight || 0,
              isBinary: expression.isBinary || false,
              value: expression.weight || 0
            });
          });
        }
      }

      // Sort expressions: presets first, then custom
      expressionsList.sort((a, b) => {
        if (a.preset === 'preset' && b.preset !== 'preset') return -1;
        if (a.preset !== 'preset' && b.preset === 'preset') return 1;
        return (a.name || '').localeCompare(b.name || '');
      });

      console.log('Final expressions list:', expressionsList);
      setExpressions(expressionsList);
    } catch (error) {
      console.error('Error extracting expressions:', error);
    }
  };

  // Function to update expression weight
  const updateExpressionWeight = (expressionName, weight) => {
    console.log(`Updating expression ${expressionName} to weight ${weight}`);
    
    if (!vrmRef.current) {
      console.warn('No VRM reference available');
      return;
    }

    // Update the UI state
    setExpressions(prevExpressions => 
      prevExpressions.map(exp => 
        exp.name === expressionName 
          ? { ...exp, weight: weight, value: weight }
          : exp
      )
    );

    // Use the viewer's updateExpression function if available
    if (vrmRef.current.updateExpression) {
      vrmRef.current.updateExpression(expressionName, weight);
    } else {
      console.warn('updateExpression function not available');
    }
  };

  // Function to reset all expressions
  const resetAllExpressions = () => {
    if (!fileUrl || expressions.length === 0 || !vrmRef.current) return;
    
    // Reset UI state for both weight and value
    setExpressions(prevExpressions => 
      prevExpressions.map(exp => ({ ...exp, weight: 0, value: 0 }))
    );
    
    // Reset all expressions in the VRM model
    if (vrmRef.current.expressionManager) {
      const expressionManager = vrmRef.current.expressionManager;
      
      // Reset each expression's weight directly
      Object.values(expressionManager.expressions).forEach(expression => {
        if (expression) {
          expression.weight = 0;
        }
      });
      
      // Force an update
      if (expressionManager.update) {
        expressionManager.update();
      }
      
      // Force update all meshes with morph targets
      vrmRef.current.scene.traverse((obj) => {
        if (obj.isMesh && obj.morphTargetInfluences) {
          obj.updateMorphTargets();
        }
      });
    }
  };

  // Handle metadata received from VRMViewer
  const onMetadataLoad = (data) => {
    console.log('🔍 DEBUG - onMetadataLoad called with data:', data);
    
    if (!data) {
      console.log('🔍 DEBUG - No metadata received, returning early');
      return;
    }

    // Store VRM reference and reset expressions
    if (data.vrm) {
      console.log('🔍 DEBUG - Storing VRM reference');
      vrmRef.current = data.vrm;
      
      // Reset expressions state
      setExpressions([]);
      
      // Extract new expressions after a short delay to ensure VRM is fully initialized
      setTimeout(() => {
        if (data.vrm) {
          extractExpressions(data.vrm, data.gltf);
        }
      }, 100);
    }

    // Update model stats
    setModelStats(prev => ({
      ...prev,
      triangles: data.triangleCount || 0,
      materials: data.materialCount || 0,
      format: data.format || 'Unknown',
      height: data.avatarHeight || 0,
    }));
    
    // Set VRM version from metadata
    console.log('🔍 DEBUG - Setting VRM version from metadata:', data.vrmVersion);
    setVrmVersion(data.vrmVersion || 'Unknown');
    
    // Process VRM metadata if available
    if (data.rawMetadata) {
      try {
        console.log('Processing raw metadata from VRMViewer:', data.rawMetadata);
        
      // Create clean metadata object
        const cleanedMetadata = createCleanMetadataObject(data.rawMetadata, data.vrmVersion);
      
      if (cleanedMetadata) {
        // Directly map received properties for more reliability
        cleanedMetadata.version = data.version || cleanedMetadata.version;
        cleanedMetadata.contactInformation = data.contactInformation || cleanedMetadata.contactInformation;
        cleanedMetadata.reference = data.reference || cleanedMetadata.reference;
        
          // Handle license info - prioritize licenseName when available
          if (data.licenseName) {
            console.log('🔍 DEBUG - Using provided licenseName:', data.licenseName);
            cleanedMetadata.licenseName = data.licenseName;
          }
          
          if (data.licenseType !== undefined && cleanedMetadata.licenseType === undefined) {
            cleanedMetadata.licenseType = data.licenseType;
          }
          
          // Debug log the cleaned metadata before setting it
          console.log('Final cleaned metadata:', cleanedMetadata);
        
        setVrmMetadata(cleanedMetadata);
        }
      } catch (error) {
        console.error('Error processing metadata:', error);
      }
    }
  };

  // Render the left sidebar content based on active section
  const renderSidebarContent = () => {
    switch (activeInfoSection) {
      case 'upload':
        return (
          <div className="min-h-full flex flex-col">
            <div className="flex-1">
              {/* Empty spacer div for top padding */}
              <div className="h-6" />
              
              <div className="px-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">{t('vrmviewer.title')}</h2>
                <p className="text-base text-gray-700 dark:text-gray-300 mb-6">
                  {t('vrmviewer.description')}
                </p>
              </div>

              <div className="px-6 mt-12">
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-xl">✨</span>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('vrmviewer.features.title')}</h3>
                </div>

                <div className="grid gap-6">
                  <div className="flex items-start gap-4">
                    <Info className="h-5 w-5 flex-none mt-0.5 text-gray-900 dark:text-gray-100" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">{t('vrmviewer.features.modelInfo.title')}</h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {t('vrmviewer.features.modelInfo.description')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Image className="h-5 w-5 flex-none mt-0.5 text-gray-900 dark:text-gray-100" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">{t('vrmviewer.features.textureAnalysis.title')}</h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {t('vrmviewer.features.textureAnalysis.description')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Layers className="h-5 w-5 flex-none mt-0.5 text-gray-900 dark:text-gray-100" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">{t('vrmviewer.features.expressionControl.title')}</h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {t('vrmviewer.features.expressionControl.description')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-none p-2.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                      <Code className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">{t('vrmviewer.features.technicalDetails.title')}</h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {t('vrmviewer.features.technicalDetails.description')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-8">
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-xl">🎮</span>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('vrmviewer.tips.title')}</h3>
                </div>
                <div className="grid gap-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-none w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-xl">
                      👆
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">{t('vrmviewer.tips.controls.title')}</h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {t('vrmviewer.tips.controls.description')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-none w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-xl">
                      🔍
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">{t('vrmviewer.tips.wireframe.title')}</h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {t('vrmviewer.tips.wireframe.description')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-none w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-xl">
                      🎭
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">{t('vrmviewer.tips.expressions.title')}</h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {t('vrmviewer.tips.expressions.description')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('vrmviewer.dropzone.description')}
                </p>
              </div>
            </div>
          </div>
        );
      case 'info':
        return vrmMetadata ? (
          <div className="p-4 space-y-6">
            {/* Basic Info Section */}
            <div className="bg-cream dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors">
              <div className="p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2 mb-4 text-gray-600 dark:text-gray-400">
                  <FileIcon className="h-4 w-4" />
                  {t('vrmviewer.metadata.basicInfo')}
                </h3>
                <div className="grid gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-24 text-xs text-gray-500 dark:text-gray-400">{t('vrmviewer.metadata.title')}</div>
                    <div className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100">{vrmMetadata.title || 'undefined'}</div>
                </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 text-xs text-gray-500 dark:text-gray-400">{t('vrmviewer.metadata.author')}</div>
                    <div className="flex-1 text-sm font-medium break-all text-gray-900 dark:text-gray-100">{vrmMetadata.author || 'undefined'}</div>
                </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 text-xs text-gray-500 dark:text-gray-400">{t('vrmviewer.metadata.version')}</div>
                    <div className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {vrmMetadata?.version && vrmMetadata.version !== 'Unknown' ? `v${vrmMetadata.version}` : 'undefined'}
                </div>
                </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 text-xs text-gray-500 dark:text-gray-400">{t('vrmviewer.metadata.contactInfo')}</div>
                    <div className="flex-1 text-sm text-gray-900 dark:text-gray-100">{vrmMetadata.contactInformation || 'undefined'}</div>
                </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 text-xs text-gray-500 dark:text-gray-400">{t('vrmviewer.metadata.references')}</div>
                    <div className="flex-1 text-sm text-gray-900 dark:text-gray-100">{vrmMetadata.reference || 'undefined'}</div>
                </div>
                  </div>
              </div>
            </div>

            {/* License Section */}
            <div className="bg-cream dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors">
              <div className="p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2 mb-4 text-gray-600 dark:text-gray-400">
                  <FileText className="h-4 w-4" />
                  {t('vrmviewer.license.title')}
                </h3>
                <div className="space-y-4">
                  {/* License Type */}
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">{t('vrmviewer.license.type')}</div>
                    <div className="inline-flex px-3 py-1.5 rounded-md text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700">
                    {getLicenseTypeName(vrmMetadata.licenseType, vrmMetadata.licenseName)}
                </div>
                  </div>

                  {/* Usage Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">{t('vrmviewer.license.allowedUsers')}</div>
                      <div className="inline-flex px-3 py-1.5 rounded-md text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700">
                        {getAllowedUserName(vrmMetadata.allowedUserName)}
                  </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">{t('vrmviewer.license.commercialUse')}</div>
                      <div className="inline-flex px-3 py-1.5 rounded-md text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700">
                        {getUsageName(vrmMetadata.commercialUsageName)}
                      </div>
                </div>
                
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">{t('vrmviewer.license.violentUsage')}</div>
                      <div className="inline-flex px-3 py-1.5 rounded-md text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700">
                    {getUsageName(vrmMetadata.violentUsageName)}
                      </div>
                </div>
                
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">{t('vrmviewer.license.sexualUsage')}</div>
                      <div className="inline-flex px-3 py-1.5 rounded-md text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700">
                        {getUsageName(vrmMetadata.sexualUsageName)}
                      </div>
                    </div>
                  </div>

                  {/* Other Permissions Section */}
                  {vrmMetadata.otherPermissions && (
                    <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t('vrmviewer.metadata.otherPermissions')}</div>
                      <div className="text-sm text-gray-900 dark:text-gray-100 break-words bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-300 dark:border-gray-700">
                        {vrmMetadata.otherPermissions}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Model Statistics Section */}
            <div className="bg-cream dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors">
              <div className="p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2 mb-4 text-gray-600 dark:text-gray-400">
                  <Layers className="h-4 w-4" />
                  {t('vrmviewer.statistics.title')}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* File Stats */}
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('vrmviewer.statistics.fileSize')}</div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{modelStats.fileSize}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('vrmviewer.statistics.format')}</div>
                      <div className="inline-flex px-3 py-1.5 rounded-md text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700">
                        {vrmVersion || 'Unknown'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('vrmviewer.statistics.height')}</div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {modelStats.height > 0 ? `${modelStats.height.toFixed(2)}m` : 'Unknown'}
                </div>
              </div>
            </div>

                  {/* Mesh Stats */}
                  <div className="space-y-3">
            <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('vrmviewer.statistics.geometry')}</div>
                      <div className="grid gap-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">{t('vrmviewer.statistics.vertices')}</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{modelStats.vertices.toLocaleString()}</span>
                </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">{t('vrmviewer.statistics.triangles')}</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{modelStats.triangles.toLocaleString()}</span>
                </div>
                </div>
                </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('vrmviewer.statistics.assets')}</div>
                      <div className="grid gap-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">{t('vrmviewer.statistics.materials')}</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{modelStats.materials}</span>
                </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">{t('vrmviewer.statistics.textures')}</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{modelStats.textures}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">{t('vrmviewer.statistics.bones')}</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{modelStats.bones}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-48">
            <p className="text-gray-500 dark:text-gray-400">{t('vrmviewer.upload.instructions')}</p>
          </div>
        );
      case 'textures':
        return textures.length > 0 ? (
          <div className="p-4 grid gap-4">
            {textures.map((texture, index) => {
              // Extract additional texture information
              const tex = texture.texture;
              const imageFormat = getImageFormat(tex);
              const dimensions = tex.image ? `${tex.image.width} × ${tex.image.height}` : 'Unknown';
              const format = getTextureFormat(tex);
              const wrapModes = `${getWrapMode(tex.wrapS)}, ${getWrapMode(tex.wrapT)}`;
              const filterModes = `Min: ${getFilterMode(tex.minFilter)}, Mag: ${getFilterMode(tex.magFilter)}`;
              const hasMipmaps = tex.mipmaps?.length > 0 ? `Yes (${tex.mipmaps.length} levels)` : 'No';
              let fileSize = texture.fileSize || 'Unknown';
              
              return (
                <div key={index} className="bg-cream dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
                  {/* Compact Texture Preview - Fixed height container for uniform display */}
                  <div className="w-full h-[240px] relative bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-center p-3">
                    <TextureRenderer 
                      texture={tex} 
                      size={220}
                    />
                  </div>
                  
                  {/* Compact Texture Info */}
                  <div className="p-3">
                    <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-2 truncate" title={texture.name}>
                      {texture.name}
                    </h3>
                    
                    <div className="space-y-1 text-xs">
                      <div className="grid grid-cols-[auto_1fr] gap-x-3 items-center">
                        <span className="text-gray-500 dark:text-gray-400">{t('vrmviewer.texture.dimensions')}:</span>
                        <span className="text-gray-900 dark:text-gray-100 text-right">{dimensions}</span>
                      </div>
                      <div className="grid grid-cols-[auto_1fr] gap-x-3 items-center">
                        <span className="text-gray-500 dark:text-gray-400">{t('vrmviewer.texture.fileSize')}:</span>
                        <span className="text-gray-900 dark:text-gray-100 text-right">{fileSize}</span>
                      </div>
                      <div className="grid grid-cols-[auto_1fr] gap-x-3 items-center">
                        <span className="text-gray-500 dark:text-gray-400">{t('vrmviewer.texture.type')}:</span>
                        <span className="text-gray-900 dark:text-gray-100 text-right">{texture.type}</span>
                      </div>
                    </div>
                    
                    {/* Icon-only Download Button */}
                    <button
                      onClick={() => downloadTextureAsImage(tex, texture.name)}
                      className="mt-3 w-full inline-flex items-center justify-center p-2 border border-gray-300 dark:border-gray-700 rounded-md text-gray-900 dark:text-gray-100 bg-cream dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-900 dark:hover:border-gray-100 transition-all"
                      title={t('vrmviewer.texture.download')}
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">{t('vrmviewer.textures.noTextures')}</p>
          </div>
        );
      case 'expressions':
        return expressions.length > 0 ? (
          <div className="flex flex-col overflow-y-auto">
            {/* Header with Reset Button */}
            <div className="flex justify-between items-center p-3 sticky top-0 bg-cream dark:bg-gray-900 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 z-10 transition-colors">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('vrmviewer.expressions.controls')}</h3>
              <Button 
                size="sm" 
                className="h-8 btn-primary transition-colors" 
                onClick={resetAllExpressions}
              >
                {t('vrmviewer.expressions.reset')}
              </Button>
            </div>

            <div className="p-3 space-y-4">
              {Object.entries(expressionCategories).map(([category, categoryExpressions]) => {
                const categoryItems = expressions.filter(expr => 
                  categoryExpressions.includes(expr.name.toLowerCase()) ||
                  (category === 'other' && !Object.values(expressionCategories).flat().includes(expr.name.toLowerCase()))
                );

                if (categoryItems.length === 0 && category !== 'other') return null;

                return (
                  <div key={category} className="space-y-2">
                    <h4 className="text-caption text-gray-500 dark:text-gray-400">
                      {t(`vrmviewer.expressions.categories.${category}`)}
                    </h4>
                    <div className="grid gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700 transition-colors">
                      {categoryItems.map((expression, index) => (
                        <div key={index} className="flex items-center gap-3 h-8 px-1">
                          {/* Icon */}
                          <div className="flex-none text-lg w-6 text-center">
                            {expressionIcons[expression.name.toLowerCase()] || expressionIcons.default}
                          </div>
                          
                          {/* Name */}
                          <div className="flex-none w-24 text-xs font-medium truncate text-gray-900 dark:text-gray-100" title={expression.name}>
                            {expression.name}
                          </div>
                          
                          {/* Slider */}
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.01"
                              value={expression.value}
                              onChange={(e) => updateExpressionWeight(expression.name, parseFloat(e.target.value))}
                              className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer
                                [&::-webkit-slider-thumb]:appearance-none
                                [&::-webkit-slider-thumb]:w-3
                                [&::-webkit-slider-thumb]:h-3
                                [&::-webkit-slider-thumb]:rounded-full
                                [&::-webkit-slider-thumb]:bg-gray-900
                                [&::-webkit-slider-thumb]:dark:bg-gray-100
                                [&::-webkit-slider-thumb]:hover:bg-black
                                [&::-webkit-slider-thumb]:dark:hover:bg-white
                                [&::-webkit-slider-thumb]:border-0
                                [&::-moz-range-thumb]:appearance-none
                                [&::-moz-range-thumb]:border-0
                                [&::-moz-range-thumb]:w-3
                                [&::-moz-range-thumb]:h-3
                                [&::-moz-range-thumb]:rounded-full
                                [&::-moz-range-thumb]:bg-gray-900
                                [&::-moz-range-thumb]:dark:bg-gray-100
                                [&::-moz-range-thumb]:hover:bg-black
                                [&::-moz-range-thumb]:dark:hover:bg-white"
                            />
                            <span className="flex-none w-10 text-xs font-mono text-gray-500 dark:text-gray-400 text-right">
                              {expression.value.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-4 text-center">
            <p className="text-body text-gray-500 dark:text-gray-400">{t('vrmviewer.expressions.noExpressions')}</p>
          </div>
        );
      case 'rawMetadata':
        return (
          <div className="p-4">
            <p className="text-body text-gray-500 dark:text-gray-400 mb-4">
              {t('vrmviewer.raw.description')}
            </p>
            <pre className="bg-gray-900 dark:bg-gray-950 p-4 rounded-lg overflow-auto text-sm font-mono text-white border border-gray-700">
              {JSON.stringify({
                metadata: vrmMetadata,
                version: vrmVersion,
                modelStats: modelStats,
                expressions: expressions.map(e => ({
                  name: e.name,
                  preset: e.preset,
                  isBinary: e.isBinary,
                  weight: e.weight
                }))
              }, null, 2)}
            </pre>
          </div>
        );
      case 'about':
        return (
          <div className="p-4 space-y-4">
            <p className="text-body text-gray-500 dark:text-gray-400">
              {t('vrmviewer.upload.instructions')}
            </p>
            <p className="text-body text-gray-500 dark:text-gray-400">
              {t('vrmviewer.dropzone.instructions')}
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-300 dark:border-gray-700 transition-colors">
              <h3 className="font-medium text-base text-gray-900 dark:text-gray-100 mb-2">
                {t('vrmviewer.controls.title')}
              </h3>
              <ul className="text-body text-gray-500 dark:text-gray-400 space-y-2">
                <li>
                  <span className="font-medium text-gray-900 dark:text-gray-100">Orbit:</span> {t('vrmviewer.controls.orbit')}
                </li>
                <li>
                  <span className="font-medium text-gray-900 dark:text-gray-100">Pan:</span> {t('vrmviewer.controls.pan')}
                </li>
                <li>
                  <span className="font-medium text-gray-900 dark:text-gray-100">Zoom:</span> {t('vrmviewer.controls.zoom')}
                </li>
                <li>
                  <span className="font-medium text-gray-900 dark:text-gray-100">Reset:</span> {t('vrmviewer.controls.reset')}
                </li>
              </ul>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen max-h-screen w-screen max-w-screen overflow-hidden bg-cream dark:bg-cream-dark flex flex-col transition-colors">
      <div className="flex-none">
        <AvatarHeader 
          title="Open Source Avatars"
          description="A collection of CC0 and open source avatars created by ToxSam"
          socialLink="https://x.com/toxsam"
          showWarningButton={true}
        />
      </div>
      
      {/* Main Content Area with Relative Positioning */}
      <div 
        className="flex-1 relative"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* 3D Viewer - Always Full Size */}
        <div className={`absolute inset-0 bg-cream dark:bg-cream-dark transition-all ${isDragging ? 'bg-opacity-50' : ''}`}>
          <MemoizedVRMInspectorViewer 
            url={fileUrl} 
            onMetadataLoad={onMetadataLoad} 
          />
          {!fileUrl && (
            <div className="absolute inset-0 flex items-center justify-center bg-transparent backdrop-blur-sm">
              <div className="text-center max-w-md px-6">
                <Eye className="h-16 w-16 mx-auto mb-6 text-gray-400 dark:text-gray-500" />
                <h2 className="text-title mb-3 text-gray-900 dark:text-gray-100">{t('vrmviewer.dropzone.title')}</h2>
                <p className="text-body text-gray-500 dark:text-gray-400 mb-6">
                  {t('vrmviewer.dropzone.description')}
                </p>
                <Button
                  onClick={() => {
                    setActiveInfoSection('upload');
                    fileInputRef.current.click();
                  }}
                  size="lg"
                  className="btn-primary"
                >
                  {t('vrmviewer.buttons.openFile')}
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".vrm"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          )}
        </div>

        {/* Drag & Drop Overlay - Only shown when dragging */}
        {isDragging && (
          <div className="absolute inset-0 bg-gray-900/20 dark:bg-gray-100/10 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-cream/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl p-8 shadow-2xl border border-gray-300 dark:border-gray-700">
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-900 dark:text-gray-100" />
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{t('vrmviewer.dropzone.instructions')}</p>
            </div>
          </div>
        )}

        {/* Vertical Tab Navigation */}
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-cream/90 dark:bg-gray-900/90 backdrop-blur-md border-r border-gray-300 dark:border-gray-700 flex flex-col items-center py-4 gap-2 z-20 transition-colors">
          <button
            onClick={() => setActiveInfoSection(activeInfoSection === 'upload' ? '' : 'upload')}
            className={`p-3 rounded-lg transition-all duration-200 ${
              activeInfoSection === 'upload'
                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            title={t('vrmviewer.tabs.about')}
          >
            <FileText className="h-5 w-5" />
          </button>
          <button
            onClick={() => setActiveInfoSection(activeInfoSection === 'info' ? '' : 'info')}
            className={`p-3 rounded-lg transition-all duration-200 ${
              activeInfoSection === 'info'
                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={t('vrmviewer.tabs.information')}
            disabled={!file}
          >
            <Info className="h-5 w-5" />
          </button>
          <button
            onClick={() => setActiveInfoSection(activeInfoSection === 'textures' ? '' : 'textures')}
            className={`p-3 rounded-lg transition-all duration-200 ${
              activeInfoSection === 'textures'
                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={t('vrmviewer.tabs.textures')}
            disabled={!file}
          >
            <Image className="h-5 w-5" />
          </button>
          <button
            onClick={() => setActiveInfoSection(activeInfoSection === 'expressions' ? '' : 'expressions')}
            className={`p-3 rounded-lg transition-all duration-200 ${
              activeInfoSection === 'expressions'
                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={t('vrmviewer.tabs.expressions')}
            disabled={!file}
          >
            <Layers className="h-5 w-5" />
          </button>
          <button
            onClick={() => setActiveInfoSection(activeInfoSection === 'rawMetadata' ? '' : 'rawMetadata')}
            className={`p-3 rounded-lg transition-all duration-200 ${
              activeInfoSection === 'rawMetadata'
                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={t('vrmviewer.tabs.rawMetadata')}
            disabled={!file}
          >
            <Code className="h-5 w-5" />
          </button>
        </div>

        {/* Overlay Panel - Strictly fixed width */}
        {activeInfoSection !== '' && (
          <div 
            className={`absolute top-0 bottom-0 bg-cream dark:bg-gray-900 shadow-lg border-r border-gray-300 dark:border-gray-700
              transition-all duration-300 ease-in-out transform flex flex-col`}
            style={{
              left: '4rem',
              width: '400px',
              minWidth: '400px',
              maxWidth: '400px',
              transform: activeInfoSection !== '' ? 'translateX(0)' : 'translateX(-100%)',
              height: '100%'
            }}
          >
            {/* Panel Header - Fixed */}
            <div className="flex-none px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-cream dark:bg-gray-900 backdrop-blur-sm">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {activeInfoSection === 'upload' && t('vrmviewer.title')}
                {activeInfoSection === 'info' && t('vrmviewer.metadata.title')}
                {activeInfoSection === 'textures' && t('vrmviewer.textures.title')}
                {activeInfoSection === 'expressions' && t('vrmviewer.expressions.title')}
                {activeInfoSection === 'rawMetadata' && t('vrmviewer.technical.title')}
              </h2>
            </div>

            {/* Panel Content - Scrollable */}
            <div className="flex-1 overflow-y-auto min-h-0 overscroll-contain">
              {renderSidebarContent()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

// Wrap the exported component with I18nProvider
export default function VRMInspectorWithProvider() {
  return (
    <I18nProvider defaultLocale="en">
      <VRMInspector />
    </I18nProvider>
  );
} 