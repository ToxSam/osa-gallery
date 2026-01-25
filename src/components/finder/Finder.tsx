'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import { Avatar, Project } from '@/types/avatar';
import { AvatarHeader } from '@/components/avatar/AvatarHeader';
import CollectionTree from './CollectionTree';
import AvatarListView from './AvatarListView';
import FileList from './FileList';
import PreviewPanel from './PreviewPanel';
import BatchDownloadManager from './BatchDownloadManager';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useDownloadQueue, DownloadOptions } from '@/lib/hooks/useDownloadQueue';
import { FileTypeInfo, getAllAvatarFiles } from './utils/fileTypes';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { CrescentSpinner } from '@/components/ui/crescent-spinner';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { Computer } from 'lucide-react';

interface GroupedCollection {
  id: string;
  name: string;
  projects: Project[];
  isExpanded: boolean;
}

export default function Finder() {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [groupedCollections, setGroupedCollections] = useState<GroupedCollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Selection state
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<Set<string>>(new Set());
  const [selectedAvatarIds, setSelectedAvatarIds] = useState<Set<string>>(new Set());
  const [selectedFileTypes, setSelectedFileTypes] = useState<Record<string, Set<string>>>({});
  const [previewAvatar, setPreviewAvatar] = useState<Avatar | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileTypeInfo | null>(null);
  
  // Use ref to track if avatar has been initialized from URL (prevents double initialization)
  const avatarInitializedRef = useRef(false);
  
  // Helper function to create URL-friendly slug from avatar name
  const createSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [fileTypeFilters, setFileTypeFilters] = useState({
    hasVrm: false,
    hasFbx: false,
    hasVoxel: false,
  });
  
  // Download queue
  const {
    queue: downloadQueue,
    addToQueue,
    cancelItem,
    retryItem,
    clearQueue,
  } = useDownloadQueue();
  const [isBatchDownloadManagerOpen, setIsBatchDownloadManagerOpen] = useState(false);

  // Resizable columns state - 4 columns: left (collections), center (avatar list), file list, right (preview)
  const [leftWidth, setLeftWidth] = useState(15); // Default 15% (collections)
  const [centerWidth, setCenterWidth] = useState(35); // Default 35% (avatar list - compressed)
  const [fileListWidth, setFileListWidth] = useState(25); // Default 25% (file list)
  const [rightWidth, setRightWidth] = useState(25); // Default 25% (preview)
  const [isResizing, setIsResizing] = useState<'left' | 'middle' | 'right' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeStartX = useRef<number>(0);
  const resizeStartWidths = useRef<{ left: number; center: number; fileList: number; right: number }>({ 
    left: 15, center: 35, fileList: 25, right: 25 
  });

  // Panel constraints (min/max widths in pixels and percentages)
  const getPanelConstraints = useCallback(() => {
    if (!containerRef.current) {
      return {
        left: { min: 150, max: 400, minPercent: 10, maxPercent: 30 },
        center: { min: 250, max: 800, minPercent: 20, maxPercent: 50 },
        fileList: { min: 150, max: 600, minPercent: 15, maxPercent: 40 },
        right: { min: 180, max: 800, minPercent: 12, maxPercent: 50 },
      };
    }
    
    const containerWidth = containerRef.current.offsetWidth;
    return {
      left: { 
        min: 150, 
        max: 400, 
        minPercent: Math.max(10, (150 / containerWidth) * 100), 
        maxPercent: Math.min(30, (400 / containerWidth) * 100) 
      },
      center: { 
        min: 250, 
        max: 800, 
        minPercent: Math.max(20, (250 / containerWidth) * 100), 
        maxPercent: Math.min(50, (800 / containerWidth) * 100) 
      },
      fileList: { 
        min: 150, 
        max: 600, 
        minPercent: Math.max(15, (150 / containerWidth) * 100), 
        maxPercent: Math.min(40, (600 / containerWidth) * 100) 
      },
      right: { 
        min: 180, 
        max: 800, 
        minPercent: Math.max(12, (180 / containerWidth) * 100), 
        maxPercent: Math.min(50, (800 / containerWidth) * 100) 
      },
    };
  }, []);

  // Load saved column widths from localStorage
  useEffect(() => {
    const savedLeft = localStorage.getItem('finder-left-width');
    const savedCenter = localStorage.getItem('finder-center-width');
    const savedFileList = localStorage.getItem('finder-filelist-width');
    const savedRight = localStorage.getItem('finder-right-width');
    
    if (savedLeft) setLeftWidth(parseFloat(savedLeft));
    if (savedCenter) setCenterWidth(parseFloat(savedCenter));
    if (savedFileList) setFileListWidth(parseFloat(savedFileList));
    if (savedRight) setRightWidth(parseFloat(savedRight));
  }, []);

  // Save column widths to localStorage
  useEffect(() => {
    localStorage.setItem('finder-left-width', leftWidth.toString());
    localStorage.setItem('finder-center-width', centerWidth.toString());
    localStorage.setItem('finder-filelist-width', fileListWidth.toString());
    localStorage.setItem('finder-right-width', rightWidth.toString());
  }, [leftWidth, centerWidth, fileListWidth, rightWidth]);

  // Normalize widths to ensure they always sum to 100% (only when not resizing)
  useEffect(() => {
    if (isResizing) return; // Don't normalize during active resize
    
    const normalizeWidths = () => {
      const totalWidth = leftWidth + centerWidth + fileListWidth + rightWidth;
      const tolerance = 0.1; // Allow small floating point errors
      
      if (Math.abs(totalWidth - 100) > tolerance) {
        const scale = 100 / totalWidth;
        setLeftWidth(prev => prev * scale);
        setCenterWidth(prev => prev * scale);
        setFileListWidth(prev => prev * scale);
        setRightWidth(prev => prev * scale);
      }
    };

    // Normalize after any width change (with a small delay to batch updates)
    const timeoutId = setTimeout(normalizeWidths, 0);
    return () => clearTimeout(timeoutId);
  }, [leftWidth, centerWidth, fileListWidth, rightWidth, isResizing]);

  // Handle window resize - adjust constraints but maintain proportions
  useEffect(() => {
    const handleWindowResize = () => {
      if (!containerRef.current || isResizing) return;
      
      // Re-validate constraints on window resize
      const constraints = getPanelConstraints();
      const containerWidth = containerRef.current.offsetWidth;
      
      // Convert current percentages to pixels and clamp
      const leftPx = (leftWidth / 100) * containerWidth;
      const centerPx = (centerWidth / 100) * containerWidth;
      const fileListPx = (fileListWidth / 100) * containerWidth;
      const rightPx = (rightWidth / 100) * containerWidth;
      
      // Clamp each panel to its constraints
      const clampedLeft = Math.max(constraints.left.min, Math.min(constraints.left.max, leftPx));
      const clampedCenter = Math.max(constraints.center.min, Math.min(constraints.center.max, centerPx));
      const clampedFileList = Math.max(constraints.fileList.min, Math.min(constraints.fileList.max, fileListPx));
      const clampedRight = Math.max(constraints.right.min, Math.min(constraints.right.max, rightPx));
      
      // Convert back to percentages and normalize
      const totalPx = clampedLeft + clampedCenter + clampedFileList + clampedRight;
      if (totalPx > 0) {
        setLeftWidth((clampedLeft / totalPx) * 100);
        setCenterWidth((clampedCenter / totalPx) * 100);
        setFileListWidth((clampedFileList / totalPx) * 100);
        setRightWidth((clampedRight / totalPx) * 100);
      }
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [leftWidth, centerWidth, fileListWidth, rightWidth, isResizing, getPanelConstraints]);

  // Handle resize start
  const handleResizeStart = useCallback((side: 'left' | 'middle' | 'right', e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(side);
    resizeStartX.current = e.clientX;
    resizeStartWidths.current = { left: leftWidth, center: centerWidth, fileList: fileListWidth, right: rightWidth };
  }, [leftWidth, centerWidth, fileListWidth, rightWidth]);

  // Handle resize move - simplified: each divider only affects its two adjacent panels
  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    const deltaX = e.clientX - resizeStartX.current;
    const deltaPercent = (deltaX / containerWidth) * 100;
    const constraints = getPanelConstraints();

    if (isResizing === 'left') {
      // Resizing between Projects (left) and Avatar List (center)
      // Calculate desired widths
      const desiredLeft = resizeStartWidths.current.left + deltaPercent;
      const desiredCenter = resizeStartWidths.current.center - deltaPercent;
      
      // Clamp both to their constraints
      const newLeft = Math.max(constraints.left.minPercent, Math.min(constraints.left.maxPercent, desiredLeft));
      const newCenter = Math.max(constraints.center.minPercent, Math.min(constraints.center.maxPercent, desiredCenter));
      
      // Calculate actual change (may be limited by constraints)
      const leftChange = newLeft - resizeStartWidths.current.left;
      const centerChange = newCenter - resizeStartWidths.current.center;
      
      // Use the smaller change to keep panels in sync
      const actualChange = Math.abs(leftChange) < Math.abs(centerChange) ? leftChange : -centerChange;
      
      // Apply to adjacent panels
      const finalLeft = resizeStartWidths.current.left + actualChange;
      const finalCenter = resizeStartWidths.current.center - actualChange;
      
      setLeftWidth(finalLeft);
      setCenterWidth(finalCenter);
      
      // Distribute remaining space to other panels proportionally
      // Note: The normalization effect will ensure total = 100% and handle any constraint violations
      const currentTotal = finalLeft + finalCenter + resizeStartWidths.current.fileList + resizeStartWidths.current.right;
      const remainingSpace = 100 - currentTotal;
      if (Math.abs(remainingSpace) > 0.01) {
        const totalOther = resizeStartWidths.current.fileList + resizeStartWidths.current.right;
        if (totalOther > 0) {
          setFileListWidth(resizeStartWidths.current.fileList + (remainingSpace * resizeStartWidths.current.fileList / totalOther));
          setRightWidth(resizeStartWidths.current.right + (remainingSpace * resizeStartWidths.current.right / totalOther));
        }
      }
      
    } else if (isResizing === 'middle') {
      // Resizing between Avatar List (center) and File List
      const desiredCenter = resizeStartWidths.current.center + deltaPercent;
      const desiredFileList = resizeStartWidths.current.fileList - deltaPercent;
      
      // Clamp both to their constraints
      const newCenter = Math.max(constraints.center.minPercent, Math.min(constraints.center.maxPercent, desiredCenter));
      const newFileList = Math.max(constraints.fileList.minPercent, Math.min(constraints.fileList.maxPercent, desiredFileList));
      
      // Calculate actual change
      const centerChange = newCenter - resizeStartWidths.current.center;
      const fileListChange = newFileList - resizeStartWidths.current.fileList;
      
      // Use the smaller change to keep panels in sync
      const actualChange = Math.abs(centerChange) < Math.abs(fileListChange) ? centerChange : -fileListChange;
      
      // Apply to adjacent panels
      const finalCenter = resizeStartWidths.current.center + actualChange;
      const finalFileList = resizeStartWidths.current.fileList - actualChange;
      
      setCenterWidth(finalCenter);
      setFileListWidth(finalFileList);
      
      // Distribute remaining space to other panels proportionally
      // Note: The normalization effect will ensure total = 100% and handle any constraint violations
      const currentTotal = resizeStartWidths.current.left + finalCenter + finalFileList + resizeStartWidths.current.right;
      const remainingSpace = 100 - currentTotal;
      if (Math.abs(remainingSpace) > 0.01) {
        const totalOther = resizeStartWidths.current.left + resizeStartWidths.current.right;
        if (totalOther > 0) {
          setLeftWidth(resizeStartWidths.current.left + (remainingSpace * resizeStartWidths.current.left / totalOther));
          setRightWidth(resizeStartWidths.current.right + (remainingSpace * resizeStartWidths.current.right / totalOther));
        }
      }
      
    } else if (isResizing === 'right') {
      // Resizing between File List and Preview Panel (right)
      const desiredFileList = resizeStartWidths.current.fileList + deltaPercent;
      const desiredRight = resizeStartWidths.current.right - deltaPercent;
      
      // Clamp both to their constraints
      const newFileList = Math.max(constraints.fileList.minPercent, Math.min(constraints.fileList.maxPercent, desiredFileList));
      const newRight = Math.max(constraints.right.minPercent, Math.min(constraints.right.maxPercent, desiredRight));
      
      // Calculate actual change
      const fileListChange = newFileList - resizeStartWidths.current.fileList;
      const rightChange = newRight - resizeStartWidths.current.right;
      
      // Use the smaller change to keep panels in sync
      const actualChange = Math.abs(fileListChange) < Math.abs(rightChange) ? fileListChange : -rightChange;
      
      // Apply to adjacent panels
      const finalFileList = resizeStartWidths.current.fileList + actualChange;
      const finalRight = resizeStartWidths.current.right - actualChange;
      
      setFileListWidth(finalFileList);
      setRightWidth(finalRight);
      
      // Distribute remaining space to other panels proportionally
      // Note: The normalization effect will ensure total = 100% and handle any constraint violations
      const currentTotal = resizeStartWidths.current.left + resizeStartWidths.current.center + finalFileList + finalRight;
      const remainingSpace = 100 - currentTotal;
      if (Math.abs(remainingSpace) > 0.01) {
        const totalOther = resizeStartWidths.current.left + resizeStartWidths.current.center;
        if (totalOther > 0) {
          setLeftWidth(resizeStartWidths.current.left + (remainingSpace * resizeStartWidths.current.left / totalOther));
          setCenterWidth(resizeStartWidths.current.center + (remainingSpace * resizeStartWidths.current.center / totalOther));
        }
      }
    }
  }, [isResizing, getPanelConstraints]);

  // Handle resize end
  const handleResizeEnd = useCallback(() => {
    setIsResizing(null);
  }, []);

  // Set up resize listeners
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  // Load data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/avatars');
        const data = await response.json();
        
        if (data.avatars && data.projects) {
          setAvatars(data.avatars);
          setProjects(data.projects);
          
          // Group projects into collections
          const grouped = groupProjectsIntoCollections(data.projects);
          setGroupedCollections(grouped);
          
          // Only initialize avatar selection from URL once (prevents double initialization in React Strict Mode)
          if (data.avatars && data.avatars.length > 0 && !avatarInitializedRef.current) {
            avatarInitializedRef.current = true;
            
            // Check if there's an avatar in the URL
            const avatarSlug = searchParams.get('avatar');
            
            if (avatarSlug) {
              // Find and load avatar from URL
              const avatar = data.avatars.find((a: Avatar) => createSlug(a.name) === avatarSlug);
              if (avatar) {
                // Select the collection that contains this avatar so it's visible in the list
                const avatarCollection = grouped.find((c) => 
                  c.projects.some((p) => p.id === avatar.projectId)
                );
                if (avatarCollection) {
                  setSelectedCollectionIds(new Set([avatarCollection.id]));
                }
                
                setPreviewAvatar(avatar);
                // Auto-select the main model file when avatar is loaded from URL
                if (avatar.modelFileUrl) {
                  const files = getAllAvatarFiles(avatar);
                  const mainModel = files.find((f: FileTypeInfo) => f.id === 'vrm_main') || files.find((f: FileTypeInfo) => f.category === 'model');
                  setSelectedFile(mainModel || null);
                }
                console.log(`Loaded avatar from URL: ${avatar.name}`);
              }
            }
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(t('finder.errors.loadError'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [t]);

  // Handle URL parameter changes (browser back/forward navigation)
  useEffect(() => {
    // Skip if avatars haven't loaded yet or already initialized
    if (avatars.length === 0 || !avatarInitializedRef.current) return;
    
    const avatarSlug = searchParams.get('avatar');
    
    if (avatarSlug) {
      // Find and load avatar from URL
      const avatar = avatars.find((a: Avatar) => createSlug(a.name) === avatarSlug);
      if (avatar && avatar.id !== previewAvatar?.id) {
        // Select the collection that contains this avatar so it's visible in the list
        const avatarCollection = groupedCollections.find((c) => 
          c.projects.some((p) => p.id === avatar.projectId)
        );
        if (avatarCollection && !selectedCollectionIds.has(avatarCollection.id)) {
          setSelectedCollectionIds(new Set([avatarCollection.id]));
        }
        
        setPreviewAvatar(avatar);
        // Auto-select the main model file when avatar is loaded from URL
        if (avatar.modelFileUrl) {
          const files = getAllAvatarFiles(avatar);
          const mainModel = files.find((f: FileTypeInfo) => f.id === 'vrm_main') || files.find((f: FileTypeInfo) => f.category === 'model');
          setSelectedFile(mainModel || null);
        }
      }
    } else {
      // No avatar in URL, clear preview
      if (previewAvatar) {
        setPreviewAvatar(null);
        setSelectedFile(null);
      }
    }
  }, [searchParams, avatars, previewAvatar, groupedCollections, selectedCollectionIds]);

  // Group projects into collections (all projects are individual)
  const groupProjectsIntoCollections = (projects: Project[]): GroupedCollection[] => {
    // All projects are displayed as individual collections (no grouping)
    const result: GroupedCollection[] = projects.map((project) => ({
      id: project.id,
      name: project.name,
      projects: [project],
      isExpanded: false,
    }));

    // Sort alphabetically
    result.sort((a, b) => a.name.localeCompare(b.name));

    return result;
  };

  // Filter avatars based on selected collections and search
  const filteredAvatars = useMemo(() => {
    let filtered = avatars;
    const trimmedSearch = searchQuery.trim();

    // If searching
    if (trimmedSearch) {
      // Filter by search term first (search across all avatars or filtered by collection)
      const query = trimmedSearch.toLowerCase();
      filtered = filtered.filter((avatar) =>
        avatar.name.toLowerCase().includes(query) ||
        (avatar.description || '').toLowerCase().includes(query)
      );

      // If collections are selected, filter to only those collections
      if (selectedCollectionIds.size > 0) {
        const projectIds = new Set<string>();
        selectedCollectionIds.forEach((collectionId) => {
          const collection = groupedCollections.find((c) => c.id === collectionId);
          if (collection) {
            collection.projects.forEach((p) => projectIds.add(p.id));
          }
        });
        filtered = filtered.filter((avatar) => projectIds.has(avatar.projectId));
      }
      // If no collections selected, search returns ALL matching avatars
    } else {
      // No search query
      // Don't show any avatars unless at least one collection is selected
      if (selectedCollectionIds.size === 0) {
        return [];
      }

      // Filter by selected collections
      const projectIds = new Set<string>();
      selectedCollectionIds.forEach((collectionId) => {
        const collection = groupedCollections.find((c) => c.id === collectionId);
        if (collection) {
          collection.projects.forEach((p) => projectIds.add(p.id));
        }
      });
      filtered = filtered.filter((avatar) => projectIds.has(avatar.projectId));
    }

    // Filter by file type
    if (fileTypeFilters.hasVrm) {
      filtered = filtered.filter((avatar) => avatar.modelFileUrl || avatar.metadata?.alternateModels?.vrm);
    }
    if (fileTypeFilters.hasFbx) {
      filtered = filtered.filter((avatar) => avatar.metadata?.alternateModels?.fbx);
    }
    if (fileTypeFilters.hasVoxel) {
      filtered = filtered.filter((avatar) => 
        avatar.metadata?.alternateModels?.voxel_vrm || 
        avatar.metadata?.alternateModels?.voxel_fbx
      );
    }

    return filtered;
  }, [avatars, selectedCollectionIds, searchQuery, fileTypeFilters, groupedCollections]);

  // Handle collection selection
  const handleCollectionToggle = (collectionId: string) => {
    const newSelected = new Set(selectedCollectionIds);
    if (newSelected.has(collectionId)) {
      newSelected.delete(collectionId);
    } else {
      newSelected.add(collectionId);
    }
    setSelectedCollectionIds(newSelected);
    
    // Save to localStorage
    if (newSelected.size > 0) {
      localStorage.setItem('finder-last-collection', Array.from(newSelected)[0]);
    }
  };

  // Handle collection expand/collapse
  const handleCollectionExpand = (collectionId: string) => {
    setGroupedCollections((prev) =>
      prev.map((col) =>
        col.id === collectionId ? { ...col, isExpanded: !col.isExpanded } : col
      )
    );
  };

  // Handle avatar selection
  const handleAvatarToggle = (avatarId: string) => {
    const newSelected = new Set(selectedAvatarIds);
    if (newSelected.has(avatarId)) {
      newSelected.delete(avatarId);
      // Also clear file type selections for this avatar
      const newFileTypes = { ...selectedFileTypes };
      delete newFileTypes[avatarId];
      setSelectedFileTypes(newFileTypes);
    } else {
      newSelected.add(avatarId);
    }
    setSelectedAvatarIds(newSelected);
  };

  // Handle avatar selection with explicit state (for drag-to-select)
  const handleAvatarSet = (avatarIds: string[], selected: boolean) => {
    const newSelected = new Set(selectedAvatarIds);
    avatarIds.forEach(avatarId => {
      if (selected) {
        newSelected.add(avatarId);
      } else {
        newSelected.delete(avatarId);
        // Also clear file type selections for this avatar
        const newFileTypes = { ...selectedFileTypes };
        delete newFileTypes[avatarId];
        setSelectedFileTypes(newFileTypes);
      }
    });
    setSelectedAvatarIds(newSelected);
  };

  // Handle select all/deselect all
  const handleSelectAll = () => {
    const allIds = new Set(filteredAvatars.map((a) => a.id));
    setSelectedAvatarIds(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedAvatarIds(new Set());
    setSelectedFileTypes({});
  };

  // Handle file type selection for an avatar
  const handleFileTypeToggle = (avatarId: string, fileType: string) => {
    const newFileTypes = { ...selectedFileTypes };
    if (!newFileTypes[avatarId]) {
      newFileTypes[avatarId] = new Set();
    }
    const avatarFileTypes = new Set(newFileTypes[avatarId]);
    if (avatarFileTypes.has(fileType)) {
      avatarFileTypes.delete(fileType);
    } else {
      avatarFileTypes.add(fileType);
    }
    newFileTypes[avatarId] = avatarFileTypes;
    setSelectedFileTypes(newFileTypes);
  };

  // Handle avatar click for preview
  const handleAvatarClick = (avatar: Avatar) => {
    setPreviewAvatar(avatar);
    // Auto-select the main model file when avatar is selected
    if (avatar.modelFileUrl) {
      const files = getAllAvatarFiles(avatar);
      const mainModel = files.find((f: FileTypeInfo) => f.id === 'vrm_main') || files.find((f: FileTypeInfo) => f.category === 'model');
      setSelectedFile(mainModel || null);
    } else {
      setSelectedFile(null);
    }
    
    // Update URL with avatar slug (without page navigation)
    const slug = createSlug(avatar.name);
    const params = new URLSearchParams(searchParams.toString());
    params.set('avatar', slug);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Handle file selection
  const handleFileSelect = (file: FileTypeInfo | null) => {
    setSelectedFile(file);
  };

  // Show header even when loading, with loading state in content area
  if (isLoading) {
    return (
      <div className="h-screen bg-cream dark:bg-cream-dark flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-none">
          <AvatarHeader 
            title={t('finder.title')}
            description={t('finder.description')}
            socialLink="https://x.com/toxsam"
          />
        </div>
        
        {/* Loading content area */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <CrescentSpinner size="md" className="mx-auto mb-4" />
            <p className="text-white dark:text-white text-sm font-medium">
              {t('common.loading')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-cream dark:bg-cream-dark flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-none">
          <AvatarHeader 
            title={t('finder.title')}
            description={t('finder.description')}
            socialLink="https://x.com/toxsam"
          />
        </div>
        
        {/* Error content area */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Show full-screen overlay on mobile
  if (isMobile) {
    return (
      <div className="min-h-screen bg-cream dark:bg-cream-dark transition-colors">
        {/* Header - Higher z-index to stay on top */}
        <div className="relative z-50">
          <AvatarHeader 
            title={t('finder.title')}
            description={t('finder.description')}
            socialLink="https://x.com/toxsam"
            showWarningButton={true}
          />
        </div>

        {/* Desktop Only Notice - Lower z-index */}
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-cream/95 dark:bg-cream-dark/95 backdrop-blur-md">
          <div className="max-w-md p-8 text-center border border-gray-300 dark:border-gray-700 rounded-lg bg-cream dark:bg-gray-900 shadow-lg mx-4">
            <Computer className="w-16 h-16 mx-auto mb-6 text-gray-900 dark:text-gray-100" />
            <h2 className="text-title mb-4 text-gray-900 dark:text-gray-100">
              {t('finder.mobile.desktopOnly.title')}
            </h2>
            <p className="text-body text-gray-500 dark:text-gray-400">
              {t('finder.mobile.desktopOnly.description')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-cream dark:bg-cream-dark flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-none">
        <AvatarHeader 
          title={t('finder.title')}
          description={t('finder.description')}
          socialLink="https://x.com/toxsam"
        />
      </div>

      {/* Main Finder Layout */}
      <div 
        ref={containerRef}
        className="flex flex-1 overflow-hidden min-h-0 w-full"
        style={{ maxWidth: '100%' }}
      >
        {/* Left Sidebar - Projects Tree */}
        <div 
          className="border-r border-gray-300 dark:border-gray-700 bg-cream dark:bg-cream-dark flex-shrink-0 flex flex-col min-w-0"
          style={{ 
            width: `${leftWidth}%`, 
            minWidth: `${getPanelConstraints().left.min}px`, 
            maxWidth: `${getPanelConstraints().left.maxPercent}%` 
          }}
        >
          <CollectionTree
            collections={groupedCollections}
            selectedCollectionIds={selectedCollectionIds}
            onCollectionToggle={handleCollectionToggle}
            onCollectionExpand={handleCollectionExpand}
            avatars={avatars}
          />
        </div>

        {/* Resize Handle - Left */}
        <div
          className="w-1 bg-gray-300 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-100 cursor-col-resize transition-colors flex-shrink-0 relative group"
          onMouseDown={(e) => handleResizeStart('left', e)}
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
        </div>

        {/* Center - Avatar List */}
        <div 
          className="border-r border-gray-300 dark:border-gray-700 bg-cream dark:bg-cream-dark flex-shrink-0 flex flex-col min-w-0"
          style={{ 
            width: `${centerWidth}%`, 
            minWidth: `${getPanelConstraints().center.min}px`, 
            maxWidth: `${getPanelConstraints().center.maxPercent}%` 
          }}
        >
          <AvatarListView
            avatars={filteredAvatars}
            projects={projects}
            selectedAvatarIds={selectedAvatarIds}
            selectedFileTypes={selectedFileTypes}
            searchQuery={searchQuery}
            fileTypeFilters={fileTypeFilters}
            previewAvatarId={previewAvatar?.id}
            onSearchChange={setSearchQuery}
            onFileTypeFilterChange={setFileTypeFilters}
            onAvatarToggle={handleAvatarToggle}
            onAvatarSet={handleAvatarSet}
            onFileTypeToggle={handleFileTypeToggle}
            onAvatarClick={handleAvatarClick}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            onDownload={() => {
              setIsBatchDownloadManagerOpen(true);
            }}
          />
        </div>

        {/* Resize Handle - Middle (between avatar list and file list) */}
        <div
          className="w-1 bg-gray-300 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-100 cursor-col-resize transition-colors flex-shrink-0 relative group"
          onMouseDown={(e) => handleResizeStart('middle', e)}
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
        </div>

        {/* File List Column */}
        <div 
          className="border-r border-gray-300 dark:border-gray-700 bg-cream dark:bg-cream-dark flex-shrink-0 flex flex-col min-w-0"
          style={{ 
            width: `${fileListWidth}%`, 
            minWidth: `${getPanelConstraints().fileList.min}px`, 
            maxWidth: `${getPanelConstraints().fileList.maxPercent}%` 
          }}
        >
          <FileList
            avatar={previewAvatar}
            selectedFileId={selectedFile?.id || null}
            onFileSelect={handleFileSelect}
          />
        </div>

        {/* Resize Handle - Right */}
        <div
          className="w-1 bg-gray-300 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-100 cursor-col-resize transition-colors flex-shrink-0 relative group"
          onMouseDown={(e) => handleResizeStart('right', e)}
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
        </div>

        {/* Right Sidebar - Preview Panel */}
        <div 
          className="bg-cream dark:bg-cream-dark flex-shrink-0 flex-grow-0 flex flex-col min-w-0 overflow-hidden"
          style={{ 
            width: `${rightWidth}%`,
            minWidth: `${getPanelConstraints().right.min}px`,
            maxWidth: `${getPanelConstraints().right.maxPercent}%`,
            flexBasis: `${rightWidth}%`, // Explicit basis to prevent expansion
            boxSizing: 'border-box', // Ensure padding/borders are included in width
            flexShrink: 1 // Allow shrinking if needed
          }}
        >
          <PreviewPanel
            avatar={previewAvatar}
            selectedFile={selectedFile}
            projects={projects}
          />
        </div>
      </div>

      {/* Batch Download Manager Modal */}
      <BatchDownloadManager
        isOpen={isBatchDownloadManagerOpen}
        selectedAvatars={avatars.filter((a) => selectedAvatarIds.has(a.id))}
        selectedFileTypes={selectedFileTypes}
        downloadQueue={downloadQueue}
        onClose={() => setIsBatchDownloadManagerOpen(false)}
        onStartDownload={(options: DownloadOptions) => {
          const selectedAvatars = avatars.filter((a) => selectedAvatarIds.has(a.id));
          addToQueue(selectedAvatars, selectedFileTypes, options);
        }}
        onCancel={cancelItem}
        onRetry={retryItem}
        onClear={clearQueue}
      />


    </div>
  );
}
