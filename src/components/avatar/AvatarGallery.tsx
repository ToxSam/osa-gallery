///src/components/avatar/AvatarGallery.tsx

"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Search, Download, RefreshCw, ChevronDown, ChevronRight, ChevronLeft } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAvatarSelection } from '@/lib/hooks/useAvatarSelection';
import { Avatar, ViewerConfig, ApiResponse, Project } from '@/types/avatar';
import { AvatarCard } from './AvatarCard';
import { AvatarViewer } from './AvatarViewer';
import { AvatarHeader } from './AvatarHeader';
import { useI18n } from '@/lib/i18n';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { useRouter, usePathname } from 'next/navigation';

// Utility function to format camelCase or PascalCase names with spaces
const formatName = (name: string): string => {
  // Add a space before each capital letter that is not at the start
  return name.replace(/([A-Z])/g, ' $1').trim();
};

export const AvatarGallery: React.FC = () => {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = pathname?.split('/')[1] || 'en'; // Extract locale from path
  
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());
  const [currentAvatar, setCurrentAvatar] = useState<Avatar | null>(null);
  const [vrmMetadata, setVrmMetadata] = useState<Record<string, any> | null>(null);
  const [projectsExpanded, setProjectsExpanded] = useState(false);
  const isMobile = useIsMobile();
  const [showAvatarsList, setShowAvatarsList] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(280); // Default width in pixels
  const [isResizing, setIsResizing] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { 
    selectedFormat,
    handleFormatChange
  } = useAvatarSelection();
  
  // Use ref to track if avatar has been initialized (prevents double selection in Strict Mode)
  const avatarInitializedRef = useRef(false);
  
  // Infinite scroll state
  const [displayedCount, setDisplayedCount] = useState(50); // Initial batch size
  const ITEMS_PER_BATCH = 50; // Load 50 more avatars at a time
  const SCROLL_THRESHOLD = 200; // Load more when 200px from bottom

  // Helper function to create URL-friendly slug from avatar name
  const createSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Handler to update URL and select avatar (without page navigation)
  const handleAvatarClick = (avatar: Avatar) => {
    setCurrentAvatar(avatar);
    const slug = createSlug(avatar.name);
    // Update URL without navigation using shallow routing
    window.history.pushState(null, '', `${pathname}?avatar=${slug}`);
  };

  // Featured avatar names (handpicked)
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

  const [viewerConfig] = useState<ViewerConfig>({
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    expression: 'neutral'
  });

  useEffect(() => {
    // Prevent scrolling on the body when this component is mounted
    document.body.style.overflow = 'hidden';
    
    const fetchAvatars = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/avatars', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch avatars');
        }

        const apiData = data as ApiResponse;
        setAvatars(apiData.avatars);
        setProjects(apiData.projects || []);
        
        // Only initialize avatar selection once (prevents double selection in React Strict Mode)
        if (apiData.avatars && apiData.avatars.length > 0 && !avatarInitializedRef.current) {
          avatarInitializedRef.current = true;
          
          // Check if there's an avatar in the URL
          const params = new URLSearchParams(window.location.search);
          const avatarSlug = params.get('avatar');
          
          if (avatarSlug) {
            // Find and load avatar from URL
            const avatar = apiData.avatars.find(a => createSlug(a.name) === avatarSlug);
            if (avatar) {
              setCurrentAvatar(avatar);
              console.log(`Loaded avatar from URL: ${avatar.name}`);
            } else {
              // Avatar not found, select random one
              const randomIndex = Math.floor(Math.random() * apiData.avatars.length);
              setCurrentAvatar(apiData.avatars[randomIndex]);
            }
          } else {
            // No avatar in URL, select a random one
            const randomIndex = Math.floor(Math.random() * apiData.avatars.length);
            setCurrentAvatar(apiData.avatars[randomIndex]);
            console.log(`Selected random avatar: ${apiData.avatars[randomIndex].name}`);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch avatars');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvatars();

    return () => {
      // Restore scrolling when component unmounts
      document.body.style.overflow = '';
    };
  }, []);

  // Filtered avatars based on project selection and search
  const filteredAvatars = useMemo(() => {
    let result = avatars;
    
    // If searching
    if (searchQuery) {
      // Filter by search term
      result = result.filter(avatar =>
        avatar.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        avatar.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      // If projects are selected, filter to only those projects
      if (selectedProjectIds.size > 0) {
        result = result.filter(avatar => selectedProjectIds.has(avatar.projectId));
      }
      // If no projects selected, search returns ALL matching avatars
    } else {
      // No search query
      if (selectedProjectIds.size > 0) {
        // Show avatars from selected projects
        result = result.filter(avatar => selectedProjectIds.has(avatar.projectId));
      } else {
        // No projects selected, no search → Show Featured (default view)
        result = result.filter(avatar => 
          featuredAvatarNames.some(name => 
            avatar.name.toLowerCase().replace(/\s/g, '') === name.toLowerCase()
          )
        ).slice(0, 12);
      }
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

  // Handle scroll to load more
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    
    // Load more when near the bottom
    if (scrollBottom < SCROLL_THRESHOLD && hasMore) {
      setDisplayedCount(prev => Math.min(prev + ITEMS_PER_BATCH, filteredAvatars.length));
    }
  }, [hasMore, filteredAvatars.length]);

  // Toggle project selection
  const toggleProjectSelection = (projectId: string) => {
    setSelectedProjectIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const handleMetadataLoad = useCallback((metadata: Record<string, any>) => {
    console.log('VRM metadata loaded:', metadata);
    setVrmMetadata(metadata);
  }, []);

  const selectRandomAvatar = useCallback(() => {
    if (avatars.length > 0) {
      // Get the current avatar's projectId to exclude it
      const currentProjectId = currentAvatar?.projectId;
      
      // Filter avatars from different collections (projects)
      const avatarsFromOtherCollections = currentProjectId
        ? avatars.filter(avatar => avatar.projectId !== currentProjectId)
        : avatars;
      
      // If there are avatars from other collections, pick from those
      // Otherwise, fall back to all avatars (edge case: only one collection exists)
      const availableAvatars = avatarsFromOtherCollections.length > 0 
        ? avatarsFromOtherCollections 
        : avatars;
      
      const randomIndex = Math.floor(Math.random() * availableAvatars.length);
      const randomAvatar = availableAvatars[randomIndex];
      setCurrentAvatar(randomAvatar);
      const slug = createSlug(randomAvatar.name);
      // Update URL without navigation using shallow routing
      window.history.pushState(null, '', `${pathname}?avatar=${slug}`);
    }
  }, [avatars, currentAvatar, pathname]);

  const handleDownloadCurrent = useCallback(async (avatarId?: string, format?: string | null) => {
    // Use provided avatarId or currentAvatar
    const targetAvatar = avatarId 
      ? avatars.find(a => a.id === avatarId) 
      : currentAvatar;
    
    if (!targetAvatar) {
      alert('Avatar not found');
      return;
    }

    // Use provided format or selectedFormat
    const targetFormat = format !== undefined ? format : selectedFormat;

    try {
      const { downloadAvatar } = await import('@/lib/download-utils');
      await downloadAvatar(targetAvatar, targetFormat || null);
    } catch (error) {
      console.error('Download error:', error);
      alert('Download failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }, [currentAvatar, selectedFormat, avatars]);

  // Handle sidebar resize
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Calculate new width, constrained between min and max
      const newWidth = Math.min(Math.max(e.clientX, 200), 600);
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Calculate number of columns based on sidebar width
  const gridColumns = useMemo(() => {
    if (sidebarWidth < 250) return 2;
    if (sidebarWidth < 350) return 3;
    if (sidebarWidth < 500) return 4;
    return 5;
  }, [sidebarWidth]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-cream dark:bg-cream-dark">
        <div className="text-body-lg text-gray-500 dark:text-gray-400">Welcome to the home of truly free avatars.</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-cream dark:bg-cream-dark">
        <div className="text-body-lg text-red-500">Error: {error}</div>
        <Button 
          onClick={() => window.location.reload()}
          variant="outline"
          className="btn-outline"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!avatars.length) {
    return (
      <div className="h-screen flex items-center justify-center bg-cream dark:bg-cream-dark">
        <div className="text-body-lg text-gray-500 dark:text-gray-400">No avatars found</div>
      </div>
    );
  }

  return (
    <div className="h-screen max-h-screen w-screen max-w-screen overflow-hidden bg-cream dark:bg-cream-dark flex flex-col transition-colors">
      <div className="flex-none">
        <AvatarHeader 
          title="Open Source Avatars"
          description="A collection of CC0 and open source avatars created by ToxSam"
          socialLink="https://x.com/toxsam"
        />
      </div>
  
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        {/* Avatar List - Left Side on desktop only */}
        {!isMobile && !sidebarCollapsed && (
          <>
            <div 
              className="border-r border-gray-300 dark:border-gray-700 overflow-hidden flex flex-col bg-cream dark:bg-gray-900 relative"
              style={{ width: `${sidebarWidth}px`, minWidth: '200px', maxWidth: '600px' }}
            >
              {/* Search and Controls Container */}
              <div className="p-3 flex-none border-b border-gray-300 dark:border-gray-700 space-y-3">
                {/* Search Bar - Moved to Top */}
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

                {/* Project Filter Section - Collapsible */}
                <div className="space-y-2">
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
                    <div className="space-y-1">
                      {/* Individual Project Checkboxes */}
                      {projects.map(project => (
                        <label
                          key={project.id}
                          className={`
                            w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all cursor-pointer
                            ${selectedProjectIds.has(project.id)
                              ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium border-l-2 border-gray-900 dark:border-gray-100' 
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300'
                            }
                          `}
                        >
                          <input
                            type="checkbox"
                            checked={selectedProjectIds.has(project.id)}
                            onChange={() => toggleProjectSelection(project.id)}
                            className="h-4 w-4 rounded"
                          />
                          <span className="flex-1">{project.name}</span>
                          <span className="text-xs">{project.avatarCount}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Random Avatar Button */}
              <div className="px-3 pt-3 pb-2 border-b border-gray-300 dark:border-gray-700">
                <Button 
                  onClick={selectRandomAvatar} 
                  variant="outline"
                  className="w-full h-10 text-sm font-medium border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Random Avatar</span>
                </Button>
              </div>

              {/* Avatar List - Dynamic Grid layout with infinite scroll */}
              <div 
                className="flex-1 py-2 overflow-y-auto"
                onScroll={handleScroll}
              >
                <div 
                  className="grid gap-2 px-3"
                  style={{ gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))` }}
                >
                  {displayedAvatars.map(avatar => (
                    <button
                      key={avatar.id}
                      className={`
                        flex flex-col rounded-lg overflow-hidden cursor-pointer transition-all
                        ${currentAvatar?.id === avatar.id ? 
                          'ring-2 ring-gray-900 dark:ring-gray-100' : 
                          'hover:ring-2 hover:ring-gray-400 dark:hover:ring-gray-600'
                        }
                      `}
                      onClick={() => handleAvatarClick(avatar)}
                    >
                      {/* Thumbnail */}
                      <div className="aspect-square w-full bg-gray-100 dark:bg-gray-800">
                        <img
                          src={avatar.thumbnailUrl || '/placeholder.png'}
                          alt={formatName(avatar.name)}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      
                      {/* Info */}
                      <div className="p-2 bg-cream dark:bg-gray-900 text-left">
                        <h3 className="text-xs font-medium truncate text-gray-900 dark:text-gray-100">
                          {formatName(avatar.name)}
                        </h3>
                        <p className="text-xs truncate text-gray-500 dark:text-gray-400">
                          {avatar.project}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
                
                {/* Loading indicator when more items are available */}
                {hasMore && (
                  <div className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    Showing {displayedAvatars.length} of {filteredAvatars.length} avatars
                    <br />
                    <span className="text-xs">Scroll down to load more...</span>
                  </div>
                )}
                
                {/* End of list indicator */}
                {!hasMore && displayedAvatars.length > 0 && (
                  <div className="px-3 py-4 text-center text-xs text-gray-400 dark:text-gray-500">
                    All {filteredAvatars.length} avatars displayed
                  </div>
                )}
              </div>
            </div>
            
            {/* Resize Handle */}
            <div
              className="w-1 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 cursor-col-resize transition-colors flex-shrink-0 group relative"
              onMouseDown={handleMouseDown}
            >
              {/* Visual indicator on hover */}
              <div className="absolute inset-y-0 left-1/2 transform -translate-x-1/2 w-1 bg-gray-900 dark:bg-gray-100 opacity-0 group-hover:opacity-50 transition-opacity" />
              
              {/* Collapse button */}
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-12 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 rounded-r-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="h-4 w-4 text-gray-900 dark:text-gray-100" />
              </button>
            </div>
          </>
        )}
        
        {/* Expand button when sidebar is collapsed */}
        {!isMobile && sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="absolute top-1/2 left-0 transform -translate-y-1/2 w-6 h-16 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 rounded-r-md flex items-center justify-center z-20 shadow-md transition-colors"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="h-5 w-5 text-gray-900 dark:text-gray-100" />
          </button>
        )}

        {/* 3D Viewer - Full width on mobile, dynamic width on desktop */}
        <div className={`${isMobile ? 'w-full h-full' : 'flex-1'} relative overflow-hidden bg-cream dark:bg-cream-dark`}>
          {currentAvatar ? (
            <>
              {/* We're removing the Metadata Panel from here, as it will be conditionally rendered
                  inside the AvatarViewer component */}
              
              {/* Download Button - Different position on mobile */}
              {!isMobile && (
                <div 
                  className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
                >
                  <Button 
                    onClick={(e) => {
                      e.preventDefault();
                      handleDownloadCurrent();
                    }}
                    variant="default"
                    className="bg-cream/90 dark:bg-gray-900/90 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-700 hover:shadow-xl hover:scale-105 px-6 py-2 rounded-md flex items-center gap-2 shadow-lg border border-gray-300 dark:border-gray-700 font-medium backdrop-blur-md transition-all duration-200"
                  >
                    <Download className="h-4 w-4" />
                    <span>
                      {t('avatar.controls.download')}
                      {selectedFormat && (
                        <>
                          {' ('}
                          {selectedFormat === 'voxel' && t('avatar.formats.vrmViewer')}
                          {selectedFormat === 'fbx' && t('avatar.formats.fbx')}
                          {selectedFormat === 'voxel-fbx' && t('avatar.formats.fbxViewer')}
                          {!['voxel', 'fbx', 'voxel-fbx'].includes(selectedFormat) && selectedFormat.toUpperCase()}
                          {')'}
                        </>
                      )}
                    </span>
                  </Button>
                </div>
              )}
              
              {/* Full-size Viewer */}
              <div className="w-full h-full">
                <AvatarViewer
                  avatar={currentAvatar}
                  config={viewerConfig}
                  onMetadataLoad={handleMetadataLoad}
                  onFormatSelect={handleFormatChange}
                  selectedFormat={selectedFormat}
                  onDownload={handleDownloadCurrent}
                  metadata={vrmMetadata}
                  avatars={avatars}
                  onAvatarSelect={setCurrentAvatar}
                  projects={projects}
                  selectedProjectIds={selectedProjectIds}
                  onProjectToggle={toggleProjectSelection}
                />
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <p className="text-gray-500 dark:text-gray-400">Select an avatar to view</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AvatarGallery;
