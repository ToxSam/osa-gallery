/// src/components/avatar/AvatarViewer.tsx

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { AvatarViewerProps } from '@/types/avatar';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { Maximize2, Minimize2, Info, Eye, EyeOff, DownloadCloud, X, Menu, Search, Dice6, ChevronDown, ChevronRight } from 'lucide-react';
import { setupMobileGestureHelp } from '@/lib/utils';

const VRMViewer = dynamic(() => import('@/components/VRMViewer/VRMViewer').then(mod => mod.VRMViewer), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center">
      <p className="text-gray-500">Loading viewer...</p>
    </div>
  )
});

const DEFAULT_ANIMATION = 'https://assets.opensourceavatars.com/animations/Warrior%20Idle.fbx';
const DEFAULT_ENVIRONMENT = 'https://assets.opensourceavatars.com/environments/cubeScene7.glb';

// Helper function to check available formats from metadata
const getAvailableFormats = (avatar: AvatarViewerProps['avatar']) => {
  const formats: { id: string | null, label: string, isVoxel: boolean }[] = [];
  
  // Check metadata for alternate models
  if (avatar.metadata?.alternateModels) {
    const alternateModels = avatar.metadata.alternateModels;
    
    // Log model information for debugging
    console.log('Avatar name:', avatar.name);
    console.log('Alternate models structure:', JSON.stringify(alternateModels, null, 2));
    
    // Find all keys that might be relevant
    const allKeys = Object.keys(alternateModels);
    console.log('Available keys:', allKeys);
    
    // Standard format detection for all models
    
    // Always add the default VRM format
    formats.push({ id: null, label: 'VRM', isVoxel: false });
    
    // Check for FBX (standard model)
    if (allKeys.includes('fbx') && alternateModels['fbx']) {
      console.log(`Found FBX model with key: fbx`);
      formats.push({ id: 'fbx', label: 'FBX', isVoxel: false });
    }
    
    // Check for Voxel VRM
    if (allKeys.includes('voxel_vrm') && alternateModels['voxel_vrm']) {
      console.log(`Found Voxel VRM with key: voxel_vrm`);
      formats.push({ id: 'voxel', label: 'Voxel VRM', isVoxel: true });
    }
    
    // Check for Voxel FBX
    if ((allKeys.includes('voxel_fbx') && alternateModels['voxel_fbx']) || 
        (allKeys.includes('voxel-fbx') && alternateModels['voxel-fbx'])) {
      console.log(`Found Voxel FBX with key: voxel_fbx or voxel-fbx`);
      formats.push({ id: 'voxel-fbx', label: 'Voxel FBX', isVoxel: true });
    }
  } else {
    // Always add the default VRM format if no alternate models
    formats.push({ id: null, label: 'VRM', isVoxel: false });
  }
  
  return formats;
};

// Function to get the model filename for a specific format
const getModelFilenameForFormat = (
  avatar: AvatarViewerProps['avatar'], 
  format: string | null
): string | null => {
  if (!format || !avatar.metadata?.alternateModels) {
    return null;
  }
  
  const alternateModels = avatar.metadata.alternateModels;
  
  // Find the appropriate key based on the format
  if (format === 'fbx') {
    const value = alternateModels['fbx'];
    
    // If it's already an Arweave URL, return it as is
    if (value && typeof value === 'string' && value.includes('arweave.net')) {
      console.log(`Found direct Arweave URL for FBX format: ${value}`);
      return value;
    }
    return value;
  }
  
  if (format === 'voxel') {
    // Look for voxel_vrm key
    const value = alternateModels['voxel_vrm'];
    
    // If it's already an Arweave URL, return it as is
    if (value && typeof value === 'string' && value.includes('arweave.net')) {
      console.log(`Found direct Arweave URL for Voxel VRM format: ${value}`);
      return value;
    }
    return value;
  }
  
  if (format === 'voxel-fbx') {
    const value = alternateModels['voxel_fbx'] || alternateModels['voxel-fbx'];
    
    // If it's already an Arweave URL, return it as is
    if (value && typeof value === 'string' && value.includes('arweave.net')) {
      console.log(`Found direct Arweave URL for Voxel FBX format: ${value}`);
      return value;
    }
    return value;
  }
  
  return null;
};

// Add the formatName helper function
const formatName = (name: string): string => {
  // Add a space before each capital letter that is not at the start
  return name.replace(/([A-Z])/g, ' $1').trim();
};

