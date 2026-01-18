// src/types/avatar.ts
// Trigger redeployment


// Form and Upload related interfaces
export interface AvatarFormData {
  name: string;
  project: string;
  description: string;
  polygons: string;
  format: string;  // Added this field
  materials: string;
  isPublic: boolean;
  isDraft: boolean;
  modelFile: File | null;
  thumbnail: File | null;
  metadata?: Record<string, any>;  // Optional metadata field
}

export interface UploadProgress {
  thumbnail: number;
  model: number;
}
// Gallery related interfaces
export interface Avatar {
  id: string;
  name: string;
  project: string;
  projectId: string; // Added project ID for filtering
  description: string;
  createdAt: string;
  thumbnailUrl: string | null;
  modelFileUrl: string | null;
  polygonCount: number;
  format: string;
  materialCount: number;
  isPublic: boolean;
  isDraft: boolean;
  metadata: Record<string, any>;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  avatarCount?: number; // Will be computed from avatars
}

export interface ApiResponse {
  avatars: Avatar[];
  projects?: Project[]; // Added projects to API response
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface ViewerConfig {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  expression: string;
}

// Component Props interfaces
export interface AvatarCardProps {
  avatar: Avatar;
  isSelected: boolean;
  isActive: boolean;
  onSelect: (id: string) => void;
  onClick: (avatar: Avatar) => void;
}

export interface AvatarViewerProps {
  avatar: Avatar;
  config: ViewerConfig;
  onMetadataLoad?: (metadata: Record<string, any>) => void;
  onFormatSelect?: (format: string | null) => void;
  selectedFormat?: string | null;
  onDownload?: (id: string, format?: string | null) => void;
  metadata?: Record<string, any> | null;
  avatars?: Avatar[];
  onAvatarSelect?: (avatar: Avatar) => void;
  projects?: Project[]; // Added projects
  selectedProjectId?: string; // Added selected project ID
  onProjectSelect?: (projectId: string) => void; // Added project select handler
}

export interface AvatarHeaderProps {
  title: string;
  description: string;
  socialLink: string;
  showWarningButton?: boolean;
}