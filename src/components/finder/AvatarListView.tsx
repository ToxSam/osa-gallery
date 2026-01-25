'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Download } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Avatar, Project } from '@/types/avatar';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { getAvailableFileTypes } from './utils/fileTypes';
import { isIPFSUrl } from '@/lib/download-utils';

interface AvatarListViewProps {
  avatars: Avatar[];
  projects: Project[];
  selectedAvatarIds: Set<string>;
  selectedFileTypes: Record<string, Set<string>>;
  searchQuery: string;
  fileTypeFilters: {
    hasVrm: boolean;
    hasFbx: boolean;
    hasVoxel: boolean;
  };
  previewAvatarId?: string | null;
  onSearchChange: (query: string) => void;
  onFileTypeFilterChange: (filters: { hasVrm: boolean; hasFbx: boolean; hasVoxel: boolean }) => void;
  onAvatarToggle: (avatarId: string) => void;
  onAvatarSet: (avatarIds: string[], selected: boolean) => void;
  onFileTypeToggle: (avatarId: string, fileType: string) => void;
  onAvatarClick: (avatar: Avatar) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDownload: () => void;
}

const ITEMS_PER_PAGE = 20; // Number of avatars to load per batch

export default function AvatarListView({
  avatars,
  projects,
  selectedAvatarIds,
  selectedFileTypes,
  searchQuery,
  fileTypeFilters,
  previewAvatarId,
  onSearchChange,
  onFileTypeFilterChange,
  onAvatarClick,
  onAvatarToggle,
  onAvatarSet,
  onFileTypeToggle,
  onSelectAll,
  onDeselectAll,
  onDownload,
}: AvatarListViewProps) {
  const { t } = useI18n();
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const observerTargetRef = useRef<HTMLDivElement>(null);
  
  // Column widths state (in pixels)
  const [columnWidths, setColumnWidths] = useState({
    checkbox: 40,
    thumbnail: 64,
    name: 200,
    license: 70,
    project: 100,
    files: 90,
    storage: 80,
  });
  
  // Column resize state
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const resizeStartX = useRef<number>(0);
  const resizeStartWidths = useRef<typeof columnWidths | null>(null);
  
  // Drag-to-select state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartId, setDragStartId] = useState<string | null>(null);
  const [dragStartState, setDragStartState] = useState<boolean>(false);
  const [draggedIds, setDraggedIds] = useState<Set<string>>(new Set());
  const tableBodyRef = useRef<HTMLTableSectionElement>(null);
  const initialDragStatesRef = useRef<Map<string, boolean>>(new Map());
  
  // Track mouse position to distinguish click from drag
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const DRAG_THRESHOLD = 5; // pixels of movement before considering it a drag
  const isHandlingClickRef = useRef(false); // Track if we're handling the click manually
  const shouldIgnoreChangeRef = useRef(false); // Track if we should ignore the next onCheckedChange
  
  // Horizontal scroll drag state
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollStartX = useRef<number>(0);
  const scrollStartScrollLeft = useRef<number>(0);
  const rowPanStartPos = useRef<{ x: number; y: number } | null>(null);
  const isRowPanningRef = useRef(false);
  const PAN_THRESHOLD = 10; // pixels of horizontal movement before considering it a pan

  // Load column widths from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('finder-column-widths');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setColumnWidths((prev) => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Failed to load column widths:', e);
      }
    }
  }, []);

  // Save column widths to localStorage
  useEffect(() => {
    localStorage.setItem('finder-column-widths', JSON.stringify(columnWidths));
  }, [columnWidths]);

  // Reset displayed count when avatars change (filter/search)
  useEffect(() => {
    setDisplayedCount(ITEMS_PER_PAGE);
  }, [avatars.length, searchQuery, fileTypeFilters]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayedCount < avatars.length) {
          setDisplayedCount((prev) => Math.min(prev + ITEMS_PER_PAGE, avatars.length));
        }
      },
      {
        root: scrollContainerRef.current,
        rootMargin: '100px', // Start loading before reaching the bottom
        threshold: 0.1,
      }
    );

    const target = observerTargetRef.current;
    if (target) {
      observer.observe(target);
    }

    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [displayedCount, avatars.length]);

  // Get displayed avatars (only show up to displayedCount)
  const displayedAvatars = avatars.slice(0, displayedCount);
  const hasMore = displayedCount < avatars.length;

  // Check selection state based on all filtered avatars, not just displayed
  const allSelected = avatars.length > 0 && avatars.every((a) => selectedAvatarIds.has(a.id));
  const someSelected = avatars.some((a) => selectedAvatarIds.has(a.id));

  // Calculate how many selected avatars are not in the current filtered list
  const visibleAvatarIds = new Set(avatars.map(a => a.id));
  const hiddenSelectedCount = Array.from(selectedAvatarIds).filter(id => !visibleAvatarIds.has(id)).length;

  // Get project name by ID
  const getProjectName = (projectId: string): string => {
    const project = projects.find((p) => p.id === projectId);
    return project?.name || projectId;
  };

  // Get project license by ID
  const getProjectLicense = (projectId: string): string => {
    const project = projects.find((p) => p.id === projectId);
    return project?.license || 'CC0';
  };

  // Get available file types for an avatar (deduplicated)
  const getFileTypeBadges = (avatar: Avatar) => {
    const fileTypes = getAvailableFileTypes(avatar);
    const modelFileTypes = fileTypes.filter((ft) => ft.category === 'model');
    // Extract unique labels (case-insensitive)
    const uniqueLabels = new Set<string>();
    const labels: string[] = [];
    
    modelFileTypes.forEach((ft) => {
      const label = ft.label;
      const labelLower = label.toLowerCase();
      if (!uniqueLabels.has(labelLower)) {
        uniqueLabels.add(labelLower);
        labels.push(label);
      }
    });
    
    return labels;
  };

  // Get storage type for an avatar (Arweave or IPFS)
  const getStorageType = (avatar: Avatar): 'Arweave' | 'IPFS' | 'Mixed' | 'Unknown' => {
    const urls: string[] = [];
    if (avatar.modelFileUrl) urls.push(avatar.modelFileUrl);
    if (avatar.thumbnailUrl) urls.push(avatar.thumbnailUrl);
    if (avatar.metadata?.alternateModels) {
      Object.values(avatar.metadata.alternateModels).forEach(url => {
        if (url && typeof url === 'string') urls.push(url);
      });
    }
    
    if (urls.length === 0) return 'Unknown';
    
    const hasIPFS = urls.some(url => isIPFSUrl(url));
    const hasArweave = urls.some(url => {
      if (!url || typeof url !== 'string') return false;
      return url.includes('arweave.net') || 
             url.includes('arweave.io') ||
             url.startsWith('ar://') ||
             /^[a-zA-Z0-9_-]{43}$/.test(url.trim()); // Arweave transaction ID pattern (43 chars, alphanumeric + _ -)
    });
    
    if (hasIPFS && hasArweave) return 'Mixed';
    if (hasIPFS) return 'IPFS';
    if (hasArweave) return 'Arweave';
    return 'Unknown';
  };

  // Handle drag start on checkbox
  const handleCheckboxMouseDown = useCallback((e: React.MouseEvent, avatarId: string) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent checkbox from toggling - we'll control it manually
    
    const isSelected = selectedAvatarIds.has(avatarId);
    
    // Store mouse position to detect if this becomes a drag
    mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
    
    // Mark that we're handling this click manually
    isHandlingClickRef.current = true;
    
    // Set flag to prevent onCheckedChange from firing
    shouldIgnoreChangeRef.current = true;
    
    // Initialize drag state (but don't activate dragging yet)
    setDragStartId(avatarId);
    setDragStartState(!isSelected); // Target state: opposite of current
    setDraggedIds(new Set([avatarId]));
    initialDragStatesRef.current = new Map([[avatarId, isSelected]]);
    
    // Don't set isDragging yet - wait to see if mouse moves
  }, [selectedAvatarIds]);

  // Handle mouse move during drag
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragStartId || !tableBodyRef.current) return;

    // Check if we should start dragging (mouse moved beyond threshold)
    if (!isDragging && mouseDownPosRef.current) {
      const dx = Math.abs(e.clientX - mouseDownPosRef.current.x);
      const dy = Math.abs(e.clientY - mouseDownPosRef.current.y);
      
      if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
        // Start dragging - keep the ignore flag set for drag operations
        setIsDragging(true);
        e.preventDefault();
      } else {
        // Not enough movement yet, don't process as drag
        return;
      }
    }

    if (!isDragging) return;

    const target = e.target as HTMLElement;
    const row = target.closest('tr');
    if (!row) return;

    const avatarId = row.getAttribute('data-avatar-id');
    if (!avatarId) return;

    const currentIndex = displayedAvatars.findIndex(a => a.id === dragStartId);
    const targetIndex = displayedAvatars.findIndex(a => a.id === avatarId);
    
    if (currentIndex === -1 || targetIndex === -1) return;

    // Get all avatar IDs between start and current position
    const start = Math.min(currentIndex, targetIndex);
    const end = Math.max(currentIndex, targetIndex);
    const idsInRange = displayedAvatars.slice(start, end + 1).map(a => a.id);
    
    // Store initial states for all items in range (if not already stored)
    idsInRange.forEach(id => {
      if (!initialDragStatesRef.current.has(id)) {
        initialDragStatesRef.current.set(id, selectedAvatarIds.has(id));
      }
    });
    
    setDraggedIds(new Set(idsInRange));
  }, [isDragging, dragStartId, displayedAvatars, selectedAvatarIds]);

  // Handle click on checkbox (for regular clicks)
  const handleCheckboxClick = useCallback((e: React.MouseEvent, avatarId: string) => {
    // Only handle if we're managing this click and it wasn't a drag
    if (isHandlingClickRef.current && dragStartId === avatarId && !isDragging) {
      e.preventDefault();
      e.stopPropagation();
      
      // Toggle the avatar state - this will update selectedAvatarIds
      // The checkbox will update visually because it's controlled by the checked prop
      onAvatarToggle(avatarId);
      
      // Clean up immediately
      setIsDragging(false);
      setDragStartId(null);
      setDraggedIds(new Set());
      initialDragStatesRef.current.clear();
      mouseDownPosRef.current = null;
      isHandlingClickRef.current = false;
      shouldIgnoreChangeRef.current = false;
    }
  }, [isDragging, dragStartId, onAvatarToggle]);

  // Handle mouse up to end drag
  const handleMouseUp = useCallback((e?: MouseEvent) => {
    // Handle scroll drag separately
    if (isScrolling && !dragStartId) {
      setIsScrolling(false);
      return;
    }

    if (!dragStartId) {
      mouseDownPosRef.current = null;
      isHandlingClickRef.current = false;
      return;
    }

    const currentDragStartId = dragStartId; // Capture for timeout

    // If we were dragging, apply the selection state
    if (isDragging) {
      const finalDraggedIds = Array.from(draggedIds);
      const targetState = dragStartState;
      
      // Use set operation to set all items to the target state at once
      onAvatarSet(finalDraggedIds, targetState);
      
      // Clean up immediately after drag
      setIsDragging(false);
      setDragStartId(null);
      setDraggedIds(new Set());
      initialDragStatesRef.current.clear();
      mouseDownPosRef.current = null;
      isHandlingClickRef.current = false;
      shouldIgnoreChangeRef.current = false;
    } else {
      // If we weren't dragging, it was just a click
      // The click handler should have handled it, but if not, handle it here as fallback
      // Use a small timeout to ensure click event has a chance to fire first
      const timeoutId = setTimeout(() => {
        if (dragStartId === currentDragStartId && !isDragging && isHandlingClickRef.current) {
          onAvatarToggle(currentDragStartId);
          
          // Clean up
          setIsDragging(false);
          setDragStartId(null);
          setDraggedIds(new Set());
          initialDragStatesRef.current.clear();
          mouseDownPosRef.current = null;
          isHandlingClickRef.current = false;
          shouldIgnoreChangeRef.current = false;
        }
      }, 10);
      
      // Store timeout ID so we can clear it if click handler fires
      return () => clearTimeout(timeoutId);
    }

    setIsScrolling(false);
  }, [isDragging, isScrolling, dragStartId, draggedIds, dragStartState, onAvatarSet, onAvatarToggle]);

  // Handle row mouse down (for panning detection)
  const handleRowMouseDown = useCallback((e: React.MouseEvent<HTMLTableRowElement>, avatar: Avatar) => {
    // Don't interfere with checkbox interactions or column resizing
    const target = e.target as HTMLElement;
    if (target.closest('input[type="checkbox"]') || 
        target.closest('[data-checkbox-container]') ||
        target.closest('[style*="cursor-col-resize"]') ||
        resizingColumn) {
      return;
    }
    
    // Store initial mouse position
    rowPanStartPos.current = { x: e.clientX, y: e.clientY };
    isRowPanningRef.current = false;
  }, [resizingColumn]);

  // Handle row mouse move (detect if it's a pan)
  const handleRowMouseMove = useCallback((e: MouseEvent) => {
    if (!rowPanStartPos.current || !scrollContainerRef.current) return;
    
    const dx = Math.abs(e.clientX - rowPanStartPos.current.x);
    const dy = Math.abs(e.clientY - rowPanStartPos.current.y);
    
    // If horizontal movement is significant and greater than vertical, start panning
    if (dx > PAN_THRESHOLD && dx > dy) {
      if (!isRowPanningRef.current) {
        isRowPanningRef.current = true;
        setIsScrolling(true);
        scrollStartX.current = rowPanStartPos.current.x;
        scrollStartScrollLeft.current = scrollContainerRef.current.scrollLeft;
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
      }
      
      // Pan the scroll container
      const deltaX = scrollStartX.current - e.clientX;
      scrollContainerRef.current.scrollLeft = scrollStartScrollLeft.current + deltaX;
    }
  }, []);

  // Handle row mouse up
  const handleRowMouseUp = useCallback((e: MouseEvent | React.MouseEvent, avatar?: Avatar) => {
    if (!rowPanStartPos.current) return;
    
    const wasPanning = isRowPanningRef.current;
    const dx = rowPanStartPos.current ? Math.abs((e as MouseEvent).clientX - rowPanStartPos.current.x) : 0;
    const dy = rowPanStartPos.current ? Math.abs((e as MouseEvent).clientY - rowPanStartPos.current.y) : 0;
    
    // Clean up panning state
    isRowPanningRef.current = false;
    rowPanStartPos.current = null;
    
    if (wasPanning) {
      setIsScrolling(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      // Prevent click event if we were panning
      e.preventDefault();
      e.stopPropagation();
    } else if (dx < PAN_THRESHOLD && dy < PAN_THRESHOLD && avatar) {
      // It was a click, not a pan - trigger avatar click
      // Use a small timeout to ensure this happens after any other handlers
      setTimeout(() => {
        onAvatarClick(avatar);
      }, 0);
    }
  }, [onAvatarClick]);

  // Handle horizontal scroll drag (for empty areas)
  const handleScrollMouseDown = useCallback((e: React.MouseEvent) => {
    // Only start scroll drag if not clicking on checkbox, checkbox container, or table row
    const target = e.target as HTMLElement;
    if (target.closest('input[type="checkbox"]') || 
        target.closest('[data-checkbox-container]') ||
        target.closest('tr')) {
      return;
    }
    
    setIsScrolling(true);
    scrollStartX.current = e.clientX;
    if (scrollContainerRef.current) {
      scrollStartScrollLeft.current = scrollContainerRef.current.scrollLeft;
    }
  }, []);

  const handleScrollMouseMove = useCallback((e: MouseEvent) => {
    if (!isScrolling || !scrollContainerRef.current) return;
    
    const deltaX = scrollStartX.current - e.clientX;
    scrollContainerRef.current.scrollLeft = scrollStartScrollLeft.current + deltaX;
  }, [isScrolling]);

  // Set up drag listeners (activate when dragStartId is set, even if not dragging yet)
  useEffect(() => {
    if (dragStartId) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      if (isDragging) {
        document.body.style.userSelect = 'none';
      }
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
      };
    }
  }, [dragStartId, isDragging, handleMouseMove, handleMouseUp]);

  // Set up scroll drag listeners
  useEffect(() => {
    if (isScrolling && !rowPanStartPos.current) {
      // Only set up listeners for non-row scrolling (empty area scrolling)
      document.addEventListener('mousemove', handleScrollMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleScrollMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isScrolling, handleScrollMouseMove, handleMouseUp]);

  // Set up row panning listeners (always active, but only processes when rowPanStartPos is set)
  useEffect(() => {
    document.addEventListener('mousemove', handleRowMouseMove);
    document.addEventListener('mouseup', handleRowMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleRowMouseMove);
      document.removeEventListener('mouseup', handleRowMouseUp);
    };
  }, [handleRowMouseMove, handleRowMouseUp]);

  // Handle column resize start
  const handleColumnResizeStart = useCallback((columnKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColumn(columnKey);
    resizeStartX.current = e.clientX;
    resizeStartWidths.current = { ...columnWidths };
  }, [columnWidths]);

  // Handle column resize move (Excel/Sheets style - only resize left column)
  const handleColumnResizeMove = useCallback((e: MouseEvent) => {
    if (!resizingColumn || !resizeStartWidths.current) return;
    
    const deltaX = e.clientX - resizeStartX.current;
    const newWidths = { ...resizeStartWidths.current };
    
    // Determine which column to resize based on resizingColumn
    // resizingColumn will be like "name-license" meaning resize the left column (name)
    const [leftCol] = resizingColumn.split('-');
    
    if (leftCol && newWidths[leftCol as keyof typeof newWidths]) {
      const minWidth = 60; // Minimum column width
      const leftWidth = newWidths[leftCol as keyof typeof newWidths] as number;
      
      // Only resize the left column (Excel/Sheets behavior)
      const newLeftWidth = Math.max(minWidth, leftWidth + deltaX);
      newWidths[leftCol as keyof typeof newWidths] = newLeftWidth as any;
      
      setColumnWidths(newWidths);
    }
  }, [resizingColumn]);

  // Handle column resize end
  const handleColumnResizeEnd = useCallback(() => {
    setResizingColumn(null);
    resizeStartX.current = 0;
    resizeStartWidths.current = null;
  }, []);

  // Set up column resize listeners
  useEffect(() => {
    if (resizingColumn) {
      document.addEventListener('mousemove', handleColumnResizeMove);
      document.addEventListener('mouseup', handleColumnResizeEnd);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleColumnResizeMove);
        document.removeEventListener('mouseup', handleColumnResizeEnd);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [resizingColumn, handleColumnResizeMove, handleColumnResizeEnd]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header with Search */}
      <div className="flex-none px-4 py-3 border-b border-gray-300 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder={t('finder.avatarList.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          {selectedAvatarIds.size > 0 && (
            <span
              onClick={onDeselectAll}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 cursor-pointer transition-colors px-2 py-1 whitespace-nowrap"
            >
              Deselect all
            </span>
          )}
          <button
            onClick={onDownload}
            disabled={selectedAvatarIds.size === 0}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors flex-shrink-0 ${
              selectedAvatarIds.size === 0
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                : 'bg-gray-700 dark:bg-gray-600 text-white hover:bg-gray-800 dark:hover:bg-gray-500'
            }`}
          >
            <Download className="h-4 w-4" />
            Download{selectedAvatarIds.size > 0 && ` (${selectedAvatarIds.size})`}
          </button>
        </div>
      </div>

      {/* Avatar List */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-auto"
        onMouseDown={handleScrollMouseDown}
        style={{ cursor: isScrolling ? 'grabbing' : 'default' }}
      >
        {avatars.length === 0 && hiddenSelectedCount === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">
              {t('finder.avatarList.noResults')}
            </p>
          </div>
        ) : (
          <>
            <div className="min-w-full inline-block">
              <table className="w-full min-w-[800px]">
                <thead className="sticky top-0 bg-cream dark:bg-cream-dark border-b border-gray-300 dark:border-gray-700 z-30">
                  <tr>
                    <th 
                      className="sticky left-0 top-0 z-40 px-2 py-2 text-left bg-cream dark:bg-cream-dark border-r border-gray-200 dark:border-gray-700"
                      style={{ width: `${columnWidths.checkbox}px`, minWidth: `${columnWidths.checkbox}px` }}
                    >
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={allSelected ? onDeselectAll : onSelectAll}
                      />
                    </th>
                    <th 
                      className="px-2 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase relative border-r border-gray-200 dark:border-gray-700"
                      style={{ width: `${columnWidths.thumbnail}px`, minWidth: `${columnWidths.thumbnail}px` }}
                    >
                      Thumbnail
                      <div
                        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors group z-10"
                        onMouseDown={(e) => handleColumnResizeStart('thumbnail-name', e)}
                        style={{ right: '-2px', width: '4px' }}
                      />
                    </th>
                    <th 
                      className="px-2 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase relative border-r border-gray-200 dark:border-gray-700"
                      style={{ width: `${columnWidths.name}px`, minWidth: `${columnWidths.name}px` }}
                    >
                      {t('finder.avatarList.columns.name')}
                      <div
                        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors group z-10"
                        onMouseDown={(e) => handleColumnResizeStart('name-license', e)}
                        style={{ right: '-2px', width: '4px' }}
                      />
                    </th>
                    <th 
                      className="px-2 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase relative border-r border-gray-200 dark:border-gray-700"
                      style={{ width: `${columnWidths.license}px`, minWidth: `${columnWidths.license}px` }}
                    >
                      {t('finder.avatarList.columns.license')}
                      <div
                        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors group z-10"
                        onMouseDown={(e) => handleColumnResizeStart('license-project', e)}
                        style={{ right: '-2px', width: '4px' }}
                      />
                    </th>
                    <th 
                      className="px-2 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase relative border-r border-gray-200 dark:border-gray-700"
                      style={{ width: `${columnWidths.project}px`, minWidth: `${columnWidths.project}px` }}
                    >
                      {t('finder.avatarList.columns.collection')}
                      <div
                        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors group z-10"
                        onMouseDown={(e) => handleColumnResizeStart('project-files', e)}
                        style={{ right: '-2px', width: '4px' }}
                      />
                    </th>
                    <th 
                      className="px-2 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase relative border-r border-gray-200 dark:border-gray-700"
                      style={{ width: `${columnWidths.files}px`, minWidth: `${columnWidths.files}px` }}
                    >
                      {t('finder.avatarList.columns.files')}
                      <div
                        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors group z-10"
                        onMouseDown={(e) => handleColumnResizeStart('files-storage', e)}
                        style={{ right: '-2px', width: '4px' }}
                      />
                    </th>
                    <th 
                      className="px-2 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase"
                      style={{ width: `${columnWidths.storage}px`, minWidth: `${columnWidths.storage}px` }}
                    >
                      Storage
                    </th>
                  </tr>
                </thead>
                <tbody ref={tableBodyRef}>
                  {/* Friendly reminder banner for hidden selected avatars - first row in tbody */}
                  {hiddenSelectedCount > 0 && (
                    <tr>
                      <td 
                        colSpan={7}
                        className="sticky bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 px-4 py-2 z-30"
                        style={{ top: '41px' }}
                      >
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t('finder.avatarList.hiddenSelectedWarning')
                            .replace('{count}', hiddenSelectedCount.toString())
                            .replace('{items}', hiddenSelectedCount === 1 ? 'item' : 'items')}
                        </p>
                      </td>
                    </tr>
                  )}
                  {displayedAvatars.map((avatar) => {
                  const isSelected = selectedAvatarIds.has(avatar.id);
                  const isPreviewed = previewAvatarId === avatar.id;
                  const formatLabels = getFileTypeBadges(avatar);
                  const avatarFileTypes = selectedFileTypes[avatar.id] || new Set();
                  const isInDragRange = isDragging && draggedIds.has(avatar.id);
                  // For visual state: show drag preview during drag, otherwise show actual selection state
                  const willBeSelected = isInDragRange ? dragStartState : isSelected;

                  const rowBgClass = isPreviewed 
                    ? 'bg-green-50 dark:bg-green-900/30' 
                    : willBeSelected 
                    ? 'bg-gray-100 dark:bg-gray-800' 
                    : '';
                  const dragBgClass = isInDragRange ? 'bg-gray-100 dark:bg-gray-800/50' : '';

                  return (
                    <tr
                      key={avatar.id}
                      data-avatar-id={avatar.id}
                      className={`border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors relative cursor-pointer ${
                        isPreviewed 
                          ? 'bg-green-50 dark:bg-green-900/30 border-l-4 border-l-green-500 dark:border-l-green-400' 
                          : willBeSelected 
                          ? 'bg-gray-100 dark:bg-gray-800 border-l-2 border-l-gray-900 dark:border-l-gray-100' 
                          : ''
                      } ${isInDragRange ? 'bg-gray-100 dark:bg-gray-800/50' : ''}`}
                      onMouseDown={(e) => handleRowMouseDown(e, avatar)}
                      onMouseUp={(e) => handleRowMouseUp(e, avatar)}
                    >
                      <td 
                        className={`sticky left-0 z-0 px-2 py-2 ${rowBgClass || dragBgClass || 'bg-cream dark:bg-cream-dark'}`} 
                        onClick={(e) => e.stopPropagation()}
                        style={{ width: `${columnWidths.checkbox}px`, minWidth: `${columnWidths.checkbox}px` }}
                      >
                        <div
                          data-checkbox-container
                          onMouseDown={(e) => handleCheckboxMouseDown(e, avatar.id)}
                          onClick={(e) => handleCheckboxClick(e, avatar.id)}
                          className="select-none"
                        >
                          <Checkbox
                            key={`checkbox-${avatar.id}-${isSelected}`}
                            checked={willBeSelected}
                            onCheckedChange={(checked) => {
                              // Ignore if we're handling it manually via click handler
                              if (shouldIgnoreChangeRef.current) {
                                // The checkbox visually updated, but we'll handle the state in click handler
                                return;
                              }
                              
                              // Only handle if we're not manually handling the click
                              // (i.e., this is a direct click on the checkbox, not through our mousedown handler)
                              if (!isHandlingClickRef.current && !isDragging && !dragStartId) {
                                onAvatarToggle(avatar.id);
                              }
                            }}
                          />
                        </div>
                      </td>
                    <td className="px-2 py-2" style={{ width: `${columnWidths.thumbnail}px`, minWidth: `${columnWidths.thumbnail}px` }}>
                      {avatar.thumbnailUrl ? (
                        <div className="w-12 h-12 rounded overflow-hidden bg-gray-100 dark:bg-gray-800">
                          <img
                            src={avatar.thumbnailUrl}
                            alt={avatar.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                          <span className="text-xs text-gray-400">{t('finder.common.noImage')}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-2" style={{ width: `${columnWidths.name}px`, minWidth: `${columnWidths.name}px` }}>
                      <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                        {avatar.name}
                      </div>
                    </td>
                    <td className="px-2 py-2" style={{ width: `${columnWidths.license}px`, minWidth: `${columnWidths.license}px` }}>
                      <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                        {getProjectLicense(avatar.projectId)}
                      </Badge>
                    </td>
                    <td className="px-2 py-2" style={{ width: `${columnWidths.project}px`, minWidth: `${columnWidths.project}px` }}>
                      <span className="text-xs text-gray-600 dark:text-gray-400 truncate block">
                        {getProjectName(avatar.projectId)}
                      </span>
                    </td>
                    <td className="px-2 py-2" style={{ width: `${columnWidths.files}px`, minWidth: `${columnWidths.files}px` }}>
                      <div className="flex flex-wrap gap-x-1.5 gap-y-0.5 items-center">
                        {formatLabels.length > 0 ? (
                          formatLabels.map((label, index) => (
                            <span
                              key={`${avatar.id}-${label}-${index}`}
                              className="text-[10px] text-gray-600 dark:text-gray-400 font-medium"
                            >
                              {label}
                              {index < formatLabels.length - 1 && (
                                <span className="text-gray-400 dark:text-gray-600 mx-0.5">•</span>
                              )}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">---</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-2" style={{ width: `${columnWidths.storage}px`, minWidth: `${columnWidths.storage}px` }}>
                      <Badge 
                        variant="outline" 
                        className={`text-xs px-1.5 py-0.5 ${
                          getStorageType(avatar) === 'IPFS' 
                            ? 'border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300' 
                            : getStorageType(avatar) === 'Arweave'
                            ? 'border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300'
                            : ''
                        }`}
                      >
                        {getStorageType(avatar)}
                      </Badge>
                    </td>
                  </tr>
                );
                })}
                </tbody>
              </table>
            </div>
            
            {/* Infinite scroll trigger */}
            {hasMore && (
              <div 
                ref={observerTargetRef}
                className="flex items-center justify-center py-8"
              >
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
              </div>
            )}
            
            {/* Show total count when all loaded */}
            {!hasMore && avatars.length > 0 && (
              <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                Showing all {avatars.length} {avatars.length === 1 ? 'avatar' : 'avatars'}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
