/**
 * GitHub Storage Utility
 * 
 * This module provides functions to interact with GitHub as a database
 * for storing application data in JSON files.
 * 
 * FIELD NAMING CONVENTION:
 * - Application code uses camelCase (TypeScript standard)
 * - Storage/JSON uses snake_case (JSON convention)
 * - Conversion happens in this module (the API layer)
 */

// Load environment variables from .env and .env.local files
require('dotenv').config();
require('dotenv').config({ path: '.env.local' });

// Type definitions using camelCase (for application code)
export type GithubUser = {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: string;
  createdAt: string;
  updatedAt: string;
};

// Type definitions for projects
export type GithubProject = {
  id: string;
  name: string;
  creatorId: string;
  description?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  // New field from open-source-avatars structure
  avatar_data_file?: string; // Path to avatar file in avatars/ folder (e.g., "100avatars-r1.json")
};

// Type definitions for avatars
export type GithubAvatar = {
  id: string;
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
  createdAt: string;
  updatedAt: string;
};

export type GithubAvatarTag = {
  avatarId: string;
  tagId: string;
};

export type GithubDownload = {
  id: string;
  avatarId: string;
  userId?: string;
  downloadedAt: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
};

export type GithubTag = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

// Configuration
const GITHUB_OWNER = process.env.GITHUB_REPO_OWNER || 'ToxSam';
const GITHUB_REPO = process.env.GITHUB_REPO_NAME || 'open-source-avatars';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Personal access token with repo scope
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

// File paths in the repository
const DATA_PATHS = {
  users: 'data/users.json',
  projects: 'data/projects.json',
  avatars: 'data/avatars.json',
  tags: 'data/tags.json',
  downloads: 'data/downloads.json',
  avatarTags: 'data/avatar-tags.json',
};

