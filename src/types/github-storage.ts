/**
 * Type definitions for GitHub storage
 * These mirror our Prisma models but are adapted for JSON storage
 */

// Common properties for all entities
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// User model
export interface GithubUser extends BaseEntity {
  username: string;
  email: string;
  passwordHash: string; // Note: In a real app, consider OAuth instead
  role: string;
}

// Project model
export interface GithubProject extends BaseEntity {
  name: string;
  creatorId: string;
  description?: string;
  isPublic: boolean;
  license?: string; // License type (e.g., "CC0", "CC-BY")
  // New field from open-source-avatars structure
  avatar_data_file?: string; // Path to avatar file in avatars/ folder (e.g., "100avatars-r1.json")
}

// Avatar model
export interface GithubAvatar extends BaseEntity {
  name: string;
  projectId: string;
  description?: string;
  thumbnailUrl?: string;
  modelFileUrl?: string;
  polygonCount?: number;
  format: string;
  materialCount?: number;
  isPublic: boolean;
  isDraft: boolean;
  metadata: Record<string, any>;
  // Tags are handled through the AvatarTag relationship
}

// Tag model
export interface GithubTag extends BaseEntity {
  name: string;
}

// AvatarTag relationship
export interface GithubAvatarTag {
  avatarId: string;
  tagId: string;
}

// Download record (deprecated - use GithubDownloadCounts instead)
export interface GithubDownload extends BaseEntity {
  avatarId: string;
  userId?: string;
  downloadedAt: string;
  ipAddress?: string;
  userAgent?: string;
}

// Download counts (privacy-friendly alternative to GithubDownload)
export interface GithubDownloadCounts {
  _metadata: {
    description: string;
    created_at: string;
    note: string;
  };
  counts: Record<string, number>; // Map of avatarId -> download count
}

// Collection types for easy type-checking
export type GithubUsers = GithubUser[];
export type GithubProjects = GithubProject[];
export type GithubAvatars = GithubAvatar[];
export type GithubTags = GithubTag[];
export type GithubAvatarTags = GithubAvatarTag[];
export type GithubDownloads = GithubDownload[];

// Queries and filters

/**
 * Options for querying avatars
 */
export interface AvatarQueryOptions {
  searchTerm?: string;
  projectId?: string;
  creatorId?: string;
  isPublic?: boolean;
  isDraft?: boolean;
  tagIds?: string[];
}

/**
 * Options for pagination
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
}

/**
 * Options for sorting
 */
export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
} 