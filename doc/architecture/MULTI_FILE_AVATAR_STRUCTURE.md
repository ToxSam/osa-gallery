# Multi-File Avatar Structure Implementation

## Overview
Updated the system to support the new open-source-avatars repository structure that uses:
- `data/projects.json` - Contains project information with `avatar_data_file` field
- `data/avatars/` folder - Contains multiple JSON files (one per project) like:
  - `100avatars-r1.json`
  - `100avatars-r2.json`
  - `vipe-heroes.json`
  - etc.

## Changes Made

### 1. Updated Type Definitions

**File: `src/lib/github-storage.ts`**
- Added `avatar_data_file?: string` to `GithubProject` type

**File: `src/types/github-storage.ts`**
- Added `avatar_data_file?: string` to `GithubProject` interface

### 2. Updated `getProjects()` Function

**File: `src/lib/github-storage.ts`**
- Now extracts and preserves `avatar_data_file` field from projects.json
- Supports both `avatar_data_file` (snake_case) and `avatarDataFile` (camelCase) for flexibility

### 3. Completely Rewrote `getAvatars()` Function

**File: `src/lib/github-storage.ts`**

The new implementation:

1. **Fetches projects.json first** to determine which avatar files to load
2. **Checks for new structure**: Looks for projects with `avatar_data_file` field
3. **Multi-file loading**: 
   - For each project with an `avatar_data_file`, fetches avatars from `data/avatars/{avatar_file}`
   - Combines all avatars from all project files
   - Ensures each avatar has the correct `project_id`
4. **Fallback support**: 
   - If no projects have `avatar_data_file`, falls back to old single-file structure (`data/avatars.json`)
   - Handles errors gracefully with multiple fallback levels

### 4. Updated `saveProjects()` Function

**File: `src/lib/github-storage.ts`**
- Now preserves `avatar_data_file` field when saving projects

## How It Works

### New Structure Flow:
```
1. Fetch data/projects.json
2. For each project:
   - Check if it has avatar_data_file field
   - If yes, fetch data/avatars/{avatar_data_file}
   - Combine all avatars from all files
3. Convert snake_case to camelCase
4. Return combined avatar array
```

### Example projects.json structure:
```json
[
  {
    "id": "4fd74d41-0828-417d-a005-de46c3bdf5b3",
    "name": "100Avatars R1",
    "description": "First series of 100 avatars",
    "is_public": true,
    "avatar_data_file": "100avatars-r1.json"
  },
  {
    "id": "vipe-heroes-genesis",
    "name": "VIPE Heroes",
    "description": "Genesis PFP collection",
    "is_public": true,
    "avatar_data_file": "vipe-heroes.json"
  }
]
```

### Example avatar file structure (data/avatars/100avatars-r1.json):
```json
[
  {
    "id": "fcd73da7-6c89-46fe-8467-3eb4873248fa",
    "name": "CoolTiger",
    "project_id": "4fd74d41-0828-417d-a005-de46c3bdf5b3",
    "description": "Avatar 283: CoolTiger",
    "model_file_url": "https://arweave.net/...",
    "format": "VRM",
    "is_public": true,
    "is_draft": false,
    "created_at": "2025-03-11T16:41:51.496Z",
    "updated_at": "2025-03-11T16:41:51.496Z",
    "metadata": { ... },
    "thumbnail_url": "https://arweave.net/..."
  }
]
```

## Backward Compatibility

The implementation maintains full backward compatibility:

1. **Old structure still works**: If `projects.json` doesn't have `avatar_data_file` fields, it falls back to `data/avatars.json`
2. **Error handling**: Multiple fallback levels ensure the system doesn't break
3. **Gradual migration**: You can migrate projects one at a time

## Benefits

1. **Scalability**: Each project's avatars are in separate files, making it easier to manage large collections
2. **Organization**: Clear separation between different avatar projects
3. **Performance**: Can potentially cache individual project files separately
4. **Maintainability**: Easier to update individual projects without affecting others

## Testing Checklist

- [ ] Test with new multi-file structure (projects with `avatar_data_file`)
- [ ] Test fallback to old single-file structure
- [ ] Verify all avatars load correctly
- [ ] Check that project filtering still works
- [ ] Verify avatar search functionality
- [ ] Test avatar detail pages
- [ ] Check download functionality
- [ ] Verify gallery page displays correctly

## Environment Variables

No new environment variables needed. The system uses existing:
- `GITHUB_REPO_OWNER` (default: 'ToxSam')
- `GITHUB_REPO_NAME` (default: 'open-source-avatars')
- `GITHUB_BRANCH` (default: 'main')

## Next Steps

1. **Test the implementation** with the actual open-source-avatars repository
2. **Monitor logs** to see which structure is being used
3. **Consider caching** individual project avatar files for better performance
4. **Update documentation** if needed

## Notes

- The system automatically detects which structure to use
- All existing API endpoints continue to work without changes
- The frontend doesn't need any updates - it still receives the same avatar array format