// GitHub API endpoints
const API_BASE = 'https://api.github.com';
const RAW_CONTENT_BASE = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}`;

/**
 * Fetches data from a JSON file in the GitHub repository
 * @param path Path to the JSON file in the repository
 * @returns The parsed JSON data
 */
async function fetchData(path: string) {
  try {
    const url = `${RAW_CONTENT_BASE}/${path}?timestamp=${Date.now()}`;
    console.log(`Fetching from: ${url}`);
    const response = await fetch(url, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`  ✗ File not found (404): ${path}`);
        // File doesn't exist yet, return empty array or object
        return (path.includes('users') || path.includes('projects') || 
               path.includes('avatars') || path.includes('tags') || 
               path.includes('downloads')) ? [] : {};
      }
      console.error(`  ✗ HTTP Error ${response.status}: ${response.statusText} for ${path}`);
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`  ✓ Successfully fetched ${path} (response size: ${JSON.stringify(data).length} chars)`);
    return data;
  } catch (error) {
    console.error(`  ✗ Error fetching data from GitHub: ${path}`, error);
    throw error;
  }
}

/**
 * Updates a JSON file in the GitHub repository
 * @param path Path to the JSON file in the repository
 * @param data The data to write to the file
 * @param commitMessage Commit message for the update
 * @returns Success status
 */
async function updateData(
  path: string, 
  data: any, 
  commitMessage: string = `Update ${path}`
) {
  if (!GITHUB_TOKEN) {
    throw new Error('GitHub token is not configured. Set GITHUB_TOKEN environment variable.');
  }

  try {
    // First, get the current file (if it exists) to get its SHA
    let fileSha: string | undefined;
    
    try {
      const fileResponse = await fetch(
        `${API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
        {
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );
      
      if (fileResponse.ok) {
        const fileData = await fileResponse.json();
        fileSha = fileData.sha;
      }
    } catch (error) {
      // File might not exist yet, which is fine
      console.log(`File does not exist yet: ${path}`);
    }
    
    // Prepare the update content
    const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
    
    // Create or update the file
    const updateResponse = await fetch(
      `${API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: commitMessage,
          content,
          sha: fileSha,
          branch: GITHUB_BRANCH,
        }),
      }
    );
    
    if (!updateResponse.ok) {
      const error = await updateResponse.json();
      throw new Error(`GitHub API error: ${JSON.stringify(error)}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error updating data in GitHub: ${path}`, error);
    throw error;
  }
}

/**
 * Generic function to save any data to a specified path
 * @param path The path to save the data to
 * @param data The data to save
 * @param commitMessage Optional commit message
 * @returns Success status
 */
async function saveData(
  path: string,
  data: any,
  commitMessage: string = `Update ${path}`
) {
  return updateData(path, data, commitMessage);
}

// Utility functions for specific data types

// Users
async function getUsers() {
  const rawUsers = await fetchData(DATA_PATHS.users);
  
  // Convert snake_case to camelCase for compatibility and sanitize sensitive fields
  return rawUsers.map((user: any) => ({
    id: user.id,
    username: user.username,
    email: '[email protected]', // Always return a sanitized email
    passwordHash: '', // Return empty string instead of undefined
    role: user.role,
    createdAt: user.created_at,
    updatedAt: user.updated_at
  }));
}

async function saveUsers(users: any[]) {
  // Convert camelCase to snake_case and sanitize sensitive fields
  const snakeCaseUsers = users.map((user: any) => ({
    id: user.id,
    username: user.username,
    email: '[email protected]', // Always sanitize email when saving
    role: user.role,
    created_at: user.createdAt,
    updated_at: user.updatedAt
  }));
  return updateData(DATA_PATHS.users, snakeCaseUsers, 'Update users data');
}

// Projects
async function getProjects() {
  const rawProjects = await fetchData(DATA_PATHS.projects);
  
  // Convert snake_case to camelCase for compatibility
  return rawProjects.map((project: any) => ({
    id: project.id,
    name: project.name,
    creatorId: project.creator_id,
    description: project.description,
    isPublic: project.is_public,
    license: project.license || 'CC0', // Default to CC0 if not specified
    createdAt: project.created_at,
    updatedAt: project.updated_at,
    // Support new avatar_data_file field from open-source-avatars structure
    avatar_data_file: project.avatar_data_file || project.avatarDataFile
  }));
}

async function saveProjects(projects: any[]) {
  // Convert camelCase to snake_case
  const snakeCaseProjects = projects.map(project => ({
    id: project.id,
    name: project.name,
    creator_id: project.creatorId,
    description: project.description,
    is_public: project.isPublic,
    created_at: project.createdAt,
    updated_at: project.updatedAt,
    // Preserve avatar_data_file field if it exists
    avatar_data_file: project.avatar_data_file || project.avatarDataFile
  }));
  return updateData(DATA_PATHS.projects, snakeCaseProjects, 'Update projects data');
}

// Avatars
async function getAvatars(projectIds?: string[]) {
  let allAvatars: any[] = [];
  
  try {
    // First, try the new multi-file structure from open-source-avatars
    // Fetch projects to see which avatar files to load
    const projects = await fetchData(DATA_PATHS.projects);
    
    if (Array.isArray(projects) && projects.length > 0) {
      // Check if any project has avatar_data_file field (new structure)
      const hasAvatarDataFiles = projects.some((p: any) => p.avatar_data_file || p.avatarDataFile);
      
      if (hasAvatarDataFiles) {
        console.log('Using new multi-file avatar structure from projects.json');
        
        // Fetch avatars from each project's avatar file
        const avatarPromises = projects
          .filter((project: any) => {
            const avatarFile = project.avatar_data_file || project.avatarDataFile;
            // Only filter if is_public is explicitly false, otherwise include it
            const isPublic = project.is_public !== false; // Default to true if not specified
            const hasAvatarFile = !!avatarFile;
            
            // Filter by project IDs if provided
            if (projectIds && projectIds.length > 0) {
              if (!projectIds.includes(project.id)) {
                return false; // Skip projects not in the filter list
              }
            }
            
            if (!hasAvatarFile) {
              console.log(`Skipping project ${project.name || project.id}: no avatar_data_file`);
            }
            if (!isPublic) {
              console.log(`Skipping project ${project.name || project.id}: not public`);
            }
            
            return hasAvatarFile && isPublic;
          })
          .map(async (project: any) => {
            const avatarFile = project.avatar_data_file || project.avatarDataFile;
            const projectId = project.id;
            
            try {
              // Normalize the avatar file path
              // Handle cases where avatar_data_file might be:
              // - Just filename: "100avatars-r1.json"
              // - With avatars/ prefix: "avatars/100avatars-r1.json"
              // - Full path: "data/avatars/100avatars-r1.json"
              let avatarPath: string;
              if (avatarFile.startsWith('data/avatars/')) {
                // Already has full path
                avatarPath = avatarFile;
              } else if (avatarFile.startsWith('avatars/')) {
                // Has avatars/ prefix, add data/ prefix
                avatarPath = `data/${avatarFile}`;
              } else {
                // Just filename, add data/avatars/ prefix
                avatarPath = `data/avatars/${avatarFile}`;
              }
              
              console.log(`Fetching avatars from: ${avatarPath} for project: ${project.name || projectId}`);
              
              const projectAvatars = await fetchData(avatarPath);
              
              // Debug: log what we actually got
              console.log(`  Response type: ${typeof projectAvatars}, isArray: ${Array.isArray(projectAvatars)}`);
              if (!Array.isArray(projectAvatars)) {
                console.log(`  Response content (first 200 chars):`, JSON.stringify(projectAvatars).substring(0, 200));
              }
              
              if (Array.isArray(projectAvatars)) {
                console.log(`  ✓ Loaded ${projectAvatars.length} avatars from ${avatarFile}`);
                
                if (projectAvatars.length > 0) {
                  // Check project_id distribution in the file
                  const projectIdDistribution = projectAvatars.reduce((acc: Record<string, number>, avatar: any) => {
                    const pid = avatar.project_id || 'undefined';
                    acc[pid] = (acc[pid] || 0) + 1;
                    return acc;
                  }, {});
                  console.log(`  Project ID distribution in ${avatarFile}:`, projectIdDistribution);
                  
                  // Log first avatar as sample
                  console.log(`  Sample avatar (first one):`, {
                    id: projectAvatars[0].id,
                    name: projectAvatars[0].name,
                    project_id: projectAvatars[0].project_id
                  });
                } else {
                  console.warn(`  ⚠ File ${avatarFile} exists but is empty (0 avatars)`);
                }
                
                // Ensure all avatars have the correct project_id
                // Use the project_id from the file if it exists, otherwise use the project.id
                // This handles cases where avatar files have their own project_id values
                return projectAvatars.map((avatar: any) => ({
                  ...avatar,
                  // Keep the original project_id from the file, but ensure it's set
                  project_id: avatar.project_id || projectId
                }));
              } else {
                console.warn(`  ✗ Invalid data format from ${avatarFile}: expected array, got ${typeof projectAvatars}`);
              }
              return [];
            } catch (error) {
              console.error(`  ✗ Error fetching avatars for project ${project.name || projectId} (${avatarFile}):`, error);
              return [];
            }
          });
        
        // Wait for all avatar files to be fetched
        const avatarArrays = await Promise.all(avatarPromises);
        allAvatars = avatarArrays.flat();
        
        console.log(`✓ Loaded ${allAvatars.length} avatars from ${avatarPromises.length} project files`);
        if (allAvatars.length === 0) {
          console.warn('⚠ No avatars loaded! Check project files and avatar_data_file paths.');
        }
      }
    }
    
    // Fallback: If no avatars were loaded from project files, try the old single-file structure
    if (allAvatars.length === 0) {
      console.log('Falling back to single-file avatar structure (data/avatars.json)');
      const rawAvatars = await fetchData(DATA_PATHS.avatars);
      if (Array.isArray(rawAvatars)) {
        allAvatars = rawAvatars;
      }
    }
  } catch (error) {
    console.error('Error in getAvatars, trying fallback:', error);
    // Final fallback: try the old single-file structure
    try {
      const rawAvatars = await fetchData(DATA_PATHS.avatars);
      if (Array.isArray(rawAvatars)) {
        allAvatars = rawAvatars;
      }
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      return []; // Return empty array if everything fails
    }
  }
  
  // Convert snake_case to camelCase for compatibility
  const convertedAvatars = allAvatars.map((avatar: any) => ({
    id: avatar.id,
    name: avatar.name,
    projectId: avatar.project_id,
    description: avatar.description,
    thumbnailUrl: avatar.thumbnail_url,
    modelFileUrl: avatar.model_file_url,
    polygonCount: avatar.polygon_count,
    format: avatar.format,
    materialCount: avatar.material_count,
    // Default isPublic to true if not specified (for backward compatibility)
    isPublic: avatar.is_public !== false,
    isDraft: avatar.is_draft === true,
    createdAt: avatar.created_at,
    updatedAt: avatar.updated_at,
    metadata: avatar.metadata || {}
  }));
  
  console.log(`✓ Converted ${convertedAvatars.length} avatars to camelCase format`);
  return convertedAvatars;
}

async function saveAvatars(avatars: any[]) {
  // Convert camelCase to snake_case
  const snakeCaseAvatars = avatars.map(avatar => ({
    id: avatar.id,
    name: avatar.name,
    project_id: avatar.projectId,
    description: avatar.description,
    thumbnail_url: avatar.thumbnailUrl,
    model_file_url: avatar.modelFileUrl,
    polygon_count: avatar.polygonCount,
    format: avatar.format,
    material_count: avatar.materialCount,
    is_public: avatar.isPublic,
    is_draft: avatar.isDraft,
    created_at: avatar.createdAt,
    updated_at: avatar.updatedAt,
    metadata: avatar.metadata
  }));
  return updateData(DATA_PATHS.avatars, snakeCaseAvatars, 'Update avatars data');
}

// Tags
async function getTags() {
  const rawTags = await fetchData(DATA_PATHS.tags);
  
  // Convert snake_case to camelCase for compatibility
  return rawTags.map((tag: any) => ({
    id: tag.id,
    name: tag.name,
    createdAt: tag.created_at,
    updatedAt: tag.updated_at
  }));
}

async function saveTags(tags: any[]) {
  // Convert camelCase to snake_case
  const snakeCaseTags = tags.map(tag => ({
    id: tag.id,
    name: tag.name,
    created_at: tag.createdAt,
    updated_at: tag.updatedAt
  }));
  return updateData(DATA_PATHS.tags, snakeCaseTags, 'Update tags data');
}

// Downloads
async function getDownloads() {
  const rawDownloads = await fetchData(DATA_PATHS.downloads);
  
  // Convert snake_case to camelCase for compatibility
  return rawDownloads.map((download: any) => ({
    id: download.id,
    avatarId: download.avatar_id,
    userId: download.user_id,
    downloadedAt: download.downloaded_at,
    ipAddress: download.ip_address,
    userAgent: download.user_agent,
    createdAt: download.created_at,
    updatedAt: download.updated_at
  }));
}

async function saveDownloads(downloads: any[]) {
  // Convert camelCase to snake_case
  const snakeCaseDownloads = downloads.map(download => ({
    id: download.id,
    avatar_id: download.avatarId,
    user_id: download.userId,
    downloaded_at: download.downloadedAt,
    ip_address: download.ipAddress,
    user_agent: download.userAgent,
    created_at: download.createdAt,
    updated_at: download.updatedAt
  }));
  return updateData(DATA_PATHS.downloads, snakeCaseDownloads, 'Update downloads data');
}

// Avatar Tags
async function getAvatarTags() {
  const rawAvatarTags = await fetchData(DATA_PATHS.avatarTags);
  
  // Convert snake_case to camelCase for compatibility
  return rawAvatarTags.map((avatarTag: any) => ({
    avatarId: avatarTag.avatar_id,
    tagId: avatarTag.tag_id
  }));
}

async function saveAvatarTags(avatarTags: any[]) {
  // Convert camelCase to snake_case
  const snakeCaseAvatarTags = avatarTags.map(avatarTag => ({
    avatar_id: avatarTag.avatarId,
    tag_id: avatarTag.tagId
  }));
  return updateData(DATA_PATHS.avatarTags, snakeCaseAvatarTags, 'Update avatar tags data');
}

// Advanced query functions

/**
 * Finds an item by ID in an array of objects
 * @param items Array of items to search
 * @param id ID to find
 * @returns The found item or undefined
 */
function findById(items: any[], id: string) {
  return items.find((item: any) => item.id === id);
}

// Function to save download counts (privacy-friendly approach)
async function saveDownloadCounts(downloadCounts: any): Promise<void> {
  await saveData('download-counts.json', downloadCounts);
  console.log('Download counts saved successfully');
}

async function getDownloadCounts(): Promise<any> {
  try {
    const data = await fetchData('download-counts.json');
    return data || { counts: {} };
  } catch (error) {
    console.error('Error fetching download counts:', error);
    return { counts: {} };
  }
}

// Explicitly export all functions at the end
export {
  fetchData,
  saveData,
  updateData,
  getUsers,
  saveUsers,
  getProjects,
  saveProjects,
  getAvatars,
  saveAvatars,
  getTags,
  saveTags,
  getDownloads,
  saveDownloads,
  getAvatarTags,
  saveAvatarTags,
  findById,
  saveDownloadCounts,
  getDownloadCounts
}; 