// Update the AvatarViewerProps interface in this file only (temporary fix)
interface ExtendedAvatarViewerProps extends AvatarViewerProps {
  metadata?: Record<string, any> | null;
  onDownload?: (id: string, format?: string | null) => void;
  avatars?: AvatarViewerProps['avatar'][];
  onAvatarSelect?: (avatar: AvatarViewerProps['avatar']) => void;
  projects?: any[]; // Added projects
  selectedProjectIds?: Set<string>; // Changed to Set
  onProjectToggle?: (projectId: string) => void; // Changed to toggle
}

export const AvatarViewer: React.FC<ExtendedAvatarViewerProps> = ({ 
  avatar,
  config,
  onDownload,
  onFormatSelect,
  selectedFormat,
  onMetadataLoad,
  metadata,
  avatars,
  onAvatarSelect,
  projects = [],
  selectedProjectIds = new Set(),
  onProjectToggle
}) => {
  const { t } = useI18n();
  const isMobile = useIsMobile();
  const [showTouchControls, setShowTouchControls] = useState(true);
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [showAvatarBrowser, setShowAvatarBrowser] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [projectsExpanded, setProjectsExpanded] = useState(false);
  
  // Infinite scroll state for mobile browser
  const [displayedCount, setDisplayedCount] = useState(50);
  const ITEMS_PER_BATCH = 50;
  const SCROLL_THRESHOLD = 200;

  // Featured avatar names (same as desktop)
  const featuredAvatarNames = [
    'CoolBanana',
    'Mushy',
    'Skull',
    'Butter',
    'CoolAlien',
    'Milk',
    'EyeSummoner',
    'Hotdog',
    'CactusBoy',
    'CosmicPerson',
    'EggBoy',
    'SharkPerson'
  ];

  // Filtered avatars with same logic as desktop
  const filteredAvatars = useMemo(() => {
    if (!avatars || avatars.length === 0) return [];
    
    let result = avatars;
    const trimmedSearch = searchQuery.trim();
    
    // First: Apply project filter if any projects are selected
    if (selectedProjectIds.size > 0) {
      result = result.filter(avatar => selectedProjectIds.has(avatar.projectId));
    }
    
    // Second: Apply search filter on the (already filtered) collection
    if (trimmedSearch) {
      // Search within the filtered collection (by name or description)
      // If no project filter, searches ALL avatars; if project filter applied, searches only within that collection
      result = result.filter(avatar =>
        avatar.name.toLowerCase().includes(trimmedSearch.toLowerCase()) ||
        (avatar.description || '').toLowerCase().includes(trimmedSearch.toLowerCase())
      );
    } else {
      // No search query
      if (selectedProjectIds.size === 0) {
        // No filter, no search → Show Featured (default view only, not a filter)
        result = result.filter(avatar => 
          featuredAvatarNames.some(name => 
            avatar.name.toLowerCase().replace(/\s/g, '') === name.toLowerCase()
          )
        ).slice(0, 12);
      }
      // If projects are selected but no search, just show selected projects (already filtered above)
    }
    
    return result;
  }, [avatars, selectedProjectIds, searchQuery, featuredAvatarNames]);

  // Reset displayed count when filters change
  useEffect(() => {
    setDisplayedCount(ITEMS_PER_BATCH);
  }, [searchQuery, selectedProjectIds]);

  // Avatars to actually display (sliced from filtered list)
  const displayedAvatars = useMemo(() => {
    return filteredAvatars.slice(0, displayedCount);
  }, [filteredAvatars, displayedCount]);

  // Check if there are more avatars to load
  const hasMore = displayedCount < filteredAvatars.length;

  // Handle scroll to load more (for mobile browser)
  const handleMobileScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    
    // Load more when near the bottom
    if (scrollBottom < SCROLL_THRESHOLD && hasMore) {
      setDisplayedCount(prev => Math.min(prev + ITEMS_PER_BATCH, filteredAvatars.length));
    }
  }, [hasMore, filteredAvatars.length]);
  
  // Initialize showInfoPanel based on device type
  const [showInfoPanel, setShowInfoPanel] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768; // Show on desktop, hide on mobile
    }
    return !isMobile; // Fallback
  });
  
  const [wireframeMode, setWireframeMode] = useState(false);
  const [skeletonMode, setSkeletonMode] = useState(false);
  const [rulerMode, setRulerMode] = useState(false);
  const [showAnimationPanel, setShowAnimationPanel] = useState(false);
  
  // Update showInfoPanel when device type changes
  useEffect(() => {
    setShowInfoPanel(!isMobile);
  }, [isMobile]);

  // Setup mobile gesture help on first render
  useEffect(() => {
    if (isMobile) {
      setupMobileGestureHelp();
    }
  }, [isMobile]);

  // Function to toggle wireframe mode
  const toggleWireframeMode = () => {
    const newMode = !wireframeMode;
    setWireframeMode(newMode);
    console.log("Toggling wireframe mode to:", newMode);
    
    // Dispatch custom event to notify VRMViewer
    window.dispatchEvent(new CustomEvent('toggle-wireframe'));
  };

  // Function to toggle skeleton mode
  const toggleSkeletonMode = () => {
    const newMode = !skeletonMode;
    setSkeletonMode(newMode);
    console.log("Toggling skeleton mode to:", newMode);
    
    // Dispatch custom event to notify VRMViewer
    window.dispatchEvent(new CustomEvent('toggle-skeleton'));
  };

  // Function to toggle ruler mode
  const toggleRulerMode = () => {
    const newMode = !rulerMode;
    setRulerMode(newMode);
    console.log("Toggling ruler mode to:", newMode);
    
    // Dispatch custom event to notify VRMViewer
    window.dispatchEvent(new CustomEvent('toggle-ruler'));
  };

  // Function to toggle animation panel
  const toggleAnimationPanel = () => {
    const newMode = !showAnimationPanel;
    setShowAnimationPanel(newMode);
    console.log("Toggling animation panel to:", newMode);
    
    // Dispatch custom event to notify VRMViewer
    window.dispatchEvent(new CustomEvent('toggle-animation-panel'));
  };

  // Function to toggle info panel
  const toggleInfoPanel = () => {
    const newMode = !showInfoPanel;
    setShowInfoPanel(newMode);
    console.log("Toggling info panel to:", newMode);
  };
  
  // Memoize availableFormats to prevent unnecessary recalculations
  const availableFormats = useMemo(() => {
    return getAvailableFormats(avatar);
  }, [avatar]);
  
  const hasAlternateFormats = availableFormats.length > 1;

  // Determine which model URL to display in the viewer
  const displayModelUrl = useMemo(() => {
    // Safety check - if no model URL, return early
    if (!avatar.modelFileUrl) return '';
    
    // Get the selected format details
    const selectedFormatDetails = availableFormats.find(f => f.id === selectedFormat);
    
    // If voxel format is selected, try to use the voxel VRM for display
    if (selectedFormatDetails?.isVoxel) {
      // Get the filename using our helper function
      const voxelFilename = getModelFilenameForFormat(avatar, 'voxel');
      console.log('Voxel filename for display:', voxelFilename);
      
      // If we have a filename for the voxel VRM
      if (voxelFilename && typeof voxelFilename === 'string') {
        // If it's already an Arweave URL, use it directly
        if (voxelFilename.includes('arweave.net')) {
          console.log('Direct Arweave URL found for voxel, using it:', voxelFilename);
          return voxelFilename;
        }
        
        // Otherwise use our special protocol to signal that this needs to be resolved
        console.log('Using voxel:// protocol with filename:', voxelFilename);
        return `voxel://${voxelFilename}`;
      } else {
        console.log('No voxel filename found, using default modelFileUrl');
      }
    }
    
    // Otherwise use the default VRM
    return avatar.modelFileUrl;
  }, [avatar.modelFileUrl, avatar.metadata?.alternateModels, selectedFormat, availableFormats]);

  return (
    <div className="w-full h-full relative">
      <VRMViewer
        url={displayModelUrl}
        animationUrl={DEFAULT_ANIMATION}
        backgroundGLB={null}
        onMetadataLoad={onMetadataLoad}
        showInfoPanel={showInfoPanel}
        onToggleInfoPanel={toggleInfoPanel}
      />
      
      {/* Mobile Touch Controls */}
      {isMobile && (
        <>
          {/* Main controls expandable */}
          {showTouchControls ? (
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
              <div className="bg-cream/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-full p-2 shadow-md">
                <button 
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-cream dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm"
                  onClick={() => setShowTouchControls(false)}
                  aria-label="Hide controls"
                >
                  <Minimize2 className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                </button>
              </div>
              
              <div className="bg-cream/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg p-2 shadow-md flex flex-col items-center gap-2 max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {/* Control buttons - Reordered: info, animations, random avatar, format selector, grid, bones, size, download */}
                
                {/* 1. Info panel toggle */}
                <button 
                  className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-cream dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm"
                  onClick={() => setShowInfoPanel(!showInfoPanel)}
                  aria-label={showInfoPanel ? "Hide info panel" : "Show info panel"}
                >
                  {showInfoPanel ? (
                    <EyeOff className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  ) : (
                    <Info className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  )}
                </button>
                
                {/* 2. Animations toggle */}
                <button 
                  className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full ${
                    showAnimationPanel ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' : 'bg-cream dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  } border border-gray-200 dark:border-gray-700 shadow-sm`}
                  onClick={toggleAnimationPanel}
                  aria-label="Toggle animations"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5" 
                    viewBox="0 0 18 18" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="1.5"
                  >
                    <path d="M4 3L15 9L4 15V3Z" fill="currentColor" stroke="none" />
                  </svg>
                </button>
                
                {/* 3. Random Avatar Button */}
                {avatars && avatars.length > 0 && (
                  <button
                    onClick={() => {
                      if (avatars?.length) {
                        // Get the current avatar's projectId to exclude it
                        const currentProjectId = avatar?.projectId;
                        
                        // Filter avatars from different collections (projects)
                        const avatarsFromOtherCollections = currentProjectId
                          ? avatars.filter(a => a.projectId !== currentProjectId)
                          : avatars;
                        
                        // If there are avatars from other collections, pick from those
                        // Otherwise, fall back to all avatars (edge case: only one collection exists)
                        const availableAvatars = avatarsFromOtherCollections.length > 0 
                          ? avatarsFromOtherCollections 
                          : avatars;
                        
                        const randomIndex = Math.floor(Math.random() * availableAvatars.length);
                        onAvatarSelect?.(availableAvatars[randomIndex]);
                      }
                    }}
                    className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-cream dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm"
                    aria-label="Random avatar"
                  >
                    <Dice6 className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  </button>
                )}
                
                {/* 4. Format selector - button only, panel expands on left */}
                {hasAlternateFormats && (
                  <button 
                    className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full ${
                      showFormatMenu ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' : 'bg-cream dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    } border border-gray-200 dark:border-gray-700 shadow-sm`}
                    onClick={() => setShowFormatMenu(!showFormatMenu)}
                    aria-label="Toggle format menu"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-5 w-5" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <rect x="4" y="4" width="16" height="16" rx="2" />
                      <path d="M4 12h16" />
                    </svg>
                  </button>
                )}
                
                {/* 5. Grid/Wireframe toggle */}
                <button 
                  className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full ${
                    wireframeMode ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' : 'bg-cream dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  } border border-gray-200 dark:border-gray-700 shadow-sm`}
                  onClick={toggleWireframeMode}
                  aria-label="Toggle wireframe mode"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18" />
                    <path d="M3 15h18" />
                    <path d="M9 3v18" />
                    <path d="M15 3v18" />
                  </svg>
                </button>
                
                {/* 6. Bones/Skeleton toggle */}
                <button 
                  className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full ${
                    skeletonMode ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' : 'bg-cream dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  } border border-gray-200 dark:border-gray-700 shadow-sm`}
                  onClick={toggleSkeletonMode}
                  aria-label="Toggle skeleton mode"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <circle cx="7" cy="12" r="3" />
                    <circle cx="17" cy="12" r="3" />
                    <line x1="10" y1="12" x2="14" y2="12" />
                  </svg>
                </button>
                
                {/* 7. Size/Ruler toggle */}
                <button 
                  className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full ${
                    rulerMode ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' : 'bg-cream dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  } border border-gray-200 dark:border-gray-700 shadow-sm`}
                  onClick={toggleRulerMode}
                  aria-label="Toggle ruler"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5" 
                    viewBox="0 0 18 18" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="1.5"
                  >
                    <rect x="4" y="2" width="2.5" height="14" rx="0.5" />
                    <line x1="6.5" y1="3" x2="8.5" y2="3" strokeWidth="1.5" />
                    <line x1="6.5" y1="5.5" x2="8" y2="5.5" strokeWidth="1.5" />
                    <line x1="6.5" y1="8" x2="8.5" y2="8" strokeWidth="1.5" />
                    <line x1="6.5" y1="10.5" x2="8" y2="10.5" strokeWidth="1.5" />
                    <line x1="6.5" y1="13" x2="8.5" y2="13" strokeWidth="1.5" />
                  </svg>
                </button>
                
                {/* 8. Download */}
                {onDownload && (
                  <button 
                    className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-cream dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm"
                    onClick={() => onDownload(avatar.id, selectedFormat)}
                    aria-label="Download avatar"
                  >
                    <DownloadCloud className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="absolute top-4 right-4 z-10">
              <button 
                className="w-10 h-10 flex items-center justify-center rounded-full bg-cream/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-md"
                onClick={() => setShowTouchControls(true)}
                aria-label="Show controls"
              >
                <Maximize2 className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
          )}
          
          {/* Format selector - Secondary floating panel on the left */}
          {hasAlternateFormats && showFormatMenu && (
            <div className="absolute top-4 left-4 z-20 bg-cream/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg p-3 shadow-md">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('avatar.details.format')}</span>
                  <button
                    onClick={() => setShowFormatMenu(false)}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    aria-label="Close format menu"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex flex-col gap-1.5">
                  {availableFormats.map((format) => (
                    <Button
                      key={format.id || 'default'}
                      variant={selectedFormat === format.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        onFormatSelect && onFormatSelect(format.id);
                        setShowFormatMenu(false);
                      }}
                      className={`w-full text-center ${selectedFormat === format.id 
                        ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-medium" 
                        : "bg-cream dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"} text-sm px-3 py-2`}
                    >
                      {t(`avatar.formats.${format.id || 'vrm'}`)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Mobile Avatar Browser */}
      {isMobile && (
        <>
          {/* Avatar Browser */}
          <div className="absolute bottom-0 left-0 right-0 z-20">
            {showAvatarBrowser ? (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 bg-black/20 backdrop-blur-sm"
                  onClick={() => setShowAvatarBrowser(false)}
                />
                
                {/* Browser Panel */}
                <div className="fixed inset-0 bg-cream dark:bg-cream-dark flex flex-col z-30" style={{ top: '64px' }}>
                  {/* Header */}
                  <div className="p-4 border-b border-gray-300 dark:border-gray-700 flex items-center justify-between bg-cream dark:bg-cream-dark shadow-sm">
                    <div className="flex items-center gap-2">
                      <Menu className="h-5 w-5 text-gray-900 dark:text-gray-100" />
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('avatar.controls.browse')}</h2>
                    </div>
                    <button
                      onClick={() => setShowAvatarBrowser(false)}
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      aria-label="Close browser"
                    >
                      <X className="h-6 w-6 text-gray-900 dark:text-gray-100" />
                    </button>
                  </div>

                  {/* Search bar - Moved to top */}
                  <div className="p-4 bg-cream dark:bg-cream-dark border-b border-gray-300 dark:border-gray-700">
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder={t('avatar.controls.search') as string}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 h-9 text-sm border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
                      />
                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  {/* Project Filter Section - Collapsible */}
                  {projects.length > 0 && (
                    <div className={`px-4 bg-cream dark:bg-cream-dark space-y-2 border-b border-gray-300 dark:border-gray-700 ${projectsExpanded ? 'pt-4 pb-4' : 'py-4'}`}>
                      <button
                        onClick={() => setProjectsExpanded(!projectsExpanded)}
                        className="w-full flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                      >
                        <span>Projects</span>
                        {projectsExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      
                      {projectsExpanded && (
                        <div className="space-y-2">
                          {projects.map(project => (
                            <label
                              key={project.id}
                              className={`
                                flex items-center gap-2 p-2 rounded-lg border transition-colors cursor-pointer
                                ${selectedProjectIds.has(project.id)
                                  ? 'border-gray-900 dark:border-gray-100 bg-gray-100 dark:bg-gray-800'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                }
                              `}
                            >
                              <input
                                type="checkbox"
                                checked={selectedProjectIds.has(project.id)}
                                onChange={() => onProjectToggle?.(project.id)}
                                className="h-4 w-4 rounded"
                              />
                              <span className="flex-1 text-sm text-gray-900 dark:text-gray-100">
                                {project.name}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {project.avatarCount}
                              </span>
                            </label>
                          ))}
                          {selectedProjectIds.size > 0 && (
                            <button
                              onClick={() => selectedProjectIds.forEach(id => onProjectToggle?.(id))}
                              className="w-full text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 py-1"
                            >
                              Clear filters ({selectedProjectIds.size})
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Avatar grid with infinite scroll */}
                  <div 
                    className="flex-1 overflow-y-auto p-4"
                    onScroll={handleMobileScroll}
                  >
                    <div className="grid grid-cols-2 gap-4">
                      {displayedAvatars.map((a) => (
                          <button
                            key={a.id}
                            onClick={() => {
                              onAvatarSelect?.(a);
                              setShowAvatarBrowser(false);
                            }}
                            className={`flex flex-col items-center p-2 rounded-lg border ${
                              a.id === avatar.id 
                                ? 'border-gray-900 dark:border-gray-100 bg-gray-100 dark:bg-gray-800' 
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                          >
                            <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                              <img
                                src={a.thumbnailUrl || '/placeholder.png'}
                                alt={a.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>
                            <span className="mt-2 text-sm font-medium text-gray-900 truncate w-full text-center">
                              {a.name}
                            </span>
                          </button>
                        ))}
                    </div>
                    
                    {/* Loading indicator when more items are available */}
                    {hasMore && (
                      <div className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        Showing {displayedAvatars.length} of {filteredAvatars.length} avatars
                        <br />
                        <span className="text-xs">Scroll down to load more...</span>
                      </div>
                    )}
                    
                    {/* End of list indicator */}
                    {!hasMore && displayedAvatars.length > 0 && (
                      <div className="py-4 text-center text-xs text-gray-400 dark:text-gray-500">
                        All {filteredAvatars.length} avatars displayed
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              // Browse button
              <button
                onClick={() => setShowAvatarBrowser(true)}
                className="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 py-4 px-6 flex items-center justify-center space-x-2"
              >
                <Menu className="h-5 w-5" />
                <span>{t('avatar.controls.browse') as string}</span>
              </button>
            )}
          </div>
        </>
      )}
      
      {/* Format selection buttons - desktop only */}
      {!isMobile && hasAlternateFormats && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-cream/90 dark:bg-gray-900/90 rounded-md p-2 flex items-center space-x-2 border border-gray-200 dark:border-gray-700 shadow-md" style={{ backdropFilter: 'blur(4px)' }}>
            <span className="text-gray-900 dark:text-gray-100 text-sm font-medium mr-2">{t('avatar.details.format')}:</span>
            {availableFormats.map((format) => (
              <Button
                key={format.id || 'default'}
                variant={selectedFormat === format.id ? "default" : "outline"}
                size="sm"
                onClick={() => onFormatSelect && onFormatSelect(format.id)}
                className={`${selectedFormat === format.id 
                  ? "bg-gray-300/70 dark:bg-gray-700/70 text-gray-900 dark:text-gray-100 font-medium" 
                  : "bg-transparent text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
              >
                {t(`avatar.formats.${format.id || 'vrm'}`)}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Mobile instructions indicator */}
      {isMobile && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0 opacity-70 text-center" 
          style={{ display: 'none' }} // Initially hidden, will be shown by JS on first load
          id="mobile-gesture-help"
        >
          <div className="bg-cream/80 dark:bg-gray-900/80 backdrop-blur-sm p-4 rounded-lg shadow-md text-gray-800 dark:text-gray-200 text-sm">
            <p className="font-medium">Touch Controls</p>
            <ul className="text-xs mt-2 text-left space-y-1">
              <li>• One finger drag: Rotate model</li>
              <li>• Two finger pinch: Zoom in/out</li>
              <li>• Two finger drag: Pan camera</li>
            </ul>
          </div>
        </div>
      )}
      
      {/* Metadata Panel - Conditionally rendered based on showInfoPanel */}
      {showInfoPanel && (
        <div 
          className={`
            ${isMobile ? 
              'absolute bottom-4 left-4 right-4 z-10 max-h-[40vh] overflow-y-auto rounded-lg shadow-lg' : 
              'absolute top-4 left-4 z-10 max-w-xs max-h-[calc(100vh-120px)]'
            } 
            bg-cream/95 dark:bg-gray-900/95 backdrop-blur-sm p-5 overflow-auto
          `}
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-300 dark:border-gray-700 pb-2 mb-2">{avatar && formatName(avatar.name)}</h2>
          
          {/* Thumbnail Image - Responsive styling for both mobile and desktop */}
          <div className={`my-3 w-full flex justify-center ${isMobile ? 'max-h-32' : ''}`}>
            <img
              src={avatar.thumbnailUrl || '/placeholder.png'}
              alt={formatName(avatar.name)}
              className={`rounded-lg object-contain shadow-sm border border-gray-200 dark:border-gray-700 ${
                isMobile ? 'max-h-32 w-auto' : 'max-w-full max-h-60'
              }`}
            />
          </div>
          
          {avatar.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{avatar.description}</p>
          )}
          
          <div className="space-y-1.5 text-sm">
            {/* Technical Details Section */}
            <div className="font-medium text-gray-900 dark:text-gray-100">{t('avatar.details.title')}</div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
              <span className="text-gray-500 dark:text-gray-400">{t('avatar.details.format')}:</span>
              <span className="text-gray-900 dark:text-gray-100">{metadata?.format || avatar.format}</span>
              
              <span className="text-gray-500 dark:text-gray-400">{t('avatar.details.polygons')}:</span>
              <span className="text-gray-900 dark:text-gray-100">{metadata?.triangleCount ? metadata.triangleCount.toLocaleString() : "Unknown"}</span>
              
              <span className="text-gray-500 dark:text-gray-400">{t('avatar.details.materials')}:</span>
              <span className="text-gray-900 dark:text-gray-100">{metadata?.materialCount ?? "Unknown"}</span>
            </div>
            
            {/* License Information */}
            <div className="font-medium text-gray-900 dark:text-gray-100 mt-3">{t('avatar.details.license')}</div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
              <span className="text-gray-500 dark:text-gray-400">{t('avatar.details.project')}:</span>
              <span className="text-gray-900 dark:text-gray-100">{avatar.project}</span>
              
              <span className="text-gray-500 dark:text-gray-400">{t('avatar.details.license')}:</span>
              <span className="text-gray-900 dark:text-gray-100">{metadata?.license || metadata?.licenseType || "CC0 (Assumed)"}</span>
              
              {metadata?.author && (
                <>
                  <span className="text-gray-500 dark:text-gray-400">{t('avatar.details.author')}:</span>
                  <span className="text-gray-900 dark:text-gray-100">{metadata.author}</span>
                </>
              )}
            </div>
            
            {/* VRM Specific Metadata - Collapsible on mobile */}
            {metadata && (
              <>
                <div className="font-medium text-gray-900 dark:text-gray-100 mt-3">{t('avatar.vrm.title')}</div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                  {metadata.vrmVersion && (
                    <>
                      <span className="text-gray-500 dark:text-gray-400">{t('avatar.vrm.version')}:</span>
                      <span className="text-gray-900 dark:text-gray-100">{metadata.vrmVersion}</span>
                    </>
                  )}
                  
                  {metadata.allowedUserName && (
                    <>
                      <span className="text-gray-500 dark:text-gray-400">{t('avatar.vrm.allowedUsers')}:</span>
                      <span className="text-gray-900 dark:text-gray-100">
                        {metadata.allowedUserName === 'Everyone' 
                          ? t('avatar.vrm.everyone')
                          : metadata.allowedUserName}
                      </span>
                    </>
                  )}
                  
                  {metadata.violentUssage !== undefined && (
                    <>
                      <span className="text-gray-500 dark:text-gray-400">Violent Usage:</span>
                      <span className="text-gray-900 dark:text-gray-100">{metadata.violentUssage ? "Allowed" : "Not Allowed"}</span>
                    </>
                  )}
                  
                  {metadata.sexualUssage !== undefined && (
                    <>
                      <span className="text-gray-500 dark:text-gray-400">Sexual Usage:</span>
                      <span className="text-gray-900 dark:text-gray-100">{metadata.sexualUssage ? "Allowed" : "Not Allowed"}</span>
                    </>
                  )}
                  
                  {metadata.commercialUssage !== undefined && (
                    <>
                      <span className="text-gray-500 dark:text-gray-400">Commercial:</span>
                      <span className="text-gray-900 dark:text-gray-100">{metadata.commercialUssage ? "Allowed" : "Not Allowed"}</span>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};