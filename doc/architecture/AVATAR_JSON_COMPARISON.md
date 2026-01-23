# Avatar JSON Structure Comparison & Migration Guide

## Overview
This document compares the avatar JSON structure from the [open-source-avatars](https://github.com/ToxSam/open-source-avatars) repository with the current project's structure and outlines what modifications are needed to make them compatible.

## Structure Comparison

### Open-Source-Avatars Format (Source Repository)

```json
{
  "id": "fcd73da7-6c89-46fe-8467-3eb4873248fa",
  "name": "CoolTiger",
  "project_id": "4fd74d41-0828-417d-a005-de46c3bdf5b3",
  "description": "Avatar 283: CoolTiger",
  "model_file_url": "https://arweave.net/2EQ5wsstsJaFOG9LXq_gVFKKgM8bnfPa3axYJ-VS1ug",
  "format": "VRM",
  "is_public": true,
  "is_draft": false,
  "created_at": "2025-03-11T16:41:51.496Z",
  "updated_at": "2025-03-11T16:41:51.496Z",
  "metadata": {
    "number": "283",
    "series": "R3",
    "alternateModels": {},
    "ardriveFiles": {
      "models": ["283_CoolTiger.vrm"],
      "thumbnails": [
        "283_CoolTiger_Icon.png",
        "283_CoolTiger_FullBody.png"
      ],
      "textures": ["283_CoolTiger_MidShot.png"]
    }
  },
  "thumbnail_url": "https://arweave.net/ykIvWqlTvC66lekANOqTgr7bqujwgOqrlmSzzLHhkJw"
}
```

**VIPE Heroes Example:**
```json
{
  "id": "0x3999877754904d8542ad1845d368fa01a5e6e9a5/1",
  "name": "VIPE Hero #1",
  "project_id": "vipe-heroes-genesis",
  "description": "Genesis PFP collection...",
  "model_file_url": "https://dweb.link/ipfs/Qma1z2WUWv33JHb4gJTKChUWs3z9M2dnpiPWAHidmruu4z/default_1.vrm",
  "format": "VRM",
  "is_public": true,
  "is_draft": false,
  "created_at": "2023-06-01T16:16:15.492Z",
  "updated_at": "2026-01-17T09:18:53.143Z",
  "thumbnail_url": "https://dweb.link/ipfs/QmaZwAVGuf6zstdMBHt8zQRao6vS5huhjez1z6sRfxHfHL/VIPEHero_1_r1.png",
  "metadata": {
    "token_id": "1",
    "attributes": [
      { "value": "Kansai", "trait_type": "Top" },
      { "value": "Otemachi", "trait_type": "Bottom" }
    ],
    "alternateViews": {
      "icon": "https://dweb.link/ipfs/.../VIPEHero_1_r1.png",
      "midShot": "https://dweb.link/ipfs/.../VIPEHero_1_r2.png",
      "fullbody": "https://dweb.link/ipfs/.../VIPEHero_1_r3.png"
    },
    "external_url": "https://opensea.io/item/ethereum/..."
  }
}
```

### Current Project Format (Application Code)

**TypeScript Interface (camelCase):**
```typescript
interface Avatar {
  id: string;
  name: string;
  project: string;              // Project name (computed)
  projectId: string;            // Project ID
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
```

**GitHub Storage Format (snake_case in JSON):**
```json
{
  "id": "...",
  "name": "...",
  "project_id": "...",
  "description": "...",
  "thumbnail_url": "...",
  "model_file_url": "...",
  "polygon_count": 0,
  "format": "VRM",
  "material_count": 0,
  "is_public": true,
  "is_draft": false,
  "created_at": "...",
  "updated_at": "...",
  "metadata": {}
}
```

## Key Differences

### 1. Field Naming Convention
- **Open-Source-Avatars**: Uses `snake_case` directly in JSON
- **Current Project**: Converts between `camelCase` (application) ↔ `snake_case` (storage)
- **Status**: ✅ **Compatible** - Current project already handles this conversion

### 2. Metadata Structure

#### Open-Source-Avatars Metadata Patterns:
1. **Ardrive Files Structure** (100Avatars series):
   ```json
   {
     "number": "283",
     "series": "R3",
     "alternateModels": {},
     "ardriveFiles": {
       "models": ["283_CoolTiger.vrm"],
       "thumbnails": ["283_CoolTiger_Icon.png", "283_CoolTiger_FullBody.png"],
       "textures": ["283_CoolTiger_MidShot.png"]
     }
   }
   ```

2. **Alternate Views Structure** (VIPE Heroes):
   ```json
   {
     "alternateViews": {
       "icon": "...",
       "midShot": "...",
       "fullbody": "..."
     },
     "attributes": [...],
     "token_id": "1",
     "external_url": "..."
   }
   ```

#### Current Project Metadata:
- Currently supports `alternateModels` (already implemented)
- Does NOT have structured support for:
  - `ardriveFiles` structure
  - `alternateViews` structure
  - `attributes` array
  - `number`/`series` fields
  - `token_id`/`external_url` fields

### 3. Missing Fields in Current Project
- `polygon_count` - Currently stored but may not be populated from source
- `material_count` - Currently stored but may not be populated from source

## Required Modifications

### 1. Update Type Definitions

**File: `src/types/avatar.ts`**

Add more specific metadata types:

```typescript
// Add to existing interfaces
export interface AvatarMetadata {
  // Existing
  alternateModels?: Record<string, string>;
  
  // New from open-source-avatars
  number?: string;
  series?: string;
  token_id?: string;
  external_url?: string;
  
  // Ardrive files structure
  ardriveFiles?: {
    models?: string[];
    thumbnails?: string[];
    textures?: string[];
  };
  
  // Alternate views structure
  alternateViews?: {
    icon?: string;
    midShot?: string;
    fullbody?: string;
  };
  
  // Attributes array (for NFT-style avatars)
  attributes?: Array<{
    trait_type: string;
    value: string | number;
    display_type?: string;
  }>;
  
  // Allow other metadata
  [key: string]: any;
}
```

### 2. Update GitHub Storage Conversion

**File: `src/lib/github-storage.ts`**

The conversion functions already handle snake_case ↔ camelCase, but we should ensure metadata is preserved as-is:

```typescript
// Current implementation already preserves metadata as-is
// No changes needed - metadata is already passed through unchanged
```

### 3. Enhance Avatar Viewer to Support Alternate Views

**File: `src/components/avatar/AvatarViewer.tsx`**

Add support for displaying alternate views from metadata:

```typescript
// Add helper function to get thumbnail from alternateViews
const getThumbnailFromMetadata = (avatar: Avatar): string | null => {
  if (avatar.metadata?.alternateViews?.icon) {
    return avatar.metadata.alternateViews.icon;
  }
  if (avatar.metadata?.alternateViews?.midShot) {
    return avatar.metadata.alternateViews.midShot;
  }
  return null;
};

// Use in component to show different views
```

### 4. Update Gallery to Use Alternate Views

**File: `src/components/avatar/AvatarGallery.tsx`**

Enhance thumbnail display to use alternate views when available:

```typescript
// Helper to get best thumbnail
const getBestThumbnail = (avatar: Avatar): string | null => {
  // Prefer alternateViews.icon if available
  if (avatar.metadata?.alternateViews?.icon) {
    return avatar.metadata.alternateViews.icon;
  }
  // Fall back to standard thumbnail
  return avatar.thumbnailUrl;
};
```

### 5. Add Support for Attributes Display

**File: `src/components/VRMViewer/AvatarDetails.tsx`**

Add attributes display for NFT-style avatars:

```typescript
// Add attributes section if available
{metadata.attributes && metadata.attributes.length > 0 && (
  <div className="mb-4">
    <h3 className="font-semibold text-gray-900 mb-2">Attributes</h3>
    <div className="grid grid-cols-2 gap-2">
      {metadata.attributes.map((attr, idx) => (
        <div key={idx} className="text-sm">
          <span className="text-gray-600">{attr.trait_type}:</span>
          <span className="text-gray-900 ml-2">{attr.value}</span>
        </div>
      ))}
    </div>
  </div>
)}
```

### 6. Import Script for Open-Source-Avatars JSON

Create a migration/import script to convert open-source-avatars JSON format to your current format:

**File: `scripts/import-open-source-avatars.ts`**

```typescript
import { getAvatars, saveAvatars, getProjects } from '@/lib/github-storage';
import { GithubAvatar } from '@/types/github-storage';

interface OpenSourceAvatar {
  id: string;
  name: string;
  project_id: string;
  description: string;
  model_file_url: string;
  format: string;
  is_public: boolean;
  is_draft: boolean;
  created_at: string;
  updated_at: string;
  metadata: {
    number?: string;
    series?: string;
    alternateModels?: Record<string, string>;
    ardriveFiles?: {
      models?: string[];
      thumbnails?: string[];
      textures?: string[];
    };
    alternateViews?: {
      icon?: string;
      midShot?: string;
      fullbody?: string;
    };
    attributes?: Array<{
      trait_type: string;
      value: string | number;
      display_type?: string;
    }>;
    token_id?: string;
      external_url?: string;
    [key: string]: any;
  };
  thumbnail_url: string;
}

async function importOpenSourceAvatars(sourceAvatars: OpenSourceAvatar[]) {
  const existingAvatars = await getAvatars();
  const existingIds = new Set(existingAvatars.map(a => a.id));
  
  const newAvatars: GithubAvatar[] = [];
  
  for (const sourceAvatar of sourceAvatars) {
    // Skip if already exists
    if (existingIds.has(sourceAvatar.id)) {
      console.log(`Skipping existing avatar: ${sourceAvatar.name}`);
      continue;
    }
    
    // Convert to current format
    const avatar: GithubAvatar = {
      id: sourceAvatar.id,
      name: sourceAvatar.name,
      projectId: sourceAvatar.project_id,
      description: sourceAvatar.description || '',
      thumbnailUrl: sourceAvatar.thumbnail_url || '',
      modelFileUrl: sourceAvatar.model_file_url || '',
      polygonCount: 0, // Will need to be populated separately
      format: sourceAvatar.format || 'VRM',
      materialCount: 0, // Will need to be populated separately
      isPublic: sourceAvatar.is_public,
      isDraft: sourceAvatar.is_draft,
      metadata: sourceAvatar.metadata || {},
      createdAt: sourceAvatar.created_at,
      updatedAt: sourceAvatar.updated_at
    };
    
    newAvatars.push(avatar);
  }
  
  // Merge with existing
  const allAvatars = [...existingAvatars, ...newAvatars];
  await saveAvatars(allAvatars);
  
  console.log(`Imported ${newAvatars.length} new avatars`);
}

// Usage:
// const sourceData = await fetch('https://raw.githubusercontent.com/ToxSam/open-source-avatars/main/data/avatars/100avatars-r1.json').then(r => r.json());
// await importOpenSourceAvatars(sourceData);
```

## Compatibility Assessment

### ✅ Already Compatible
1. **Field naming** - Conversion layer already handles snake_case ↔ camelCase
2. **Basic structure** - Core fields match (id, name, description, URLs, etc.)
3. **Metadata storage** - Metadata is stored as Record<string, any>, so it can hold any structure
4. **Alternate models** - Already supported via `metadata.alternateModels`

### ⚠️ Needs Enhancement
1. **Alternate views** - Not currently displayed/used, but data structure supports it
2. **Attributes** - Not currently displayed, but can be stored
3. **Ardrive files** - Not currently used, but can be stored in metadata
4. **External URLs** - Not currently linked, but can be stored

### 🔧 Required Changes
1. **Type definitions** - Add optional fields for new metadata structures
2. **UI components** - Add display for alternate views and attributes
3. **Import script** - Create script to import from open-source-avatars format
4. **Thumbnail selection** - Enhance to prefer alternateViews.icon when available

## Migration Strategy

### Option 1: Direct Import (Recommended)
1. Fetch JSON files from open-source-avatars repository
2. Run import script to convert and merge
3. Enhance UI to display new metadata fields
4. Test and verify

### Option 2: Sync Script
1. Create a sync script that periodically fetches from open-source-avatars
2. Compares and updates existing avatars
3. Adds new avatars
4. Can be run as a scheduled job

### Option 3: Use as Source of Truth
1. Point your gallery directly to open-source-avatars JSON files
2. Transform on-the-fly in API routes
3. No local storage needed
4. Always in sync with source

## Testing Checklist

- [ ] Import script successfully converts open-source-avatars format
- [ ] Alternate views display correctly in gallery
- [ ] Attributes show for NFT-style avatars
- [ ] Thumbnail selection prefers alternateViews.icon
- [ ] Existing avatars still work correctly
- [ ] Download functionality works with new metadata
- [ ] Search and filtering still work
- [ ] Project grouping still works

## Next Steps

1. **Immediate**: Update type definitions to include new metadata structures
2. **Short-term**: Create import script and test with sample data
3. **Medium-term**: Enhance UI to display alternate views and attributes
4. **Long-term**: Consider using open-source-avatars as direct source or implement sync

## Notes

- The open-source-avatars format is more structured and feature-rich
- Your current format is more flexible (Record<string, any> for metadata)
- Both formats can coexist - your format can store everything from open-source-avatars
- The main work is enhancing the UI to display the additional metadata structures
- Consider backward compatibility - existing avatars should continue to work
